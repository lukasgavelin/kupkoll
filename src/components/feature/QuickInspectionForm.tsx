import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fetchInspectionWeather } from '@/lib/weather';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { HiveEventType, HiveTemperament, InspectionAdvancedDetails, InspectionMode, InspectionWeatherCondition, InspectionWeatherWind, VarroaControlMethod, VarroaLevel } from '@/types/domain';

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
    defaultNote: 'Genomgång: kupan känns stabil och i balans.',
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
    description: 'Något avviker, men läget kan följas upp vid nästa kontroll.',
    defaultNote: 'Genomgång: läget är okej men bör följas upp snart.',
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
    description: 'Tecken på problem eller behov av snabb åtgärd.',
    defaultNote: 'Genomgång: avvikelse upptäckt och åtgärd behövs.',
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
  { key: 'actionNeeded', label: 'Behöver följas upp' },
];

const detailedToggleLabels: Array<{ key: Extract<BooleanKey, 'openBrood' | 'cappedBrood' | 'honey' | 'pollen'>; label: string }> = [
  { key: 'openBrood', label: 'Öppet yngel' },
  { key: 'cappedBrood', label: 'Täckt yngel' },
  { key: 'honey', label: 'Honung/foderkrans' },
  { key: 'pollen', label: 'Pollen' },
];

const yngelLabels: Array<{ key: BooleanKey; label: string }> = [
  { key: 'queenSeen', label: 'Drottning sedd' },
  { key: 'eggsSeen', label: 'Ägg sedda' },
  { key: 'openBrood', label: 'Öppet yngel' },
  { key: 'cappedBrood', label: 'Täckt yngel' },
];

const foderLabels: Array<{ key: BooleanKey; label: string }> = [
  { key: 'honey', label: 'Honung/foderkrans' },
  { key: 'pollen', label: 'Pollen' },
];

const svarmLabels: Array<{ key: BooleanKey; label: string }> = [
  { key: 'queenCells', label: 'Drottningceller' },
  { key: 'swarmSigns', label: 'Svärmtecken' },
];

const inspectionModes: Array<{ value: InspectionMode; label: string; description: string }> = [
  {
    value: 'Snabb genomgång',
    label: 'Snabb',
    description: 'Förval och de viktigaste valen.',
  },
  {
    value: 'Fördjupad genomgång',
    label: 'Fördjupad',
    description: 'Samma grund, med fler fält och mer detaljer.',
  },
];

const temperaments: HiveTemperament[] = ['Lugnt', 'Vaksamt', 'Hetsigt'];
const varroaLevels: VarroaLevel[] = ['Ej kontrollerad', 'Låg', 'Förhöjd', 'Hög'];
const measuredVarroaLevels: Exclude<VarroaLevel, 'Ej kontrollerad'>[] = ['Låg', 'Förhöjd', 'Hög'];
const varroaControlMethods: VarroaControlMethod[] = ['Nedfall', 'Skakprov', 'Sockerprov', 'Alkoholprov', 'Annan metod'];
const weatherConditions: InspectionWeatherCondition[] = ['Soligt', 'Växlande molnighet', 'Mulet', 'Duggregn', 'Regn'];
const weatherWinds: InspectionWeatherWind[] = ['Lugnt', 'Måttlig vind', 'Blåsigt'];
const eventShortcutTypes: HiveEventType[] = ['Drottning bytt', 'Avläggare skapad', 'Skattlåda påsatt', 'Stödfodring', 'Samhälle förenat'];

type AutoWeatherStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

function createWeatherSummary(input: { condition?: InspectionWeatherCondition; wind?: InspectionWeatherWind; temperatureText: string }) {
  const segments = [input.condition, input.wind, input.temperatureText.trim() ? `${input.temperatureText.trim()} °C` : undefined].filter(Boolean);

  return segments.length ? segments.join(' • ') : 'Inget väder registrerat';
}

function formatTemperatureInput(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1).replace('.', ',');
}

