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
        title="Inställningar och hjälp"
        description="Här kan du ta backup på din information och få en snabb överblick över vad appen hjälper dig med."
      />
      <View style={{ gap: theme.spacing.lg }}>
        <AppCard>
          <Text style={theme.textStyles.heading}>Det här kan du göra</Text>
          <Text style={theme.textStyles.body}>Samla bigårdar och kupor, spara snabba genomgångar och få hjälp att minnas vad som kan vara bra att följa upp.</Text>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Dataexport</Text>
          <Text style={theme.textStyles.body}>Skapa en backup av det du har lagt in i appen, så att du har informationen sparad även utanför telefonen eller webben.</Text>
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
          {exportStatus ? <Text style={theme.textStyles.caption}>{exportStatus}</Text> : null}
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Mer hjälp längre fram</Text>
          <Text style={theme.textStyles.body}>Appen är byggd för att kunna växa med mer stöd längre fram, till exempel fler väderfunktioner, import och fler sätt att arbeta med kupor.</Text>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Om exportfilen</Text>
          <Text style={theme.textStyles.body}>Exporten skapas som en fil med allt du har sparat i appen. Den passar bäst som säkerhetskopia och för framtida import.</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>1. Tryck på Exportera som JSON.</Text>
            <Text style={styles.infoItem}>2. Spara filen där du lätt hittar den igen, till exempel i Filer, Drive eller mejl.</Text>
            <Text style={styles.infoItem}>3. Behåll filen som backup om du vill känna dig trygg med att informationen finns kvar.</Text>
            <Text style={styles.infoItem}>4. Du behöver normalt inte öppna filen, men det går om du vill läsa innehållet.</Text>
          </View>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Tänkt för enkel användning</Text>
          <Text style={theme.textStyles.body}>Gränssnittet är gjort för att vara lätt att läsa ute vid kuporna, med tydliga knappar och enkel svenska.</Text>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Guidning</Text>
          <Text style={theme.textStyles.body}>Visa den korta guidningen igen om du vill få en påminnelse om vad varje flik används till.</Text>
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
  infoList: {
    gap: theme.spacing.sm,
  },
  infoItem: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
  },
});