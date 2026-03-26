import { router } from 'expo-router';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { ApiaryLocationField } from '@/components/feature/ApiaryLocationField';
import { AppCard } from '@/components/ui/AppCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';
import { Coordinates } from '@/types/domain';

export default function NewApiaryScreen() {
  const { addApiary } = useKupkoll();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(undefined);

  function saveApiary() {
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName || !trimmedLocation) {
      Alert.alert('Fyll i det viktigaste', 'Ange namn och plats för bigården innan du sparar.');
      return;
    }

    const apiary = addApiary({
      name: trimmedName,
      location: trimmedLocation,
      notes: notes.trim() || 'Lägg gärna till en anteckning om platsen senare om du vill.',
      coordinates,
    });

    router.replace(`/apiaries/${apiary.id}`);
  }

  return (
    <Screen>
      <PageHeader
        actionLabel="Stäng"
        actionIconName="close"
        onActionPress={() => router.back()}
        eyebrow="Ny bigård"
        title="Lägg till bigård"
        description="Börja med platsen där kuporna står. Om du också sparar positionen kan appen ge bättre väderstöd och mer träffsäkra råd för kuporna här."
      />

      <AppCard>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Namn</Text>
          <TextInput onChangeText={setName} placeholder="Till exempel Södra skogsbrynet" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={name} />
        </View>

        <ApiaryLocationField coordinates={coordinates} location={location} onCoordinatesChange={setCoordinates} onLocationChange={setLocation} />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Anteckning</Text>
          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={setNotes}
            placeholder="Valfritt: hur platsen känns, hur du hittar hit eller annat som är bra att minnas"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.inputMultiline}
            textAlignVertical="top"
            value={notes}
          />
        </View>

        <PrimaryButton fullWidth label="Spara bigård" onPress={saveApiary} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.textStyles.label,
    color: theme.colors.textMuted,
  },
  input: {
    minHeight: 56,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.textStyles.body,
  },
  inputMultiline: {
    minHeight: 120,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.textStyles.body,
  },
});