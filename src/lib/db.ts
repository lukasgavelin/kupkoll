import * as SQLite from 'expo-sqlite';

import { KupkollAppState } from '@/lib/storage';
import { Apiary, Hive, HiveEvent, Inspection, Task, UserSettings } from '@/types/domain';

const DB_NAME = 'kupkoll.db';
const DB_SCHEMA_VERSION = 2;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  experienceLevel: 'experienced',
};

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDbSync() {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync(DB_NAME);
    dbInstance.execSync('PRAGMA foreign_keys = ON;');
  }
  return dbInstance;
}

export function withTransactionSync(fn: () => void) {
  const db = getDbSync();
  db.withTransactionSync(fn);
}

export function initDbSync() {
  const db = getDbSync();
  const versionRow = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    db.execSync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS Settings (
        id TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Apiaries (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Hives (
        id TEXT PRIMARY KEY,
        apiaryId TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (apiaryId) REFERENCES Apiaries(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Inspections (
        id TEXT PRIMARY KEY,
        hiveId TEXT NOT NULL,
        performedAt TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (hiveId) REFERENCES Hives(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS HiveEvents (
        id TEXT PRIMARY KEY,
        hiveId TEXT NOT NULL,
        performedAt TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (hiveId) REFERENCES Hives(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Tasks (
        id TEXT PRIMARY KEY,
        hiveId TEXT,
        apiaryId TEXT,
        data TEXT NOT NULL
      );

      PRAGMA user_version = 1;
    `);
    currentVersion = 1;
  }

  if (currentVersion < 2) {
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_inspections_hive_performed
        ON Inspections (hiveId, performedAt DESC);

      CREATE INDEX IF NOT EXISTS idx_hive_events_hive_performed
        ON HiveEvents (hiveId, performedAt DESC);

      PRAGMA user_version = ${DB_SCHEMA_VERSION};
    `);
  }
}

function safeParseJsonRows<T>(rows: { data: string }[], label: string): T[] {
  const result: T[] = [];
  for (const row of rows) {
    try {
      result.push(JSON.parse(row.data) as T);
    } catch (error) {
      console.warn(`[Kupkoll DB] Kunde inte tolka rad i ${label}:`, error);
    }
  }
  return result;
}

export function loadAllDataSync() {
  return loadFullExportDataSync();
}

export function loadFullExportDataSync(): KupkollAppState & { userSettings: UserSettings } {
  const db = getDbSync();

  const apiariesRows = db.getAllSync<{ data: string }>('SELECT data FROM Apiaries');
  const apiaries = safeParseJsonRows<Apiary>(apiariesRows, 'Apiaries');

  const hivesRows = db.getAllSync<{ data: string }>('SELECT data FROM Hives');
  const hives = safeParseJsonRows<Hive>(hivesRows, 'Hives');

  const inspectionsRows = db.getAllSync<{ data: string }>('SELECT data FROM Inspections ORDER BY performedAt DESC');
  const inspections = safeParseJsonRows<Inspection>(inspectionsRows, 'Inspections');

  const eventsRows = db.getAllSync<{ data: string }>('SELECT data FROM HiveEvents ORDER BY performedAt DESC');
  const events = safeParseJsonRows<HiveEvent>(eventsRows, 'HiveEvents');

  const tasksRows = db.getAllSync<{ data: string }>('SELECT data FROM Tasks');
  const tasks = safeParseJsonRows<Task>(tasksRows, 'Tasks');

  const settingsRow = db.getFirstSync<{ value: string }>('SELECT value FROM Settings WHERE id = "userSettings"');
  let userSettings: UserSettings = { ...DEFAULT_USER_SETTINGS };
  if (settingsRow) {
    try {
      userSettings = JSON.parse(settingsRow.value) as UserSettings;
    } catch (error) {
      console.warn('[Kupkoll DB] Kunde inte tolka Settings, använder standard:', error);
    }
  }

  return {
    apiaries,
    hives,
    inspections,
    events,
    manualTasks: tasks,
    userSettings,
  };
}

export function saveApiarySync(apiary: Apiary) {
  const db = getDbSync();
  db.runSync('INSERT OR REPLACE INTO Apiaries (id, data) VALUES (?, ?)', [apiary.id, JSON.stringify(apiary)]);
}

export function deleteApiarySync(apiaryId: string) {
  const db = getDbSync();
  withTransactionSync(() => {
    db.runSync(
      'DELETE FROM Tasks WHERE apiaryId = ? OR hiveId IN (SELECT id FROM Hives WHERE apiaryId = ?)',
      [apiaryId, apiaryId],
    );
    db.runSync('DELETE FROM Apiaries WHERE id = ?', [apiaryId]);
  });
}

export function saveHiveSync(hive: Hive) {
  const db = getDbSync();
  db.runSync('INSERT OR REPLACE INTO Hives (id, apiaryId, data) VALUES (?, ?, ?)', [hive.id, hive.apiaryId, JSON.stringify(hive)]);
}

export function deleteHiveSync(hiveId: string) {
  const db = getDbSync();
  withTransactionSync(() => {
    db.runSync('DELETE FROM Tasks WHERE hiveId = ?', [hiveId]);
    db.runSync('DELETE FROM Hives WHERE id = ?', [hiveId]);
  });
}

export function saveInspectionSync(inspection: Inspection) {
  const db = getDbSync();
  db.runSync('INSERT OR REPLACE INTO Inspections (id, hiveId, performedAt, data) VALUES (?, ?, ?, ?)', [inspection.id, inspection.hiveId, inspection.performedAt, JSON.stringify(inspection)]);
}

export function deleteInspectionSync(inspectionId: string) {
  const db = getDbSync();
  db.runSync('DELETE FROM Inspections WHERE id = ?', [inspectionId]);
}

export function saveInspectionAndHiveSync(inspection: Inspection, hive: Hive) {
  withTransactionSync(() => {
    saveInspectionSync(inspection);
    saveHiveSync(hive);
  });
}

export function deleteInspectionAndUpdateHiveSync(inspectionId: string, hive?: Hive) {
  withTransactionSync(() => {
    deleteInspectionSync(inspectionId);
    if (hive) {
      saveHiveSync(hive);
    }
  });
}

export function saveHiveEventSync(event: HiveEvent) {
  const db = getDbSync();
  db.runSync('INSERT OR REPLACE INTO HiveEvents (id, hiveId, performedAt, data) VALUES (?, ?, ?, ?)', [event.id, event.hiveId, event.performedAt, JSON.stringify(event)]);
}

export function deleteHiveEventSync(eventId: string) {
  const db = getDbSync();
  db.runSync('DELETE FROM HiveEvents WHERE id = ?', [eventId]);
}

export function saveHiveEventAndHiveSync(event: HiveEvent, hive: Hive) {
  withTransactionSync(() => {
    saveHiveEventSync(event);
    saveHiveSync(hive);
  });
}

export function saveTaskSync(task: Task) {
  const db = getDbSync();
  db.runSync('INSERT OR REPLACE INTO Tasks (id, hiveId, apiaryId, data) VALUES (?, ?, ?, ?)', [task.id, task.hiveId || null, task.apiaryId || null, JSON.stringify(task)]);
}

export function deleteTaskSync(taskId: string) {
  const db = getDbSync();
  db.runSync('DELETE FROM Tasks WHERE id = ?', [taskId]);
}

export function saveUserSettingsSync(settings: UserSettings) {
  const db = getDbSync();
  db.runSync('INSERT OR REPLACE INTO Settings (id, value) VALUES ("userSettings", ?)', [JSON.stringify(settings)]);
}

export function replaceAllDataLegacySync(data: { apiaries: Apiary[]; hives: Hive[]; inspections: Inspection[]; events: HiveEvent[]; manualTasks: Task[]; userSettings?: UserSettings }) {
  const db = getDbSync();

  withTransactionSync(() => {
    db.execSync('DELETE FROM Apiaries; DELETE FROM Hives; DELETE FROM Inspections; DELETE FROM HiveEvents; DELETE FROM Tasks;');

    for (const apiary of data.apiaries) {
      saveApiarySync(apiary);
    }
    for (const hive of data.hives) {
      saveHiveSync(hive);
    }
    for (const inspection of data.inspections) {
      saveInspectionSync(inspection);
    }
    for (const event of data.events) {
      saveHiveEventSync(event);
    }
    for (const task of data.manualTasks) {
      saveTaskSync(task);
    }
    saveUserSettingsSync(data.userSettings ?? DEFAULT_USER_SETTINGS);
  });
}

export function loadInspectionsForHiveSync(hiveId: string): Inspection[] {
  const db = getDbSync();
  const rows = db.getAllSync<{ data: string }>('SELECT data FROM Inspections WHERE hiveId = ? ORDER BY performedAt DESC', [hiveId]);
  return safeParseJsonRows<Inspection>(rows, 'Inspections');
}

export function loadEventsForHiveSync(hiveId: string): HiveEvent[] {
  const db = getDbSync();
  const rows = db.getAllSync<{ data: string }>('SELECT data FROM HiveEvents WHERE hiveId = ? ORDER BY performedAt DESC', [hiveId]);
  return safeParseJsonRows<HiveEvent>(rows, 'HiveEvents');
}
