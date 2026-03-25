import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useBeehaven } from '@/store/BeehavenContext';
import { theme } from '@/theme';
import { HiveTemperament, VarroaLevel } from '@/types/domain';

type BooleanKey = 'queenSeen' | 'eggsSeen' | 'openBrood' | 'cappedBrood' | 'honey' | 'pollen' | 'queenCells' | 'swarmSigns' | 'actionNeeded';

type QuickInspectionFormProps = {
  initialHiveId?: string;
};

type InspectionPreset = {
  id: string;
  label: string;
  description: string;
  defaultNote: string;
  temperament: HiveTemperament;
  varroaLevel: VarroaLevel;
  values: Record<BooleanKey, boolean>;
};

const inspectionPresets: InspectionPreset[] = [
  {
    id: 'stable',
    label: 'Stabilt läge',
    description: 'Bra yngelbild, gott om foder och inget akut att följa upp.',
    defaultNote: 'Snabb kontroll: kupan känns stabil och i balans.',
    temperament: 'Lugnt',
    varroaLevel: 'Ej kontrollerad',
    values: {
      queenSeen: true,
      eggsSeen: true,
      openBrood: true,
      cappedBrood: true,
      honey: true,
      pollen: true,
      queenCells: false,
      swarmSigns: false,
      actionNeeded: false,
    },
  },
  {
    id: 'watch',
    label: 'Följ upp snart',
    description: 'Något avviker, men läget går att bevaka till nästa kontroll.',
    defaultNote: 'Snabb kontroll: läget är okej men bör följas upp snart.',
    temperament: 'Vaksamt',
    varroaLevel: 'Förhöjd',
    values: {
      queenSeen: false,
      eggsSeen: true,
      openBrood: true,
      cappedBrood: true,
      honey: true,
      pollen: true,
      queenCells: false,
      swarmSigns: false,
      actionNeeded: false,
    },
  },
  {
    id: 'action',
    label: 'Åtgärd krävs',
    description: 'Tecken på problem eller ingrepp som inte bör vänta.',
    defaultNote: 'Snabb kontroll: avvikelse upptäckt och åtgärd behövs.',
    temperament: 'Hetsigt',
    varroaLevel: 'Hög',
    values: {
      queenSeen: false,
      eggsSeen: false,
      openBrood: false,
      cappedBrood: false,
      honey: true,
      pollen: true,
      queenCells: false,
      swarmSigns: false,
      actionNeeded: true,
    },
  },
];

const quickToggleLabels: Array<{ key: Extract<BooleanKey, 'queenSeen' | 'eggsSeen' | 'queenCells' | 'swarmSigns' | 'actionNeeded'>; label: string }> = [
  { key: 'queenSeen', label: 'Drottning sedd' },
  { key: 'eggsSeen', label: 'Ägg sedda' },
  { key: 'queenCells', label: 'Drottningceller' },
  { key: 'swarmSigns', label: 'Svärmtecken' },
  { key: 'actionNeeded', label: 'Följ upp direkt' },
];

const quickNoteSuggestions = ['Lugn öppning', 'Fint drag', 'Byggt starkt', 'Kontroll om 7 dagar'];

const temperaments: HiveTemperament[] = ['Lugnt', 'Vaksamt', 'Hetsigt'];
const varroaLevels: VarroaLevel[] = ['Ej kontrollerad', 'Låg', 'Förhöjd', 'Hög'];

function matchesPreset(values: Record<BooleanKey, boolean>, temperament: HiveTemperament, varroaLevel: VarroaLevel, preset: InspectionPreset) {
  return (
    temperaments.includes(temperament) &&
    Object.entries(preset.values).every(([key, value]) => values[key as BooleanKey] === value) &&
    preset.temperament === temperament &&
    preset.varroaLevel === varroaLevel
  );
}

