import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

type Tone = keyof Theme['severityColors'];

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.badge, { backgroundColor: theme.severityColors[tone].background }]}>
      <Text style={[styles.label, { color: theme.severityColors[tone].text }]}>{label}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: theme.radii.pill,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    label: {
      ...theme.textStyles.caption,
      fontFamily: theme.fontFamilies.semibold,
      fontSize: 12,
      lineHeight: 16,
    },
  });
}