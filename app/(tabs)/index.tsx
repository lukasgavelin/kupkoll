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
import { getSeasonLabel, getSeasonStatus } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function HomeScreen() {
  const { dashboard, hives, apiaries, recommendations, tasks, getHiveById } = useKupkoll();
  const quickHive = hives[0];
  const season = getSeasonLabel();
  const seasonStatus = getSeasonStatus(new Date(), apiaries);
  const prioritizedRecommendations = sortRecommendations(recommendations).slice(0, 4);
  const hasApiaries = apiaries.length > 0;

  return (
    <Screen>
      <SeasonStatusCard status={seasonStatus} />

      <AppCard style={styles.heroCard}>
        <Text style={theme.textStyles.overline}>Kupkoll · {season}</Text>
        <Text style={theme.textStyles.display}>Det viktigaste i din biodling just nu.</Text>
        <Text style={styles.heroText}>
          {quickHive
            ? 'Här ser du snabbt vad som behöver följas upp, vad som är på gång och var du senast var i arbetet med kuporna.'
            : 'Börja med att lägga till en bigård eller en kupa. Sedan fylls startsidan med översikt, påminnelser och dina senaste noteringar.'}
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaCard}>
            <Text style={theme.textStyles.overline}>Varningar</Text>
            <Text style={styles.heroMetaValue}>{dashboard.criticalCount}</Text>
          </View>
          <View style={styles.heroMetaCard}>
            <Text style={theme.textStyles.overline}>Att göra</Text>
            <Text style={styles.heroMetaValue}>{dashboard.upcomingTaskCount}</Text>
          </View>
        </View>
        {quickHive ? <PrimaryButton label="Logga genomgång" onPress={() => router.push(`/inspections/new?hiveId=${quickHive.id}`)} /> : <PrimaryButton label={hasApiaries ? 'Lägg till första kupan' : 'Lägg till första bigården'} onPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />}
      </AppCard>

      <SectionHeader title="Översikt" description="En snabb sammanfattning av läget, så att du ser var du ska börja." />
      <View style={styles.grid}>
        <StatCard label="Kupor" value={String(dashboard.hiveCount)} />
        <StatCard label="Bigårdar" value={String(dashboard.apiaryCount)} />
        <StatCard label="Kommande uppgifter" value={String(dashboard.upcomingTaskCount)} />
        <StatCard label="Varningsflaggor" value={String(dashboard.criticalCount)} />
      </View>

      <SectionHeader eyebrow="Råd" title="Saker att hålla koll på" description="Här samlas råd utifrån dina senaste genomgångar och var i säsongen du befinner dig." />
      <View style={styles.sectionList}>
        {prioritizedRecommendations.length ? (
          <RecommendationSections recommendations={prioritizedRecommendations} getHiveName={(hiveId) => getHiveById(hiveId)?.name ?? 'Kupa'} />
        ) : (
          <EmptyStateCard title="Inga råd ännu" description="När du har lagt till kupor och gjort din första genomgång får du råd här om vad som kan vara bra att följa upp." actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
      </View>

      <SectionHeader eyebrow="Att göra" title="Närmast på tur" />
      <View style={styles.sectionList}>
        {tasks.length ? (
          tasks.slice(0, 3).map((task) => (
            <TaskCard key={task.id} hiveName={task.hiveId ? getHiveById(task.hiveId)?.name : apiaries.find((item) => item.id === task.apiaryId)?.name} task={task} />
          ))
        ) : (
          <EmptyStateCard title="Inget att göra ännu" description="När du börjar lägga in kupor och genomgångar samlas dina nästa steg här." actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
      </View>

      <SectionHeader eyebrow="Senast" title="Senaste genomgångar" />
      <View style={styles.sectionList}>
        {dashboard.latestInspections.length ? (
          dashboard.latestInspections.map((inspection) => <InspectionSnapshot key={inspection.id} inspection={inspection} />)
        ) : (
          <EmptyStateCard title="Inga genomgångar ännu" description="När du sparar din första genomgång visas den här, så att du lätt kan minnas vad du såg sist." actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
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