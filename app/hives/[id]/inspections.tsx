import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HiveEventSnapshot, InspectionSnapshot } from '@/components/feature/Cards';
import { confirmDestructiveAction } from '@/lib/confirm';
import { HiveEvent, Inspection } from '@/types/domain';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export default function HiveInspectionHistoryScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useLocalSearchParams<{ id: string }>();
  const { getHiveById, getInspectionsForHive, getEventsForHive, deleteInspection, deleteEvent } = useKupkoll();
  const hive = getHiveById(params.id);
  const inspections = hive ? getInspectionsForHive(hive.id) : [];
  const events = hive ? getEventsForHive(hive.id) : [];

  async function handleDeleteInspection(inspection: Inspection) {
    const confirmed = await confirmDestructiveAction({
      title: 'Ta bort genomgång',
      message: 'Vill du ta bort den här genomgången från historiken?',
    });

    if (confirmed) {
      deleteInspection(inspection.id);
    }
  }

  async function handleDeleteEvent(event: HiveEvent) {
    const confirmed = await confirmDestructiveAction({
      title: 'Ta bort händelse',
      message: `Vill du ta bort "${event.type}" från historiken?`,
    });

    if (confirmed) {
      deleteEvent(event.id);
    }
  }

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
        description="Här ser du genomgångar och händelser, med senaste posten överst."
      />

      <View style={styles.list}>
        {timeline.length ? (
          timeline.map((item) =>
            item.kind === 'inspection' ? (
              <InspectionSnapshot
                key={item.id}
                inspection={item.inspection}
                onDelete={() => void handleDeleteInspection(item.inspection)}
              />
            ) : (
              <HiveEventSnapshot
                key={item.id}
                event={item.event}
                onDelete={() => void handleDeleteEvent(item.event)}
              />
            ),
          )
        ) : (
          <EmptyStateCard
            title="Ingen historik ännu"
            description="När du loggar genomgångar eller händelser visas de här i tidsordning."
            actionLabel="Logga genomgång"
            onActionPress={() => router.push(`/inspections/new?hiveId=${hive.id}`)}
          />
        )}
      </View>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    list: {
      gap: theme.spacing.lg,
    },
  });
}