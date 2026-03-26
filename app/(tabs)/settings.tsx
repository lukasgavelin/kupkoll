import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';

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
  const { apiaries, hives, inspections, manualTasks, resetTabTutorial } = useKupkoll();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const styles = createStyles(theme);

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

  async function openGithub() {
    const repositoryUrl = 'https://github.com/lukasgavelin/kupkoll';

    const canOpen = await Linking.canOpenURL(repositoryUrl);

    if (!canOpen) {
      Alert.alert('Kunde inte öppna GitHub', 'Länken gick inte att öppna på enheten just nu.');
      return;
    }

    await Linking.openURL(repositoryUrl);
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
        title="Backup och guidning"
        description="Här hittar du det som hjälper dig att hantera appen: spara en backup och visa guidningen igen om du vill."
      />
      <View style={{ gap: theme.spacing.lg }}>
        <AppCard>
          <View style={styles.themeHeader}>
            <View style={styles.themeCopy}>
              <Text style={theme.textStyles.heading}>Mörkt läge</Text>
              <Text style={styles.infoItem}>Slå på mörkt läge om du vill ha en mörkare vy som är behagligare i svagt ljus.</Text>
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
            <Text style={theme.textStyles.body}>Spara en kopia av dina bigårdar, kupor, genomgångar och manuella uppgifter, så att informationen finns kvar även utanför telefonen eller webben.</Text>
          </View>
          <View style={styles.exportFacts}>
            <Text style={styles.exportFact}>Bigårdar: {apiaries.length}</Text>
            <Text style={styles.exportFact}>Kupor: {hives.length}</Text>
            <Text style={styles.exportFact}>Genomgångar: {inspections.length}</Text>
            <Text style={styles.exportFact}>Manuella uppgifter: {manualTasks.length}</Text>
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
              <Text style={theme.textStyles.caption}>Exporten skapas som en JSON-fil och fungerar bäst som säkerhetskopia av det du själv har sparat i appen.</Text>
              {exportStatus ? <Text style={theme.textStyles.caption}>{exportStatus}</Text> : null}
            </View>
          </View>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Skapad av Lukas Gavelin</Text>
          <Text style={theme.textStyles.body}>Kupkoll är skapad av Lukas Gavelin för att vara enkel, tydlig och användbar direkt ute vid kuporna.</Text>
          <Pressable
            onPress={() => {
              void openGithub();
            }}
            style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          >
            <Text style={styles.linkLabel}>GitHub:</Text>
            <Text style={styles.linkText}>github.com/lukasgavelin/kupkoll</Text>
          </Pressable>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Integritet</Text>
          <Text style={theme.textStyles.body}>Läs hur Kupkoll hanterar lokal lagring, platsuppgifter, väderhämtning, export och länkar till externa tjänster.</Text>
          <PrimaryButton
            fullWidth
            label="Öppna integritetspolicy"
            onPress={() => {
              void openPrivacyPolicy();
            }}
            variant="secondary"
          />
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
    exportAction: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
    },
    exportMeta: {
      gap: theme.spacing.xs,
    },
    exportFact: {
      ...theme.textStyles.caption,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.surfaceMuted,
      color: theme.colors.text,
    },
    infoItem: {
      ...theme.textStyles.body,
      color: theme.colors.textMuted,
    },
    linkRow: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    linkLabel: {
      ...theme.textStyles.caption,
      color: theme.colors.textMuted,
    },
    linkText: {
      ...theme.textStyles.caption,
      color: theme.colors.accent,
    },
    linkPressed: {
      opacity: 0.8,
    },
  });
}