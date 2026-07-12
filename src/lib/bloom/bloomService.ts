import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BloomPrediction,
  BloomWindow,
  DEFAULT_OPTIONS,
  getDayOfYear,
  getLikelyBloomingPlants,
  getZoneFromLatitude,
  SwedenZone,
  beePlants,
  getWindowForLatitude,
} from '@/lib/bloom/dragCalendar';
import { applyTemperatureShiftToWindows, calculateTemperatureShiftDays } from '@/lib/bloom/temperaturePhenology';
import { Coordinates } from '@/types/domain';
import { fetchInspectionWeather, InspectionWeatherSnapshot } from '@/lib/weather';

const KUPKOLL_BLOOM_WEATHER_CACHE_KEY = 'KUPKOLL_BLOOM_WEATHER_CACHE';

type CachedWeatherData = {
  latitude: number;
  longitude: number;
  dateStr: string;
  shiftDays: number;
  weatherSnapshot: InspectionWeatherSnapshot | null;
  timestamp: number;
};

export type BloomPredictionResponse = {
  predictions: BloomPrediction[];
  zone: SwedenZone;
  sampleSize: number;
  rejectedRows: number;
  currentWeather?: InspectionWeatherSnapshot;
  dragEfficiency?: number;
  dragEfficiencyLabel?: string;
};

export function calculateDragEfficiency(weather: InspectionWeatherSnapshot): { efficiency: number; label: string } {
  const temp = weather.temperatureC;
  const cond = weather.condition;
  const wind = weather.wind;

  if (temp <= 11) {
    return { efficiency: 0.0, label: 'För kallt för flygning (<12°C)' };
  }

  let tempEff = 1.0;
  if (temp < 18) {
    tempEff = (temp - 11) / 7;
  }

  if (cond === 'Regn') {
    return { efficiency: 0.0, label: 'Regn hindrar flygning' };
  }
  if (cond === 'Duggregn') {
    return { efficiency: 0.1, label: 'Regn/duggregn stoppar nästan all flygning' };
  }

  let windEff = 1.0;
  let windLabelSuffix = '';
  if (wind === 'Blåsigt') {
    windEff = 0.5;
    windLabelSuffix = ' (hård vind begränsar flygning)';
  } else if (wind === 'Måttlig vind') {
    windEff = 0.85;
  }

  const finalEff = Math.round(tempEff * windEff * 100) / 100;

  let label = 'Goda flygförutsättningar';
  if (finalEff >= 0.85) {
    label = 'Optimalt flygväder' + windLabelSuffix;
  } else if (finalEff >= 0.5) {
    label = 'Måttligt flygväder' + windLabelSuffix;
  } else if (finalEff > 0) {
    label = 'Svagt flygväder' + windLabelSuffix;
  }

  return { efficiency: finalEff, label };
}

async function getCachedWeatherData(coordinates: Coordinates, date: Date): Promise<CachedWeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(KUPKOLL_BLOOM_WEATHER_CACHE_KEY);
    if (!raw) return null;

    const cache: Record<string, CachedWeatherData> = JSON.parse(raw);
    const dateStr = date.toISOString().slice(0, 10);
    const now = Date.now();

    for (const entry of Object.values(cache)) {
      const isSameDay = entry.dateStr === dateStr;
      const isRecent = now - entry.timestamp < 24 * 60 * 60 * 1000;
      const latDiff = Math.abs(entry.latitude - coordinates.latitude);
      const lonDiff = Math.abs(entry.longitude - coordinates.longitude);
      const isClose = latDiff < 0.01 && lonDiff < 0.01;

      if (isSameDay && isRecent && isClose) {
        return entry;
      }
    }
  } catch {
    // Ignore cache read errors
  }
  return null;
}

async function saveCachedWeatherData(coordinates: Coordinates, date: Date, shiftDays: number, weatherSnapshot: InspectionWeatherSnapshot | null) {
  try {
    const raw = await AsyncStorage.getItem(KUPKOLL_BLOOM_WEATHER_CACHE_KEY);
    const cache: Record<string, CachedWeatherData> = raw ? JSON.parse(raw) : {};

    const dateStr = date.toISOString().slice(0, 10);
    const now = Date.now();
    const cacheKey = `${coordinates.latitude.toFixed(4)}:${coordinates.longitude.toFixed(4)}:${dateStr}`;

    cache[cacheKey] = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      dateStr,
      shiftDays,
      weatherSnapshot,
      timestamp: now,
    };

    // Cleanup entries older than 48 hours to prevent bloat
    for (const [key, entry] of Object.entries(cache)) {
      if (now - entry.timestamp > 48 * 60 * 60 * 1000) {
        delete cache[key];
      }
    }

    await AsyncStorage.setItem(KUPKOLL_BLOOM_WEATHER_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache write errors
  }
}

