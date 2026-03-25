import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateLabel, formatDateTimeLabel } from '@/lib/selectors';
import { theme } from '@/theme';
import { Apiary, Hive, Inspection, Recommendation, Task } from '@/types/domain';

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <AppCard style={styles.statCard}>
      <Text style={theme.textStyles.overline}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </AppCard>
  );
}

export function ApiaryCard({ apiary, hiveCount }: { apiary: Apiary; hiveCount: number }) {
  return (
    <Pressable onPress={() => router.push(`/apiaries/${apiary.id}`)} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <AppCard>
        <View style={styles.rowBetween}>
          <View style={styles.textColumn}>
            <Text style={theme.textStyles.heading}>{apiary.name}</Text>
            <Text style={theme.textStyles.caption}>{apiary.location}</Text>
          </View>
          <StatusBadge label={`${hiveCount} kupor`} tone="calm" />
        </View>
        <Text style={theme.textStyles.body}>{apiary.notes}</Text>
      </AppCard>
    </Pressable>
  );
}

export function HiveCard({ hive, apiaryName }: { hive: Hive; apiaryName: string }) {
  const statusTone = hive.status === 'Behöver åtgärd' ? 'critical' : hive.status === 'Under uppbyggnad' ? 'warning' : 'calm';

  return (
    <Pressable onPress={() => router.push(`/hives/${hive.id}`)} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <AppCard>
        <View style={styles.rowBetween}>
          <View style={styles.textColumn}>
            <Text style={theme.textStyles.heading}>{hive.name}</Text>
            <Text style={theme.textStyles.caption}>{apiaryName}</Text>
          </View>
          <StatusBadge label={hive.status} tone={statusTone} />
        </View>
        <View style={styles.inlineWrap}>
          <Text style={theme.textStyles.caption}>Drottning: {hive.queenStatus}</Text>
          <Text style={theme.textStyles.caption}>Styrka: {hive.strength}</Text>
          <Text style={theme.textStyles.caption}>Temperament: {hive.temperament}</Text>
          <Text style={theme.textStyles.caption}>Kupsystem: {hive.boxSystem}</Text>
        </View>
        <Text style={theme.textStyles.caption}>Senaste genomgång {formatDateLabel(hive.lastInspectionAt)}</Text>
      </AppCard>
    </Pressable>
  );
}

export function TaskCard({ task, hiveName }: { task: Task; hiveName?: string }) {
  const tone = task.priority === 'Hög' ? 'critical' : task.priority === 'Medel' ? 'warning' : 'info';

  return (
    <AppCard>
      <View style={styles.rowBetween}>
        <View style={styles.textColumn}>
          <Text style={theme.textStyles.heading}>{task.title}</Text>
          <Text style={theme.textStyles.caption}>Planerad senast {formatDateLabel(task.dueDate)}</Text>
        </View>
        <StatusBadge label={task.priority} tone={tone} />
      </View>
      {hiveName ? <Text style={theme.textStyles.caption}>{hiveName}</Text> : null}
      <Text style={theme.textStyles.body}>{task.description}</Text>
      <Text style={theme.textStyles.caption}>{task.source}</Text>
    </AppCard>
  );
}

export function RecommendationCard({ recommendation, hiveName }: { recommendation: Recommendation; hiveName: string }) {
  const label = recommendation.severity === 'critical' ? 'Akut' : recommendation.severity === 'warning' ? 'Följ upp' : 'Tips';

  return (
    <AppCard>
      <View style={styles.rowBetween}>
        <View style={styles.textColumn}>
          <Text style={theme.textStyles.heading}>{recommendation.title}</Text>
          <Text style={theme.textStyles.caption}>{hiveName} · {recommendation.season}</Text>
        </View>
        <StatusBadge label={label} tone={recommendation.severity} />
      </View>
      <Text style={theme.textStyles.body}>{recommendation.detail}</Text>
    </AppCard>
  );
}

export function InspectionSnapshot({ inspection }: { inspection: Inspection }) {
  const varroaTone = inspection.varroaLevel === 'Hög' ? 'critical' : inspection.varroaLevel === 'Förhöjd' ? 'warning' : 'info';

  return (
    <AppCard>
      <Text style={theme.textStyles.heading}>{formatDateTimeLabel(inspection.performedAt)}</Text>
      <View style={styles.inlineWrap}>
        <StatusBadge label={inspection.queenSeen ? 'Drottning sedd' : 'Drottning ej sedd'} tone={inspection.queenSeen ? 'calm' : 'warning'} />
        <StatusBadge label={inspection.eggsSeen ? 'Ägg sedda' : 'Inga ägg'} tone={inspection.eggsSeen ? 'calm' : 'warning'} />
        <StatusBadge label={inspection.actionNeeded ? 'Åtgärd behövs' : 'Normalläge'} tone={inspection.actionNeeded ? 'critical' : 'info'} />
        <StatusBadge label={`Varroa: ${inspection.varroaLevel}`} tone={varroaTone} />
      </View>
      <Text style={theme.textStyles.body}>{inspection.notes}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: theme.radii.xl,
  },
  pressed: {
    opacity: 0.9,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    justifyContent: 'space-between',
    minHeight: 144,
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
});