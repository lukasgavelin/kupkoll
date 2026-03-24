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
        <Text style={theme.textStyles.overline}>beehaven2 · {getSeasonLabel()}</Text>
        <Text style={theme.textStyles.display}>Lugn överblick för dagens arbete i bigården.</Text>
        <Text style={styles.heroText}>Svensk kupjournal och beslutsstöd med fokus på tydlighet, rytm och snabb användning ute i fält.</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaCard}>
            <Text style={theme.textStyles.overline}>Varningar</Text>
            <Text style={styles.heroMetaValue}>{dashboard.criticalCount}</Text>
          </View>
          <View style={styles.heroMetaCard}>
            <Text style={theme.textStyles.overline}>Uppgifter idag</Text>
            <Text style={styles.heroMetaValue}>{dashboard.upcomingTaskCount}</Text>
          </View>
        </View>
        {quickHive ? <PrimaryButton label="Snabb inspektion" onPress={() => router.push(`/inspections/new?hiveId=${quickHive.id}`)} /> : null}
      </AppCard>

      <SectionHeader title="Översikt" description="Det viktigaste först, samlat i ett lugnare flöde för snabb orientering." />
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
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.borderStrong,
  },
  heroText: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
    maxWidth: 620,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  heroMetaCard: {
    flex: 1,
    minWidth: 160,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  heroMetaValue: {
    ...theme.textStyles.title,
    fontSize: 28,
    lineHeight: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  sectionList: {
    gap: theme.spacing.lg,
  },
});