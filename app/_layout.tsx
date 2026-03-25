import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from 'expo-router';
import { useFonts, Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';

import { BeehavenAppState, loadBeehavenState } from '@/lib/storage';
import { BeehavenProvider } from '@/store/BeehavenContext';
import { theme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Newsreader_600SemiBold,
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [initialData, setInitialData] = useState<BeehavenAppState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function prepareBeehavenData() {
      const data = await loadBeehavenState();

      if (!cancelled) {
        setInitialData(data);
      }
    }

    prepareBeehavenData();

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
      <BeehavenProvider initialData={initialData}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.canvas } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="apiaries/[id]" />
          <Stack.Screen name="hives/[id]" />
          <Stack.Screen name="inspections/new" options={{ presentation: 'modal' }} />
        </Stack>
      </BeehavenProvider>
    </SafeAreaProvider>
  );
}