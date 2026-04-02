import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { ApiaryLocationField } from '@/components/feature/ApiaryLocationField';
import { AppCard } from '@/components/ui/AppCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { ApiaryLocationDetails, Coordinates } from '@/types/domain';

export default function EditApiaryScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const { getApiaryById, updateApiary } = useKupkoll();
  const styles = createStyles(theme);
  const apiary = getApiaryById(params.id);
  const [name, setName] = useState(apiary?.name ?? '');
  const [location, setLocation] = useState(apiary?.location ?? '');
  const [notes, setNotes] = useState(apiary?.notes ?? '');
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>(apiary?.coordinates);
  const [locationDetails, setLocationDetails] = useState<ApiaryLocationDetails | undefined>(apiary?.locationDetails);

  function handleClose() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/apiaries');
  }

  function showFormAlert(title: string, message: string) {
    if (Platform.OS === 'web') {
      globalThis.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  }

  function resolveLocationLabel() {
    const trimmedLocation = location.trim();

    if (trimmedLocation) {
      return trimmedLocation;
    }

    const municipality = locationDetails?.municipality?.trim();

    if (municipality) {
      return municipality;
    }

    const locality = locationDetails?.locality?.trim();

    if (locality) {
      return locality;
    }

    return '';
  }

  if (!apiary) {
    return (
      <Screen>
        <AppCard>
          <Text style={theme.textStyles.heading}>Bigården hittades inte</Text>
          <PrimaryButton label="Tillbaka" onPress={handleClose} />
        </AppCard>
      </Screen>
    );
  }

  const apiaryId = apiary.id;

  function saveApiary() {
    const trimmedName = name.trim();
    const resolvedLocation = resolveLocationLabel();

    if (!trimmedName || !resolvedLocation) {
      showFormAlert('Fyll i det viktigaste', 'Ange namn och plats för bigården innan du sparar. Du kan skriva platsen manuellt eller använda Hämta min plats.');
      return;
    }

    updateApiary(apiaryId, {
      name: trimmedName,
      location: resolvedLocation,
      notes: notes.trim() || 'Ingen anteckning ännu.',
      coordinates,
      locationDetails,
    });

    router.replace(`/apiaries/${apiaryId}`);
  }

  return (
    <Screen>
      <PageHeader
        actionLabel="Stäng"
        actionIconName="close"
        onActionPress={handleClose}
        eyebrow="Redigera bigård"
        title="Ändra bigård"
        description="Justera namn, plats och anteckningar. Sparad position ger bättre väderstöd och råd."
      />

      <AppCard>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Namn</Text>
          <TextInput onChangeText={setName} placeholder="Till exempel Södra skogsbrynet" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={name} />
        </View>

        <ApiaryLocationField
          coordinates={coordinates}
          location={location}
          locationDetails={locationDetails}
          onCoordinatesChange={setCoordinates}
          onLocationChange={setLocation}
          onLocationDetailsChange={setLocationDetails}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Anteckning</Text>
          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={setNotes}
            placeholder="Valfritt: sådant du vill minnas om platsen"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.inputMultiline}
            textAlignVertical="top"
            value={notes}
          />
        </View>

        <PrimaryButton fullWidth label="Spara ändringar" onPress={saveApiary} />
      </AppCard>
    </Screen>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
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
}