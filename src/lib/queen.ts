import { Hive, NewHiveInput, QueenHistoryInput, QueenMarkingColor, QueenStatus } from '@/types/domain';

export type QueenHistoryDraftEntry = {
  id: string;
  year: string;
  note: string;
};

export type QueenProfileDraft = {
  queenStatus: QueenStatus;
  queenYear: string;
  queenMarkingColor: QueenMarkingColor | '';
  queenOrigin: string;
  queenIntroducedAt: string;
  queenHistory: QueenHistoryDraftEntry[];
};

export const queenMarkingColors: QueenMarkingColor[] = ['Vit', 'Gul', 'Röd', 'Grön', 'Blå', 'Omärkt'];
export const queenStatuses: QueenStatus[] = ['Bekräftad', 'Osäker', 'Behöver följas upp'];

export function createQueenHistoryDraftEntry(overrides: Partial<QueenHistoryDraftEntry> = {}): QueenHistoryDraftEntry {
  return {
    id: `queen-draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    year: '',
    note: '',
    ...overrides,
  };
}

export function createQueenProfileDraft(hive?: Partial<Hive>): QueenProfileDraft {
  return {
    queenStatus: hive?.queenStatus ?? 'Behöver följas upp',
    queenYear: hive?.queenYear ?? '',
    queenMarkingColor: hive?.queenMarkingColor ?? '',
    queenOrigin: hive?.queenOrigin ?? '',
    queenIntroducedAt: hive?.queenIntroducedAt ?? '',
    queenHistory: (hive?.queenHistory ?? []).map((entry) => createQueenHistoryDraftEntry(entry)),
  };
}

function isValidYear(value: string) {
  return /^\d{4}$/.test(value);
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
}

export function buildQueenInput(draft: QueenProfileDraft): { value?: Pick<NewHiveInput, 'queenStatus' | 'queenYear' | 'queenMarkingColor' | 'queenOrigin' | 'queenIntroducedAt' | 'queenHistory'>; error?: string } {
  const queenYear = draft.queenYear.trim();
  const queenOrigin = draft.queenOrigin.trim();
  const queenIntroducedAt = draft.queenIntroducedAt.trim();

  if (queenYear && !isValidYear(queenYear)) {
    return { error: 'Drottningens år behöver anges som fyra siffror, till exempel 2025.' };
  }

  if (queenIntroducedAt && !isValidIsoDate(queenIntroducedAt)) {
    return { error: 'Datum för införande behöver anges som ÅÅÅÅ-MM-DD.' };
  }

  const queenHistory: QueenHistoryInput[] = [];

  for (const entry of draft.queenHistory) {
    const year = entry.year.trim();
    const note = entry.note.trim();

    if (!year && !note) {
      continue;
    }

    if (!year || !note) {
      return { error: 'Varje historikrad behöver både år och beskrivning.' };
    }

    if (!isValidYear(year)) {
      return { error: 'Historikens år behöver anges med fyra siffror, till exempel 2024.' };
    }

    queenHistory.push({ year, note });
  }

  return {
    value: {
      queenStatus: draft.queenStatus,
      queenYear: queenYear || undefined,
      queenMarkingColor: draft.queenMarkingColor || undefined,
      queenOrigin: queenOrigin || undefined,
      queenIntroducedAt: queenIntroducedAt || undefined,
      queenHistory,
    },
  };
}