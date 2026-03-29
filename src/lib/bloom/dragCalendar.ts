export type SwedenZone = 'south' | 'middle' | 'north';

export type PlantSeason = 'tidig_vår' | 'vår' | 'försommar' | 'sommar' | 'sensommar';

export type BeePlant = {
  scientificName: string;
  commonName: string;
  nectarScore: 0 | 1 | 2 | 3;
  pollenScore: 0 | 1 | 2 | 3;
  dragScore: 0 | 1 | 2 | 3 | 4 | 5;
  season: PlantSeason;
  notes?: string;
  isAgricultural?: boolean;
};

export type CsvObservation = {
  common_name?: string;
  scientific_name?: string;
  obs_year?: string | number;
  obs_doy?: string | number;
  latitude?: string | number;
  longitude?: string | number;
  phase_main_name_SE?: string;
  event_name_SE?: string;
};

export type BloomObservation = {
  scientificName: string;
  commonName: string;
  obsYear: number;
  obsDoy: number;
  latitude: number;
  longitude: number;
  zone: SwedenZone;
};

export type BloomWindow = {
  scientificName: string;
  commonName: string;
  zone: SwedenZone;
  earlyStartDoy: number;
  typicalStartDoy: number;
  peakDoy: number;
  typicalEndDoy: number;
  lateEndDoy: number;
  sampleSize: number;
  nectarScore: 0 | 1 | 2 | 3;
  pollenScore: 0 | 1 | 2 | 3;
  dragScore: 0 | 1 | 2 | 3 | 4 | 5;
  season: PlantSeason;
  notes?: string;
  isAgricultural?: boolean;
};

export type BloomStatus = 'snart' | 'nu' | 'på väg över';

export type BloomPrediction = {
  scientificName: string;
  commonName: string;
  zone: SwedenZone;
  bloomStatus: BloomStatus;
  bloomProbability: number;
  relevanceScore: number;
  window: BloomWindow;
  notes?: string;
  isAgricultural?: boolean;
};

export type DragCalendarOptions = {
  southMaxLat: number;
  middleMaxLat: number;
  minSamplesPerPlantZone: number;
  preStartBufferDays: number;
  enableAgriculturalFallbacks: boolean;
};

export const DEFAULT_OPTIONS: DragCalendarOptions = {
  southMaxLat: 58.5,
  middleMaxLat: 62.0,
  minSamplesPerPlantZone: 5,
  preStartBufferDays: 10,
  enableAgriculturalFallbacks: true,
};

