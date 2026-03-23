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
      <Text style={styles.statValue}>{value}</Text>
      <Text style={theme.textStyles.caption}>{label}</Text>
    </AppCard>
  );
}

export function ApiaryCard({ apiary, hiveCount }: { apiary: Apiary; hiveCount: number }) {
  return (
    <Pressable onPress={() => router.push(`/apiaries/${apiary.id}`)}>
      <AppCard>
        <View style={styles.rowBetween}>
          <View style={styles.textColumn}>
            <Text style={theme.textStyles.heading}>{apiary.name}</Text>
            <Text style={theme.textStyles.body}>{apiary.location}</Text>
          </View>
          <StatusBadge label={`${hiveCount} kupor`} tone="calm" />
        </View>
        <Text style={theme.textStyles.caption}>{apiary.notes}</Text>
      </AppCard>
    </Pressable>
  );
}

export function HiveCard({ hive, apiaryName }: { hive: Hive; apiaryName: string }) {
  const statusTone = hive.status === 'Behöver åtgärd' ? 'critical' : hive.status === 'Under uppbyggnad' ? 'warning' : 'calm';

  return (
    <Pressable onPress={() => router.push(`/hives/${hive.id}`)}>
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
        </View>
        <Text style={theme.textStyles.caption}>Senaste inspektion {formatDateLabel(hive.lastInspectionAt)}</Text>
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
          <Text style={theme.textStyles.caption}>Senast {formatDateLabel(task.dueDate)}</Text>
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
          <Text style={theme.textStyles.caption}>{hiveName}</Text>
        </View>
        <StatusBadge label={label} tone={recommendation.severity} />
      </View>
      <Text style={theme.textStyles.body}>{recommendation.detail}</Text>
    </AppCard>
  );
}

export function InspectionSnapshot({ inspection }: { inspection: Inspection }) {
  return (
    <AppCard>
      <Text style={theme.textStyles.heading}>{formatDateTimeLabel(inspection.performedAt)}</Text>
      <View style={styles.inlineWrap}>
        <StatusBadge label={inspection.queenSeen ? 'Drottning sedd' : 'Drottning ej sedd'} tone={inspection.queenSeen ? 'calm' : 'warning'} />
        <StatusBadge label={inspection.eggsSeen ? 'Ägg sedda' : 'Inga ägg'} tone={inspection.eggsSeen ? 'calm' : 'warning'} />
        <StatusBadge label={inspection.actionNeeded ? 'Behov av åtgärd' : 'Ingen åtgärd'} tone={inspection.actionNeeded ? 'critical' : 'info'} />
      </View>
      <Text style={theme.textStyles.body}>{inspection.notes}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    minWidth: '47%',
  },
  statValue: {
    ...theme.textStyles.display,
    fontSize: 32,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
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