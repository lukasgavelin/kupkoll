import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { HiveCard } from '@/components/feature/Cards';
import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { buildApiaryMapUrl, formatCoordinates } from '@/lib/mapLinks';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';

export default function ApiaryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { deleteApiary, getApiaryById, getHivesByApiary } = useKupkoll();
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
  const mapUrl = buildApiaryMapUrl(apiary.location, apiary.coordinates);

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

  async function openMap() {
    if (!mapUrl) {
      Alert.alert('Ingen plats att visa', 'Bigården saknar plats som kan öppnas i karta.');
      return;
    }

    const canOpen = await Linking.canOpenURL(mapUrl);

    if (!canOpen) {
      Alert.alert('Kunde inte öppna karta', 'Det gick inte att öppna kartlänken på enheten.');
      return;
    }

    await Linking.openURL(mapUrl);
  }

  return (
    <Screen>
      <PageHeader actionLabel="Tillbaka" actionIconName="chevron-back" onActionPress={() => router.back()} eyebrow="Bigård" title={apiary.name} description={apiary.location} />
      <AppCard>
        <Text style={theme.textStyles.heading}>Om platsen</Text>
        {apiary.coordinates ? <Text style={theme.textStyles.caption}>GPS-position: {formatCoordinates(apiary.coordinates)}</Text> : null}
        <Text style={theme.textStyles.body}>{apiary.notes}</Text>
        {mapUrl ? <PrimaryButton fullWidth label="Öppna plats i karta" onPress={() => {
          void openMap();
        }} variant="secondary" iconName="map-outline" /> : null}
        <PrimaryButton fullWidth label="Lägg till kupa" onPress={() => router.push(`/hives/new?apiaryId=${apiaryId}`)} />
        <PrimaryButton fullWidth label="Redigera bigård" onPress={() => router.push(`/apiaries/${apiaryId}/edit`)} variant="secondary" />
        <PrimaryButton fullWidth label="Ta bort bigård" onPress={confirmDelete} variant="ghost" />
      </AppCard>
      <AppCard>
        <Text style={theme.textStyles.heading}>Nästa steg</Text>
        <Text style={theme.textStyles.body}>
          {apiaryHives.length
            ? 'Öppna en kupa när du vill spara genomgång, uppdatera drottninguppgifter eller logga ett drottningbyte.'
            : 'Lägg till första kupan i bigården. Där fyller du också i aktuell drottning, så att nästa steg blir enkelt när ett byte behöver loggas.'}
        </Text>
        <PrimaryButton fullWidth label={apiaryHives.length ? 'Lägg till en till kupa' : 'Lägg till första kupan'} onPress={() => router.push(`/hives/new?apiaryId=${apiaryId}`)} />
      </AppCard>
      <View style={styles.sectionList}>
        {apiaryHives.length ? apiaryHives.map((hive) => <HiveCard key={hive.id} apiaryName={apiary.name} hive={hive} />) : <EmptyStateCard title="Inga kupor här ännu" description="Lägg till den första kupan i bigården så blir det lättare att följa upp platsen över tid." />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionList: {
    gap: theme.spacing.lg,
  },
});