export function QuickInspectionForm({ initialHiveId }: QuickInspectionFormProps) {
  const { addInspection, apiaries, hives } = useBeehaven();
  const [selectedPresetId, setSelectedPresetId] = useState(inspectionPresets[0].id);
  const [selectedHiveId, setSelectedHiveId] = useState(initialHiveId ?? hives[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [temperament, setTemperament] = useState<HiveTemperament>(inspectionPresets[0].temperament);
  const [varroaLevel, setVarroaLevel] = useState<VarroaLevel>(inspectionPresets[0].varroaLevel);
  const [values, setValues] = useState<Record<BooleanKey, boolean>>(inspectionPresets[0].values);

  const selectedHive = useMemo(() => hives.find((item) => item.id === selectedHiveId), [hives, selectedHiveId]);
  const selectedPreset = useMemo(() => inspectionPresets.find((preset) => preset.id === selectedPresetId) ?? inspectionPresets[0], [selectedPresetId]);
  const activePreset = useMemo(() => inspectionPresets.find((preset) => matchesPreset(values, temperament, varroaLevel, preset)), [temperament, values, varroaLevel]);

  function applyPreset(preset: InspectionPreset) {
    setSelectedPresetId(preset.id);
    setTemperament(preset.temperament);
    setVarroaLevel(preset.varroaLevel);
    setValues(preset.values);
  }

  function toggleValue(key: BooleanKey) {
    setValues((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function saveInspection() {
    if (!selectedHiveId) {
      Alert.alert('Välj kupa', 'Du behöver välja vilken kupa som ska få genomgången.');
      return;
    }

    addInspection({
      hiveId: selectedHiveId,
      temperament,
      varroaLevel,
      notes: notes.trim() || selectedPreset.defaultNote,
      ...values,
    });

    Alert.alert('Genomgång sparad', 'Observationen har lagts till och beslutsstödet har uppdaterats.');
    router.replace(`/hives/${selectedHiveId}`);
  }

  function addQuickNote(suggestion: string) {
    setNotes((current) => {
      if (current.includes(suggestion)) {
        return current;
      }

      return current.trim() ? `${current.trim()}. ${suggestion}` : suggestion;
    });
  }

  const summaryLabel = activePreset ? activePreset.label : 'Anpassad logg';
  const hasApiaries = apiaries.length > 0;

  if (!hives.length) {
    return (
      <View style={styles.wrapper}>
        <SectionHeader
          title="Snabbflöde i fyra tryck"
          description="Snabbgenomgången blir tillgänglig så fort det finns minst en kupa att välja."
        />
        <EmptyStateCard
          title={hasApiaries ? 'Lägg till första kupan först' : 'Skapa först en bigård'}
          description={
            hasApiaries
              ? 'Det finns ännu inga kupor att logga genomgång på. Skapa första kupan och kom sedan tillbaka till snabbflödet.'
              : 'Snabbgenomgången behöver en kupa, och en kupa behöver tillhöra en bigård. Börja därför med att skapa en bigård.'
          }
          actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'}
          onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <SectionHeader title="Snabbflöde i fyra tryck" description="Välj kupa, sätt läge, justera bara avvikelser och spara direkt. Standardvalen gör att du slipper fylla i allt varje gång." />

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryTextBlock}>
            <Text style={theme.textStyles.overline}>Val just nu</Text>
            <Text style={styles.summaryTitle}>{selectedHive ? selectedHive.name : 'Välj kupa först'}</Text>
            <Text style={styles.summaryDescription}>{summaryLabel} • {temperament} • Varroa {varroaLevel}</Text>
          </View>
        </View>
        <Text style={theme.textStyles.caption}>Fritext är valfri. Om du inte skriver något sparas en kort standardnotering från valt läge.</Text>
      </AppCard>

      <AppCard>
        <Text style={theme.textStyles.heading}>1. Välj kupa</Text>
        <View style={styles.stack}>
          {hives.map((hive) => {
            const selected = hive.id === selectedHiveId;
            return (
              <Pressable key={hive.id} onPress={() => setSelectedHiveId(hive.id)} style={[styles.choiceCard, selected && styles.choiceCardSelected]}>
                <View style={styles.choiceCardHeader}>
                  <Text style={[styles.choiceCardTitle, selected && styles.choiceCardTitleSelected]}>{hive.name}</Text>
                  <Text style={[theme.textStyles.caption, selected && styles.choiceCardMetaSelected]}>{hive.status}</Text>
                </View>
                <Text style={[theme.textStyles.body, selected && styles.choiceCardBodySelected]}>{hive.notes}</Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <Text style={theme.textStyles.heading}>2. Hur ser det ut?</Text>
        <View style={styles.stack}>
          {inspectionPresets.map((preset) => {
            const selected = activePreset?.id === preset.id;
            return (
              <Pressable key={preset.id} onPress={() => applyPreset(preset)} style={[styles.choiceCard, styles.presetCard, selected && styles.choiceCardSelected]}>
                <View style={styles.choiceCardHeader}>
                  <Text style={[styles.choiceCardTitle, selected && styles.choiceCardTitleSelected]}>{preset.label}</Text>
                  <Text style={[theme.textStyles.caption, selected && styles.choiceCardMetaSelected]}>{preset.temperament}</Text>
                </View>
                <Text style={[theme.textStyles.body, selected && styles.choiceCardBodySelected]}>{preset.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <Text style={theme.textStyles.heading}>3. Justera avvikelser</Text>
        <Text style={theme.textStyles.caption}>Hoppa över detta om snabbvalet redan stämmer. Här justerar du bara det som avviker.</Text>
        <View style={styles.optionGrid}>
          {quickToggleLabels.map((item) => {
            const selected = values[item.key];
            return (
              <Pressable key={item.key} onPress={() => toggleValue(item.key)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.inlineLabel}>Temperament i kupan</Text>
        <View style={styles.optionGrid}>
          {temperaments.map((value) => {
            const selected = value === temperament;
            return (
              <Pressable key={value} onPress={() => setTemperament(value)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.inlineLabel}>Varroaläge</Text>
        <View style={styles.optionGrid}>
          {varroaLevels.map((value) => {
            const selected = value === varroaLevel;
            return (
              <Pressable key={value} onPress={() => setVarroaLevel(value)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <Text style={theme.textStyles.heading}>4. Kort notering om du vill</Text>
        <View style={styles.chipGrid}>
          {quickNoteSuggestions.map((suggestion) => (
            <Pressable key={suggestion} onPress={() => addQuickNote(suggestion)} style={styles.option}>
              <Text style={styles.optionLabel}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          multiline
          numberOfLines={3}
          onChangeText={setNotes}
          placeholder="Valfritt: lägg till en kort anteckning"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={notes}
        />
      </AppCard>

      <PrimaryButton fullWidth label={selectedHive ? `Spara för ${selectedHive.name}` : 'Välj kupa för att spara'} onPress={saveInspection} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.xxl,
  },
  summaryCard: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.lg,
  },
  summaryTextBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  summaryTitle: {
    ...theme.textStyles.title,
    fontSize: 28,
    lineHeight: 32,
  },
  summaryDescription: {
    ...theme.textStyles.body,
    color: theme.colors.textMuted,
  },
  stack: {
    gap: theme.spacing.md,
  },
  choiceCard: {
    minHeight: 96,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  choiceCardSelected: {
    backgroundColor: theme.colors.sage,
    borderColor: theme.colors.sage,
  },
  choiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  choiceCardTitle: {
    ...theme.textStyles.heading,
    flex: 1,
  },
  choiceCardTitleSelected: {
    color: theme.colors.surface,
  },
  choiceCardMetaSelected: {
    color: theme.colors.surface,
    opacity: 0.84,
  },
  choiceCardBodySelected: {
    color: theme.colors.surface,
    opacity: 0.9,
  },
  presetCard: {
    minHeight: 112,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  chipGrid: {
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
    minHeight: 68,
    width: '48%',
    maxWidth: '48%',
    flexGrow: 0,
    flexShrink: 0,
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
  inlineLabel: {
    ...theme.textStyles.label,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
  input: {
    minHeight: 92,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    textAlignVertical: 'top',
    ...theme.textStyles.body,
  },
});