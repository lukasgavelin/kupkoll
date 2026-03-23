import { colors } from './colors';

export const fontFamilies = {
  regular: 'Manrope_400Regular',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
};

export const textStyles = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  heading: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
  },
  bodyStrong: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  overline: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.7,
    textTransform: 'uppercase' as const,
    color: colors.textMuted,
  },
};