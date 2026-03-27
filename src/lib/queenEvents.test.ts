import { describe, expect, it } from 'vitest';

import { applyHiveEventToHive } from '@/lib/queenEvents';
import { Hive, HiveEvent } from '@/types/domain';

function createHive(overrides: Partial<Hive> = {}): Hive {
  return {
    id: 'hive-1',
    apiaryId: 'apiary-1',
    name: 'Kupa 1',
    status: 'Stabilt',
    queenStatus: 'Bekräftad',
    strength: 'Medel',
    temperament: 'Lugnt',
    boxSystem: 'Svea',
    queenYear: '2024',
    queenMarkingColor: 'Grön',
    queenOrigin: 'Ursprunglig drottning',
    queenIntroducedAt: '2024-06-01',
    queenHistory: [
      {
        id: 'queen-history-0',
        year: '2024',
        note: 'Ursprunglig drottning',
      },
    ],
    notes: 'Anteckning',
    ...overrides,
  };
}

describe('applyHiveEventToHive', () => {
  it('updates hive queen profile and history when a queen change is logged', () => {
    const hive = createHive();
    const event: HiveEvent = {
      id: 'event-1',
      hiveId: 'hive-1',
      type: 'Drottning bytt',
      performedAt: '2026-06-12T10:00:00.000Z',
      notes: 'Drottning bytt.',
      details: {
        queenYear: '2026',
        queenMarkingColor: 'Blå',
        queenOrigin: 'Inköpt drottning',
        queenIntroducedAt: '2026-06-12',
        queenStatus: 'Behöver följas upp',
        queenHistoryNote: 'Ersatt',
      },
    };

    expect(applyHiveEventToHive(hive, event)).toEqual({
      ...hive,
      queenYear: '2026',
      queenMarkingColor: 'Blå',
      queenOrigin: 'Inköpt drottning',
      queenIntroducedAt: '2026-06-12',
      queenStatus: 'Behöver följas upp',
      queenHistory: [
        {
          id: 'queen-history-event-1',
          year: '2026',
          note: 'Ersatt',
        },
        ...hive.queenHistory,
      ],
    });
  });

  it('updates year and marking when a marking event is logged', () => {
    const hive = createHive();
    const event: HiveEvent = {
      id: 'event-2',
      hiveId: 'hive-1',
      type: 'Drottning märkt/årgång',
      performedAt: '2026-06-20T10:00:00.000Z',
      notes: 'Märkning uppdaterad.',
      details: {
        queenYear: '2025',
        queenMarkingColor: 'Vit',
      },
    };

    expect(applyHiveEventToHive(hive, event)).toEqual({
      ...hive,
      queenYear: '2025',
      queenMarkingColor: 'Vit',
    });
  });
});