export async function getLikelyBloomingPlantsNow(params: {
  userLatitude: number;
  coordinates?: Coordinates;
  date?: Date;
  minimumBloomProbability?: number;
  enableWeatherAdjustment?: boolean;
  fetchImplementation?: typeof fetch;
}): Promise<BloomPredictionResponse> {
  const date = params.date ?? new Date();
  const currentDayOfYear = getDayOfYear(date);
  const zone = getZoneFromLatitude(params.userLatitude, DEFAULT_OPTIONS);

  // 1. Build windows dynamically for user's exact latitude
  let windows: BloomWindow[] = [];
  for (const plant of beePlants) {
    const win = getWindowForLatitude(plant.scientificName, params.userLatitude, DEFAULT_OPTIONS);
    if (win) {
      windows.push(win);
    }
  }

  let shiftDays = 0;
  let currentWeather: InspectionWeatherSnapshot | undefined;
  let dragEff = 1.0;
  let dragLabel = 'Goda flygförutsättningar';

  const shouldApplyWeather = (params.enableWeatherAdjustment ?? true) && params.coordinates;

  if (shouldApplyWeather && params.coordinates) {
    // Try to load from persistent cache first
    const cached = await getCachedWeatherData(params.coordinates, date);

    if (cached) {
      shiftDays = cached.shiftDays;
      if (cached.weatherSnapshot) {
        currentWeather = cached.weatherSnapshot;
        const effResult = calculateDragEfficiency(currentWeather);
        dragEff = effResult.efficiency;
        dragLabel = effResult.label;
      }
    } else {
      // Fetch GDD temperature shift
      const shiftPromise = calculateTemperatureShiftDays(params.coordinates, date, params.fetchImplementation)
        .then((s) => s)
        .catch(() => 0);

      // Fetch current weather
      const weatherPromise = fetchInspectionWeather(params.coordinates, params.fetchImplementation)
        .then((w) => w)
        .catch(() => null);

      const [fetchedShift, fetchedWeather] = await Promise.all([shiftPromise, weatherPromise]);
      shiftDays = fetchedShift;
      if (fetchedWeather) {
        currentWeather = fetchedWeather;
        const effResult = calculateDragEfficiency(currentWeather);
        dragEff = effResult.efficiency;
        dragLabel = effResult.label;
      }

      // Save to cache
      await saveCachedWeatherData(params.coordinates, date, shiftDays, fetchedWeather);
    }
  }

  // 2. Apply GDD shift to the windows
  if (shiftDays !== 0) {
    windows = applyTemperatureShiftToWindows(windows, shiftDays);
  }

  // 3. Predict likely blooming plants
  const rawPredictions = getLikelyBloomingPlants(currentDayOfYear, params.userLatitude, windows, DEFAULT_OPTIONS);
  const minimumBloomProbability = params.minimumBloomProbability ?? 0.15;
  let predictions = rawPredictions.filter((prediction) => prediction.bloomProbability >= minimumBloomProbability);

  // 4. Adjust priority score based on weather flight efficiency
  if (currentWeather && dragEff !== 1.0) {
    predictions = predictions.map((prediction) => ({
      ...prediction,
      priorityScore: prediction.priorityScore * dragEff,
    }));
  }

  const sampleSize = predictions.reduce((sum, p) => sum + p.window.sampleSize, 0);

  return {
    predictions,
    zone,
    sampleSize,
    rejectedRows: 0,
    currentWeather,
    dragEfficiency: dragEff,
    dragEfficiencyLabel: dragLabel,
  };
}

export function clearBloomDatasetCache() {
  // Clear persistent AsyncStorage cache
  void AsyncStorage.removeItem(KUPKOLL_BLOOM_WEATHER_CACHE_KEY);
}
