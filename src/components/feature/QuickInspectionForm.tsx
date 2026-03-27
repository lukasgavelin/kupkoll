import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppCard } from '@/components/ui/AppCard';
import { EmptyStateCard } from '@/components/ui/EmptyStateCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { fetchInspectionWeather } from '@/lib/weather';
import { useKupkoll } from '@/store/KupkollContext';
import { useTheme } from '@/store/ThemeContext';
import { Theme } from '@/theme';
import { Coordinates, HiveEventType, HiveTemperament, InspectionAdvancedDetails, InspectionMode, InspectionWeatherCondition, InspectionWeatherWind, VarroaControlMethod, VarroaLevel } from '@/types/domain';

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
    description: 'Något avviker, men läget går att bevaka till nästa kontroll.',
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
    description: 'Tecken på problem eller ingrepp som inte bör vänta.',
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

const inspectionModes: Array<{ value: InspectionMode; label: string; description: string }> = [
  {
    value: 'Snabb genomgång',
    label: 'Snabb genomgång',
    description: 'Dagens preset-flöde med några viktiga toggles och direkt sparning.',
  },
  {
    value: 'Fördjupad genomgång',
    label: 'Fördjupad genomgång',
    description: 'Samma grund men med fler biodlingsfält, anteckning och åtgärdsdetaljer.',
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
  return activePreset?.defaultNote ?? 'Genomgång: egen bedömning sparad efter att förvalet justerats.';
}

function buildDetailedInspectionNote(input: { noteText: string; activePreset?: InspectionPreset }) {
  const trimmedNote = input.noteText.trim();

  if (trimmedNote) {
    return trimmedNote;
  }

  if (input.activePreset) {
    return `${input.activePreset.defaultNote} Fördjupad genomgång sparad.`;
  }

  return 'Fördjupad genomgång sparad utan fri anteckning.';
}

export function QuickInspectionForm({ initialHiveId }: QuickInspectionFormProps) {
  const theme = useTheme();
  const { addInspection, apiaries, hives } = useKupkoll();
  const styles = createStyles(theme);
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

  const selectedHive = useMemo(() => hives.find((item) => item.id === selectedHiveId), [hives, selectedHiveId]);
  const selectedApiary = useMemo(() => apiaries.find((item) => item.id === selectedHive?.apiaryId), [apiaries, selectedHive?.apiaryId]);
  const activePreset = useMemo(() => inspectionPresets.find((preset) => matchesPreset(values, temperament, varroaLevel, preset)), [temperament, values, varroaLevel]);

  async function loadAutoWeather(coordinates: Coordinates) {
    setAutoWeatherStatus('loading');

    try {
      const weather = await fetchInspectionWeather(coordinates);

      setWeatherCondition(weather.condition);
      setWeatherWind(weather.wind);
      setTemperatureText(formatTemperatureInput(weather.temperatureC));
      setAutoWeatherStatus('ready');
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

    if (!coordinates) {
      setAutoWeatherStatus('unavailable');
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      setAutoWeatherStatus('loading');

      try {
        const weather = await fetchInspectionWeather(coordinates);

        if (cancelled) {
          return;
        }

        setWeatherCondition(weather.condition);
        setWeatherWind(weather.wind);
        setTemperatureText(formatTemperatureInput(weather.temperatureC));
        setAutoWeatherStatus('ready');
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
      Alert.alert('Välj kupa först', 'Välj först vilken kupa du går igenom, så kan du logga en händelse för rätt samhälle.');
      return;
    }

    const query = type ? `?hiveId=${selectedHiveId}&type=${encodeURIComponent(type)}` : `?hiveId=${selectedHiveId}`;
    router.push(`/events/new${query}` as never);
  }

  function saveInspection() {
    if (!selectedHiveId) {
      Alert.alert('Välj kupa', 'Du behöver välja vilken kupa som ska få genomgången.');
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
      ...values,
    });

    Alert.alert('Genomgång sparad', 'Din notering är sparad och kupans sida har uppdaterats.');
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
    ? 'Välj först vilken kupa du tittar på, så fyller vi i förhållandena för rätt plats.'
    : !selectedApiary.coordinates
      ? 'Den här bigården saknar sparad position. Fyll i uppgifterna själv eller lägg till plats på bigården.'
      : autoWeatherStatus === 'loading'
        ? `Hämtar aktuella förhållanden för ${selectedApiary.name}...`
        : autoWeatherStatus === 'ready'
          ? `Uppgifterna för ${selectedApiary.name} är ifyllda utifrån platsen. Justera om något skiljer sig där du står.`
          : autoWeatherStatus === 'error'
            ? `Det gick inte att hämta uppgifterna för ${selectedApiary.name}. Fyll i dem själv eller försök igen.`
            : `Uppgifterna kan hämtas för ${selectedApiary.name}.`;

  if (!hives.length) {
    return (
      <View style={styles.wrapper}>
        <SectionHeader title="Genomgång" description="Den här vyn blir tillgänglig så fort du har minst en kupa att välja mellan." />
        <EmptyStateCard
          title={hasApiaries ? 'Lägg till första kupan först' : 'Lägg till första bigården'}
          description={
            hasApiaries
                ? 'Det finns ännu inga kupor att spara en genomgång för. Lägg till din första kupa och kom sedan tillbaka hit.'
                : 'För att kunna spara en genomgång behöver du först lägga till en bigård och sedan en kupa.'
          }
          actionLabel={hasApiaries ? 'Lägg till kupa' : 'Lägg till bigård'}
          onActionPress={() => router.push(hasApiaries ? '/hives/new' : '/apiaries/new')}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <SectionHeader
        title="Genomgång"
        description={inspectionMode === 'Snabb genomgång'
          ? 'Snabbläget låter dig välja kupa, bekräfta läget och spara direkt.'
          : 'Fördjupat läge lägger till fler observationsfält, fri anteckning och detaljer från själva genomgången.'}
      />

      <AppCard>
        <Text style={theme.textStyles.heading}>1. Välj genomgång</Text>
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
        <Text style={theme.textStyles.heading}>4. Justera det som sticker ut</Text>
        <Text style={theme.textStyles.caption}>
          {inspectionMode === 'Snabb genomgång'
            ? 'Om förvalet redan stämmer kan du gå vidare direkt. Här ändrar du bara det som inte passar.'
            : 'Utgå från förvalet och fyll sedan på med fler fält i nästa steg om du vill dokumentera mer.'}
        </Text>
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
          <Text style={theme.textStyles.caption}>Varroa lämnas som ej kontrollerad tills du faktiskt gör en kontroll.</Text>
        )}
      </AppCard>

      {inspectionMode === 'Fördjupad genomgång' ? (
        <AppCard>
          <Text style={theme.textStyles.heading}>5. Fördjupa genomgången</Text>
          <Text style={theme.textStyles.caption}>Lägg till mer av det som är relevant för just den här kupan. Här hör sådant hemma som beskriver läget i samhället under besöket.</Text>

          <Text style={styles.inlineLabel}>Yngel och resurser</Text>
          <View style={styles.optionGrid}>
            {detailedToggleLabels.map((item) => {
              const selected = values[item.key];
              return (
                <Pressable key={item.key} onPress={() => toggleValue(item.key)} style={[styles.option, styles.largeOption, selected && styles.optionSelected]}>
                  <Text style={[styles.optionLabel, selected && styles.optionSelectedText]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.inlineLabel}>Fördjupad varroakontroll</Text>
          <Text style={theme.textStyles.caption}>Fyll bara i detta när varroa faktiskt är kontrollerad och du vill kunna följa upp metod och behandling.</Text>
          {varroaChecked ? (
            <>
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
                placeholder="Till exempel 6 kvalster/24 h eller 3%"
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
                placeholder="Till exempel vad som gjorts, varför det avvaktas eller när du vill följa upp"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
                value={varroaTreatmentNote}
              />
            </>
          ) : (
            <Text style={theme.textStyles.caption}>Aktivera först att varroa är kontrollerad i genomgången ovan.</Text>
          )}

          <Text style={styles.inlineLabel}>Åtgärd eller behandling under besöket</Text>
          <TextInput
            onChangeText={setTreatmentText}
            placeholder="Till exempel myrsyra, oxalsyra, rambyte eller att ingen åtgärd gjordes"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={treatmentText}
          />

          <View style={styles.eventGuidanceCard}>
            <Text style={theme.textStyles.bodyStrong}>Sådant som passar bättre som händelse</Text>
            <Text style={theme.textStyles.caption}>Det som ändrar samhällets säsongshistorik sparas tydligare som en egen händelse än som en del av en genomgång.</Text>
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
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={theme.textStyles.heading}>{inspectionMode === 'Snabb genomgång' ? '5. Väder vid genomgången' : '6. Väder vid genomgången'}</Text>
        <Text style={theme.textStyles.caption}>När bigården har en sparad plats fyller vi i temperatur, vind och väderläge automatiskt. Justera om det inte stämmer där du står.</Text>
        <Text style={theme.textStyles.caption}>{autoWeatherHint}</Text>
        {selectedApiary?.coordinates ? <PrimaryButton label={autoWeatherStatus === 'loading' ? 'Hämtar väder...' : autoWeatherStatus === 'error' ? 'Försök igen' : 'Hämta igen'} onPress={() => {
          if (!selectedApiary.coordinates || autoWeatherStatus === 'loading') {
            return;
          }

          void loadAutoWeather(selectedApiary.coordinates);
        }} size="compact" variant="secondary" /> : null}
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
          placeholder="Till exempel 17,5"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={temperatureText}
        />
      </AppCard>

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryTextBlock}>
            <Text style={theme.textStyles.overline}>Sammanfattning</Text>
            <Text style={styles.summaryTitle}>{selectedHive ? selectedHive.name : 'Välj kupa först'}</Text>
            <Text style={styles.summaryDescription}>{inspectionMode} • {summaryLabel} • {temperament} • {varroaSummary}</Text>
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