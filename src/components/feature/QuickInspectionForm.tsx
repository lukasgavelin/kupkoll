import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';
import { HiveTemperament } from '@/types/domain';

type BooleanKey = 'queenSeen' | 'eggsSeen' | 'openBrood' | 'cappedBrood' | 'honey' | 'pollen' | 'queenCells' | 'swarmSigns' | 'actionNeeded';

type QuickInspectionFormProps = {
  initialHiveId?: string;
};

const booleanLabels: Array<{ key: BooleanKey; label: string }> = [
  { key: 'queenSeen', label: 'Drottning sedd' },
  { key: 'eggsSeen', label: 'Ägg sedda' },
  { key: 'openBrood', label: 'Öppet yngel' },
  { key: 'cappedBrood', label: 'Täckt yngel' },
  { key: 'honey', label: 'Honung' },
  { key: 'pollen', label: 'Pollen' },
  { key: 'queenCells', label: 'Drottningceller' },
  { key: 'swarmSigns', label: 'Svärmtendenser' },
  { key: 'actionNeeded', label: 'Behov av åtgärd' },
];

const temperaments: HiveTemperament[] = ['Lugnt', 'Vaksamt', 'Hetsigt'];

export function QuickInspectionForm({ initialHiveId }: QuickInspectionFormProps) {
  const { addInspection, hives } = useBeehaven();
  const [selectedHiveId, setSelectedHiveId] = useState(initialHiveId ?? hives[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [temperament, setTemperament] = useState<HiveTemperament>('Lugnt');
  const [values, setValues] = useState<Record<BooleanKey, boolean>>({
    queenSeen: false,
    eggsSeen: true,
    openBrood: true,
    cappedBrood: true,
    honey: true,
    pollen: true,
    queenCells: false,
    swarmSigns: false,
    actionNeeded: false,
  });

  const selectedHive = useMemo(() => hives.find((item) => item.id === selectedHiveId), [hives, selectedHiveId]);

  function toggleValue(key: BooleanKey) {
    setValues((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function saveInspection() {
    if (!selectedHiveId) {
      Alert.alert('Välj kupa', 'Du behöver välja vilken kupa som ska få inspektionen.');
      return;
    }

    addInspection({
      hiveId: selectedHiveId,
      temperament,
      notes: notes.trim() || 'Snabb inspektion registrerad i beehaven2.',
      ...values,
    });

    Alert.alert('Inspektion sparad', 'Observationen har lagts till och rekommendationerna uppdaterades.');
    router.replace(`/hives/${selectedHiveId}`);
  }

  return (
    <View style={styles.wrapper}>
      <SectionHeader
        eyebrow="Snabb loggning"
        title="Registrera inspektion"
        description="Utformad för att kunna fyllas i med en hand ute i bigården på under 30 sekunder."
      />

      <AppCard>
        <Text style={theme.textStyles.heading}>Välj kupa</Text>
        <View style={styles.optionGrid}>
          {hives.map((hive) => {
            const selected = hive.id === selectedHiveId;
            return (
              <Pressable key={hive.id} onPress={() => setSelectedHiveId(hive.id)} style={[styles.option, selected && styles.optionSelected]}>
                <Text style={[theme.textStyles.bodyStrong, selected && styles.optionSelectedText]}>{hive.name}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedHive ? <Text style={theme.textStyles.caption}>Vald kupa: {selectedHive.name}</Text> : null}
      </AppCard>

      <AppCard>
        <Text style={theme.textStyles.heading}>Observationer</Text>
        <View style={styles.optionGrid}>
          {booleanLabels.map((item) => {
            const selected = values[item.key];
            return (
              <Pressable key={item.key} onPress={() => toggleValue(item.key)} style={[styles.option, selected && styles.optionSelected]}>
                <Text style={[theme.textStyles.bodyStrong, selected && styles.optionSelectedText]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <Text style={theme.textStyles.heading}>Temperament</Text>
        <View style={styles.optionGrid}>
          {temperaments.map((value) => {
            const selected = value === temperament;
            return (
              <Pressable key={value} onPress={() => setTemperament(value)} style={[styles.option, selected && styles.optionSelected]}>
                <Text style={[theme.textStyles.bodyStrong, selected && styles.optionSelectedText]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <Text style={theme.textStyles.heading}>Fritext</Text>
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={setNotes}
          placeholder="Kort anteckning om läget i kupan"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={notes}
        />
      </AppCard>

      <PrimaryButton label="Spara inspektion" onPress={saveInspection} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xl,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  option: {
    minHeight: 48,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  optionSelected: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  optionSelectedText: {
    color: theme.colors.surface,
  },
  input: {
    minHeight: 110,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceMuted,
    padding: theme.spacing.lg,
    textAlignVertical: 'top',
    ...theme.textStyles.body,
  },
});