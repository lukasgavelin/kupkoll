import { Hive, Inspection } from '@/types/domain';

export function deriveHiveStatusFromInspection(
  inspection: Pick<Inspection, 'queenSeen' | 'eggsSeen' | 'actionNeeded' | 'varroaLevel' | 'openBrood' | 'cappedBrood' | 'temperament'>,
): Pick<Hive, 'status' | 'queenStatus' | 'temperament'> {
  const queenStatus = inspection.queenSeen || inspection.eggsSeen
    ? 'Bekräftad'
    : inspection.actionNeeded
      ? 'Behöver följas upp'
      : 'Osäker';

  const status = inspection.actionNeeded || inspection.varroaLevel === 'Hög' || (!inspection.openBrood && !inspection.cappedBrood)
    ? 'Behöver åtgärd'
    : 'Stabilt';

  return {
    status,
    queenStatus,
    temperament: inspection.temperament,
  };
}

/**
 * Recomputes a hive's inspection-derived fields from its remaining inspections.
 * Preserves `'Avslutad'` status if a terminal event has closed the colony.
 */
export function reconcileHiveFromInspections(hive: Hive, hiveInspections: Inspection[]): Hive {
  if (hiveInspections.length === 0) {
    return {
      ...hive,
      lastInspectionAt: undefined,
      status: hive.status === 'Avslutad' ? 'Avslutad' : 'Under uppbyggnad',
    };
  }

  let latest = hiveInspections[0];
  let latestTime = new Date(latest.performedAt).getTime();

  for (let i = 1; i < hiveInspections.length; i += 1) {
    const candidate = hiveInspections[i];
    const candidateTime = new Date(candidate.performedAt).getTime();
    if (candidateTime >= latestTime) {
      latest = candidate;
      latestTime = candidateTime;
    }
  }

  const derived = deriveHiveStatusFromInspection(latest);

  return {
    ...hive,
    lastInspectionAt: latest.performedAt,
    status: hive.status === 'Avslutad' ? 'Avslutad' : derived.status,
    queenStatus: derived.queenStatus,
    temperament: derived.temperament,
  };
}

/**
 * Returns image URIs present in `previousUris` that are no longer present in `nextUris`.
 */
export function getRemovedImageUris(previousUris?: string[], nextUris?: string[]): string[] {
  if (!previousUris?.length) {
    return [];
  }

  const nextSet = new Set(nextUris ?? []);
  return previousUris.filter((uri) => !nextSet.has(uri));
}
