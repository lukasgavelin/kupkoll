import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getRecommendationKindLabel } from '@/lib/recommendations';
import { formatDateLabel, formatDateTimeLabel, getApiaryDisplayLocation } from '@/lib/selectors';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { Apiary, Hive, HiveEvent, Inspection, Recommendation, Task } from '@/types/domain';

function getTaskSourceLabel(source: Task['source']) {
  return source === 'Beslutsstöd' ? 'Föreslaget från dina senaste noteringar' : 'Egen planering';
}

function getRecommendationSeverityLabel(recommendation: Recommendation) {
  if (recommendation.severity === 'critical') {
    return 'Risk';
  }

  if (recommendation.severity === 'warning') {
    return recommendation.kind === 'alert' ? 'Var uppmärksam' : 'Håll koll';
  }

  return 'Bra att veta';
}

function formatInspectionWeather(inspection: Inspection) {
  if (!inspection.weather) {
    return null;
  }

  const segments = [
    inspection.weather.condition,
    inspection.weather.wind,
    inspection.weather.temperatureC !== undefined ? `${inspection.weather.temperatureC} °C` : undefined,
  ].filter(Boolean);

  return segments.length ? segments.join(' · ') : null;
}

function getAdvancedInspectionLabels(inspection: Inspection) {
  if (!inspection.advancedDetails) {
    return [];
  }

  const labels = [
    inspection.advancedDetails.honeySuperOn !== undefined ? `Skattlåda ${inspection.advancedDetails.honeySuperOn ? 'på' : 'av'}` : undefined,
    inspection.advancedDetails.splitMade !== undefined ? `Avläggare ${inspection.advancedDetails.splitMade ? 'gjord' : 'ej gjord'}` : undefined,
    inspection.advancedDetails.queenChangeStatus ? `Drottningbyte ${inspection.advancedDetails.queenChangeStatus.toLowerCase()}` : undefined,
  ].filter((label): label is string => Boolean(label));

  if (inspection.advancedDetails.treatment) {
    labels.push(`Åtgärd under besöket: ${inspection.advancedDetails.treatment}`);
  }

  if (inspection.advancedDetails.feeding) {
    labels.push(`Utfodring: ${inspection.advancedDetails.feeding}`);
  }

  return labels;
}

function getVarroaDetailLabels(inspection: Inspection) {
  if (!inspection.varroaDetails?.checked) {
    return [];
  }

  const labels = [
    inspection.varroaDetails.controlMethod ? `Varroametod: ${inspection.varroaDetails.controlMethod}` : undefined,
    inspection.varroaDetails.measurementValue ? `Mätvärde: ${inspection.varroaDetails.measurementValue}` : undefined,
    inspection.varroaDetails.treatmentPerformed !== undefined ? `Behandling ${inspection.varroaDetails.treatmentPerformed ? 'utförd' : 'ej utförd'}` : undefined,
  ].filter((label): label is string => Boolean(label));

  return labels;
}

function getHiveEventTone(event: HiveEvent) {
  if (event.type === 'Vinterförlust' || event.type === 'Samhälle dött/avvecklat') {
    return 'critical' as const;
  }

  if (
    event.type === 'Samhälle förenat' ||
    event.type === 'Invintring startad' ||
    event.type === 'Invintring slutförd' ||
    event.type === 'Varroabehandling'
  ) {
    return 'warning' as const;
  }

  if (event.type === 'Rensningsflyg observerad' || event.type === 'Skattning/slungning') {
    return 'calm' as const;
  }

  return 'info' as const;
}

