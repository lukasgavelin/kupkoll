import { router } from 'expo-router';
import { View } from 'react-native';

import { HiveCard } from '@/components/feature/Cards';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function HivesScreen() {
  const { apiaries, hives, getApiaryById } = useBeehaven();
  const hasApiaries = apiaries.length > 0;

  return (
    <Screen>
      <SectionHeader
        eyebrow="Kupor"
        title="Samhällesöversikt"
        description="Snabb överblick över samhällsläge, drottningstatus, kupsystem och senaste genomgång i ett tydligt raster."
      />
      <PrimaryButton fullWidth label="Lägg till kupa" onPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
      <View style={{ gap: theme.spacing.lg }}>
        {hives.length ? (
          hives.map((hive) => <HiveCard key={hive.id} apiaryName={getApiaryById(hive.apiaryId)?.name ?? 'Bigård'} hive={hive} />)
        ) : (
          <EmptyStateCard title={hasApiaries ? 'Inga kupor ännu' : 'Skapa först en bigård'} description={hasApiaries ? 'När appen får riktiga samhällen visas status, drottningläge, styrka och senaste genomgång här.' : 'En kupa behöver tillhöra en bigård. Börja därför med att skapa en plats för dina samhällen.'} actionLabel={hasApiaries ? 'Skapa första kupan' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
      </View>
    </Screen>
  );
}