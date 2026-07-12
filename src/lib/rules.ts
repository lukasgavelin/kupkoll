import { Apiary, Hive, HiveEvent, HiveStrength, Inspection, Recommendation, RecommendationKind, RecommendationSeverity, SeasonLabel, Task, UserSettings } from '@/types/domain';
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
  latestEvent?: HiveEvent;
  now: Date;
  season: SeasonLabel;
  daysSinceLastInspection: number;
  regionLabel: string;
  inspectionCadenceDays: number;
  userSettings?: UserSettings;
};

type NoInspectionRuleContext = {
  apiary?: Apiary;
  hive: Hive;
  now: Date;
  season: SeasonLabel;
  userSettings?: UserSettings;
};

type NoInspectionRule = {
  id: string;
  shouldApply: (context: NoInspectionRuleContext) => boolean;
  buildRecommendation: (context: NoInspectionRuleContext) => Recommendation;
  buildTask?: (context: NoInspectionRuleContext) => Task;
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VARROA_FOLLOW_UP_MIN_DAYS = 5;
const VARROA_FOLLOW_UP_MAX_DAYS = 14;
const SWARM_SEASON_MAX_INSPECTION_DAYS = 10;

function taskPriorityFromStrength(strength: HiveStrength): Task['priority'] {
  return strength === 'Svagt' ? 'Hög' : 'Medel';
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * MS_PER_DAY).toISOString();
}

