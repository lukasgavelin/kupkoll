import AsyncStorage from '@react-native-async-storage/async-storage';

import { Apiary, Hive, HiveBoxSystem, HiveEvent, HiveEventDetails, HiveEventType, hiveEventTypes, Inspection, InspectionAdvancedDetails, InspectionMode, InspectionVarroaDetails, InspectionWeather, InspectionWeatherCondition, InspectionWeatherWind, QueenChangeStatus, Task, VarroaControlMethod, VarroaLevel } from '@/types/domain';

const KUPKOLL_APP_STATE_STORAGE_KEY = 'kupkoll:app-state';
const LEGACY_BEEHAVEN_APP_STATE_STORAGE_KEY = 'beehaven:app-state';
const KUPKOLL_APP_STATE_VERSION = 6;

export type KupkollAppState = {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  events: HiveEvent[];
  manualTasks: Task[];
};

type PersistedKupkollAppState = KupkollAppState & {
  version: number;
};

type LegacyPersistedKupkollAppState = {
  apiaries?: unknown;
  hives?: unknown;
  inspections?: unknown;
  events?: unknown;
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

function normalizeInspectionWeatherCondition(value: unknown): InspectionWeatherCondition | undefined {
  return value === 'Soligt' || value === 'Växlande molnighet' || value === 'Mulet' || value === 'Duggregn' || value === 'Regn' ? value : undefined;
}

function normalizeInspectionWeatherWind(value: unknown): InspectionWeatherWind | undefined {
  return value === 'Lugnt' || value === 'Måttlig vind' || value === 'Blåsigt' ? value : undefined;
}

function normalizeVarroaControlMethod(value: unknown): VarroaControlMethod | undefined {
  return value === 'Nedfall' || value === 'Skakprov' || value === 'Sockerprov' || value === 'Alkoholprov' || value === 'Annan metod' ? value : undefined;
}

function normalizeInspectionMode(value: unknown): InspectionMode {
  return value === 'Fördjupad genomgång' ? value : 'Snabb genomgång';
}

function normalizeQueenChangeStatus(value: unknown): QueenChangeStatus | undefined {
  return value === 'Inte aktuell' || value === 'Planerat' || value === 'Genomfört' ? value : undefined;
}

function normalizeHiveEventType(value: unknown): HiveEventType | undefined {
  return typeof value === 'string' && hiveEventTypes.includes(value as HiveEventType) ? (value as HiveEventType) : undefined;
}

function normalizeInspectionWeather(value: unknown): InspectionWeather | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const condition = normalizeInspectionWeatherCondition(candidate.condition);
  const wind = normalizeInspectionWeatherWind(candidate.wind);
  const temperatureC = typeof candidate.temperatureC === 'number' && Number.isFinite(candidate.temperatureC) ? candidate.temperatureC : undefined;
  const note = typeof candidate.note === 'string' && candidate.note.trim() ? candidate.note.trim() : undefined;

  if (condition === undefined && wind === undefined && temperatureC === undefined && note === undefined) {
    return undefined;
  }

  return {
    condition,
    wind,
    temperatureC,
    note,
  };
}

function normalizeInspectionAdvancedDetails(value: unknown): InspectionAdvancedDetails | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const treatment = typeof candidate.treatment === 'string' && candidate.treatment.trim() ? candidate.treatment.trim() : undefined;
  const feeding = typeof candidate.feeding === 'string' && candidate.feeding.trim() ? candidate.feeding.trim() : undefined;
  const queenChangeStatus = normalizeQueenChangeStatus(candidate.queenChangeStatus);
  const honeySuperOn = typeof candidate.honeySuperOn === 'boolean' ? candidate.honeySuperOn : undefined;
  const splitMade = typeof candidate.splitMade === 'boolean' ? candidate.splitMade : undefined;

  if (treatment === undefined && feeding === undefined && queenChangeStatus === undefined && honeySuperOn === undefined && splitMade === undefined) {
    return undefined;
  }

  return {
    treatment,
    feeding,
    queenChangeStatus,
    honeySuperOn,
    splitMade,
  };
}

function normalizeInspectionVarroaDetails(value: unknown, varroaLevel: VarroaLevel): InspectionVarroaDetails | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return varroaLevel === 'Ej kontrollerad' ? undefined : { checked: true };
  }

  const candidate = value as Record<string, unknown>;
  const controlMethod = normalizeVarroaControlMethod(candidate.controlMethod);
  const measurementValue = typeof candidate.measurementValue === 'string' && candidate.measurementValue.trim() ? candidate.measurementValue.trim() : undefined;
  const treatmentPerformed = typeof candidate.treatmentPerformed === 'boolean' ? candidate.treatmentPerformed : undefined;
  const treatmentNote = typeof candidate.treatmentNote === 'string' && candidate.treatmentNote.trim() ? candidate.treatmentNote.trim() : undefined;
  const checked = typeof candidate.checked === 'boolean' ? candidate.checked : varroaLevel !== 'Ej kontrollerad';

  if (!checked && controlMethod === undefined && measurementValue === undefined && treatmentPerformed === undefined && treatmentNote === undefined) {
    return undefined;
  }

  return {
    checked,
    controlMethod,
    measurementValue,
    treatmentPerformed,
    treatmentNote,
  };
}

