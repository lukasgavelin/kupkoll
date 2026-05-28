import { router, useLocalSearchParams } from 'expo-router';

import { QuickInspectionForm } from '@/components/feature/QuickInspectionForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';

export default function NewInspectionScreen() {
  const params = useLocalSearchParams<{ hiveId?: string }>();
  const { getApiaryById, getHiveById, dashboard } = useKupkoll();
  const hive = params.hiveId ? getHiveById(params.hiveId) : undefined;
  const apiary = hive ? getApiaryById(hive.apiaryId) : undefined;
  const isFirstInspection = dashboard.latestInspections.length === 0;

  let description = hive
    ? `${hive.name}${apiary ? ` · ${apiary.name}` : ''}. Välj typ av genomgång och bekräfta läget.`
    : 'Välj kupa och logga det du såg vid besöket.';

  if (isFirstInspection) {
    description = `Steg 3 av 3. ${description}`;
  }

  return (
    <Screen>
      <PageHeader actionLabel="Stäng" actionIconName="close" onActionPress={() => router.back()} eyebrow="Inspektion" title="Ny genomgång" description={description} />
      <QuickInspectionForm initialHiveId={params.hiveId} />
    </Screen>
  );
}