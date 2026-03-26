import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';

import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { HiveBoxSystem, HiveStrength, HiveTemperament } from '@/types/domain';

const hiveStrengths: HiveStrength[] = ['Svagt', 'Medel', 'Starkt'];
const hiveTemperaments: HiveTemperament[] = ['Lugnt', 'Vaksamt', 'Hetsigt'];
const hiveBoxSystems: HiveBoxSystem[] = ['Lågnormal', 'Svea', 'Langstroth', 'Dadant'];

export default function NewHiveScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ apiaryId?: string }>();
  const { addHive, apiaries, getApiaryById } = useKupkoll();
  const styles = createStyles(theme);
  const [selectedApiaryId, setSelectedApiaryId] = useState(params.apiaryId ?? apiaries[0]?.id ?? '');
  const [name, setName] = useState('');
  const [strength, setStrength] = useState<HiveStrength>('Medel');
  const [temperament, setTemperament] = useState<HiveTemperament>('Lugnt');
  const [boxSystem, setBoxSystem] = useState<HiveBoxSystem>('Lågnormal');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!selectedApiaryId && apiaries[0]?.id) {
      setSelectedApiaryId(apiaries[0].id);
    }
  }, [apiaries, selectedApiaryId]);

  function saveHive() {
    const trimmedName = name.trim();

    if (!selectedApiaryId) {
      Alert.alert('Skapa bigård först', 'En kupa behöver tillhöra en bigård innan den kan sparas.');
      return;
    }

    if (!trimmedName) {
      Alert.alert('Namn saknas', 'Ange ett namn eller nummer för kupan innan du sparar.');
      return;
    }

    const hive = addHive({
      apiaryId: selectedApiaryId,
      name: trimmedName,
      strength,
      temperament,
      boxSystem,
      notes: notes.trim() || 'Lägg gärna till en anteckning om kupan senare om du vill.',
    });

    router.replace(`/hives/${hive.id}`);
  }

  if (!apiaries.length) {
    return (
      <Screen>
        <PageHeader actionLabel="Stäng" actionIconName="close" onActionPress={() => router.back()} eyebrow="Ny kupa" title="Lägg till kupa" description="Först behöver du skapa en bigård som kupan kan placeras i." />
        <EmptyStateCard title="Ingen bigård att välja" description="Lägg först till platsen där kupan står. Sedan kan du skapa kupan härifrån." actionLabel="Lägg till bigård" onActionPress={() => router.replace('/apiaries/new')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        actionLabel="Stäng"
        actionIconName="close"
        onActionPress={() => router.back()}
        eyebrow="Ny kupa"
        title="Lägg till kupa"
        description={selectedApiaryId ? `Kupan läggs i ${getApiaryById(selectedApiaryId)?.name ?? 'vald bigård'}. Du kan fylla på med fler noteringar senare.` : 'Välj bigård och fyll i det viktigaste om kupan.'}
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

        <PrimaryButton fullWidth label="Spara kupa" onPress={saveHive} />
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
}