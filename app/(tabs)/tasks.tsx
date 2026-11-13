import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { TaskCard } from '@/components/feature/Cards';
import { RecommendationSections } from '@/components/feature/RecommendationSections';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { confirmDestructiveAction } from '@/lib/confirm';
import { getRelatedTaskForRecommendation } from '@/lib/recommendations';
import { formatDateLabel } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import type { Task, TaskPriority, TaskSource } from '@/types/domain';

const PRIORITY_OPTIONS: TaskPriority[] = ['Låg', 'Medel', 'Hög'];
const SOURCE_FILTERS: ('Alla' | TaskSource)[] = ['Alla', 'Beslutsstöd', 'Egen planering'];

function showTaskAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    globalThis.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
}

function parseOptionalDueDate(raw: string): string | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed.toISOString();
}

function formatOffsetIsoDate(daysOffset: number): string {
  const target = new Date();
  target.setDate(target.getDate() + daysOffset);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TasksScreen() {
  const theme = useTheme();
  const { apiaries, hives, tasks, manualTasks, recommendations, getHiveById, getApiaryById, addTask, toggleTask, deleteTask } = useKupkoll();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medel');
  const [selectedHiveId, setSelectedHiveId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'Alla' | TaskSource>('Alla');

  const hasApiaries = apiaries.length > 0;
  const hasHives = hives.length > 0;
  const firstHive = hives[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const soonBoundary = new Date(today);
  soonBoundary.setDate(soonBoundary.getDate() + 7);

  const completedManualTasks = useMemo(
    () => manualTasks.filter((task) => task.completed),
    [manualTasks],
  );

  function resetForm() {
    setTitle('');
    setDescription('');
    setDueDateInput('');
    setPriority('Medel');
    setSelectedHiveId(undefined);
    setIsFormOpen(false);
  }

  function handleCreateTask() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      showTaskAlert('Titel saknas', 'Ange en titel för uppgiften innan du sparar.');
      return;
    }

    const parsedDueDate = parseOptionalDueDate(dueDateInput);
    if (parsedDueDate === null) {
      showTaskAlert('Ogiltigt datum', 'Ange förfallodatum som ÅÅÅÅ-MM-DD, till exempel 2026-05-15, eller lämna fältet tomt.');
      return;
    }

    addTask({
      title: trimmedTitle,
      description,
      dueDate: parsedDueDate,
      hiveId: selectedHiveId,
      priority,
    });

    resetForm();
  }

  async function handleDeleteTask(task: Task) {
    const confirmed = await confirmDestructiveAction({
      title: 'Ta bort uppgift',
      message: `Vill du ta bort "${task.title}"?`,
    });

    if (confirmed) {
      deleteTask(task.id);
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTasks = tasks.filter((task) => {
    if (sourceFilter !== 'Alla' && task.source !== sourceFilter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const hiveName = task.hiveId ? (getHiveById(task.hiveId)?.name.toLowerCase() ?? '') : '';
    const apiaryName = task.apiaryId ? (getApiaryById(task.apiaryId)?.name.toLowerCase() ?? '') : '';
    return (
      task.title.toLowerCase().includes(normalizedQuery) ||
      task.description.toLowerCase().includes(normalizedQuery) ||
      hiveName.includes(normalizedQuery) ||
      apiaryName.includes(normalizedQuery)
    );
  });

  const groupedTasks = filteredTasks.reduce(
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
      description: 'Det här är bäst att ta först.',
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
        description="Här samlas alla uppgifter, råd och rekommendationer på ett ställe."
      />

      <View style={styles.createActionRow}>
        <PrimaryButton
          iconName={isFormOpen ? 'close' : 'add'}
          label={isFormOpen ? 'Stäng formulär' : 'Ny uppgift'}
          onPress={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
          size="compact"
          variant={isFormOpen ? 'secondary' : 'primary'}
        />
      </View>

      {isFormOpen ? (
        <AppCard style={styles.formCard}>
          <Text style={theme.textStyles.heading}>Lägg till egen uppgift</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Titel</Text>
            <TextInput
              onChangeText={setTitle}
              placeholder="Till exempel Sätt på spärrgaller"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              value={title}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Förfallodatum (valfritt)</Text>
            <TextInput
              onChangeText={setDueDateInput}
              placeholder="ÅÅÅÅ-MM-DD (lämna tomt för idag)"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              value={dueDateInput}
            />
            <View style={styles.chipRow}>
              {[
                { label: 'Idag', offset: 0 },
                { label: '+3 dagar', offset: 3 },
                { label: '+7 dagar', offset: 7 },
              ].map((preset) => {
                const presetDate = formatOffsetIsoDate(preset.offset);
                const selected = dueDateInput.trim() === presetDate;
                return (
                  <Pressable
                    key={preset.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    hitSlop={6}
                    onPress={() => setDueDateInput(presetDate)}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{preset.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Anteckning (valfritt)</Text>
            <TextInput
              multiline
              numberOfLines={3}
              onChangeText={setDescription}
              placeholder="Detaljer eller påminnelse"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.inputMultiline}
              textAlignVertical="top"
              value={description}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Prioritet</Text>
            <View style={styles.chipRow}>
              {PRIORITY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setPriority(option)}
                  style={[styles.chip, priority === option && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, priority === option && styles.chipLabelActive]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {hives.length > 0 ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Kupa (valfritt)</Text>
              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => setSelectedHiveId(undefined)}
                  style={[styles.chip, !selectedHiveId && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, !selectedHiveId && styles.chipLabelActive]}>Ingen specifik</Text>
                </Pressable>
                {hives.map((hive) => (
                  <Pressable
                    key={hive.id}
                    onPress={() => setSelectedHiveId(hive.id)}
                    style={[styles.chip, selectedHiveId === hive.id && styles.chipActive]}
                  >
                    <Text style={[styles.chipLabel, selectedHiveId === hive.id && styles.chipLabelActive]}>{hive.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <View style={styles.formButtonsRow}>
            <PrimaryButton fullWidth label="Spara uppgift" onPress={handleCreateTask} />
          </View>
        </AppCard>
      ) : null}
      {recommendations.length ? (
        <View style={styles.sectionList}>
          <SectionHeader
            eyebrow="Beslutsstöd"
            title="Råd och signaler"
            description="Alla råd och rekommendationer visas här och kan följas upp med uppgifter."
          />
          <RecommendationSections
            recommendations={recommendations}
            getHiveName={(hiveId) => getHiveById(hiveId)?.name ?? 'Kupa'}
            getRelatedTaskLabel={(recommendation) => {
              const relatedTask = getRelatedTaskForRecommendation(recommendation, tasks);

              return relatedTask ? `${relatedTask.title} senast ${formatDateLabel(relatedTask.dueDate)}` : undefined;
            }}
          />
        </View>
      ) : null}
      {hasHives ? (
        <AppCard style={styles.priorityCard}>
          <Text style={theme.textStyles.heading}>Snabb överblick</Text>
          <Text style={theme.textStyles.body}>Överst ligger det som bör tas först. Längre ner ser du det som kan planeras senare.</Text>
          <View style={styles.summaryFacts}>
            <Text style={styles.summaryFact}>Bråttom nu: {groupedTasks.now.length}</Text>
            <Text style={styles.summaryFact}>Snart: {groupedTasks.soon.length}</Text>
            <Text style={styles.summaryFact}>Längre fram: {groupedTasks.later.length}</Text>
          </View>
        </AppCard>
      ) : (
        <EmptyStateCard
          title={hasApiaries ? 'Lägg till första kupan' : 'Lägg till första bigården'}
          description={
            hasApiaries
              ? 'Uppgifter blir relevanta när det finns kupor att följa upp. Lägg till första kupan för att komma vidare.'
              : 'Den här fliken fylls när du har lagt till en bigård och minst en kupa.'
          }
          actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'}
          onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')}
        />
      )}

      {tasks.length > 0 ? (
        <View style={styles.filterSection}>
          <TextInput
            clearButtonMode="while-editing"
            onChangeText={setSearchQuery}
            placeholder="Sök uppgift, kupa eller bigård..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={searchQuery}
          />
          <View style={styles.chipRow}>
            {SOURCE_FILTERS.map((filter) => {
              const selected = sourceFilter === filter;
              return (
                <Pressable
                  key={filter}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSourceFilter(filter)}
                  style={[styles.chip, selected && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{filter}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {filteredTasks.length ? (
        taskSections.map((section) => (
          <View key={section.key} style={styles.sectionList}>
            <SectionHeader title={section.title} description={section.description} />
            {section.items.map((task) => (
              <TaskCard
                key={task.id}
                hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : task.apiaryId ? getApiaryById(task.apiaryId)?.name : undefined}
                onDelete={task.source === 'Egen planering' ? () => void handleDeleteTask(task) : undefined}
                onToggleComplete={task.source === 'Egen planering' ? () => toggleTask(task.id) : undefined}
                task={task}
              />
            ))}
          </View>
        ))
      ) : tasks.length > 0 ? (
        <View style={styles.sectionList}>
          <EmptyStateCard
            title="Inga uppgifter matchar filtret"
            description="Prova att rensa söktexten eller byt källfilter."
            actionLabel="Visa alla uppgifter"
            onActionPress={() => {
              setSearchQuery('');
              setSourceFilter('Alla');
            }}
          />
        </View>
      ) : !completedManualTasks.length ? (
        <View style={styles.sectionList}>
          <EmptyStateCard
            title="Inga uppgifter ännu"
            description={hasHives ? 'När du loggar genomgångar visas sådant som behöver följas upp här, eller lägg till en egen uppgift ovan.' : 'När du har lagt till kupor och loggat genomgångar visas uppgifter här.'}
            actionLabel={hasHives ? 'Logga första genomgången' : undefined}
            onActionPress={hasHives && firstHive ? () => router.push(`/inspections/new?hiveId=${firstHive.id}`) : undefined}
          />
        </View>
      ) : null}

      {completedManualTasks.length ? (
        <View style={styles.sectionList}>
          <SectionHeader title="Slutförda uppgifter" description="Egna uppgifter som du har markerat som klara." />
          {completedManualTasks.map((task) => (
            <TaskCard
              key={task.id}
              hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : task.apiaryId ? getApiaryById(task.apiaryId)?.name : undefined}
              onDelete={() => void handleDeleteTask(task)}
              onToggleComplete={() => toggleTask(task.id)}
              task={task}
            />
          ))}
        </View>
      ) : null}
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
    filterSection: {
      gap: theme.spacing.sm,
    },
    createActionRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    formCard: {
      gap: theme.spacing.md,
    },
    fieldGroup: {
      gap: theme.spacing.xs,
    },
    label: {
      ...theme.textStyles.label,
      color: theme.colors.textMuted,
    },
    input: {
      minHeight: 48,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      ...theme.textStyles.body,
    },
    inputMultiline: {
      minHeight: 84,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      ...theme.textStyles.body,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    chip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    chipActive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accent,
    },
    chipLabel: {
      ...theme.textStyles.caption,
      color: theme.colors.text,
    },
    chipLabelActive: {
      color: theme.colors.surface,
      fontFamily: theme.fontFamilies.semibold,
    },
    formButtonsRow: {
      marginTop: theme.spacing.xs,
    },
  });
}