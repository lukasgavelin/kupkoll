import { monthLabels, inspectionCadenceDaysBySeason, regionalOrder, regionalProfileMonthIndices, seasonProfiles, SwedishRegion } from '@/data/seasonModel';
import type { InspectionWeatherSnapshot } from '@/lib/weather';
import { Apiary, Hive, Inspection, SeasonLabel, Task } from '@/types/domain';

export type SeasonStatus = {
  season: SeasonLabel;
  monthLabel: string;
  phaseLabel: string;
  summary: string;
  focusItems: string[];
  timingLabel: string;
  weatherSignalLabel?: string;
  regionLabel: string;
  locationLabel?: string;
  inspectionCadenceDays: number;
  sourceLabel: string;
};

const northKeywords = ['norrbotten', 'västerbotten', 'jämtland', 'västernorrland', 'gävleborg', 'kiruna', 'umeå', 'luleå', 'skellefteå', 'sundsvall', 'östersund'];
const southKeywords = ['skåne', 'blekinge', 'halland', 'kalmar', 'öland', 'malmö', 'lund', 'helsingborg', 'ystad', 'trelleborg', 'växjö'];

function getSeasonProfileIndex(region: SwedishRegion, monthIndex: number) {
  const resolvedRegion = region === 'Sverige' ? 'Mellansverige' : region;

  return regionalProfileMonthIndices[resolvedRegion][monthIndex] ?? monthIndex;
}

function clampSeasonProfileIndex(value: number) {
  return Math.max(0, Math.min(seasonProfiles.length - 1, value));
}

function getWeatherSeasonOffset(date: Date, weather?: Pick<InspectionWeatherSnapshot, 'temperatureC' | 'condition' | 'wind'>) {
  if (!weather) {
    return 0;
  }

  const monthIndex = date.getMonth();
  const dayOfMonth = date.getDate();
  const coldWeather = weather.temperatureC <= 3 || weather.condition === 'Regn' || weather.wind === 'Blåsigt';
  const warmWeather = weather.temperatureC >= 16 && weather.condition !== 'Regn' && weather.wind !== 'Blåsigt';

  if (monthIndex >= 2 && monthIndex <= 4) {
    if (dayOfMonth <= 10 && coldWeather) {
      return -1;
    }

    if (dayOfMonth >= 20 && warmWeather) {
      return 1;
    }
  }

  if (monthIndex >= 7 && monthIndex <= 9) {
    if (dayOfMonth <= 10 && warmWeather) {
      return -1;
    }

    if (dayOfMonth >= 20 && coldWeather) {
      return 1;
    }
  }

  return 0;
}

function getWeatherAwareSeasonProfileIndex(region: SwedishRegion, date: Date, weather?: Pick<InspectionWeatherSnapshot, 'temperatureC' | 'condition' | 'wind'>) {
  const baseIndex = getSeasonProfileIndex(region, date.getMonth());

  return clampSeasonProfileIndex(baseIndex + getWeatherSeasonOffset(date, weather));
}

function getSeasonMonthsForRegion(season: SeasonLabel, region: SwedishRegion) {
  if (region === 'Sverige') {
    const months = new Set<number>();

    for (const regionalKey of regionalOrder) {
      regionalProfileMonthIndices[regionalKey].forEach((profileIndex, monthIndex) => {
        if (seasonProfiles[profileIndex].season === season) {
          months.add(monthIndex);
        }
      });
    }

    return [...months].sort((left, right) => left - right);
  }

  return regionalProfileMonthIndices[region]
    .map((profileIndex, monthIndex) => ({ profileIndex, monthIndex }))
    .filter((item) => seasonProfiles[item.profileIndex].season === season)
    .map((item) => item.monthIndex);
}

function formatMonthRange(months: number[]) {
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];

  if (firstMonth === undefined || lastMonth === undefined) {
    return 'olika delar av året';
  }

  if (firstMonth === lastMonth) {
    return monthLabels[firstMonth];
  }

  return `${monthLabels[firstMonth]} till ${monthLabels[lastMonth]}`;
}

export function getSeasonTimingLabel(season: SeasonLabel, region: SwedishRegion) {
  const range = formatMonthRange(getSeasonMonthsForRegion(season, region));

  if (region === 'Sverige') {
    return `Brukar infalla mellan ${range}, beroende på väder och läge.`;
  }

  return `Brukar oftast infalla mellan ${range} i ${region.toLowerCase()}.`;
}

function formatWeatherSignal(weather: Pick<InspectionWeatherSnapshot, 'temperatureC' | 'condition' | 'wind' | 'provider'>) {
  return `${weather.provider} visar ${weather.temperatureC.toFixed(1).replace('.', ',')} °C, ${weather.condition.toLowerCase()} och ${weather.wind.toLowerCase()}.`;
}

