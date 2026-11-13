import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';

import { ApiaryCard } from '@/components/feature/Cards';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getApiaryDisplayLocation } from '@/lib/selectors';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';

export default function ApiariesScreen() {
  const { apiaries, getHivesByApiary } = useKupkoll();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredApiaries = normalizedQuery
    ? apiaries.filter((apiary) => {
        const displayLocation = (getApiaryDisplayLocation(apiary) ?? '').toLowerCase();
        return (
          apiary.name.toLowerCase().includes(normalizedQuery) ||
          apiary.location.toLowerCase().includes(normalizedQuery) ||
          displayLocation.includes(normalizedQuery)
        );
      })
    : apiaries;

  return (
    <Screen>
      <SectionHeader
        eyebrow="Bigårdar"
        title="Dina bigårdar"
        description="Börja med platsen. Lägg sedan till kupor och logga händelser från rätt kupa."
      />
      <PrimaryButton fullWidth label="Lägg till bigård" onPress={() => router.push('/apiaries/new')} />
      {apiaries.length > 0 ? (
        <TextInput
          clearButtonMode="while-editing"
          onChangeText={setSearchQuery}
          placeholder="Sök bigård eller plats..."
          placeholderTextColor={theme.colors.textMuted}
          style={styles.searchInput}
          value={searchQuery}
        />
      ) : null}
      <View style={styles.list}>
        {filteredApiaries.length ? (
          filteredApiaries.map((apiary) => <ApiaryCard key={apiary.id} apiary={apiary} hiveCount={getHivesByApiary(apiary.id).length} />)
        ) : apiaries.length > 0 ? (
          <EmptyStateCard
            title="Inga bigårdar matchar sökningen"
            description="Prova att rensa söktexten för att visa alla bigårdar."
            actionLabel="Visa alla bigårdar"
            onActionPress={() => setSearchQuery('')}
          />
        ) : (
          <EmptyStateCard title="Inga bigårdar ännu" description="Lägg till din första bigård. Sedan kan du lägga till kupor och logga genomgångar och händelser." actionLabel="Lägg till första bigården" onActionPress={() => router.push('/apiaries/new')} />
        )}
      </View>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    searchInput: {
      ...theme.textStyles.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.surfaceRaised,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    list: {
      gap: theme.spacing.lg,
    },
  });
}