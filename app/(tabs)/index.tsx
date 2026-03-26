import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { InspectionSnapshot, StatCard, TaskCard } from '@/components/feature/Cards';
import { RecommendationSections } from '@/components/feature/RecommendationSections';
import { SeasonStatusCard } from '@/components/feature/SeasonStatusCard';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { sortRecommendations } from '@/lib/recommendations';
import { formatDateTimeLabel, getSeasonStatus } from '@/lib/selectors';
import { fetchSeasonWeatherSignal, InspectionWeatherSnapshot } from '@/lib/weather';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function HomeScreen() {
  const { dashboard, hives, apiaries, recommendations, tasks, getHiveById } = useKupkoll();
  const [seasonWeather, setSeasonWeather] = useState<InspectionWeatherSnapshot | undefined>(undefined);
  const quickHive = hives[0];
  const primaryApiary = useMemo(() => apiaries.find((apiary) => apiary.coordinates) ?? apiaries[0], [apiaries]);
  const seasonStatus = getSeasonStatus(new Date(), apiaries, seasonWeather);
  const prioritizedRecommendations = sortRecommendations(recommendations).slice(0, 4);
  const hasApiaries = apiaries.length > 0;
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
      ? 'Börja med det som ligger överst i arbetslistan. Därefter ser du vad som nyligen hänt och vad säsongen talar för just nu.'
      : nextRecommendation
        ? 'Du har inget direkt i arbetslistan just nu, men här ser du vad som är klokt att hålla koll på vid nästa besök.'
        : 'Läget ser lugnt ut just nu. Här under kan du snabbt gå vidare till senaste genomgångar och säsongsläget.'
    : 'Börja med att lägga till en bigård eller en kupa. Sedan fylls Hem med nästa steg, senaste noteringar och säsongsläge.';

  useEffect(() => {
    let cancelled = false;
    const coordinates = primaryApiary?.coordinates;

    if (!coordinates) {
      setSeasonWeather(undefined);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const signal = await fetchSeasonWeatherSignal(coordinates);

        if (!cancelled) {
          setSeasonWeather(signal);
        }
      } catch {
        if (!cancelled) {
          setSeasonWeather(undefined);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [primaryApiary?.coordinates?.latitude, primaryApiary?.coordinates?.longitude, primaryApiary?.id]);

  return (
    <Screen>
      <AppCard style={styles.heroCard}>
        <Text style={theme.textStyles.overline}>Hem</Text>
        <Text style={theme.textStyles.display}>Nästa steg idag.</Text>
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

      <SectionHeader eyebrow="I dag" title="Närmast att göra" description="Börja här om du vill få en snabb arbetsordning för det som ligger närmast i tiden." />
      <View style={styles.sectionList}>
        {tasks.length ? (
          tasks.slice(0, 3).map((task) => (
            <TaskCard key={task.id} hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : apiaries.find((item) => item.id === task.apiaryId)?.name} task={task} />
          ))
        ) : (
          <EmptyStateCard title="Inget att göra ännu" description="När du börjar lägga in kupor och genomgångar samlas dina nästa steg här." actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
      </View>

      <SectionHeader eyebrow="Kolla upp" title="Bra att hålla ögonen på" description="Här syns sådant som kan vara klokt att ta med sig till nästa besök i bigården." />
      <View style={styles.sectionList}>
        {prioritizedRecommendations.length ? (
          <RecommendationSections recommendations={prioritizedRecommendations} getHiveName={(hiveId) => getHiveById(hiveId)?.name ?? 'Kupa'} />
        ) : (
          <EmptyStateCard title="Inget särskilt att följa upp" description="När du har lagt till kupor och gjort genomgångar lyfts sådant fram här som kan vara bra att titta närmare på." actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
      </View>

      <SectionHeader eyebrow="Senast" title="Senaste genomgångar" description="Använd den här delen för att snabbt minnas vad du såg vid senaste besöken." />
      <View style={styles.sectionList}>
        {dashboard.latestInspections.length ? (
          dashboard.latestInspections.map((inspection) => <InspectionSnapshot key={inspection.id} inspection={inspection} />)
        ) : (
          <EmptyStateCard title="Inga genomgångar ännu" description="När du sparar din första genomgång visas den här, så att du lätt kan minnas vad du såg sist." actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
      </View>

      <SectionHeader eyebrow="Säsong" title="Säsongsläge just nu" description="Här får du bakgrunden till varför vissa saker är viktigare just nu än andra." />
      <SeasonStatusCard status={seasonStatus} />

      <SectionHeader title="Översikt" description="En snabb sammanfattning av läget när du vill orientera dig i hela biodlingen." />
      <View style={styles.grid}>
        <StatCard label="Kupor" value={String(dashboard.hiveCount)} />
        <StatCard label="Bigårdar" value={String(dashboard.apiaryCount)} />
        <StatCard label="Kommande uppgifter" value={String(dashboard.upcomingTaskCount)} />
        <StatCard label="Varningsflaggor" value={String(dashboard.criticalCount)} />
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