function getWeatherSignalLabel(
  season: SeasonLabel,
  date: Date,
  region: SwedishRegion,
  weather?: Pick<InspectionWeatherSnapshot, 'temperatureC' | 'condition' | 'wind' | 'provider'>,
) {
  if (!weather) {
    return undefined;
  }

  const offset = getWeatherSeasonOffset(date, weather);
  const prefix = formatWeatherSignal(weather);

  if (offset > 0) {
    return `${prefix} Det talar för att säsongen ligger något före normal timing i ${region.toLowerCase()}.`;
  }

  if (offset < 0) {
    return `${prefix} Det talar för att utvecklingen ligger något efter normal timing just nu.`;
  }

  if (season === 'Vårutveckling' && weather.temperatureC < 10) {
    return `${prefix} Håll vårgenomgångarna korta tills flygvädret blir stabilare.`;
  }

  if ((season === 'Svärmperiod' || season === 'Drag och skattning') && weather.temperatureC >= 16 && weather.condition !== 'Regn') {
    return `${prefix} Förhållandena talar för god flygaktivitet och snabb utveckling i samhället.`;
  }

  return prefix;
}

export function getApiaryRegion(apiary?: Apiary): SwedishRegion {
  if (!apiary) {
    return 'Sverige';
  }

  if (apiary.coordinates) {
    if (apiary.coordinates.latitude >= 62) {
      return 'Norra Sverige';
    }

    if (apiary.coordinates.latitude < 57.5) {
      return 'Södra Sverige';
    }

    return 'Mellansverige';
  }

  const location = apiary.location.toLowerCase();

  if (northKeywords.some((keyword) => location.includes(keyword))) {
    return 'Norra Sverige';
  }

  if (southKeywords.some((keyword) => location.includes(keyword))) {
    return 'Södra Sverige';
  }

  return location.trim() ? 'Mellansverige' : 'Sverige';
}

function getLocationLabel(apiary?: Apiary) {
  if (!apiary) {
    return undefined;
  }

  return apiary.location.trim() || apiary.name;
}

export function getPrimaryApiary(apiaries: Apiary[]) {
  return apiaries.find((apiary) => apiary.coordinates) ?? apiaries[0];
}

export function getApiarySeasonLabel(apiary: Apiary | undefined, date = new Date()): SeasonLabel {
  const region = getApiaryRegion(apiary);
  const monthIndex = getSeasonProfileIndex(region, date.getMonth());

  return seasonProfiles[monthIndex].season;
}

export function getRecommendedInspectionCadenceDays(season: SeasonLabel, region: SwedishRegion) {
  return inspectionCadenceDaysBySeason[season][region];
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

export function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function getSeasonLabel(date = new Date()): SeasonLabel {
  return seasonProfiles[getSeasonProfileIndex('Mellansverige', date.getMonth())].season;
}

export function getSeasonStatus(
  date = new Date(),
  apiaries: Apiary[] = [],
  weather?: Pick<InspectionWeatherSnapshot, 'temperatureC' | 'condition' | 'wind' | 'provider'>,
): SeasonStatus {
  const primaryApiary = getPrimaryApiary(apiaries);
  const region = getApiaryRegion(primaryApiary);
  const monthIndex = getWeatherAwareSeasonProfileIndex(region, date, weather);
  const profile = seasonProfiles[monthIndex];
  const monthLabel = new Intl.DateTimeFormat('sv-SE', {
    month: 'long',
  }).format(date);
  const season = profile.season;

  return {
    ...profile,
    season,
    monthLabel: `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}`,
    timingLabel: getSeasonTimingLabel(season, region),
    weatherSignalLabel: getWeatherSignalLabel(season, date, region, weather),
    regionLabel: region,
    locationLabel: getLocationLabel(primaryApiary),
    inspectionCadenceDays: getRecommendedInspectionCadenceDays(season, region),
    sourceLabel: 'Anpassat efter tid på året, bigårdens läge i Sverige och appens säsongslogik.',
  };
}

export function getLatestInspectionMap(inspections: Inspection[]) {
  return inspections.reduce<Record<string, Inspection>>((map, inspection) => {
    const current = map[inspection.hiveId];

    if (!current || new Date(inspection.performedAt) > new Date(current.performedAt)) {
      map[inspection.hiveId] = inspection;
    }

    return map;
  }, {});
}

export function getUpcomingTasks(tasks: Task[]) {
  return [...tasks]
    .filter((task) => !task.completed)
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());
}

export function getDashboardStats(params: {
  apiaries: Apiary[];
  hives: Hive[];
  inspections: Inspection[];
  tasks: Task[];
  criticalCount: number;
}) {
  const latestInspections = [...params.inspections]
    .sort((left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime())
    .slice(0, 4);

  return {
    hiveCount: params.hives.length,
    apiaryCount: params.apiaries.length,
    upcomingTaskCount: getUpcomingTasks(params.tasks).length,
    criticalCount: params.criticalCount,
    latestInspections,
  };
}