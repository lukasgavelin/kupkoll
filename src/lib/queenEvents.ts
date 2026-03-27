import { Hive, HiveEvent, QueenHistoryEntry } from '@/types/domain';

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

export function applyHiveEventToHive(hive: Hive, event: HiveEvent): Hive {
  if (hive.id !== event.hiveId || !event.details) {
    return hive;
  }

  if (event.type === 'Drottning bytt') {
    const nextHistoryEntry = createQueenHistoryEntry(event);

    return {
      ...hive,
      queenStatus: event.details.queenStatus ?? hive.queenStatus,
      queenYear: event.details.queenYear ?? hive.queenYear,
      queenMarkingColor: event.details.queenMarkingColor ?? hive.queenMarkingColor,
      queenOrigin: event.details.queenOrigin ?? hive.queenOrigin,
      queenIntroducedAt: event.details.queenIntroducedAt ?? hive.queenIntroducedAt,
      queenHistory: nextHistoryEntry ? [nextHistoryEntry, ...hive.queenHistory] : hive.queenHistory,
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