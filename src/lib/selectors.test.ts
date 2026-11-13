import { describe, expect, it } from 'vitest';

import { getApiaryDisplayLocation, getApiaryMunicipalityLabel, getApiaryRegion, getApiarySeasonLabel, getRecommendedInspectionCadenceDays, getSeasonLabel, getSeasonStatus } from '@/lib/selectors';

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
      phaseLabel: 'första vårkollen',
      regionLabel: 'Sverige',
    });
    expect(result.timingLabel).toContain('mars till maj');
    expect(result.summary).toContain('skifta snabbt');
    expect(result.focusItems).toContain('gör vårundersökning när temperaturen tillåter flygväder');
    expect(result.watchItems).toContain('håll flusterskydd kvar länge om snö och stark vårsol riskerar att locka ut bina för tidigt');
  });

  it('returns a stronger production-oriented profile in summer', () => {
    const result = getSeasonStatus(new Date('2026-07-10T12:00:00.000Z'));

    expect(result).toMatchObject({
      season: 'Drag och skattning',
      monthLabel: 'Juli',
      phaseLabel: 'första skattningen',
    });
    expect(result.focusItems).toContain('skatta och slunga första honungen utan att ta allt från bina');
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
    expect(result.timingLabel).toContain('januari till mars');
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

  it('keeps northern apiaries one step later in spring buildup', () => {
    const result = getApiarySeasonLabel(
      {
        id: 'apiary-1',
        name: 'Nordgården',
        location: 'Luleå',
        notes: '',
        coordinates: { latitude: 65.5848, longitude: 22.1547 },
      },
      new Date('2026-05-15T12:00:00.000Z'),
    );

    expect(result).toBe('Vårutveckling');
  });
});

describe('getRecommendedInspectionCadenceDays', () => {
  it('uses tighter cadence in swarm season and slower cadence in northern spring', () => {
    expect(getRecommendedInspectionCadenceDays('Svärmperiod', 'Mellansverige')).toBe(7);
    expect(getRecommendedInspectionCadenceDays('Svärmperiod', 'Norra Sverige')).toBe(10);
    expect(getRecommendedInspectionCadenceDays('Vårutveckling', 'Norra Sverige')).toBe(14);
  });
});

describe('getApiaryDisplayLocation', () => {
  it('prefers geocoded municipality and county', () => {
    expect(
      getApiaryDisplayLocation({
        id: 'apiary-1',
        name: 'Dag H',
        location: 'Dag H',
        notes: '',
        locationDetails: {
          source: 'auto',
          municipality: 'Uppsala',
          county: 'Uppsala',
        },
      }),
    ).toBe('Uppsala kommun, Uppsala län');
  });

  it('does not invent municipality from manual place name', () => {
    expect(
      getApiaryDisplayLocation({
        id: 'apiary-2',
        name: 'Dag H',
        location: 'Dag H',
        notes: '',
        locationDetails: {
          source: 'manual',
          municipality: 'Dag H',
        },
      }),
    ).toBe('Dag H');
  });

  it('ignores stale county, locality, and municipality when source is manual without coordinates', () => {
    expect(
      getApiaryDisplayLocation({
        id: 'apiary-2b',
        name: 'Dag H',
        location: 'Min nya plats',
        notes: '',
        locationDetails: {
          source: 'manual',
          locality: 'Gammal ort',
          municipality: 'Uppsala',
          county: 'Uppsala län',
        },
      }),
    ).toBe('Min nya plats');
  });

  it('uses municipality from geodata when coordinates exist even if source is manual', () => {
    expect(
      getApiaryDisplayLocation({
        id: 'apiary-3',
        name: 'Dag H',
        location: 'Dag H',
        notes: '',
        coordinates: { latitude: 59.8586, longitude: 17.6389 },
        locationDetails: {
          source: 'manual',
          municipality: 'Uppsala',
        },
      }),
    ).toBe('Uppsala kommun');
  });
});

describe('getApiaryMunicipalityLabel', () => {
  it('returns municipality label for trusted data', () => {
    expect(
      getApiaryMunicipalityLabel({
        id: 'apiary-4',
        name: 'Dag H',
        location: 'Dag H',
        notes: '',
        coordinates: { latitude: 59.8586, longitude: 17.6389 },
        locationDetails: {
          source: 'manual',
          municipality: 'Uppsala',
        },
      }),
    ).toBe('Uppsala kommun');
  });

  it('is used by season status when present', () => {
    const seasonStatus = getSeasonStatus(new Date('2026-04-05T12:00:00.000Z'), [
      {
        id: 'apiary-5',
        name: 'Dag H',
        location: 'Dag H',
        notes: '',
        coordinates: { latitude: 59.8586, longitude: 17.6389 },
        locationDetails: {
          source: 'manual',
          municipality: 'Uppsala',
        },
      },
    ]);

    expect(seasonStatus.locationLabel).toBe('Uppsala kommun');
  });

  it('returns undefined for manual location without coordinates even if stale fields exist', () => {
    const manualApiary = {
      id: 'apiary-6',
      name: 'Dag H',
      location: 'Min nya plats',
      notes: '',
      locationDetails: {
        source: 'manual' as const,
        locality: 'Gammal ort',
        municipality: 'Uppsala',
        county: 'Uppsala län',
      },
    };

    expect(getApiaryMunicipalityLabel(manualApiary)).toBeUndefined();
    expect(getSeasonStatus(new Date('2026-04-05T12:00:00.000Z'), [manualApiary]).locationLabel).toBe('Min nya plats');
  });

  it('maps Swedish region keywords and unified latitude thresholds in getApiaryRegion', () => {
    expect(getApiaryRegion({ id: 'a1', name: 'A1', location: 'Gotland', notes: '' })).toBe('Södra Sverige');
    expect(getApiaryRegion({ id: 'a2', name: 'A2', location: 'Småland', notes: '' })).toBe('Södra Sverige');
    expect(getApiaryRegion({ id: 'a3', name: 'A3', location: 'Värmland', notes: '' })).toBe('Mellansverige');
    expect(getApiaryRegion({ id: 'a4', name: 'A4', location: 'Dalarna', notes: '' })).toBe('Mellansverige');
    expect(getApiaryRegion({ id: 'a5', name: 'A5', location: 'Lappland', notes: '' })).toBe('Norra Sverige');
    expect(getApiaryRegion({ id: 'a6', name: 'A6', location: 'Härjedalen', notes: '' })).toBe('Norra Sverige');
    expect(getApiaryRegion({ id: 'a7', name: 'A7', location: 'Ångermanland', notes: '' })).toBe('Norra Sverige');

    expect(getApiaryRegion({ id: 'c1', name: 'C1', location: 'Gräns', notes: '', coordinates: { latitude: 57.49, longitude: 15 } })).toBe('Södra Sverige');
    expect(getApiaryRegion({ id: 'c2', name: 'C2', location: 'Gräns', notes: '', coordinates: { latitude: 57.5, longitude: 15 } })).toBe('Mellansverige');
    expect(getApiaryRegion({ id: 'c3', name: 'C3', location: 'Gräns', notes: '', coordinates: { latitude: 61.99, longitude: 15 } })).toBe('Mellansverige');
    expect(getApiaryRegion({ id: 'c4', name: 'C4', location: 'Gräns', notes: '', coordinates: { latitude: 62.0, longitude: 15 } })).toBe('Norra Sverige');
  });
});