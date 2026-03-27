import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

import { applySeasonTipSelection, getSeasonTipRotationKey, getSeasonTipSelection, rotateTipItems } from '@/lib/seasonTipRotation';
import type { SeasonStatus } from '@/lib/selectors';

const storage = vi.mocked(AsyncStorage);

const status: SeasonStatus = {
  season: 'Vårutveckling',
  monthLabel: 'Mars',
  phaseLabel: 'första vårkollen',
  summary: 'Mars kan skifta snabbt.',
  focusItems: ['tips 1', 'tips 2', 'tips 3'],
  watchItems: ['tänk 1', 'tänk 2', 'tänk 3'],
  timingLabel: 'Brukar oftast infalla mellan mars och maj i mellansverige.',
  regionLabel: 'Mellansverige',
  inspectionCadenceDays: 12,
  sourceLabel: 'Bygger på Biodlaråret.',
};

describe('rotateTipItems', () => {
  it('returns a rotated window when there are more items than visible slots', () => {
    expect(rotateTipItems(['a', 'b', 'c'], 1, 2)).toEqual(['b', 'c']);
    expect(rotateTipItems(['a', 'b', 'c'], 2, 2)).toEqual(['c', 'a']);
  });

  it('returns all items unchanged when the list already fits', () => {
    expect(rotateTipItems(['a', 'b'], 1, 2)).toEqual(['a', 'b']);
  });
});

describe('applySeasonTipSelection', () => {
  it('reduces the visible tip set to a smaller rotated selection', () => {
    expect(applySeasonTipSelection(status, { focusStartIndex: 1, watchStartIndex: 2 })).toMatchObject({
      focusItems: ['tips 2', 'tips 3'],
      watchItems: ['tänk 3'],
    });
  });
});

describe('getSeasonTipSelection', () => {
  beforeEach(() => {
    storage.getItem.mockReset();
    storage.setItem.mockReset();
  });

  it('stores the first selection for a season phase when none exists yet', async () => {
    storage.getItem.mockResolvedValue(null);
    storage.setItem.mockResolvedValue();

    const selection = await getSeasonTipSelection(status, new Date('2026-03-27T08:00:00'));

    expect(selection).toEqual({
      focusStartIndex: 0,
      watchStartIndex: 0,
    });
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith(
      'kupkoll:season-tip-rotation',
      JSON.stringify({
        [getSeasonTipRotationKey(status)]: {
          lastShownOn: '2026-03-27',
          focusStartIndex: 0,
          watchStartIndex: 0,
        },
      }),
    );
  });

  it('returns the same selection again on the same day', async () => {
    storage.getItem.mockResolvedValue(
      JSON.stringify({
        [getSeasonTipRotationKey(status)]: {
          lastShownOn: '2026-03-27',
          focusStartIndex: 1,
          watchStartIndex: 2,
        },
      }),
    );

    const selection = await getSeasonTipSelection(status, new Date('2026-03-27T18:30:00'));

    expect(selection).toEqual({
      focusStartIndex: 1,
      watchStartIndex: 2,
    });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('advances the selection on a new day', async () => {
    storage.getItem.mockResolvedValue(
      JSON.stringify({
        [getSeasonTipRotationKey(status)]: {
          lastShownOn: '2026-03-27',
          focusStartIndex: 1,
          watchStartIndex: 2,
        },
      }),
    );
    storage.setItem.mockResolvedValue();

    const selection = await getSeasonTipSelection(status, new Date('2026-03-28T07:15:00'));

    expect(selection).toEqual({
      focusStartIndex: 2,
      watchStartIndex: 0,
    });
  });
});