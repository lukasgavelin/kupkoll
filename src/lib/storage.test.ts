import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import { createSeedBeehavenState, parsePersistedBeehavenState } from '@/lib/storage';

const apiaries = [
  {
    id: 'apiary-1',
    name: 'Testgård',
    location: 'Uppsala',
    notes: 'Anteckning',
    coordinates: {
      latitude: 59.85856,
      longitude: 17.63893,
    },
  },
];

const hives = [
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
];

const inspections = [
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
    notes: 'Anteckning',
  },
];

const tasks = [
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
];

describe('createSeedBeehavenState', () => {
  it('returns empty arrays for a clean install seed', () => {
    const seed = createSeedBeehavenState();

    expect(seed).toEqual({
      apiaries: [],
      hives: [],
      inspections: [],
      manualTasks: [],
    });
  });
});

describe('parsePersistedBeehavenState', () => {
  it('parses the current persisted state format', () => {
    expect(
      parsePersistedBeehavenState({
        version: 1,
        apiaries,
        hives,
        inspections,
        manualTasks: tasks,
      }),
    ).toBeNull();

    expect(
      parsePersistedBeehavenState({
        version: 2,
        apiaries,
        hives,
        inspections,
        manualTasks: tasks,
      }),
    ).toEqual({
      apiaries,
      hives,
      inspections,
      manualTasks: tasks,
    });
  });

  it('normalizes older stored kuptyper to the new option labels', () => {
    expect(
      parsePersistedBeehavenState({
        version: 2,
        apiaries,
        hives: [
          {
            ...hives[0],
            boxSystem: 'Svensk normal',
          },
          {
            ...hives[0],
            id: 'hive-2',
            boxSystem: 'Lågnormal 10 ramar',
          },
        ],
        inspections,
        manualTasks: tasks,
      }),
    ).toEqual({
      apiaries,
      hives: [
        {
          ...hives[0],
          boxSystem: 'Svea',
        },
        {
          ...hives[0],
          id: 'hive-2',
          boxSystem: 'Lågnormal',
        },
      ],
      inspections,
      manualTasks: tasks,
    });
  });

  it('migrates legacy payloads that stored tasks instead of manualTasks', () => {
    const legacyInspections = inspections.map(({ varroaLevel, ...inspection }) => inspection);

    expect(
      parsePersistedBeehavenState({
        apiaries,
        hives,
        inspections: legacyInspections,
        tasks,
      }),
    ).toEqual({
      apiaries,
      hives,
      inspections: legacyInspections.map((inspection) => ({
        ...inspection,
        varroaLevel: 'Ej kontrollerad',
      })),
      manualTasks: tasks,
    });
  });

  it('rejects malformed or unsupported payloads', () => {
    expect(
      parsePersistedBeehavenState({
        version: 99,
        apiaries,
        hives,
        inspections,
        manualTasks: tasks,
      }),
    ).toBeNull();

    expect(
      parsePersistedBeehavenState({
        version: 1,
        apiaries: 'invalid',
        hives,
        inspections,
        manualTasks: tasks,
      }),
    ).toBeNull();
  });
});