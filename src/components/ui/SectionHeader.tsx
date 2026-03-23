import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <View style={styles.wrapper}>
      {eyebrow ? <Text style={theme.textStyles.overline}>{eyebrow}</Text> : null}
      <Text style={theme.textStyles.title}>{title}</Text>
      {description ? <Text style={theme.textStyles.body}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xs,
  },
});