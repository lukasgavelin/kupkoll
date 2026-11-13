import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BloomInsightsCard } from '@/components/feature/BloomInsightsCard';
import { HiveCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BloomPrediction, getLikelyBloomingPlantsNow } from '@/lib/bloom';
import { InspectionWeatherSnapshot } from '@/lib/weather';
import { confirmDestructiveAction } from '@/lib/confirm';
import { formatCoordinates } from '@/lib/mapLinks';
import { getApiaryDisplayLocation, getApiaryRegion } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';

export default function ApiaryDetailScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useLocalSearchParams<{ id: string }>();
  const { deleteApiary, getApiaryById, getHivesByApiary } = useKupkoll();
  const apiary = getApiaryById(params.id);
  const [bloomPredictions, setBloomPredictions] = useState<BloomPrediction[]>([]);
  const [bloomWeather, setBloomWeather] = useState<InspectionWeatherSnapshot | undefined>(undefined);
  const [dragEfficiency, setDragEfficiency] = useState<number | undefined>(undefined);
  const [dragEfficiencyLabel, setDragEfficiencyLabel] = useState<string | undefined>(undefined);
  const [isLoadingBloom, setIsLoadingBloom] = useState(Boolean(apiary));
  const [bloomError, setBloomError] = useState<string | null>(null);
  const [bloomRetryKey, setBloomRetryKey] = useState(0);
  const apiaryDisplayLocation = getApiaryDisplayLocation(apiary);

  function handleBackNavigation() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/apiaries');
  }

  const bloomZoneLabel = useMemo(() => {
    if (!apiary) {
      return 'mellan';
    }

    const region = getApiaryRegion(apiary);

    if (region === 'Norra Sverige') {
      return 'norra';
    }

    if (region === 'Södra Sverige') {
      return 'södra';
    }

    return 'mellan';
  }, [apiary]);

  useEffect(() => {
    let isMounted = true;

    async function loadPredictions() {
      if (!apiary) {
        setBloomPredictions([]);
        setBloomWeather(undefined);
        setDragEfficiency(undefined);
        setDragEfficiencyLabel(undefined);
        setBloomError(null);
        setIsLoadingBloom(false);
        return;
      }

      const fallbackLatitude = bloomZoneLabel === 'norra' ? 63 : bloomZoneLabel === 'södra' ? 56 : 59.5;
      const userLatitude = apiary.coordinates?.latitude ?? fallbackLatitude;

      setIsLoadingBloom(true);
      setBloomError(null);

      try {
        const result = await getLikelyBloomingPlantsNow({
          userLatitude,
          coordinates: apiary.coordinates,
        });

        if (isMounted) {
          setBloomPredictions(result.predictions);
          setBloomWeather(result.currentWeather);
          setDragEfficiency(result.dragEfficiency);
          setDragEfficiencyLabel(result.dragEfficiencyLabel);
          setBloomError(null);
        }
      } catch {
        if (isMounted) {
          setBloomPredictions([]);
          setBloomWeather(undefined);
          setDragEfficiency(undefined);
          setDragEfficiencyLabel(undefined);
          setBloomError('Kunde inte ladda blomningsdata just nu. Kontrollera anslutningen och försök igen.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingBloom(false);
        }
      }
    }

    void loadPredictions();

    return () => {
      isMounted = false;
    };
  }, [apiary, bloomZoneLabel, bloomRetryKey]);

  if (!apiary) {
    return (
      <Screen>
        <AppCard>
          <Text style={theme.textStyles.heading}>Bigården hittades inte</Text>
          <PrimaryButton label="Tillbaka" onPress={handleBackNavigation} />
        </AppCard>
      </Screen>
    );
  }

  const apiaryId = apiary.id;
  const apiaryHives = getHivesByApiary(apiary.id);
  const stableCount = apiaryHives.filter((h) => h.status === 'Stabilt').length;
  const needsActionCount = apiaryHives.filter((h) => h.status === 'Behöver åtgärd').length;
  const buildingCount = apiaryHives.filter((h) => h.status === 'Under uppbyggnad').length;

  async function confirmDelete() {
    const hiveList = apiaryHives.map((hive) => `• ${hive.name}`).join('\n');
    const deleteMessage = apiaryHives.length
      ? `Bigården tas bort tillsammans med följande kupor:\n\n${hiveList}\n\nTillhörande genomgångar och manuella uppgifter rensas också.`
      : 'Bigården tas bort permanent.';

    const shouldDelete = await confirmDestructiveAction({
      title: 'Ta bort bigård?',
      message: deleteMessage,
      confirmLabel: 'Ta bort',
    });

    if (!shouldDelete) {
      return;
    }

    deleteApiary(apiaryId);
    router.replace('/apiaries');
  }

  return (
    <Screen>
      <PageHeader actionLabel="Tillbaka" actionIconName="chevron-back" onActionPress={handleBackNavigation} eyebrow="Bigård" title={apiary.name} description={apiaryDisplayLocation ?? apiary.location} />
      <AppCard>
        <Text style={theme.textStyles.heading}>Om platsen</Text>
        <Text style={theme.textStyles.caption}>{apiaryDisplayLocation ?? apiary.location}</Text>
        {apiary.coordinates ? <Text style={theme.textStyles.caption}>GPS-position: {formatCoordinates(apiary.coordinates)}</Text> : null}
        <Text style={theme.textStyles.body}>{apiary.notes}</Text>
        {apiaryHives.length > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryPill}>{apiaryHives.length} kupor</Text>
            {stableCount > 0 ? <Text style={styles.summaryPill}>{stableCount} stabila</Text> : null}
            {needsActionCount > 0 ? <Text style={styles.summaryPill}>{needsActionCount} behöver åtgärd</Text> : null}
            {buildingCount > 0 ? <Text style={styles.summaryPill}>{buildingCount} under uppbyggnad</Text> : null}
          </View>
        ) : null}
        <PrimaryButton fullWidth label="Lägg till kupa" onPress={() => router.push(`/hives/new?apiaryId=${apiaryId}`)} />
      </AppCard>

      <SectionHeader
        eyebrow="Kupor"
        title="Kopplade kupor"
        description={apiaryHives.length ? `Kupor i ${apiary.name}.` : `Här visas kupor i ${apiary.name}.`}
      />
      <View style={styles.sectionList}>
        {apiaryHives.length ? apiaryHives.map((hive) => <HiveCard key={hive.id} apiaryLabel={apiaryDisplayLocation ? `${apiary.name} · ${apiaryDisplayLocation}` : apiary.name} hive={hive} />) : <EmptyStateCard title="Inga kupor här ännu" description="Lägg till första kupan i bigården." />}
      </View>

      <SectionHeader
        eyebrow="Blomning"
        title="Sannolika dragväxter"
        description="Historikbaserad prognos för vilka växter som troligen blommar kring din bigård."
      />
      <BloomInsightsCard
        predictions={bloomPredictions}
        zoneLabel={bloomZoneLabel}
        locationLabel={apiaryDisplayLocation}
        currentWeather={bloomWeather}
        dragEfficiency={dragEfficiency}
        dragEfficiencyLabel={dragEfficiencyLabel}
        isLoading={isLoadingBloom}
        error={bloomError}
        onRetry={() => setBloomRetryKey((current) => current + 1)}
      />

      <SectionHeader eyebrow="Hantera" title="Administrera bigården" />
      <View style={styles.sectionList}>
        <PrimaryButton fullWidth label="Redigera bigård" onPress={() => router.push(`/apiaries/${apiaryId}/edit`)} variant="secondary" />
        <PrimaryButton fullWidth label="Ta bort bigård" onPress={confirmDelete} variant="ghost" />
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    sectionList: {
      gap: theme.spacing.lg,
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    summaryPill: {
      ...theme.textStyles.caption,
      color: theme.colors.text,
      backgroundColor: theme.colors.surfaceMuted,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.pill,
    },
  });
}