function differenceInDays(later: Date, earlier: Date) {
  return Math.floor((later.getTime() - earlier.getTime()) / MS_PER_DAY);
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

/** Returnerar drottningens ålder i hela år, eller undefined om queenYear saknas. */
function getQueenAgeYears(hive: Hive, now: Date): number | undefined {
  if (!hive.queenYear || !/^\d{4}$/.test(hive.queenYear)) {
    return undefined;
  }

  return now.getFullYear() - Number(hive.queenYear);
}

/**
 * Returnerar true om senaste händelse är en Varroabehandling utförd de senaste 5–14 dagarna
 * och ingen uppföljande varroamätning har skett sedan dess.
 */
function needsVarroaFollowUp(latestEvent: HiveEvent | undefined, inspectionHistory: Inspection[], now: Date): boolean {
  if (!latestEvent || latestEvent.type !== 'Varroabehandling') {
    return false;
  }

  const treatmentDate = new Date(latestEvent.performedAt);
  const daysSinceTreatment = differenceInDays(now, treatmentDate);

  if (daysSinceTreatment < VARROA_FOLLOW_UP_MIN_DAYS || daysSinceTreatment > VARROA_FOLLOW_UP_MAX_DAYS) {
    return false;
  }

  // Kontrollera om det finns en genomgång med varroakontroll EFTER behandlingen
  const hasFollowUp = inspectionHistory.some(
    (insp) => insp.varroaDetails?.checked && new Date(insp.performedAt) > treatmentDate,
  );

  return !hasFollowUp;
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
    shouldApply: ({ season, hive, inspection, now }) => {
      if (
        season !== 'Svärmperiod' ||
        hive.strength !== 'Starkt' ||
        !inspection.eggsSeen ||
        inspection.queenCells ||
        inspection.swarmSigns ||
        !hasGoodInspectionWeather(inspection)
      ) {
        return false;
      }

      // Ung drottning (< 1 år) svärmar mer sällan – supprimera varningen
      const queenAge = getQueenAgeYears(hive, now);
      if (queenAge !== undefined && queenAge < 1) {
        return false;
      }

      return true;
    },
    buildRecommendation: (context) => {
      const queenAge = getQueenAgeYears(context.hive, context.now);
      const isOldQueen = queenAge !== undefined && queenAge >= 2;

      return createRecommendation(context, {
        id: 'seasonal-swarm',
        title: isOldQueen ? 'Förhöjd svärmrisk – gammal drottning' : 'Möjlig svärmperiod',
        detail: isOldQueen
          ? `Drottningen är ${queenAge} år gammal och samhället är starkt under svärmperioden. Äldre drottningar har högre svärmbenägenhet – kontrollera svärmceller och utrymme tätt.`
          : 'Det verkar vara svärmperiod och samhället ser starkt ut med äggläggning igång. Det kan vara bra att kontrollera svärmceller, utrymme och om avläggare kan bli aktuell.',
        severity: isOldQueen ? 'critical' : 'warning',
        kind: 'seasonal',
      });
    },
    buildTask: (context) => {
      const queenAge = getQueenAgeYears(context.hive, context.now);
      const isOldQueen = queenAge !== undefined && queenAge >= 2;

      return createTask(context, {
        id: 'seasonal-swarm',
        title: isOldQueen ? 'Svärmkontroll – gammal drottning' : 'Överväg förebyggande svärmkontroll',
        description: isOldQueen
          ? `${context.hive.name} har en ${queenAge} år gammal drottning under svärmperioden. Kontrollera svärmceller och fundera på avläggare eller drottningbyte.`
          : `Det kan vara bra att kontrollera ${context.hive.name} för svärmceller, utrymmesbehov och eventuell avläggare medan svärmtrycket byggs upp.`,
        dueInDays: isOldQueen ? 1 : 3,
        priority: isOldQueen ? 'Hög' : 'Medel',
      });
    },
  },
  {
    id: 'follow-up-in-better-weather',
    shouldApply: ({ season, inspection, userSettings }) =>
      userSettings?.experienceLevel !== 'experienced' &&
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
        detail: 'Lite yngel eller svag styrka kan tyda på att samhället behöver tätare uppföljning, utjämning med yngelram eller annan stödåtgärd.',
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
  // L5: Akut foderbrist under vår/vinter
  {
    id: 'food-shortage-spring',
    shouldApply: ({ inspection, season }) =>
      !inspection.honey && (season === 'Vårutveckling' || season === 'Vintertillsyn'),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'food-spring',
        title: 'Kan saknas honung – stödfodra?',
        detail: 'Ingen honung eller foderkrans registrerades. Under vår- och vintertillsyn är foderbrist en vanlig orsak till koloniförlust – kontrollera och stödfodra vid behov.',
        severity: 'critical',
        kind: 'alert',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'food-spring',
        title: 'Kontrollera foderläget och stödfodra',
        description: `${context.hive.name} visade inga tecken på honung vid senaste genomgången under ${context.season.toLowerCase()}. Foderbrist under vår kan snabbt leda till svält – prioritera ett besök.`,
        dueInDays: 1,
        priority: 'Hög',
      }),
  },
  // L5: Låg pollenreserv under svärmperiod
  {
    id: 'pollen-shortage-swarm',
    shouldApply: ({ inspection, season }) =>
      !inspection.pollen && season === 'Svärmperiod',
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'pollen-swarm',
        title: 'Låg pollenreserv under svärmperiod',
        detail: 'Pollen är nödvändigt för yngeluppfödning under svärmperioden. Inget pollen noterades – kontrollera om draget är svagt och om stödutfodring kan behövas.',
        severity: 'warning',
        kind: 'alert',
      }),
  },
  // L6: Invintring – vinterfoder saknas (kritisk)
  {
    id: 'winter-no-food',
    shouldApply: ({ inspection, season }) =>
      (season === 'Invintring' || season === 'Vinterro') && !inspection.honey,
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'winter-food',
        title: 'Vinterfoder saknas – akut risk',
        detail: 'Ingen honung registrerades under invintring eller vinterro. Otillräckligt vinterfoder är en av de vanligaste orsakerna till vinterförlust – komplettera omedelbart.',
        severity: 'critical',
        kind: 'alert',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'winter-food',
        title: 'Komplettera vinterfoder snarast',
        description: `${context.hive.name} hade ingen registrerad honung vid senaste genomgången under ${context.season.toLowerCase()}. Otillräckligt vinterfoder är kritisk – prioritera ett besök direkt.`,
        dueInDays: 1,
        priority: 'Hög',
      }),
  },
  // L6: Invintring – osäker drottningstatus
  {
    id: 'winter-queen-uncertain',
    shouldApply: ({ hive, season }) =>
      (season === 'Invintring' || season === 'Vinterro') && hive.queenStatus !== 'Bekräftad',
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'winter-queen',
        title: 'Osäker drottningstatus inför vintern',
        detail: `Drottningens status är "${context.hive.queenStatus}". Samhällen som går in i vintern utan bekräftad drottning riskerar att vara drottninglösa och gå förlorade.`,
        severity: 'warning',
        kind: 'alert',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'winter-queen',
        title: 'Bekräfta drottningstatus inför vintern',
        description: `Säkerställ att ${context.hive.name} har en äggläggande drottning inför övervintringen. Samhällen utan drottning bör förenas med ett annat samhälle.`,
        dueInDays: 5,
        priority: 'Hög',
      }),
  },
  // L6: Invintring – svagt samhälle
  {
    id: 'winter-weak-colony',
    shouldApply: ({ hive, season }) =>
      (season === 'Invintring' || season === 'Vinterro') && hive.strength === 'Svagt',
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'winter-weak',
        title: 'Svagt samhälle inför vintern',
        detail: 'Svaga samhällen överlever sällan vintern på egen hand. Överväg att förena samhället med ett annat starkare samhälle i god tid.',
        severity: 'warning',
        kind: 'seasonal',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'winter-weak',
        title: 'Överväg förening inför vintern',
        description: `${context.hive.name} verkar svagt inför övervintringen. Förening med ett starkare samhälle kan rädda bägge coloniers genetiska material.`,
        dueInDays: 7,
        priority: 'Medel',
      }),
  },
  // L8: Uppföljande varroamätning efter behandling
  {
    id: 'varroa-follow-up',
    shouldApply: ({ latestEvent, inspectionHistory, now }) =>
      needsVarroaFollowUp(latestEvent, inspectionHistory, now),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'varroa-follow-up',
        title: 'Uppföljande varroamätning rekommenderas',
        detail: 'En varroabehandling genomfördes nyligen. Uppföljande mätning 7–10 dagar efter behandling rekommenderas för att kontrollera effekten och avgöra om ny behandling behövs.',
        severity: 'info',
        kind: 'reminder',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'varroa-follow-up',
        title: 'Gör uppföljande varroamätning',
        description: `Logga en uppföljande varroamätning för ${context.hive.name} för att kontrollera behandlingseffekten. Välj Händelse → Uppföljande varroamätning.`,
        dueInDays: 3,
        priority: 'Medel',
      }),
  },
];

