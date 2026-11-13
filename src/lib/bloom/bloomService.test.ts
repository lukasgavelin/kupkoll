import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storageMap = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => storageMap.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storageMap.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      storageMap.delete(key);
    }),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateDragEfficiency, getLikelyBloomingPlantsNow } from '@/lib/bloom/bloomService';
import { InspectionWeatherSnapshot } from '@/lib/weather';

describe('bloomService weather flight efficiency', () => {
  it('assigns zero efficiency when it is too cold (<12C)', () => {
    const coldWeather: InspectionWeatherSnapshot = {
      condition: 'Soligt',
      wind: 'Lugnt',
      temperatureC: 10,
      provider: 'SMHI',
    };
    const res = calculateDragEfficiency(coldWeather);
    expect(res.efficiency).toBe(0.0);
    expect(res.label).toContain('kallt');
  });

  it('assigns zero efficiency when it is raining', () => {
    const rainyWeather: InspectionWeatherSnapshot = {
      condition: 'Regn',
      wind: 'Lugnt',
      temperatureC: 20,
      provider: 'SMHI',
    };
    const res = calculateDragEfficiency(rainyWeather);
    expect(res.efficiency).toBe(0.0);
    expect(res.label).toContain('Regn');
  });

  it('assigns reduced efficiency in windy conditions', () => {
    const windyWeather: InspectionWeatherSnapshot = {
      condition: 'Soligt',
      wind: 'Blåsigt',
      temperatureC: 22,
      provider: 'SMHI',
    };
    const res = calculateDragEfficiency(windyWeather);
    expect(res.efficiency).toBe(0.5);
    expect(res.label).toContain('hård vind');
  });

  it('assigns full efficiency in optimal conditions', () => {
    const optimalWeather: InspectionWeatherSnapshot = {
      condition: 'Soligt',
      wind: 'Lugnt',
      temperatureC: 22,
      provider: 'SMHI',
    };
    const res = calculateDragEfficiency(optimalWeather);
    expect(res.efficiency).toBe(1.0);
    expect(res.label).toContain('Optimalt');
  });

  it('returns predictions and weather details in getLikelyBloomingPlantsNow', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          daily: {
            time: ['2026-06-15'],
            temperature_2m_mean: [22],
          },
        }),
      };
    }) as unknown as typeof fetch;

    const result = await getLikelyBloomingPlantsNow({
      userLatitude: 59.3,
      date: new Date('2026-06-15T12:00:00Z'),
      enableWeatherAdjustment: false, // Avoid network GDD shift calls during this test
    });

    expect(result.predictions).toBeDefined();
    expect(result.predictions.length).toBeGreaterThan(0);
    expect(result.zone).toBe('middle');
  });
});

describe('bloomService caching resilience', () => {
  beforeEach(() => {
    storageMap.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not cache failed fetches when both GDD shift and current weather fail', async () => {
    const failingFetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await getLikelyBloomingPlantsNow({
      userLatitude: 59.3,
      coordinates: { latitude: 59.3, longitude: 18.1 },
      date: new Date(2026, 5, 15, 10, 0, 0),
      fetchImplementation: failingFetch,
    });

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('expires current weather after 2 hours while keeping 24h GDD shift cached and uses local date stamp', async () => {
    const fetchSpy = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target.includes('archive-api.open-meteo.com')) {
        return {
          ok: true,
          json: async () => ({
            daily: {
              time: ['2026-01-01'],
              temperature_2m_mean: [10],
            },
          }),
        };
      }
      if (target.includes('smhi.se')) {
        return {
          ok: true,
          json: async () => ({
            timeSeries: [
              {
                validTime: '2026-06-15T10:00:00Z',
                parameters: [
                  { name: 't', values: [20] },
                  { name: 'ws', values: [2] },
                  { name: 'Wsymb2', values: [1] },
                ],
              },
            ],
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    const fetchMock = fetchSpy as unknown as typeof fetch;

    const localDate = new Date(2026, 5, 15, 1, 0, 0); // 01:00 local time
    await getLikelyBloomingPlantsNow({
      userLatitude: 59.3,
      coordinates: { latitude: 59.3, longitude: 18.1 },
      date: localDate,
      fetchImplementation: fetchMock,
    });

    const cachedRaw = storageMap.get('KUPKOLL_BLOOM_WEATHER_CACHE');
    expect(cachedRaw).toBeDefined();
    expect(cachedRaw).toContain('2026-06-15');

    const initialArchiveCalls = fetchSpy.mock.calls.filter(([u]) => String(u).includes('archive-api')).length;
    const initialSmhiCalls = fetchSpy.mock.calls.filter(([u]) => String(u).includes('smhi.se')).length;
    expect(initialArchiveCalls).toBeGreaterThan(0);
    expect(initialSmhiCalls).toBe(1);

    // Advance 3 hours: weather TTL (2h) expires, GDD shift TTL (24h) is still valid
    vi.advanceTimersByTime(3 * 60 * 60 * 1000);
    fetchSpy.mockClear();

    await getLikelyBloomingPlantsNow({
      userLatitude: 59.3,
      coordinates: { latitude: 59.3, longitude: 18.1 },
      date: localDate,
      fetchImplementation: fetchMock,
    });

    const laterArchiveCalls = fetchSpy.mock.calls.filter(([u]) => String(u).includes('archive-api')).length;
    const laterSmhiCalls = fetchSpy.mock.calls.filter(([u]) => String(u).includes('smhi.se')).length;
    expect(laterArchiveCalls).toBe(0);
    expect(laterSmhiCalls).toBe(1);
  });

  it('preserves botanical priorityScore when dragEfficiency is 0 (too cold or raining)', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const target = String(url);
      if (target.includes('archive-api.open-meteo.com')) {
        return {
          ok: true,
          json: async () => ({
            daily: {
              time: ['2026-06-01'],
              temperature_2m_mean: [10],
            },
          }),
        };
      }
      if (target.includes('smhi.se')) {
        return {
          ok: true,
          json: async () => ({
            timeSeries: [
              {
                validTime: '2026-06-15T10:00:00Z',
                parameters: [
                  { name: 't', values: [8] },
                  { name: 'ws', values: [2] },
                  { name: 'Wsymb2', values: [1] },
                ],
              },
            ],
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    }) as unknown as typeof fetch;

    const result = await getLikelyBloomingPlantsNow({
      userLatitude: 59.3,
      coordinates: { latitude: 59.3, longitude: 18.1 },
      date: new Date(2026, 5, 15, 10, 0, 0),
      fetchImplementation: fetchMock,
    });

    expect(result.dragEfficiency).toBe(0);
    expect(result.predictions.length).toBeGreaterThan(0);
    expect(result.predictions[0]?.priorityScore).toBeGreaterThan(0);
  });
});
