import { KupkollExportBundle } from '@/lib/export';
import { KupkollAppState, parsePersistedKupkollState } from '@/lib/storage';

type KupkollImportErrorCode = 'invalid-json' | 'unsupported-format' | 'invalid-payload';

export type KupkollImportMetadata = {
  exportedAt?: string;
  schemaVersion?: number;
};

export type KupkollImportSuccess = {
  ok: true;
  state: KupkollAppState;
  metadata: KupkollImportMetadata;
  warnings: string[];
};

export type KupkollImportFailure = {
  ok: false;
  code: KupkollImportErrorCode;
  message: string;
};

export type KupkollImportResult = KupkollImportSuccess | KupkollImportFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildStateFromExportData(schemaVersion: number, data: unknown): KupkollAppState | null {
  if (!isRecord(data)) {
    return null;
  }

  return parsePersistedKupkollState({
    version: schemaVersion,
    apiaries: data.apiaries,
    hives: data.hives,
    inspections: data.inspections,
    events: data.events,
    manualTasks: data.manualTasks,
  });
}

function parseExportBundle(bundle: Record<string, unknown>): KupkollImportResult {
  if (bundle.app !== 'Kupkoll') {
    return {
      ok: false,
      code: 'unsupported-format',
      message: 'Filen verkar inte vara en Kupkoll-export.',
    };
  }

  if (typeof bundle.schemaVersion !== 'number' || !Number.isInteger(bundle.schemaVersion)) {
    return {
      ok: false,
      code: 'invalid-payload',
      message: 'Exportfilen saknar ett giltigt schemaVersion-värde.',
    };
  }

  const state = buildStateFromExportData(bundle.schemaVersion, bundle.data);

  if (!state) {
    return {
      ok: false,
      code: 'invalid-payload',
      message: 'Exportfilens innehåll kunde inte valideras.',
    };
  }

  const warnings: string[] = [];
  const counts = bundle.counts;

  if (isRecord(counts)) {
    const checks: Array<[label: keyof KupkollExportBundle['counts'], actual: number]> = [
      ['apiaries', state.apiaries.length],
      ['hives', state.hives.length],
      ['inspections', state.inspections.length],
      ['events', state.events.length],
      ['manualTasks', state.manualTasks.length],
    ];

    checks.forEach(([key, actual]) => {
      const expected = counts[key];

      if (typeof expected === 'number' && Number.isInteger(expected) && expected !== actual) {
        warnings.push(`Antalet ${key} i metadata (${expected}) matchar inte innehållet (${actual}).`);
      }
    });
  }

  return {
    ok: true,
    state,
    metadata: {
      exportedAt: typeof bundle.exportedAt === 'string' ? bundle.exportedAt : undefined,
      schemaVersion: bundle.schemaVersion,
    },
    warnings,
  };
}

export function parseKupkollImportPayload(payload: unknown): KupkollImportResult {
  if (!isRecord(payload)) {
    return {
      ok: false,
      code: 'unsupported-format',
      message: 'Importfilen måste innehålla ett JSON-objekt.',
    };
  }

  if ('app' in payload || 'schemaVersion' in payload || 'data' in payload) {
    return parseExportBundle(payload);
  }

  const state = parsePersistedKupkollState(payload);

  if (!state) {
    return {
      ok: false,
      code: 'invalid-payload',
      message: 'JSON-filen kunde inte tolkas som Kupkoll-data.',
    };
  }

  return {
    ok: true,
    state,
    metadata: {},
    warnings: [],
  };
}

export function parseKupkollImportJson(contents: string): KupkollImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(contents);
  } catch {
    return {
      ok: false,
      code: 'invalid-json',
      message: 'Filen innehåller inte giltig JSON.',
    };
  }

  return parseKupkollImportPayload(parsed);
}
