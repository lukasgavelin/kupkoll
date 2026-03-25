import { Apiary, Hive, Inspection, SeasonLabel, Task } from '@/types/domain';

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

export function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getSeasonLabel(date = new Date()): SeasonLabel {
  const month = date.getMonth() + 1;

  if (month <= 2) {
    return 'Vintertillsyn';
  }
  if (month <= 4) {
    return 'Vårutveckling';
  }
  if (month <= 6) {
    return 'Svärmperiod';
  }
  if (month <= 8) {
    return 'Drag och skattning';
  }
  if (month <= 10) {
    return 'Invintring';
  }
  return 'Vinterro';
}

export function getLatestInspectionMap(inspections: Inspection[]) {
  return inspections.reduce<Record<string, Inspection>>((map, inspection) => {
    const current = map[inspection.hiveId];

    if (!current || new Date(inspection.performedAt) > new Date(current.performedAt)) {
      map[inspection.hiveId] = inspection;
    }

    return map;
  }, {});
}

export function getUpcomingTasks(tasks: Task[]) {
  return [...tasks]
    .filter((task) => !task.completed)
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());
}

export function getDashboardStats(params: {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  tasks: Task[];
  criticalCount: number;
}) {
  const latestInspections = [...params.inspections]
    .sort((left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime())
    .slice(0, 4);

  return {
    hiveCount: params.hives.length,
    apiaryCount: params.apiaries.length,
    upcomingTaskCount: getUpcomingTasks(params.tasks).length,
    criticalCount: params.criticalCount,
    latestInspections,
  };
}