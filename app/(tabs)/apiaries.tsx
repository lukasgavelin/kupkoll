import { router } from 'expo-router';
import { View } from 'react-native';

import { ApiaryCard } from '@/components/feature/Cards';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function ApiariesScreen() {
  const { apiaries, getHivesByApiary } = useKupkoll();

  return (
    <Screen>
      <SectionHeader
        eyebrow="Bigårdar"
        title="Dina bigårdslägen"
        description="Varje bigård visar läge, dragförutsättningar och hur många samhällen som står där, utan onödigt brus."
      />
      <PrimaryButton fullWidth label="Lägg till bigård" onPress={() => router.push('/apiaries/new')} />
      <View style={{ gap: theme.spacing.lg }}>
        {apiaries.length ? (
          apiaries.map((apiary) => <ApiaryCard key={apiary.id} apiary={apiary} hiveCount={getHivesByApiary(apiary.id).length} />)
        ) : (
          <EmptyStateCard title="Inga bigårdar ännu" description="Appen är nu rensad från demo-data. Dina egna bigårdslägen kommer att listas här när du börjar registrera dem." actionLabel="Skapa första bigården" onActionPress={() => router.push('/apiaries/new')} />
        )}
      </View>
    </Screen>
  );
}