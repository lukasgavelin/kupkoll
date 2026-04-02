import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { BloomInsightsCard } from '@/components/feature/BloomInsightsCard';
import { HiveCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BloomPrediction, getLikelyBloomingPlantsNow } from '@/lib/bloom';
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
        return;
      }

      const fallbackLatitude = bloomZoneLabel === 'norra' ? 63 : bloomZoneLabel === 'södra' ? 56 : 59.5;
      const userLatitude = apiary.coordinates?.latitude ?? fallbackLatitude;

      try {
        const result = await getLikelyBloomingPlantsNow({
          userLatitude,
          coordinates: apiary.coordinates,
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
  }, [apiary, bloomZoneLabel]);

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

  function confirmDelete() {
    const hiveList = apiaryHives.map((hive) => `• ${hive.name}`).join('\n');
    const deleteMessage = apiaryHives.length
      ? `Bigården tas bort tillsammans med följande kupor:\n\n${hiveList}\n\nTillhörande genomgångar och manuella uppgifter rensas också.`
      : 'Bigården tas bort permanent.';

    const performDelete = () => {
      deleteApiary(apiaryId);
      router.replace('/apiaries');
    };

    if (Platform.OS === 'web') {
      const confirmed = globalThis.confirm(`Ta bort bigård?\n\n${deleteMessage}`);

      if (confirmed) {
        performDelete();
      }

      return;
    }

    Alert.alert(
      'Ta bort bigård?',
      deleteMessage,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: performDelete,
        },
      ],
    );
  }

  return (
    <Screen>
      <PageHeader actionLabel="Tillbaka" actionIconName="chevron-back" onActionPress={handleBackNavigation} eyebrow="Bigård" title={apiary.name} description={apiaryDisplayLocation ?? apiary.location} />
      <AppCard>
        <Text style={theme.textStyles.heading}>Om platsen</Text>
        <Text style={theme.textStyles.caption}>{apiaryDisplayLocation ?? apiary.location}</Text>
        {apiary.coordinates ? <Text style={theme.textStyles.caption}>GPS-position: {formatCoordinates(apiary.coordinates)}</Text> : null}
        <Text style={theme.textStyles.body}>{apiary.notes}</Text>
        <PrimaryButton fullWidth label="Lägg till kupa" onPress={() => router.push(`/hives/new?apiaryId=${apiaryId}`)} />
      </AppCard>
      {!apiaryHives.length ? (
        <AppCard>
          <Text style={theme.textStyles.heading}>Nästa steg</Text>
          <Text style={theme.textStyles.body}>Lägg till första kupan i bigården och fyll i aktuell drottning.</Text>
          <PrimaryButton fullWidth label="Lägg till första kupan" onPress={() => router.push(`/hives/new?apiaryId=${apiaryId}`)} />
        </AppCard>
      ) : null}

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
      <BloomInsightsCard predictions={bloomPredictions} zoneLabel={bloomZoneLabel} locationLabel={apiaryDisplayLocation} />

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
  });
}