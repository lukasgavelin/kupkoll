import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { HiveEventDetails, HiveEventType, hiveEventTypes } from '@/types/domain';

type HiveEventFormProps = {
  initialHiveId?: string;
  initialType?: string;
};

const defaultNotes: Record<HiveEventType, string> = {
  'Avläggare skapad': 'Avläggare skapad och noterad för vidare uppföljning.',
  'Samhälle förenat': 'Samhället har förenats och bör följas upp vid nästa genomgång.',
  'Drottning bytt': 'Drottningbyte registrerat för samhället.',
  'Drottning märkt/årgång': 'Drottning märkt eller årgång noterad.',
  'Skattlåda påsatt': 'Skattlåda påsatt på samhället.',
  'Skattning/slungning': 'Skattning eller slungning registrerad.',
  'Invintring startad': 'Invintringen har påbörjats.',
  'Invintring slutförd': 'Invintringen är markerad som slutförd.',
  'Stödfodring': 'Stödfodring registrerad.',
  'Vinterförlust': 'Vinterförlust noterad för samhället.',
  'Rensningsflyg observerad': 'Rensningsflyg observerad.',
  'Samhälle dött/avvecklat': 'Samhället är markerat som dött eller avvecklat.',
};

function getFieldLabels(type: HiveEventType) {
  switch (type) {
    case 'Samhälle förenat':
      return [{ key: 'mergedWithHiveName', label: 'Förenat med', placeholder: 'Till exempel Kupa 7 eller avläggare från maj' }] as const;
    case 'Drottning märkt/årgång':
      return [
        { key: 'queenYear', label: 'Årgång', placeholder: 'Till exempel 2025' },
        { key: 'markingNote', label: 'Märkning', placeholder: 'Till exempel Vit märkningsfärg' },
      ] as const;
    case 'Skattlåda påsatt':
      return [{ key: 'honeySuperCount', label: 'Antal skattlådor', placeholder: 'Till exempel 1' }] as const;
    case 'Skattning/slungning':
      return [{ key: 'harvestSummary', label: 'Skattning/slungning', placeholder: 'Till exempel 18 kg vårhonung' }] as const;
    case 'Stödfodring':
      return [{ key: 'feedingSummary', label: 'Mängd eller typ', placeholder: 'Till exempel 5 liter sockerlösning' }] as const;
    default:
      return [] as const;
  }
}

