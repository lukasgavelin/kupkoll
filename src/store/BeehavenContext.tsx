import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { buildDerivedSignals } from '@/lib/rules';
import { getDashboardStats, getLatestInspectionMap, getUpcomingTasks } from '@/lib/selectors';
import { BeehavenAppState, saveBeehavenState } from '@/lib/storage';
import { deriveTabTutorialViewState } from '@/lib/tutorialState';
import { Apiary, Hive, Inspection, NewApiaryInput, NewHiveInput, NewInspectionInput, Recommendation, Task, UpdateApiaryInput, UpdateHiveInput } from '@/types/domain';

const TAB_TUTORIAL_STORAGE_KEY = 'beehaven:first-run-tab-tutorial';

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
  tabTutorialReady: boolean;
  tabTutorialPromptVisible: boolean;
  tabTutorialVisible: boolean;
  addApiary: (input: NewApiaryInput) => Apiary;
  addHive: (input: NewHiveInput) => Hive;
  updateApiary: (apiaryId: string, input: UpdateApiaryInput) => Apiary | undefined;
  updateHive: (hiveId: string, input: UpdateHiveInput) => Hive | undefined;
  deleteApiary: (apiaryId: string) => void;
  deleteHive: (hiveId: string) => void;
  addInspection: (input: NewInspectionInput) => void;
  completeTabTutorial: () => Promise<void>;
  resetTabTutorial: () => Promise<void>;
  startTabTutorial: () => Promise<void>;
  skipTabTutorial: () => Promise<void>;
  getApiaryById: (id: string) => Apiary | undefined;
  getHiveById: (id: string) => Hive | undefined;
  getHivesByApiary: (apiaryId: string) => Hive[];
  getInspectionsForHive: (hiveId: string) => Inspection[];
  getRecommendationsForHive: (hiveId: string) => Recommendation[];
  getTasksForHive: (hiveId: string) => Task[];
};

const BeehavenContext = createContext<BeehavenContextValue | undefined>(undefined);

function deriveHiveStatus(input: NewInspectionInput): Pick<Hive, 'status' | 'queenStatus' | 'temperament'> {
  const queenStatus = input.queenSeen || input.eggsSeen ? 'Bekräftad' : input.actionNeeded ? 'Behöver följas upp' : 'Osäker';
  const status = input.actionNeeded || input.varroaLevel === 'Hög' || (!input.openBrood && !input.cappedBrood) ? 'Behöver åtgärd' : 'Stabilt';

  return {
    status,
    queenStatus,
    temperament: input.temperament,
  };
}

