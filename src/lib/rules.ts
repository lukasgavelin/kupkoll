import { Hive, HiveStrength, Inspection, Recommendation, Task } from '@/types/domain';
import { getLatestInspectionMap, getSeasonLabel } from '@/lib/selectors';

type DerivedResult = {
  recommendations: Recommendation[];
  tasks: Task[];
};

function buildTaskId(prefix: string, hiveId: string) {
  return `${prefix}-${hiveId}`;
}

function taskPriorityFromStrength(strength: HiveStrength): Task['priority'] {
  return strength === 'Svagt' ? 'Hög' : 'Medel';
}

export function buildDerivedSignals(hives: Hive[], inspections: Inspection[]): DerivedResult {
  const latestInspections = getLatestInspectionMap(inspections);
  const now = new Date();
  const season = getSeasonLabel(now);
  const recommendations: Recommendation[] = [];
  const tasks: Task[] = [];

  for (const hive of hives) {
    const inspection = latestInspections[hive.id];

    if (!inspection) {
      continue;
    }

    if (inspection.queenCells || inspection.swarmSigns) {
      recommendations.push({
        id: `rec-swarm-${hive.id}`,
        hiveId: hive.id,
        title: 'Hög svärmrisk',
        detail: 'Samhället visar tecken på svärmlust. Planera snabb uppföljning och bedöm platsbehov.',
        severity: 'critical',
        season,
        createdAt: now.toISOString(),
      });

      tasks.push({
        id: buildTaskId('task-swarm', hive.id),
        title: 'Kontrollera svärmtecken',
        description: `Gå igenom ${hive.name} igen inom några dagar och bedöm om avläggare eller utökning behövs.`,
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        hiveId: hive.id,
        priority: 'Hög',
        source: 'Rekommenderad',
        completed: false,
      });
    }

    if (!inspection.queenSeen && !inspection.eggsSeen) {
      recommendations.push({
        id: `rec-queen-${hive.id}`,
        hiveId: hive.id,
        title: 'Kontrollera drottningstatus',
        detail: 'Varken drottning eller färska ägg noterades. Säkerställ om samhället är drottningrätt.',
        severity: 'warning',
        season,
        createdAt: now.toISOString(),
      });

      tasks.push({
        id: buildTaskId('task-queen', hive.id),
        title: 'Bekräfta drottningstatus',
        description: `Följ upp ${hive.name} med fokus på drottning, ägg och jämn yngelsättning.`,
        dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        hiveId: hive.id,
        priority: 'Hög',
        source: 'Rekommenderad',
        completed: false,
      });
    }

    if (hive.strength === 'Svagt' || (!inspection.openBrood && !inspection.cappedBrood)) {
      recommendations.push({
        id: `rec-weak-${hive.id}`,
        hiveId: hive.id,
        title: 'Samhället verkar svagt',
        detail: 'Utvecklingen är låg jämfört med säsongen. Foder, drottningstatus och möjlighet till förstärkning bör bedömas.',
        severity: 'warning',
        season,
        createdAt: now.toISOString(),
      });

      tasks.push({
        id: buildTaskId('task-weak', hive.id),
        title: 'Bedöm stödåtgärd',
        description: `Avgör om ${hive.name} behöver foder, sammanslagning eller tätare uppföljning.`,
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        hiveId: hive.id,
        priority: taskPriorityFromStrength(hive.strength),
        source: 'Rekommenderad',
        completed: false,
      });
    }

    if (hive.strength === 'Starkt' && inspection.honey && (inspection.openBrood || inspection.cappedBrood)) {
      recommendations.push({
        id: `rec-super-${hive.id}`,
        hiveId: hive.id,
        title: 'Dags att överväga skattlåda',
        detail: 'Samhället visar styrka och gott dragläge. Förbered extra utrymme innan trängsel uppstår.',
        severity: 'info',
        season,
        createdAt: now.toISOString(),
      });

      tasks.push({
        id: buildTaskId('task-super', hive.id),
        title: 'Planera skattlåda',
        description: `Förbered material så att ${hive.name} kan utökas snabbt när draget tar fart.`,
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        hiveId: hive.id,
        priority: 'Medel',
        source: 'Rekommenderad',
        completed: false,
      });
    }

    if (season === 'Invintring' || (!inspection.honey && inspection.actionNeeded)) {
      recommendations.push({
        id: `rec-winter-${hive.id}`,
        hiveId: hive.id,
        title: 'Förbered invintring',
        detail: 'Foderläge eller styrka motiverar tidig planering inför invintring och varroastrategi.',
        severity: 'warning',
        season,
        createdAt: now.toISOString(),
      });

      tasks.push({
        id: buildTaskId('task-winter', hive.id),
        title: 'Planera invintring',
        description: `Se över foder, behandling och styrka i ${hive.name} inför sensommar och höst.`,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        hiveId: hive.id,
        priority: 'Medel',
        source: 'Rekommenderad',
        completed: false,
      });
    }
  }

  return { recommendations, tasks };
}