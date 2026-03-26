import { router, useLocalSearchParams } from 'expo-router';

import { QuickInspectionForm } from '@/components/feature/QuickInspectionForm';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';

export default function NewInspectionScreen() {
  const params = useLocalSearchParams<{ hiveId?: string }>();

  return (
    <Screen>
      <PrimaryButton label="Stäng" iconName="close" onPress={() => router.back()} variant="secondary" size="compact" />
      <QuickInspectionForm initialHiveId={params.hiveId} />
    </Screen>
  );
}