import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import { createSeedKupkollState, parsePersistedKupkollState } from '@/lib/storage';

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
    mode: 'Fördjupad genomgång' as const,
    queenSeen: true,
    eggsSeen: true,
    openBrood: true,
    cappedBrood: true,
    honey: true,
    pollen: true,
    queenCells: false,
    swarmSigns: false,
    varroaLevel: 'Låg' as const,
    varroaDetails: {
      checked: true,
      controlMethod: 'Skakprov' as const,
      measurementValue: '12 kvalster',
      treatmentPerformed: true,
      treatmentNote: 'Myrsyra enligt plan',
    },
    temperament: 'Lugnt' as const,
    actionNeeded: false,
    weather: {
      condition: 'Soligt' as const,
      wind: 'Lugnt' as const,
      temperatureC: 18,
      note: 'Bra flygväder',
    },
    advancedDetails: {
      treatment: 'Oxalsyra',
      feeding: '2 liter 50/50',
      honeySuperOn: true,
      splitMade: false,
      queenChangeStatus: 'Planerat' as const,
    },
    notes: 'Anteckning',
  },
];

const events = [
  {
    id: 'event-1',
    hiveId: 'hive-1',
    type: 'Drottning märkt/årgång' as const,
    performedAt: '2026-03-21T08:00:00.000Z',
    notes: 'Drottningen märktes och årgången verifierades.',
    details: {
      queenYear: '2025',
      markingNote: 'Vit märkfärg',
    },
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

describe('createSeedKupkollState', () => {
  it('returns empty arrays for a clean install seed', () => {
    const seed = createSeedKupkollState();

    expect(seed).toEqual({
      apiaries: [],
      hives: [],
      inspections: [],
      events: [],
      manualTasks: [],
    });
  });
});

describe('parsePersistedKupkollState', () => {
  it('parses the current persisted state format', () => {
    expect(
      parsePersistedKupkollState({
        version: 1,
        apiaries,
        hives,
        inspections,
        events,
        manualTasks: tasks,
      }),
    ).toBeNull();

    expect(
      parsePersistedKupkollState({
        version: 6,
        apiaries,
        hives,
        inspections,
        events,
        manualTasks: tasks,
      }),
    ).toEqual({
      apiaries,
      hives,
      inspections,
      events,
      manualTasks: tasks,
    });
  });

  it('normalizes older stored kuptyper to the new option labels', () => {
    expect(
      parsePersistedKupkollState({
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
        events,
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
      events,
      manualTasks: tasks,
    });
  });

  it('migrates legacy payloads that stored tasks instead of manualTasks', () => {
    const legacyInspections = inspections.map(({ varroaLevel, ...inspection }) => inspection);

    expect(
      parsePersistedKupkollState({
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
      events: [],
      manualTasks: tasks,
    });
  });

  it('normalizes weather payloads and drops invalid weather values', () => {
    expect(
      parsePersistedKupkollState({
        version: 5,
        apiaries,
        hives,
        inspections: [
          {
            ...inspections[0],
            weather: {
              condition: 'Storm',
              wind: 'Blåsigt',
              temperatureC: '15',
              note: '  Byigt  ',
            },
            advancedDetails: {
              treatment: '  Oxalsyra  ',
              feeding: ' ',
              honeySuperOn: 'ja',
              splitMade: false,
              queenChangeStatus: 'Genomfört',
            },
            varroaDetails: {
              checked: true,
              controlMethod: 'Alkoholprov',
              measurementValue: ' 4,2 % ',
              treatmentPerformed: false,
              treatmentNote: '  Avvaktar efter skattning  ',
            },
          },
        ],
        events: [
          {
            ...events[0],
            details: {
              queenYear: ' 2025 ',
              markingNote: '  Vit märkfärg  ',
              honeySuperCount: '1',
            },
          },
        ],
        manualTasks: tasks,
      }),
    ).toEqual({
      apiaries,
      hives,
      inspections: [
        {
          ...inspections[0],
          weather: {
            wind: 'Blåsigt',
            note: 'Byigt',
          },
          advancedDetails: {
            treatment: 'Oxalsyra',
            splitMade: false,
            queenChangeStatus: 'Genomfört',
          },
          varroaDetails: {
            checked: true,
            controlMethod: 'Alkoholprov',
            measurementValue: '4,2 %',
            treatmentPerformed: false,
            treatmentNote: 'Avvaktar efter skattning',
          },
        },
      ],
      events: [
        {
          ...events[0],
          details: {
            queenYear: '2025',
            markingNote: 'Vit märkfärg',
          },
        },
      ],
      manualTasks: tasks,
    });
  });

  it('defaults missing events to an empty list for older saved state', () => {
    expect(
      parsePersistedKupkollState({
        version: 5,
        apiaries,
        hives,
        inspections,
        manualTasks: tasks,
      }),
    ).toEqual({
      apiaries,
      hives,
      inspections,
      events: [],
      manualTasks: tasks,
    });
  });

  it('rejects malformed or unsupported payloads', () => {
    expect(
      parsePersistedKupkollState({
        version: 99,
        apiaries,
        hives,
        inspections,
        events,
        manualTasks: tasks,
      }),
    ).toBeNull();

    expect(
      parsePersistedKupkollState({
        version: 1,
        apiaries: 'invalid',
        hives,
        inspections,
        events,
        manualTasks: tasks,
      }),
    ).toBeNull();
  });
});