function getHiveEventDetailLabels(event: HiveEvent) {
  if (!event.details) {
    return [];
  }

  const labels = [
    event.details.mergedWithHiveName ? `Förenat med: ${event.details.mergedWithHiveName}` : undefined,
    event.details.queenYear ? `Årgång: ${event.details.queenYear}` : undefined,
    event.details.queenMarkingColor ? `Märkningsfärg: ${event.details.queenMarkingColor}` : undefined,
    event.details.queenOrigin ? `Ursprung: ${event.details.queenOrigin}` : undefined,
    event.details.queenIntroducedAt ? `Införd: ${formatDateLabel(event.details.queenIntroducedAt)}` : undefined,
    event.details.queenStatus ? `Drottningstatus: ${event.details.queenStatus}` : undefined,
    event.details.queenHistoryNote ? `Historik: ${event.details.queenHistoryNote}` : undefined,
    event.details.markingNote ? `Märkning: ${event.details.markingNote}` : undefined,
    event.details.honeySuperCount !== undefined ? `Skattlådor: ${event.details.honeySuperCount}` : undefined,
    event.details.harvestSummary ? `Skattning: ${event.details.harvestSummary}` : undefined,
    event.details.feedingSummary ? `Stödfodring: ${event.details.feedingSummary}` : undefined,
  ].filter((label): label is string => Boolean(label));

  return labels;
}

function getZoneBadgeLabel(apiary: Apiary) {
  const zone = apiary.locationDetails?.zone;

  if (zone === 'nord') {
    return 'Zon nord';
  }

  if (zone === 'syd') {
    return 'Zon syd';
  }

  if (zone === 'mellan') {
    return 'Zon mellan';
  }

  return undefined;
}

export function StatCard({ value, label, onPress }: { value: string; label: string; onPress?: () => void }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (!onPress) {
    return (
      <AppCard style={styles.statCard}>
        <Text style={theme.textStyles.overline}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </AppCard>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.statPressable, pressed && styles.pressed]}
    >
      <AppCard style={styles.statCard}>
        <Text style={theme.textStyles.overline}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </AppCard>
    </Pressable>
  );
}

export function ApiaryCard({ apiary, hiveCount }: { apiary: Apiary; hiveCount: number }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const displayLocation = getApiaryDisplayLocation(apiary);
  const locationSourceLabel = apiary.locationDetails?.source === 'manual' ? 'Manuell plats' : apiary.locationDetails?.source === 'auto' ? 'Auto-plats' : undefined;
  const zoneLabel = getZoneBadgeLabel(apiary);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Bigård: ${apiary.name}. ${hiveCount} kupor. ${displayLocation}.`}
      accessibilityHint="Dubbelklicka för att öppna bigårdens detaljer"
      onPress={() => router.push(`/apiaries/${apiary.id}`)}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <AppCard>
        <View style={styles.rowBetween}>
          <View style={styles.textColumn}>
            <Text style={theme.textStyles.heading}>{apiary.name}</Text>
            <Text style={theme.textStyles.caption}>{displayLocation}</Text>
          </View>
          <StatusBadge label={`${hiveCount} kupor`} tone="calm" />
        </View>
        <View style={styles.inlineWrap}>
          {locationSourceLabel ? <StatusBadge label={locationSourceLabel} tone={apiary.locationDetails?.source === 'manual' ? 'info' : 'calm'} /> : null}
          {zoneLabel ? <StatusBadge label={zoneLabel} tone="warning" /> : null}
        </View>
        <Text style={theme.textStyles.body}>{apiary.notes}</Text>
      </AppCard>
    </Pressable>
  );
}

/** Konverterar märkningsfärg till hex-färg för visuell representation. */
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

export function HiveCard({ hive, apiaryLabel }: { hive: Hive; apiaryLabel: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const statusTone = hive.status === 'Behöver åtgärd' ? 'critical' : hive.status === 'Under uppbyggnad' ? 'warning' : 'calm';
  const queenColorHex = getQueenMarkingHex(hive.queenMarkingColor);

  const now = new Date();
  const daysSince = hive.lastInspectionAt
    ? Math.floor((now.getTime() - new Date(hive.lastInspectionAt).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  const daysBadgeTone = daysSince === undefined ? 'info' : daysSince > 14 ? 'critical' : daysSince > 7 ? 'warning' : 'calm';
  const daysBadgeLabel = daysSince === undefined
    ? 'Ej genomgången'
    : daysSince === 0
      ? 'Genomgången idag'
      : `${daysSince} dagar sedan`;

  const queenSegments = [
    `Drottning: ${hive.queenStatus}`,
    hive.queenYear ? `Årgång ${hive.queenYear}` : undefined,
  ].filter((segment): segment is string => Boolean(segment));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Kupa: ${hive.name}. Status: ${hive.status}. ${queenSegments.join(', ')}.`}
      accessibilityHint="Dubbelklicka för att öppna kupans detaljer"
      onPress={() => router.push(`/hives/${hive.id}`)}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <AppCard>
        <View style={styles.rowBetween}>
          <View style={styles.textColumn}>
            <Text style={theme.textStyles.heading}>{hive.name}</Text>
            <Text style={theme.textStyles.caption}>{apiaryLabel}</Text>
          </View>
          <View style={styles.badgeColumn}>
            <StatusBadge label={hive.status} tone={statusTone} />
            <StatusBadge label={daysBadgeLabel} tone={daysBadgeTone} />
          </View>
        </View>
        <View style={styles.inlineWrap}>
          {queenColorHex ? (
            <View style={[styles.queenColorDot, { backgroundColor: queenColorHex, borderColor: theme.colors.border }]} />
          ) : null}
          <Text style={theme.textStyles.caption}>{queenSegments.join(' · ')}</Text>
        </View>
        <View style={styles.inlineWrap}>
          <Text style={theme.textStyles.caption}>Styrka: {hive.strength}</Text>
          <Text style={theme.textStyles.caption}>Temperament: {hive.temperament}</Text>
          <Text style={theme.textStyles.caption}>Kupsystem: {hive.boxSystem}</Text>
        </View>
      </AppCard>
    </Pressable>
  );
}