// L4: Regler för kupor som saknar genomgång
const noInspectionRules: NoInspectionRule[] = [
  {
    id: 'no-inspection',
    shouldApply: ({ season }) =>
      season !== 'Vinterro' && season !== 'Vintertillsyn',
    buildRecommendation: ({ hive, season }) => ({
      id: `rec-no-inspection-${hive.id}`,
      hiveId: hive.id,
      title: 'Ingen genomgång registrerad ännu',
      detail: `${hive.name} har inga genomgångar sparade. Logga den första genomgången för att börja få råd och uppföljning anpassade till kupans läge.`,
      severity: 'info' as RecommendationSeverity,
      kind: 'reminder' as RecommendationKind,
      season,
      createdAt: new Date().toISOString(),
    }),
    buildTask: ({ hive }) => ({
      id: `task-no-inspection-${hive.id}`,
      title: 'Logga första genomgången',
      description: `${hive.name} saknar genomgångar. Logga den första för att komma igång med historik och beslutsstöd.`,
      dueDate: addDays(new Date(), 2),
      hiveId: hive.id,
      priority: 'Medel' as Task['priority'],
      source: 'Beslutsstöd' as Task['source'],
      completed: false,
    }),
  },
];

// L3: Inactive-hive – gäller alla erfarenhetsnivåer med anpassad kadence
function getInactiveHiveThreshold(
  inspectionCadenceDays: number,
  season: SeasonLabel,
  userSettings: UserSettings | undefined,
): number {
  const multiplier = userSettings?.experienceLevel === 'experienced' ? 2 : 1;
  const threshold = inspectionCadenceDays * multiplier;

  // Under svärmperioden: max 10 dagar oavsett erfarenhet
  if (season === 'Svärmperiod') {
    return Math.min(threshold, SWARM_SEASON_MAX_INSPECTION_DAYS);
  }

  return threshold;
}

