import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDerivedSignals } from '@/lib/rules';
import { Hive, Inspection } from '@/types/domain';

function createHive(overrides: Partial<Hive> = {}): Hive {
  return {
    id: 'hive-1',
    apiaryId: 'apiary-1',
    name: 'Kupa 1',
    status: 'Stabilt',
    queenStatus: 'Bekräftad',
    strength: 'Starkt',
    temperament: 'Lugnt',
    boxSystem: 'Lågnormal',
    lastInspectionAt: '2026-06-15T10:00:00.000Z',
    notes: 'Testkupa',
    ...overrides,
  };
}

function createInspection(overrides: Partial<Inspection> = {}): Inspection {
  return {
    id: 'insp-1',
    hiveId: 'hive-1',
    performedAt: '2026-06-15T10:00:00.000Z',
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
    notes: 'Testinspektion',
    ...overrides,
  };
}

describe('buildDerivedSignals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('recommends swarm follow-up and skattlada for a strong colony in season', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

    const hive = createHive();
    const inspection = createInspection({ swarmSigns: true });
    const result = buildDerivedSignals([hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toEqual(expect.arrayContaining(['Hög svärmrisk', 'Överväg skattlåda']));
    expect(result.tasks.map((item) => item.title)).toEqual(expect.arrayContaining(['Gör svärmkontroll', 'Planera skattlåda']));
  });

  it('recommends queen follow-up, support and winter prep for a weak colony in invintring', () => {
    vi.setSystemTime(new Date('2026-09-10T12:00:00.000Z'));

    const hive = createHive({ strength: 'Svagt', queenStatus: 'Osäker' });
    const inspection = createInspection({
      queenSeen: false,
      eggsSeen: false,
      openBrood: false,
      cappedBrood: false,
      honey: false,
      pollen: false,
      actionNeeded: true,
    });
    const result = buildDerivedSignals([hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toEqual(
      expect.arrayContaining(['Samhället verkar svagt', 'Kontrollera drottningstatus', 'Förbered invintring']),
    );
    expect(result.tasks.every((item) => item.source === 'Beslutsstöd')).toBe(true);
  });

  it('recommends quick action when varroa pressure is high', () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

    const hive = createHive({ strength: 'Medel' });
    const inspection = createInspection({ varroaLevel: 'Hög' });
    const result = buildDerivedSignals([hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toContain('Hög varroabelastning');
    expect(result.tasks.map((item) => item.title)).toContain('Planera varroaåtgärd');
  });
});