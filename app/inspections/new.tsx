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
        eyebrow="Snabb genomgång"
        title="Spara en snabb koll"
        description="Välj kupa, markera hur läget känns och spara direkt. Tanken är att det ska gå snabbt ute vid kuporna."
      />
      <QuickInspectionForm initialHiveId={params.hiveId} />
    </Screen>
  );
}