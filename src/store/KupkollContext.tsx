import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';

import { applyHiveEventToHive } from '@/lib/queenEvents';
import { buildDerivedSignals } from '@/lib/rules';
import { deleteApiarySync, deleteHiveSync, replaceAllDataLegacySync, saveApiarySync, saveHiveEventSync, saveHiveSync, saveInspectionSync, saveUserSettingsSync } from '@/lib/db';
import { getDashboardStats, getLatestInspectionMap, getUpcomingTasks } from '@/lib/selectors';
import { KupkollAppState, normalizeQueenHistory } from '@/lib/storage';
import { Apiary, Hive, HiveEvent, Inspection, NewApiaryInput, NewHiveInput, NewHiveEventInput, NewInspectionInput, Recommendation, Task, UpdateApiaryInput, UpdateHiveInput, UserSettings } from '@/types/domain';

type DashboardSnapshot = ReturnType<typeof getDashboardStats>;

type KupkollContextValue = {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  events: HiveEvent[];
  manualTasks: Task[];
  recommendations: Recommendation[];
  tasks: Task[];
  userSettings: UserSettings;
  latestInspectionMap: Record<string, Inspection>;
  dashboard: DashboardSnapshot;
  addApiary: (input: NewApiaryInput) => Apiary;
  addHive: (input: NewHiveInput) => Hive;
  updateApiary: (apiaryId: string, input: UpdateApiaryInput) => Apiary | undefined;
  updateHive: (hiveId: string, input: UpdateHiveInput) => Hive | undefined;
  deleteApiary: (apiaryId: string) => void;
  deleteHive: (hiveId: string) => void;
  addInspection: (input: NewInspectionInput) => void;
  addEvent: (input: NewHiveEventInput) => void;
  updateUserSettings: (settings: UserSettings) => void;
  replaceAllData: (nextState: KupkollAppState & { userSettings?: UserSettings }) => void;
  getApiaryById: (id: string) => Apiary | undefined;
  getHiveById: (id: string) => Hive | undefined;
  getHivesByApiary: (apiaryId: string) => Hive[];
  getInspectionsForHive: (hiveId: string) => Inspection[];
  getEventsForHive: (hiveId: string) => HiveEvent[];
  getRecommendationsForHive: (hiveId: string) => Recommendation[];
  getTasksForHive: (hiveId: string) => Task[];
};

const KupkollContext = createContext<KupkollContextValue | undefined>(undefined);

function deriveHiveStatus(input: NewInspectionInput): Pick<Hive, 'status' | 'queenStatus' | 'temperament'> {
  const queenStatus = input.queenSeen || input.eggsSeen ? 'Bekräftad' : input.actionNeeded ? 'Behöver följas upp' : 'Osäker';
  const status = input.actionNeeded || input.varroaLevel === 'Hög' || (!input.openBrood && !input.cappedBrood) ? 'Behöver åtgärd' : 'Stabilt';

  return {
    status,
    queenStatus,
    temperament: input.temperament,
  };
}


