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

import { initDbSync, loadFullExportDataSync } from '@/lib/db';

describe('db', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enables SQLite foreign key enforcement in initDbSync', () => {
    initDbSync();

    expect(mockDb.execSync).toHaveBeenCalledTimes(1);
    const sql = mockDb.execSync.mock.calls[0]?.[0] as string;
    expect(sql).toContain('PRAGMA journal_mode = WAL;');
    expect(sql).toContain('PRAGMA foreign_keys = ON;');
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

    expect(result.apiaries).toEqual([mockApiary]);
    expect(result.hives).toEqual([mockHive]);
    expect(result.inspections).toHaveLength(5);
    expect(result.events).toHaveLength(4);
    expect(result.manualTasks).toEqual([mockTask]);
    expect(result.userSettings).toEqual({ experienceLevel: 'beginner' });
  });

  it('defaults userSettings to experienced when no Settings row exists', () => {
    mockDb.getAllSync.mockReturnValue([]);
    mockDb.getFirstSync.mockReturnValue(null);

    const result = loadFullExportDataSync();

    expect(result.userSettings).toEqual({ experienceLevel: 'experienced' });
  });
});
