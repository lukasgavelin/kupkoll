import { View } from 'react-native';

import { ApiaryCard } from '@/components/feature/Cards';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function ApiariesScreen() {
  const { apiaries, getHivesByApiary } = useBeehaven();

  return (
    <Screen>
      <SectionHeader
        eyebrow="Bigårdar"
        title="Dina bigårdslägen"
        description="Varje bigård visar läge, dragförutsättningar och hur många samhällen som står där, utan onödigt brus."
      />
      <View style={{ gap: theme.spacing.lg }}>
        {apiaries.map((apiary) => (
          <ApiaryCard key={apiary.id} apiary={apiary} hiveCount={getHivesByApiary(apiary.id).length} />
        ))}
      </View>
    </Screen>
  );
}