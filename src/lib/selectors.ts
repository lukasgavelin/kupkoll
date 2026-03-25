import { Apiary, Hive, Inspection, SeasonLabel, Task } from '@/types/domain';

export type SeasonStatus = {
  season: SeasonLabel;
  monthLabel: string;
  phaseLabel: string;
  summary: string;
  focusItems: string[];
  regionLabel: string;
  locationLabel?: string;
  inspectionCadenceDays: number;
  sourceLabel: string;
};

export type SwedishRegion = 'Södra Sverige' | 'Mellansverige' | 'Norra Sverige' | 'Sverige';

const seasonProfiles: Array<Omit<SeasonStatus, 'monthLabel' | 'regionLabel' | 'locationLabel' | 'inspectionCadenceDays' | 'sourceLabel'>> = [
  {
    season: 'Vintertillsyn',
    phaseLabel: 'midvinter',
    summary: 'Samhällena sitter stilla och ska störas så lite som möjligt.',
    focusItems: ['lyssna efter liv vid mildväder', 'håll flustren fria från is och skräp'],
  },
  {
    season: 'Vintertillsyn',
    phaseLabel: 'sen vinter',
    summary: 'Foderläget blir viktigare när vinterklotet börjar röra sig mer.',
    focusItems: ['bedöm tyngd och foderreserv', 'förbered tidiga vårinsatser'],
  },
  {
    season: 'Vårutveckling',
    phaseLabel: 'marsarbete',
    summary: 'Vädret är förrädiskt och vårundersökningen görs först när vädret verkligen tillåter det.',
    focusItems: ['gör vårundersökning om vädret tillåter', 'stödfodra eller drivfodra vid behov', 'kontrollera varroanedfall på vinterns bottnar'],
  },
  {
    season: 'Vårutveckling',
    phaseLabel: 'vårstart',
    summary: 'Yngelsättningen tar fart och vårkontrollen ska fortfarande hållas kort och praktisk.',
    focusItems: ['följ yngelsättning och drottningläge', 'säkra foder om draget hackar', 'håll vårkollen kort om det fortfarande är kyligt'],
  },
  {
    season: 'Svärmperiod',
    phaseLabel: 'försommar',
    summary: 'Försommarens starka samhällen behöver plats i tid och svärmtrycket måste kontrolleras.',
    focusItems: ['sätt första skattlådan', 'kontrollera svärmtryck och svärmceller', 'gör avläggare vid behov'],
  },
  {
    season: 'Svärmperiod',
    phaseLabel: 'junipress',
    summary: 'Utökning, andra skattlådan och tät svärmkontroll dominerar arbetet i bigården.',
    focusItems: ['bedöm behov av extra skattlåda', 'kontrollera svärmtryck och fånga svärm', 'stödfodra avläggare'],
  },
  {
    season: 'Drag och skattning',
    phaseLabel: 'högsommar',
    summary: 'Nu går fokus över till skattning, slungning och att hålla avläggare på rätt spår.',
    focusItems: ['skatta och slunga första honungen', 'kontrollera avläggare och parad drottning', 'ersätt skattade lådor med tomma ramar eller mellanväggar'],
  },
  {
    season: 'Drag och skattning',
    phaseLabel: 'sensommar',
    summary: 'Sensommaren växlar mellan drag, andra skörden och ökande fokus på bihälsa.',
    focusItems: ['planera sensommarskattning', 'följ varroaläget tätare', 'håll koll på foder när draget avtar'],
  },
  {
    season: 'Invintring',
    phaseLabel: 'septemberarbete',
    summary: 'Slutskattning, invintring och varroastrategi ska falla på plats innan kylan tar över.',
    focusItems: ['invintra med minst 16 kilo vinterfoder', 'förena svaga samhällen och säkra äggläggande drottning', 'varroabekämpa med tymol vid behov'],
  },
  {
    season: 'Invintring',
    phaseLabel: 'höststängning',
    summary: 'Samhällena ska gå lugnt mot vinter med rätt tyngd och så lite störning som möjligt.',
    focusItems: ['bekräfta vinterfoder', 'minska onödiga öppningar'],
  },
  {
    season: 'Vinterro',
    phaseLabel: 'förvinter',
    summary: 'Biodlingen går in i lugnare takt och tillsynen blir mer förebyggande än aktiv.',
    focusItems: ['kontrollera vindskydd och fukt', 'sammanfatta säsongen inför nästa år'],
  },
  {
    season: 'Vinterro',
    phaseLabel: 'vinterro',
    summary: 'Kuporna ska stå stabilt medan du planerar nästa säsong med så lite störning som möjligt.',
    focusItems: ['håll tillsynen diskret', 'förbered material och plan för våren'],
  },
];

const northKeywords = ['norrbotten', 'västerbotten', 'jämtland', 'västernorrland', 'gävleborg', 'kiruna', 'umeå', 'luleå', 'skellefteå', 'sundsvall', 'östersund'];
const southKeywords = ['skåne', 'blekinge', 'halland', 'kalmar', 'öland', 'malmö', 'lund', 'helsingborg', 'ystad', 'trelleborg', 'växjö'];

function getRegionOffset(monthIndex: number, region: SwedishRegion) {
  if (region === 'Södra Sverige' && monthIndex >= 2 && monthIndex <= 5) {
    return 1;
  }

  if (region === 'Norra Sverige' && monthIndex >= 2 && monthIndex <= 6) {
    return -1;
  }

  return 0;
}

function clampMonthIndex(monthIndex: number) {
  return Math.max(0, Math.min(11, monthIndex));
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
  const monthIndex = clampMonthIndex(date.getMonth() + getRegionOffset(date.getMonth(), region));

  return seasonProfiles[monthIndex].season;
}

export function getRecommendedInspectionCadenceDays(season: SeasonLabel, region: SwedishRegion) {
  if (season === 'Svärmperiod') {
    return region === 'Norra Sverige' ? 10 : 7;
  }

  if (season === 'Vårutveckling') {
    return region === 'Södra Sverige' ? 10 : region === 'Norra Sverige' ? 14 : 12;
  }

  if (season === 'Drag och skattning') {
    return region === 'Norra Sverige' ? 12 : 10;
  }

  if (season === 'Invintring') {
    return 12;
  }

  return 30;
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
  const month = date.getMonth() + 1;

  if (month <= 2) {
    return 'Vintertillsyn';
  }
  if (month <= 4) {
    return 'Vårutveckling';
  }
  if (month <= 6) {
    return 'Svärmperiod';
  }
  if (month <= 8) {
    return 'Drag och skattning';
  }
  if (month <= 10) {
    return 'Invintring';
  }
  return 'Vinterro';
}

export function getSeasonStatus(date = new Date(), apiaries: Apiary[] = []): SeasonStatus {
  const primaryApiary = getPrimaryApiary(apiaries);
  const region = getApiaryRegion(primaryApiary);
  const effectiveMonthIndex = clampMonthIndex(date.getMonth() + getRegionOffset(date.getMonth(), region));
  const monthIndex = effectiveMonthIndex;
  const profile = seasonProfiles[monthIndex];
  const monthLabel = new Intl.DateTimeFormat('sv-SE', {
    month: 'long',
  }).format(date);
  const season = profile.season;

  return {
    ...profile,
    season,
    monthLabel: `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}`,
    regionLabel: region,
    locationLabel: getLocationLabel(primaryApiary),
    inspectionCadenceDays: getRecommendedInspectionCadenceDays(season, region),
    sourceLabel: 'Anpassat efter Allt om biodlings säsongskalender och bigårdens läge i Sverige.',
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