export function KupkollProvider({ children, initialData }: { children: ReactNode; initialData: KupkollAppState & { userSettings: UserSettings } }) {
  const [apiaries, setApiaries] = useState<Apiary[]>(initialData.apiaries);
  const [hives, setHives] = useState<Hive[]>(initialData.hives);
  const [inspections, setInspections] = useState<Inspection[]>(initialData.inspections);
  const [events, setEvents] = useState<HiveEvent[]>(initialData.events);
  const [manualTasks, setManualTasks] = useState<Task[]>(initialData.manualTasks);
  const [userSettings, setUserSettings] = useState<UserSettings>(initialData.userSettings);



  const derived = useMemo(() => buildDerivedSignals(apiaries, hives, inspections, userSettings, events), [apiaries, hives, inspections, userSettings, events]);
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

  function addApiary(input: NewApiaryInput) {
    const apiary: Apiary = {
      id: `apiary-${Crypto.randomUUID()}`,
      ...input,
    };

    saveApiarySync(apiary);
    setApiaries((current) => [apiary, ...current]);
    return apiary;
  }

  function addHive(input: NewHiveInput) {
    const hive: Hive = {
      id: `hive-${Crypto.randomUUID()}`,
      status: 'Under uppbyggnad',
      ...input,
      queenHistory: normalizeQueenHistory(input.queenHistory),
    };

    saveHiveSync(hive);
    setHives((current) => [hive, ...current]);
    return hive;
  }

  function updateApiary(apiaryId: string, input: UpdateApiaryInput) {
    const currentApiary = apiaries.find((apiary) => apiary.id === apiaryId);

    if (!currentApiary) {
      return undefined;
    }

    const updatedApiary: Apiary = {
      ...currentApiary,
      ...input,
    };

    saveApiarySync(updatedApiary);
    setApiaries((current) => current.map((apiary) => (apiary.id === apiaryId ? updatedApiary : apiary)));
    return updatedApiary;
  }

  function updateHive(hiveId: string, input: UpdateHiveInput) {
    const currentHive = hives.find((hive) => hive.id === hiveId);

    if (!currentHive) {
      return undefined;
    }

    const updatedHive: Hive = {
      ...currentHive,
      ...input,
      queenHistory: normalizeQueenHistory(input.queenHistory),
    };

    saveHiveSync(updatedHive);
    setHives((current) => current.map((hive) => (hive.id === hiveId ? updatedHive : hive)));
    return updatedHive;
  }

  function deleteHive(hiveId: string) {
    deleteHiveSync(hiveId);
    setHives((current) => current.filter((hive) => hive.id !== hiveId));
    setInspections((current) => current.filter((inspection) => inspection.hiveId !== hiveId));
    setEvents((current) => current.filter((event) => event.hiveId !== hiveId));
    setManualTasks((current) => current.filter((task) => task.hiveId !== hiveId));
  }

  function deleteApiary(apiaryId: string) {
    deleteApiarySync(apiaryId);
    const hiveIds = hives.filter((hive) => hive.apiaryId === apiaryId).map((hive) => hive.id);

    setApiaries((current) => current.filter((apiary) => apiary.id !== apiaryId));
    setHives((current) => current.filter((hive) => hive.apiaryId !== apiaryId));
    setInspections((current) => current.filter((inspection) => !hiveIds.includes(inspection.hiveId)));
    setEvents((current) => current.filter((event) => !hiveIds.includes(event.hiveId)));
    setManualTasks((current) => current.filter((task) => task.apiaryId !== apiaryId && (!task.hiveId || !hiveIds.includes(task.hiveId))));
  }

  function addInspection(input: NewInspectionInput) {
    const now = new Date().toISOString();
    const inspection: Inspection = {
      id: `insp-${Crypto.randomUUID()}`,
      performedAt: now,
      ...input,
    };

    saveInspectionSync(inspection);
    setInspections((current) => [inspection, ...current]); // We still append it for the UI/Context
    
    setHives((current) =>
      current.map((hive) => {
        if (hive.id === input.hiveId) {
          const updatedHive = {
            ...hive,
            ...deriveHiveStatus(input),
            lastInspectionAt: now,
          };
          saveHiveSync(updatedHive);
          return updatedHive;
        }
        return hive;
      }),
    );
  }

  function addEvent(input: NewHiveEventInput) {
    const event: HiveEvent = {
      id: `event-${Crypto.randomUUID()}`,
      performedAt: new Date().toISOString(),
      ...input,
    };

    saveHiveEventSync(event);
    setEvents((current) => [event, ...current]);
    setHives((current) => current.map((hive) => {
      if (hive.id === event.hiveId) {
        const updatedHive = applyHiveEventToHive(hive, event);
        saveHiveSync(updatedHive);
        return updatedHive;
      }
      return hive;
    }));
  }

  function updateUserSettings(settings: UserSettings) {
    saveUserSettingsSync(settings);
    setUserSettings(settings);
  }

  function replaceAllData(nextState: KupkollAppState & { userSettings?: UserSettings }) {
    replaceAllDataLegacySync(nextState);
    setApiaries(nextState.apiaries);
    setHives(nextState.hives);
    setInspections(nextState.inspections);
    setEvents(nextState.events);
    setManualTasks(nextState.manualTasks);
    if (nextState.userSettings) {
      setUserSettings(nextState.userSettings);
    }
  }

  const value = useMemo<KupkollContextValue>(
    () => ({
      apiaries,
      hives,
      inspections,
      events,
      manualTasks,
      userSettings,
      recommendations: derived.recommendations,
      tasks,
      latestInspectionMap,
      dashboard,
      addApiary,
      addHive,
      updateApiary,
      updateHive,
      deleteApiary,
      deleteHive,
      addInspection,
      addEvent,
      updateUserSettings,
      replaceAllData,
      getApiaryById: (id) => apiaries.find((apiary) => apiary.id === id),
      getHiveById: (id) => hives.find((hive) => hive.id === id),
      getHivesByApiary: (apiaryId) => hives.filter((hive) => hive.apiaryId === apiaryId),
      getInspectionsForHive: (hiveId) =>
        [...inspections]
          .filter((inspection) => inspection.hiveId === hiveId)
          .sort((left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime()),
      getEventsForHive: (hiveId) =>
        [...events]
          .filter((event) => event.hiveId === hiveId)
          .sort((left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime()),
      getRecommendationsForHive: (hiveId) => derived.recommendations.filter((item) => item.hiveId === hiveId),
      getTasksForHive: (hiveId) => tasks.filter((task) => task.hiveId === hiveId),
    }),
    [apiaries, hives, inspections, events, manualTasks, userSettings, derived.recommendations, tasks, latestInspectionMap, dashboard],
  );

  return <KupkollContext.Provider value={value}>{children}</KupkollContext.Provider>;
}

export function useKupkoll() {
  const context = useContext(KupkollContext);

  if (!context) {
    throw new Error('useKupkoll must be used inside KupkollProvider');
  }

  return context;
}