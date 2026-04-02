import { describe, expect, it } from 'vitest';

import { parseKupkollImportJson, parseKupkollImportPayload } from '@/lib/import';

const state = {
  apiaries: [
    {
      id: 'apiary-1',
      name: 'Testgård',
      location: 'Uppsala',
      notes: 'Anteckning',
      coordinates: {
        latitude: 59.8,
        longitude: 17.6,
      },
      locationDetails: {
        source: 'manual' as const,
        zone: 'mellan' as const,
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
      queenHistory: [],
      notes: 'Anteckning',
    },
  ],
  inspections: [
    {
      id: 'insp-1',
      hiveId: 'hive-1',
      performedAt: '2026-03-20T10:15:00.000Z',
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
      notes: 'OK',
    },
  ],
  events: [
    {
      id: 'event-1',
      hiveId: 'hive-1',
      type: 'Stödfodring' as const,
      performedAt: '2026-03-21T07:00:00.000Z',
      notes: 'Anteckning',
      details: {
        feedingSummary: '2 liter',
      },
    },
  ],
  manualTasks: [
    {
      id: 'task-1',
      title: 'Kontrollera drag',
      description: 'Titta till samhälle',
      dueDate: '2026-03-24T08:00:00.000Z',
      apiaryId: 'apiary-1',
      priority: 'Medel' as const,
      source: 'Egen planering' as const,
      completed: false,
    },
  ],
};

describe('parseKupkollImportJson', () => {
  it('parses a valid Kupkoll export bundle', () => {
    const result = parseKupkollImportJson(
      JSON.stringify({
        app: 'Kupkoll',
        exportedAt: '2026-04-01T08:00:00.000Z',
        schemaVersion: 7,
        counts: {
          apiaries: 1,
          hives: 1,
          inspections: 1,
          events: 1,
          manualTasks: 1,
        },
        data: state,
      }),
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state).toMatchObject(state);
    expect(result.metadata.exportedAt).toBe('2026-04-01T08:00:00.000Z');
    expect(result.metadata.schemaVersion).toBe(7);
    expect(result.warnings).toEqual([]);
  });

  it('returns warnings when metadata counts are out of sync', () => {
    const result = parseKupkollImportJson(
      JSON.stringify({
        app: 'Kupkoll',
        exportedAt: '2026-04-01T08:00:00.000Z',
        schemaVersion: 7,
        counts: {
          apiaries: 2,
          hives: 1,
          inspections: 1,
          events: 1,
          manualTasks: 1,
        },
        data: state,
      }),
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('apiaries');
  });

  it('rejects invalid JSON', () => {
    expect(parseKupkollImportJson('{invalid')).toEqual({
      ok: false,
      code: 'invalid-json',
      message: 'Filen innehåller inte giltig JSON.',
    });
  });

  it('rejects non-Kupkoll bundles', () => {
    expect(
      parseKupkollImportPayload({
        app: 'OtherApp',
        schemaVersion: 7,
        data: state,
      }),
    ).toEqual({
      ok: false,
      code: 'unsupported-format',
      message: 'Filen verkar inte vara en Kupkoll-export.',
    });
  });

  it('supports legacy persisted payload format', () => {
    const result = parseKupkollImportPayload({
      version: 7,
      ...state,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.state).toMatchObject(state);
  });

  it('rejects malformed data payloads', () => {
    expect(
      parseKupkollImportPayload({
        version: 7,
        apiaries: 'bad',
        hives: [],
        inspections: [],
        events: [],
        manualTasks: [],
      }),
    ).toEqual({
      ok: false,
      code: 'invalid-payload',
      message: 'JSON-filen kunde inte tolkas som Kupkoll-data.',
    });
  });
});
