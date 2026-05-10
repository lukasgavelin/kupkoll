import * as SQLite from 'expo-sqlite';

import { Apiary, Hive, HiveEvent, Inspection, Task, UserSettings } from '@/types/domain';

const DB_NAME = 'kupkoll.db';

export function getDbSync() {
  return SQLite.openDatabaseSync(DB_NAME);
}

export function initDbSync() {
  const db = getDbSync();
  
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
  `);
}

export function loadAllDataSync() {
  const db = getDbSync();

  const apiariesRows = db.getAllSync<{ data: string }>('SELECT data FROM Apiaries');
  const apiaries = apiariesRows.map((r) => JSON.parse(r.data) as Apiary);

  const hivesRows = db.getAllSync<{ data: string }>('SELECT data FROM Hives');
  const hives = hivesRows.map((r) => JSON.parse(r.data) as Hive);

  const inspectionsRows = db.getAllSync<{ data: string }>(`
    SELECT data FROM (
      SELECT data, ROW_NUMBER() OVER (PARTITION BY hiveId ORDER BY performedAt DESC) as rn FROM Inspections
    ) WHERE rn <= 3
  `);
  const inspections = inspectionsRows.map((r) => JSON.parse(r.data) as Inspection);

  const eventsRows = db.getAllSync<{ data: string }>(`
    SELECT data FROM (
      SELECT data, ROW_NUMBER() OVER (PARTITION BY hiveId ORDER BY performedAt DESC) as rn FROM HiveEvents
    ) WHERE rn <= 3
  `);
  const events = eventsRows.map((r) => JSON.parse(r.data) as HiveEvent);

  const tasksRows = db.getAllSync<{ data: string }>('SELECT data FROM Tasks');
  const tasks = tasksRows.map((r) => JSON.parse(r.data) as Task);

  const settingsRow = db.getFirstSync<{ value: string }>('SELECT value FROM Settings WHERE id = "userSettings"');
  const userSettings = settingsRow ? (JSON.parse(settingsRow.value) as UserSettings) : { experienceLevel: 'beginner' as const };

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
  db.runSync('DELETE FROM Apiaries WHERE id = ?', [apiaryId]);
}

export function saveHiveSync(hive: Hive) {
  const db = getDbSync();
  db.runSync('INSERT OR REPLACE INTO Hives (id, apiaryId, data) VALUES (?, ?, ?)', [hive.id, hive.apiaryId, JSON.stringify(hive)]);
}

export function deleteHiveSync(hiveId: string) {
  const db = getDbSync();
  db.runSync('DELETE FROM Hives WHERE id = ?', [hiveId]);
}

export function saveInspectionSync(inspection: Inspection) {
  const db = getDbSync();
  db.runSync('INSERT OR REPLACE INTO Inspections (id, hiveId, performedAt, data) VALUES (?, ?, ?, ?)', [inspection.id, inspection.hiveId, inspection.performedAt, JSON.stringify(inspection)]);
}

export function saveHiveEventSync(event: HiveEvent) {
  const db = getDbSync();
  db.runSync('INSERT OR REPLACE INTO HiveEvents (id, hiveId, performedAt, data) VALUES (?, ?, ?, ?)', [event.id, event.hiveId, event.performedAt, JSON.stringify(event)]);
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
  
  db.withTransactionSync(() => {
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
    if (data.userSettings) {
      saveUserSettingsSync(data.userSettings);
    }
  });
}

export function loadInspectionsForHiveSync(hiveId: string): Inspection[] {
  const db = getDbSync();
  const rows = db.getAllSync<{ data: string }>('SELECT data FROM Inspections WHERE hiveId = ? ORDER BY performedAt DESC', [hiveId]);
  return rows.map((r) => JSON.parse(r.data) as Inspection);
}

export function loadEventsForHiveSync(hiveId: string): HiveEvent[] {
  const db = getDbSync();
  const rows = db.getAllSync<{ data: string }>('SELECT data FROM HiveEvents WHERE hiveId = ? ORDER BY performedAt DESC', [hiveId]);
  return rows.map((r) => JSON.parse(r.data) as HiveEvent);
}
