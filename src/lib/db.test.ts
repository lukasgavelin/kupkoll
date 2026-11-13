import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = {
  execSync: vi.fn(),
  getAllSync: vi.fn(),
  getFirstSync: vi.fn(),
  runSync: vi.fn(),
  withTransactionSync: vi.fn((fn: () => void) => fn()),
};

vi.mock('expo-sqlite', () => ({
  openDatabaseSync: vi.fn(() => mockDb),
}));

import {
  DEFAULT_USER_SETTINGS,
  deleteApiarySync,
  deleteHiveEventSync,
  deleteHiveSync,
  deleteInspectionSync,
  deleteTaskSync,
  initDbSync,
  loadAllDataSync,
  loadFullExportDataSync,
  replaceAllDataLegacySync,
  saveHiveEventAndHiveSync,
  saveInspectionAndHiveSync,
  saveTaskSync,
} from '@/lib/db';

describe('db', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enables SQLite foreign key enforcement in getDbSync and migrates schema in initDbSync', () => {
    mockDb.getFirstSync.mockReturnValueOnce({ user_version: 0 });
    initDbSync();

    expect(mockDb.execSync).toHaveBeenCalledTimes(2);
    expect(mockDb.execSync.mock.calls[0]?.[0]).toBe('PRAGMA foreign_keys = ON;');
    const sql = mockDb.execSync.mock.calls[1]?.[0] as string;
    expect(sql).toContain('PRAGMA journal_mode = WAL;');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_inspections_hive_performed');
    expect(sql).toContain('PRAGMA user_version = 2;');
  });

  it('skips schema migration in initDbSync when user_version is already current', () => {
    mockDb.getFirstSync.mockReturnValueOnce({ user_version: 2 });
    initDbSync();

    expect(mockDb.execSync).not.toHaveBeenCalled();
  });

  it('loads full untruncated history and userSettings in loadFullExportDataSync', () => {
    const mockApiary = { id: 'a1', name: 'Bigård 1', location: 'Uppsala', notes: '' };
    const mockHive = {
      id: 'h1',
      apiaryId: 'a1',
      name: 'Kupa 1',
      status: 'Stabilt',
      queenStatus: 'Bekräftad',
      strength: 'Medel',
      temperament: 'Lugnt',
      boxSystem: 'Svea',
      queenHistory: [],
      notes: '',
    };
    const mockInspections = [1, 2, 3, 4, 5].map((n) => ({
      id: `i${n}`,
      hiveId: 'h1',
      performedAt: `2026-04-0${n}T10:00:00.000Z`,
    }));
    const mockEvents = [1, 2, 3, 4].map((n) => ({
      id: `e${n}`,
      hiveId: 'h1',
      type: 'Stödfodring',
      performedAt: `2026-04-0${n}T12:00:00.000Z`,
      notes: '',
    }));
    const mockTask = {
      id: 't1',
      title: 'Kolla kupa',
      description: '',
      dueDate: '2026-05-01T00:00:00.000Z',
      priority: 'Medel',
      source: 'Egen planering',
      completed: false,
    };

    mockDb.getAllSync.mockImplementation((sql: string) => {
      if (sql.includes('FROM Apiaries')) return [{ data: JSON.stringify(mockApiary) }];
      if (sql.includes('FROM Hives')) return [{ data: JSON.stringify(mockHive) }];
      if (sql.includes('FROM Inspections')) {
        expect(sql).not.toContain('rn <= 3');
        return mockInspections.map((item) => ({ data: JSON.stringify(item) }));
      }
      if (sql.includes('FROM HiveEvents')) {
        expect(sql).not.toContain('rn <= 3');
        return mockEvents.map((item) => ({ data: JSON.stringify(item) }));
      }
      if (sql.includes('FROM Tasks')) return [{ data: JSON.stringify(mockTask) }];
      return [];
    });

    mockDb.getFirstSync.mockReturnValue({
      value: JSON.stringify({ experienceLevel: 'beginner' }),
    });

    const result = loadFullExportDataSync();
    const coldStartResult = loadAllDataSync();

    expect(result.apiaries).toEqual([mockApiary]);
    expect(result.hives).toEqual([mockHive]);
    expect(result.inspections).toHaveLength(5);
    expect(result.events).toHaveLength(4);
    expect(result.manualTasks).toEqual([mockTask]);
    expect(result.userSettings).toEqual({ experienceLevel: 'beginner' });
    expect(coldStartResult).toEqual(result);
  });

  it('skips corrupt JSON rows without crashing on loadAllDataSync', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockDb.getAllSync.mockImplementation((sql: string) => {
      if (sql.includes('FROM Apiaries')) {
        return [{ data: '{"id":"a1","name":"Ok","location":"Uppsala","notes":""}' }, { data: '{corrupt json' }];
      }
      return [];
    });
    mockDb.getFirstSync.mockReturnValue({ value: '{corrupt settings' });

    const result = loadAllDataSync();

    expect(result.apiaries).toHaveLength(1);
    expect(result.userSettings).toEqual(DEFAULT_USER_SETTINGS);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('defaults userSettings to experienced when no Settings row exists', () => {
    mockDb.getAllSync.mockReturnValue([]);
    mockDb.getFirstSync.mockReturnValue(null);

    const result = loadFullExportDataSync();

    expect(result.userSettings).toEqual({ experienceLevel: 'experienced' });
  });

  it('deletes matching Tasks when deleting a hive or apiary', () => {
    deleteHiveSync('h1');
    expect(mockDb.withTransactionSync).toHaveBeenCalledTimes(1);
    expect(mockDb.runSync).toHaveBeenNthCalledWith(1, 'DELETE FROM Tasks WHERE hiveId = ?', ['h1']);
    expect(mockDb.runSync).toHaveBeenNthCalledWith(2, 'DELETE FROM Hives WHERE id = ?', ['h1']);

    vi.clearAllMocks();

    deleteApiarySync('a1');
    expect(mockDb.withTransactionSync).toHaveBeenCalledTimes(1);
    expect(mockDb.runSync).toHaveBeenNthCalledWith(
      1,
      'DELETE FROM Tasks WHERE apiaryId = ? OR hiveId IN (SELECT id FROM Hives WHERE apiaryId = ?)',
      ['a1', 'a1'],
    );
    expect(mockDb.runSync).toHaveBeenNthCalledWith(2, 'DELETE FROM Apiaries WHERE id = ?', ['a1']);
  });

  it('wraps inspection+hive and event+hive writes in transactions', () => {
    const mockHive = {
      id: 'h1',
      apiaryId: 'a1',
      name: 'Kupa 1',
      status: 'Stabilt' as const,
      queenStatus: 'Bekräftad' as const,
      strength: 'Medel' as const,
      temperament: 'Lugnt' as const,
      boxSystem: 'Svea' as const,
      queenHistory: [],
      notes: '',
    };
    const mockInspection = {
      id: 'i1',
      hiveId: 'h1',
      performedAt: '2026-04-01T10:00:00.000Z',
      mode: 'Snabb genomgång' as const,
      queenSeen: true,
      eggsSeen: true,
      openBrood: true,
      cappedBrood: true,
      honey: true,
      pollen: true,
      queenCells: false,
      swarmSigns: false,
      varroaLevel: 'Låg' as const,
      temperament: 'Lugnt' as const,
      actionNeeded: false,
      notes: '',
    };
    const mockEvent = {
      id: 'e1',
      hiveId: 'h1',
      type: 'Stödfodring' as const,
      performedAt: '2026-04-01T12:00:00.000Z',
      notes: '',
    };

    saveInspectionAndHiveSync(mockInspection, mockHive);
    expect(mockDb.withTransactionSync).toHaveBeenCalledTimes(1);
    expect(mockDb.runSync).toHaveBeenCalledTimes(2);

    vi.clearAllMocks();

    saveHiveEventAndHiveSync(mockEvent, mockHive);
    expect(mockDb.withTransactionSync).toHaveBeenCalledTimes(1);
    expect(mockDb.runSync).toHaveBeenCalledTimes(2);
  });

  it('resets Settings to DEFAULT_USER_SETTINGS when replaceAllDataLegacySync omits userSettings', () => {
    replaceAllDataLegacySync({
      apiaries: [],
      hives: [],
      inspections: [],
      events: [],
      manualTasks: [],
    });

    expect(mockDb.withTransactionSync).toHaveBeenCalledTimes(1);
    expect(mockDb.runSync).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO Settings (id, value) VALUES ("userSettings", ?)',
      [JSON.stringify(DEFAULT_USER_SETTINGS)],
    );
  });

  it('deletes inspections, events, and saves/deletes tasks', () => {
    deleteInspectionSync('insp-1');
    expect(mockDb.runSync).toHaveBeenCalledWith('DELETE FROM Inspections WHERE id = ?', ['insp-1']);

    deleteHiveEventSync('event-1');
    expect(mockDb.runSync).toHaveBeenCalledWith('DELETE FROM HiveEvents WHERE id = ?', ['event-1']);

    const task = {
      id: 'task-1',
      title: 'Kolla foder',
      description: '',
      dueDate: '2026-05-01T12:00:00.000Z',
      hiveId: 'h1',
      apiaryId: 'a1',
      priority: 'Medel' as const,
      source: 'Egen planering' as const,
      completed: false,
    };

    saveTaskSync(task);
    expect(mockDb.runSync).toHaveBeenCalledWith(
      'INSERT OR REPLACE INTO Tasks (id, hiveId, apiaryId, data) VALUES (?, ?, ?, ?)',
      ['task-1', 'h1', 'a1', JSON.stringify(task)],
    );

    deleteTaskSync('task-1');
    expect(mockDb.runSync).toHaveBeenCalledWith('DELETE FROM Tasks WHERE id = ?', ['task-1']);
  });
});
