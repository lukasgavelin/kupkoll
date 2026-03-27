import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SeasonStatus } from '@/lib/selectors';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export function SeasonStatusCard({ status }: { status: SeasonStatus }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const primaryItems = status.focusItems.slice(0, 3);
  const secondaryItems = status.watchItems.slice(0, 2);

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <Text style={theme.textStyles.overline}>Säsongsläge</Text>
        <Text style={styles.regionLabel}>{status.locationLabel ? `${status.regionLabel} · ${status.locationLabel}` : status.regionLabel}</Text>
        <Text style={styles.title}>{status.season}</Text>
        <Text style={styles.metaText}>{status.monthLabel} · {status.phaseLabel}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge label={status.timingLabel} tone="calm" />
        </View>
        <Text style={styles.summary}>{status.summary}</Text>
      </View>

      <View style={styles.focusBlock}>
        <Text style={styles.focusTitle}>Gör nu</Text>
        <View style={styles.focusList}>
          {primaryItems.map((item) => (
            <View key={item} style={styles.focusRow}>
              <View style={styles.focusDot} />
              <Text style={styles.focusText}>{item}</Text>
            </View>
          ))}
        </View>
        {secondaryItems.length ? (
          <View style={styles.watchBlock}>
            <Text style={styles.watchLabel}>Tänk också på</Text>
            <View style={styles.watchList}>
              {secondaryItems.map((item) => (
                <Text key={item} style={styles.watchText}>• {item}</Text>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </AppCard>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
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
    metaText: {
      ...theme.textStyles.label,
      color: theme.colors.textMuted,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    summary: {
      ...theme.textStyles.body,
      color: theme.colors.textMuted,
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
    watchBlock: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    watchLabel: {
      ...theme.textStyles.caption,
      color: theme.colors.textMuted,
    },
    watchList: {
      gap: theme.spacing.xs,
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
    watchText: {
      ...theme.textStyles.caption,
      color: theme.colors.text,
    },
  });
}