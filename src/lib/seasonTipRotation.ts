import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SeasonStatus } from '@/lib/selectors';

const KUPKOLL_SEASON_TIP_ROTATION_STORAGE_KEY = 'kupkoll:season-tip-rotation';
const VISIBLE_FOCUS_ITEM_COUNT = 2;
const VISIBLE_WATCH_ITEM_COUNT = 1;

type PersistedSeasonTipRotationEntry = {
  lastShownOn: string;
  focusStartIndex: number;
  watchStartIndex: number;
};

type PersistedSeasonTipRotationState = Record<string, PersistedSeasonTipRotationEntry>;

export type SeasonTipSelection = {
  focusStartIndex: number;
  watchStartIndex: number;
};

function createLocalDateStamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getNextStartIndex(previousIndex: number | undefined, itemCount: number, visibleCount: number) {
  if (itemCount <= visibleCount) {
    return 0;
  }

  return previousIndex === undefined ? 0 : (previousIndex + 1) % itemCount;
}

function normalizeRotationState(input: unknown): PersistedSeasonTipRotationState {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  return Object.entries(input as Record<string, unknown>).reduce<PersistedSeasonTipRotationState>((state, [key, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return state;
    }

    const candidate = value as Record<string, unknown>;
    const lastShownOn = typeof candidate.lastShownOn === 'string' ? candidate.lastShownOn : undefined;
    const focusStartIndex = typeof candidate.focusStartIndex === 'number' && Number.isInteger(candidate.focusStartIndex) ? candidate.focusStartIndex : undefined;
    const watchStartIndex = typeof candidate.watchStartIndex === 'number' && Number.isInteger(candidate.watchStartIndex) ? candidate.watchStartIndex : undefined;

    if (lastShownOn === undefined || focusStartIndex === undefined || watchStartIndex === undefined) {
      return state;
    }

    state[key] = {
      lastShownOn,
      focusStartIndex,
      watchStartIndex,
    };

    return state;
  }, {});
}

export function getSeasonTipRotationKey(status: Pick<SeasonStatus, 'season' | 'phaseLabel' | 'regionLabel'>) {
  return `${status.regionLabel}:${status.season}:${status.phaseLabel}`;
}

export function rotateTipItems(items: string[], startIndex: number, visibleCount: number) {
  if (items.length <= visibleCount) {
    return [...items];
  }

  return Array.from({ length: visibleCount }, (_, offset) => items[(startIndex + offset) % items.length]);
}

export function applySeasonTipSelection(status: SeasonStatus, selection: SeasonTipSelection): SeasonStatus {
  return {
    ...status,
    focusItems: rotateTipItems(status.focusItems, selection.focusStartIndex, VISIBLE_FOCUS_ITEM_COUNT),
    watchItems: rotateTipItems(status.watchItems, selection.watchStartIndex, VISIBLE_WATCH_ITEM_COUNT),
  };
}

export async function getSeasonTipSelection(status: SeasonStatus, date = new Date()): Promise<SeasonTipSelection> {
  const today = createLocalDateStamp(date);
  const key = getSeasonTipRotationKey(status);

  try {
    const raw = await AsyncStorage.getItem(KUPKOLL_SEASON_TIP_ROTATION_STORAGE_KEY);
    const state = normalizeRotationState(raw ? JSON.parse(raw) : null);
    const current = state[key];

    if (current?.lastShownOn === today) {
      return {
        focusStartIndex: current.focusStartIndex,
        watchStartIndex: current.watchStartIndex,
      };
    }

    const nextEntry: PersistedSeasonTipRotationEntry = {
      lastShownOn: today,
      focusStartIndex: getNextStartIndex(current?.focusStartIndex, status.focusItems.length, VISIBLE_FOCUS_ITEM_COUNT),
      watchStartIndex: getNextStartIndex(current?.watchStartIndex, status.watchItems.length, VISIBLE_WATCH_ITEM_COUNT),
    };

    await AsyncStorage.setItem(
      KUPKOLL_SEASON_TIP_ROTATION_STORAGE_KEY,
      JSON.stringify({
        ...state,
        [key]: nextEntry,
      }),
    );

    return {
      focusStartIndex: nextEntry.focusStartIndex,
      watchStartIndex: nextEntry.watchStartIndex,
    };
  } catch {
    return {
      focusStartIndex: 0,
      watchStartIndex: 0,
    };
  }
}