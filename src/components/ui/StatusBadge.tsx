import { StyleSheet, Text, View } from 'react-native';

import { severityColors } from '@/theme/colors';
import { theme } from '@/theme';

type Tone = keyof typeof severityColors;

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <View style={[styles.badge, { backgroundColor: severityColors[tone].background }]}>
      <Text style={[styles.label, { color: severityColors[tone].text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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