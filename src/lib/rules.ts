import { Apiary, Hive, HiveStrength, Inspection, Recommendation, RecommendationKind, RecommendationSeverity, SeasonLabel, Task } from '@/types/domain';
import { getApiaryRegion, getApiarySeasonLabel, getLatestInspectionMap, getRecommendedInspectionCadenceDays } from '@/lib/selectors';

type DerivedResult = {
  recommendations: Recommendation[];
  tasks: Task[];
};

type RuleContext = {
  apiary?: Apiary;
  hive: Hive;
  inspection: Inspection;
  inspectionHistory: Inspection[];
  now: Date;
  season: SeasonLabel;
  daysSinceLastInspection: number;
  regionLabel: string;
  inspectionCadenceDays: number;
};

type DecisionRule = {
  id: string;
  shouldApply: (context: RuleContext) => boolean;
  buildRecommendation: (context: RuleContext) => Recommendation;
  buildTask?: (context: RuleContext) => Task;
};

function buildTaskId(prefix: string, hiveId: string) {
  return `${prefix}-${hiveId}`;
}

function taskPriorityFromStrength(strength: HiveStrength): Task['priority'] {
  return strength === 'Svagt' ? 'Hög' : 'Medel';
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function differenceInDays(later: Date, earlier: Date) {
  return Math.floor((later.getTime() - earlier.getTime()) / (24 * 60 * 60 * 1000));
}

function getInspectionHistoryMap(inspections: Inspection[]) {
  return inspections.reduce<Record<string, Inspection[]>>((map, inspection) => {
    if (!map[inspection.hiveId]) {
      map[inspection.hiveId] = [];
    }

    map[inspection.hiveId].push(inspection);
    return map;
  }, {});
}

function getRecentInspections(history: Inspection[], count: number) {
  return [...history]
    .sort((left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime())
    .slice(0, count);
}

function getVarroaRank(level: Inspection['varroaLevel']) {
  if (level === 'Ej kontrollerad') {
    return 0;
  }
  if (level === 'Låg') {
    return 1;
  }
  if (level === 'Förhöjd') {
    return 2;
  }
  return 3;
}

function createRecommendation(context: RuleContext, params: { id: string; title: string; detail: string; severity: RecommendationSeverity; kind: RecommendationKind }): Recommendation {
  return {
    id: `rec-${params.id}-${context.hive.id}`,
    hiveId: context.hive.id,
    title: params.title,
    detail: params.detail,
    severity: params.severity,
    kind: params.kind,
    season: context.season,
    createdAt: context.now.toISOString(),
  };
}

function createTask(
  context: RuleContext,
  params: {
    id: string;
    title: string;
    description: string;
    priority: Task['priority'];
    dueInDays: number;
  },
): Task {
  return {
    id: buildTaskId(`task-${params.id}`, context.hive.id),
    title: params.title,
    description: params.description,
    dueDate: addDays(context.now, params.dueInDays),
    hiveId: context.hive.id,
    priority: params.priority,
    source: 'Beslutsstöd',
    completed: false,
  };
}

function getVarroaSeverity(inspection: Inspection): RecommendationSeverity {
  return inspection.varroaLevel === 'Hög' ? 'critical' : 'warning';
}

function getVarroaPriority(inspection: Inspection): Task['priority'] {
  return inspection.varroaLevel === 'Hög' ? 'Hög' : 'Medel';
}

function getVarroaDueInDays(inspection: Inspection) {
  return inspection.varroaLevel === 'Hög' ? 1 : 4;
}

function hasPoorInspectionWeather(inspection: Inspection) {
  const temperature = inspection.weather?.temperatureC;

  return (
    (temperature !== undefined && temperature < 12) ||
    inspection.weather?.wind === 'Blåsigt' ||
    inspection.weather?.condition === 'Regn'
  );
}

function hasGoodInspectionWeather(inspection: Inspection) {
  const temperature = inspection.weather?.temperatureC;

  if (temperature === undefined) {
    return true;
  }

  return temperature >= 14 && inspection.weather?.wind !== 'Blåsigt' && inspection.weather?.condition !== 'Regn';
}

const decisionRules: DecisionRule[] = [
  {
    id: 'queen-recovered',
    shouldApply: ({ inspectionHistory, inspection }) => {
      const recent = getRecentInspections(inspectionHistory, 3);

      return recent.length === 3 && inspection.id === recent[0].id && recent[0].queenSeen && !recent[1].queenSeen && !recent[2].queenSeen;
    },
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'queen-recovered',
        title: 'Drottning sedd igen',
        detail: 'De senaste genomgångarna visade osäkerhet, men drottningen är nu sedd igen. Läget kan vara mer stabilt och extra åtgärd verkar inte nödvändig just nu.',
        severity: 'info',
        kind: 'status',
      }),
  },
  {
    id: 'queen-missing-trend',
    shouldApply: ({ inspectionHistory }) => {
      const recent = getRecentInspections(inspectionHistory, 3);

      return recent.length === 3 && recent.every((item) => !item.queenSeen);
    },
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'queen-trend',
        title: 'Möjligt drottningproblem',
        detail: 'Drottning har inte observerats vid tre genomgångar i rad. Det kan vara bra att kontrollera yngelbild, svärmceller och om samhället visar tecken på drottninglöshet.',
        severity: 'warning',
        kind: 'alert',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'queen-trend',
        title: 'Överväg fördjupad drottningkontroll',
        description: `Det kan vara bra att gå igenom ${context.hive.name} med fokus på yngelbild, svärmceller och möjliga tecken på drottninglöshet efter tre genomgångar utan sedd drottning.`,
        dueInDays: 2,
        priority: 'Hög',
      }),
  },
  {
    id: 'varroa-pressure',
    shouldApply: ({ inspection }) => inspection.varroaLevel === 'Förhöjd' || inspection.varroaLevel === 'Hög',
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'varroa',
        title: context.inspection.varroaLevel === 'Hög' ? 'Möjligen hög varroabelastning' : 'Möjligen förhöjt varroatryck',
        detail:
          context.inspection.varroaLevel === 'Hög'
            ? 'Varroaläget kan vara högt och kan behöva hanteras skyndsamt. Bekräfta gärna nivån med mätning, använd godkänd metod enligt etikett och följ upp effekten med ny kontroll.'
            : 'Varroaläget kan vara på väg upp. Det kan vara klokt att följa upp med ny mätning och planera säsongsanpassad åtgärd i tid.',
        severity: getVarroaSeverity(context.inspection),
        kind: 'alert',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'varroa',
        title: 'Överväg varroaåtgärd',
        description:
          context.inspection.varroaLevel === 'Hög'
            ? `Det kan vara klokt att prioritera varroaåtgärd i ${context.hive.name}, bekräfta belastningen med vald kontrollmetod och planera uppföljande mätning efter genomförd insats.`
            : `Det kan vara bra att följa upp varroaläget i ${context.hive.name} med ny kontroll och planerad åtgärd innan nästa genomgång.`,
        dueInDays: getVarroaDueInDays(context.inspection),
        priority: getVarroaPriority(context.inspection),
      }),
  },
  {
    id: 'varroa-trend',
    shouldApply: ({ inspectionHistory, inspection }) => {
      const recent = getRecentInspections(inspectionHistory, 3);

      if (recent.length < 3 || inspection.varroaLevel === 'Hög') {
        return false;
      }

      const ordered = [...recent].reverse();
      const ranks = ordered.map((item) => getVarroaRank(item.varroaLevel));
      const nonDecreasing = ranks.every((rank, index) => index === 0 || rank >= ranks[index - 1]);

      return nonDecreasing && ranks[ranks.length - 1] >= 2 && ranks[ranks.length - 1] > ranks[0];
    },
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'varroa-trend',
        title: 'Möjlig varroa-trend uppåt',
        detail: 'Varroaläget ser ut att ha stigit över de senaste genomgångarna. Överväg behandling inom 1-2 veckor med medelval som minskar resistensrisk och följ upp med ny mätning.',
        severity: 'warning',
        kind: 'alert',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'varroa-trend',
        title: 'Överväg behandling mot varroa',
        description: `Varroan i ${context.hive.name} ser ut att visa en stigande trend. Det kan vara klokt att lägga in behandling eller tätt återbesök inom de närmaste 1-2 veckorna.`,
        dueInDays: 10,
        priority: 'Hög',
      }),
  },
  {
    id: 'swarm-risk',
    shouldApply: ({ inspection }) => inspection.queenCells || inspection.swarmSigns,
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'swarm',
        title: 'Förhöjd svärmrisk just nu',
        detail: 'Drottningceller eller tydliga svärmtecken noterades. Det kan vara bra att följa upp snabbt och bedöma avläggare, skattlåda eller annan svärmförebyggande åtgärd.',
        severity: 'critical',
        kind: 'alert',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'swarm',
        title: 'Överväg snabb svärmkontroll',
        description: `Det kan vara bra att gå igenom ${context.hive.name} igen inom några dagar och bedöma om samhället kan behöva avläggare, skattlåda eller brytning av svärmceller.`,
        dueInDays: 2,
        priority: 'Hög',
      }),
  },
  {
    id: 'seasonal-swarm-risk',
    shouldApply: ({ season, hive, inspection }) =>
      season === 'Svärmperiod' &&
      hive.strength === 'Starkt' &&
      inspection.eggsSeen &&
      !inspection.queenCells &&
      !inspection.swarmSigns &&
      hasGoodInspectionWeather(inspection),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'seasonal-swarm',
        title: 'Möjlig svärmperiod',
        detail: 'Det verkar vara svärmperiod och samhället ser starkt ut med äggläggning igång. Det kan vara bra att kontrollera svärmceller, utrymme och om avläggare kan bli aktuell.',
        severity: 'warning',
        kind: 'seasonal',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'seasonal-swarm',
        title: 'Överväg förebyggande svärmkontroll',
        description: `Det kan vara bra att kontrollera ${context.hive.name} för svärmceller, utrymmesbehov och eventuell avläggare medan svärmtrycket byggs upp.`,
        dueInDays: 3,
        priority: 'Medel',
      }),
  },
  {
    id: 'follow-up-in-better-weather',
    shouldApply: ({ season, inspection }) =>
      (season === 'Vårutveckling' || season === 'Svärmperiod' || season === 'Drag och skattning') &&
      !inspection.actionNeeded &&
      hasPoorInspectionWeather(inspection),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'weather-follow-up',
        title: 'Följ upp i bättre flygväder',
        detail: 'Senaste genomgången gjordes i kyligt, regnigt eller blåsigt väder. En kort uppföljning när bina flyger bättre kan ge en säkrare bild av aktivitet och drag.',
        severity: 'info',
        kind: 'reminder',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'weather-follow-up',
        title: 'Överväg väderanpassad uppföljning',
        description: `Det kan vara bra att lägga in en kort uppföljning av ${context.hive.name} när vädret är torrare, varmare och lugnare så att flygaktiviteten går att bedöma bättre.`,
        dueInDays: 2,
        priority: 'Medel',
      }),
  },
  {
    id: 'weak-colony',
    shouldApply: ({ hive, inspection }) => hive.strength === 'Svagt' || (!inspection.openBrood && !inspection.cappedBrood) || (!inspection.honey && !inspection.pollen),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'weak',
        title: 'Samhället verkar svagt',
        detail: 'Lite yngel, svag styrka eller tunt foderläge kan tyda på att samhället kan behöva tätare uppföljning, stödfodring eller förstärkning.',
        severity: 'warning',
        kind: 'alert',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'weak',
        title: 'Överväg stödåtgärd',
        description: `Det kan vara klokt att bedöma om ${context.hive.name} kan behöva stödfodring, utjämning med yngelram eller annan stödåtgärd för att komma i balans.`,
        dueInDays: 4,
        priority: taskPriorityFromStrength(context.hive.strength),
      }),
  },
  {
    id: 'inactive-hive',
    shouldApply: ({ daysSinceLastInspection, inspectionCadenceDays }) => daysSinceLastInspection >= inspectionCadenceDays,
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'inactive-hive',
        title: 'Kan vara dags för ny genomgång',
        detail: `Ingen genomgång har registrerats på ${context.daysSinceLastInspection} dagar. För ${context.regionLabel.toLowerCase()} i det här säsongsläget kan det ofta vara rimligt att följa kupan ungefär var ${context.inspectionCadenceDays}:e dag.`,
        severity: 'info',
        kind: 'reminder',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'inactive-hive',
        title: 'Överväg ny genomgång',
        description: `${context.hive.name} följs just nu relativt glest i förhållande till säsong och region. Det kan vara bra att lägga in en ny genomgång för att få uppdaterat läge.`,
        dueInDays: 1,
        priority: 'Medel',
      }),
  },
  {
    id: 'super-needed',
    shouldApply: ({ hive, inspection, season }) =>
      hive.strength === 'Starkt' &&
      inspection.honey &&
      (inspection.openBrood || inspection.cappedBrood) &&
      !inspection.actionNeeded &&
      hasGoodInspectionWeather(inspection) &&
      (season === 'Vårutveckling' || season === 'Svärmperiod' || season === 'Drag och skattning'),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'super',
        title: 'Överväg skattlåda',
        detail: 'Samhället ser starkt ut, med gott drag och produktion. Det kan vara läge att förbereda skattlåda innan trängsel i yngelrummet ökar svärmtrycket.',
        severity: 'info',
        kind: 'seasonal',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'super',
        title: 'Överväg skattlåda',
        description: `Det kan vara klokt att säkerställa att ${context.hive.name} snabbt kan få skattlåda eller mer utrymme om draget fortsätter öka.`,
        dueInDays: 5,
        priority: 'Medel',
      }),
  },
  {
    id: 'queen-check',
    shouldApply: ({ inspection, hive }) => (!inspection.queenSeen && !inspection.eggsSeen) || (inspection.actionNeeded && hive.queenStatus !== 'Bekräftad'),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'queen',
        title: 'Följ upp drottningstatus',
        detail: 'Drottning eller färska ägg kunde inte bekräftas, eller så finns redan osäker drottningstatus. Det kan vara klokt att följa upp med fokus på äggläggning, yngelbild och eventuellt visecellbygge.',
        severity: 'warning',
        kind: 'alert',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'queen',
        title: 'Överväg uppföljning av drottningstatus',
        description: `Det kan vara bra att följa upp ${context.hive.name} med fokus på drottning, färska ägg, jämn yngelsättning och eventuella tecken på viselöshet.`,
        dueInDays: 3,
        priority: 'Hög',
      }),
  },
  {
    id: 'winter-prep',
    shouldApply: ({ inspection, season, hive }) =>
      season === 'Invintring' && (inspection.actionNeeded || !inspection.honey || hive.strength !== 'Starkt'),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'winter',
        title: 'Förbered invintring',
        detail: 'Det kan vara dags att planera invintring. Samhället kan behöva rätt fodermängd, en varroaplan och tillräcklig vinterstyrka.',
        severity: 'warning',
        kind: 'seasonal',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'winter',
        title: 'Överväg invintringsplan',
        description: `Det kan vara klokt att se över invintringsfoder, varroabehandling och vinterstyrka i ${context.hive.name} innan höstens beslut blir akuta.`,
        dueInDays: 7,
        priority: 'Medel',
      }),
  },
];

