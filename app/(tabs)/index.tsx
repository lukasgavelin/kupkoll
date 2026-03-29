import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { InspectionSnapshot, StatCard } from '@/components/feature/Cards';
import { SeasonStatusCard } from '@/components/feature/SeasonStatusCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getSeasonStatus } from '@/lib/selectors';
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

  // Compute season status for SeasonStatusCard
  const [seasonDate] = useState(() => new Date());
  const seasonStatus = useMemo(() => getSeasonStatus(seasonDate, apiaries), [seasonDate, apiaries]);




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
        description="Här ser du senaste sparade genomgång. Tidigare genomgångar hittar du i historiken."
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
            <PrimaryButton
              label="Logga genomgång"
              onPress={() => router.push(`/inspections/new?hiveId=${latestInspection.hiveId}`)}
            />
          </>
        ) : (
          <EmptyStateCard
            title="Inga genomgångar ännu"
            description={hasHives ? 'Du har kupor på plats men ännu ingen sparad genomgång. Logga den första så blir historiken tydlig.' : 'När du sparar din första genomgång visas den här, så att du lätt kan minnas vad du såg sist.'}
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
        {!latestInspection && hasHives && quickHive ? (
          <PrimaryButton label="Logga genomgång" onPress={() => router.push(`/inspections/new?hiveId=${quickHive.id}`)} />
        ) : null}
      </View>

      <SectionHeader
        eyebrow="Säsong"
        title="Säsongsinfo"
        description="Fokus för perioden med aktuella råd för just din region."
      />
      <SeasonStatusCard status={seasonStatus} />
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