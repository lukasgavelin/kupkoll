import { KupkollAppState } from '@/lib/storage';
import { Apiary, Hive, HiveEvent, Inspection, Task, UserSettings } from '@/types/domain';

const WEB_DB_STORAGE_KEY = 'kupkoll_web_db_v1';

export const DEFAULT_USER_SETTINGS: UserSettings = {
  experienceLevel: 'experienced',
};

type WebDbState = {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  events: HiveEvent[];
  manualTasks: Task[];
  userSettings: UserSettings;
};

let memoryFallbackState: WebDbState | null = null;

function createEmptyState(): WebDbState {
  return {
    apiaries: [],
    hives: [],
    inspections: [],
    events: [],
    manualTasks: [],
    userSettings: { ...DEFAULT_USER_SETTINGS },
  };
}

function readState(): WebDbState {
  if (typeof globalThis.localStorage !== 'undefined') {
    try {
      const raw = globalThis.localStorage.getItem(WEB_DB_STORAGE_KEY);
      if (!raw) {
        return createEmptyState();
      }
      const parsed = JSON.parse(raw) as Partial<WebDbState>;
      return {
        apiaries: Array.isArray(parsed.apiaries) ? parsed.apiaries : [],
        hives: Array.isArray(parsed.hives) ? parsed.hives : [],
        inspections: Array.isArray(parsed.inspections) ? parsed.inspections : [],
        events: Array.isArray(parsed.events) ? parsed.events : [],
        manualTasks: Array.isArray(parsed.manualTasks) ? parsed.manualTasks : [],
        userSettings: parsed.userSettings ?? { ...DEFAULT_USER_SETTINGS },
      };
    } catch (error) {
      console.warn('[Kupkoll Web DB] Kunde inte läsa localStorage:', error);
    }
  }

  if (!memoryFallbackState) {
    memoryFallbackState = createEmptyState();
  }
  return memoryFallbackState;
}

function writeState(state: WebDbState): void {
  memoryFallbackState = state;
  if (typeof globalThis.localStorage !== 'undefined') {
    try {
      globalThis.localStorage.setItem(WEB_DB_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[Kupkoll Web DB] Kunde inte skriva till localStorage:', error);
    }
  }
}

function upsertById<T extends { id: string }>(items: T[], nextItem: T): T[] {
  const index = items.findIndex((item) => item.id === nextItem.id);
  if (index === -1) {
    return [nextItem, ...items];
  }
  const copy = [...items];
  copy[index] = nextItem;
  return copy;
}

export function getDbSync() {
  return null;
}

export function withTransactionSync(fn: () => void) {
  fn();
}

export function initDbSync() {
  if (typeof globalThis.localStorage !== 'undefined' && !globalThis.localStorage.getItem(WEB_DB_STORAGE_KEY)) {
    writeState(createEmptyState());
  }
}

export function loadAllDataSync() {
  return loadFullExportDataSync();
}

export function loadFullExportDataSync(): KupkollAppState & { userSettings: UserSettings } {
  const state = readState();
  return {
    ...state,
    inspections: [...state.inspections].sort((a, b) => b.performedAt.localeCompare(a.performedAt)),
    events: [...state.events].sort((a, b) => b.performedAt.localeCompare(a.performedAt)),
  };
}

export function saveApiarySync(apiary: Apiary) {
  const state = readState();
  writeState({
    ...state,
    apiaries: upsertById(state.apiaries, apiary),
  });
}

export function deleteApiarySync(apiaryId: string) {
  const state = readState();
  const deletedHiveIds = new Set(state.hives.filter((h) => h.apiaryId === apiaryId).map((h) => h.id));
  writeState({
    ...state,
    apiaries: state.apiaries.filter((a) => a.id !== apiaryId),
    hives: state.hives.filter((h) => h.apiaryId !== apiaryId),
    inspections: state.inspections.filter((i) => !deletedHiveIds.has(i.hiveId)),
    events: state.events.filter((e) => !deletedHiveIds.has(e.hiveId)),
    manualTasks: state.manualTasks.filter((t) => t.apiaryId !== apiaryId && (!t.hiveId || !deletedHiveIds.has(t.hiveId))),
  });
}

export function saveHiveSync(hive: Hive) {
  const state = readState();
  writeState({
    ...state,
    hives: upsertById(state.hives, hive),
  });
}

export function deleteHiveSync(hiveId: string) {
  const state = readState();
  writeState({
    ...state,
    hives: state.hives.filter((h) => h.id !== hiveId),
    inspections: state.inspections.filter((i) => i.hiveId !== hiveId),
    events: state.events.filter((e) => e.hiveId !== hiveId),
    manualTasks: state.manualTasks.filter((t) => t.hiveId !== hiveId),
  });
}

export function saveInspectionSync(inspection: Inspection) {
  const state = readState();
  writeState({
    ...state,
    inspections: upsertById(state.inspections, inspection),
  });
}

export function deleteInspectionSync(inspectionId: string) {
  const state = readState();
  writeState({
    ...state,
    inspections: state.inspections.filter((i) => i.id !== inspectionId),
  });
}

export function saveInspectionAndHiveSync(inspection: Inspection, hive: Hive) {
  const state = readState();
  writeState({
    ...state,
    inspections: upsertById(state.inspections, inspection),
    hives: upsertById(state.hives, hive),
  });
}

export function saveHiveEventSync(event: HiveEvent) {
  const state = readState();
  writeState({
    ...state,
    events: upsertById(state.events, event),
  });
}

export function deleteHiveEventSync(eventId: string) {
  const state = readState();
  writeState({
    ...state,
    events: state.events.filter((e) => e.id !== eventId),
  });
}

export function saveHiveEventAndHiveSync(event: HiveEvent, hive: Hive) {
  const state = readState();
  writeState({
    ...state,
    events: upsertById(state.events, event),
    hives: upsertById(state.hives, hive),
  });
}

export function saveTaskSync(task: Task) {
  const state = readState();
  writeState({
    ...state,
    manualTasks: upsertById(state.manualTasks, task),
  });
}

export function deleteTaskSync(taskId: string) {
  const state = readState();
  writeState({
    ...state,
    manualTasks: state.manualTasks.filter((t) => t.id !== taskId),
  });
}

export function saveUserSettingsSync(settings: UserSettings) {
  const state = readState();
  writeState({
    ...state,
    userSettings: settings,
  });
}

export function replaceAllDataLegacySync(data: {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  events: HiveEvent[];
  manualTasks: Task[];
  userSettings?: UserSettings;
}) {
  writeState({
    apiaries: data.apiaries,
    hives: data.hives,
    inspections: data.inspections,
    events: data.events,
    manualTasks: data.manualTasks,
    userSettings: data.userSettings ?? { ...DEFAULT_USER_SETTINGS },
  });
}

export function loadInspectionsForHiveSync(hiveId: string): Inspection[] {
  const state = readState();
  return state.inspections
    .filter((i) => i.hiveId === hiveId)
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}

export function loadEventsForHiveSync(hiveId: string): HiveEvent[] {
  const state = readState();
  return state.events
    .filter((e) => e.hiveId === hiveId)
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}
