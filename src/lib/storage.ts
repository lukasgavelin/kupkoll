import AsyncStorage from '@react-native-async-storage/async-storage';

import { Apiary, Hive, HiveBoxSystem, Inspection, Task, VarroaLevel } from '@/types/domain';

const KUPKOLL_APP_STATE_STORAGE_KEY = 'kupkoll:app-state';
const LEGACY_BEEHAVEN_APP_STATE_STORAGE_KEY = 'beehaven:app-state';
const KUPKOLL_APP_STATE_VERSION = 2;

export type KupkollAppState = {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  manualTasks: Task[];
};

type PersistedKupkollAppState = KupkollAppState & {
  version: number;
};

type LegacyPersistedKupkollAppState = {
  apiaries?: unknown;
  hives?: unknown;
  inspections?: unknown;
  tasks?: unknown;
  manualTasks?: unknown;
  version?: unknown;
};

function cloneItems<T extends Record<string, unknown>>(items: T[]) {
  return items.map((item) => ({ ...item }));
}

function isObjectArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && !Array.isArray(item));
}

function normalizeVarroaLevel(value: unknown): VarroaLevel {
  return value === 'Låg' || value === 'Förhöjd' || value === 'Hög' || value === 'Ej kontrollerad' ? value : 'Ej kontrollerad';
}

function normalizeHiveBoxSystem(value: unknown): HiveBoxSystem {
  if (value === 'Lågnormal 10 ramar') {
    return 'Lågnormal';
  }

  if (value === 'Svensk normal') {
    return 'Svea';
  }

  return value === 'Lågnormal' || value === 'Svea' || value === 'Langstroth' || value === 'Dadant' ? value : 'Lågnormal';
}

function normalizeHive(item: Record<string, unknown>): Hive {
  return {
    ...(item as Hive),
    boxSystem: normalizeHiveBoxSystem(item.boxSystem),
  };
}

function normalizeInspection(item: Record<string, unknown>): Inspection {
  return {
    ...(item as Inspection),
    varroaLevel: normalizeVarroaLevel(item.varroaLevel),
  };
}

function createParsedState(candidate: {
  apiaries: unknown;
  hives: unknown;
  inspections: unknown;
  manualTasks: unknown;
}): KupkollAppState | null {
  if (
    !isObjectArray(candidate.apiaries) ||
    !isObjectArray(candidate.hives) ||
    !isObjectArray(candidate.inspections) ||
    !isObjectArray(candidate.manualTasks)
  ) {
    return null;
  }

  return {
    apiaries: candidate.apiaries as Apiary[],
    hives: candidate.hives.map(normalizeHive),
    inspections: candidate.inspections.map(normalizeInspection),
    manualTasks: candidate.manualTasks as Task[],
  };
}

function migrateLegacyState(candidate: LegacyPersistedKupkollAppState): KupkollAppState | null {
  return createParsedState({
    apiaries: candidate.apiaries,
    hives: candidate.hives,
    inspections: candidate.inspections,
    manualTasks: candidate.manualTasks ?? candidate.tasks ?? [],
  });
}

export function createSeedKupkollState(): KupkollAppState {
  return {
    apiaries: [],
    hives: [],
    inspections: [],
    manualTasks: [],
  };
}

export function parsePersistedKupkollState(input: unknown): KupkollAppState | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const candidate = input as LegacyPersistedKupkollAppState;
  const version = candidate.version;

  if (version === undefined) {
    return migrateLegacyState(candidate);
  }

  if (version !== KUPKOLL_APP_STATE_VERSION) {
    return null;
  }

  return createParsedState({
    apiaries: candidate.apiaries,
    hives: candidate.hives,
    inspections: candidate.inspections,
    manualTasks: candidate.manualTasks,
  });
}

export async function loadKupkollState(): Promise<KupkollAppState> {
  try {
    const currentRaw = await AsyncStorage.getItem(KUPKOLL_APP_STATE_STORAGE_KEY);
    const legacyRaw = currentRaw ? null : await AsyncStorage.getItem(LEGACY_BEEHAVEN_APP_STATE_STORAGE_KEY);
    const raw = currentRaw ?? legacyRaw;

    if (!raw) {
      return createSeedKupkollState();
    }

    const parsed = JSON.parse(raw);
    const state = parsePersistedKupkollState(parsed) ?? createSeedKupkollState();

    if (!currentRaw && legacyRaw) {
      await saveKupkollState(state);
      await AsyncStorage.removeItem(LEGACY_BEEHAVEN_APP_STATE_STORAGE_KEY);
    }

    return state;
  } catch {
    return createSeedKupkollState();
  }
}

export async function saveKupkollState(state: KupkollAppState) {
  const payload: PersistedKupkollAppState = {
    version: KUPKOLL_APP_STATE_VERSION,
    ...state,
  };

  await AsyncStorage.setItem(KUPKOLL_APP_STATE_STORAGE_KEY, JSON.stringify(payload));
}