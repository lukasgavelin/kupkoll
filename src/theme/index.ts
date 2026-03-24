import { colors } from './colors';
import { radii, spacing } from './spacing';
import { fontFamilies, textStyles } from './typography';

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 2,
  },
  floating: {
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
  },
};

export const theme = {
  colors,
  spacing,
  radii,
  shadows,
  textStyles,
  fontFamilies,
};

export type Theme = typeof theme;