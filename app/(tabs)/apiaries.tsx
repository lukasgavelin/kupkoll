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
        description="Här samlar du platserna där dina kupor står, så att du lätt hittar rätt och håller ordning på varje ställe."
      />
      <PrimaryButton fullWidth label="Lägg till bigård" onPress={() => router.push('/apiaries/new')} />
      <View style={{ gap: theme.spacing.lg }}>
        {apiaries.length ? (
          apiaries.map((apiary) => <ApiaryCard key={apiary.id} apiary={apiary} hiveCount={getHivesByApiary(apiary.id).length} />)
        ) : (
          <EmptyStateCard title="Inga bigårdar ännu" description="Lägg till din första bigård för att börja samla kupor, anteckningar och genomgångar på rätt plats." actionLabel="Lägg till första bigården" onActionPress={() => router.push('/apiaries/new')} />
        )}
      </View>
    </Screen>
  );
}