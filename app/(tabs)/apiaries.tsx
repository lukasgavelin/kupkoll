import { useMemo } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ApiaryCard } from '@/components/feature/Cards';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export default function ApiariesScreen() {
  const { apiaries, getHivesByApiary } = useKupkoll();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen>
      <SectionHeader
        eyebrow="Bigårdar"
        title="Dina bigårdar"
        description="Börja med platsen. Lägg sedan till kupor och logga händelser från rätt kupa."
      />
      <PrimaryButton fullWidth label="Lägg till bigård" onPress={() => router.push('/apiaries/new')} />
      <View style={styles.list}>
        {apiaries.length ? (
          apiaries.map((apiary) => <ApiaryCard key={apiary.id} apiary={apiary} hiveCount={getHivesByApiary(apiary.id).length} />)
        ) : (
          <EmptyStateCard title="Inga bigårdar ännu" description="Lägg till din första bigård. Sedan kan du lägga till kupor och logga genomgångar och händelser." actionLabel="Lägg till första bigården" onActionPress={() => router.push('/apiaries/new')} />
        )}
      </View>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    list: {
      gap: theme.spacing.lg,
    },
  });
}