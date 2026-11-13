import { Apiary, Hive, HiveBoxSystem, HiveEvent, HiveEventDetails, HiveEventType, hiveEventTypes, Inspection, InspectionAdvancedDetails, InspectionMode, InspectionVarroaDetails, InspectionWeather, InspectionWeatherCondition, InspectionWeatherWind, QueenChangeStatus, QueenHistoryEntry, QueenMarkingColor, QueenStatus, Task, UserSettings, VarroaControlMethod, VarroaLevel, VarroaTreatmentMethod } from '@/types/domain';

const KUPKOLL_APP_STATE_VERSION = 7;

export type KupkollAppState = {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  events: HiveEvent[];
  manualTasks: Task[];
  userSettings?: UserSettings;
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
  userSettings?: unknown;
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

function normalizeQueenStatus(value: unknown): QueenStatus {
  return value === 'Bekräftad' || value === 'Osäker' || value === 'Behöver följas upp' ? value : 'Behöver följas upp';
}

function normalizeQueenMarkingColor(value: unknown): QueenMarkingColor | undefined {
  return value === 'Vit' || value === 'Gul' || value === 'Röd' || value === 'Grön' || value === 'Blå' || value === 'Omärkt' ? value : undefined;
}

function normalizeIsoDate(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return undefined;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? undefined : trimmed;
}

export function normalizeQueenHistory(value: unknown): QueenHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
      }

      const candidate = entry as Record<string, unknown>;
      const year = typeof candidate.year === 'string' && candidate.year.trim() ? candidate.year.trim() : undefined;
      const note = typeof candidate.note === 'string' && candidate.note.trim() ? candidate.note.trim() : undefined;

      if (!year || !note) {
        return null;
      }

      const imageUris = normalizeImageUris(candidate.imageUris);

      return {
        id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : `queen-history-${index}`,
        year,
        note,
        ...(imageUris ? { imageUris } : {}),
      };
    })
    .filter((entry): entry is QueenHistoryEntry => Boolean(entry));
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

function normalizeVarroaTreatmentMethod(value: unknown): VarroaTreatmentMethod | undefined {
  return value === 'Oxalsyra droppning' ||
    value === 'Oxalsyra förångning' ||
    value === 'Bandbehandling' ||
    value === 'Myrsyra' ||
    value === 'Annan metod'
    ? value
    : undefined;
}

function normalizeHiveEventDetails(value: unknown): HiveEventDetails | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const mergedWithHiveName = typeof candidate.mergedWithHiveName === 'string' && candidate.mergedWithHiveName.trim() ? candidate.mergedWithHiveName.trim() : undefined;
  const queenYear = typeof candidate.queenYear === 'string' && candidate.queenYear.trim() ? candidate.queenYear.trim() : undefined;
  const queenMarkingColor = normalizeQueenMarkingColor(candidate.queenMarkingColor);
  const queenOrigin = typeof candidate.queenOrigin === 'string' && candidate.queenOrigin.trim() ? candidate.queenOrigin.trim() : undefined;
  const queenIntroducedAt = normalizeIsoDate(candidate.queenIntroducedAt);
  const queenStatus = candidate.queenStatus === undefined ? undefined : normalizeQueenStatus(candidate.queenStatus);
  const queenHistoryNote = typeof candidate.queenHistoryNote === 'string' && candidate.queenHistoryNote.trim() ? candidate.queenHistoryNote.trim() : undefined;
  const markingNote = typeof candidate.markingNote === 'string' && candidate.markingNote.trim() ? candidate.markingNote.trim() : undefined;
  const honeySuperCount = typeof candidate.honeySuperCount === 'number' && Number.isFinite(candidate.honeySuperCount) ? candidate.honeySuperCount : undefined;
  const harvestSummary = typeof candidate.harvestSummary === 'string' && candidate.harvestSummary.trim() ? candidate.harvestSummary.trim() : undefined;
  const feedingSummary = typeof candidate.feedingSummary === 'string' && candidate.feedingSummary.trim() ? candidate.feedingSummary.trim() : undefined;
  const varroaTreatmentMethod = normalizeVarroaTreatmentMethod(candidate.varroaTreatmentMethod);
  const varroaTreatmentNote = typeof candidate.varroaTreatmentNote === 'string' && candidate.varroaTreatmentNote.trim() ? candidate.varroaTreatmentNote.trim() : undefined;
  const varroaMeasurementValue = typeof candidate.varroaMeasurementValue === 'string' && candidate.varroaMeasurementValue.trim() ? candidate.varroaMeasurementValue.trim() : undefined;
  const varroaControlMethod = normalizeVarroaControlMethod(candidate.varroaControlMethod);

  if (
    mergedWithHiveName === undefined &&
    queenYear === undefined &&
    queenMarkingColor === undefined &&
    queenOrigin === undefined &&
    queenIntroducedAt === undefined &&
    queenStatus === undefined &&
    queenHistoryNote === undefined &&
    markingNote === undefined &&
    honeySuperCount === undefined &&
    harvestSummary === undefined &&
    feedingSummary === undefined &&
    varroaTreatmentMethod === undefined &&
    varroaTreatmentNote === undefined &&
    varroaMeasurementValue === undefined &&
    varroaControlMethod === undefined
  ) {
    return undefined;
  }

  return {
    mergedWithHiveName,
    queenYear,
    queenMarkingColor,
    queenOrigin,
    queenIntroducedAt,
    queenStatus,
    queenHistoryNote,
    markingNote,
    honeySuperCount,
    harvestSummary,
    feedingSummary,
    varroaTreatmentMethod,
    varroaTreatmentNote,
    varroaMeasurementValue,
    varroaControlMethod,
  };
}

