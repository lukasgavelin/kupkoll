import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { InspectionSnapshot, TaskCard } from '@/components/feature/Cards';
import { RecommendationSections } from '@/components/feature/RecommendationSections';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatDateLabel } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function HiveDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { deleteHive, getHiveById, getApiaryById, getInspectionsForHive, getRecommendationsForHive, getTasksForHive, latestInspectionMap } = useKupkoll();
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
  const latestInspection = latestInspectionMap[hive.id];
  const inspectionHistory = getInspectionsForHive(hive.id);
  const recommendations = getRecommendationsForHive(hive.id);
  const tasks = getTasksForHive(hive.id);

  function confirmDelete() {
    Alert.alert('Ta bort kupa?', 'Kupan tas bort tillsammans med sparade genomgångar och manuella uppgifter.', [
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
        description={apiary ? `${apiary.name} · ${hive.lastInspectionAt ? `Senast genomgången ${formatDateLabel(hive.lastInspectionAt)}` : 'Ingen genomgång ännu'}` : undefined}
      />

      <AppCard>
        <View style={styles.metaGrid}>
          <MetaItem label="Status" value={hive.status} />
          <MetaItem label="Drottningstatus" value={hive.queenStatus} />
          <MetaItem label="Samhällsstyrka" value={hive.strength} />
          <MetaItem label="Temperament" value={hive.temperament} />
          <MetaItem label="Kupsystem" value={hive.boxSystem} />
        </View>
        <Text style={theme.textStyles.body}>{hive.notes}</Text>
        <PrimaryButton label="Ny snabb genomgång" onPress={() => router.push(`/inspections/new?hiveId=${hiveId}`)} />
        <PrimaryButton label="Redigera kupa" onPress={() => router.push(`/hives/${hiveId}/edit`)} variant="secondary" />
        <PrimaryButton label="Ta bort kupa" onPress={confirmDelete} variant="ghost" />
      </AppCard>

      {latestInspection ? (
        <View style={styles.sectionList}>
          <InspectionSnapshot inspection={latestInspection} />
          <PrimaryButton label="Tidigare genomgångar" onPress={() => router.push(`/hives/${hiveId}/inspections`)} variant="secondary" />
        </View>
      ) : (
        <EmptyStateCard title="Ingen genomgång ännu" description="När du sparar den första genomgången ser du här vad som noterades och vad som kan vara bra att följa upp." />
      )}

      <SectionHeader eyebrow="Råd" title="Att hålla koll på" />
      <View style={styles.sectionList}>
        {recommendations.length ? <RecommendationSections recommendations={recommendations} getHiveName={() => hive.name} /> : <EmptyStateCard title="Inga råd ännu" description="När kupan har fått sin första genomgång börjar appen lyfta fram sådant som kan vara bra att titta närmare på." />}
      </View>

      <SectionHeader eyebrow="Att göra" title="Saker kopplade till den här kupan" />
      <View style={styles.sectionList}>
        {tasks.length ? tasks.map((task) => <TaskCard key={task.id} hiveName={hive.name} task={task} />) : <EmptyStateCard title="Inga uppgifter ännu" description="När något behöver följas upp i den här kupan visas det här." />}
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
});