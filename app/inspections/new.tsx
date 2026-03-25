import { router, useLocalSearchParams } from 'expo-router';

import { QuickInspectionForm } from '@/components/feature/QuickInspectionForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';

export default function NewInspectionScreen() {
  const params = useLocalSearchParams<{ hiveId?: string }>();

  return (
    <Screen>
      <PageHeader
        actionLabel="Stäng"
        actionIconName="close"
        onActionPress={() => router.back()}
        eyebrow="30-sekundersflöde"
        title="Logga genomgång snabbt"
        description="Välj kupa, tryck in läget och spara. Flödet är anpassat för stora tryckytor och få beslut ute i fält."
      />
      <QuickInspectionForm initialHiveId={params.hiveId} />
    </Screen>
  );
}