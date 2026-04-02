import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { HiveEventSnapshot, InspectionSnapshot, TaskCard } from '@/components/feature/Cards';
import { RecommendationSections } from '@/components/feature/RecommendationSections';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getRelatedTaskForRecommendation } from '@/lib/recommendations';
import { formatDateLabel, getApiaryDisplayLocation } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function HiveDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { deleteHive, getHiveById, getApiaryById, getEventsForHive, getRecommendationsForHive, getTasksForHive, latestInspectionMap } = useKupkoll();
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

  const hiveId = hive.id;
  const apiary = getApiaryById(hive.apiaryId);
  const apiaryLocation = getApiaryDisplayLocation(apiary);
  const latestInspection = latestInspectionMap[hive.id];
  const events = getEventsForHive(hive.id);
  const latestEvent = events[0];
  const recommendations = getRecommendationsForHive(hive.id);
  const tasks = getTasksForHive(hive.id);
  const queenHistory = [...hive.queenHistory].sort((left, right) => right.year.localeCompare(left.year));

  function confirmDelete() {
    Alert.alert('Ta bort kupa?', 'Kupan tas bort tillsammans med sparade genomgångar, händelser och manuella uppgifter.', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Ta bort',
        style: 'destructive',
        onPress: () => {
          deleteHive(hiveId);
          router.replace('/hives');
        },
      },
    ]);
  }

  return (
    <Screen>
      <PageHeader
        actionLabel="Tillbaka"
        actionIconName="chevron-back"
        onActionPress={() => router.back()}
        eyebrow="Kupa"
        title={hive.name}
        description={apiary ? `${apiary.name}${apiaryLocation ? ` · ${apiaryLocation}` : ''} · ${hive.lastInspectionAt ? `Senast genomgången ${formatDateLabel(hive.lastInspectionAt)}` : 'Ingen genomgång ännu'}` : undefined}
      />

      <AppCard>
        <View style={styles.metaGrid}>
          <MetaItem label="Status" value={hive.status} />
          <MetaItem label="Samhällsstyrka" value={hive.strength} />
          <MetaItem label="Temperament" value={hive.temperament} />
          <MetaItem label="Kupsystem" value={hive.boxSystem} />
        </View>
        <Text style={theme.textStyles.body}>{hive.notes}</Text>
        <PrimaryButton label="Ny genomgång" onPress={() => router.push(`/inspections/new?hiveId=${hiveId}`)} />
        <PrimaryButton label="Ny händelse" onPress={() => router.push(`/events/new?hiveId=${hiveId}` as never)} variant="secondary" />
      </AppCard>

      <SectionHeader eyebrow="Drottning" title="Nuvarande drottning och historik" />
      <AppCard>
        <View style={styles.metaGrid}>
          <MetaItem label="Drottningstatus" value={hive.queenStatus} />
          <MetaItem label="Drottningens år" value={hive.queenYear ?? 'Inte angivet'} />
          <MetaItem label="Märkningsfärg" value={hive.queenMarkingColor ?? 'Inte angivet'} />
          <MetaItem label="Ursprung" value={hive.queenOrigin ?? 'Inte angivet'} />
          <MetaItem label="Införd" value={hive.queenIntroducedAt ? formatDateLabel(hive.queenIntroducedAt) : 'Inte angivet'} />
        </View>
        {queenHistory.length ? (
          <View style={styles.queenHistoryList}>
            {queenHistory.map((entry) => (
              <View key={entry.id} style={styles.queenHistoryItem}>
                <Text style={theme.textStyles.bodyStrong}>{entry.year}</Text>
                <Text style={theme.textStyles.body}>{entry.note}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={theme.textStyles.caption}>Ingen drottninghistorik sparad ännu. Lägg till byten eller milstolpar när du redigerar kupan.</Text>
        )}
        <PrimaryButton fullWidth label="Logga drottningbyte" onPress={() => router.push(`/events/new?hiveId=${hiveId}&type=Drottning bytt` as never)} />
      </AppCard>

      <SectionHeader eyebrow="Historik" title="Senaste noteringar" />
      {latestInspection || latestEvent ? (
        <View style={styles.sectionList}>
          {latestEvent ? <HiveEventSnapshot event={latestEvent} /> : null}
          {latestInspection ? <InspectionSnapshot inspection={latestInspection} /> : null}
          <PrimaryButton label="Öppna historik" onPress={() => router.push(`/hives/${hiveId}/inspections`)} variant="secondary" />
        </View>
      ) : (
        <EmptyStateCard title="Ingen historik ännu" description="När du loggar första genomgången eller händelsen visas den här." />
      )}

      <SectionHeader eyebrow="Att göra" title="Saker kopplade till den här kupan" />
      <View style={styles.sectionList}>
        {tasks.length ? tasks.map((task) => <TaskCard key={task.id} hiveName={hive.name} task={task} />) : <EmptyStateCard title="Inga uppgifter ännu" description="När något behöver följas upp i den här kupan visas det här." />}
      </View>

      <SectionHeader eyebrow="Råd" title="Att hålla koll på" />
      <View style={styles.sectionList}>
        {recommendations.length ? (
          <RecommendationSections
            recommendations={recommendations}
            getHiveName={() => hive.name}
            getRelatedTaskLabel={(recommendation) => {
              const relatedTask = getRelatedTaskForRecommendation(recommendation, tasks);

              return relatedTask ? `${relatedTask.title} senast ${formatDateLabel(relatedTask.dueDate)}` : undefined;
            }}
          />
        ) : <EmptyStateCard title="Inga råd ännu" description="När kupan har fått sin första genomgång visas råd här." />}
      </View>

      <SectionHeader eyebrow="Hantera" title="Administrera kupan" />
      <View style={styles.sectionList}>
        <PrimaryButton fullWidth label="Redigera kupa" onPress={() => router.push(`/hives/${hiveId}/edit`)} variant="secondary" />
        <PrimaryButton fullWidth label="Ta bort kupa" onPress={confirmDelete} variant="ghost" />
      </View>
    </Screen>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={theme.textStyles.caption}>{label}</Text>
      <Text style={theme.textStyles.bodyStrong}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  metaItem: {
    width: '47%',
    gap: theme.spacing.xs,
  },
  sectionList: {
    gap: theme.spacing.lg,
  },
  queenHistoryList: {
    gap: theme.spacing.md,
  },
  queenHistoryItem: {
    gap: theme.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
});