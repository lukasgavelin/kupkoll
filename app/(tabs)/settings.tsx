import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { exportKupkollData } from '@/lib/export';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function SettingsScreen() {
  const { apiaries, hives, inspections, manualTasks, resetTabTutorial } = useKupkoll();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  async function showTutorialAgain() {
    await resetTabTutorial();
    router.navigate('/');
    Alert.alert('Guidning återställd', 'När du kommer tillbaka till Hem visas rundturen igen, så att du kan gå igenom flikarna på nytt om du vill.');
  }

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
        manualTasks,
      });

      setExportStatus(`${result.fileName} skapad.`);

      if (result.method === 'download') {
        Alert.alert('Export klar', 'JSON-filen har laddats ned till din enhet. Öppna den i en texteditor om du vill läsa innehållet, eller spara den som backup.');
        return;
      }

      if (result.method === 'share') {
        Alert.alert('Export klar', 'Delningsdialogen öppnades. Spara filen i Filer, Drive eller mejla den till dig själv för att behålla en backup.');
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

  return (
    <Screen>
      <SectionHeader
        eyebrow="Inställningar"
        title="Backup och guidning"
        description="Här hittar du det som hjälper dig att hantera appen: spara en backup och visa guidningen igen om du vill."
      />
      <View style={{ gap: theme.spacing.lg }}>
        <AppCard>
          <Text style={theme.textStyles.heading}>Backup</Text>
          <Text style={theme.textStyles.body}>Spara en kopia av det du har lagt in i appen, så att du har informationen kvar även utanför telefonen eller webben.</Text>
          <View style={styles.exportFacts}>
            <Text style={styles.exportFact}>Bigårdar: {apiaries.length}</Text>
            <Text style={styles.exportFact}>Kupor: {hives.length}</Text>
            <Text style={styles.exportFact}>Genomgångar: {inspections.length}</Text>
            <Text style={styles.exportFact}>Uppgifter: {manualTasks.length}</Text>
          </View>
          <PrimaryButton
            fullWidth
            iconName="download-outline"
            label={isExporting ? 'Skapar export...' : 'Exportera som JSON'}
            onPress={() => {
              void handleExport();
            }}
          />
          <Text style={theme.textStyles.caption}>Exporten skapas som en JSON-fil och fungerar bäst som säkerhetskopia av det du har sparat.</Text>
          {exportStatus ? <Text style={theme.textStyles.caption}>{exportStatus}</Text> : null}
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Guidning</Text>
          <Text style={theme.textStyles.body}>Visa den korta guidningen igen om du vill få en påminnelse om hur flikarna är tänkta att användas.</Text>
          <PrimaryButton
            fullWidth
            label="Visa flikguide igen"
            onPress={() => {
              void showTutorialAgain();
            }}
            variant="secondary"
          />
        </AppCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  exportFacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  exportFact: {
    ...theme.textStyles.caption,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceMuted,
    color: theme.colors.text,
  },
});