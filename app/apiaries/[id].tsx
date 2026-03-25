import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { HiveCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function ApiaryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { deleteApiary, getApiaryById, getHivesByApiary } = useBeehaven();
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

  const apiaryId = apiary.id;
  const apiaryHives = getHivesByApiary(apiary.id);

  function confirmDelete() {
    const hiveList = apiaryHives.map((hive) => `• ${hive.name}`).join('\n');
    const deleteMessage = apiaryHives.length
      ? `Bigården tas bort tillsammans med följande kupor:\n\n${hiveList}\n\nTillhörande genomgångar och manuella uppgifter rensas också.`
      : 'Bigården tas bort permanent.';

    Alert.alert(
      'Ta bort bigård?',
      deleteMessage,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: () => {
            deleteApiary(apiaryId);
            router.replace('/apiaries');
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <PageHeader actionLabel="Tillbaka" actionIconName="chevron-back" onActionPress={() => router.back()} eyebrow="Bigårdsdetalj" title={apiary.name} description={apiary.location} />
      <AppCard>
        <Text style={theme.textStyles.heading}>Läge och förutsättningar</Text>
        <Text style={theme.textStyles.body}>{apiary.notes}</Text>
        <PrimaryButton fullWidth label="Lägg till kupa" onPress={() => router.push(`/hives/new?apiaryId=${apiaryId}`)} />
        <PrimaryButton fullWidth label="Redigera bigård" onPress={() => router.push(`/apiaries/${apiaryId}/edit`)} variant="secondary" />
        <PrimaryButton fullWidth label="Ta bort bigård" onPress={confirmDelete} variant="ghost" />
      </AppCard>
      <View style={styles.sectionList}>
        {apiaryHives.length ? apiaryHives.map((hive) => <HiveCard key={hive.id} apiaryName={apiary.name} hive={hive} />) : <EmptyStateCard title="Inga kupor i bigården ännu" description="Lägg till första kupan för att börja logga genomgångar och få beslutstöd för platsen." />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionList: {
    gap: theme.spacing.lg,
  },
});