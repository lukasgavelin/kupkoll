import { Hive, HiveStrength, Inspection, Recommendation, RecommendationSeverity, SeasonLabel, Task } from '@/types/domain';
import { getLatestInspectionMap, getSeasonLabel } from '@/lib/selectors';

type DerivedResult = {
  recommendations: Recommendation[];
  tasks: Task[];
};

type RuleContext = {
  hive: Hive;
  inspection: Inspection;
  now: Date;
  season: SeasonLabel;
};

type DecisionRule = {
  id: string;
  shouldApply: (context: RuleContext) => boolean;
  buildRecommendation: (context: RuleContext) => Recommendation;
  buildTask: (context: RuleContext) => Task;
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

function createRecommendation(context: RuleContext, params: { id: string; title: string; detail: string; severity: RecommendationSeverity }): Recommendation {
  return {
    id: `rec-${params.id}-${context.hive.id}`,
    hiveId: context.hive.id,
    title: params.title,
    detail: params.detail,
    severity: params.severity,
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

const decisionRules: DecisionRule[] = [
  {
    id: 'swarm-risk',
    shouldApply: ({ inspection }) => inspection.queenCells || inspection.swarmSigns,
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'swarm',
        title: 'Hög svärmrisk',
        detail: 'Drottningceller eller tydliga svärmtecken noterades. Följ upp snabbt och bedöm avläggare, skattlåda eller annan svärmförebyggande åtgärd.',
        severity: 'critical',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'swarm',
        title: 'Gör svärmkontroll',
        description: `Gå igenom ${context.hive.name} igen inom några dagar och avgör om samhället behöver avläggare, skattlåda eller brytning av svärmceller.`,
        dueInDays: 2,
        priority: 'Hög',
      }),
  },
  {
    id: 'weak-colony',
    shouldApply: ({ hive, inspection }) => hive.strength === 'Svagt' || (!inspection.openBrood && !inspection.cappedBrood) || (!inspection.honey && !inspection.pollen),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'weak',
        title: 'Samhället verkar svagt',
        detail: 'Lite yngel, svag styrka eller tunt foderläge tyder på att samhället behöver tätare uppföljning, stödfodring eller förstärkning.',
        severity: 'warning',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'weak',
        title: 'Bedöm stödåtgärd',
        description: `Avgör om ${context.hive.name} behöver stödfodring, utjämning med yngelram eller annan stödåtgärd för att komma i balans.`,
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
      (season === 'Vårutveckling' || season === 'Svärmperiod' || season === 'Drag och skattning'),
    buildRecommendation: (context) =>
      createRecommendation(context, {
        id: 'super',
        title: 'Överväg skattlåda',
        detail: 'Samhället är starkt, har gott drag och producerar. Förbered skattlåda innan trängsel i yngelrummet ökar svärmtrycket.',
        severity: 'info',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'super',
        title: 'Planera skattlåda',
        description: `Säkerställ att ${context.hive.name} snabbt kan få skattlåda eller mer utrymme om draget fortsätter öka.`,
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
        title: 'Kontrollera drottningstatus',
        detail: 'Drottning eller färska ägg kunde inte bekräftas, eller så finns redan osäker drottningstatus. Samhället bör följas upp med fokus på äggläggning, yngelbild och eventuellt visecellbygge.',
        severity: 'warning',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'queen',
        title: 'Bekräfta drottningstatus',
        description: `Följ upp ${context.hive.name} med fokus på drottning, färska ägg, jämn yngelsättning och eventuella tecken på viselöshet.`,
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
        detail: 'Det är dags att planera invintring. Samhället behöver rätt fodermängd, varroaplan och tillräcklig vinterstyrka.',
        severity: 'warning',
      }),
    buildTask: (context) =>
      createTask(context, {
        id: 'winter',
        title: 'Planera invintring',
        description: `Se över invintringsfoder, varroabehandling och vinterstyrka i ${context.hive.name} innan höstens beslut blir akuta.`,
        dueInDays: 7,
        priority: 'Medel',
      }),
  },
];

export function buildDerivedSignals(hives: Hive[], inspections: Inspection[]): DerivedResult {
  const latestInspections = getLatestInspectionMap(inspections);
  const now = new Date();
  const season = getSeasonLabel(now);
  const recommendations: Recommendation[] = [];
  const tasks: Task[] = [];

  for (const hive of hives) {
    const inspection = latestInspections[hive.id];

    if (!inspection) {
      continue;
    }

    const context: RuleContext = {
      hive,
      inspection,
      now,
      season,
    };

    for (const rule of decisionRules) {
      if (!rule.shouldApply(context)) {
        continue;
      }

      recommendations.push(rule.buildRecommendation(context));
      tasks.push(rule.buildTask(context));
    }
  }

  return { recommendations, tasks };
}