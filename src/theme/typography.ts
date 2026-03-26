import { colors, type ColorPalette } from './colors';

export const fontFamilies = {
  display: 'Newsreader_600SemiBold',
  regular: 'Manrope_400Regular',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
};

export function createTextStyles(colors: ColorPalette) {
  return {
    display: {
      fontFamily: fontFamilies.display,
      fontSize: 40,
      lineHeight: 44,
      letterSpacing: -0.8,
      color: colors.text,
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 30,
      lineHeight: 34,
      letterSpacing: -0.4,
      color: colors.text,
    },
    heading: {
      fontFamily: fontFamilies.semibold,
      fontSize: 19,
      lineHeight: 26,
      color: colors.text,
    },
    body: {
      fontFamily: fontFamilies.regular,
      fontSize: 16,
      lineHeight: 25,
      color: colors.text,
    },
    bodyStrong: {
      fontFamily: fontFamilies.semibold,
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    caption: {
      fontFamily: fontFamilies.regular,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textMuted,
    },
    label: {
      fontFamily: fontFamilies.semibold,
      fontSize: 14,
      lineHeight: 18,
      color: colors.text,
    },
    overline: {
      fontFamily: fontFamilies.semibold,
      fontSize: 11,
      lineHeight: 15,
      letterSpacing: 1.1,
      textTransform: 'uppercase' as const,
      color: colors.textMuted,
    },
  };
}

export const textStyles = createTextStyles(colors);