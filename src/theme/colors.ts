export type ColorPalette = {
  canvas: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  sage: string;
  sageSoft: string;
  wood: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  success: string;
  successSoft: string;
  shadow: string;
  shadowStrong: string;
  overlay: string;
  overlaySoft: string;
  tutorialHighlight: string;
  tutorialHighlightBorder: string;
};

export const lightColors: ColorPalette = {
  canvas: '#F3F0E8',
  surface: '#FBFAF6',
  surfaceMuted: '#EFE9DE',
  surfaceRaised: '#FFFDF9',
  border: '#D9D2C4',
  borderStrong: '#C6BCAA',
  text: '#23302B',
  textMuted: '#69736D',
  accent: '#A47C47',
  accentSoft: '#E9DCC5',
  sage: '#6A7D6F',
  sageSoft: '#DCE5DC',
  wood: '#896B52',
  danger: '#8F5348',
  dangerSoft: '#ECD9D4',
  info: '#617A80',
  infoSoft: '#D9E3E5',
  success: '#647956',
  successSoft: '#DCE5D7',
  shadow: 'rgba(31, 39, 35, 0.08)',
  shadowStrong: 'rgba(31, 39, 35, 0.14)',
  overlay: 'rgba(35, 48, 43, 0.40)',
  overlaySoft: 'rgba(35, 48, 43, 0.34)',
  tutorialHighlight: 'rgba(251, 250, 246, 0.12)',
  tutorialHighlightBorder: 'rgba(233, 220, 197, 0.92)',
};

export const darkColors: ColorPalette = {
  canvas: '#161A18',
  surface: '#1D2421',
  surfaceMuted: '#252E2A',
  surfaceRaised: '#202824',
  border: '#39443E',
  borderStrong: '#4A564F',
  text: '#F3EFE4',
  textMuted: '#B3B9B2',
  accent: '#C89A5B',
  accentSoft: '#4A3923',
  sage: '#8FA68D',
  sageSoft: '#243229',
  wood: '#B28E70',
  danger: '#D38D81',
  dangerSoft: '#4E2D2B',
  info: '#9AB6BE',
  infoSoft: '#24363A',
  success: '#9BB287',
  successSoft: '#2B3828',
  shadow: 'rgba(0, 0, 0, 0.22)',
  shadowStrong: 'rgba(0, 0, 0, 0.36)',
  overlay: 'rgba(5, 8, 7, 0.58)',
  overlaySoft: 'rgba(5, 8, 7, 0.50)',
  tutorialHighlight: 'rgba(243, 239, 228, 0.08)',
  tutorialHighlightBorder: 'rgba(200, 154, 91, 0.72)',
};

export function getColors(mode: 'light' | 'dark'): ColorPalette {
  return mode === 'dark' ? darkColors : lightColors;
}

export function getSeverityColors(colors: ColorPalette) {
  return {
    info: {
      background: colors.infoSoft,
      text: colors.info,
    },
    warning: {
      background: colors.accentSoft,
      text: colors.accent,
    },
    critical: {
      background: colors.dangerSoft,
      text: colors.danger,
    },
    calm: {
      background: colors.sageSoft,
      text: colors.sage,
    },
  };
}

export const colors = lightColors;
export const severityColors = getSeverityColors(colors);