import { BloomWindow } from '@/lib/bloom/dragCalendar';
import { Coordinates } from '@/types/domain';

type OpenMeteoArchiveDailyResponse = {
  daily?: {
    time?: string[];
    temperature_2m_mean?: number[];
  };
};

type TemperatureShiftOptions = {
  baseTemperatureC: number;
  gddPerShiftDay: number;
  maxShiftDays: number;
  referenceYears: number;
};

const DEFAULT_OPTIONS: TemperatureShiftOptions = {
  baseTemperatureC: 5,
  gddPerShiftDay: 45,
  maxShiftDays: 21,
  referenceYears: 5,
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function withYear(date: Date, year: number): Date {
  const month = date.getMonth();
  const day = date.getDate();
  const candidate = new Date(Date.UTC(year, month, day));

  if (candidate.getUTCMonth() !== month) {
    return new Date(Date.UTC(year, month + 1, 0));
  }

  return candidate;
}

function sumGrowingDegreeDays(temperatures: number[], baseTemperatureC: number): number {
  return temperatures.reduce((sum, value) => sum + Math.max(0, value - baseTemperatureC), 0);
}

function buildOpenMeteoArchiveUrl(coordinates: Coordinates, startDate: Date, endDate: Date): string {
  const url = new URL('https://archive-api.open-meteo.com/v1/archive');

  url.searchParams.set('latitude', coordinates.latitude.toString());
  url.searchParams.set('longitude', coordinates.longitude.toString());
  url.searchParams.set('start_date', toIsoDate(startDate));
  url.searchParams.set('end_date', toIsoDate(endDate));
  url.searchParams.set('daily', 'temperature_2m_mean');
  url.searchParams.set('timezone', 'auto');

  return url.toString();
}

async function fetchDailyMeanTemperatures(
  coordinates: Coordinates,
  startDate: Date,
  endDate: Date,
  fetchImplementation: typeof fetch,
): Promise<number[]> {
  const response = await fetchImplementation(buildOpenMeteoArchiveUrl(coordinates, startDate, endDate));

  if (!response.ok) {
    throw new Error('Could not fetch archive weather for bloom phenology.');
  }

  const payload = (await response.json()) as OpenMeteoArchiveDailyResponse;
  const temperatures = payload.daily?.temperature_2m_mean ?? [];

  if (!temperatures.length) {
    throw new Error('Archive weather is missing daily mean temperatures.');
  }

  return temperatures.filter((value): value is number => Number.isFinite(value));
}

function shiftDoy(value: number, shiftDays: number): number {
  return Math.round(clamp(value + shiftDays, 1, 366));
}

function normalizeWindowOrder(window: BloomWindow): BloomWindow {
  const earlyStartDoy = window.earlyStartDoy;
  const typicalStartDoy = Math.max(earlyStartDoy, window.typicalStartDoy);
  const peakDoy = Math.max(typicalStartDoy, window.peakDoy);
  const typicalEndDoy = Math.max(peakDoy, window.typicalEndDoy);
  const lateEndDoy = Math.max(typicalEndDoy, window.lateEndDoy);

  return {
    ...window,
    earlyStartDoy,
    typicalStartDoy,
    peakDoy,
    typicalEndDoy,
    lateEndDoy,
  };
}

export function applyTemperatureShiftToWindows(windows: BloomWindow[], shiftDays: number): BloomWindow[] {
  if (!Number.isFinite(shiftDays) || shiftDays === 0) {
    return windows;
  }

  return windows.map((window) =>
    normalizeWindowOrder({
      ...window,
      earlyStartDoy: shiftDoy(window.earlyStartDoy, shiftDays),
      typicalStartDoy: shiftDoy(window.typicalStartDoy, shiftDays),
      peakDoy: shiftDoy(window.peakDoy, shiftDays),
      typicalEndDoy: shiftDoy(window.typicalEndDoy, shiftDays),
      lateEndDoy: shiftDoy(window.lateEndDoy, shiftDays),
    }),
  );
}

export async function calculateTemperatureShiftDays(
  coordinates: Coordinates,
  targetDate: Date,
  fetchImplementation: typeof fetch = fetch,
  options: TemperatureShiftOptions = DEFAULT_OPTIONS,
): Promise<number> {
  const targetYear = targetDate.getUTCFullYear();
  const targetStart = new Date(Date.UTC(targetYear, 0, 1));
  const targetEnd = new Date(Date.UTC(targetYear, targetDate.getUTCMonth(), targetDate.getUTCDate()));

  if (targetEnd.getTime() < targetStart.getTime()) {
    return 0;
  }

  const currentTemperatures = await fetchDailyMeanTemperatures(coordinates, targetStart, targetEnd, fetchImplementation);
  const currentGdd = sumGrowingDegreeDays(currentTemperatures, options.baseTemperatureC);

  const referencePromises: Promise<number>[] = [];

  for (let offset = 1; offset <= options.referenceYears; offset += 1) {
    const year = targetYear - offset;
    const referenceStart = new Date(Date.UTC(year, 0, 1));
    const referenceEnd = withYear(targetEnd, year);

    referencePromises.push(
      fetchDailyMeanTemperatures(coordinates, referenceStart, referenceEnd, fetchImplementation)
        .then((temperatures) => sumGrowingDegreeDays(temperatures, options.baseTemperatureC))
        .catch(() => Number.NaN),
    );
  }

  const referenceGdds = (await Promise.all(referencePromises)).filter((value) => Number.isFinite(value));

  if (!referenceGdds.length) {
    return 0;
  }

  const referenceAverageGdd = referenceGdds.reduce((sum, value) => sum + value, 0) / referenceGdds.length;
  const gddAnomaly = currentGdd - referenceAverageGdd;
  const rawShift = gddAnomaly / options.gddPerShiftDay;

  return Math.round(clamp(rawShift, -options.maxShiftDays, options.maxShiftDays));
}
