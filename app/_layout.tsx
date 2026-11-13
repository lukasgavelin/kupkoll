import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SplashScreen } from 'expo-router';
import { useFonts, Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { initDbSync, loadAllDataSync } from '@/lib/db';
import { KupkollProvider } from '@/store/KupkollContext';
import { ThemeProvider, useTheme, useThemeMode } from '@/store/ThemeContext';
import { Theme } from '@/theme';

SplashScreen.preventAutoHideAsync();

function AppNavigator({ initialData }: { initialData: ReturnType<typeof loadAllDataSync> }) {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();

  return (
    <KupkollProvider initialData={initialData}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.canvas } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="apiaries/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="apiaries/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="apiaries/[id]" />
        <Stack.Screen name="hives/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="hives/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="hives/[id]/inspections" />
        <Stack.Screen name="hives/[id]" />
        <Stack.Screen name="inspections/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="privacy-policy" />
      </Stack>
    </KupkollProvider>
  );
}

function StartupErrorScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const styles = useMemo(() => createErrorStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <View style={styles.container}>
        <AppCard>
          <Text style={theme.textStyles.overline}>Startfel</Text>
          <Text style={theme.textStyles.heading}>Kunde inte öppna databasen</Text>
          <Text style={theme.textStyles.body}>
            Ett fel uppstod när Kupkoll skulle läsa in din sparade data. Försök igen eller starta om appen.
          </Text>
          {error.message ? <Text style={styles.errorDetail}>{error.message}</Text> : null}
          <PrimaryButton label="Försök igen" onPress={onRetry} />
        </AppCard>
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Newsreader_600SemiBold,
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [initialData, setInitialData] = useState<ReturnType<typeof loadAllDataSync> | null>(null);
  const [dbError, setDbError] = useState<Error | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function prepareKupkollData() {
      try {
        // Initialize DB before anything else
        initDbSync();
        const data = loadAllDataSync();

        if (!cancelled) {
          setDbError(null);
          setInitialData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setInitialData(null);
          setDbError(err instanceof Error ? err : new Error('Okänt databasfel vid start.'));
        }
      }
    }

    void prepareKupkollData();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  useEffect(() => {
    if ((loaded || error) && (initialData || dbError)) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, initialData, dbError]);

  if ((!loaded && !error) || (!initialData && !dbError)) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {dbError ? (
          <StartupErrorScreen
            error={dbError}
            onRetry={() => {
              setRetryKey((current) => current + 1);
            }}
          />
        ) : initialData ? (
          <AppNavigator initialData={initialData} />
        ) : null}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function createErrorStyles(theme: Theme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.canvas,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    errorDetail: {
      ...theme.textStyles.caption,
      color: theme.colors.textMuted,
    },
  });
}