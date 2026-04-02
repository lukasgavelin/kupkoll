import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from 'expo-router';
import { useFonts, Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';

import { KupkollAppState, loadKupkollState } from '@/lib/storage';
import { KupkollProvider } from '@/store/KupkollContext';
import { ThemeProvider, useTheme, useThemeMode } from '@/store/ThemeContext';

SplashScreen.preventAutoHideAsync();

function AppNavigator({ initialData }: { initialData: KupkollAppState }) {
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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Newsreader_600SemiBold,
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [initialData, setInitialData] = useState<KupkollAppState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function prepareKupkollData() {
      const data = await loadKupkollState();

      if (!cancelled) {
        setInitialData(data);
      }
    }

    prepareKupkollData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if ((loaded || error) && initialData) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, initialData]);

  if ((!loaded && !error) || !initialData) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator initialData={initialData} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}