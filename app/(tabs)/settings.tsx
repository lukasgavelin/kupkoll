import { Alert, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function SettingsScreen() {
  const { resetTabTutorial } = useKupkoll();

  async function showTutorialAgain() {
    await resetTabTutorial();
    router.navigate('/');
    Alert.alert('Guidning återställd', 'Startdialogen visas igen från Hem-fliken så att du kan välja att köra guidningen eller hoppa över.');
  }

  return (
    <Screen>
      <SectionHeader
        eyebrow="Inställningar"
        title="Biodlingsprofil"
        description="Den här versionen fokuserar på fältanvändning, svensk biodling och ett mer lågmält gränssnitt i dagsljus."
      />
      <View style={{ gap: theme.spacing.lg }}>
        <AppCard>
          <Text style={theme.textStyles.heading}>I den här versionen</Text>
          <Text style={theme.textStyles.body}>Hem, bigårdar, samhällsöversikt, snabba genomgångar och regelbaserade råd för svenska arbetsmoment.</Text>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Förberett för senare</Text>
          <Text style={theme.textStyles.body}>Väderintegration, dragprognos, offline-läge, sensordata, export/import och stöd för fler kupsystem.</Text>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Designriktning</Text>
          <Text style={theme.textStyles.body}>Lågmäld naturpalett, hög kontrast, stora tryckytor och enkel svenska för snabb användning ute bland kupor och skattlådor.</Text>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Guidning</Text>
          <Text style={theme.textStyles.body}>Visa flikguiden igen om du vill gå igenom appens fem huvudflikar på nytt.</Text>
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