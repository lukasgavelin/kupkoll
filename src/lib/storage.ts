import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiaries as initialApiaries, hives as initialHives, inspections as initialInspections, tasks as initialTasks } from '@/data/mock';
import { Apiary, Hive, Inspection, Task, VarroaLevel } from '@/types/domain';

const BEEHAVEN_APP_STATE_STORAGE_KEY = 'beehaven:app-state';
const BEEHAVEN_APP_STATE_VERSION = 1;

export type BeehavenAppState = {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  manualTasks: Task[];
};

type PersistedBeehavenAppState = BeehavenAppState & {
  version: number;
};

type LegacyPersistedBeehavenAppState = {
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
}): BeehavenAppState | null {
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
    hives: candidate.hives as Hive[],
    inspections: candidate.inspections.map(normalizeInspection),
    manualTasks: candidate.manualTasks as Task[],
  };
}

function migrateLegacyState(candidate: LegacyPersistedBeehavenAppState): BeehavenAppState | null {
  return createParsedState({
    apiaries: candidate.apiaries,
    hives: candidate.hives,
    inspections: candidate.inspections,
    manualTasks: candidate.manualTasks ?? candidate.tasks ?? [],
  });
}

export function createSeedBeehavenState(): BeehavenAppState {
  return {
    apiaries: cloneItems(initialApiaries),
    hives: cloneItems(initialHives),
    inspections: cloneItems(initialInspections),
    manualTasks: cloneItems(initialTasks),
  };
}

export function parsePersistedBeehavenState(input: unknown): BeehavenAppState | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const candidate = input as LegacyPersistedBeehavenAppState;
  const version = candidate.version;

  if (version === undefined) {
    return migrateLegacyState(candidate);
  }

  if (version !== BEEHAVEN_APP_STATE_VERSION) {
    return null;
  }

  return createParsedState({
    apiaries: candidate.apiaries,
    hives: candidate.hives,
    inspections: candidate.inspections,
    manualTasks: candidate.manualTasks,
  });
}

export async function loadBeehavenState(): Promise<BeehavenAppState> {
  try {
    const raw = await AsyncStorage.getItem(BEEHAVEN_APP_STATE_STORAGE_KEY);

    if (!raw) {
      return createSeedBeehavenState();
    }

    const parsed = JSON.parse(raw);
    return parsePersistedBeehavenState(parsed) ?? createSeedBeehavenState();
  } catch {
    return createSeedBeehavenState();
  }
}

export async function saveBeehavenState(state: BeehavenAppState) {
  const payload: PersistedBeehavenAppState = {
    version: BEEHAVEN_APP_STATE_VERSION,
    ...state,
  };

  await AsyncStorage.setItem(BEEHAVEN_APP_STATE_STORAGE_KEY, JSON.stringify(payload));
}