export function buildDerivedSignals(
  apiaries: Apiary[],
  hives: Hive[],
  inspections: Inspection[],
  userSettings?: UserSettings,
  events?: HiveEvent[],
): DerivedResult {
  const latestInspections = getLatestInspectionMap(inspections);
  const inspectionHistoryMap = getInspectionHistoryMap(inspections);
  const apiaryMap = apiaries.reduce<Record<string, Apiary>>((map, apiary) => {
    map[apiary.id] = apiary;
    return map;
  }, {});

  // Bygg upp en map med senaste händelsen per kupa
  const latestEventMap = (events ?? []).reduce<Record<string, HiveEvent>>((map, event) => {
    const current = map[event.hiveId];

    if (!current || new Date(event.performedAt) > new Date(current.performedAt)) {
      map[event.hiveId] = event;
    }

    return map;
  }, {});

  const now = new Date();
  const recommendations: Recommendation[] = [];
  const tasks: Task[] = [];

  for (const hive of hives) {
    const inspection = latestInspections[hive.id];
    const apiary = apiaryMap[hive.apiaryId];
    const season = getApiarySeasonLabel(apiary, now);

    // L4: Kupor utan genomgång – egna regler
    if (!inspection) {
      const noInspContext: NoInspectionRuleContext = { apiary, hive, now, season, userSettings };

      for (const rule of noInspectionRules) {
        if (!rule.shouldApply(noInspContext)) {
          continue;
        }

        recommendations.push(rule.buildRecommendation(noInspContext));

        if (rule.buildTask) {
          tasks.push(rule.buildTask(noInspContext));
        }
      }

      continue;
    }

    const regionLabel = getApiaryRegion(apiary);
    const inspectionHistory = inspectionHistoryMap[hive.id] ?? [inspection];
    const daysSinceLastInspection = differenceInDays(now, new Date(inspection.performedAt));
    const inspectionCadenceDays = getRecommendedInspectionCadenceDays(season, regionLabel);
    const latestEvent = latestEventMap[hive.id];

    const context: RuleContext = {
      apiary,
      hive,
      inspection,
      inspectionHistory,
      latestEvent,
      now,
      season,
      daysSinceLastInspection,
      regionLabel,
      inspectionCadenceDays,
      userSettings,
    };

    // L3: Inactive-hive med erfarenhetsanpassad kadence
    const inactiveThreshold = getInactiveHiveThreshold(inspectionCadenceDays, season, userSettings);
    if (daysSinceLastInspection >= inactiveThreshold) {
      const isExperienced = userSettings?.experienceLevel === 'experienced';
      recommendations.push(
        createRecommendation(context, {
          id: 'inactive-hive',
          title: 'Kan vara dags för ny genomgång',
          detail: `Ingen genomgång har registrerats på ${daysSinceLastInspection} dagar. För ${regionLabel.toLowerCase()} i det här säsongsläget kan det${isExperienced ? ' möjligen' : ''} vara rimligt att följa kupan ungefär var ${inspectionCadenceDays}:e dag.`,
          severity: 'info',
          kind: 'reminder',
        }),
      );
      tasks.push(
        createTask(context, {
          id: 'inactive-hive',
          title: 'Överväg ny genomgång',
          description: `${hive.name} följs just nu glest i förhållande till säsong och region. Det kan vara bra att lägga in en ny genomgång för att få uppdaterat läge.`,
          dueInDays: 1,
          priority: 'Medel',
        }),
      );
    }

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