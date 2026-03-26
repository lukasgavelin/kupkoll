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
        description="Egen planering och beslutstöd för vårgenomgång, stödfodring, skattning och invintring."
      />
      {hasHives ? (
        <AppCard style={styles.priorityCard}>
          <Text style={theme.textStyles.heading}>Prioriterat idag</Text>
          <Text style={theme.textStyles.body}>Fokusera först på samhällen med hög svärmrisk, svag utveckling, tunt foderläge eller osäker drottningstatus.</Text>
        </AppCard>
      ) : (
        <EmptyStateCard
          title={hasApiaries ? 'Lägg till första kupan' : 'Skapa först en bigård'}
          description={
            hasApiaries
              ? 'Uppgifter och beslutstöd blir relevanta när det finns kupor att följa upp. Lägg till första kupan för att komma vidare.'
              : 'Den här fliken fylls med planering och råd när du har skapat din första bigård och sedan lagt till kupor.'
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
          <EmptyStateCard title="Ingen planering ännu" description="Egna uppgifter och automatiska uppföljningar visas här när appen innehåller bigårdar, kupor och genomgångar." />
        )}
      </View>

      <SectionHeader eyebrow="Råd" title="Säsongsanpassat beslutsstöd" />
      <View style={styles.sectionList}>
        {recommendations.length ? (
          <RecommendationSections recommendations={recommendations} getHiveName={(hiveId) => getHiveById(hiveId)?.name ?? 'Kupa'} />
        ) : (
          <EmptyStateCard title="Inga råd ännu" description="Beslutsstödet börjar ge råd när det finns sparade observationer att räkna på." />
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