export function TaskCard({
  task,
  hiveName,
  onToggleComplete,
  onDelete,
}: {
  task: Task;
  hiveName?: string;
  onToggleComplete?: () => void;
  onDelete?: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tone = task.priority === 'Hög' ? 'critical' : task.priority === 'Medel' ? 'warning' : 'info';

  function handleLogNow() {
    if (!task.hiveId) {
      router.push('/inspections/new');
      return;
    }

    // Varroauppgifter skickas till händelsevyn med rätt förifylld typ
    if (task.id.startsWith('varroa')) {
      router.push(`/events/new?hiveId=${task.hiveId}&type=${encodeURIComponent('Uppföljande varroamätning')}` as never);
      return;
    }

    // Drottning- och genomgångsuppgifter går till genomgångsformuläret
    router.push(`/inspections/new?hiveId=${task.hiveId}` as never);
  }

  return (
    <AppCard style={task.completed ? styles.completedTaskCard : undefined}>
      <View style={styles.rowBetween}>
        <View style={styles.textColumn}>
          <Text style={[theme.textStyles.heading, task.completed && styles.completedTitle]}>{task.title}</Text>
          <Text style={theme.textStyles.caption}>Planera senast {formatDateLabel(task.dueDate)}</Text>
        </View>
        <StatusBadge label={task.completed ? 'Klar' : task.priority} tone={task.completed ? 'calm' : tone} />
      </View>
      {hiveName ? <Text style={theme.textStyles.caption}>{hiveName}</Text> : null}
      {task.description.trim() ? <Text style={theme.textStyles.body}>{task.description}</Text> : null}
      <Text style={theme.textStyles.caption}>{getTaskSourceLabel(task.source)}</Text>
      {task.source === 'Beslutsstöd' ? (
        <Pressable
          onPress={handleLogNow}
          style={({ pressed }) => [styles.logNowButton, pressed && styles.pressed]}
        >
          <Text style={styles.logNowLabel}>Logga nu →</Text>
        </Pressable>
      ) : null}
      {task.source === 'Egen planering' && (onToggleComplete || onDelete) ? (
        <View style={styles.taskActionsRow}>
          {onToggleComplete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={task.completed ? `Återöppna uppgift ${task.title}` : `Markera ${task.title} som klar`}
              onPress={onToggleComplete}
              style={({ pressed }) => [styles.taskActionButton, pressed && styles.pressed]}
            >
              <Ionicons
                color={task.completed ? theme.colors.success : theme.colors.text}
                name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
              />
              <Text style={styles.taskActionLabel}>{task.completed ? 'Återöppna' : 'Markera klar'}</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ta bort uppgift ${task.title}`}
              onPress={onDelete}
              style={({ pressed }) => [styles.taskActionButton, styles.deleteActionButton, pressed && styles.pressed]}
            >
              <Ionicons color={theme.colors.danger} name="trash-outline" size={16} />
              <Text style={styles.deleteActionLabel}>Ta bort</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

export function RecommendationCard({ recommendation, hiveName, relatedTaskLabel }: { recommendation: Recommendation; hiveName: string; relatedTaskLabel?: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const label = getRecommendationSeverityLabel(recommendation);
  const kindTone = recommendation.kind === 'alert' ? recommendation.severity : recommendation.kind === 'seasonal' ? 'calm' : 'info';

  return (
    <AppCard style={[styles.recommendationCard, recommendation.kind === 'alert' && styles.recommendationCardAlert, recommendation.kind === 'seasonal' && styles.recommendationCardSeasonal]}>
      <View style={styles.rowBetween}>
        <View style={styles.textColumn}>
          <Text style={theme.textStyles.heading}>{recommendation.title}</Text>
          <Text style={theme.textStyles.caption}>{hiveName} · {recommendation.season}</Text>
        </View>
        <View style={styles.badgeColumn}>
          <StatusBadge label={label} tone={recommendation.severity} />
          <StatusBadge label={getRecommendationKindLabel(recommendation.kind)} tone={kindTone} />
        </View>
      </View>
      <Text style={theme.textStyles.body}>Vägledande råd: {recommendation.detail}</Text>
      {relatedTaskLabel ? <Text style={theme.textStyles.caption}>Finns redan som uppgift: {relatedTaskLabel}</Text> : null}
    </AppCard>
  );
}

export function InspectionSnapshot({ inspection, onDelete }: { inspection: Inspection; onDelete?: () => void }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const varroaTone = inspection.varroaLevel === 'Hög' ? 'critical' : inspection.varroaLevel === 'Förhöjd' ? 'warning' : 'info';
  const weatherSummary = formatInspectionWeather(inspection);
  const advancedLabels = getAdvancedInspectionLabels(inspection);
  const varroaLabels = getVarroaDetailLabels(inspection);

  return (
    <AppCard>
      <View style={styles.rowBetween}>
        <Text style={[theme.textStyles.heading, styles.snapshotTitle]}>{formatDateTimeLabel(inspection.performedAt)}</Text>
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ta bort genomgång"
            onPress={onDelete}
            style={({ pressed }) => [styles.iconDeleteButton, pressed && styles.pressed]}
          >
            <Ionicons color={theme.colors.danger} name="trash-outline" size={18} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.inlineWrap}>
        <StatusBadge label={inspection.mode} tone={inspection.mode === 'Fördjupad genomgång' ? 'calm' : 'info'} />
        <StatusBadge label={inspection.queenSeen ? 'Drottning sedd' : 'Drottning ej sedd'} tone={inspection.queenSeen ? 'calm' : 'warning'} />
        <StatusBadge label={inspection.eggsSeen ? 'Ägg sedda' : 'Ägg ej sedda'} tone={inspection.eggsSeen ? 'calm' : 'warning'} />
        <StatusBadge label={inspection.actionNeeded ? 'Behöver följas upp' : 'Ingen uppföljning nu'} tone={inspection.actionNeeded ? 'critical' : 'info'} />
        <StatusBadge label={`Varroa: ${inspection.varroaLevel}`} tone={varroaTone} />
      </View>
      {advancedLabels.length ? (
        <View style={styles.inlineWrap}>
          {advancedLabels.map((label) => (
            <StatusBadge key={label} label={label} tone="info" />
          ))}
        </View>
      ) : null}
      {varroaLabels.length ? (
        <View style={styles.inlineWrap}>
          {varroaLabels.map((label) => (
            <StatusBadge key={label} label={label} tone="warning" />
          ))}
        </View>
      ) : null}
      {inspection.varroaDetails?.treatmentNote ? <Text style={theme.textStyles.caption}>Varroanotis: {inspection.varroaDetails.treatmentNote}</Text> : null}
      {weatherSummary ? <Text style={theme.textStyles.caption}>Väder: {weatherSummary}</Text> : null}
      {inspection.weather?.note ? <Text style={theme.textStyles.caption}>Vädernotis: {inspection.weather.note}</Text> : null}
      <Text style={theme.textStyles.body}>{inspection.notes}</Text>
      {inspection.imageUris && inspection.imageUris.length > 0 ? (
        <View style={styles.imageGrid}>
          {inspection.imageUris.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.imagePreview} />
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

export function HiveEventSnapshot({ event, onDelete }: { event: HiveEvent; onDelete?: () => void }) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const tone = getHiveEventTone(event);
  const labels = getHiveEventDetailLabels(event);

  return (
    <AppCard>
      <View style={styles.rowBetween}>
        <Text style={[theme.textStyles.heading, styles.snapshotTitle]}>{formatDateTimeLabel(event.performedAt)}</Text>
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ta bort händelse"
            onPress={onDelete}
            style={({ pressed }) => [styles.iconDeleteButton, pressed && styles.pressed]}
          >
            <Ionicons color={theme.colors.danger} name="trash-outline" size={18} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.inlineWrap}>
        <StatusBadge label={event.type} tone={tone} />
      </View>
      {labels.length ? (
        <View style={styles.inlineWrap}>
          {labels.map((label) => (
            <StatusBadge key={label} label={label} tone="info" />
          ))}
        </View>
      ) : null}
      <Text style={theme.textStyles.body}>{event.notes}</Text>
      {event.imageUris && event.imageUris.length > 0 ? (
        <View style={styles.imageGrid}>
          {event.imageUris.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.imagePreview} />
          ))}
        </View>
      ) : null}
    </AppCard>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    pressable: {
      borderRadius: theme.radii.xl,
    },
    pressed: {
      opacity: 0.9,
    },
    statCard: {
      width: '100%',
      justifyContent: 'space-between',
      minHeight: 120,
    },
    statPressable: {
      width: '48.5%',
      flexGrow: 0,
      flexShrink: 0,
      borderRadius: theme.radii.xl,
      marginBottom: theme.spacing.lg,
    },
    statValue: {
      ...theme.textStyles.display,
      fontSize: 36,
      lineHeight: 38,
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: theme.spacing.lg,
    },
    textColumn: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    inlineWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    badgeColumn: {
      alignItems: 'flex-end',
      gap: theme.spacing.xs,
    },
    recommendationCard: {
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.info,
    },
    recommendationCardAlert: {
      borderLeftColor: theme.colors.danger,
    },
    recommendationCardSeasonal: {
      borderLeftColor: theme.colors.sage,
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginTop: theme.spacing.xs,
    },
    imagePreview: {
      width: 80,
      height: 80,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
    },
    queenColorDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      alignSelf: 'center',
    },
    logNowButton: {
      alignSelf: 'flex-start',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    logNowLabel: {
      ...theme.textStyles.bodyStrong,
      color: theme.colors.text,
    },
    completedTaskCard: {
      opacity: 0.78,
    },
    completedTitle: {
      textDecorationLine: 'line-through',
      color: theme.colors.textMuted,
    },
    taskActionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    taskActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    taskActionLabel: {
      ...theme.textStyles.caption,
      fontFamily: theme.fontFamilies.semibold,
      color: theme.colors.text,
    },
    deleteActionButton: {
      borderColor: theme.colors.danger,
    },
    deleteActionLabel: {
      ...theme.textStyles.caption,
      fontFamily: theme.fontFamilies.semibold,
      color: theme.colors.danger,
    },
    snapshotTitle: {
      flex: 1,
    },
    iconDeleteButton: {
      padding: theme.spacing.xs,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
    },
  });
}