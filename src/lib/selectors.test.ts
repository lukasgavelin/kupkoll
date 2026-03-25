import { describe, expect, it } from 'vitest';

import { getApiarySeasonLabel, getSeasonLabel, getSeasonStatus } from '@/lib/selectors';

describe('getSeasonLabel', () => {
  it('maps months to biodling seasons', () => {
    expect(getSeasonLabel(new Date('2026-01-15T12:00:00.000Z'))).toBe('Vintertillsyn');
    expect(getSeasonLabel(new Date('2026-03-15T12:00:00.000Z'))).toBe('Vårutveckling');
    expect(getSeasonLabel(new Date('2026-06-15T12:00:00.000Z'))).toBe('Svärmperiod');
    expect(getSeasonLabel(new Date('2026-07-15T12:00:00.000Z'))).toBe('Drag och skattning');
    expect(getSeasonLabel(new Date('2026-09-15T12:00:00.000Z'))).toBe('Invintring');
    expect(getSeasonLabel(new Date('2026-11-15T12:00:00.000Z'))).toBe('Vinterro');
  });
});

describe('getSeasonStatus', () => {
  it('returns a month-specific season profile for early spring', () => {
    const result = getSeasonStatus(new Date('2026-03-25T12:00:00.000Z'));

    expect(result).toMatchObject({
      season: 'Vårutveckling',
      monthLabel: 'Mars',
      phaseLabel: 'marsarbete',
      regionLabel: 'Sverige',
    });
    expect(result.summary).toContain('förrädiskt');
    expect(result.focusItems).toContain('gör vårundersökning om vädret tillåter');
  });

  it('returns a stronger production-oriented profile in summer', () => {
    const result = getSeasonStatus(new Date('2026-07-10T12:00:00.000Z'));

    expect(result).toMatchObject({
      season: 'Drag och skattning',
      monthLabel: 'Juli',
      phaseLabel: 'högsommar',
    });
    expect(result.focusItems).toContain('skatta och slunga första honungen');
  });

  it('adapts season status to northern apiaries where spring comes later', () => {
    const result = getSeasonStatus(
      new Date('2026-03-25T12:00:00.000Z'),
      [
        {
          id: 'apiary-1',
          name: 'Norrgården',
          location: 'Umeå',
          notes: '',
          coordinates: { latitude: 63.8258, longitude: 20.263 },
        },
      ],
    );

    expect(result.regionLabel).toBe('Norra Sverige');
    expect(result.season).toBe('Vintertillsyn');
    expect(result.inspectionCadenceDays).toBe(30);
  });
});

describe('getApiarySeasonLabel', () => {
  it('moves southern apiaries slightly earlier into active season', () => {
    const result = getApiarySeasonLabel(
      {
        id: 'apiary-1',
        name: 'Sydgården',
        location: 'Malmö',
        notes: '',
        coordinates: { latitude: 55.604981, longitude: 13.003822 },
      },
      new Date('2026-05-15T12:00:00.000Z'),
    );

    expect(result).toBe('Svärmperiod');
  });
});