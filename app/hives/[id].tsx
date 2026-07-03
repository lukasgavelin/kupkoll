import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HiveEventSnapshot, InspectionSnapshot, TaskCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { confirmDestructiveAction } from '@/lib/confirm';
import { formatDateLabel, getApiaryDisplayLocation, getApiarySeasonLabel } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

function getQueenMarkingHex(color: string | undefined): string | undefined {
  switch (color) {
    case 'Vit': return '#FFFFFF';
    case 'Gul': return '#F5C518';
    case 'Röd': return '#E8312A';
    case 'Grön': return '#2DB84B';
    case 'Blå': return '#3B82F6';
    default: return undefined;
  }
}

export default function HiveDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { deleteHive, getHiveById, getApiaryById, getEventsForHive, getTasksForHive, latestInspectionMap } = useKupkoll();
  const hive = getHiveById(params.id);

  if (!hive) {
    return (
      <Screen>
        <AppCard>
          <Text style={theme.textStyles.heading}>Kupan hittades inte</Text>
          <PrimaryButton label="Tillbaka" onPress={() => router.back()} />
        </AppCard>
      </Screen>
    );
  }

  const hiveId = hive.id;
  const apiary = getApiaryById(hive.apiaryId);
  const apiaryLocation = getApiaryDisplayLocation(apiary);
  const latestInspection = latestInspectionMap[hive.id];
  const events = getEventsForHive(hive.id);
  const latestEvent = events[0];
  const tasks = getTasksForHive(hive.id);
  const queenHistory = [...hive.queenHistory].sort((left, right) => right.year.localeCompare(left.year));

  const queenColorHex = getQueenMarkingHex(hive.queenMarkingColor);
  const now = new Date();
  const season = apiary ? getApiarySeasonLabel(apiary, now) : undefined;
  
  const queenAge = hive.queenYear && /^\d{4}$/.test(hive.queenYear)
    ? now.getFullYear() - Number(hive.queenYear)
    : undefined;

  const queenWarnings: string[] = [];
  if (queenAge !== undefined && queenAge >= 2) {
    queenWarnings.push(`Drottningen är ${queenAge} år gammal – äldre drottningar har högre svärmrisk.`);
  }
  if (hive.queenStatus !== 'Bekräftad' && season && season !== 'Vinterro' && season !== 'Vintertillsyn') {
    queenWarnings.push(`Osäker drottningstatus under aktiv säsong (${season.toLowerCase()}).`);
  }

  async function confirmDelete() {
    const shouldDelete = await confirmDestructiveAction({
      title: 'Ta bort kupa?',
      message: 'Kupan tas bort tillsammans med sparade genomgångar, händelser och manuella uppgifter.',
      confirmLabel: 'Ta bort',
    });

    if (!shouldDelete) {
      return;
    }

    deleteHive(hiveId);
    router.replace('/hives');
  }

  return (
    <Screen>
      <PageHeader
        actionLabel="Tillbaka"
        actionIconName="chevron-back"
        onActionPress={() => router.back()}
        eyebrow="Kupa"
        title={hive.name}
        description={apiary ? `${apiary.name}${apiaryLocation ? ` · ${apiaryLocation}` : ''} · ${hive.lastInspectionAt ? `Senast genomgången ${formatDateLabel(hive.lastInspectionAt)}` : 'Ingen genomgång ännu'}` : undefined}
      />

      <AppCard>
        <View style={styles.metaGrid}>
          <MetaItem label="Status" value={hive.status} />
          <MetaItem label="Samhällsstyrka" value={hive.strength} />
          <MetaItem label="Temperament" value={hive.temperament} />
          <MetaItem label="Kupsystem" value={hive.boxSystem} />
        </View>
        <Text style={theme.textStyles.body}>{hive.notes}</Text>
        <PrimaryButton label="Ny genomgång" onPress={() => router.push(`/inspections/new?hiveId=${hiveId}`)} />
        <PrimaryButton label="Ny händelse" onPress={() => router.push(`/events/new?hiveId=${hiveId}` as never)} variant="secondary" />
      </AppCard>

      <SectionHeader eyebrow="Drottning" title="Nuvarande drottning och historik" />
      <AppCard>
        <View style={styles.metaGrid}>
          <MetaItem label="Drottningstatus" value={hive.queenStatus} />
          <MetaItem label="Drottningens år" value={hive.queenYear ?? 'Inte angivet'} />
          <MetaItem colorHex={queenColorHex} label="Märkningsfärg" value={hive.queenMarkingColor ?? 'Inte angivet'} />
          <MetaItem label="Ursprung" value={hive.queenOrigin ?? 'Inte angivet'} />
          <MetaItem label="Införd" value={hive.queenIntroducedAt ? formatDateLabel(hive.queenIntroducedAt) : 'Inte angivet'} />
        </View>
        {queenWarnings.length > 0 ? (
          <View style={styles.warningsContainer}>
            {queenWarnings.map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Text style={styles.warningText}>⚠️ {warning}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {queenHistory.length ? (
          <View style={styles.queenHistoryList}>
            {queenHistory.map((entry) => (
              <View key={entry.id} style={styles.queenHistoryItem}>
                <Text style={theme.textStyles.bodyStrong}>{entry.year}</Text>
                <Text style={theme.textStyles.body}>{entry.note}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={theme.textStyles.caption}>Ingen drottninghistorik sparad ännu. Lägg till byten eller milstolpar när du redigerar kupan.</Text>
        )}
        <PrimaryButton fullWidth label="Logga drottningbyte" onPress={() => router.push(`/events/new?hiveId=${hiveId}&type=Drottning bytt` as never)} />
      </AppCard>

      <SectionHeader eyebrow="Historik" title="Senaste noteringar" />
      {latestInspection || latestEvent ? (
        <View style={styles.sectionList}>
          {latestEvent ? <HiveEventSnapshot event={latestEvent} /> : null}
          {latestInspection ? <InspectionSnapshot inspection={latestInspection} /> : null}
          <PrimaryButton label="Öppna historik" onPress={() => router.push(`/hives/${hiveId}/inspections`)} variant="secondary" />
          <PrimaryButton label="Visa trender & analys" onPress={() => router.push(`/hives/${hiveId}/trends`)} variant="secondary" />
        </View>
      ) : (
        <EmptyStateCard title="Ingen historik ännu" description="När du loggar första genomgången eller händelsen visas den här." />
      )}

      <SectionHeader eyebrow="Att göra" title="Saker kopplade till den här kupan" />
      <View style={styles.sectionList}>
        {tasks.length ? tasks.map((task) => <TaskCard key={task.id} hiveName={hive.name} task={task} />) : <EmptyStateCard title="Inga uppgifter ännu" description="När något behöver följas upp i den här kupan visas det här." />}
      </View>

      <SectionHeader eyebrow="Hantera" title="Administrera kupan" />
      <View style={styles.sectionList}>
        <PrimaryButton fullWidth label="Redigera kupa" onPress={() => router.push(`/hives/${hiveId}/edit`)} variant="secondary" />
        <PrimaryButton fullWidth label="Ta bort kupa" onPress={confirmDelete} variant="ghost" />
      </View>
    </Screen>
  );
}

function MetaItem({ label, value, colorHex }: { label: string; value: string; colorHex?: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={theme.textStyles.caption}>{label}</Text>
      <View style={styles.metaValueRow}>
        {colorHex ? (
          <View style={[styles.colorDot, { backgroundColor: colorHex, borderColor: theme.colors.border }]} />
        ) : null}
        <Text style={theme.textStyles.bodyStrong}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  metaItem: {
    width: '47%',
    gap: theme.spacing.xs,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  warningsContainer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  warningItem: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
  },
  warningText: {
    ...theme.textStyles.caption,
    color: theme.colors.text,
  },
  sectionList: {
    gap: theme.spacing.lg,
  },
  queenHistoryList: {
    gap: theme.spacing.md,
  },
  queenHistoryItem: {
    gap: theme.spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
});