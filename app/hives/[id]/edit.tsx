import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { AppCard } from '@/components/ui/AppCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';
import { theme } from '@/theme';
import { HiveBoxSystem, HiveStrength, HiveTemperament } from '@/types/domain';

const hiveStrengths: HiveStrength[] = ['Svagt', 'Medel', 'Starkt'];
const hiveTemperaments: HiveTemperament[] = ['Lugnt', 'Vaksamt', 'Hetsigt'];
const hiveBoxSystems: HiveBoxSystem[] = ['Lågnormal', 'Svea', 'Langstroth', 'Dadant'];

export default function EditHiveScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { apiaries, getHiveById, getApiaryById, updateHive } = useKupkoll();
  const hive = getHiveById(params.id);
  const [selectedApiaryId, setSelectedApiaryId] = useState(hive?.apiaryId ?? apiaries[0]?.id ?? '');
  const [name, setName] = useState(hive?.name ?? '');
  const [strength, setStrength] = useState<HiveStrength>(hive?.strength ?? 'Medel');
  const [temperament, setTemperament] = useState<HiveTemperament>(hive?.temperament ?? 'Lugnt');
  const [boxSystem, setBoxSystem] = useState<HiveBoxSystem>(hive?.boxSystem ?? 'Lågnormal');
  const [notes, setNotes] = useState(hive?.notes ?? '');

  if (!hive) {
    return (
      <Screen>
        <AppCard>
          <Text style={theme.textStyles.heading}>Kupan hittades inte</Text>
          <PrimaryButton label="Tillbaka" onPress={() => router.back()} />
        </AppCard>
      </Screen>
    );
  }

  const hiveId = hive.id;

  function saveHive() {
    const trimmedName = name.trim();

    if (!selectedApiaryId) {
      Alert.alert('Välj bigård', 'Kupan behöver tillhöra en bigård innan du sparar.');
      return;
    }

    if (!trimmedName) {
      Alert.alert('Namn saknas', 'Ange ett namn eller nummer för kupan innan du sparar.');
      return;
    }

    updateHive(hiveId, {
      apiaryId: selectedApiaryId,
      name: trimmedName,
      strength,
      temperament,
      boxSystem,
      notes: notes.trim() || 'Lägg gärna till en anteckning om kupan senare om du vill.',
    });

    router.replace(`/hives/${hiveId}`);
  }

  return (
    <Screen>
      <PageHeader
        actionLabel="Stäng"
        actionIconName="close"
        onActionPress={() => router.back()}
        eyebrow="Redigera kupa"
        title="Ändra kupa"
        description={selectedApiaryId ? `Kupan hör till ${getApiaryById(selectedApiaryId)?.name ?? 'vald bigård'}. Här kan du ändra det viktigaste.` : 'Justera grunduppgifter för kupan.'}
      />

      <AppCard>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Bigård</Text>
          <View style={styles.optionGrid}>
            {apiaries.map((apiary) => {
              const selected = apiary.id === selectedApiaryId;

              return (
                <Pressable key={apiary.id} onPress={() => setSelectedApiaryId(apiary.id)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                  <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{apiary.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Kupnamn</Text>
          <TextInput onChangeText={setName} placeholder="Till exempel Kupa 7" placeholderTextColor={theme.colors.textMuted} style={styles.input} value={name} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Samhällsstyrka</Text>
          <View style={styles.optionGrid}>
            {hiveStrengths.map((value) => {
              const selected = value === strength;

              return (
                <Pressable key={value} onPress={() => setStrength(value)} style={[styles.option, selected && styles.optionSelected]}>
                  <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Temperament</Text>
          <View style={styles.optionGrid}>
            {hiveTemperaments.map((value) => {
              const selected = value === temperament;

              return (
                <Pressable key={value} onPress={() => setTemperament(value)} style={[styles.option, selected && styles.optionSelected]}>
                  <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Kupsystem</Text>
          <View style={styles.optionGrid}>
            {hiveBoxSystems.map((value) => {
              const selected = value === boxSystem;

              return (
                <Pressable key={value} onPress={() => setBoxSystem(value)} style={[styles.option, selected && styles.optionSelected]}>
                  <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Anteckning</Text>
          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={setNotes}
            placeholder="Valfritt: hur kupan brukar vara, något att hålla koll på eller annat du vill minnas"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.inputMultiline}
            textAlignVertical="top"
            value={notes}
          />
        </View>

        <PrimaryButton fullWidth label="Spara ändringar" onPress={saveHive} />
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
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  option: {
    minHeight: 56,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  largeOption: {
    width: '48%',
    maxWidth: '48%',
  },
  optionSelected: {
    backgroundColor: theme.colors.sage,
    borderColor: theme.colors.sage,
  },
  optionLabel: {
    ...theme.textStyles.bodyStrong,
    textAlign: 'center',
    flexShrink: 1,
  },
  optionSelectedText: {
    color: theme.colors.surface,
  },
});