export function buildDerivedSignals(apiaries: Apiary[], hives: Hive[], inspections: Inspection[]): DerivedResult {
  const latestInspections = getLatestInspectionMap(inspections);
  const inspectionHistoryMap = getInspectionHistoryMap(inspections);
  const apiaryMap = apiaries.reduce<Record<string, Apiary>>((map, apiary) => {
    map[apiary.id] = apiary;
    return map;
  }, {});
  const now = new Date();
  const recommendations: Recommendation[] = [];
  const tasks: Task[] = [];

  for (const hive of hives) {
    const inspection = latestInspections[hive.id];

    if (!inspection) {
      continue;
    }

    const apiary = apiaryMap[hive.apiaryId];
    const season = getApiarySeasonLabel(apiary, now);
    const regionLabel = getApiaryRegion(apiary);
    const inspectionHistory = inspectionHistoryMap[hive.id] ?? [inspection];
    const daysSinceLastInspection = differenceInDays(now, new Date(inspection.performedAt));
    const inspectionCadenceDays = getRecommendedInspectionCadenceDays(season, regionLabel);

    const context: RuleContext = {
      apiary,
      hive,
      inspection,
      inspectionHistory,
      now,
      season,
      daysSinceLastInspection,
      regionLabel,
      inspectionCadenceDays,
    };

    for (const rule of decisionRules) {
      if (!rule.shouldApply(context)) {
        continue;
      }

      recommendations.push(rule.buildRecommendation(context));

      if (rule.buildTask) {
        tasks.push(rule.buildTask(context));
      }
    }
  }

  return { recommendations, tasks };
}