export const beePlants: BeePlant[] = [
  { scientificName: 'Corylus avellana', commonName: 'Hassel', nectarScore: 0, pollenScore: 3, dragScore: 3, season: 'tidig_vår' },
  { scientificName: 'Alnus glutinosa', commonName: 'Klibbal', nectarScore: 0, pollenScore: 2, dragScore: 2, season: 'tidig_vår' },
  { scientificName: 'Alnus incana', commonName: 'Gråal', nectarScore: 0, pollenScore: 2, dragScore: 2, season: 'tidig_vår' },
  { scientificName: 'Tussilago farfara', commonName: 'Tussilago', nectarScore: 2, pollenScore: 2, dragScore: 4, season: 'tidig_vår' },
  { scientificName: 'Salix caprea', commonName: 'Sälg', nectarScore: 2, pollenScore: 3, dragScore: 5, season: 'tidig_vår' },
  { scientificName: 'Salix cinerea', commonName: 'Gråsälg', nectarScore: 2, pollenScore: 3, dragScore: 5, season: 'tidig_vår' },
  { scientificName: 'Salix aurita', commonName: 'Öronsälg', nectarScore: 2, pollenScore: 3, dragScore: 4, season: 'tidig_vår' },
  { scientificName: 'Galanthus nivalis', commonName: 'Snödroppe', nectarScore: 2, pollenScore: 2, dragScore: 2, season: 'tidig_vår' },
  { scientificName: 'Eranthis hyemalis', commonName: 'Vintergäck', nectarScore: 2, pollenScore: 2, dragScore: 2, season: 'tidig_vår' },

  { scientificName: 'Hepatica nobilis', commonName: 'Blåsippa', nectarScore: 1, pollenScore: 2, dragScore: 2, season: 'vår' },
  { scientificName: 'Anemone nemorosa', commonName: 'Vitsippa', nectarScore: 1, pollenScore: 2, dragScore: 2, season: 'vår' },
  { scientificName: 'Primula veris', commonName: 'Gullviva', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'vår' },
  { scientificName: 'Caltha palustris', commonName: 'Kabbeleka', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'vår' },
  { scientificName: 'Ranunculus ficaria', commonName: 'Svalört', nectarScore: 1, pollenScore: 2, dragScore: 2, season: 'vår' },
  { scientificName: 'Acer platanoides', commonName: 'Lönn', nectarScore: 3, pollenScore: 2, dragScore: 4, season: 'vår' },
  { scientificName: 'Prunus padus', commonName: 'Hägg', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'vår' },
  { scientificName: 'Prunus avium', commonName: 'Sötkörsbär', nectarScore: 3, pollenScore: 2, dragScore: 4, season: 'vår' },
  { scientificName: 'Prunus spinosa', commonName: 'Slån', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'vår' },
  { scientificName: 'Taraxacum officinale', commonName: 'Maskros', nectarScore: 2, pollenScore: 3, dragScore: 5, season: 'vår' },

  { scientificName: 'Vaccinium myrtillus', commonName: 'Blåbär', nectarScore: 2, pollenScore: 2, dragScore: 4, season: 'försommar' },
  { scientificName: 'Vaccinium vitis-idaea', commonName: 'Lingon', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'försommar' },
  { scientificName: 'Fragaria vesca', commonName: 'Smultron', nectarScore: 1, pollenScore: 2, dragScore: 2, season: 'försommar' },
  { scientificName: 'Anthriscus sylvestris', commonName: 'Hundkäx', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'försommar' },
  { scientificName: 'Trifolium pratense', commonName: 'Rödklöver', nectarScore: 3, pollenScore: 2, dragScore: 4, season: 'försommar', isAgricultural: true },
  { scientificName: 'Trifolium repens', commonName: 'Vitklöver', nectarScore: 3, pollenScore: 2, dragScore: 5, season: 'försommar', isAgricultural: true },
  { scientificName: 'Rubus idaeus', commonName: 'Hallon', nectarScore: 3, pollenScore: 2, dragScore: 5, season: 'försommar' },
  { scientificName: 'Sorbus aucuparia', commonName: 'Rönn', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'försommar' },

  { scientificName: 'Tilia cordata', commonName: 'Lind', nectarScore: 3, pollenScore: 2, dragScore: 5, season: 'sommar' },
  { scientificName: 'Tilia platyphyllos', commonName: 'Skogslind', nectarScore: 3, pollenScore: 2, dragScore: 5, season: 'sommar' },
  { scientificName: 'Epilobium angustifolium', commonName: 'Mjölke', nectarScore: 3, pollenScore: 2, dragScore: 5, season: 'sommar' },
  { scientificName: 'Filipendula ulmaria', commonName: 'Älggräs', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'sommar' },
  { scientificName: 'Leucanthemum vulgare', commonName: 'Prästkrage', nectarScore: 1, pollenScore: 2, dragScore: 2, season: 'sommar' },
  { scientificName: 'Campanula rotundifolia', commonName: 'Liten blåklocka', nectarScore: 2, pollenScore: 2, dragScore: 2, season: 'sommar' },
  { scientificName: 'Geranium sylvaticum', commonName: 'Midsommarblomster', nectarScore: 2, pollenScore: 2, dragScore: 2, season: 'sommar' },
  { scientificName: 'Vicia cracca', commonName: 'Kråkvicker', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'sommar' },
  { scientificName: 'Lotus corniculatus', commonName: 'Käringtand', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'sommar' },
  { scientificName: 'Thymus serpyllum', commonName: 'Backtimjan', nectarScore: 2, pollenScore: 1, dragScore: 2, season: 'sommar' },

  { scientificName: 'Calluna vulgaris', commonName: 'Ljung', nectarScore: 3, pollenScore: 2, dragScore: 5, season: 'sensommar' },
  { scientificName: 'Centaurea jacea', commonName: 'Rödklint', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'sensommar' },
  { scientificName: 'Cirsium arvense', commonName: 'Åkertistel', nectarScore: 3, pollenScore: 2, dragScore: 4, season: 'sensommar' },
  { scientificName: 'Solidago virgaurea', commonName: 'Gullris', nectarScore: 2, pollenScore: 2, dragScore: 3, season: 'sensommar' },

  {
    scientificName: 'Brassica napus',
    commonName: 'Raps',
    nectarScore: 3,
    pollenScore: 3,
    dragScore: 5,
    season: 'vår',
    isAgricultural: true,
    notes: 'Starkt regionalt drag i jordbrukslandskap',
  },
  {
    scientificName: 'Brassica rapa',
    commonName: 'Rybs',
    nectarScore: 3,
    pollenScore: 3,
    dragScore: 4,
    season: 'vår',
    isAgricultural: true,
  },
  {
    scientificName: 'Phacelia tanacetifolia',
    commonName: 'Honungsört',
    nectarScore: 3,
    pollenScore: 2,
    dragScore: 5,
    season: 'sommar',
    isAgricultural: true,
  },
];

