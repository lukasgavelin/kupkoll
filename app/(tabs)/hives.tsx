import { router } from 'expo-router';
import { View } from 'react-native';

import { HiveCard } from '@/components/feature/Cards';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function HivesScreen() {
  const { apiaries, hives, getApiaryById } = useKupkoll();
  const hasApiaries = apiaries.length > 0;

  return (
    <Screen>
      <SectionHeader
        eyebrow="Kupor"
        title="Dina kupor"
        description="Steg två i flödet är att lägga in kupan och nuvarande drottning. Därefter blir det logiskt att spara genomgångar, händelser och drottningbyten från varje kupa."
      />
      <PrimaryButton fullWidth label="Lägg till kupa" onPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
      <View style={{ gap: theme.spacing.lg }}>
        {hives.length ? (
          hives.map((hive) => <HiveCard key={hive.id} apiaryName={getApiaryById(hive.apiaryId)?.name ?? 'Bigård'} hive={hive} />)
        ) : (
          <EmptyStateCard title={hasApiaries ? 'Inga kupor ännu' : 'Lägg till första bigården'} description={hasApiaries ? 'Lägg till din första kupa och fyll i aktuell drottning. Sedan kan du logga genomgångar och drottningbyten på ett sätt som håller ihop historiken.' : 'Varje kupa behöver höra till en bigård. Börja därför med att lägga till platsen där kuporna står.'} actionLabel={hasApiaries ? 'Lägg till första kupan' : 'Lägg till bigård'} onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')} />
        )}
      </View>
    </Screen>
  );
}