import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { InspectionSnapshot } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function HiveInspectionHistoryScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { getHiveById, getInspectionsForHive } = useKupkoll();
  const hive = getHiveById(params.id);

  if (!hive) {
    return (
      <Screen>
        <AppCard>
          <Text style={theme.textStyles.heading}>Kupan hittades inte</Text>
          <PrimaryButton label="Tillbaka" onPress={() => router.back()} />
        </AppCard>
      </Screen>
    );
  }

  const inspections = getInspectionsForHive(hive.id);

  return (
    <Screen>
      <PageHeader
        actionLabel="Tillbaka"
        actionIconName="chevron-back"
        onActionPress={() => router.back()}
        eyebrow="Genomgångar"
        title={`Historik för ${hive.name}`}
        description="Här kan du gå tillbaka och se vad du har noterat tidigare, med senaste genomgången överst."
      />

      <View style={styles.list}>
        {inspections.length ? (
          inspections.map((inspection) => <InspectionSnapshot key={inspection.id} inspection={inspection} />)
        ) : (
          <EmptyStateCard title="Ingen historik ännu" description="När du har sparat genomgångar för kupan samlas de här i den ordning de gjordes." />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.lg,
  },
});