function matchesPreset(values: Record<BooleanKey, boolean>, temperament: HiveTemperament, varroaLevel: VarroaLevel, preset: InspectionPreset) {
  return (
    temperaments.includes(temperament) &&
    Object.entries(preset.values).every(([key, value]) => values[key as BooleanKey] === value) &&
    preset.temperament === temperament &&
    preset.varroaLevel === varroaLevel
  );
}

function buildQuickInspectionNote(activePreset?: InspectionPreset) {
  return activePreset?.defaultNote ?? 'Genomgång: egen bedömning sparad.';
}

function buildDetailedInspectionNote(input: { noteText: string; activePreset?: InspectionPreset }) {
  const trimmedNote = input.noteText.trim();

  if (trimmedNote) {
    return trimmedNote;
  }

  if (input.activePreset) {
    return `${input.activePreset.defaultNote} Fördjupad genomgång sparad.`;
  }

  return 'Fördjupad genomgång sparad.';
}

export function QuickInspectionForm({ initialHiveId }: QuickInspectionFormProps) {
  const theme = useTheme();
  const { addInspection, apiaries, hives } = useKupkoll();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('Snabb genomgång');
  const [selectedHiveId, setSelectedHiveId] = useState(initialHiveId ?? hives[0]?.id ?? '');
  const [temperament, setTemperament] = useState<HiveTemperament>(inspectionPresets[0].temperament);
  const [varroaLevel, setVarroaLevel] = useState<VarroaLevel>(inspectionPresets[0].varroaLevel);
  const [varroaChecked, setVarroaChecked] = useState(false);
  const [varroaControlMethod, setVarroaControlMethod] = useState<VarroaControlMethod | undefined>(undefined);
  const [varroaMeasurementValue, setVarroaMeasurementValue] = useState('');
  const [varroaTreatmentPerformed, setVarroaTreatmentPerformed] = useState(false);
  const [varroaTreatmentNote, setVarroaTreatmentNote] = useState('');
  const [values, setValues] = useState<Record<BooleanKey, boolean>>({ ...inspectionPresets[0].values });
  const [weatherCondition, setWeatherCondition] = useState<InspectionWeatherCondition | undefined>(undefined);
  const [weatherWind, setWeatherWind] = useState<InspectionWeatherWind | undefined>(undefined);
  const [temperatureText, setTemperatureText] = useState('');
  const [autoWeatherStatus, setAutoWeatherStatus] = useState<AutoWeatherStatus>('idle');
  const [noteText, setNoteText] = useState('');
  const [treatmentText, setTreatmentText] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);

  const selectedHive = useMemo(() => hives.find((item) => item.id === selectedHiveId), [hives, selectedHiveId]);
  const selectedApiary = useMemo(() => apiaries.find((item) => item.id === selectedHive?.apiaryId), [apiaries, selectedHive?.apiaryId]);
  const activePreset = useMemo(() => inspectionPresets.find((preset) => matchesPreset(values, temperament, varroaLevel, preset)), [temperament, values, varroaLevel]);

  async function fetchWeatherForCoordinates(coordinates: { latitude: number; longitude: number }) {
    setAutoWeatherStatus('loading');
    const weather = await fetchInspectionWeather(coordinates);
    setWeatherCondition(weather.condition);
    setWeatherWind(weather.wind);
    setTemperatureText(formatTemperatureInput(weather.temperatureC));
    setAutoWeatherStatus('ready');
  }

  async function loadAutoWeather(coordinates: { latitude: number; longitude: number }) {
    try {
      await fetchWeatherForCoordinates(coordinates);
    } catch {
      setAutoWeatherStatus('error');
    }
  }

  useEffect(() => {
    let cancelled = false;

    setWeatherCondition(undefined);
    setWeatherWind(undefined);
    setTemperatureText('');

    if (!selectedApiary) {
      setAutoWeatherStatus('idle');
      return () => {
        cancelled = true;
      };
    }

    if (!selectedApiary.coordinates) {
      setAutoWeatherStatus('unavailable');
      return () => {
        cancelled = true;
      };
    }

    const { coordinates } = selectedApiary;

    void (async () => {
      try {
        await fetchWeatherForCoordinates(coordinates);
      } catch {
        if (!cancelled) {
          setAutoWeatherStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedApiary?.coordinates?.latitude, selectedApiary?.coordinates?.longitude, selectedApiary?.id]);

  function applyPreset(preset: InspectionPreset) {
    setTemperament(preset.temperament);
    setVarroaLevel(preset.varroaLevel);
    setVarroaChecked(preset.varroaLevel !== 'Ej kontrollerad');
    setValues({ ...preset.values });
  }

  async function handlePickImage(useCamera: boolean) {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      };

      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Kamera nekas', 'Du behöver ge åtkomst till kameran för att ta bilder.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Bilder nekas', 'Du behöver ge åtkomst till bildbiblioteket.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || `img_${Date.now()}.jpg`;
        const newPath = `${FileSystem.documentDirectory}${filename}`;
        
        await FileSystem.copyAsync({
          from: uri,
          to: newPath,
        });
        
        setImageUris((current) => [...current, newPath]);
      }
    } catch (err) {
      Alert.alert('Kunde inte lägga till bild', 'Ett fel inträffade när bilden skulle hämtas.');
    }
  }

  function removeImage(indexToRemove: number) {
    setImageUris((current) => current.filter((_, idx) => idx !== indexToRemove));
  }

  function updateVarroaChecked(nextValue: boolean) {
    setVarroaChecked(nextValue);

    if (!nextValue) {
      setVarroaLevel('Ej kontrollerad');
      setVarroaControlMethod(undefined);
      setVarroaMeasurementValue('');
      setVarroaTreatmentPerformed(false);
      setVarroaTreatmentNote('');
      return;
    }

    if (varroaLevel === 'Ej kontrollerad') {
      setVarroaLevel('Låg');
    }
  }

  function toggleValue(key: BooleanKey) {
    setValues((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function openEventShortcut(type?: HiveEventType) {
    if (!selectedHiveId) {
      Alert.alert('Välj kupa först', 'Välj vilken kupa du går igenom innan du loggar en händelse.');
      return;
    }

    const query = type ? `?hiveId=${selectedHiveId}&type=${encodeURIComponent(type)}` : `?hiveId=${selectedHiveId}`;
    router.push(`/events/new${query}` as never);
  }

  function saveInspection() {
    if (!selectedHiveId) {
      Alert.alert('Välj kupa', 'Välj vilken kupa som ska få genomgången.');
      return;
    }

    const trimmedTemperature = temperatureText.trim();
    const parsedTemperature = trimmedTemperature ? Number(trimmedTemperature.replace(',', '.')) : undefined;

    if (trimmedTemperature && (parsedTemperature === undefined || Number.isNaN(parsedTemperature))) {
      Alert.alert('Ogiltig temperatur', 'Ange temperaturen i grader som ett tal, till exempel 17 eller 17,5.');
      return;
    }

    if (varroaChecked && varroaLevel === 'Ej kontrollerad') {
      Alert.alert('Komplettera varroa', 'Om varroa är kontrollerad behöver du också ange om nivån var låg, förhöjd eller hög.');
      return;
    }

    const weather = weatherCondition || weatherWind || parsedTemperature !== undefined
      ? {
          condition: weatherCondition,
          wind: weatherWind,
          temperatureC: parsedTemperature,
        }
      : undefined;

    const advancedDetails: InspectionAdvancedDetails | undefined = inspectionMode === 'Fördjupad genomgång'
      ? {
          treatment: treatmentText.trim() || undefined,
        }
      : undefined;

    const varroaDetails = varroaChecked
      ? {
          checked: true,
          controlMethod: varroaControlMethod,
          measurementValue: varroaMeasurementValue.trim() || undefined,
          treatmentPerformed: varroaTreatmentPerformed,
          treatmentNote: varroaTreatmentNote.trim() || undefined,
        }
      : undefined;

    const notes = inspectionMode === 'Snabb genomgång'
      ? buildQuickInspectionNote(activePreset)
      : buildDetailedInspectionNote({
          noteText,
          activePreset,
        });

    addInspection({
      hiveId: selectedHiveId,
      mode: inspectionMode,
      temperament,
      varroaLevel: varroaChecked ? varroaLevel : 'Ej kontrollerad',
      varroaDetails,
      weather,
      advancedDetails,
      notes,
      imageUris,
      ...values,
    });

    Alert.alert('Genomgång sparad', 'Genomgången är sparad och kupans sida är uppdaterad.');
    router.replace(`/hives/${selectedHiveId}`);
  }

  const summaryLabel = activePreset ? activePreset.label : 'Egen bedömning';
  const hasApiaries = apiaries.length > 0;
  const weatherSummary = createWeatherSummary({
    condition: weatherCondition,
    wind: weatherWind,
    temperatureText,
  });
  const varroaSummary = varroaChecked ? `Varroa ${varroaLevel}` : 'Varroa ej kontrollerad';
  const summaryNote = inspectionMode === 'Snabb genomgång' ? buildQuickInspectionNote(activePreset) : buildDetailedInspectionNote({ noteText, activePreset });
  const autoWeatherHint = !selectedApiary
    ? 'Välj först kupa så fylls vädret för rätt plats i.'
    : !selectedApiary.coordinates
      ? 'Den här bigården saknar sparad position. Fyll i vädret manuellt eller lägg till plats på bigården.'
      : autoWeatherStatus === 'loading'
        ? `Hämtar aktuella förhållanden för ${selectedApiary.name}...`
        : autoWeatherStatus === 'ready'
          ? `Vädret för ${selectedApiary.name} är ifyllt utifrån platsen. Justera vid behov.`
          : autoWeatherStatus === 'error'
            ? `Kunde inte hämta vädret för ${selectedApiary.name}. Fyll i manuellt eller försök igen.`
            : `Uppgifterna kan hämtas för ${selectedApiary.name}.`;

  if (!hives.length) {
    return (
      <View style={styles.wrapper}>
        <SectionHeader title="Ny notering" description="Den här vyn blir tillgänglig så fort du har minst en kupa att välja mellan." />
        <EmptyStateCard
          title={hasApiaries ? 'Lägg till första kupan först' : 'Lägg till första bigården'}
          description={
            hasApiaries
                ? 'Det finns inga kupor att logga genomgång för ännu. Lägg till en kupa och kom tillbaka hit.'
                : 'För att logga en genomgång behöver du först lägga till en bigård och sedan en kupa.'
          }
          actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'}
          onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <AppCard>
        <Text style={theme.textStyles.heading}>1. Välj läge</Text>
        <View style={styles.stack}>
          {inspectionModes.map((mode) => {
            const selected = inspectionMode === mode.value;
            return (
              <Pressable key={mode.value} onPress={() => setInspectionMode(mode.value)} style={[styles.choiceCard, selected && styles.choiceCardSelected]}>
                <Text style={[styles.choiceCardTitle, selected && styles.choiceCardTitleSelected]}>{mode.label}</Text>
                <Text style={[theme.textStyles.body, selected && styles.choiceCardBodySelected]}>{mode.description}</Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard>
        <Text style={theme.textStyles.heading}>2. Välj kupa</Text>
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
        <Text style={theme.textStyles.heading}>3. Hur känns läget?</Text>
        <Text style={theme.textStyles.caption}>Välj det förval som ligger närmast läget. Justeringar nedan blir en egen bedömning.</Text>
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

      {inspectionMode === 'Snabb genomgång' ? (
        <>
          {/* Snabb genomgång: Justera det som sticker ut */}
          <AppCard>
            <Text style={theme.textStyles.heading}>4. Justera det som sticker ut</Text>
            <Text style={theme.textStyles.caption}>
              Om förvalet stämmer kan du gå vidare direkt. Ändra bara det som avviker.
            </Text>
            <Text style={theme.textStyles.caption}>Nu matchar: {activePreset ? activePreset.label : 'Egen bedömning efter dina justeringar'}</Text>
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
            <Text style={styles.inlineLabel}>Hur upplevdes kupan?</Text>
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
            <Text style={styles.inlineLabel}>Varroa kontrollerad?</Text>
            <View style={styles.optionGrid}>
              <Pressable onPress={() => updateVarroaChecked(true)} style={[styles.option, styles.largeOption, varroaChecked && styles.optionSelected]}>
                <Text style={[styles.optionLabel, varroaChecked && styles.optionSelectedText]}>Ja</Text>
              </Pressable>
              <Pressable onPress={() => updateVarroaChecked(false)} style={[styles.option, styles.largeOption, !varroaChecked && styles.optionSelected]}>
                <Text style={[styles.optionLabel, !varroaChecked && styles.optionSelectedText]}>Nej</Text>
              </Pressable>
            </View>
            {varroaChecked ? (
              <>
                <Text style={styles.inlineLabel}>Hur ser varroaläget ut?</Text>
                <View style={styles.optionGrid}>
                  {measuredVarroaLevels.map((value) => {
                    const selected = value === varroaLevel;
                    return (
                      <Pressable key={value} onPress={() => setVarroaLevel(value)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                        <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text style={theme.textStyles.caption}>Varroa lämnas som ej kontrollerad tills du gör en kontroll.</Text>
            )}
          </AppCard>
        </>
      ) : (
        <>
          {/* Fördjupad genomgång: Yngelstatus */}
          <AppCard>
            <Text style={theme.textStyles.heading}>4. Yngelstatus</Text>
            <Text style={theme.textStyles.caption}>Bedöm drottningens närvaro, äggläggning och yngelstadier.</Text>
            <View style={styles.optionGrid}>
              {yngelLabels.map((item) => {
                const selected = values[item.key];
                return (
                  <Pressable key={item.key} onPress={() => toggleValue(item.key)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                    <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          {/* Fördjupad genomgång: Foderstatus */}
          <AppCard>
            <Text style={theme.textStyles.heading}>5. Foderstatus</Text>
            <Text style={theme.textStyles.caption}>Kontrollera om det finns tillräckligt med honung/foderkrans och pollen.</Text>
            <View style={styles.optionGrid}>
              {foderLabels.map((item) => {
                const selected = values[item.key];
                return (
                  <Pressable key={item.key} onPress={() => toggleValue(item.key)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                    <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          {/* Fördjupad genomgång: Svärmtecken */}
          <AppCard>
            <Text style={theme.textStyles.heading}>6. Svärmtecken</Text>
            <Text style={theme.textStyles.caption}>Notera om samhället bygger drottningceller (svärmceller, nödceller, stilla byte) eller visar andra svärmtecken.</Text>
            <View style={styles.optionGrid}>
              {svarmLabels.map((item) => {
                const selected = values[item.key];
                return (
                  <Pressable key={item.key} onPress={() => toggleValue(item.key)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                    <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          {/* Fördjupad genomgång: Varroa */}
          <AppCard>
            <Text style={theme.textStyles.heading}>7. Varroa</Text>
            <Text style={theme.textStyles.caption}>Logga eventuella mätvärden och metoder för varroakvalster.</Text>
            <Text style={styles.inlineLabel}>Varroa kontrollerad?</Text>
            <View style={styles.optionGrid}>
              <Pressable onPress={() => updateVarroaChecked(true)} style={[styles.option, styles.largeOption, varroaChecked && styles.optionSelected]}>
                <Text style={[styles.optionLabel, varroaChecked && styles.optionSelectedText]}>Ja</Text>
              </Pressable>
              <Pressable onPress={() => updateVarroaChecked(false)} style={[styles.option, styles.largeOption, !varroaChecked && styles.optionSelected]}>
                <Text style={[styles.optionLabel, !varroaChecked && styles.optionSelectedText]}>Nej</Text>
              </Pressable>
            </View>

            {varroaChecked ? (
              <>
                <Text style={styles.inlineLabel}>Varroanivå</Text>
                <View style={styles.optionGrid}>
                  {measuredVarroaLevels.map((value) => {
                    const selected = value === varroaLevel;
                    return (
                      <Pressable key={value} onPress={() => setVarroaLevel(value)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                        <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.inlineLabel}>Mätmetod</Text>
                <View style={styles.optionGrid}>
                  {varroaControlMethods.map((value) => {
                    const selected = value === varroaControlMethod;
                    return (
                      <Pressable key={value} onPress={() => setVarroaControlMethod(selected ? undefined : value)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                        <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.inlineLabel}>Mätvärde</Text>
                <TextInput
                  onChangeText={setVarroaMeasurementValue}
                  placeholder="Exempel: 6 kvalster/24 h eller 3%"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.input}
                  value={varroaMeasurementValue}
                />

                <Text style={styles.inlineLabel}>Behandling utförd?</Text>
                <View style={styles.optionGrid}>
                  <Pressable onPress={() => setVarroaTreatmentPerformed(true)} style={[styles.option, styles.largeOption, varroaTreatmentPerformed && styles.optionSelected]}>
                    <Text style={[styles.optionLabel, varroaTreatmentPerformed && styles.optionSelectedText]}>Ja</Text>
                  </Pressable>
                  <Pressable onPress={() => setVarroaTreatmentPerformed(false)} style={[styles.option, styles.largeOption, !varroaTreatmentPerformed && styles.optionSelected]}>
                    <Text style={[styles.optionLabel, !varroaTreatmentPerformed && styles.optionSelectedText]}>Nej</Text>
                  </Pressable>
                </View>

                <Text style={styles.inlineLabel}>Behandlingsnotering</Text>
                <TextInput
                  multiline
                  onChangeText={setVarroaTreatmentNote}
                  placeholder="Exempel: vad som gjorts och när du vill följa upp"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, styles.textArea]}
                  textAlignVertical="top"
                  value={varroaTreatmentNote}
                />
              </>
            ) : (
              <Text style={theme.textStyles.caption}>Varroa lämnas som ej kontrollerad tills du gör en kontroll.</Text>
            )}
          </AppCard>

          {/* Fördjupad genomgång: Väder vid genomgången */}
          <AppCard>
            <Text style={theme.textStyles.heading}>8. Väder vid genomgången</Text>
            <Text style={theme.textStyles.caption}>När bigården har en sparad plats fylls temperatur, vind och väderläge i automatiskt. Justera vid behov.</Text>
            <Text style={theme.textStyles.caption}>{autoWeatherHint}</Text>
            {selectedApiary?.coordinates ? (
              <PrimaryButton
                label={autoWeatherStatus === 'loading' ? 'Hämtar väder...' : autoWeatherStatus === 'error' ? 'Försök igen' : 'Hämta igen'}
                onPress={() => {
                  if (!selectedApiary.coordinates || autoWeatherStatus === 'loading') {
                    return;
                  }
                  void loadAutoWeather(selectedApiary.coordinates);
                }}
                size="compact"
                variant="secondary"
              />
            ) : null}
            <Text style={styles.inlineLabel}>Väderläge</Text>
            <View style={styles.optionGrid}>
              {weatherConditions.map((value) => {
                const selected = value === weatherCondition;
                return (
                  <Pressable key={value} onPress={() => setWeatherCondition(selected ? undefined : value)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                    <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.inlineLabel}>Vind</Text>
            <View style={styles.optionGrid}>
              {weatherWinds.map((value) => {
                const selected = value === weatherWind;
                return (
                  <Pressable key={value} onPress={() => setWeatherWind(selected ? undefined : value)} style={[styles.option, selected && styles.optionSelected]}>
                    <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.inlineLabel}>Temperatur</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setTemperatureText}
              placeholder="Exempel: 17,5"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              value={temperatureText}
            />
          </AppCard>

          {/* Fördjupad genomgång: Sammanfattning & noteringar */}
          <AppCard>
            <Text style={theme.textStyles.heading}>9. Sammanfattning & noteringar</Text>
            <Text style={theme.textStyles.caption}>Avsluta genomgången med anteckningar, temperament och eventuellt bilder.</Text>

            <Text style={styles.inlineLabel}>Hur upplevdes kupans temperament?</Text>
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

            <Text style={styles.inlineLabel}>Behöver kupan följas upp extra snart?</Text>
            <View style={styles.optionGrid}>
              <Pressable onPress={() => setValues((c) => ({ ...c, actionNeeded: true }))} style={[styles.option, styles.largeOption, values.actionNeeded && styles.optionSelected]}>
                <Text style={[styles.optionLabel, values.actionNeeded && styles.optionSelectedText]}>Ja</Text>
              </Pressable>
              <Pressable onPress={() => setValues((c) => ({ ...c, actionNeeded: false }))} style={[styles.option, styles.largeOption, !values.actionNeeded && styles.optionSelected]}>
                <Text style={[styles.optionLabel, !values.actionNeeded && styles.optionSelectedText]}>Nej</Text>
              </Pressable>
            </View>

            <Text style={styles.inlineLabel}>Åtgärd eller behandling under besöket</Text>
            <TextInput
              onChangeText={setTreatmentText}
              placeholder="Exempel: myrsyra, oxalsyra, rambyte eller ingen åtgärd"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
              value={treatmentText}
            />

            <View style={styles.eventGuidanceCard}>
              <Text style={theme.textStyles.bodyStrong}>Sådant som passar bättre som händelse</Text>
              <Text style={theme.textStyles.caption}>Det som ändrar samhällets historik är oftast tydligare som en egen händelse.</Text>
              <View style={styles.optionGrid}>
                {eventShortcutTypes.map((type) => (
                  <Pressable key={type} onPress={() => openEventShortcut(type)} style={styles.option}>
                    <Text style={styles.optionLabel}>{type}</Text>
                  </Pressable>
                ))}
              </View>
              <PrimaryButton label="Öppna alla händelser" onPress={() => openEventShortcut()} variant="secondary" size="compact" />
            </View>

            <Text style={styles.inlineLabel}>Fria anteckningar</Text>
            <TextInput
              multiline
              onChangeText={setNoteText}
              placeholder="Skriv det du vill minnas från genomgången"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={noteText}
            />

            <Text style={styles.inlineLabel}>Bilder</Text>
            <Text style={theme.textStyles.caption}>Lägg till foton från genomgången (t.ex. yngelbild eller misstänkt sjukdom).</Text>
            <View style={styles.imageGrid}>
              {imageUris.map((uri, index) => (
                <View key={uri} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <Pressable style={styles.removeImageButton} onPress={() => removeImage(index)}>
                    <Text style={styles.removeImageText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={styles.optionGrid}>
              <PrimaryButton label="Ta bild" iconName="camera-outline" onPress={() => handlePickImage(true)} variant="secondary" />
              <PrimaryButton label="Välj från galleri" iconName="image-outline" onPress={() => handlePickImage(false)} variant="secondary" />
            </View>
          </AppCard>
        </>
      )}

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryTextBlock}>
            <Text style={theme.textStyles.overline}>Sammanfattning</Text>
            <Text style={styles.summaryTitle}>{selectedHive ? selectedHive.name : 'Välj kupa först'}</Text>
            <Text style={styles.summaryDescription}>{inspectionMode} • {summaryLabel} • {temperament} • {varroaSummary}</Text>
            {selectedApiary ? <Text style={theme.textStyles.caption}>Bigård: {selectedApiary.name}</Text> : null}
            <Text style={theme.textStyles.caption}>Väder: {weatherSummary}</Text>
          </View>
        </View>
        <Text style={theme.textStyles.caption}>{summaryNote}</Text>
      </AppCard>

      <PrimaryButton fullWidth label={selectedHive ? `Spara för ${selectedHive.name}` : 'Välj kupa för att spara'} onPress={saveInspection} />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
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
    textArea: {
      minHeight: 128,
    },
    eventGuidanceCard: {
      gap: theme.spacing.md,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
      padding: theme.spacing.lg,
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
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginTop: theme.spacing.sm,
    },
    imageWrapper: {
      position: 'relative',
    },
    imagePreview: {
      width: 100,
      height: 100,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceMuted,
    },
    removeImageButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: theme.colors.danger,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    removeImageText: {
      color: theme.colors.surface,
      fontSize: 12,
      fontWeight: 'bold',
      lineHeight: 16,
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
  });
}