import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { HiveCard } from '@/components/feature/Cards';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getApiaryDisplayLocation } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { HiveStatus } from '@/types/domain';

const hivePriorityOrder = { 'Behöver åtgärd': 0, 'Under uppbyggnad': 1, 'Stabilt': 2, 'Avslutad': 3 } as const;
const STATUS_FILTERS: ('Alla' | HiveStatus)[] = ['Alla', 'Behöver åtgärd', 'Stabilt', 'Under uppbyggnad', 'Avslutad'];

export default function HivesScreen() {
  const { apiaries, hives, getApiaryById } = useKupkoll();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const hasApiaries = apiaries.length > 0;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Alla' | HiveStatus>('Alla');

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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredHives = sortedHives.filter((hive) => {
    if (statusFilter !== 'Alla' && hive.status !== statusFilter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const apiary = getApiaryById(hive.apiaryId);
    const apiaryName = apiary?.name.toLowerCase() ?? '';
    const apiaryLocation = (getApiaryDisplayLocation(apiary) ?? '').toLowerCase();
    return (
      hive.name.toLowerCase().includes(normalizedQuery) ||
      apiaryName.includes(normalizedQuery) ||
      apiaryLocation.includes(normalizedQuery)
    );
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
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryText}>
            {summaryParts.join(' · ')}
          </Text>
        </View>
      ) : null}
      {hives.length > 0 ? (
        <View style={styles.filterSection}>
          <TextInput
            clearButtonMode="while-editing"
            onChangeText={setSearchQuery}
            placeholder="Sök kupa eller bigård..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
            value={searchQuery}
          />
          <View style={styles.chipRow}>
            {STATUS_FILTERS.map((filter) => {
              const selected = statusFilter === filter;
              return (
                <Pressable
                  key={filter}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setStatusFilter(filter)}
                  style={[styles.chip, selected && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{filter}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
      <View style={styles.list}>
        {filteredHives.length ? (
          filteredHives.map((hive) => {
            const apiary = getApiaryById(hive.apiaryId);
            const apiaryLocation = getApiaryDisplayLocation(apiary);
            const apiaryLabel = apiaryLocation ? `${apiary?.name ?? 'Bigård'} · ${apiaryLocation}` : apiary?.name ?? 'Bigård';

            return <HiveCard key={hive.id} apiaryLabel={apiaryLabel} hive={hive} />;
          })
        ) : hives.length > 0 ? (
          <EmptyStateCard
            title="Inga kupor matchar filtret"
            description="Prova att rensa söktexten eller byt statusfilter."
            actionLabel="Visa alla kupor"
            onActionPress={() => {
              setSearchQuery('');
              setStatusFilter('Alla');
            }}
          />
        ) : (
          <EmptyStateCard title={hasApiaries ? 'Inga kupor ännu' : 'Lägg till första bigården'} description={hasApiaries ? 'Lägg till din första kupa och fyll i aktuell drottning. Sedan kan du logga genomgångar och händelser.' : 'Varje kupa behöver höra till en bigård. Börja med att lägga till platsen där kuporna står.'} actionLabel={hasApiaries ? 'Lägg till första kupan' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
      </View>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    summaryBanner: {
      backgroundColor: theme.colors.surfaceMuted,
      borderRadius: 12,
      padding: 12,
    },
    summaryText: {
      ...theme.textStyles.caption,
      color: theme.colors.textMuted,
    },
    filterSection: {
      gap: theme.spacing.sm,
    },
    searchInput: {
      ...theme.textStyles.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    chip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceRaised,
    },
    chipActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    chipLabel: {
      ...theme.textStyles.caption,
      color: theme.colors.text,
    },
    chipLabelActive: {
      color: theme.colors.surfaceRaised,
      fontFamily: theme.fontFamilies.semibold,
    },
    list: {
      gap: theme.spacing.lg,
    },
  });
}