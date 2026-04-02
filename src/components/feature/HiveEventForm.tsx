import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { queenMarkingColors, queenStatuses } from '@/lib/queen';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { HiveEventDetails, HiveEventType, hiveEventTypes, QueenMarkingColor, QueenStatus } from '@/types/domain';

type HiveEventFormProps = {
  initialHiveId?: string;
  initialType?: string;
};

const defaultNotes: Record<HiveEventType, string> = {
  'Avläggare skapad': 'Avläggare skapad och noterad för vidare uppföljning.',
  'Samhälle förenat': 'Samhället har förenats och bör följas upp vid nästa genomgång.',
  'Drottning bytt': 'Drottningbyte registrerat och kupans drottninguppgifter uppdaterade.',
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
      return [{ key: 'mergedWithHiveName', label: 'Förenat med', placeholder: 'Exempel: Kupa 7 eller avläggare från maj' }] as const;
    case 'Skattlåda påsatt':
      return [{ key: 'honeySuperCount', label: 'Antal skattlådor', placeholder: 'Exempel: 1' }] as const;
    case 'Skattning/slungning':
      return [{ key: 'harvestSummary', label: 'Skattning/slungning', placeholder: 'Exempel: 18 kg vårhonung' }] as const;
    case 'Stödfodring':
      return [{ key: 'feedingSummary', label: 'Mängd eller typ', placeholder: 'Exempel: 5 liter sockerlösning' }] as const;
    default:
      return [] as const;
  }
}

