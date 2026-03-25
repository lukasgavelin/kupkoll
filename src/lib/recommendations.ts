import { Recommendation, RecommendationKind, RecommendationSeverity } from '@/types/domain';

export type RecommendationGroup = {
  kind: RecommendationKind;
  title: string;
  description: string;
  items: Recommendation[];
};

const severityOrder: Record<RecommendationSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const kindOrder: Record<RecommendationKind, number> = {
  alert: 0,
  seasonal: 1,
  reminder: 2,
  status: 3,
};

const groupMeta: Record<RecommendationKind, Omit<RecommendationGroup, 'items' | 'kind'>> = {
  alert: {
    title: 'Akuta signaler',
    description: 'Historik eller senaste genomgång visar lägen som bör bedömas först.',
  },
  seasonal: {
    title: 'Säsongsråd',
    description: 'Råd som blir relevanta i aktuell fas av biodlingsåret.',
  },
  reminder: {
    title: 'Påminnelser',
    description: 'Saker som riskerar att falla mellan genomgångarna om de inte lyfts fram.',
  },
  status: {
    title: 'Lägesbild',
    description: 'Lugnare besked som bekräftar att något återgått till stabilt läge.',
  },
};

export function sortRecommendations(recommendations: Recommendation[]) {
  return [...recommendations].sort((left, right) => {
    const severityDifference = severityOrder[left.severity] - severityOrder[right.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    const kindDifference = kindOrder[left.kind] - kindOrder[right.kind];

    if (kindDifference !== 0) {
      return kindDifference;
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function groupRecommendations(recommendations: Recommendation[]): RecommendationGroup[] {
  const grouped = new Map<RecommendationKind, Recommendation[]>();

  for (const recommendation of sortRecommendations(recommendations)) {
    const items = grouped.get(recommendation.kind) ?? [];
    items.push(recommendation);
    grouped.set(recommendation.kind, items);
  }

  return Array.from(grouped.entries())
    .sort(([leftKind], [rightKind]) => kindOrder[leftKind] - kindOrder[rightKind])
    .map(([kind, items]) => ({
      kind,
      ...groupMeta[kind],
      items,
    }));
}

export function getRecommendationKindLabel(kind: RecommendationKind) {
  if (kind === 'alert') {
    return 'Trend';
  }

  if (kind === 'seasonal') {
    return 'Säsong';
  }

  if (kind === 'reminder') {
    return 'Påminnelse';
  }

  return 'Status';
}