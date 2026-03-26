import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { TaskCard } from '@/components/feature/Cards';
import { RecommendationSections } from '@/components/feature/RecommendationSections';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function TasksScreen() {
  const { apiaries, hives, tasks, recommendations, getHiveById, getApiaryById } = useKupkoll();
  const hasApiaries = apiaries.length > 0;
  const hasHives = hives.length > 0;

  return (
    <Screen>
      <SectionHeader
        eyebrow="Uppgifter"
        title="Det som behöver göras"
        description="Här samlas sådant du vill komma ihåg att göra, både egna noteringar och råd från det du sett i kuporna."
      />
      {hasHives ? (
        <AppCard style={styles.priorityCard}>
          <Text style={theme.textStyles.heading}>Prioriterat idag</Text>
          <Text style={theme.textStyles.body}>Börja gärna med det som känns mest brådskande, till exempel svaga samhällen, osäkert drottningläge eller kupor som behöver mer mat.</Text>
        </AppCard>
      ) : (
        <EmptyStateCard
          title={hasApiaries ? 'Lägg till första kupan' : 'Skapa först en bigård'}
          description={
            hasApiaries
              ? 'Uppgifter och beslutstöd blir relevanta när det finns kupor att följa upp. Lägg till första kupan för att komma vidare.'
              : 'Den här fliken fylls med sådant att göra när du först har lagt till en bigård och sedan dina kupor.'
          }
          actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'}
          onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')}
        />
      )}

      <View style={styles.sectionList}>
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : task.apiaryId ? getApiaryById(task.apiaryId)?.name : undefined}
              task={task}
            />
          ))
        ) : (
          <EmptyStateCard title="Inga uppgifter ännu" description="När du börjar använda appen mer fylls den här listan med sådant du vill göra eller följa upp." />
        )}
      </View>

      <SectionHeader eyebrow="Råd" title="Förslag att titta på" />
      <View style={styles.sectionList}>
        {recommendations.length ? (
          <RecommendationSections recommendations={recommendations} getHiveName={(hiveId) => getHiveById(hiveId)?.name ?? 'Kupa'} />
        ) : (
          <EmptyStateCard title="Inga råd ännu" description="När du har sparat några genomgångar börjar appen hjälpa dig att lyfta fram sådant som kan vara värt att kolla närmare." />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  priorityCard: {
    borderColor: theme.colors.borderStrong,
  },
  sectionList: {
    gap: theme.spacing.lg,
  },
});