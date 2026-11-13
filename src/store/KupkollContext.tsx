import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';

import { applyHiveEventToHive } from '@/lib/queenEvents';
import { buildDerivedSignals } from '@/lib/rules';
import {
  DEFAULT_USER_SETTINGS,
  deleteApiarySync,
  deleteHiveEventSync,
  deleteHiveSync,
  deleteInspectionSync,
  deleteTaskSync,
  replaceAllDataLegacySync,
  saveApiarySync,
  saveHiveEventAndHiveSync,
  saveHiveEventSync,
  saveHiveSync,
  saveInspectionAndHiveSync,
  saveInspectionSync,
  saveTaskSync,
  saveUserSettingsSync,
} from '@/lib/db';
import { getDashboardStats, getEventsForHive, getInspectionsForHive, getLatestInspectionMap, getUpcomingTasks } from '@/lib/selectors';
import { KupkollAppState, normalizeQueenHistory } from '@/lib/storage';
import { Apiary, Hive, HiveEvent, Inspection, NewApiaryInput, NewHiveInput, NewHiveEventInput, NewInspectionInput, Recommendation, Task, TaskPriority, UpdateApiaryInput, UpdateHiveInput, UserSettings } from '@/types/domain';

export type NewTaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
  hiveId?: string;
  apiaryId?: string;
  priority?: TaskPriority;
};

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
  deleteInspection: (inspectionId: string) => void;
  addEvent: (input: NewHiveEventInput) => void;
  deleteEvent: (eventId: string) => void;
  addTask: (input: NewTaskInput) => Task;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
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

    const targetHive = hives.find((hive) => hive.id === input.hiveId);
    if (targetHive) {
      const updatedHive: Hive = {
        ...targetHive,
        ...deriveHiveStatus(input),
        lastInspectionAt: now,
      };
      saveInspectionAndHiveSync(inspection, updatedHive);
      setInspections((current) => [inspection, ...current]);
      setHives((current) => current.map((hive) => (hive.id === input.hiveId ? updatedHive : hive)));
    } else {
      saveInspectionSync(inspection);
      setInspections((current) => [inspection, ...current]);
    }
  }

  function deleteInspection(inspectionId: string) {
    deleteInspectionSync(inspectionId);
    setInspections((current) => current.filter((inspection) => inspection.id !== inspectionId));
  }

  function addEvent(input: NewHiveEventInput) {
    const event: HiveEvent = {
      id: `event-${Crypto.randomUUID()}`,
      performedAt: new Date().toISOString(),
      ...input,
    };

    const targetHive = hives.find((hive) => hive.id === event.hiveId);
    if (targetHive) {
      const updatedHive = applyHiveEventToHive(targetHive, event);
      saveHiveEventAndHiveSync(event, updatedHive);
      setEvents((current) => [event, ...current]);
      setHives((current) => current.map((hive) => (hive.id === event.hiveId ? updatedHive : hive)));
    } else {
      saveHiveEventSync(event);
      setEvents((current) => [event, ...current]);
    }
  }

  function deleteEvent(eventId: string) {
    deleteHiveEventSync(eventId);
    setEvents((current) => current.filter((event) => event.id !== eventId));
  }

  function addTask(input: NewTaskInput): Task {
    const targetHive = input.hiveId ? hives.find((hive) => hive.id === input.hiveId) : undefined;
    const task: Task = {
      id: `task-${Crypto.randomUUID()}`,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      dueDate: input.dueDate?.trim() || new Date().toISOString(),
      hiveId: targetHive?.id ?? input.hiveId,
      apiaryId: input.apiaryId ?? targetHive?.apiaryId,
      priority: input.priority ?? 'Medel',
      source: 'Egen planering',
      completed: false,
    };

    saveTaskSync(task);
    setManualTasks((current) => [task, ...current]);
    return task;
  }

  function toggleTask(taskId: string) {
    const target = manualTasks.find((task) => task.id === taskId);
    if (!target) {
      return;
    }

    const updatedTask: Task = {
      ...target,
      completed: !target.completed,
    };
    saveTaskSync(updatedTask);
    setManualTasks((current) => current.map((task) => (task.id === taskId ? updatedTask : task)));
  }

  function deleteTask(taskId: string) {
    deleteTaskSync(taskId);
    setManualTasks((current) => current.filter((task) => task.id !== taskId));
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
    setUserSettings(nextState.userSettings ?? DEFAULT_USER_SETTINGS);
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
      deleteInspection,
      addEvent,
      deleteEvent,
      addTask,
      toggleTask,
      deleteTask,
      updateUserSettings,
      replaceAllData,
      getApiaryById: (id) => apiaries.find((apiary) => apiary.id === id),
      getHiveById: (id) => hives.find((hive) => hive.id === id),
      getHivesByApiary: (apiaryId) => hives.filter((hive) => hive.apiaryId === apiaryId),
      getInspectionsForHive: (hiveId) => getInspectionsForHive(inspections, hiveId),
      getEventsForHive: (hiveId) => getEventsForHive(events, hiveId),
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