import { describe, expect, it } from 'vitest';

import { groupRecommendations, sortRecommendations } from '@/lib/recommendations';
import { Recommendation } from '@/types/domain';

function createRecommendation(overrides: Partial<Recommendation>): Recommendation {
  return {
    id: 'rec-1',
    hiveId: 'hive-1',
    title: 'Test',
    detail: 'Detalj',
    severity: 'info',
    kind: 'status',
    season: 'Vårutveckling',
    createdAt: '2026-03-25T10:00:00.000Z',
    ...overrides,
  };
}

describe('sortRecommendations', () => {
  it('prioritizes critical alerts before seasonal and reminder items', () => {
    const recommendations = [
      createRecommendation({ id: 'status', kind: 'status', severity: 'info' }),
      createRecommendation({ id: 'seasonal', kind: 'seasonal', severity: 'warning' }),
      createRecommendation({ id: 'alert', kind: 'alert', severity: 'critical' }),
      createRecommendation({ id: 'reminder', kind: 'reminder', severity: 'info' }),
    ];

    expect(sortRecommendations(recommendations).map((item) => item.id)).toEqual(['alert', 'seasonal', 'reminder', 'status']);
  });
});

describe('groupRecommendations', () => {
  it('groups recommendations by kind in the intended UI order', () => {
    const recommendations = [
      createRecommendation({ id: 'seasonal', kind: 'seasonal', severity: 'warning' }),
      createRecommendation({ id: 'alert', kind: 'alert', severity: 'warning' }),
      createRecommendation({ id: 'status', kind: 'status', severity: 'info' }),
    ];

    expect(groupRecommendations(recommendations).map((group) => group.kind)).toEqual(['alert', 'seasonal', 'status']);
  });
});