export function BeehavenProvider({ children, initialData }: { children: ReactNode; initialData: BeehavenAppState }) {
  const [apiaries, setApiaries] = useState(initialData.apiaries);
  const [hives, setHives] = useState(initialData.hives);
  const [inspections, setInspections] = useState(initialData.inspections);
  const [manualTasks, setManualTasks] = useState(initialData.manualTasks);
  const [tabTutorialReady, setTabTutorialReady] = useState(false);
  const [tabTutorialPromptVisible, setTabTutorialPromptVisible] = useState(false);
  const [tabTutorialVisible, setTabTutorialVisible] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await saveBeehavenState({
          apiaries,
          hives,
          inspections,
          manualTasks,
        });
      } catch {
      }
    })();
  }, [apiaries, hives, inspections, manualTasks]);

  useEffect(() => {
    let cancelled = false;

    async function loadTabTutorialState() {
      try {
        const storedValue = await AsyncStorage.getItem(TAB_TUTORIAL_STORAGE_KEY);
        const viewState = deriveTabTutorialViewState(storedValue);

        if (!cancelled) {
          setTabTutorialPromptVisible(viewState.promptVisible);
          setTabTutorialVisible(viewState.tutorialVisible);
          setTabTutorialReady(true);
        }
      } catch {
        if (!cancelled) {
          setTabTutorialPromptVisible(true);
          setTabTutorialVisible(false);
          setTabTutorialReady(true);
        }
      }
    }

    loadTabTutorialState();

    return () => {
      cancelled = true;
    };
  }, []);

  const derived = useMemo(() => buildDerivedSignals(apiaries, hives, inspections), [apiaries, hives, inspections]);
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
      id: `apiary-${Date.now()}`,
      ...input,
    };

    setApiaries((current) => [apiary, ...current]);
    return apiary;
  }

  function addHive(input: NewHiveInput) {
    const hive: Hive = {
      id: `hive-${Date.now()}`,
      status: 'Under uppbyggnad',
      queenStatus: 'Behöver följas upp',
      ...input,
    };

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
    };

    setHives((current) => current.map((hive) => (hive.id === hiveId ? updatedHive : hive)));
    return updatedHive;
  }

  function deleteHive(hiveId: string) {
    setHives((current) => current.filter((hive) => hive.id !== hiveId));
    setInspections((current) => current.filter((inspection) => inspection.hiveId !== hiveId));
    setManualTasks((current) => current.filter((task) => task.hiveId !== hiveId));
  }

  function deleteApiary(apiaryId: string) {
    const hiveIds = hives.filter((hive) => hive.apiaryId === apiaryId).map((hive) => hive.id);

    setApiaries((current) => current.filter((apiary) => apiary.id !== apiaryId));
    setHives((current) => current.filter((hive) => hive.apiaryId !== apiaryId));
    setInspections((current) => current.filter((inspection) => !hiveIds.includes(inspection.hiveId)));
    setManualTasks((current) => current.filter((task) => task.apiaryId !== apiaryId && (!task.hiveId || !hiveIds.includes(task.hiveId))));
  }

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

  async function completeTabTutorial() {
    setTabTutorialPromptVisible(false);
    setTabTutorialVisible(false);

    try {
      await AsyncStorage.setItem(TAB_TUTORIAL_STORAGE_KEY, 'done');
    } catch {
    }
  }

  async function resetTabTutorial() {
    setTabTutorialPromptVisible(true);
    setTabTutorialVisible(false);
    setTabTutorialReady(true);

    try {
      await AsyncStorage.removeItem(TAB_TUTORIAL_STORAGE_KEY);
    } catch {
    }
  }

  async function startTabTutorial() {
    setTabTutorialPromptVisible(false);
    setTabTutorialVisible(true);
    setTabTutorialReady(true);

    try {
      await AsyncStorage.setItem(TAB_TUTORIAL_STORAGE_KEY, 'active');
    } catch {
    }
  }

  async function skipTabTutorial() {
    await completeTabTutorial();
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
      tabTutorialReady,
      tabTutorialPromptVisible,
      tabTutorialVisible,
      addApiary,
      addHive,
      updateApiary,
      updateHive,
      deleteApiary,
      deleteHive,
      addInspection,
      completeTabTutorial,
      resetTabTutorial,
      startTabTutorial,
      skipTabTutorial,
      getApiaryById: (id) => apiaries.find((apiary) => apiary.id === id),
      getHiveById: (id) => hives.find((hive) => hive.id === id),
      getHivesByApiary: (apiaryId) => hives.filter((hive) => hive.apiaryId === apiaryId),
      getInspectionsForHive: (hiveId) =>
        [...inspections]
          .filter((inspection) => inspection.hiveId === hiveId)
          .sort((left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime()),
      getRecommendationsForHive: (hiveId) => derived.recommendations.filter((item) => item.hiveId === hiveId),
      getTasksForHive: (hiveId) => tasks.filter((task) => task.hiveId === hiveId),
    }),
    [apiaries, hives, inspections, manualTasks, derived.recommendations, tasks, latestInspectionMap, dashboard, tabTutorialReady, tabTutorialPromptVisible, tabTutorialVisible],
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