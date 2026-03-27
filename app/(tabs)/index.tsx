import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { InspectionSnapshot, StatCard, TaskCard } from '@/components/feature/Cards';
import { RecommendationSections } from '@/components/feature/RecommendationSections';
import { SeasonStatusCard } from '@/components/feature/SeasonStatusCard';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { filterRecommendationsWithoutTask, sortRecommendations } from '@/lib/recommendations';
import { formatDateTimeLabel, getSeasonStatus } from '@/lib/selectors';
import { applySeasonTipSelection, getSeasonTipSelection, SeasonTipSelection } from '@/lib/seasonTipRotation';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const { dashboard, hives, apiaries, recommendations, tasks, getHiveById } = useKupkoll();
  const [seasonDate, setSeasonDate] = useState(() => new Date());
  const [seasonTipSelection, setSeasonTipSelection] = useState<SeasonTipSelection>({
    focusStartIndex: 0,
    watchStartIndex: 0,
  });
  const styles = createStyles(theme);
  const quickHive = hives[0];
  const baseSeasonStatus = useMemo(() => getSeasonStatus(seasonDate, apiaries), [seasonDate, apiaries]);
  const seasonStatus = useMemo(() => applySeasonTipSelection(baseSeasonStatus, seasonTipSelection), [baseSeasonStatus, seasonTipSelection]);
  const prioritizedRecommendations = useMemo(
    () => sortRecommendations(filterRecommendationsWithoutTask(recommendations, tasks)).slice(0, 4),
    [recommendations, tasks],
  );
  const hasApiaries = apiaries.length > 0;
  const hasHives = hives.length > 0;
  const nextTask = tasks[0];
  const nextRecommendation = prioritizedRecommendations[0];
  const latestInspection = dashboard.latestInspections[0];
  const latestInspectionHiveName = latestInspection ? getHiveById(latestInspection.hiveId)?.name ?? 'Kupa' : undefined;
  const focusLines = [
    nextTask ? `Gör först: ${nextTask.title}` : null,
    nextRecommendation ? `Håll koll: ${nextRecommendation.title}` : null,
    latestInspection && latestInspectionHiveName ? `Senast: ${latestInspectionHiveName} genomgången ${formatDateTimeLabel(latestInspection.performedAt)}` : null,
  ].filter((item): item is string => Boolean(item));
  const heroText = quickHive
    ? nextTask
      ? 'Börja med det som ligger överst i arbetslistan. Längre ned ser du sådant som ger sammanhang inför nästa besök.'
      : nextRecommendation
        ? 'Du har inget direkt att göra just nu, men här ser du vad som kan vara bra att ha med sig till nästa besök.'
        : 'Läget ser lugnt ut just nu. Här under kan du gå vidare till senaste genomgångar och säsongsläget.'
    : hasApiaries
      ? 'Börja med att lägga till din första kupa och fyll i aktuell drottning. Sedan blir det tydligt att logga genomgångar och senare drottningbyte från kupans vy.'
      : 'Börja med att lägga till din första bigård. Därefter lägger du till kupor och kan sedan logga händelser som drottningbyte i rätt ordning.';

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const selection = await getSeasonTipSelection(baseSeasonStatus, seasonDate);

      if (!cancelled) {
        setSeasonTipSelection(selection);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [baseSeasonStatus, seasonDate]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setSeasonDate(new Date());
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Screen>
      <AppCard style={styles.heroCard}>
        <Text style={theme.textStyles.overline}>Hem</Text>
        <Text style={theme.textStyles.display}>Det viktigaste just nu.</Text>
        <Text style={styles.heroText}>{heroText}</Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaCard}>
            <Text style={theme.textStyles.overline}>Att göra nu</Text>
            <Text style={styles.heroMetaValue}>{dashboard.upcomingTaskCount}</Text>
          </View>
          <View style={styles.heroMetaCard}>
            <Text style={theme.textStyles.overline}>Behöver kollas</Text>
            <Text style={styles.heroMetaValue}>{dashboard.criticalCount}</Text>
          </View>
        </View>
        {focusLines.length ? (
          <View style={styles.heroChecklist}>
            {focusLines.map((line) => (
              <View key={line} style={styles.heroChecklistRow}>
                <View style={styles.heroChecklistDot} />
                <Text style={styles.heroChecklistText}>{line}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {quickHive ? <PrimaryButton label="Logga genomgång" onPress={() => router.push(`/inspections/new?hiveId=${quickHive.id}`)} /> : <PrimaryButton label={hasApiaries ? 'Lägg till första kupan' : 'Lägg till första bigården'} onPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />}
      </AppCard>

      <SectionHeader eyebrow="Gör först" title="Det här väntar på dig" description="Här ligger konkreta nästa steg som är värda att planera eller göra först." />
      <View style={styles.sectionList}>
        {tasks.length ? (
          tasks.slice(0, 3).map((task) => (
            <TaskCard key={task.id} hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : apiaries.find((item) => item.id === task.apiaryId)?.name} task={task} />
          ))
        ) : (
          <EmptyStateCard
            title="Inget att göra ännu"
            description={hasHives ? 'Du har ännu inget som kräver uppföljning. Om du vill få bättre guidning härnäst kan du logga en genomgång på en kupa.' : 'När du börjar lägga in kupor och genomgångar samlas dina nästa steg här.'}
            actionLabel={hasHives ? 'Logga genomgång' : hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'}
            onActionPress={() => router.push(hasHives && quickHive ? `/inspections/new?hiveId=${quickHive.id}` : hasApiaries ? '/hives/new' : '/apiaries/new')}
          />
        )}
      </View>

      {prioritizedRecommendations.length ? (
        <>
          <SectionHeader eyebrow="Ha med dig" title="Det här är bra att känna till" description="Här syns råd och lägesbilder som ger sammanhang, men som inte redan ligger som uppgift." />
          <View style={styles.sectionList}>
            <RecommendationSections recommendations={prioritizedRecommendations} getHiveName={(hiveId) => getHiveById(hiveId)?.name ?? 'Kupa'} />
          </View>
        </>
      ) : null}

      <SectionHeader eyebrow="Senast" title="Senaste genomgångar" description="Använd den här delen för att minnas vad du såg vid senaste besöken." />
      <View style={styles.sectionList}>
        {dashboard.latestInspections.length ? (
          dashboard.latestInspections.map((inspection) => <InspectionSnapshot key={inspection.id} inspection={inspection} />)
        ) : (
          <EmptyStateCard
            title="Inga genomgångar ännu"
            description={hasHives ? 'Du har kupor på plats men ännu ingen sparad genomgång. Logga den första så blir både historik, råd och uppgifter mer träffsäkra.' : 'När du sparar din första genomgång visas den här, så att du lätt kan minnas vad du såg sist.'}
            actionLabel={hasHives ? 'Logga första genomgången' : hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'}
            onActionPress={() => router.push(hasHives && quickHive ? `/inspections/new?hiveId=${quickHive.id}` : hasApiaries ? '/hives/new' : '/apiaries/new')}
          />
        )}
      </View>

      <SectionHeader eyebrow="Säsong" title="Säsongsläge just nu" description="Här får du bakgrunden till varför vissa saker är viktigare just nu än andra." />
      <SeasonStatusCard status={seasonStatus} />

      <SectionHeader title="Översikt" description="En sammanfattning av läget när du vill orientera dig i hela biodlingen." />
      <View style={styles.grid}>
        <StatCard label="Kupor" value={String(dashboard.hiveCount)} />
        <StatCard label="Bigårdar" value={String(dashboard.apiaryCount)} />
        <StatCard label="Kommande uppgifter" value={String(dashboard.upcomingTaskCount)} />
        <StatCard label="Varningsflaggor" value={String(dashboard.criticalCount)} />
      </View>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.borderStrong,
    },
    heroText: {
      ...theme.textStyles.body,
      color: theme.colors.textMuted,
      maxWidth: 620,
    },
    heroChecklist: {
      gap: theme.spacing.sm,
    },
    heroChecklistRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
    },
    heroChecklistDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      marginTop: 7,
    },
    heroChecklistText: {
      ...theme.textStyles.bodyStrong,
      color: theme.colors.text,
      flex: 1,
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
}