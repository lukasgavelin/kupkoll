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
import { Coordinates, HiveTemperament, InspectionWeatherCondition, InspectionWeatherWind, VarroaLevel } from '@/types/domain';

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

const temperaments: HiveTemperament[] = ['Lugnt', 'Vaksamt', 'Hetsigt'];
const varroaLevels: VarroaLevel[] = ['Ej kontrollerad', 'Låg', 'Förhöjd', 'Hög'];
const weatherConditions: InspectionWeatherCondition[] = ['Soligt', 'Växlande molnighet', 'Mulet', 'Duggregn', 'Regn'];
const weatherWinds: InspectionWeatherWind[] = ['Lugnt', 'Måttlig vind', 'Blåsigt'];

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

export function QuickInspectionForm({ initialHiveId }: QuickInspectionFormProps) {
  const theme = useTheme();
  const { addInspection, apiaries, hives } = useKupkoll();
  const styles = createStyles(theme);
  const [selectedPresetId, setSelectedPresetId] = useState(inspectionPresets[0].id);
  const [selectedHiveId, setSelectedHiveId] = useState(initialHiveId ?? hives[0]?.id ?? '');
  const [temperament, setTemperament] = useState<HiveTemperament>(inspectionPresets[0].temperament);
  const [varroaLevel, setVarroaLevel] = useState<VarroaLevel>(inspectionPresets[0].varroaLevel);
  const [values, setValues] = useState<Record<BooleanKey, boolean>>(inspectionPresets[0].values);
  const [weatherCondition, setWeatherCondition] = useState<InspectionWeatherCondition | undefined>(undefined);
  const [weatherWind, setWeatherWind] = useState<InspectionWeatherWind | undefined>(undefined);
  const [temperatureText, setTemperatureText] = useState('');
  const [weatherNote, setWeatherNote] = useState('');
  const [autoWeatherStatus, setAutoWeatherStatus] = useState<AutoWeatherStatus>('idle');

  const selectedHive = useMemo(() => hives.find((item) => item.id === selectedHiveId), [hives, selectedHiveId]);
  const selectedApiary = useMemo(() => apiaries.find((item) => item.id === selectedHive?.apiaryId), [apiaries, selectedHive?.apiaryId]);
  const selectedPreset = useMemo(() => inspectionPresets.find((preset) => preset.id === selectedPresetId) ?? inspectionPresets[0], [selectedPresetId]);
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
    setWeatherNote('');

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

    const trimmedTemperature = temperatureText.trim();
    const parsedTemperature = trimmedTemperature ? Number(trimmedTemperature.replace(',', '.')) : undefined;

    if (trimmedTemperature && (parsedTemperature === undefined || Number.isNaN(parsedTemperature))) {
      Alert.alert('Ogiltig temperatur', 'Ange temperaturen i grader som ett tal, till exempel 17 eller 17,5.');
      return;
    }

    const weather = weatherCondition || weatherWind || parsedTemperature !== undefined || weatherNote.trim()
      ? {
          condition: weatherCondition,
          wind: weatherWind,
          temperatureC: parsedTemperature,
          note: weatherNote.trim() || undefined,
        }
      : undefined;

    addInspection({
      hiveId: selectedHiveId,
      temperament,
      varroaLevel,
      weather,
      notes: selectedPreset.defaultNote,
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
  const autoWeatherHint = !selectedApiary
    ? 'Välj först vilken kupa du tittar på, så kan vädret hämtas för rätt plats.'
    : !selectedApiary.coordinates
      ? 'Den här bigården saknar sparad position. Fyll i vädret själv eller lägg till plats på bigården.'
      : autoWeatherStatus === 'loading'
        ? `Hämtar aktuellt väder för ${selectedApiary.name}...`
        : autoWeatherStatus === 'ready'
          ? `Vädret för ${selectedApiary.name} är ifyllt utifrån platsen. Justera om något skiljer sig på plats.`
          : autoWeatherStatus === 'error'
            ? `Det gick inte att hämta vädret för ${selectedApiary.name}. Fyll i det själv eller försök hämta igen.`
            : `Vädret kan hämtas för ${selectedApiary.name}.`;

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
      <SectionHeader title="Genomgång" description="Välj kupa, markera hur läget verkar och spara. Du behöver bara ändra det som sticker ut." />

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
        <Text style={theme.textStyles.heading}>2. Hur känns läget?</Text>
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
        <Text style={theme.textStyles.heading}>3. Justera om något sticker ut</Text>
        <Text style={theme.textStyles.caption}>Om förvalet redan stämmer kan du gå vidare direkt. Här ändrar du bara det som inte passar.</Text>
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
        <Text style={styles.inlineLabel}>Hur ser varroaläget ut?</Text>
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
        <Text style={theme.textStyles.heading}>4. Väder vid genomgången</Text>
        <Text style={theme.textStyles.caption}>När bigården har en sparad plats fyller vi i vädret automatiskt. Justera om det inte stämmer där du står.</Text>
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
        <Text style={styles.inlineLabel}>Kort notis om vädret</Text>
        <TextInput
          multiline
          numberOfLines={3}
          onChangeText={setWeatherNote}
          placeholder="Valfritt: till exempel blåst, stark sol eller annat som påverkade genomgången"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.inputMultiline}
          textAlignVertical="top"
          value={weatherNote}
        />
      </AppCard>

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryTextBlock}>
            <Text style={theme.textStyles.overline}>Sammanfattning</Text>
            <Text style={styles.summaryTitle}>{selectedHive ? selectedHive.name : 'Välj kupa först'}</Text>
            <Text style={styles.summaryDescription}>{summaryLabel} • {temperament} • Varroa {varroaLevel}</Text>
            <Text style={theme.textStyles.caption}>Väder: {weatherSummary}</Text>
          </View>
        </View>
        <Text style={theme.textStyles.caption}>Appen lägger till en kort notering automatiskt, så att du kan spara utan att skriva mer än nödvändigt.</Text>
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
    inputMultiline: {
      minHeight: 96,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      ...theme.textStyles.body,
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