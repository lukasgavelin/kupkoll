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
        title="Dina bigårdar"
        description="Här börjar flödet. Lägg först till platsen, sedan kuporna i varje bigård och logga därefter större händelser som drottningbyte från rätt kupa."
      />
      <PrimaryButton fullWidth label="Lägg till bigård" onPress={() => router.push('/apiaries/new')} />
      <View style={{ gap: theme.spacing.lg }}>
        {apiaries.length ? (
          apiaries.map((apiary) => <ApiaryCard key={apiary.id} apiary={apiary} hiveCount={getHivesByApiary(apiary.id).length} />)
        ) : (
          <EmptyStateCard title="Inga bigårdar ännu" description="Börja med din första bigård. När platsen finns kan du lägga till kupor och sedan logga genomgångar och drottningbyten i rätt ordning." actionLabel="Lägg till första bigården" onActionPress={() => router.push('/apiaries/new')} />
        )}
      </View>
    </Screen>
  );
}