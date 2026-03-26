import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { createTheme, syncTheme, Theme, ThemeMode } from '@/theme';

const KUPKOLL_THEME_MODE_STORAGE_KEY = 'kupkoll:theme-mode';

type ThemeContextValue = {
  theme: Theme;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (nextMode: ThemeMode) => Promise<void>;
  toggleThemeMode: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const defaultThemeMode: ThemeMode = systemColorScheme === 'dark' ? 'dark' : 'light';
  const [themeMode, setThemeModeState] = useState<ThemeMode>(defaultThemeMode);
  const theme = useMemo(() => {
    const nextTheme = createTheme(themeMode);
    syncTheme(nextTheme);
    return nextTheme;
  }, [themeMode]);

  useEffect(() => {
    void (async () => {
      try {
        const storedThemeMode = await AsyncStorage.getItem(KUPKOLL_THEME_MODE_STORAGE_KEY);

        if (storedThemeMode === 'light' || storedThemeMode === 'dark') {
          setThemeModeState(storedThemeMode);
        }
      } catch {
      }
    })();
  }, []);

  async function setThemeMode(nextMode: ThemeMode) {
    setThemeModeState(nextMode);

    try {
      await AsyncStorage.setItem(KUPKOLL_THEME_MODE_STORAGE_KEY, nextMode);
    } catch {
    }
  }

  async function toggleThemeMode() {
    await setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
  }

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDarkMode: themeMode === 'dark',
      setThemeMode,
      toggleThemeMode,
    }),
    [theme, themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return context.theme;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider.');
  }

  return {
    themeMode: context.themeMode,
    isDarkMode: context.isDarkMode,
    setThemeMode: context.setThemeMode,
    toggleThemeMode: context.toggleThemeMode,
  };
}