import { describe, expect, it } from 'vitest';

import { filterRecommendationsWithoutTask, groupRecommendations, sortRecommendations } from '@/lib/recommendations';
import { Recommendation, Task } from '@/types/domain';

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

function createTask(overrides: Partial<Task>): Task {
  return {
    id: 'task-1',
    title: 'Testuppgift',
    description: 'Detalj',
    dueDate: '2026-03-26T10:00:00.000Z',
    priority: 'Medel',
    source: 'Beslutsstöd',
    completed: false,
    hiveId: 'hive-1',
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

describe('filterRecommendationsWithoutTask', () => {
  it('removes recommendations that already have a matching task signal', () => {
    const recommendations = [
      createRecommendation({ id: 'rec-varroa-hive-1', kind: 'alert', severity: 'critical' }),
      createRecommendation({ id: 'rec-status-hive-1', kind: 'status', severity: 'info' }),
    ];
    const tasks = [createTask({ id: 'task-varroa-hive-1' })];

    expect(filterRecommendationsWithoutTask(recommendations, tasks).map((item) => item.id)).toEqual(['rec-status-hive-1']);
  });
});