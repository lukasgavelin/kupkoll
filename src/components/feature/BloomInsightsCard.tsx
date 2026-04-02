import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BloomPrediction } from '@/lib/bloom';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

type Props = {
  predictions: BloomPrediction[];
  zoneLabel: string;
  locationLabel?: string;
};

function formatStatusLabel(status: BloomPrediction['bloomStatus']) {
  switch (status) {
    case 'snart':
      return 'Snart i gång';
    case 'nu':
      return 'Sannolikt i blom nu';
    case 'på väg över':
      return 'På väg över';
    default:
      return 'Sannolikt i blom nu';
  }
}

function formatPriorityLevel(score: number) {
  if (score >= 12) {
    return 'mycket hög';
  }

  if (score >= 8) {
    return 'hög';
  }

  if (score >= 4) {
    return 'medel';
  }

  return 'låg';
}

function formatConfidenceLevel(score: number) {
  if (score >= 0.75) {
    return 'hög';
  }

  if (score >= 0.5) {
    return 'medel';
  }

  return 'låg';
}

function getWikipediaUrl(scientificName: string) {
  const pageName = scientificName.trim().replace(/\s+/g, '_');
  return `https://sv.wikipedia.org/wiki/${encodeURIComponent(pageName)}`;
}

export function BloomInsightsCard({ predictions, zoneLabel, locationLabel }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const topPredictions = predictions.slice(0, 8);
  const [showInfo, setShowInfo] = useState(false);

  async function openPlantWiki(scientificName: string) {
    const url = getWikipediaUrl(scientificName);
    await Linking.openURL(url);
  }

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={theme.textStyles.overline}>Blomning</Text>
          <Pressable
            accessibilityLabel={showInfo ? 'Dolj förklaring av prioritet och datastöd' : 'Visa förklaring av prioritet och datastöd'}
            accessibilityRole="button"
            onPress={() => setShowInfo((current) => !current)}
            style={styles.infoButton}
          >
            <Ionicons color={theme.colors.textMuted} name={showInfo ? 'information-circle' : 'information-circle-outline'} size={18} />
          </Pressable>
        </View>
        <Text style={styles.title}>Sannolika dragväxter just nu</Text>
        <Text style={styles.subtitle}>
          {locationLabel
            ? `Bedömningen bygger på historiska observationer nära ${locationLabel}, med zondata för ${zoneLabel} Sverige.`
            : `Bedömningen bygger på historiska observationer i ${zoneLabel} Sverige.`}
        </Text>
        <Text style={styles.disclaimer}>Resultatet visar sannolikheter, inte säkra fakta för varje enskild plats.</Text>
        {showInfo ? (
          <View style={styles.infoPanel}>
            <Text style={styles.infoText}>Prioritet visar hur intressant växten är just nu: sannolik blomning och värde för bina.</Text>
            <Text style={styles.infoText}>Datastöd visar hur mycket observationsdata som finns bakom uppskattningen.</Text>
            <Text style={styles.infoText}>Växtnamnen är klickbara och öppnar Wikipedia för mer information.</Text>
          </View>
        ) : null}
      </View>

      {topPredictions.length ? (
        <View style={styles.list}>
          {topPredictions.map((plant) => (
            <View key={`${plant.scientificName}-${plant.zone}`} style={styles.row}>
              <View style={styles.mainInfo}>
                <Pressable
                  accessibilityHint="Öppnar växtens Wikipediasida"
                  accessibilityLabel={`Öppna ${plant.commonName} på Wikipedia`}
                  accessibilityRole="link"
                  onPress={() => {
                    void openPlantWiki(plant.scientificName);
                  }}
                >
                  <Text style={styles.nameLink}>{plant.commonName}</Text>
                </Pressable>
                <Text style={styles.meta}>
                  Sannolikhet {Math.round(plant.bloomProbability * 100)}% · Prioritet {formatPriorityLevel(plant.priorityScore)} · Datastöd{' '}
                  {formatConfidenceLevel(plant.confidenceScore)}
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
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    infoButton: {
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      marginRight: -theme.spacing.xs,
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
    infoPanel: {
      gap: 2,
      padding: theme.spacing.sm,
      borderRadius: theme.spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    infoText: {
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
    nameLink: {
      ...theme.textStyles.label,
      color: theme.colors.text,
      textDecorationLine: 'underline',
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