const beePlantsByScientificName = new Map(beePlants.map((plant) => [normalizeScientificName(plant.scientificName), plant]));

const agriculturalFallbackWindows: BloomWindow[] = [
  createFallbackWindow('Brassica napus', 'Raps', 'south', 120, 128, 135, 145, 155, 3, 3, 5, 'vår', true, 'Fallback för jordbruksväxt'),
  createFallbackWindow('Brassica rapa', 'Rybs', 'south', 118, 125, 132, 142, 152, 3, 3, 4, 'vår', true, 'Fallback för jordbruksväxt'),
  createFallbackWindow(
    'Phacelia tanacetifolia',
    'Honungsört',
    'south',
    180,
    190,
    200,
    215,
    230,
    3,
    2,
    5,
    'sommar',
    true,
    'Fallback för jordbruksväxt',
  ),
  createFallbackWindow('Brassica napus', 'Raps', 'middle', 128, 136, 145, 155, 165, 3, 3, 5, 'vår', true, 'Fallback för jordbruksväxt'),
  createFallbackWindow('Brassica rapa', 'Rybs', 'middle', 126, 134, 142, 152, 162, 3, 3, 4, 'vår', true, 'Fallback för jordbruksväxt'),
  createFallbackWindow(
    'Phacelia tanacetifolia',
    'Honungsört',
    'middle',
    188,
    198,
    210,
    225,
    238,
    3,
    2,
    5,
    'sommar',
    true,
    'Fallback för jordbruksväxt',
  ),
  createFallbackWindow('Brassica napus', 'Raps', 'north', 142, 150, 160, 170, 180, 3, 3, 5, 'vår', true, 'Fallback för jordbruksväxt'),
  createFallbackWindow('Brassica rapa', 'Rybs', 'north', 138, 148, 156, 168, 178, 3, 3, 4, 'vår', true, 'Fallback för jordbruksväxt'),
  createFallbackWindow(
    'Phacelia tanacetifolia',
    'Honungsört',
    'north',
    198,
    208,
    220,
    235,
    248,
    3,
    2,
    5,
    'sommar',
    true,
    'Fallback för jordbruksväxt',
  ),
];

function createFallbackWindow(
  scientificName: string,
  commonName: string,
  zone: SwedenZone,
  earlyStartDoy: number,
  typicalStartDoy: number,
  peakDoy: number,
  typicalEndDoy: number,
  lateEndDoy: number,
  nectarScore: 0 | 1 | 2 | 3,
  pollenScore: 0 | 1 | 2 | 3,
  dragScore: 0 | 1 | 2 | 3 | 4 | 5,
  season: PlantSeason,
  isAgricultural: boolean,
  notes?: string,
): BloomWindow {
  return {
    scientificName,
    commonName,
    zone,
    earlyStartDoy,
    typicalStartDoy,
    peakDoy,
    typicalEndDoy,
    lateEndDoy,
    sampleSize: 0,
    nectarScore,
    pollenScore,
    dragScore,
    season,
    isAgricultural,
    notes,
  };
}

export function parseCsv(csvText: string): CsvObservation[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  const rows: CsvObservation[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = splitCsvLine(lines[index]);
    const row: Record<string, string> = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? '';
    });

    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

