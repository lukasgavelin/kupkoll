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
  const season = getSeasonLabel();

  return (
    <Screen>
      <AppCard style={styles.heroCard}>
        <Text style={theme.textStyles.overline}>beehaven2 · {season}</Text>
        <Text style={theme.textStyles.display}>Dagens biodlingsläge för svenska bigårdar.</Text>
        <Text style={styles.heroText}>Kupjournal och beslutsstöd anpassat för svenska säsonger, arbetsmoment och snabb användning ute vid kuporna.</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaCard}>
            <Text style={theme.textStyles.overline}>Varningar</Text>
            <Text style={styles.heroMetaValue}>{dashboard.criticalCount}</Text>
          </View>
          <View style={styles.heroMetaCard}>
            <Text style={theme.textStyles.overline}>Arbetsmoment</Text>
            <Text style={styles.heroMetaValue}>{dashboard.upcomingTaskCount}</Text>
          </View>
        </View>
        {quickHive ? <PrimaryButton label="Logga genomgång" onPress={() => router.push(`/inspections/new?hiveId=${quickHive.id}`)} /> : null}
      </AppCard>

      <SectionHeader title="Översikt" description="Det viktigaste först, samlat för snabb orientering under svensk biodlingssäsong." />
      <View style={styles.grid}>
        <StatCard label="Kupor" value={String(dashboard.hiveCount)} />
        <StatCard label="Bigårdar" value={String(dashboard.apiaryCount)} />
        <StatCard label="Kommande uppgifter" value={String(dashboard.upcomingTaskCount)} />
        <StatCard label="Varningsflaggor" value={String(dashboard.criticalCount)} />
      </View>

      <SectionHeader eyebrow="Beslutsstöd" title="Flaggor att följa upp" description="Råd baserade på senaste genomgång, samhällsläge och aktuell biodlingssäsong." />
      <View style={styles.sectionList}>
        {recommendations.slice(0, 3).map((recommendation) => (
          <RecommendationCard key={recommendation.id} hiveName={getHiveById(recommendation.hiveId)?.name ?? 'Kupa'} recommendation={recommendation} />
        ))}
      </View>

      <SectionHeader eyebrow="Att göra" title="Närmaste arbetsmoment" />
      <View style={styles.sectionList}>
        {tasks.slice(0, 3).map((task) => (
          <TaskCard key={task.id} hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : apiaries.find((item) => item.id === task.apiaryId)?.name} task={task} />
        ))}
      </View>

      <SectionHeader eyebrow="Senast" title="Senaste genomgångar" />
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