import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDerivedSignals } from '@/lib/rules';
import { Apiary, Hive, Inspection } from '@/types/domain';

function createApiary(overrides: Partial<Apiary> = {}): Apiary {
  return {
    id: 'apiary-1',
    name: 'Testgård',
    location: 'Uppsala',
    notes: 'Testbigård',
    coordinates: {
      latitude: 59.8586,
      longitude: 17.6389,
    },
    ...overrides,
  };
}

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
    const result = buildDerivedSignals([createApiary()], [hive], [inspection]);

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
    const result = buildDerivedSignals([createApiary()], [hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toEqual(
      expect.arrayContaining(['Samhället verkar svagt', 'Kontrollera drottningstatus', 'Förbered invintring']),
    );
    expect(result.tasks.every((item) => item.source === 'Beslutsstöd')).toBe(true);
  });

  it('recommends quick action when varroa pressure is high', () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

    const hive = createHive({ strength: 'Medel' });
    const inspection = createInspection({ varroaLevel: 'Hög' });
    const result = buildDerivedSignals([createApiary()], [hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toContain('Hög varroabelastning');
    expect(result.tasks.map((item) => item.title)).toContain('Planera varroaåtgärd');
  });

  it('flags possible queen problems after three inspections without seen queen', () => {
    vi.setSystemTime(new Date('2026-05-14T12:00:00.000Z'));

    const hive = createHive({ queenStatus: 'Osäker' });
    const inspections = [
      createInspection({ id: 'insp-1', performedAt: '2026-05-01T10:00:00.000Z', queenSeen: false, eggsSeen: true }),
      createInspection({ id: 'insp-2', performedAt: '2026-05-07T10:00:00.000Z', queenSeen: false, eggsSeen: true }),
      createInspection({ id: 'insp-3', performedAt: '2026-05-14T10:00:00.000Z', queenSeen: false, eggsSeen: true }),
    ];
    const result = buildDerivedSignals([createApiary()], [hive], inspections);

    expect(result.recommendations.map((item) => item.title)).toContain('Möjligt drottningproblem');
    expect(result.tasks.map((item) => item.title)).toContain('Fördjupa drottningkontroll');
  });

  it('shows that the queen is verified again after two missed inspections', () => {
    vi.setSystemTime(new Date('2026-05-14T12:00:00.000Z'));

    const hive = createHive();
    const inspections = [
      createInspection({ id: 'insp-1', performedAt: '2026-05-01T10:00:00.000Z', queenSeen: false, eggsSeen: true }),
      createInspection({ id: 'insp-2', performedAt: '2026-05-07T10:00:00.000Z', queenSeen: false, eggsSeen: true }),
      createInspection({ id: 'insp-3', performedAt: '2026-05-14T10:00:00.000Z', queenSeen: true, eggsSeen: true }),
    ];
    const result = buildDerivedSignals([createApiary()], [hive], inspections);

    expect(result.recommendations.map((item) => item.title)).toContain('Drottning verifierad igen');
  });

  it('detects an upward varroa trend over recent inspections', () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

    const hive = createHive({ strength: 'Medel' });
    const inspections = [
      createInspection({ id: 'insp-1', performedAt: '2026-08-01T10:00:00.000Z', varroaLevel: 'Låg' }),
      createInspection({ id: 'insp-2', performedAt: '2026-08-10T10:00:00.000Z', varroaLevel: 'Förhöjd' }),
      createInspection({ id: 'insp-3', performedAt: '2026-08-20T10:00:00.000Z', varroaLevel: 'Förhöjd' }),
    ];
    const result = buildDerivedSignals([createApiary()], [hive], inspections);

    expect(result.recommendations.map((item) => item.title)).toContain('Varroa-trend uppåt');
    expect(result.tasks.map((item) => item.title)).toContain('Planera behandling mot varroa');
  });

  it('warns about swarm pressure in May for a strong colony with eggs', () => {
    vi.setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const hive = createHive({ strength: 'Starkt' });
    const inspection = createInspection({ performedAt: '2026-05-12T10:00:00.000Z', eggsSeen: true, queenSeen: true, queenCells: false, swarmSigns: false });
    const result = buildDerivedSignals([createApiary()], [hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toContain('Möjlig svärmperiod');
    expect(result.tasks.map((item) => item.title)).toContain('Gör förebyggande svärmkontroll');
  });

  it('adds a weather-sensitive follow-up when spring inspection happened in poor fly weather', () => {
    vi.setSystemTime(new Date('2026-04-18T12:00:00.000Z'));

    const hive = createHive({ strength: 'Medel' });
    const inspection = createInspection({
      performedAt: '2026-04-18T10:00:00.000Z',
      weather: {
        condition: 'Regn',
        wind: 'Blåsigt',
        temperatureC: 7,
      },
    });
    const result = buildDerivedSignals([createApiary()], [hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toContain('Följ upp i bättre flygväder');
    expect(result.tasks.map((item) => item.title)).toContain('Planera väderanpassad uppföljning');
  });

  it('reminds about passive hives when inspection cadence is exceeded for the season', () => {
    vi.setSystemTime(new Date('2026-05-22T12:00:00.000Z'));

    const hive = createHive({ lastInspectionAt: '2026-05-01T10:00:00.000Z' });
    const inspection = createInspection({ performedAt: '2026-05-01T10:00:00.000Z' });
    const result = buildDerivedSignals([createApiary()], [hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toContain('Dags för ny genomgång');
    expect(result.tasks.map((item) => item.title)).toContain('Planera ny genomgång');
  });
});