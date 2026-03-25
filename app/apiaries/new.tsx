import { router } from 'expo-router';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { AppCard } from '@/components/ui/AppCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';

export default function NewApiaryScreen() {
  const { addApiary } = useBeehaven();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

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
      notes: notes.trim() || 'Ingen anteckning ännu.',
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
        description="Registrera platsen först. Därefter kan du lägga till kupor som hör till samma bigårdsläge."
      />

      <AppCard>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Namn</Text>
          <TextInput onChangeText={setName} placeholder="Till exempel Södra skogsbrynet" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={name} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Plats</Text>
          <TextInput onChangeText={setLocation} placeholder="Ort, område eller gårdsnamn" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={location} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Anteckning</Text>
          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={setNotes}
            placeholder="Valfritt: läge, dragförutsättningar eller annat som är bra att minnas"
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