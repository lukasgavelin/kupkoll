import { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { exportKupkollData } from '@/lib/export';
import { parseKupkollImportJson } from '@/lib/import';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme, useThemeMode } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, toggleThemeMode } = useThemeMode();
  const { apiaries, events, hives, inspections, manualTasks, replaceAllData } = useKupkoll();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const styles = createStyles(theme);
  const exportFacts = [
    { label: 'Bigårdar', value: apiaries.length, fullWidth: false },
    { label: 'Kupor', value: hives.length, fullWidth: false },
    { label: 'Genomgångar', value: inspections.length, fullWidth: true },
    { label: 'Händelser', value: events.length, fullWidth: false },
    { label: 'Manuella uppgifter', value: manualTasks.length, fullWidth: true },
  ];

  async function handleExport() {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setExportStatus(null);

    try {
      const result = await exportKupkollData({
        apiaries,
        hives,
        inspections,
        events,
        manualTasks,
      });

      setExportStatus(`${result.fileName} skapad.`);

      if (result.method === 'download') {
        Alert.alert('Export klar', 'JSON-filen har laddats ned till din enhet. Spara den som backup.');
        return;
      }

      if (result.method === 'share') {
        Alert.alert('Export klar', 'Delningsdialogen är öppen. Spara filen där du vill ha din backup.');
        return;
      }

      Alert.alert('Export klar', `Filen sparades i appens dokumentmapp.

${result.fileUri ?? 'Sökväg saknas.'}`);
    } catch {
      setExportStatus('Kunde inte skapa exportfilen.');
      Alert.alert('Export misslyckades', 'JSON-filen kunde inte skapas just nu. Försök igen om en stund.');
    } finally {
      setIsExporting(false);
    }
  }

  function confirmImport(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert('Ersätt data?', 'Import ersätter nuvarande data i appen med innehållet i filen.', [
        {
          text: 'Avbryt',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Importera',
          style: 'destructive',
          onPress: () => resolve(true),
        },
      ]);
    });
  }

  function decodeBase64(base64: string): string {
    if (typeof atob !== 'function') {
      throw new Error('Base64-avkodning stöds inte i den här miljön.');
    }

    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder('utf-8').decode(bytes);
  }

  async function readTextFromAsset(asset: DocumentPicker.DocumentPickerAsset): Promise<string> {
    if (asset.file && typeof asset.file.text === 'function') {
      return asset.file.text();
    }

    if (typeof asset.base64 === 'string' && asset.base64.length > 0) {
      return decodeBase64(asset.base64);
    }

    const sourceFile = new File(asset.uri);
    return sourceFile.text();
  }

  async function handleImport() {
    if (isImporting) {
      return;
    }

    setIsImporting(true);
    setImportStatus(null);

    try {
      const selected = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
        base64: Platform.OS === 'web',
      });

      if (selected.canceled) {
        return;
      }

      const asset = selected.assets[0];
      const fileContents = await readTextFromAsset(asset);
      const parsed = parseKupkollImportJson(fileContents);

      if (!parsed.ok) {
        setImportStatus('Importfilen kunde inte tolkas.');
        Alert.alert('Import misslyckades', parsed.message);
        return;
      }

      const shouldImport = await confirmImport();

      if (!shouldImport) {
        return;
      }

      replaceAllData(parsed.state);
      setImportStatus(`${asset.name ?? 'importfil'} importerad.`);

      if (parsed.warnings.length > 0) {
        Alert.alert('Import klar med varningar', parsed.warnings.join('\n'));
        return;
      }

      Alert.alert('Import klar', 'Backupfilen lästes in och appens data har uppdaterats.');
    } catch (error) {
      const detail = error instanceof Error && error.message ? error.message : null;
      setImportStatus(detail ? `Kunde inte läsa importfilen (${detail}).` : 'Kunde inte läsa importfilen.');
      Alert.alert('Import misslyckades', detail ? `JSON-filen kunde inte läsas in: ${detail}` : 'JSON-filen kunde inte läsas in just nu. Försök igen.');
    } finally {
      setIsImporting(false);
    }
  }

  async function openPrivacyPolicy() {
    const policyUrl = 'https://github.com/lukasgavelin/kupkoll/blob/master/INTEGRITETSPOLICY.md';

    const canOpen = await Linking.canOpenURL(policyUrl);

    if (!canOpen) {
      Alert.alert('Kunde inte öppna integritetspolicyn', 'Länken gick inte att öppna på enheten just nu.');
      return;
    }

    await Linking.openURL(policyUrl);
  }

  return (
    <Screen>
      <SectionHeader
        eyebrow="Inställningar"
        title="Backup och appval"
        description="Hantera tema, backup och integritetsinformation."
      />
      <View style={{ gap: theme.spacing.lg }}>
        <AppCard>
          <View style={styles.themeHeader}>
            <View style={styles.themeCopy}>
              <Text style={theme.textStyles.heading}>Mörkt läge</Text>
              <Text style={styles.infoItem}>Använd mörkt läge för en mörkare vy.</Text>
            </View>
            <Switch
              onValueChange={() => {
                void toggleThemeMode();
              }}
              thumbColor={isDarkMode ? theme.colors.surface : theme.colors.surfaceRaised}
              trackColor={{ false: theme.colors.borderStrong, true: theme.colors.accent }}
              value={isDarkMode}
            />
          </View>
        </AppCard>
        <AppCard>
          <View style={styles.backupIntro}>
            <Text style={theme.textStyles.heading}>Backup</Text>
            <Text style={theme.textStyles.body}>Spara en kopia av dina bigårdar, kupor, genomgångar, händelser och manuella uppgifter.</Text>
          </View>
          <View style={styles.exportFacts}>
            {exportFacts.map((fact) => (
              <View key={fact.label} style={[styles.exportFactCard, fact.fullWidth && styles.exportFactCardFullWidth]}>
                <Text style={styles.exportFactLabel}>{fact.label}</Text>
                <Text style={styles.exportFactValue}>{fact.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.exportAction}>
            <PrimaryButton
              fullWidth
              iconName="download-outline"
              label={isExporting ? 'Skapar export...' : 'Exportera som JSON'}
              onPress={() => {
                void handleExport();
              }}
            />
            <PrimaryButton
              fullWidth
              iconName="cloud-upload-outline"
              label={isImporting ? 'Importerar...' : 'Importera JSON-backup'}
              onPress={() => {
                void handleImport();
              }}
              variant="secondary"
            />
            <View style={styles.exportMeta}>
              <Text style={theme.textStyles.caption}>Exporten skapas som JSON och fungerar som säkerhetskopia.</Text>
              {exportStatus ? <Text style={theme.textStyles.caption}>{exportStatus}</Text> : null}
              <Text style={theme.textStyles.caption}>Import ersätter befintlig data i appen med innehållet i JSON-filen.</Text>
              {importStatus ? <Text style={theme.textStyles.caption}>{importStatus}</Text> : null}
            </View>
          </View>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Integritet</Text>
          <Text style={theme.textStyles.body}>Läs hur Kupkoll hanterar lagring, platsdata, väderhämtning och export.</Text>
          <PrimaryButton
            fullWidth
            label="Öppna integritetspolicy"
            onPress={() => {
              void openPrivacyPolicy();
            }}
            variant="secondary"
          />
        </AppCard>
      </View>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    themeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    themeCopy: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    backupIntro: {
      gap: theme.spacing.xs,
    },
    exportFacts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    exportFactCard: {
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 132,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surfaceMuted,
    },
    exportFactCardFullWidth: {
      flexBasis: '100%',
    },
    exportAction: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
    },
    exportMeta: {
      gap: theme.spacing.xs,
    },
    exportFactLabel: {
      ...theme.textStyles.caption,
      flex: 1,
      color: theme.colors.text,
    },
    exportFactValue: {
      ...theme.textStyles.caption,
      color: theme.colors.text,
      fontFamily: theme.fontFamilies.semibold,
      textAlign: 'right',
      minWidth: 16,
    },
    infoItem: {
      ...theme.textStyles.body,
      color: theme.colors.textMuted,
    },
  });
}