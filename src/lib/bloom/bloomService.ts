import {
  BloomPrediction,
  BloomWindow,
  buildBloomWindows,
  DEFAULT_OPTIONS,
  extractBloomObservations,
  getDayOfYear,
  getLikelyBloomingPlants,
  getZoneFromLatitude,
  isStrictBloomingPhase,
  SwedenZone,
  parseCsv,
} from '@/lib/bloom/dragCalendar';
import { loadBloomCsvContent } from '@/lib/bloom/loadBloomCsv';
import precomputedBloomWindows from '../../../assets/bloomWindows.json';

type BloomDataset = {
  windows: BloomWindow[];
  rejectedRows: number;
  sampleSize: number;
};

let bloomDatasetPromise: Promise<BloomDataset> | null = null;

type PrecomputedBloomWindowsShape =
  | BloomWindow[]
  | {
      windows?: unknown;
    };

function isPlantSeason(value: unknown): value is BloomWindow['season'] {
  return value === 'tidig_vår' || value === 'vår' || value === 'försommar' || value === 'sommar' || value === 'sensommar';
}

function isSwedenZone(value: unknown): value is SwedenZone {
  return value === 'south' || value === 'middle' || value === 'north';
}

function isBloomWindow(value: unknown): value is BloomWindow {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.scientificName === 'string' &&
    typeof candidate.commonName === 'string' &&
    isSwedenZone(candidate.zone) &&
    typeof candidate.earlyStartDoy === 'number' &&
    typeof candidate.typicalStartDoy === 'number' &&
    typeof candidate.peakDoy === 'number' &&
    typeof candidate.typicalEndDoy === 'number' &&
    typeof candidate.lateEndDoy === 'number' &&
    typeof candidate.sampleSize === 'number' &&
    typeof candidate.nectarScore === 'number' &&
    typeof candidate.pollenScore === 'number' &&
    typeof candidate.dragScore === 'number' &&
    isPlantSeason(candidate.season) &&
    (candidate.notes === undefined || typeof candidate.notes === 'string') &&
    (candidate.isAgricultural === undefined || typeof candidate.isAgricultural === 'boolean')
  );
}

function parsePrecomputedBloomWindows(input: PrecomputedBloomWindowsShape): BloomWindow[] {
  const rawWindows = Array.isArray(input)
    ? input
    : Array.isArray((input as { windows?: unknown }).windows)
    ? ((input as { windows?: unknown[] }).windows ?? [])
    : [];

  return rawWindows.filter(isBloomWindow);
}

function satisfiesMinimumSamplePolicy(window: BloomWindow, options: { minSamplesPerPlantZone: number }): boolean {
  if (window.sampleSize >= options.minSamplesPerPlantZone) {
    return true;
  }

  // Fallback windows are allowed to represent sparse but high-value crops.
  return window.isAgricultural === true;
}

async function buildDataset() {
  const precomputedWindows = parsePrecomputedBloomWindows(precomputedBloomWindows as PrecomputedBloomWindowsShape).filter((window) =>
    satisfiesMinimumSamplePolicy(window, DEFAULT_OPTIONS),
  );

  if (precomputedWindows.length > 0) {
    const sampleSize = precomputedWindows.reduce((sum, window) => sum + Math.max(0, window.sampleSize), 0);

    return {
      windows: precomputedWindows,
      rejectedRows: 0,
      sampleSize,
    };
  }

  const csvContent = await loadBloomCsvContent();
  const rows = parseCsv(csvContent);
  const bloomingRows = rows.filter(isStrictBloomingPhase);
  const observations = extractBloomObservations(rows, DEFAULT_OPTIONS);
  const windows = buildBloomWindows(observations, DEFAULT_OPTIONS);
  const rejectedRows = Math.max(0, bloomingRows.length - observations.length);

  return {
    windows,
    rejectedRows,
    sampleSize: observations.length,
  };
}

export async function getBloomDataset() {
  if (!bloomDatasetPromise) {
    bloomDatasetPromise = buildDataset().catch((error) => {
      bloomDatasetPromise = null;
      throw error;
    });
  }

  return bloomDatasetPromise;
}

export async function getLikelyBloomingPlantsNow(params: {
  userLatitude: number;
  date?: Date;
  minimumBloomProbability?: number;
}): Promise<{ predictions: BloomPrediction[]; zone: SwedenZone; sampleSize: number; rejectedRows: number }> {
  const dataset = await getBloomDataset();
  const currentDayOfYear = getDayOfYear(params.date ?? new Date());
  const zone = getZoneFromLatitude(params.userLatitude, DEFAULT_OPTIONS);

  const rawPredictions = getLikelyBloomingPlants(currentDayOfYear, params.userLatitude, dataset.windows, DEFAULT_OPTIONS);
  const minimumBloomProbability = params.minimumBloomProbability ?? 0.15;
  const predictions = rawPredictions.filter((prediction) => prediction.bloomProbability >= minimumBloomProbability);

  return {
    predictions,
    zone,
    sampleSize: dataset.sampleSize,
    rejectedRows: dataset.rejectedRows,
  };
}

export function clearBloomDatasetCache() {
  bloomDatasetPromise = null;
}
