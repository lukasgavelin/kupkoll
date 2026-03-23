import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { InspectionSnapshot, RecommendationCard, StatCard, TaskCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getSeasonLabel } from '@/lib/selectors';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function HomeScreen() {
  const { dashboard, hives, apiaries, recommendations, tasks, getHiveById } = useBeehaven();
  const quickHive = hives[0];

  return (
    <Screen>
      <AppCard style={styles.heroCard}>
        <Text style={theme.textStyles.overline}>{getSeasonLabel()}</Text>
        <Text style={theme.textStyles.display}>beehaven2</Text>
        <Text style={theme.textStyles.body}>Svensk kupjournal och beslutsstöd för snabb användning ute i bigården.</Text>
        {quickHive ? <PrimaryButton label="Snabb inspektion" onPress={() => router.push(`/inspections/new?hiveId=${quickHive.id}`)} /> : null}
      </AppCard>

      <SectionHeader title="Översikt" description="Det viktigaste först: kupor, bigårdar, varningar och uppgifter." />
      <View style={styles.grid}>
        <StatCard label="Kupor" value={String(dashboard.hiveCount)} />
        <StatCard label="Bigårdar" value={String(dashboard.apiaryCount)} />
        <StatCard label="Kommande uppgifter" value={String(dashboard.upcomingTaskCount)} />
        <StatCard label="Varningsflaggor" value={String(dashboard.criticalCount)} />
      </View>

      <SectionHeader eyebrow="Beslutsstöd" title="Flaggor att följa upp" description="Rekommendationer baserade på senaste inspektion och säsong." />
      <View style={styles.sectionList}>
        {recommendations.slice(0, 3).map((recommendation) => (
          <RecommendationCard key={recommendation.id} hiveName={getHiveById(recommendation.hiveId)?.name ?? 'Kupa'} recommendation={recommendation} />
        ))}
      </View>

      <SectionHeader eyebrow="Att göra" title="Närmaste uppgifter" />
      <View style={styles.sectionList}>
        {tasks.slice(0, 3).map((task) => (
          <TaskCard key={task.id} hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : apiaries.find((item) => item.id === task.apiaryId)?.name} task={task} />
        ))}
      </View>

      <SectionHeader eyebrow="Senast" title="Nya observationer" />
      <View style={styles.sectionList}>
        {dashboard.latestInspections.map((inspection) => (
          <InspectionSnapshot key={inspection.id} inspection={inspection} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: theme.colors.surface,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  sectionList: {
    gap: theme.spacing.md,
  },
});