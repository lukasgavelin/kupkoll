import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

vi.mock('expo-file-system', () => ({
  Directory: class {},
  File: class {},
  Paths: {
    document: '/documents',
  },
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn(async () => false),
  shareAsync: vi.fn(async () => undefined),
}));

import { buildKupkollExport, formatKupkollExportFileName, serializeKupkollExport } from '@/lib/export';

const state = {
  apiaries: [
    {
      id: 'apiary-1',
      name: 'Testgård',
      location: 'Uppsala',
      notes: 'Söderläge',
      coordinates: {
        latitude: 59.85856,
        longitude: 17.63893,
      },
    },
  ],
  hives: [
    {
      id: 'hive-1',
      apiaryId: 'apiary-1',
      name: 'Kupa 1',
      status: 'Stabilt' as const,
      queenStatus: 'Bekräftad' as const,
      strength: 'Medel' as const,
      temperament: 'Lugnt' as const,
      boxSystem: 'Svea' as const,
      lastInspectionAt: '2026-03-20T10:15:00.000Z',
      notes: 'Anteckning',
    },
  ],
  inspections: [
    {
      id: 'insp-1',
      hiveId: 'hive-1',
      performedAt: '2026-03-20T10:15:00.000Z',
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
      weather: {
        condition: 'Soligt' as const,
        wind: 'Lugnt' as const,
        temperatureC: 18,
      },
      notes: 'Anteckning',
    },
  ],
  manualTasks: [
    {
      id: 'task-1',
      title: 'Testuppgift',
      description: 'Beskrivning',
      dueDate: '2026-03-24T08:00:00.000Z',
      apiaryId: 'apiary-1',
      priority: 'Medel' as const,
      source: 'Egen planering' as const,
      completed: false,
    },
  ],
};

describe('buildKupkollExport', () => {
  it('wraps the full app state with metadata and counts', () => {
    const exportedAt = '2026-03-26T10:30:00.000Z';

    expect(buildKupkollExport(state, exportedAt)).toEqual({
      app: 'Kupkoll',
      exportedAt,
      schemaVersion: 2,
      counts: {
        apiaries: 1,
        hives: 1,
        inspections: 1,
        manualTasks: 1,
      },
      data: state,
    });
  });
});

describe('formatKupkollExportFileName', () => {
  it('creates a date-based json file name', () => {
    expect(formatKupkollExportFileName(new Date('2026-03-26T10:30:00.000Z'))).toBe('kupkoll-export-2026-03-26.json');
  });
});

describe('serializeKupkollExport', () => {
  it('creates readable json for backups and later import', () => {
    const serialized = serializeKupkollExport(buildKupkollExport(state, '2026-03-26T10:30:00.000Z'));

    expect(serialized).toContain('"app": "Kupkoll"');
    expect(serialized).toContain('"schemaVersion": 2');
    expect(serialized).toContain('"apiaries"');
    expect(serialized).toContain('"weather"');
  });
});