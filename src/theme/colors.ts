export const colors = {
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
};

export const severityColors = {
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