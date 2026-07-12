import { describe, expect, it } from 'vitest';

import {
  DEFAULT_OPTIONS,
  buildBloomWindows,
  extractBloomObservations,
  getLikelyBloomingPlants,
  parseCsv,
  getWindowForLatitude,
  getBloomStatus,
} from '@/lib/bloom/dragCalendar';

describe('dragCalendar', () => {
  it('parses CSV and keeps only blooming observations', () => {
    const csv = [
      'common_name,scientific_name,obs_year,obs_doy,latitude,longitude,phase_main_name_SE,event_name_SE',
      'Sälg,Salix caprea,2022,92,56.1,13.1,Blomning,Start',
      'Sälg,Salix caprea,2022,93,56.1,13.1,Lövsprickning,Blommor utslagna',
      'Sälg,Salix caprea,2022,95,56.2,13.2,Lövsprickning,Knopp',
      'Maskros,Taraxacum officinale,2022,120,59.1,18.1,Blomning,Blommor',
    ].join('\n');

    const parsed = parseCsv(csv);
    const observations = extractBloomObservations(parsed, DEFAULT_OPTIONS);

    expect(observations.length).toBe(2);
    expect(observations.every((item) => item.zone === 'south' || item.zone === 'middle' || item.zone === 'north')).toBe(true);
  });

  it('adds agricultural fallback windows when data is sparse', () => {
    const observations = [
      {
        scientificName: 'Salix caprea',
        commonName: 'Sälg',
        obsYear: 2021,
        obsDoy: 90,
        latitude: 56.2,
        longitude: 13.2,
        zone: 'south' as const,
      },
    ];

    const windows = buildBloomWindows(observations, {
      ...DEFAULT_OPTIONS,
      minSamplesPerPlantZone: 10,
      enableAgriculturalFallbacks: true,
    });

    expect(windows.some((window) => window.scientificName === 'Brassica napus' && window.zone === 'south')).toBe(true);
    expect(windows.some((window) => window.scientificName === 'Phacelia tanacetifolia' && window.zone === 'north')).toBe(true);
  });

  it('excludes non-fallback species when sample size is below threshold', () => {
    const observations = [
      {
        scientificName: 'Salix caprea',
        commonName: 'Sälg',
        obsYear: 2021,
        obsDoy: 90,
        latitude: 56.2,
        longitude: 13.2,
        zone: 'south' as const,
      },
      {
        scientificName: 'Salix caprea',
        commonName: 'Sälg',
        obsYear: 2022,
        obsDoy: 94,
        latitude: 56.1,
        longitude: 13.1,
        zone: 'south' as const,
      },
    ];

    const windows = buildBloomWindows(observations, {
      ...DEFAULT_OPTIONS,
      minSamplesPerPlantZone: 5,
      enableAgriculturalFallbacks: true,
    });

    expect(windows.some((window) => window.scientificName === 'Salix caprea' && window.zone === 'south')).toBe(false);
    expect(windows.some((window) => window.scientificName === 'Brassica napus' && window.zone === 'south')).toBe(true);
  });

  it('returns likely blooming plants sorted by priority score', () => {
    const csv = [
      'common_name,scientific_name,obs_year,obs_doy,latitude,longitude,phase_main_name_SE,event_name_SE',
      'Sälg,Salix caprea,2019,84,56.1,13.1,Blomning,Start',
      'Sälg,Salix caprea,2020,88,56.2,13.2,Blomning,Blommor',
      'Sälg,Salix caprea,2021,91,56.3,13.1,Blomning,Blommor',
      'Sälg,Salix caprea,2022,94,56.0,13.0,Blomning,Blommor',
      'Sälg,Salix caprea,2023,96,56.4,13.3,Blomning,Blommor',
      'Maskros,Taraxacum officinale,2019,110,56.3,13.1,Blomning,Start',
      'Maskros,Taraxacum officinale,2020,114,56.2,13.1,Blomning,Blommor',
      'Maskros,Taraxacum officinale,2021,118,56.2,13.2,Blomning,Blommor',
      'Maskros,Taraxacum officinale,2022,122,56.1,13.1,Blomning,Blommor',
      'Maskros,Taraxacum officinale,2023,125,56.4,13.4,Blomning,Blommor',
    ].join('\n');

    const windows = buildBloomWindows(extractBloomObservations(parseCsv(csv)), {
      ...DEFAULT_OPTIONS,
      minSamplesPerPlantZone: 5,
      enableAgriculturalFallbacks: false,
    });

    const predictions = getLikelyBloomingPlants(92, 56.2, windows);

    expect(predictions.length).toBeGreaterThan(0);
    expect(predictions[0].priorityScore).toBeGreaterThanOrEqual(predictions[predictions.length - 1].priorityScore);
  });

  it('assigns lower confidence to agricultural fallback windows with no samples', () => {
    const windows = buildBloomWindows([], {
      ...DEFAULT_OPTIONS,
      enableAgriculturalFallbacks: true,
    });

    const fallbackPrediction = getLikelyBloomingPlants(132, 56.2, windows).find((prediction) => prediction.scientificName === 'Brassica napus');

    expect(fallbackPrediction).toBeDefined();
    expect(fallbackPrediction?.confidenceScore).toBe(0.35);
  });

  it('calculates continuous bloom windows based on regression for latitude', () => {
    // Hassel (Corylus avellana)
    const southernWindow = getWindowForLatitude('Corylus avellana', 56.0);
    const northernWindow = getWindowForLatitude('Corylus avellana', 63.0);

    expect(southernWindow).toBeDefined();
    expect(northernWindow).toBeDefined();

    // In Sweden, spring starts earlier in the south.
    // So the southern typicalStartDoy should be earlier than northern typicalStartDoy.
    expect(southernWindow!.typicalStartDoy).toBeLessThan(northernWindow!.typicalStartDoy);
  });

  it('correctly reports getBloomStatus as soon (snart) for winter days', () => {
    // A plant blooming in summer (typical start doy 180)
    const mockWindow = {
      scientificName: 'Epilobium angustifolium',
      commonName: 'Mjölke',
      zone: 'south' as const,
      earlyStartDoy: 170,
      typicalStartDoy: 180,
      peakDoy: 195,
      typicalEndDoy: 210,
      lateEndDoy: 230,
      sampleSize: 100,
      nectarScore: 3 as const,
      pollenScore: 2 as const,
      dragScore: 5 as const,
      season: 'sommar' as const,
    };

    // Winter day (DOY 15) should be classified as 'snart' (soon) and not 'nu' (now)
    const status = getBloomStatus(15, mockWindow);
    expect(status).toBe('snart');
  });
});