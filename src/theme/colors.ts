export const colors = {
  canvas: '#F5F1E8',
  surface: '#FCFAF6',
  surfaceMuted: '#EEE7DB',
  border: '#D7CEBE',
  text: '#1F2624',
  textMuted: '#5E665F',
  accent: '#C6923A',
  accentSoft: '#E9D2A7',
  sage: '#5F7758',
  sageSoft: '#DDE6D8',
  wood: '#9A7153',
  danger: '#9B4C3E',
  dangerSoft: '#EED2CB',
  info: '#58757B',
  infoSoft: '#D4E2E4',
  success: '#5D7A49',
  successSoft: '#DAE5D2',
  shadow: 'rgba(40, 31, 18, 0.08)',
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