import { monthLabels, inspectionCadenceDaysBySeason, regionalOrder, regionalProfileMonthIndices, seasonProfiles, SwedishRegion } from '@/data/seasonModel';
import { Apiary, ApiaryZone, Hive, Inspection, SeasonLabel, Task } from '@/types/domain';

export type SeasonStatus = {
  season: SeasonLabel;
  monthLabel: string;
  phaseLabel: string;
  summary: string;
  focusItems: string[];
  watchItems: string[];
  timingLabel: string;
  regionLabel: string;
  locationLabel?: string;
  inspectionCadenceDays: number;
  sourceLabel: string;
  zoneLabel: ApiaryZone;
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
    return `Brukar infalla mellan ${range}, beroende på var i landet du är.`;
  }

  return `Brukar oftast infalla mellan ${range} i ${region}.`;
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

export function getZoneFromRegion(region: SwedishRegion): ApiaryZone {
  if (region === 'Norra Sverige') {
    return 'nord';
  }

  if (region === 'Södra Sverige') {
    return 'syd';
  }

  return 'mellan';
}

function formatMunicipalityLabel(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.toLowerCase().endsWith(' kommun')) {
    return trimmed;
  }

  return `${trimmed} kommun`;
}

function formatCountyLabel(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.toLowerCase().endsWith(' län')) {
    return trimmed;
  }

  return `${trimmed} län`;
}

export function getApiaryDisplayLocation(apiary?: Apiary) {
  if (!apiary) {
    return undefined;
  }

  const hasTrustedMunicipality = apiary.locationDetails?.source === 'auto' || Boolean(apiary.locationDetails?.county?.trim()) || Boolean(apiary.coordinates);
  const municipality = hasTrustedMunicipality ? formatMunicipalityLabel(apiary.locationDetails?.municipality) : undefined;
  const county = formatCountyLabel(apiary.locationDetails?.county);
  const locality = apiary.locationDetails?.locality?.trim();
  const fallbackLocation = apiary.location.trim();

  if (municipality && county) {
    return `${municipality}, ${county}`;
  }

  if (municipality) {
    return municipality;
  }

  if (locality && county) {
    return `${locality}, ${county}`;
  }

  if (locality) {
    return locality;
  }

  return fallbackLocation || apiary.name;
}

export function getApiaryMunicipalityLabel(apiary?: Apiary) {
  if (!apiary) {
    return undefined;
  }

  const hasTrustedMunicipality = apiary.locationDetails?.source === 'auto' || Boolean(apiary.locationDetails?.county?.trim()) || Boolean(apiary.coordinates);
  const municipality = hasTrustedMunicipality ? formatMunicipalityLabel(apiary.locationDetails?.municipality) : undefined;

  return municipality;
}

function getLocationLabel(apiary?: Apiary) {
  return getApiaryMunicipalityLabel(apiary) ?? getApiaryDisplayLocation(apiary);
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
): SeasonStatus {
  const primaryApiary = getPrimaryApiary(apiaries);
  const region = getApiaryRegion(primaryApiary);
  const monthIndex = clampSeasonProfileIndex(getSeasonProfileIndex(region, date.getMonth()));
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
    regionLabel: region,
    locationLabel: getLocationLabel(primaryApiary),
    inspectionCadenceDays: getRecommendedInspectionCadenceDays(season, region),
    sourceLabel: 'Bygger på Biodlaråret, tid på året och bigårdens läge i Sverige.',
    zoneLabel: getZoneFromRegion(region),
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