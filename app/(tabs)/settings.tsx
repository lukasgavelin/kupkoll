import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { exportKupkollData } from '@/lib/export';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme, useThemeMode } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { isDarkMode, toggleThemeMode } = useThemeMode();
  const { apiaries, events, hives, inspections, manualTasks } = useKupkoll();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
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
            <View style={styles.exportMeta}>
              <Text style={theme.textStyles.caption}>Exporten skapas som JSON och fungerar som säkerhetskopia.</Text>
              {exportStatus ? <Text style={theme.textStyles.caption}>{exportStatus}</Text> : null}
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