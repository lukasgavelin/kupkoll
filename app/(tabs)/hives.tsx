import { View } from 'react-native';

import { HiveCard } from '@/components/feature/Cards';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function HivesScreen() {
  const { hives, getApiaryById } = useBeehaven();

  return (
    <Screen>
      <SectionHeader
        eyebrow="Kupor"
        title="Samhällesöversikt"
        description="Snabb överblick över status, drottningläge, styrka och senaste inspektion."
      />
      <View style={{ gap: theme.spacing.md }}>
        {hives.map((hive) => (
          <HiveCard key={hive.id} apiaryName={getApiaryById(hive.apiaryId)?.name ?? 'Bigård'} hive={hive} />
        ))}
      </View>
    </Screen>
  );
}