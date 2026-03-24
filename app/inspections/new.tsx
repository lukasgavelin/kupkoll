import { router, useLocalSearchParams } from 'expo-router';

import { QuickInspectionForm } from '@/components/feature/QuickInspectionForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';

export default function NewInspectionScreen() {
  const params = useLocalSearchParams<{ hiveId?: string }>();

  return (
    <Screen>
      <PageHeader actionLabel="Stäng" actionIconName="close" onActionPress={() => router.back()} eyebrow="Snabb loggning" title="Registrera inspektion" description="Förenklad för att fungera snabbt och tydligt även ute i bigården." />
      <QuickInspectionForm initialHiveId={params.hiveId} />
    </Screen>
  );
}