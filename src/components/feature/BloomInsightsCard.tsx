import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BloomPrediction } from '@/lib/bloom';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

type Props = {
  predictions: BloomPrediction[];
  zoneLabel: string;
};

function formatStatusLabel(status: BloomPrediction['bloomStatus']) {
  switch (status) {
    case 'snart':
      return 'Snart';
    case 'nu':
      return 'Nu';
    case 'på väg över':
      return 'På väg över';
    default:
      return 'Nu';
  }
}

export function BloomInsightsCard({ predictions, zoneLabel }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const topPredictions = predictions.slice(0, 8);

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <Text style={theme.textStyles.overline}>Blomning</Text>
        <Text style={styles.title}>Växter bina troligen går på nu</Text>
        <Text style={styles.subtitle}>Baserat på historiska observationer i {zoneLabel} Sverige.</Text>
        <Text style={styles.disclaimer}>Detta är en sannolikhetsbedömning, inte en exakt botanisk sanning.</Text>
      </View>

      {topPredictions.length ? (
        <View style={styles.list}>
          {topPredictions.map((plant) => (
            <View key={`${plant.scientificName}-${plant.zone}`} style={styles.row}>
              <View style={styles.mainInfo}>
                <Text style={styles.name}>{plant.commonName}</Text>
                <Text style={styles.meta}>
                  Sannolikhet {Math.round(plant.bloomProbability * 100)}% · Relevans {Math.round(plant.relevanceScore * 100)}
                </Text>
              </View>
              <StatusBadge tone={plant.bloomStatus === 'nu' ? 'calm' : plant.bloomStatus === 'snart' ? 'info' : 'warning'} label={formatStatusLabel(plant.bloomStatus)} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyTitle}>Inga tydliga kandidater just nu</Text>
          <Text style={styles.emptyText}>Det är normalt mellan dragperioder. Nya kandidater visas när säsongsfönstret öppnar.</Text>
        </View>
      )}
    </AppCard>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.accentSoft,
      borderColor: theme.colors.borderStrong,
    },
    header: {
      gap: theme.spacing.xs,
    },
    title: {
      ...theme.textStyles.heading,
      color: theme.colors.text,
    },
    subtitle: {
      ...theme.textStyles.body,
      color: theme.colors.textMuted,
    },
    disclaimer: {
      ...theme.textStyles.caption,
      color: theme.colors.textMuted,
    },
    list: {
      gap: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      paddingBottom: theme.spacing.sm,
    },
    mainInfo: {
      gap: 4,
      flex: 1,
    },
    name: {
      ...theme.textStyles.label,
      color: theme.colors.text,
    },
    meta: {
      ...theme.textStyles.caption,
      color: theme.colors.textMuted,
    },
    emptyBlock: {
      gap: theme.spacing.xs,
      paddingTop: theme.spacing.xs,
    },
    emptyTitle: {
      ...theme.textStyles.label,
      color: theme.colors.text,
    },
    emptyText: {
      ...theme.textStyles.caption,
      color: theme.colors.textMuted,
    },
  });
}