function normalizeHive(item: Record<string, unknown>): Hive {
  const queenYear = typeof item.queenYear === 'string' && item.queenYear.trim() ? item.queenYear.trim() : undefined;
  const queenOrigin = typeof item.queenOrigin === 'string' && item.queenOrigin.trim() ? item.queenOrigin.trim() : undefined;

  return {
    ...(item as Hive),
    queenStatus: normalizeQueenStatus(item.queenStatus),
    boxSystem: normalizeHiveBoxSystem(item.boxSystem),
    queenYear,
    queenMarkingColor: normalizeQueenMarkingColor(item.queenMarkingColor),
    queenOrigin,
    queenIntroducedAt: normalizeIsoDate(item.queenIntroducedAt),
    queenHistory: normalizeQueenHistory(item.queenHistory),
  };
}

function normalizeInspection(item: Record<string, unknown>): Inspection {
  const varroaLevel = normalizeVarroaLevel(item.varroaLevel);
  const { imageUris: rawImageUris, ...rest } = item;
  const imageUris = normalizeImageUris(rawImageUris);

  return {
    ...(rest as Inspection),
    mode: normalizeInspectionMode(item.mode),
    varroaLevel,
    varroaDetails: normalizeInspectionVarroaDetails(item.varroaDetails, varroaLevel),
    weather: normalizeInspectionWeather(item.weather),
    advancedDetails: normalizeInspectionAdvancedDetails(item.advancedDetails),
    ...(imageUris ? { imageUris } : {}),
  };
}

function normalizeImageUris(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const uris = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return uris.length > 0 ? uris : undefined;
}

function normalizeUserSettings(value: unknown): UserSettings | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.experienceLevel === 'beginner' || candidate.experienceLevel === 'experienced') {
    return {
      experienceLevel: candidate.experienceLevel,
    };
  }

  return undefined;
}

function normalizeHiveEvent(item: Record<string, unknown>): HiveEvent | null {
  const type = normalizeHiveEventType(item.type);

  if (!type || typeof item.id !== 'string' || typeof item.hiveId !== 'string' || typeof item.performedAt !== 'string') {
    return null;
  }

  const imageUris = normalizeImageUris(item.imageUris);

  return {
    id: item.id,
    hiveId: item.hiveId,
    type,
    performedAt: item.performedAt,
    notes: typeof item.notes === 'string' ? item.notes.trim() : '',
    ...(imageUris ? { imageUris } : {}),
    details: normalizeHiveEventDetails(item.details),
  };
}