export function extractBloomObservations(
  csvRows: CsvObservation[],
  options: DragCalendarOptions = DEFAULT_OPTIONS,
): BloomObservation[] {
  const observations: BloomObservation[] = [];

  for (const row of csvRows) {
    if (!isStrictBloomingPhase(row)) {
      continue;
    }

    const scientificName = normalizeScientificName(row.scientific_name);
    const commonName = normalizeText(row.common_name);
    const obsYear = toNumber(row.obs_year);
    const obsDoy = toNumber(row.obs_doy);
    const latitude = toNumber(row.latitude);
    const longitude = toNumber(row.longitude);

    if (!scientificName || !commonName) {
      continue;
    }

    if (!isValidDoy(obsDoy)) {
      continue;
    }

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      continue;
    }

    if (!Number.isFinite(obsYear)) {
      continue;
    }

    observations.push({
      scientificName,
      commonName,
      obsYear,
      obsDoy,
      latitude,
      longitude,
      zone: getZoneFromLatitude(latitude, options),
    });
  }

  return observations;
}

export function isStrictBloomingPhase(row: CsvObservation): boolean {
  return normalizeText(row.phase_main_name_SE).toLowerCase() === 'blomning';
}

export function getZoneFromLatitude(
  latitude: number,
  options: DragCalendarOptions = DEFAULT_OPTIONS,
): SwedenZone {
  if (latitude <= options.southMaxLat) {
    return 'south';
  }

  if (latitude <= options.middleMaxLat) {
    return 'middle';
  }

  return 'north';
}

