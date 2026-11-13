import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildDerivedSignals } from '@/lib/rules';
import { Apiary, Hive, HiveEvent, Inspection } from '@/types/domain';

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
    queenHistory: [],
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

    expect(result.recommendations.map((item) => item.title)).toEqual(expect.arrayContaining(['Förhöjd svärmrisk just nu', 'Överväg skattlåda']));
    expect(result.tasks.map((item) => item.title)).toEqual(expect.arrayContaining(['Överväg snabb svärmkontroll', 'Överväg skattlåda']));
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
      expect.arrayContaining([
        'Samhället verkar svagt',
        'Följ upp drottningstatus',
        'Svagt samhälle inför vintern',
        'Osäker drottningstatus inför vintern',
        'Vinterfoder saknas – akut risk',
      ]),
    );
    expect(result.tasks.every((item) => item.source === 'Beslutsstöd')).toBe(true);
  });

  it('recommends quick action when varroa pressure is high', () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

    const hive = createHive({ strength: 'Medel' });
    const inspection = createInspection({ varroaLevel: 'Hög' });
    const result = buildDerivedSignals([createApiary()], [hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toContain('Möjligen hög varroabelastning');
    expect(result.tasks.map((item) => item.title)).toContain('Överväg varroaåtgärd');
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
    expect(result.tasks.map((item) => item.title)).toContain('Överväg fördjupad drottningkontroll');
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

    expect(result.recommendations.map((item) => item.title)).toContain('Drottning sedd igen');
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

    expect(result.recommendations.map((item) => item.title)).toContain('Möjlig varroa-trend uppåt');
    expect(result.tasks.map((item) => item.title)).toContain('Överväg behandling mot varroa');
  });

  it('warns about swarm pressure in May for a strong colony with eggs', () => {
    vi.setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const hive = createHive({ strength: 'Starkt' });
    const inspection = createInspection({ performedAt: '2026-05-12T10:00:00.000Z', eggsSeen: true, queenSeen: true, queenCells: false, swarmSigns: false });
    const result = buildDerivedSignals([createApiary()], [hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toContain('Möjlig svärmperiod');
    expect(result.tasks.map((item) => item.title)).toContain('Överväg förebyggande svärmkontroll');
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
    expect(result.tasks.map((item) => item.title)).toContain('Överväg väderanpassad uppföljning');
  });

  it('reminds about passive hives when inspection cadence is exceeded for the season', () => {
    vi.setSystemTime(new Date('2026-05-22T12:00:00.000Z'));

    const hive = createHive({ lastInspectionAt: '2026-05-01T10:00:00.000Z' });
    const inspection = createInspection({ performedAt: '2026-05-01T10:00:00.000Z' });
    const result = buildDerivedSignals([createApiary()], [hive], [inspection]);

    expect(result.recommendations.map((item) => item.title)).toContain('Kan vara dags för ny genomgång');
    expect(result.tasks.map((item) => item.title)).toContain('Överväg ny genomgång');
  });

  it.each(['Vinterförlust', 'Samhälle dött/avvecklat', 'Samhälle förenat'] as const)(
    'suppresses all recommendations and tasks for hives with terminal event %s',
    (terminalType) => {
      vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

      const deadHive = createHive({ id: 'hive-dead', status: 'Behöver åtgärd', strength: 'Svagt' });
      const uninspectedDeadHive = createHive({ id: 'hive-dead-no-insp', lastInspectionAt: undefined });
      const activeHive = createHive({ id: 'hive-active', name: 'Aktiv kupa' });

      const deadInspection = createInspection({
        id: 'insp-dead',
        hiveId: 'hive-dead',
        performedAt: '2026-07-01T10:00:00.000Z',
        varroaLevel: 'Hög',
        swarmSigns: true,
        actionNeeded: true,
      });
      const activeInspection = createInspection({
        id: 'insp-active',
        hiveId: 'hive-active',
        performedAt: '2026-08-20T10:00:00.000Z',
        varroaLevel: 'Hög',
      });

      const events: HiveEvent[] = [
        {
          id: 'event-terminal-1',
          hiveId: 'hive-dead',
          type: terminalType,
          performedAt: '2026-08-01T10:00:00.000Z',
          notes: 'Avslutad.',
        },
        {
          id: 'event-terminal-2',
          hiveId: 'hive-dead-no-insp',
          type: terminalType,
          performedAt: '2026-08-01T10:00:00.000Z',
          notes: 'Avslutad.',
        },
      ];

      const result = buildDerivedSignals(
        [createApiary()],
        [deadHive, uninspectedDeadHive, activeHive],
        [deadInspection, activeInspection],
        undefined,
        events,
      );

      expect(result.recommendations.filter((item) => item.hiveId === 'hive-dead')).toHaveLength(0);
      expect(result.tasks.filter((item) => item.hiveId === 'hive-dead')).toHaveLength(0);
      expect(result.recommendations.filter((item) => item.hiveId === 'hive-dead-no-insp')).toHaveLength(0);
      expect(result.tasks.filter((item) => item.hiveId === 'hive-dead-no-insp')).toHaveLength(0);
      expect(result.recommendations.some((item) => item.hiveId === 'hive-active')).toBe(true);
    },
  );

  it('keeps varroa follow-up reminder active when another event like Skattning is logged after treatment', () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

    const hive = createHive();
    const inspection = createInspection({ performedAt: '2026-08-19T10:00:00.000Z' });
    const events: HiveEvent[] = [
      {
        id: 'event-varroa',
        hiveId: 'hive-1',
        type: 'Varroabehandling',
        performedAt: '2026-08-12T10:00:00.000Z',
        notes: 'Myrsyra.',
      },
      {
        id: 'event-harvest',
        hiveId: 'hive-1',
        type: 'Skattning/slungning',
        performedAt: '2026-08-15T10:00:00.000Z',
        notes: 'Skattning.',
      },
    ];

    const result = buildDerivedSignals([createApiary()], [hive], [inspection], undefined, events);

    expect(result.recommendations.map((item) => item.title)).toContain('Uppföljande varroamätning rekommenderas');
    expect(result.tasks.map((item) => item.title)).toContain('Gör uppföljande varroamätning');
  });

  it('clears varroa follow-up reminder when Uppföljande varroamätning event is logged after treatment', () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

    const hive = createHive();
    const inspection = createInspection({ performedAt: '2026-08-19T10:00:00.000Z' });
    const events: HiveEvent[] = [
      {
        id: 'event-varroa',
        hiveId: 'hive-1',
        type: 'Varroabehandling',
        performedAt: '2026-08-12T10:00:00.000Z',
        notes: 'Myrsyra.',
      },
      {
        id: 'event-follow-up',
        hiveId: 'hive-1',
        type: 'Uppföljande varroamätning',
        performedAt: '2026-08-18T10:00:00.000Z',
        notes: 'Mätt nedfall.',
      },
      {
        id: 'event-harvest',
        hiveId: 'hive-1',
        type: 'Skattning/slungning',
        performedAt: '2026-08-19T12:00:00.000Z',
        notes: 'Skattning.',
      },
    ];

    const result = buildDerivedSignals([createApiary()], [hive], [inspection], undefined, events);

    expect(result.recommendations.map((item) => item.title)).not.toContain('Uppföljande varroamätning rekommenderas');
    expect(result.tasks.map((item) => item.title)).not.toContain('Gör uppföljande varroamätning');
  });

  it('clears varroa follow-up reminder when an inspection with varroaDetails.checked is logged after treatment', () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

    const hive = createHive();
    const inspection = createInspection({
      performedAt: '2026-08-18T10:00:00.000Z',
      varroaDetails: { checked: true, controlMethod: 'Nedfall' },
    });
    const events: HiveEvent[] = [
      {
        id: 'event-varroa',
        hiveId: 'hive-1',
        type: 'Varroabehandling',
        performedAt: '2026-08-12T10:00:00.000Z',
        notes: 'Myrsyra.',
      },
    ];

    const result = buildDerivedSignals([createApiary()], [hive], [inspection], undefined, events);

    expect(result.recommendations.map((item) => item.title)).not.toContain('Uppföljande varroamätning rekommenderas');
    expect(result.tasks.map((item) => item.title)).not.toContain('Gör uppföljande varroamätning');
  });

  it('does not treat undefined temperature with windy or rainy weather as good inspection weather', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

    const hive = createHive({ strength: 'Starkt' });
    const windyInspection = createInspection({
      weather: {
        condition: 'Soligt',
        wind: 'Blåsigt',
        temperatureC: undefined,
      },
    });
    const rainyInspection = createInspection({
      weather: {
        condition: 'Regn',
        wind: 'Lugnt',
        temperatureC: undefined,
      },
    });

    const windyResult = buildDerivedSignals([createApiary()], [hive], [windyInspection]);
    const rainyResult = buildDerivedSignals([createApiary()], [hive], [rainyInspection]);

    expect(windyResult.recommendations.map((item) => item.title)).not.toContain('Överväg skattlåda');
    expect(rainyResult.recommendations.map((item) => item.title)).not.toContain('Överväg skattlåda');
  });

  it('suppresses weak-colony, queen-check, queen-missing-trend, and inactive-hive during winter seasons', () => {
    vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));

    const hive = createHive({
      strength: 'Svagt',
      queenStatus: 'Osäker',
      lastInspectionAt: '2025-10-01T10:00:00.000Z',
    });
    const inspections = [
      createInspection({
        id: 'insp-w1',
        performedAt: '2025-09-01T10:00:00.000Z',
        queenSeen: false,
        eggsSeen: false,
        openBrood: false,
        cappedBrood: false,
        honey: true,
        pollen: false,
      }),
      createInspection({
        id: 'insp-w2',
        performedAt: '2025-09-15T10:00:00.000Z',
        queenSeen: false,
        eggsSeen: false,
        openBrood: false,
        cappedBrood: false,
        honey: true,
        pollen: false,
      }),
      createInspection({
        id: 'insp-w3',
        performedAt: '2025-10-01T10:00:00.000Z',
        queenSeen: false,
        eggsSeen: false,
        openBrood: false,
        cappedBrood: false,
        honey: true,
        pollen: false,
        actionNeeded: true,
      }),
    ];

    const result = buildDerivedSignals([createApiary()], [hive], inspections);
    const titles = result.recommendations.map((item) => item.title);

    expect(titles).not.toContain('Samhället verkar svagt');
    expect(titles).not.toContain('Följ upp drottningstatus');
    expect(titles).not.toContain('Möjligt drottningproblem');
    expect(titles).not.toContain('Kan vara dags för ny genomgång');
  });

  it('suppresses varroa-pressure and varroa-trend when Varroabehandling occurred after the inspection', () => {
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));

    const hive = createHive({ strength: 'Medel' });
    const inspections = [
      createInspection({ id: 'insp-v1', performedAt: '2026-08-01T10:00:00.000Z', varroaLevel: 'Låg' }),
      createInspection({ id: 'insp-v2', performedAt: '2026-08-10T10:00:00.000Z', varroaLevel: 'Förhöjd' }),
      createInspection({ id: 'insp-v3', performedAt: '2026-08-15T10:00:00.000Z', varroaLevel: 'Förhöjd' }),
    ];
    const events: HiveEvent[] = [
      {
        id: 'event-varroa-after',
        hiveId: 'hive-1',
        type: 'Varroabehandling',
        performedAt: '2026-08-16T10:00:00.000Z',
        notes: 'Behandlad efter genomgång.',
      },
    ];

    const result = buildDerivedSignals([createApiary()], [hive], inspections, undefined, events);
    const titles = result.recommendations.map((item) => item.title);

    expect(titles).not.toContain('Möjligen förhöjt varroatryck');
    expect(titles).not.toContain('Möjligen hög varroabelastning');
    expect(titles).not.toContain('Möjlig varroa-trend uppåt');
  });
});