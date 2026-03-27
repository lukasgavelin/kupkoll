import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HiveEventSnapshot, InspectionSnapshot } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function HiveInspectionHistoryScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getEventsForHive, getHiveById, getInspectionsForHive } = useKupkoll();
  const hive = getHiveById(params.id);

  if (!hive) {
    return (
      <Screen>
        <AppCard>
          <Text style={theme.textStyles.heading}>Kupan hittades inte</Text>
          <PrimaryButton label="Tillbaka" onPress={() => router.back()} />
        </AppCard>
      </Screen>
    );
  }

  const inspections = getInspectionsForHive(hive.id);
  const events = getEventsForHive(hive.id);
  const timeline = [
    ...inspections.map((inspection) => ({ id: `inspection-${inspection.id}`, performedAt: inspection.performedAt, kind: 'inspection' as const, inspection })),
    ...events.map((event) => ({ id: `event-${event.id}`, performedAt: event.performedAt, kind: 'event' as const, event })),
  ].sort((left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime());

  return (
    <Screen>
      <PageHeader
        actionLabel="Tillbaka"
        actionIconName="chevron-back"
        onActionPress={() => router.back()}
        eyebrow="Historik"
        title={`Historik för ${hive.name}`}
        description="Här ser du både genomgångar och viktiga händelser för samhället, med senaste posten överst."
      />

      <View style={styles.list}>
        {timeline.length ? (
          timeline.map((item) =>
            item.kind === 'inspection' ? <InspectionSnapshot key={item.id} inspection={item.inspection} /> : <HiveEventSnapshot key={item.id} event={item.event} />,
          )
        ) : (
          <EmptyStateCard
            title="Ingen historik ännu"
            description="När du har sparat genomgångar eller händelser för kupan samlas de här i den ordning de gjordes. Börja med en genomgång om du vill få lägesbild, råd och uppgifter att bygga vidare på."
            actionLabel="Logga genomgång"
            onActionPress={() => router.push(`/inspections/new?hiveId=${hive.id}`)}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.lg,
  },
});