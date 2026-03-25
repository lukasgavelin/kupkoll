import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { InspectionSnapshot, RecommendationCard, TaskCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { formatDateLabel } from '@/lib/selectors';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function HiveDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getHiveById, getApiaryById, getRecommendationsForHive, getTasksForHive, latestInspectionMap } = useBeehaven();
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

  const apiary = getApiaryById(hive.apiaryId);
  const latestInspection = latestInspectionMap[hive.id];
  const recommendations = getRecommendationsForHive(hive.id);
  const tasks = getTasksForHive(hive.id);

  return (
    <Screen>
      <PageHeader
        actionLabel="Tillbaka"
        actionIconName="chevron-back"
        onActionPress={() => router.back()}
        eyebrow="Kupdetalj"
        title={hive.name}
        description={apiary ? `${apiary.name} · Senaste genomgång ${formatDateLabel(hive.lastInspectionAt)}` : undefined}
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
        <PrimaryButton label="Ny snabb genomgång" onPress={() => router.push(`/inspections/new?hiveId=${hive.id}`)} />
      </AppCard>

      {latestInspection ? <InspectionSnapshot inspection={latestInspection} /> : null}

      <SectionHeader eyebrow="Beslutsstöd" title="Rekommendationer" />
      <View style={styles.sectionList}>
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.id} hiveName={hive.name} recommendation={recommendation} />
        ))}
      </View>

      <SectionHeader eyebrow="Åtgärder" title="Relaterade arbetsmoment" />
      <View style={styles.sectionList}>
        {tasks.map((task) => (
          <TaskCard key={task.id} hiveName={hive.name} task={task} />
        ))}
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