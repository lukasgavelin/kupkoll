import { describe, expect, it, vi } from 'vitest';

import { BloomWindow } from '@/lib/bloom/dragCalendar';
import { applyTemperatureShiftToWindows, calculateTemperatureShiftDays } from '@/lib/bloom/temperaturePhenology';

describe('applyTemperatureShiftToWindows', () => {
  it('shifts bloom windows forward while preserving phase order', () => {
    const windows: BloomWindow[] = [
      {
        scientificName: 'Salix caprea',
        commonName: 'Salg',
        zone: 'south',
        earlyStartDoy: 90,
        typicalStartDoy: 95,
        peakDoy: 102,
        typicalEndDoy: 110,
        lateEndDoy: 120,
        sampleSize: 12,
        nectarScore: 2,
        pollenScore: 3,
        dragScore: 5,
        season: 'tidig_vår',
      },
    ];

    const shifted = applyTemperatureShiftToWindows(windows, 6);

    expect(shifted[0].earlyStartDoy).toBe(96);
    expect(shifted[0].typicalStartDoy).toBe(101);
    expect(shifted[0].peakDoy).toBe(108);
    expect(shifted[0].typicalEndDoy).toBe(116);
    expect(shifted[0].lateEndDoy).toBe(126);
  });

  it('returns the same array when shift is zero', () => {
    const windows: BloomWindow[] = [
      {
        scientificName: 'Taraxacum officinale',
        commonName: 'Maskros',
        zone: 'south',
        earlyStartDoy: 110,
        typicalStartDoy: 115,
        peakDoy: 120,
        typicalEndDoy: 128,
        lateEndDoy: 135,
        sampleSize: 8,
        nectarScore: 2,
        pollenScore: 3,
        dragScore: 5,
        season: 'vår',
      },
    ];

    const shifted = applyTemperatureShiftToWindows(windows, 0);

    expect(shifted).toBe(windows);
  });
});

describe('calculateTemperatureShiftDays', () => {
  it('returns a positive shift when current year is warmer than historical reference', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const parsed = new URL(url);
      const startDate = parsed.searchParams.get('start_date') ?? '';
      const year = Number(startDate.slice(0, 4));

      const warmYear = 2026;
      const temperature = year === warmYear ? 30 : 5;

      return {
        ok: true,
        json: async () => ({
          daily: {
            time: ['2026-01-01', '2026-01-02', '2026-01-03'],
            temperature_2m_mean: [temperature, temperature, temperature],
          },
        }),
      };
    }) as unknown as typeof fetch;

    const shift = await calculateTemperatureShiftDays(
      {
        latitude: 59.3,
        longitude: 18.1,
      },
      new Date('2026-03-15T12:00:00Z'),
      fetchMock,
    );

    expect(shift).toBeGreaterThan(0);
  });

  it('returns zero shift when reference years fail to load', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const parsed = new URL(url);
      const startDate = parsed.searchParams.get('start_date') ?? '';
      const year = Number(startDate.slice(0, 4));

      if (year < 2026) {
        return {
          ok: false,
          json: async () => ({}),
        };
      }

      return {
        ok: true,
        json: async () => ({
          daily: {
            time: ['2026-01-01', '2026-01-02'],
            temperature_2m_mean: [9, 10],
          },
        }),
      };
    }) as unknown as typeof fetch;

    const shift = await calculateTemperatureShiftDays(
      {
        latitude: 58.0,
        longitude: 14.5,
      },
      new Date('2026-04-01T12:00:00Z'),
      fetchMock,
    );

    expect(shift).toBe(0);
  });
});
