import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { KupkollAppState } from '@/lib/storage';

const KUPKOLL_EXPORT_SCHEMA_VERSION = 2;

export type KupkollExportBundle = {
  app: 'Kupkoll';
  exportedAt: string;
  schemaVersion: number;
  counts: {
    apiaries: number;
    hives: number;
    inspections: number;
    manualTasks: number;
  };
  data: KupkollAppState;
};

export type KupkollExportResult = {
  fileName: string;
  method: 'download' | 'share' | 'saved';
  fileUri?: string;
};

function cloneState(state: KupkollAppState): KupkollAppState {
  return {
    apiaries: state.apiaries.map((apiary) => ({
      ...apiary,
      coordinates: apiary.coordinates ? { ...apiary.coordinates } : undefined,
    })),
    hives: state.hives.map((hive) => ({ ...hive })),
    inspections: state.inspections.map((inspection) => ({ ...inspection })),
    manualTasks: state.manualTasks.map((task) => ({ ...task })),
  };
}

export function buildKupkollExport(state: KupkollAppState, exportedAt = new Date().toISOString()): KupkollExportBundle {
  const data = cloneState(state);

  return {
    app: 'Kupkoll',
    exportedAt,
    schemaVersion: KUPKOLL_EXPORT_SCHEMA_VERSION,
    counts: {
      apiaries: data.apiaries.length,
      hives: data.hives.length,
      inspections: data.inspections.length,
      manualTasks: data.manualTasks.length,
    },
    data,
  };
}

export function formatKupkollExportFileName(date = new Date()) {
  return `kupkoll-export-${date.toISOString().slice(0, 10)}.json`;
}

export function serializeKupkollExport(bundle: KupkollExportBundle) {
  return JSON.stringify(bundle, null, 2);
}

function downloadWebFile(fileName: string, contents: string) {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Web export is unavailable in this environment.');
  }

  const blob = new Blob([contents], { type: 'application/json;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

export async function exportKupkollData(state: KupkollAppState): Promise<KupkollExportResult> {
  const now = new Date();
  const fileName = formatKupkollExportFileName(now);
  const contents = serializeKupkollExport(buildKupkollExport(state, now.toISOString()));

  if (Platform.OS === 'web') {
    downloadWebFile(fileName, contents);

    return {
      fileName,
      method: 'download',
    };
  }

  const exportDirectory = new Directory(Paths.document, 'exports');
  exportDirectory.create({ idempotent: true, intermediates: true });

  const exportFile = new File(exportDirectory, fileName);
  exportFile.create({ overwrite: true });
  exportFile.write(contents);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(exportFile.uri, {
      dialogTitle: 'Exportera Kupkoll-data',
      mimeType: 'application/json',
      UTI: 'public.json',
    });

    return {
      fileName,
      method: 'share',
      fileUri: exportFile.uri,
    };
  }

  return {
    fileName,
    method: 'saved',
    fileUri: exportFile.uri,
  };
}