function normalizeHiveEventDetails(value: unknown): HiveEventDetails | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const mergedWithHiveName = typeof candidate.mergedWithHiveName === 'string' && candidate.mergedWithHiveName.trim() ? candidate.mergedWithHiveName.trim() : undefined;
  const queenYear = typeof candidate.queenYear === 'string' && candidate.queenYear.trim() ? candidate.queenYear.trim() : undefined;
  const markingNote = typeof candidate.markingNote === 'string' && candidate.markingNote.trim() ? candidate.markingNote.trim() : undefined;
  const honeySuperCount = typeof candidate.honeySuperCount === 'number' && Number.isFinite(candidate.honeySuperCount) ? candidate.honeySuperCount : undefined;
  const harvestSummary = typeof candidate.harvestSummary === 'string' && candidate.harvestSummary.trim() ? candidate.harvestSummary.trim() : undefined;
  const feedingSummary = typeof candidate.feedingSummary === 'string' && candidate.feedingSummary.trim() ? candidate.feedingSummary.trim() : undefined;

  if (
    mergedWithHiveName === undefined &&
    queenYear === undefined &&
    markingNote === undefined &&
    honeySuperCount === undefined &&
    harvestSummary === undefined &&
    feedingSummary === undefined
  ) {
    return undefined;
  }

  return {
    mergedWithHiveName,
    queenYear,
    markingNote,
    honeySuperCount,
    harvestSummary,
    feedingSummary,
  };
}

function normalizeHive(item: Record<string, unknown>): Hive {
  return {
    ...(item as Hive),
    boxSystem: normalizeHiveBoxSystem(item.boxSystem),
  };
}

function normalizeInspection(item: Record<string, unknown>): Inspection {
  const varroaLevel = normalizeVarroaLevel(item.varroaLevel);

  return {
    ...(item as Inspection),
    mode: normalizeInspectionMode(item.mode),
    varroaLevel,
    varroaDetails: normalizeInspectionVarroaDetails(item.varroaDetails, varroaLevel),
    weather: normalizeInspectionWeather(item.weather),
    advancedDetails: normalizeInspectionAdvancedDetails(item.advancedDetails),
  };
}

function normalizeHiveEvent(item: Record<string, unknown>): HiveEvent | null {
  const type = normalizeHiveEventType(item.type);

  if (!type || typeof item.id !== 'string' || typeof item.hiveId !== 'string' || typeof item.performedAt !== 'string') {
    return null;
  }

  return {
    id: item.id,
    hiveId: item.hiveId,
    type,
    performedAt: item.performedAt,
    notes: typeof item.notes === 'string' ? item.notes.trim() : '',
    details: normalizeHiveEventDetails(item.details),
  };
}

function createParsedState(candidate: {
  apiaries: unknown;
  hives: unknown;
  inspections: unknown;
  events?: unknown;
  manualTasks: unknown;
}): KupkollAppState | null {
  if (
    !isObjectArray(candidate.apiaries) ||
    !isObjectArray(candidate.hives) ||
    !isObjectArray(candidate.inspections) ||
    (candidate.events !== undefined && !isObjectArray(candidate.events)) ||
    !isObjectArray(candidate.manualTasks)
  ) {
    return null;
  }

  return {
    apiaries: candidate.apiaries as Apiary[],
    hives: candidate.hives.map(normalizeHive),
    inspections: candidate.inspections.map(normalizeInspection),
    events: (candidate.events ?? []).map((item) => normalizeHiveEvent(item)).filter((item): item is HiveEvent => Boolean(item)),
    manualTasks: candidate.manualTasks as Task[],
  };
}

function migrateLegacyState(candidate: LegacyPersistedKupkollAppState): KupkollAppState | null {
  return createParsedState({
    apiaries: candidate.apiaries,
    hives: candidate.hives,
    inspections: candidate.inspections,
    events: candidate.events ?? [],
    manualTasks: candidate.manualTasks ?? candidate.tasks ?? [],
  });
}

export function createSeedKupkollState(): KupkollAppState {
  return {
    apiaries: [],
    hives: [],
    inspections: [],
    events: [],
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

  if (version !== 2 && version !== 3 && version !== 4 && version !== 5 && version !== KUPKOLL_APP_STATE_VERSION) {
    return null;
  }

  return createParsedState({
    apiaries: candidate.apiaries,
    hives: candidate.hives,
    inspections: candidate.inspections,
    events: candidate.events ?? [],
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