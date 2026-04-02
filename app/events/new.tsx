import { router, useLocalSearchParams } from 'expo-router';

import { HiveEventForm } from '@/components/feature/HiveEventForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';

export default function NewHiveEventScreen() {
  const params = useLocalSearchParams<{ hiveId?: string; type?: string }>();
  const { getApiaryById, getHiveById } = useKupkoll();
  const hive = params.hiveId ? getHiveById(params.hiveId) : undefined;
  const apiary = hive ? getApiaryById(hive.apiaryId) : undefined;
  const description = hive
    ? `${hive.name}${apiary ? ` · ${apiary.name}` : ''}. Logga händelser när något har förändrats i samhället.`
    : 'Välj kupa och logga händelser som påverkar samhällets historik.';

  return (
    <Screen>
      <PageHeader actionLabel="Stäng" actionIconName="close" onActionPress={() => router.back()} eyebrow="Ny händelse" title="Logga händelse" description={description} />
      <HiveEventForm initialHiveId={params.hiveId} initialType={params.type} />
    </Screen>
  );
}