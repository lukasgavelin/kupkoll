import { describe, expect, it, vi } from 'vitest';

import { buildOpenMeteoWeatherUrl, fetchInspectionWeather, mapOpenMeteoWeatherCode, mapWindSpeedToLabel } from '@/lib/weather';

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

describe('mapWindSpeedToLabel', () => {
  it('maps wind speed to field-friendly labels', () => {
    expect(mapWindSpeedToLabel(2.5)).toBe('Lugnt');
    expect(mapWindSpeedToLabel(5.5)).toBe('Måttlig vind');
    expect(mapWindSpeedToLabel(9)).toBe('Blåsigt');
  });
});

describe('fetchInspectionWeather', () => {
  it('parses current weather from open-meteo responses', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 17.46,
          weather_code: 2,
          wind_speed_10m: 5.2,
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
    ).resolves.toEqual({
      condition: 'Växlande molnighet',
      wind: 'Måttlig vind',
      temperatureC: 17.5,
    });
  });

  it('fails when required fields are missing', async () => {
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