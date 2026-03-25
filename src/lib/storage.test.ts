import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import { apiaries, hives, inspections, tasks } from '@/data/mock';
import { createSeedBeehavenState, parsePersistedBeehavenState } from '@/lib/storage';

describe('createSeedBeehavenState', () => {
  it('returns cloned arrays and items from the mock seed', () => {
    const seed = createSeedBeehavenState();

    expect(seed.apiaries).not.toBe(apiaries);
    expect(seed.hives).not.toBe(hives);
    expect(seed.inspections).not.toBe(inspections);
    expect(seed.manualTasks).not.toBe(tasks);

    expect(seed.apiaries[0]).not.toBe(apiaries[0]);
    expect(seed.hives[0]).not.toBe(hives[0]);
    expect(seed.inspections[0]).not.toBe(inspections[0]);
    expect(seed.manualTasks[0]).not.toBe(tasks[0]);

    seed.hives[0].name = 'Ändrad kupa';

    expect(hives[0].name).not.toBe('Ändrad kupa');
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
    ).toEqual({
      apiaries,
      hives,
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