function createParsedState(candidate: {
  apiaries: unknown;
  hives: unknown;
  inspections: unknown;
  events?: unknown;
  manualTasks: unknown;
  userSettings?: unknown;
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

  const userSettings = normalizeUserSettings(candidate.userSettings);

  const apiaries: Apiary[] = [];
  const apiaryIds = new Set<string>();
  for (const item of candidate.apiaries) {
    if (typeof item.id !== 'string' || !item.id.trim() || typeof item.name !== 'string' || !item.name.trim()) {
      continue;
    }
    const id = item.id.trim();
    if (apiaryIds.has(id)) {
      continue;
    }
    apiaryIds.add(id);
    apiaries.push({
      ...(item as Apiary),
      id,
      name: item.name.trim(),
      location: typeof item.location === 'string' ? item.location : '',
      notes: typeof item.notes === 'string' ? item.notes : '',
    });
  }

  const hives: Hive[] = [];
  const hiveIds = new Set<string>();
  for (const item of candidate.hives) {
    if (
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      typeof item.apiaryId !== 'string' ||
      !apiaryIds.has(item.apiaryId) ||
      typeof item.name !== 'string' ||
      !item.name.trim()
    ) {
      continue;
    }
    const id = item.id.trim();
    if (hiveIds.has(id)) {
      continue;
    }
    hiveIds.add(id);
    hives.push(normalizeHive(item));
  }

  const inspections: Inspection[] = [];
  const inspectionIds = new Set<string>();
  for (const item of candidate.inspections) {
    if (typeof item.id !== 'string' || !item.id.trim() || typeof item.hiveId !== 'string' || !hiveIds.has(item.hiveId)) {
      continue;
    }
    const id = item.id.trim();
    if (inspectionIds.has(id)) {
      continue;
    }
    inspectionIds.add(id);
    inspections.push(normalizeInspection(item));
  }

  const events: HiveEvent[] = [];
  const eventIds = new Set<string>();
  for (const item of candidate.events ?? []) {
    const normalized = normalizeHiveEvent(item);
    if (!normalized || !hiveIds.has(normalized.hiveId) || eventIds.has(normalized.id)) {
      continue;
    }
    eventIds.add(normalized.id);
    events.push(normalized);
  }

  const manualTasks: Task[] = [];
  const taskIds = new Set<string>();
  for (const item of candidate.manualTasks) {
    if (typeof item.id !== 'string' || !item.id.trim() || typeof item.title !== 'string' || !item.title.trim()) {
      continue;
    }
    const id = item.id.trim();
    if (taskIds.has(id)) {
      continue;
    }
    taskIds.add(id);
    manualTasks.push({
      ...(item as Task),
      id,
      title: item.title.trim(),
      description: typeof item.description === 'string' ? item.description : '',
      dueDate: typeof item.dueDate === 'string' && item.dueDate.trim() ? item.dueDate : new Date().toISOString(),
      completed: Boolean(item.completed),
    });
  }

  return {
    apiaries,
    hives,
    inspections,
    events,
    manualTasks,
    ...(userSettings ? { userSettings } : {}),
  };
}

function migrateLegacyState(candidate: LegacyPersistedKupkollAppState): KupkollAppState | null {
  return createParsedState({
    apiaries: candidate.apiaries,
    hives: candidate.hives,
    inspections: candidate.inspections,
    events: candidate.events ?? [],
    manualTasks: candidate.manualTasks ?? candidate.tasks ?? [],
    userSettings: candidate.userSettings,
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

  if (version !== 2 && version !== 3 && version !== 4 && version !== 5 && version !== 6 && version !== KUPKOLL_APP_STATE_VERSION) {
    return null;
  }

  return createParsedState({
    apiaries: candidate.apiaries,
    hives: candidate.hives,
    inspections: candidate.inspections,
    events: candidate.events ?? [],
    manualTasks: candidate.manualTasks,
    userSettings: candidate.userSettings,
  });
}