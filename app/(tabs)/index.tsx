import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BloomInsightsCard } from '@/components/feature/BloomInsightsCard';
import { InspectionSnapshot, StatCard } from '@/components/feature/Cards';
import { SeasonStatusCard } from '@/components/feature/SeasonStatusCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BloomPrediction, getLikelyBloomingPlantsNow } from '@/lib/bloom';
import { applySeasonTipSelection, getSeasonTipSelection } from '@/lib/seasonTipRotation';
import { getPrimaryApiary, getSeasonStatus } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const { dashboard, hives, apiaries } = useKupkoll();
  const styles = createStyles(theme);
  const quickHive = hives[0];
  const hasApiaries = apiaries.length > 0;
  const hasHives = hives.length > 0;
  const latestInspection = dashboard.latestInspections[0];
  const inspectionTarget = latestInspection?.hiveId ?? quickHive?.id;

  // Compute season status for SeasonStatusCard
  const [seasonDate] = useState(() => new Date());
  const baseSeasonStatus = useMemo(() => getSeasonStatus(seasonDate, apiaries), [seasonDate, apiaries]);
  const [seasonStatus, setSeasonStatus] = useState(baseSeasonStatus);
  const [bloomPredictions, setBloomPredictions] = useState<BloomPrediction[]>([]);

  useEffect(() => {
    let isMounted = true;

    setSeasonStatus(baseSeasonStatus);

    async function loadSeasonTipSelection() {
      const selection = await getSeasonTipSelection(baseSeasonStatus, seasonDate);

      if (!isMounted) {
        return;
      }

      setSeasonStatus(applySeasonTipSelection(baseSeasonStatus, selection));
    }

    void loadSeasonTipSelection();

    return () => {
      isMounted = false;
    };
  }, [baseSeasonStatus, seasonDate]);

  useEffect(() => {
    let isMounted = true;

    async function loadPredictions() {
      const primaryApiary = getPrimaryApiary(apiaries);
      const fallbackLatitude = seasonStatus.regionLabel === 'Norra Sverige' ? 63 : seasonStatus.regionLabel === 'Södra Sverige' ? 56 : 59.5;
      const userLatitude = primaryApiary?.coordinates?.latitude ?? fallbackLatitude;

      try {
        const result = await getLikelyBloomingPlantsNow({
          userLatitude,
          coordinates: primaryApiary?.coordinates,
          date: seasonDate,
        });

        if (isMounted) {
          setBloomPredictions(result.predictions);
        }
      } catch {
        if (isMounted) {
          setBloomPredictions([]);
        }
      }
    }

    void loadPredictions();

    return () => {
      isMounted = false;
    };
  }, [apiaries, seasonDate, seasonStatus.regionLabel]);




  return (
    <Screen>
      <SectionHeader
        eyebrow="Översikt"
        title="Läget just nu"
        description="Här ser du en snabb summering av vad som är viktigast att göra härnäst."
      />
      <View style={styles.grid}>
        <StatCard label="Bigårdar" value={String(dashboard.apiaryCount)} onPress={() => router.push('/apiaries')} />
        <StatCard label="Kupor" value={String(dashboard.hiveCount)} onPress={() => router.push('/hives')} />
        <StatCard label="Kommande uppgifter" value={String(dashboard.upcomingTaskCount)} onPress={() => router.push('/tasks')} />
        <StatCard label="Varningsflaggor" value={String(dashboard.criticalCount)} onPress={() => router.push('/tasks')} />
      </View>

      <SectionHeader
        eyebrow="Senast"
        title="Senaste genomgången"
        description="Här ser du senaste genomgången. Tidigare genomgångar finns i historiken."
      />
      <View style={styles.sectionList}>
        {latestInspection ? (
          <>
            <InspectionSnapshot inspection={latestInspection} />
            <PrimaryButton
              label="Visa tidigare genomgångar"
              onPress={() => router.push(`/hives/${latestInspection.hiveId}/inspections`)}
              variant="secondary"
            />
            {inspectionTarget ? <PrimaryButton label="Logga ny genomgång" onPress={() => router.push(`/inspections/new?hiveId=${inspectionTarget}`)} /> : null}
            {inspectionTarget ? (
              <PrimaryButton
                label="Logga ny händelse"
                onPress={() => router.push(`/events/new?hiveId=${inspectionTarget}` as never)}
                variant="secondary"
              />
            ) : null}
          </>
        ) : (
          <EmptyStateCard
            title="Inga genomgångar ännu"
            description={hasHives ? 'Du har kupor på plats men ingen genomgång ännu. Logga den första för att starta historiken.' : 'När du loggar din första genomgång visas den här.'}
            actionLabel={hasHives ? 'Logga första genomgången' : hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'}
            onActionPress={() =>
              router.push(
                hasHives && quickHive
                  ? `/inspections/new?hiveId=${quickHive.id}`
                  : hasApiaries
                  ? '/hives/new'
                  : '/apiaries/new'
              )
            }
          />
        )}
        {!latestInspection && inspectionTarget ? <PrimaryButton label="Logga ny genomgång" onPress={() => router.push(`/inspections/new?hiveId=${inspectionTarget}`)} /> : null}
        {!latestInspection && inspectionTarget ? (
          <PrimaryButton
            label="Logga ny händelse"
            onPress={() => router.push(`/events/new?hiveId=${inspectionTarget}` as never)}
            variant="secondary"
          />
        ) : null}
      </View>

      <SectionHeader
        eyebrow="Säsong"
        title="Säsongsinfo"
        description="Fokus för perioden med aktuella råd för just din region."
      />
      <SeasonStatusCard status={seasonStatus} />
      <BloomInsightsCard
        predictions={bloomPredictions}
        locationLabel={seasonStatus.locationLabel}
        zoneLabel={seasonStatus.zoneLabel === 'nord' ? 'norra' : seasonStatus.zoneLabel === 'syd' ? 'södra' : 'mellan'}
      />
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    sectionList: {
      gap: theme.spacing.lg,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      marginBottom: -theme.spacing.lg,
    },
  });
}