export function buildBloomWindows(
  observations: BloomObservation[],
  options: DragCalendarOptions = DEFAULT_OPTIONS,
): BloomWindow[] {
  const grouped = new Map<string, BloomObservation[]>();

  for (const observation of observations) {
    const plant = beePlantsByScientificName.get(normalizeScientificName(observation.scientificName));

    if (!plant) {
      continue;
    }

    const key = `${normalizeScientificName(observation.scientificName)}__${observation.zone}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)?.push(observation);
  }

  const windows: BloomWindow[] = [];

  for (const group of grouped.values()) {
    if (group.length === 0 || group.length < options.minSamplesPerPlantZone) {
      continue;
    }

    const plant = beePlantsByScientificName.get(normalizeScientificName(group[0].scientificName));

    if (!plant) {
      continue;
    }

    const zone = group[0].zone;
    const doys = group.map((item) => item.obsDoy).sort((left, right) => left - right);

    const earlyStartDoy = Math.round(percentile(doys, 0.2));
    const typicalStartDoy = Math.round(percentile(doys, 0.35));
    const peakDoy = Math.round(percentile(doys, 0.5));
    const typicalEndDoy = Math.round(percentile(doys, 0.7));
    const lateEndDoy = Math.round(percentile(doys, 0.85));

    windows.push({
      scientificName: plant.scientificName,
      commonName: plant.commonName,
      zone,
      earlyStartDoy,
      typicalStartDoy,
      peakDoy,
      typicalEndDoy,
      lateEndDoy,
      sampleSize: group.length,
      nectarScore: plant.nectarScore,
      pollenScore: plant.pollenScore,
      dragScore: plant.dragScore,
      season: plant.season,
      notes: plant.notes,
      isAgricultural: plant.isAgricultural,
    });
  }

  if (options.enableAgriculturalFallbacks) {
    appendAgriculturalFallbacks(windows);
  }

  return dedupeWindows(windows);
}

function appendAgriculturalFallbacks(windows: BloomWindow[]): void {
  const existingKeys = new Set(windows.map((window) => `${normalizeScientificName(window.scientificName)}__${window.zone}`));

  for (const fallback of agriculturalFallbackWindows) {
    const key = `${normalizeScientificName(fallback.scientificName)}__${fallback.zone}`;

    if (!existingKeys.has(key)) {
      windows.push(fallback);
    }
  }
}

function dedupeWindows(windows: BloomWindow[]): BloomWindow[] {
  const map = new Map<string, BloomWindow>();

  for (const window of windows) {
    const key = `${normalizeScientificName(window.scientificName)}__${window.zone}`;
    const existing = map.get(key);

    if (!existing || window.sampleSize > existing.sampleSize) {
      map.set(key, window);
    }
  }

  return Array.from(map.values());
}

export function getLikelyBloomingPlants(
  currentDayOfYear: number,
  userLatitude: number,
  windows: BloomWindow[],
  options: DragCalendarOptions = DEFAULT_OPTIONS,
): BloomPrediction[] {
  if (!isValidDoy(currentDayOfYear) || !isValidLatitude(userLatitude)) {
    return [];
  }

  const zone = getZoneFromLatitude(userLatitude, options);

  return windows
    .filter((window) => window.zone === zone)
    .map((window) => buildPrediction(currentDayOfYear, window, options))
    .filter((prediction): prediction is BloomPrediction => prediction !== null)
    .sort((left, right) => right.relevanceScore - left.relevanceScore);
}

function buildPrediction(
  currentDayOfYear: number,
  window: BloomWindow,
  options: DragCalendarOptions,
): BloomPrediction | null {
  const probability = calculateBloomProbability(currentDayOfYear, window, options);

  if (probability <= 0) {
    return null;
  }

  const bloomStatus = getBloomStatus(currentDayOfYear, window, options);
  const relevanceScore = calculateRelevanceScore(probability, window);

  return {
    scientificName: window.scientificName,
    commonName: window.commonName,
    zone: window.zone,
    bloomStatus,
    bloomProbability: round(probability, 3),
    relevanceScore: round(relevanceScore, 3),
    window,
    notes: window.notes,
    isAgricultural: window.isAgricultural,
  };
}

function calculateBloomProbability(
  currentDayOfYear: number,
  window: BloomWindow,
  options: DragCalendarOptions,
): number {
  const preStart = window.earlyStartDoy - options.preStartBufferDays;

  if (currentDayOfYear < preStart || currentDayOfYear > window.lateEndDoy) {
    return 0;
  }

  if (currentDayOfYear < window.earlyStartDoy) {
    return interpolate(currentDayOfYear, preStart, window.earlyStartDoy, 0.08, 0.25);
  }

  if (currentDayOfYear < window.typicalStartDoy) {
    return interpolate(currentDayOfYear, window.earlyStartDoy, window.typicalStartDoy, 0.25, 0.7);
  }

  if (currentDayOfYear <= window.peakDoy) {
    return interpolate(currentDayOfYear, window.typicalStartDoy, window.peakDoy, 0.7, 1.0);
  }

  if (currentDayOfYear <= window.typicalEndDoy) {
    return interpolate(currentDayOfYear, window.peakDoy, window.typicalEndDoy, 1.0, 0.7);
  }

  return interpolate(currentDayOfYear, window.typicalEndDoy, window.lateEndDoy, 0.7, 0.1);
}

function getBloomStatus(
  currentDayOfYear: number,
  window: BloomWindow,
  options: DragCalendarOptions,
): BloomStatus {
  const preStart = window.earlyStartDoy - options.preStartBufferDays;

  if (currentDayOfYear < window.typicalStartDoy && currentDayOfYear >= preStart) {
    return 'snart';
  }

  if (currentDayOfYear <= window.typicalEndDoy) {
    return 'nu';
  }

  return 'på väg över';
}

function calculateRelevanceScore(bloomProbability: number, window: BloomWindow): number {
  const plantWeight = window.dragScore * 2.0 + window.nectarScore * 1.2 + window.pollenScore * 0.9;
  const sampleWeight = Math.min(1.15, 1 + Math.log10(Math.max(1, window.sampleSize + 1)) * 0.08);

  return bloomProbability * plantWeight * sampleWeight;
}

export function buildDragCalendarFromCsv(
  csvText: string,
  options: DragCalendarOptions = DEFAULT_OPTIONS,
): BloomWindow[] {
  const rows = parseCsv(csvText);
  const bloomObservations = extractBloomObservations(rows, options);

  return buildBloomWindows(bloomObservations, options);
}

export function getDayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) {
    return Number.NaN;
  }

  if (sortedValues.length === 1) {
    return sortedValues[0];
  }

  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedValues[lower];
  }

  const weight = index - lower;

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function interpolate(value: number, x1: number, x2: number, y1: number, y2: number): number {
  if (x1 === x2) {
    return y2;
  }

  const ratio = (value - x1) / (x2 - x1);
  return y1 + ratio * (y2 - y1);
}

function normalizeScientificName(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, ' ').trim();
}

function normalizeText(value: unknown): string {
  return (value ?? '').toString().trim();
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return Number.NaN;
  }

  const normalized = value.replace(',', '.').trim();
  const numeric = Number(normalized);

  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

function isValidDoy(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= 366;
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}