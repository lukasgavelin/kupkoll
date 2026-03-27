import { router, useLocalSearchParams } from 'expo-router';

import { QuickInspectionForm } from '@/components/feature/QuickInspectionForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';

export default function NewInspectionScreen() {
  const params = useLocalSearchParams<{ hiveId?: string }>();
  const { getApiaryById, getHiveById } = useKupkoll();
  const hive = params.hiveId ? getHiveById(params.hiveId) : undefined;
  const apiary = hive ? getApiaryById(hive.apiaryId) : undefined;
  const description = hive
    ? `${hive.name}${apiary ? ` · ${apiary.name}` : ''}. Börja med att välja typ av genomgång och bekräfta sedan läget steg för steg.`
    : 'Välj kupa och spara det du såg vid besöket. Genomgången uppdaterar kupans aktuella läge direkt.';

  return (
    <Screen>
      <PageHeader actionLabel="Stäng" actionIconName="close" onActionPress={() => router.back()} eyebrow="Ny genomgång" title="Logga genomgång" description={description} />
      <QuickInspectionForm initialHiveId={params.hiveId} />
    </Screen>
  );
}