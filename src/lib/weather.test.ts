import { describe, expect, it, vi } from 'vitest';

import { buildOpenMeteoWeatherUrl, buildSmhiPointForecastUrl, fetchInspectionWeather, fetchSmhiWeather, mapOpenMeteoWeatherCode, mapSmhiWeatherSymbol, mapWindSpeedToLabel, parseSmhiWeatherSnapshot } from '@/lib/weather';

describe('buildSmhiPointForecastUrl', () => {
  it('uses SMHI point forecast coordinates with the expected precision', () => {
    const url = buildSmhiPointForecastUrl({
      latitude: 59.85856,
      longitude: 17.63893,
    });

    expect(url).toContain('/lon/17.6389/lat/59.8586/data.json');
  });
});

describe('buildOpenMeteoWeatherUrl', () => {
  it('includes coordinates and current weather fields', () => {
    const url = buildOpenMeteoWeatherUrl({
      latitude: 59.85856,
      longitude: 17.63893,
    });

    expect(url).toContain('latitude=59.85856');
    expect(url).toContain('longitude=17.63893');
    expect(url).toContain('current=temperature_2m%2Cweather_code%2Cwind_speed_10m');
    expect(url).toContain('wind_speed_unit=ms');
  });
});

describe('mapOpenMeteoWeatherCode', () => {
  it('maps clear and cloudy weather codes to inspection labels', () => {
    expect(mapOpenMeteoWeatherCode(0)).toBe('Soligt');
    expect(mapOpenMeteoWeatherCode(2)).toBe('Växlande molnighet');
    expect(mapOpenMeteoWeatherCode(45)).toBe('Mulet');
    expect(mapOpenMeteoWeatherCode(53)).toBe('Duggregn');
    expect(mapOpenMeteoWeatherCode(63)).toBe('Regn');
  });
});

describe('mapSmhiWeatherSymbol', () => {
  it('maps SMHI symbols to inspection labels', () => {
    expect(mapSmhiWeatherSymbol(1)).toBe('Soligt');
    expect(mapSmhiWeatherSymbol(3)).toBe('Växlande molnighet');
    expect(mapSmhiWeatherSymbol(6)).toBe('Mulet');
    expect(mapSmhiWeatherSymbol(9)).toBe('Duggregn');
    expect(mapSmhiWeatherSymbol(15)).toBe('Regn');
  });
});

describe('mapWindSpeedToLabel', () => {
  it('maps wind speed to field-friendly labels', () => {
    expect(mapWindSpeedToLabel(2.5)).toBe('Lugnt');
    expect(mapWindSpeedToLabel(5.5)).toBe('Måttlig vind');
    expect(mapWindSpeedToLabel(9)).toBe('Blåsigt');
  });
});

describe('fetchInspectionWeather', () => {
  it('parses current weather from SMHI responses', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        timeSeries: [
          {
            validTime: '2026-03-26T10:00:00Z',
            parameters: [
              { name: 't', values: [17.46] },
              { name: 'ws', values: [5.2] },
              { name: 'Wsymb2', values: [3] },
            ],
          },
        ],
      }),
    })) as unknown as typeof fetch;

    await expect(
      fetchSmhiWeather(
        {
          latitude: 59.85856,
          longitude: 17.63893,
        },
        fetchMock,
      ),
    ).resolves.toEqual({
      condition: 'Växlande molnighet',
      wind: 'Måttlig vind',
      temperatureC: 17.5,
      provider: 'SMHI',
    });
  });

  it('falls back to Open-Meteo when SMHI is unavailable', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('opendata-download-metfcst.smhi.se')) {
        return {
          ok: false,
          json: async () => ({}),
        };
      }

      return {
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 17.46,
            weather_code: 2,
            wind_speed_10m: 5.2,
          },
        }),
      };
    }) as unknown as typeof fetch;

    await expect(
      fetchInspectionWeather(
        {
          latitude: 59.85856,
          longitude: 17.63893,
        },
        fetchMock,
      ),
    ).resolves.toEqual({
      condition: 'Växlande molnighet',
      wind: 'Måttlig vind',
      temperatureC: 17.5,
      provider: 'Open-Meteo',
    });
  });

  it('fails when required fields are missing in the Open-Meteo fallback', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        current: {
          weather_code: 0,
        },
      }),
    })) as unknown as typeof fetch;

    await expect(
      fetchInspectionWeather(
        {
          latitude: 59.85856,
          longitude: 17.63893,
        },
        fetchMock,
      ),
    ).rejects.toThrow('Weather response is missing required values.');
  });
});

describe('parseSmhiWeatherSnapshot', () => {
  it('selects the closest future timeseries entry', () => {
    const snapshot = parseSmhiWeatherSnapshot(
      {
        timeSeries: [
          {
            validTime: '2026-03-26T09:00:00Z',
            parameters: [
              { name: 't', values: [4.5] },
              { name: 'ws', values: [2.2] },
              { name: 'Wsymb2', values: [1] },
            ],
          },
          {
            validTime: '2026-03-26T11:00:00Z',
            parameters: [
              { name: 't', values: [6.1] },
              { name: 'ws', values: [4.1] },
              { name: 'Wsymb2', values: [6] },
            ],
          },
        ],
      },
      new Date('2026-03-26T10:00:00Z'),
    );

    expect(snapshot).toEqual({
      condition: 'Mulet',
      wind: 'Måttlig vind',
      temperatureC: 6.1,
      provider: 'SMHI',
    });
  });
});