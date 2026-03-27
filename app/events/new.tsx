import { router, useLocalSearchParams } from 'expo-router';

import { HiveEventForm } from '@/components/feature/HiveEventForm';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';

export default function NewHiveEventScreen() {
  const params = useLocalSearchParams<{ hiveId?: string; type?: string }>();

  return (
    <Screen>
      <PrimaryButton label="Stäng" iconName="close" onPress={() => router.back()} variant="secondary" size="compact" />
      <HiveEventForm initialHiveId={params.hiveId} initialType={params.type} />
    </Screen>
  );
}