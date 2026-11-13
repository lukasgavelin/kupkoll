import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';

import { deleteLocalImageUris } from '@/lib/mediaCleanup';
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
import { Apiary, Hive, HiveEvent, Inspection, NewApiaryInput, NewHiveInput, NewHiveEventInput, NewInspectionInput, Recommendation, Task, TaskPriority, UpdateApiaryInput, UpdateHiveEventInput, UpdateHiveInput, UpdateInspectionInput, UserSettings } from '@/types/domain';

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
  updateInspection: (inspectionId: string, input: UpdateInspectionInput) => Inspection | undefined;
  deleteInspection: (inspectionId: string) => void;
  addEvent: (input: NewHiveEventInput) => void;
  updateEvent: (eventId: string, input: UpdateHiveEventInput) => HiveEvent | undefined;
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

  const addApiary = useCallback((input: NewApiaryInput) => {
    const apiary: Apiary = {
      id: `apiary-${Crypto.randomUUID()}`,
      ...input,
    };

    saveApiarySync(apiary);
    setApiaries((current) => [apiary, ...current]);
    return apiary;
  }, []);

  const addHive = useCallback((input: NewHiveInput) => {
    const hive: Hive = {
      id: `hive-${Crypto.randomUUID()}`,
      status: 'Under uppbyggnad',
      ...input,
      queenHistory: normalizeQueenHistory(input.queenHistory),
    };

    saveHiveSync(hive);
    setHives((current) => [hive, ...current]);
    return hive;
  }, []);

  const updateApiary = useCallback((apiaryId: string, input: UpdateApiaryInput) => {
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
  }, [apiaries]);

  const updateHive = useCallback((hiveId: string, input: UpdateHiveInput) => {
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
  }, [hives]);

  const deleteHive = useCallback((hiveId: string) => {
    const hiveToDelete = hives.find((hive) => hive.id === hiveId);
    const urisToDelete: string[] = [
      ...(hiveToDelete?.queenHistory.flatMap((entry) => entry.imageUris ?? []) ?? []),
      ...inspections.filter((i) => i.hiveId === hiveId).flatMap((i) => i.imageUris ?? []),
      ...events.filter((e) => e.hiveId === hiveId).flatMap((e) => e.imageUris ?? []),
    ];

    deleteHiveSync(hiveId);
    setHives((current) => current.filter((hive) => hive.id !== hiveId));
    setInspections((current) => current.filter((inspection) => inspection.hiveId !== hiveId));
    setEvents((current) => current.filter((event) => event.hiveId !== hiveId));
    setManualTasks((current) => current.filter((task) => task.hiveId !== hiveId));
    void deleteLocalImageUris(urisToDelete);
  }, [events, hives, inspections]);

  const deleteApiary = useCallback((apiaryId: string) => {
    const hivesToDelete = hives.filter((hive) => hive.apiaryId === apiaryId);
    const hiveIdSet = new Set(hivesToDelete.map((hive) => hive.id));
    const urisToDelete: string[] = [
      ...hivesToDelete.flatMap((hive) => hive.queenHistory.flatMap((entry) => entry.imageUris ?? [])),
      ...inspections.filter((i) => hiveIdSet.has(i.hiveId)).flatMap((i) => i.imageUris ?? []),
      ...events.filter((e) => hiveIdSet.has(e.hiveId)).flatMap((e) => e.imageUris ?? []),
    ];

    deleteApiarySync(apiaryId);

    setApiaries((current) => current.filter((apiary) => apiary.id !== apiaryId));
    setHives((current) => current.filter((hive) => hive.apiaryId !== apiaryId));
    setInspections((current) => current.filter((inspection) => !hiveIdSet.has(inspection.hiveId)));
    setEvents((current) => current.filter((event) => !hiveIdSet.has(event.hiveId)));
    setManualTasks((current) => current.filter((task) => task.apiaryId !== apiaryId && (!task.hiveId || !hiveIdSet.has(task.hiveId))));
    void deleteLocalImageUris(urisToDelete);
  }, [events, hives, inspections]);

  const addInspection = useCallback((input: NewInspectionInput) => {
    const performedAt = input.performedAt ?? new Date().toISOString();
    const inspection: Inspection = {
      id: `insp-${Crypto.randomUUID()}`,
      ...input,
      performedAt,
    };

    const targetHive = hives.find((hive) => hive.id === input.hiveId);
    if (targetHive) {
      const updatedLastInspection =
        !targetHive.lastInspectionAt || new Date(performedAt).getTime() >= new Date(targetHive.lastInspectionAt).getTime()
          ? performedAt
          : targetHive.lastInspectionAt;
      const updatedHive: Hive = {
        ...targetHive,
        ...(updatedLastInspection === performedAt ? deriveHiveStatus(input) : {}),
        lastInspectionAt: updatedLastInspection,
      };
      saveInspectionAndHiveSync(inspection, updatedHive);
      setInspections((current) => [inspection, ...current]);
      setHives((current) => current.map((hive) => (hive.id === input.hiveId ? updatedHive : hive)));
    } else {
      saveInspectionSync(inspection);
      setInspections((current) => [inspection, ...current]);
    }
  }, [hives]);

  const updateInspection = useCallback((inspectionId: string, input: UpdateInspectionInput) => {
    const currentInspection = inspections.find((item) => item.id === inspectionId);
    if (!currentInspection) {
      return undefined;
    }

    const updatedInspection: Inspection = {
      ...currentInspection,
      ...input,
    };
    saveInspectionSync(updatedInspection);
    setInspections((current) => current.map((item) => (item.id === inspectionId ? updatedInspection : item)));
    return updatedInspection;
  }, [inspections]);

  const deleteInspection = useCallback((inspectionId: string) => {
    const target = inspections.find((inspection) => inspection.id === inspectionId);
    deleteInspectionSync(inspectionId);
    setInspections((current) => current.filter((inspection) => inspection.id !== inspectionId));
    if (target?.imageUris?.length) {
      void deleteLocalImageUris(target.imageUris);
    }
  }, [inspections]);

  const addEvent = useCallback((input: NewHiveEventInput) => {
    const performedAt = input.performedAt ?? new Date().toISOString();
    const event: HiveEvent = {
      id: `event-${Crypto.randomUUID()}`,
      ...input,
      performedAt,
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
  }, [hives]);

  const updateEvent = useCallback((eventId: string, input: UpdateHiveEventInput) => {
    const currentEvent = events.find((item) => item.id === eventId);
    if (!currentEvent) {
      return undefined;
    }

    const updatedEvent: HiveEvent = {
      ...currentEvent,
      ...input,
    };
    saveHiveEventSync(updatedEvent);
    setEvents((current) => current.map((item) => (item.id === eventId ? updatedEvent : item)));
    return updatedEvent;
  }, [events]);

  const deleteEvent = useCallback((eventId: string) => {
    const target = events.find((event) => event.id === eventId);
    deleteHiveEventSync(eventId);
    setEvents((current) => current.filter((event) => event.id !== eventId));
    if (target?.imageUris?.length) {
      void deleteLocalImageUris(target.imageUris);
    }
  }, [events]);

  const addTask = useCallback((input: NewTaskInput): Task => {
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
  }, [hives]);

  const toggleTask = useCallback((taskId: string) => {
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
  }, [manualTasks]);

  const deleteTask = useCallback((taskId: string) => {
    deleteTaskSync(taskId);
    setManualTasks((current) => current.filter((task) => task.id !== taskId));
  }, []);

  const updateUserSettings = useCallback((settings: UserSettings) => {
    saveUserSettingsSync(settings);
    setUserSettings(settings);
  }, []);

  const replaceAllData = useCallback((nextState: KupkollAppState & { userSettings?: UserSettings }) => {
    const nextUriSet = new Set<string>([
      ...nextState.hives.flatMap((h) => h.queenHistory.flatMap((q) => q.imageUris ?? [])),
      ...nextState.inspections.flatMap((i) => i.imageUris ?? []),
      ...nextState.events.flatMap((e) => e.imageUris ?? []),
    ]);
    const previousUris = [
      ...hives.flatMap((h) => h.queenHistory.flatMap((q) => q.imageUris ?? [])),
      ...inspections.flatMap((i) => i.imageUris ?? []),
      ...events.flatMap((e) => e.imageUris ?? []),
    ].filter((uri) => !nextUriSet.has(uri));

    replaceAllDataLegacySync(nextState);
    setApiaries(nextState.apiaries);
    setHives(nextState.hives);
    setInspections(nextState.inspections);
    setEvents(nextState.events);
    setManualTasks(nextState.manualTasks);
    setUserSettings(nextState.userSettings ?? DEFAULT_USER_SETTINGS);

    if (previousUris.length > 0) {
      void deleteLocalImageUris(previousUris);
    }
  }, [events, hives, inspections]);

  const apiaryById = useMemo(() => new Map(apiaries.map((apiary) => [apiary.id, apiary])), [apiaries]);
  const hiveById = useMemo(() => new Map(hives.map((hive) => [hive.id, hive])), [hives]);

  const hivesByApiaryMap = useMemo(() => {
    const map = new Map<string, Hive[]>();
    for (const hive of hives) {
      const list = map.get(hive.apiaryId);
      if (list) {
        list.push(hive);
      } else {
        map.set(hive.apiaryId, [hive]);
      }
    }
    return map;
  }, [hives]);

  const inspectionsByHiveMap = useMemo(() => {
    const map = new Map<string, Inspection[]>();
    for (const hive of hives) {
      map.set(hive.id, getInspectionsForHive(inspections, hive.id));
    }
    return map;
  }, [hives, inspections]);

  const eventsByHiveMap = useMemo(() => {
    const map = new Map<string, HiveEvent[]>();
    for (const hive of hives) {
      map.set(hive.id, getEventsForHive(events, hive.id));
    }
    return map;
  }, [events, hives]);

  const recommendationsByHiveMap = useMemo(() => {
    const map = new Map<string, Recommendation[]>();
    for (const item of derived.recommendations) {
      if (!item.hiveId) {
        continue;
      }
      const list = map.get(item.hiveId);
      if (list) {
        list.push(item);
      } else {
        map.set(item.hiveId, [item]);
      }
    }
    return map;
  }, [derived.recommendations]);

  const tasksByHiveMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.hiveId) {
        continue;
      }
      const list = map.get(task.hiveId);
      if (list) {
        list.push(task);
      } else {
        map.set(task.hiveId, [task]);
      }
    }
    return map;
  }, [tasks]);

  const getApiaryById = useCallback((id: string) => apiaryById.get(id), [apiaryById]);
  const getHiveById = useCallback((id: string) => hiveById.get(id), [hiveById]);
  const getHivesByApiary = useCallback((apiaryId: string) => hivesByApiaryMap.get(apiaryId) ?? [], [hivesByApiaryMap]);
  const getInspectionsForHiveCb = useCallback(
    (hiveId: string) => inspectionsByHiveMap.get(hiveId) ?? getInspectionsForHive(inspections, hiveId),
    [inspections, inspectionsByHiveMap],
  );
  const getEventsForHiveCb = useCallback(
    (hiveId: string) => eventsByHiveMap.get(hiveId) ?? getEventsForHive(events, hiveId),
    [events, eventsByHiveMap],
  );
  const getRecommendationsForHive = useCallback(
    (hiveId: string) => recommendationsByHiveMap.get(hiveId) ?? [],
    [recommendationsByHiveMap],
  );
  const getTasksForHive = useCallback((hiveId: string) => tasksByHiveMap.get(hiveId) ?? [], [tasksByHiveMap]);

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
      updateInspection,
      deleteInspection,
      addEvent,
      updateEvent,
      deleteEvent,
      addTask,
      toggleTask,
      deleteTask,
      updateUserSettings,
      replaceAllData,
      getApiaryById,
      getHiveById,
      getHivesByApiary,
      getInspectionsForHive: getInspectionsForHiveCb,
      getEventsForHive: getEventsForHiveCb,
      getRecommendationsForHive,
      getTasksForHive,
    }),
    [
      apiaries,
      hives,
      inspections,
      events,
      manualTasks,
      userSettings,
      derived.recommendations,
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
      updateInspection,
      deleteInspection,
      addEvent,
      updateEvent,
      deleteEvent,
      addTask,
      toggleTask,
      deleteTask,
      updateUserSettings,
      replaceAllData,
      getApiaryById,
      getHiveById,
      getHivesByApiary,
      getInspectionsForHiveCb,
      getEventsForHiveCb,
      getRecommendationsForHive,
      getTasksForHive,
    ],
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