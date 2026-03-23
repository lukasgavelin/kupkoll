import { StyleSheet, Text, View } from 'react-native';

import { RecommendationCard, TaskCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function TasksScreen() {
  const { tasks, recommendations, getHiveById, getApiaryById } = useBeehaven();

  return (
    <Screen>
      <SectionHeader
        eyebrow="Uppgifter"
        title="Det som behöver göras"
        description="Både manuella uppgifter och rekommenderade nästa steg samlade i en vy."
      />

      <AppCard>
        <Text style={theme.textStyles.heading}>Prioriterat idag</Text>
        <Text style={theme.textStyles.body}>Fokusera först på kupor med hög svärmrisk, svag utveckling eller osäker drottningstatus.</Text>
      </AppCard>

      <View style={styles.sectionList}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : task.apiaryId ? getApiaryById(task.apiaryId)?.name : undefined}
            task={task}
          />
        ))}
      </View>

      <SectionHeader eyebrow="Råd" title="Beslutsstöd" />
      <View style={styles.sectionList}>
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.id} hiveName={getHiveById(recommendation.hiveId)?.name ?? 'Kupa'} recommendation={recommendation} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionList: {
    gap: theme.spacing.md,
  },
});