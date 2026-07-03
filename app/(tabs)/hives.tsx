import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { HiveCard } from '@/components/feature/Cards';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getApiaryDisplayLocation } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { theme } from '@/theme';

const hivePriorityOrder = { 'Behöver åtgärd': 0, 'Under uppbyggnad': 1, 'Stabilt': 2 } as const;

export default function HivesScreen() {
  const { apiaries, hives, getApiaryById } = useKupkoll();
  const themeValues = useTheme();
  const hasApiaries = apiaries.length > 0;

  const now = new Date();

  // Sortera kupor: status-prioritet → äldst sedan genomgång (eller ingen genomgång) överst
  const sortedHives = [...hives].sort((a, b) => {
    const priorityDiff =
      (hivePriorityOrder[a.status] ?? 2) - (hivePriorityOrder[b.status] ?? 2);

    if (priorityDiff !== 0) return priorityDiff;

    const daysA = a.lastInspectionAt
      ? (now.getTime() - new Date(a.lastInspectionAt).getTime()) / 86400000
      : Infinity;
    const daysB = b.lastInspectionAt
      ? (now.getTime() - new Date(b.lastInspectionAt).getTime()) / 86400000
      : Infinity;

    return daysB - daysA; // Äldst genomgång (störst antal dagar) överst
  });

  const needsActionCount = hives.filter((h) => h.status === 'Behöver åtgärd').length;
  const staleCount = hives.filter((h) => {
    if (!h.lastInspectionAt) return true;
    const days = (now.getTime() - new Date(h.lastInspectionAt).getTime()) / 86400000;
    return days > 14;
  }).length;

  const summaryParts = [
    needsActionCount > 0 ? `${needsActionCount} behöver åtgärd` : null,
    staleCount > 0 ? `${staleCount} ej genomgångna på 14+ dagar` : null,
  ].filter(Boolean);

  return (
    <Screen>
      <SectionHeader
        eyebrow="Kupor"
        title="Dina kupor"
        description="Lägg till kupa och nuvarande drottning. Därefter kan du logga genomgångar och händelser per kupa."
      />
      <PrimaryButton fullWidth label="Lägg till kupa" onPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
      {summaryParts.length > 0 ? (
        <View style={{ backgroundColor: themeValues.colors.surfaceMuted, borderRadius: 12, padding: 12 }}>
          <Text style={{ ...themeValues.textStyles.caption, color: themeValues.colors.textMuted }}>
            {summaryParts.join(' · ')}
          </Text>
        </View>
      ) : null}
      <View style={{ gap: theme.spacing.lg }}>
        {sortedHives.length ? (
          sortedHives.map((hive) => {
            const apiary = getApiaryById(hive.apiaryId);
            const apiaryLocation = getApiaryDisplayLocation(apiary);
            const apiaryLabel = apiaryLocation ? `${apiary?.name ?? 'Bigård'} · ${apiaryLocation}` : apiary?.name ?? 'Bigård';

            return <HiveCard key={hive.id} apiaryLabel={apiaryLabel} hive={hive} />;
          })
        ) : (
          <EmptyStateCard title={hasApiaries ? 'Inga kupor ännu' : 'Lägg till första bigården'} description={hasApiaries ? 'Lägg till din första kupa och fyll i aktuell drottning. Sedan kan du logga genomgångar och händelser.' : 'Varje kupa behöver höra till en bigård. Börja med att lägga till platsen där kuporna står.'} actionLabel={hasApiaries ? 'Lägg till första kupan' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
      </View>
    </Screen>
  );
}