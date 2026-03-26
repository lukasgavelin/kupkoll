import { colors, getColors, getSeverityColors } from './colors';
import { radii, spacing } from './spacing';
import { createTextStyles, fontFamilies, textStyles } from './typography';

export type ThemeMode = 'light' | 'dark';

function createShadows(themeColors: typeof colors) {
  return {
    card: {
      shadowColor: themeColors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 2,
    },
    floating: {
      shadowColor: themeColors.shadowStrong,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 6,
    },
  };
}

export function createTheme(mode: ThemeMode) {
  const palette = getColors(mode);

  return {
    mode,
    isDark: mode === 'dark',
    colors: palette,
    severityColors: getSeverityColors(palette),
    spacing,
    radii,
    shadows: createShadows(palette),
    textStyles: createTextStyles(palette),
    fontFamilies,
  };
}

export const shadows = createShadows(colors);

export const theme = createTheme('light');

export function syncTheme(nextTheme: Theme) {
  Object.assign(theme, nextTheme);
}

export type Theme = ReturnType<typeof createTheme>;