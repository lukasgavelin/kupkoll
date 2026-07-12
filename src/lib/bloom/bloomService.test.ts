import { describe, expect, it, vi } from 'vitest';
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
