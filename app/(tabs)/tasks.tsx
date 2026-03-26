import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { TaskCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import type { Task } from '@/types/domain';

export default function TasksScreen() {
  const theme = useTheme();
  const { apiaries, hives, tasks, getHiveById, getApiaryById } = useKupkoll();
  const styles = createStyles(theme);
  const hasApiaries = apiaries.length > 0;
  const hasHives = hives.length > 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const soonBoundary = new Date(today);
  soonBoundary.setDate(soonBoundary.getDate() + 7);

  const groupedTasks = tasks.reduce(
    (groups, task) => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (task.priority === 'Hög' || dueDate.getTime() <= today.getTime()) {
        groups.now.push(task);
        return groups;
      }

      if (dueDate.getTime() <= soonBoundary.getTime()) {
        groups.soon.push(task);
        return groups;
      }

      groups.later.push(task);
      return groups;
    },
    {
      now: [] as Task[],
      soon: [] as Task[],
      later: [] as Task[],
    },
  );

  const taskSections = [
    {
      key: 'now',
      title: 'Bråttom nu',
      description: 'Sådant som är högprioriterat eller borde göras först.',
      items: groupedTasks.now,
    },
    {
      key: 'soon',
      title: 'Snart på tur',
      description: 'Bra att ha koll på inför de närmaste dagarna.',
      items: groupedTasks.soon,
    },
    {
      key: 'later',
      title: 'Längre fram',
      description: 'Sådant som kan planeras in lite längre fram.',
      items: groupedTasks.later,
    },
  ].filter((section) => section.items.length);

  return (
    <Screen>
      <SectionHeader
        eyebrow="Uppgifter"
        title="Det som behöver göras"
        description="Här håller du ihop arbetslistan. Börja överst och arbeta dig nedåt när du vill se vad som är viktigast först."
      />
      {hasHives ? (
        <AppCard style={styles.priorityCard}>
          <Text style={theme.textStyles.heading}>Arbetsordning</Text>
          <Text style={theme.textStyles.body}>Börja med det som är bråttom nu. Fortsätt sedan med sådant som snart behöver göras och lämna resten till planeringen längre fram.</Text>
          <View style={styles.summaryFacts}>
            <Text style={styles.summaryFact}>Bråttom nu: {groupedTasks.now.length}</Text>
            <Text style={styles.summaryFact}>Snart: {groupedTasks.soon.length}</Text>
            <Text style={styles.summaryFact}>Längre fram: {groupedTasks.later.length}</Text>
          </View>
        </AppCard>
      ) : (
        <EmptyStateCard
          title={hasApiaries ? 'Lägg till första kupan' : 'Skapa först en bigård'}
          description={
            hasApiaries
              ? 'Uppgifter blir relevanta när det finns kupor att följa upp. Lägg till första kupan för att komma vidare.'
              : 'Den här fliken fylls med sådant att göra när du först har lagt till en bigård och sedan dina kupor.'
          }
          actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'}
          onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')}
        />
      )}

      {tasks.length ? (
        taskSections.map((section) => (
          <View key={section.key} style={styles.sectionList}>
            <SectionHeader title={section.title} description={section.description} />
            {section.items.map((task) => (
              <TaskCard
                key={task.id}
                hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : task.apiaryId ? getApiaryById(task.apiaryId)?.name : undefined}
                task={task}
              />
            ))}
          </View>
        ))
      ) : (
        <View style={styles.sectionList}>
          <EmptyStateCard title="Inga uppgifter ännu" description="När du börjar använda appen mer fylls den här listan med sådant du vill göra eller följa upp." />
        </View>
      )}
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    priorityCard: {
      borderColor: theme.colors.borderStrong,
    },
    summaryFacts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    summaryFact: {
      ...theme.textStyles.caption,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surfaceMuted,
      color: theme.colors.text,
    },
    sectionList: {
      gap: theme.spacing.lg,
    },
  });
}