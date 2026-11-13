import { Hive, HiveEvent, HiveEventType, QueenHistoryEntry } from '@/types/domain';

export const TERMINAL_HIVE_EVENT_TYPES = new Set<HiveEventType>([
  'Vinterförlust',
  'Samhälle dött/avvecklat',
  'Samhälle förenat',
]);

function createQueenHistoryEntry(event: HiveEvent): QueenHistoryEntry | undefined {
  const year = event.details?.queenYear?.trim();
  const note = event.details?.queenHistoryNote?.trim();

  if (!year || !note) {
    return undefined;
  }

  return {
    id: `queen-history-${event.id}`,
    year,
    note,
  };
}

function upsertQueenHistoryEntry(history: QueenHistoryEntry[], entry: QueenHistoryEntry): QueenHistoryEntry[] {
  const existingIndex = history.findIndex((item) => item.id === entry.id);
  if (existingIndex === -1) {
    return [entry, ...history];
  }

  const updated = [...history];
  updated[existingIndex] = entry;
  return updated;
}

export function applyHiveEventToHive(hive: Hive, event: HiveEvent): Hive {
  if (hive.id !== event.hiveId) {
    return hive;
  }

  if (TERMINAL_HIVE_EVENT_TYPES.has(event.type)) {
    return hive.status === 'Avslutad' ? hive : { ...hive, status: 'Avslutad' };
  }

  if (!event.details) {
    return hive;
  }

  if (event.type === 'Drottning bytt') {
    const nextHistoryEntry = createQueenHistoryEntry(event);
    const isNewQueenYear = Boolean(event.details.queenYear && event.details.queenYear !== hive.queenYear);

    return {
      ...hive,
      queenStatus: event.details.queenStatus ?? hive.queenStatus,
      queenYear: event.details.queenYear ?? hive.queenYear,
      queenMarkingColor: isNewQueenYear ? event.details.queenMarkingColor : (event.details.queenMarkingColor ?? hive.queenMarkingColor),
      queenOrigin: isNewQueenYear ? event.details.queenOrigin : (event.details.queenOrigin ?? hive.queenOrigin),
      queenIntroducedAt: isNewQueenYear
        ? (event.details.queenIntroducedAt ?? event.performedAt.slice(0, 10))
        : (event.details.queenIntroducedAt ?? hive.queenIntroducedAt),
      queenHistory: nextHistoryEntry ? upsertQueenHistoryEntry(hive.queenHistory, nextHistoryEntry) : hive.queenHistory,
    };
  }

  if (event.type === 'Drottning märkt/årgång') {
    return {
      ...hive,
      queenYear: event.details.queenYear ?? hive.queenYear,
      queenMarkingColor: event.details.queenMarkingColor ?? hive.queenMarkingColor,
    };
  }

  return hive;
}