function getHeaderCopy(type: HiveEventType) {
  if (type === 'Drottning bytt') {
    return {
      title: 'Logga drottningbyte',
      description: 'Fyll i den nya drottningen. När du sparar uppdateras både händelsen och kupans drottningkort.',
    };
  }

  if (type === 'Drottning märkt/årgång') {
    return {
      title: 'Logga märkning eller årgång',
      description: 'Uppdatera kupans märkning eller årgång utan att registrera ett byte.',
    };
  }

  return {
    title: 'Logga en händelse',
    description: 'Logga större händelser när något har förändrats i samhället.',
  };
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
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
  const [queenMarkingColor, setQueenMarkingColor] = useState<QueenMarkingColor | ''>('');
  const [queenOrigin, setQueenOrigin] = useState('');
  const [queenIntroducedAt, setQueenIntroducedAt] = useState('');
  const [nextQueenStatus, setNextQueenStatus] = useState<QueenStatus>('Behöver följas upp');
  const [queenHistoryNote, setQueenHistoryNote] = useState('Ersatt');
  const [markingNote, setMarkingNote] = useState('');
  const [honeySuperCount, setHoneySuperCount] = useState('');
  const [harvestSummary, setHarvestSummary] = useState('');
  const [feedingSummary, setFeedingSummary] = useState('');

  const selectedHive = useMemo(() => hives.find((item) => item.id === selectedHiveId), [hives, selectedHiveId]);
  const selectedApiary = useMemo(() => apiaries.find((item) => item.id === selectedHive?.apiaryId), [apiaries, selectedHive?.apiaryId]);
  const fields = getFieldLabels(selectedType);
  const headerCopy = getHeaderCopy(selectedType);
  const isQueenChange = selectedType === 'Drottning bytt';
  const isQueenMarking = selectedType === 'Drottning märkt/årgång';

  useEffect(() => {
    if (initialType && hiveEventTypes.includes(initialType as HiveEventType)) {
      setSelectedType(initialType as HiveEventType);
    }
  }, [initialType]);

  function buildDetails(): HiveEventDetails | null | undefined {
    const parsedHoneySuperCount = honeySuperCount.trim() ? Number(honeySuperCount.trim()) : undefined;
    const trimmedQueenYear = queenYear.trim();
    const trimmedQueenOrigin = queenOrigin.trim();
    const trimmedQueenIntroducedAt = queenIntroducedAt.trim();
    const trimmedQueenHistoryNote = queenHistoryNote.trim();

    if (honeySuperCount.trim() && (parsedHoneySuperCount === undefined || Number.isNaN(parsedHoneySuperCount) || parsedHoneySuperCount < 1)) {
      Alert.alert('Ogiltigt antal', 'Antal skattlådor behöver vara ett positivt heltal.');
      return null;
    }

    if ((isQueenChange || isQueenMarking) && trimmedQueenYear && !/^\d{4}$/.test(trimmedQueenYear)) {
      Alert.alert('Ogiltigt år', 'Ange drottningens år med fyra siffror, till exempel 2025.');
      return null;
    }

    if (isQueenChange && !trimmedQueenYear) {
      Alert.alert('Drottningens år saknas', 'Ange årgång för den nya drottningen så att kupans drottningkort blir tydligt direkt.');
      return null;
    }

    if (isQueenChange && trimmedQueenIntroducedAt && !isValidIsoDate(trimmedQueenIntroducedAt)) {
      Alert.alert('Ogiltigt datum', 'Datum för införande behöver skrivas som ÅÅÅÅ-MM-DD.');
      return null;
    }

    if (isQueenChange && !trimmedQueenHistoryNote) {
      Alert.alert('Historikraden saknas', 'Lägg till en kort historikrad, till exempel ersatt eller ny inköpt drottning.');
      return null;
    }

    if (isQueenMarking && !trimmedQueenYear && !queenMarkingColor && !markingNote.trim()) {
      Alert.alert('Lägg till märkning eller årgång', 'Ange minst årgång eller märkningsfärg för att spara uppdateringen.');
      return null;
    }

    const details: HiveEventDetails = {
      mergedWithHiveName: mergedWithHiveName.trim() || undefined,
      queenYear: trimmedQueenYear || undefined,
      queenMarkingColor: queenMarkingColor || undefined,
      queenOrigin: isQueenChange ? trimmedQueenOrigin || undefined : undefined,
      queenIntroducedAt: isQueenChange ? trimmedQueenIntroducedAt || undefined : undefined,
      queenStatus: isQueenChange ? nextQueenStatus : undefined,
      queenHistoryNote: isQueenChange ? trimmedQueenHistoryNote : undefined,
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

    if (details === null) {
      return;
    }

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
      <SectionHeader eyebrow="Ny händelse" title={headerCopy.title} description={headerCopy.description} />
      {hives.length ? (
        <AppCard>
          <Text style={theme.textStyles.bodyStrong}>Kupa</Text>
          <Text style={theme.textStyles.caption}>Händelsen sparas med dagens datum och tid.</Text>
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
        <EmptyStateCard title="Ingen kupa att logga på ännu" description="Lägg till en kupa först, så kan du börja logga händelser." />
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

      {isQueenChange || isQueenMarking ? (
        <AppCard>
          <Text style={theme.textStyles.bodyStrong}>{isQueenChange ? 'Ny drottning' : 'Märkning och årgång'}</Text>
          <Text style={theme.textStyles.caption}>
            {isQueenChange
              ? 'Det här är sista steget i flödet: skapa bigård, lägg till kupa och logga drottningbyte.'
              : 'Använd detta när du vill rätta eller komplettera drottningens årgång och märkning.'}
          </Text>

          <View style={styles.inputList}>
            <View style={styles.inputGroup}>
              <Text style={theme.textStyles.caption}>Drottningens år</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={4}
                placeholder="Exempel: 2025"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.input}
                value={queenYear}
                onChangeText={(value) => setQueenYear(value.replace(/[^0-9]/g, ''))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={theme.textStyles.caption}>Märkningsfärg</Text>
              <View style={styles.chipWrap}>
                {queenMarkingColors.map((color) => {
                  const isSelected = color === queenMarkingColor;

                  return (
                    <Pressable key={color} onPress={() => setQueenMarkingColor(color)} style={({ pressed }) => [styles.chip, isSelected && styles.chipSelected, pressed && styles.chipPressed]}>
                      <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{color}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {isQueenChange ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={theme.textStyles.caption}>Ursprung</Text>
                  <TextInput
                    placeholder="Exempel: inköpt eller avläggare"
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.input}
                    value={queenOrigin}
                    onChangeText={setQueenOrigin}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={theme.textStyles.caption}>Datum för införande</Text>
                  <TextInput
                    autoCapitalize="none"
                    placeholder="ÅÅÅÅ-MM-DD"
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.input}
                    value={queenIntroducedAt}
                    onChangeText={setQueenIntroducedAt}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={theme.textStyles.caption}>Drottningstatus efter bytet</Text>
                  <View style={styles.chipWrap}>
                    {queenStatuses.map((status) => {
                      const isSelected = status === nextQueenStatus;

                      return (
                        <Pressable key={status} onPress={() => setNextQueenStatus(status)} style={({ pressed }) => [styles.chip, isSelected && styles.chipSelected, pressed && styles.chipPressed]}>
                          <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>{status}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={theme.textStyles.caption}>Historikrad</Text>
                  <TextInput
                    placeholder="Exempel: ersatt med ny drottning"
                    placeholderTextColor={theme.colors.textMuted}
                    style={styles.input}
                    value={queenHistoryNote}
                    onChangeText={setQueenHistoryNote}
                  />
                </View>
              </>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={theme.textStyles.caption}>Notering om märkning</Text>
                <TextInput
                  placeholder="Exempel: märkt om under säsongen"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={markingNote}
                  onChangeText={setMarkingNote}
                />
              </View>
            )}
          </View>
        </AppCard>
      ) : null}

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
          placeholder="Valfritt: en kort notering om händelsen"
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