export function HiveEventForm({ initialHiveId, initialType }: HiveEventFormProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { addEvent, apiaries, hives } = useKupkoll();
  const [selectedHiveId, setSelectedHiveId] = useState(initialHiveId ?? hives[0]?.id ?? '');
  const [selectedType, setSelectedType] = useState<HiveEventType>('Drottning bytt');
  const [notes, setNotes] = useState('');
  const [mergedWithHiveName, setMergedWithHiveName] = useState('');
  const [queenYear, setQueenYear] = useState('');
  const [markingNote, setMarkingNote] = useState('');
  const [honeySuperCount, setHoneySuperCount] = useState('');
  const [harvestSummary, setHarvestSummary] = useState('');
  const [feedingSummary, setFeedingSummary] = useState('');

  const selectedHive = useMemo(() => hives.find((item) => item.id === selectedHiveId), [hives, selectedHiveId]);
  const selectedApiary = useMemo(() => apiaries.find((item) => item.id === selectedHive?.apiaryId), [apiaries, selectedHive?.apiaryId]);
  const fields = getFieldLabels(selectedType);

  useEffect(() => {
    if (initialType && hiveEventTypes.includes(initialType as HiveEventType)) {
      setSelectedType(initialType as HiveEventType);
    }
  }, [initialType]);

  function buildDetails(): HiveEventDetails | undefined {
    const parsedHoneySuperCount = honeySuperCount.trim() ? Number(honeySuperCount.trim()) : undefined;

    if (honeySuperCount.trim() && (parsedHoneySuperCount === undefined || Number.isNaN(parsedHoneySuperCount) || parsedHoneySuperCount < 1)) {
      Alert.alert('Ogiltigt antal', 'Antal skattlådor behöver vara ett positivt heltal.');
      return undefined;
    }

    const details: HiveEventDetails = {
      mergedWithHiveName: mergedWithHiveName.trim() || undefined,
      queenYear: queenYear.trim() || undefined,
      markingNote: markingNote.trim() || undefined,
      honeySuperCount: parsedHoneySuperCount,
      harvestSummary: harvestSummary.trim() || undefined,
      feedingSummary: feedingSummary.trim() || undefined,
    };

    return Object.values(details).some((value) => value !== undefined) ? details : undefined;
  }

  function saveEvent() {
    if (!selectedHiveId) {
      Alert.alert('Välj kupa', 'Du behöver välja vilken kupa händelsen gäller.');
      return;
    }

    const details = buildDetails();

    if (honeySuperCount.trim() && !details?.honeySuperCount) {
      return;
    }

    addEvent({
      hiveId: selectedHiveId,
      type: selectedType,
      notes: notes.trim() || defaultNotes[selectedType],
      details,
    });

    router.back();
  }

  return (
    <View style={styles.container}>
      <SectionHeader eyebrow="Ny händelse" title="Logga ett viktigt biodlingsmoment" />
      {hives.length ? (
        <AppCard>
          <Text style={theme.textStyles.bodyStrong}>Kupa</Text>
          <Text style={theme.textStyles.caption}>Sparas med dagens datum och tid, precis som genomgångarna.</Text>
          <View style={styles.chipWrap}>
            {hives.map((hive) => {
              const isSelected = hive.id === selectedHiveId;
              const apiaryName = apiaries.find((apiary) => apiary.id === hive.apiaryId)?.name;

              return (
                <Pressable key={hive.id} onPress={() => setSelectedHiveId(hive.id)} style={({ pressed }) => [styles.chip, isSelected && styles.chipSelected, pressed && styles.chipPressed]}>
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{hive.name}</Text>
                  {apiaryName ? <Text style={[styles.chipCaption, isSelected && styles.chipLabelSelected]}>{apiaryName}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </AppCard>
      ) : (
        <EmptyStateCard title="Ingen kupa att logga på ännu" description="Lägg till en kupa först, så kan du börja spara viktiga biodlingshändelser för säsongen." />
      )}

      <AppCard>
        <Text style={theme.textStyles.bodyStrong}>Typ av händelse</Text>
        <View style={styles.chipWrap}>
          {hiveEventTypes.map((type) => {
            const isSelected = type === selectedType;

            return (
              <Pressable key={type} onPress={() => setSelectedType(type)} style={({ pressed }) => [styles.chip, styles.eventChip, isSelected && styles.chipSelected, pressed && styles.chipPressed]}>
                <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{type}</Text>
              </Pressable>
            );
          })}
        </View>
        {selectedHive ? <Text style={theme.textStyles.caption}>{selectedHive.name}{selectedApiary ? ` · ${selectedApiary.name}` : ''}</Text> : null}
      </AppCard>

      {fields.length ? (
        <AppCard>
          <Text style={theme.textStyles.bodyStrong}>Detaljer</Text>
          <View style={styles.inputList}>
            {fields.map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={theme.textStyles.caption}>{field.label}</Text>
                <TextInput
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  keyboardType={field.key === 'honeySuperCount' ? 'number-pad' : 'default'}
                  value={
                    field.key === 'mergedWithHiveName'
                      ? mergedWithHiveName
                      : field.key === 'queenYear'
                        ? queenYear
                        : field.key === 'markingNote'
                          ? markingNote
                          : field.key === 'honeySuperCount'
                            ? honeySuperCount
                            : field.key === 'harvestSummary'
                              ? harvestSummary
                              : feedingSummary
                  }
                  onChangeText={(value) => {
                    if (field.key === 'mergedWithHiveName') {
                      setMergedWithHiveName(value);
                      return;
                    }

                    if (field.key === 'queenYear') {
                      setQueenYear(value);
                      return;
                    }

                    if (field.key === 'markingNote') {
                      setMarkingNote(value);
                      return;
                    }

                    if (field.key === 'honeySuperCount') {
                      setHoneySuperCount(value.replace(/[^0-9]/g, ''));
                      return;
                    }

                    if (field.key === 'harvestSummary') {
                      setHarvestSummary(value);
                      return;
                    }

                    setFeedingSummary(value);
                  }}
                />
              </View>
            ))}
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={theme.textStyles.bodyStrong}>Anteckning</Text>
        <TextInput
          multiline
          placeholder="Lägg till en kort notering om du vill göra händelsen lättare att förstå senare i säsongen."
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, styles.notesInput]}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
        <PrimaryButton fullWidth label="Spara händelse" onPress={saveEvent} />
      </AppCard>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.lg,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    chip: {
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    eventChip: {
      minWidth: '47%',
    },
    chipSelected: {
      backgroundColor: theme.colors.text,
      borderColor: theme.colors.text,
    },
    chipPressed: {
      opacity: 0.9,
    },
    chipLabel: {
      ...theme.textStyles.label,
      color: theme.colors.text,
    },
    chipLabelSelected: {
      color: theme.colors.surface,
    },
    chipCaption: {
      ...theme.textStyles.caption,
      color: theme.colors.textMuted,
    },
    inputList: {
      gap: theme.spacing.md,
    },
    inputGroup: {
      gap: theme.spacing.xs,
    },
    input: {
      ...theme.textStyles.body,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      color: theme.colors.text,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    notesInput: {
      minHeight: 128,
    },
  });
}