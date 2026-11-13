import { describe, expect, it } from 'vitest';

import { getRemovedImageUris, reconcileHiveFromInspections } from './hiveReconcile';
import { Hive, Inspection } from '@/types/domain';

function makeHive(overrides: Partial<Hive> = {}): Hive {
  return {
    id: 'hive-1',
    apiaryId: 'apiary-1',
    name: 'Kupa 1',
    status: 'Stabilt',
    queenStatus: 'Bekräftad',
    strength: 'Medel',
    temperament: 'Lugnt',
    boxSystem: 'Lågnormal',
    queenHistory: [],
    lastInspectionAt: '2026-06-10T10:00:00.000Z',
    notes: '',
    ...overrides,
  };
}

function makeInspection(overrides: Partial<Inspection> = {}): Inspection {
  return {
    id: 'insp-1',
    hiveId: 'hive-1',
    performedAt: '2026-06-10T10:00:00.000Z',
    mode: 'Snabb genomgång',
    queenSeen: true,
    eggsSeen: true,
    openBrood: true,
    cappedBrood: true,
    honey: true,
    pollen: true,
    queenCells: false,
    swarmSigns: false,
    varroaLevel: 'Låg',
    temperament: 'Lugnt',
    actionNeeded: false,
    notes: '',
    ...overrides,
  };
}

describe('reconcileHiveFromInspections', () => {
  it('updates status, queenStatus, temperament and lastInspectionAt from latest inspection', () => {
    const hive = makeHive({ status: 'Behöver åtgärd', queenStatus: 'Osäker', temperament: 'Hetsigt' });
    const older = makeInspection({
      id: 'insp-older',
      performedAt: '2026-06-01T10:00:00.000Z',
      actionNeeded: true,
      queenSeen: false,
      eggsSeen: false,
      temperament: 'Hetsigt',
    });
    const latest = makeInspection({
      id: 'insp-latest',
      performedAt: '2026-06-15T10:00:00.000Z',
      actionNeeded: false,
      queenSeen: true,
      temperament: 'Lugnt',
    });

    const reconciled = reconcileHiveFromInspections(hive, [older, latest]);

    expect(reconciled.lastInspectionAt).toBe('2026-06-15T10:00:00.000Z');
    expect(reconciled.status).toBe('Stabilt');
    expect(reconciled.queenStatus).toBe('Bekräftad');
    expect(reconciled.temperament).toBe('Lugnt');
  });

  it('reverts to previous inspection when the latest inspection is deleted', () => {
    const hive = makeHive({ status: 'Stabilt', lastInspectionAt: '2026-06-15T10:00:00.000Z' });
    const older = makeInspection({
      id: 'insp-older',
      performedAt: '2026-06-01T10:00:00.000Z',
      varroaLevel: 'Hög',
      temperament: 'Vaksamt',
    });

    const reconciled = reconcileHiveFromInspections(hive, [older]);

    expect(reconciled.lastInspectionAt).toBe('2026-06-01T10:00:00.000Z');
    expect(reconciled.status).toBe('Behöver åtgärd');
    expect(reconciled.temperament).toBe('Vaksamt');
  });

  it('clears lastInspectionAt and resets status when no inspections remain', () => {
    const hive = makeHive({ status: 'Behöver åtgärd', lastInspectionAt: '2026-06-10T10:00:00.000Z' });

    const reconciled = reconcileHiveFromInspections(hive, []);

    expect(reconciled.lastInspectionAt).toBeUndefined();
    expect(reconciled.status).toBe('Under uppbyggnad');
  });

  it('preserves Avslutad status even when reconciling inspections', () => {
    const hive = makeHive({ status: 'Avslutad' });
    const latest = makeInspection({ performedAt: '2026-06-12T10:00:00.000Z', actionNeeded: false });

    const reconciled = reconcileHiveFromInspections(hive, [latest]);

    expect(reconciled.status).toBe('Avslutad');
    expect(reconciled.lastInspectionAt).toBe('2026-06-12T10:00:00.000Z');
  });
});

describe('getRemovedImageUris', () => {
  it('returns only URIs removed between previous and next lists', () => {
    expect(getRemovedImageUris(['a.jpg', 'b.jpg'], ['b.jpg', 'c.jpg'])).toEqual(['a.jpg']);
    expect(getRemovedImageUris(['a.jpg'], undefined)).toEqual(['a.jpg']);
    expect(getRemovedImageUris(undefined, ['a.jpg'])).toEqual([]);
  });
});
