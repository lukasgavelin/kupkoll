import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { InspectionSnapshot, RecommendationCard, TaskCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatDateLabel } from '@/lib/selectors';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function HiveDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { deleteHive, getHiveById, getApiaryById, getInspectionsForHive, getRecommendationsForHive, getTasksForHive, latestInspectionMap } = useBeehaven();
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
        eyebrow="Kupdetalj"
        title={hive.name}
        description={apiary ? `${apiary.name} · ${hive.lastInspectionAt ? `Senaste genomgång ${formatDateLabel(hive.lastInspectionAt)}` : 'Ingen genomgång registrerad ännu'}` : undefined}
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
        <EmptyStateCard title="Ingen genomgång ännu" description="När du loggar första genomgången visas observationer, rekommendationer och relaterade arbetsmoment här." />
      )}

      <SectionHeader eyebrow="Beslutsstöd" title="Rekommendationer" />
      <View style={styles.sectionList}>
        {recommendations.length ? recommendations.map((recommendation) => <RecommendationCard key={recommendation.id} hiveName={hive.name} recommendation={recommendation} />) : <EmptyStateCard title="Inga rekommendationer ännu" description="Beslutsstödet aktiveras när kupan har minst en sparad genomgång." />}
      </View>

      <SectionHeader eyebrow="Åtgärder" title="Relaterade arbetsmoment" />
      <View style={styles.sectionList}>
        {tasks.length ? tasks.map((task) => <TaskCard key={task.id} hiveName={hive.name} task={task} />) : <EmptyStateCard title="Inga arbetsmoment ännu" description="Uppföljningar och beslutstödsuppgifter dyker upp här efter första genomgången." />}
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