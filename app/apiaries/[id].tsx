import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HiveCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function ApiaryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getApiaryById, getHivesByApiary } = useBeehaven();
  const apiary = getApiaryById(params.id);

  if (!apiary) {
    return (
      <Screen>
        <AppCard>
          <Text style={theme.textStyles.heading}>Bigården hittades inte</Text>
          <PrimaryButton label="Tillbaka" onPress={() => router.back()} />
        </AppCard>
      </Screen>
    );
  }

  const apiaryHives = getHivesByApiary(apiary.id);

  return (
    <Screen>
      <PrimaryButton label="Tillbaka" onPress={() => router.back()} variant="secondary" />
      <SectionHeader eyebrow="Bigårdsdetalj" title={apiary.name} description={apiary.location} />
      <AppCard>
        <Text style={theme.textStyles.heading}>Anteckningar</Text>
        <Text style={theme.textStyles.body}>{apiary.notes}</Text>
      </AppCard>
      <View style={styles.sectionList}>
        {apiaryHives.map((hive) => (
          <HiveCard key={hive.id} apiaryName={apiary.name} hive={hive} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionList: {
    gap: theme.spacing.md,
  },
});