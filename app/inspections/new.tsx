import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { QuickInspectionForm } from '@/components/feature/QuickInspectionForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { confirmDestructiveAction } from '@/lib/confirm';
import { safeGoBack } from '@/lib/navigation';
import { useKupkoll } from '@/store/KupkollContext';

export default function NewInspectionScreen() {
  const params = useLocalSearchParams<{ hiveId?: string }>();
  const { getApiaryById, getHiveById, dashboard } = useKupkoll();
  const [hasUnsavedPhotos, setHasUnsavedPhotos] = useState(false);
  const hive = params.hiveId ? getHiveById(params.hiveId) : undefined;
  const apiary = hive ? getApiaryById(hive.apiaryId) : undefined;
  const isFirstInspection = dashboard.latestInspections.length === 0;

  let description = hive
    ? `${hive.name}${apiary ? ` · ${apiary.name}` : ''}. Välj typ av genomgång och bekräfta läget.`
    : 'Välj kupa och logga det du såg vid besöket.';

  if (isFirstInspection) {
    description = `Steg 3 av 3. ${description}`;
  }

  async function handleClose() {
    if (hasUnsavedPhotos) {
      const discard = await confirmDestructiveAction({
        title: 'Kassera osparade bilder?',
        message: 'Du har lagt till foton i denna genomgång som inte är sparade ännu.',
        confirmLabel: 'Stäng ändå',
        cancelLabel: 'Fortsätt redigera',
      });
      if (!discard) {
        return;
      }
    }
    safeGoBack(params.hiveId ? `/hives/${params.hiveId}` : '/hives');
  }

  return (
    <Screen>
      <PageHeader actionLabel="Stäng" actionIconName="close" onActionPress={() => { void handleClose(); }} eyebrow="Inspektion" title="Ny genomgång" description={description} />
      <QuickInspectionForm initialHiveId={params.hiveId} onUnsavedPhotosChange={setHasUnsavedPhotos} />
    </Screen>
  );
}