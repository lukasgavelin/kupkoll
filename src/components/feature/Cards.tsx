import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  if (event.type === 'Samhälle förenat' || event.type === 'Invintring startad' || event.type === 'Invintring slutförd') {
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.statPressable, pressed && styles.pressed]}>
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
    <Pressable onPress={() => router.push(`/apiaries/${apiary.id}`)} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
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

export function HiveCard({ hive, apiaryLabel }: { hive: Hive; apiaryLabel: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const statusTone = hive.status === 'Behöver åtgärd' ? 'critical' : hive.status === 'Under uppbyggnad' ? 'warning' : 'calm';
  const queenSegments = [
    `Drottning: ${hive.queenStatus}`,
    hive.queenYear ? `Årgång ${hive.queenYear}` : undefined,
    hive.queenMarkingColor ? `Märkning ${hive.queenMarkingColor.toLowerCase()}` : undefined,
  ].filter((segment): segment is string => Boolean(segment));

  return (
    <Pressable onPress={() => router.push(`/hives/${hive.id}`)} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <AppCard>
        <View style={styles.rowBetween}>
          <View style={styles.textColumn}>
            <Text style={theme.textStyles.heading}>{hive.name}</Text>
            <Text style={theme.textStyles.caption}>{apiaryLabel}</Text>
          </View>
          <StatusBadge label={hive.status} tone={statusTone} />
        </View>
        <View style={styles.inlineWrap}>
          <Text style={theme.textStyles.caption}>{queenSegments.join(' · ')}</Text>
          <Text style={theme.textStyles.caption}>Styrka: {hive.strength}</Text>
          <Text style={theme.textStyles.caption}>Temperament: {hive.temperament}</Text>
          <Text style={theme.textStyles.caption}>Kupsystem: {hive.boxSystem}</Text>
        </View>
        <Text style={theme.textStyles.caption}>{hive.lastInspectionAt ? `Senast genomgången ${formatDateLabel(hive.lastInspectionAt)}` : 'Ingen genomgång sparad ännu'}</Text>
      </AppCard>
    </Pressable>
  );
}

export function TaskCard({ task, hiveName }: { task: Task; hiveName?: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const tone = task.priority === 'Hög' ? 'critical' : task.priority === 'Medel' ? 'warning' : 'info';

  return (
    <AppCard>
      <View style={styles.rowBetween}>
        <View style={styles.textColumn}>
          <Text style={theme.textStyles.heading}>{task.title}</Text>
          <Text style={theme.textStyles.caption}>Planera senast {formatDateLabel(task.dueDate)}</Text>
        </View>
        <StatusBadge label={task.priority} tone={tone} />
      </View>
      {hiveName ? <Text style={theme.textStyles.caption}>{hiveName}</Text> : null}
      <Text style={theme.textStyles.body}>{task.description}</Text>
      <Text style={theme.textStyles.caption}>{getTaskSourceLabel(task.source)}</Text>
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

export function InspectionSnapshot({ inspection }: { inspection: Inspection }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const varroaTone = inspection.varroaLevel === 'Hög' ? 'critical' : inspection.varroaLevel === 'Förhöjd' ? 'warning' : 'info';
  const weatherSummary = formatInspectionWeather(inspection);
  const advancedLabels = getAdvancedInspectionLabels(inspection);
  const varroaLabels = getVarroaDetailLabels(inspection);

  return (
    <AppCard>
      <Text style={theme.textStyles.heading}>{formatDateTimeLabel(inspection.performedAt)}</Text>
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
    </AppCard>
  );
}

export function HiveEventSnapshot({ event }: { event: HiveEvent }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const tone = getHiveEventTone(event);
  const labels = getHiveEventDetailLabels(event);

  return (
    <AppCard>
      <Text style={theme.textStyles.heading}>{formatDateTimeLabel(event.performedAt)}</Text>
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
  });
}