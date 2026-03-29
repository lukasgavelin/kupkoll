import {
  BloomPrediction,
  BloomWindow,
  buildBloomWindows,
  DEFAULT_OPTIONS,
  extractBloomObservations,
  getDayOfYear,
  getLikelyBloomingPlants,
  getZoneFromLatitude,
  SwedenZone,
  parseCsv,
} from '@/lib/bloom/dragCalendar';
import { loadBloomCsvContent } from '@/lib/bloom/loadBloomCsv';

type BloomDataset = {
  windows: BloomWindow[];
  rejectedRows: number;
  sampleSize: number;
};

let bloomDatasetPromise: Promise<BloomDataset> | null = null;

async function buildDataset() {
  const csvContent = await loadBloomCsvContent();
  const rows = parseCsv(csvContent);
  const bloomingRows = rows.filter((row) => {
    const phase = (row.phase_main_name_SE ?? '').toString().trim().toLowerCase();
    const event = (row.event_name_SE ?? '').toString().trim().toLowerCase();

    return phase.includes('blomning') || event.includes('blom');
  });
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
