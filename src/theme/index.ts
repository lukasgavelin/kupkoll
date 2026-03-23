import { colors } from './colors';
import { radii, spacing } from './spacing';
import { fontFamilies, textStyles } from './typography';

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 2,
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