import { Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { theme } from '@/theme';

export default function SettingsScreen() {
  return (
    <Screen>
      <SectionHeader
        eyebrow="Inställningar"
        title="MVP-status"
        description="Första versionen fokuserar på fältanvändning, svensk biodling och tydligt beslutsstöd."
      />
      <View style={{ gap: theme.spacing.md }}>
        <AppCard>
          <Text style={theme.textStyles.heading}>I den här versionen</Text>
          <Text style={theme.textStyles.body}>Hem, bigårdar, kupor, uppgifter, snabb inspektion och regelbaserade råd.</Text>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Förberett för senare</Text>
          <Text style={theme.textStyles.body}>Väderintegration, dragprognos, offline-läge, sensordata, export/import och AI-bildanalys.</Text>
        </AppCard>
        <AppCard>
          <Text style={theme.textStyles.heading}>Designriktning</Text>
          <Text style={theme.textStyles.body}>Lågmäld naturpalett, hög kontrast, stora tryckytor och enkel svenska för snabb användning ute i solljus.</Text>
        </AppCard>
      </View>
    </Screen>
  );
}