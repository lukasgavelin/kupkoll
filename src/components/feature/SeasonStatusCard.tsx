import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { SeasonStatus } from '@/lib/selectors';
import { theme } from '@/theme';

export function SeasonStatusCard({ status }: { status: SeasonStatus }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <Text style={theme.textStyles.overline}>Säsongsläge</Text>
        <Text style={styles.regionLabel}>{status.locationLabel ? `${status.regionLabel} · ${status.locationLabel}` : status.regionLabel}</Text>
        <Text style={styles.title}>{status.monthLabel} · {status.phaseLabel}</Text>
        <Text style={styles.summary}>{status.summary}</Text>
        <Text style={styles.timingText}>{status.timingLabel}</Text>
        {status.weatherSignalLabel ? <Text style={styles.weatherSignal}>{status.weatherSignalLabel}</Text> : null}
      </View>

      <View style={styles.focusBlock}>
        <Text style={styles.focusTitle}>Bra att fokusera på nu</Text>
        <View style={styles.focusList}>
          {status.focusItems.map((item) => (
            <View key={item} style={styles.focusRow}>
              <View style={styles.focusDot} />
              <Text style={styles.focusText}>{item}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sourceText}>{status.sourceLabel}</Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.sageSoft,
    borderColor: theme.colors.borderStrong,
  },
  header: {
    gap: theme.spacing.xs,
  },
  regionLabel: {
    ...theme.textStyles.label,
    color: theme.colors.textMuted,
  },
  title: {
    ...theme.textStyles.title,
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 34,
  },
  summary: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
    maxWidth: 680,
  },
  timingText: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
    maxWidth: 680,
  },
  weatherSignal: {
    ...theme.textStyles.caption,
    color: theme.colors.text,
    maxWidth: 680,
  },
  focusBlock: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  focusTitle: {
    ...theme.textStyles.label,
    color: theme.colors.text,
  },
  focusList: {
    gap: theme.spacing.sm,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  focusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.sage,
    marginTop: 7,
  },
  focusText: {
    ...theme.textStyles.bodyStrong,
    color: theme.colors.text,
    flex: 1,
  },
  sourceText: {
    ...theme.textStyles.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
});