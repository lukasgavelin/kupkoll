import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { apiaries as initialApiaries, hives as initialHives, inspections as initialInspections, tasks as initialTasks } from '@/data/mock';
import { buildDerivedSignals } from '@/lib/rules';
import { getDashboardStats, getLatestInspectionMap, getUpcomingTasks } from '@/lib/selectors';
import { Apiary, Hive, Inspection, NewInspectionInput, Recommendation, Task } from '@/types/domain';

type DashboardSnapshot = ReturnType<typeof getDashboardStats>;

type BeehavenContextValue = {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  manualTasks: Task[];
  recommendations: Recommendation[];
  tasks: Task[];
  latestInspectionMap: Record<string, Inspection>;
  dashboard: DashboardSnapshot;
  addInspection: (input: NewInspectionInput) => void;
  getApiaryById: (id: string) => Apiary | undefined;
  getHiveById: (id: string) => Hive | undefined;
  getHivesByApiary: (apiaryId: string) => Hive[];
  getRecommendationsForHive: (hiveId: string) => Recommendation[];
  getTasksForHive: (hiveId: string) => Task[];
};

const BeehavenContext = createContext<BeehavenContextValue | undefined>(undefined);

function deriveHiveStatus(input: NewInspectionInput): Pick<Hive, 'status' | 'queenStatus' | 'temperament'> {
  const queenStatus = input.queenSeen || input.eggsSeen ? 'Bekräftad' : input.actionNeeded ? 'Behöver följas upp' : 'Osäker';
  const status = input.actionNeeded || (!input.openBrood && !input.cappedBrood) ? 'Behöver åtgärd' : 'Stabilt';

  return {
    status,
    queenStatus,
    temperament: input.temperament,
  };
}

export function BeehavenProvider({ children }: { children: ReactNode }) {
  const [apiaries] = useState(initialApiaries);
  const [hives, setHives] = useState(initialHives);
  const [inspections, setInspections] = useState(initialInspections);
  const [manualTasks] = useState(initialTasks);

  const derived = useMemo(() => buildDerivedSignals(hives, inspections), [hives, inspections]);
  const tasks = useMemo(() => getUpcomingTasks([...manualTasks, ...derived.tasks]), [manualTasks, derived.tasks]);
  const latestInspectionMap = useMemo(() => getLatestInspectionMap(inspections), [inspections]);
  const dashboard = useMemo(
    () =>
      getDashboardStats({
        apiaries,
        hives,
        inspections,
        tasks,
        criticalCount: derived.recommendations.filter((item) => item.severity === 'critical').length,
      }),
    [apiaries, hives, inspections, tasks, derived.recommendations],
  );

  function addInspection(input: NewInspectionInput) {
    const now = new Date().toISOString();
    const inspection: Inspection = {
      id: `insp-${Date.now()}`,
      performedAt: now,
      ...input,
    };

    setInspections((current) => [inspection, ...current]);
    setHives((current) =>
      current.map((hive) =>
        hive.id === input.hiveId
          ? {
              ...hive,
              ...deriveHiveStatus(input),
              lastInspectionAt: now,
            }
          : hive,
      ),
    );
  }

  const value = useMemo<BeehavenContextValue>(
    () => ({
      apiaries,
      hives,
      inspections,
      manualTasks,
      recommendations: derived.recommendations,
      tasks,
      latestInspectionMap,
      dashboard,
      addInspection,
      getApiaryById: (id) => apiaries.find((apiary) => apiary.id === id),
      getHiveById: (id) => hives.find((hive) => hive.id === id),
      getHivesByApiary: (apiaryId) => hives.filter((hive) => hive.apiaryId === apiaryId),
      getRecommendationsForHive: (hiveId) => derived.recommendations.filter((item) => item.hiveId === hiveId),
      getTasksForHive: (hiveId) => tasks.filter((task) => task.hiveId === hiveId),
    }),
    [apiaries, hives, inspections, manualTasks, derived.recommendations, tasks, latestInspectionMap, dashboard],
  );

  return <BeehavenContext.Provider value={value}>{children}</BeehavenContext.Provider>;
}

export function useBeehaven() {
  const context = useContext(BeehavenContext);

  if (!context) {
    throw new Error('useBeehaven must be used inside BeehavenProvider');
  }

  return context;
}