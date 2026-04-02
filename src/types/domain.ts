export type HiveStatus = 'Stabilt' | 'Behöver åtgärd' | 'Under uppbyggnad';
export type QueenStatus = 'Bekräftad' | 'Osäker' | 'Behöver följas upp';
export type QueenMarkingColor = 'Vit' | 'Gul' | 'Röd' | 'Grön' | 'Blå' | 'Omärkt';
export type HiveStrength = 'Starkt' | 'Medel' | 'Svagt';
export type HiveTemperament = 'Lugnt' | 'Vaksamt' | 'Hetsigt';
export type TaskPriority = 'Låg' | 'Medel' | 'Hög';
export type RecommendationSeverity = 'info' | 'warning' | 'critical';
export type RecommendationKind = 'alert' | 'seasonal' | 'reminder' | 'status';
export type SeasonLabel = 'Vintertillsyn' | 'Vårutveckling' | 'Svärmperiod' | 'Drag och skattning' | 'Invintring' | 'Vinterro';
export type HiveBoxSystem = 'Lågnormal' | 'Svea' | 'Langstroth' | 'Dadant';
export type TaskSource = 'Egen planering' | 'Beslutsstöd';
export type VarroaLevel = 'Ej kontrollerad' | 'Låg' | 'Förhöjd' | 'Hög';
export type VarroaControlMethod = 'Nedfall' | 'Skakprov' | 'Sockerprov' | 'Alkoholprov' | 'Annan metod';
export type InspectionWeatherCondition = 'Soligt' | 'Växlande molnighet' | 'Mulet' | 'Duggregn' | 'Regn';
export type InspectionWeatherWind = 'Lugnt' | 'Måttlig vind' | 'Blåsigt';
export type InspectionMode = 'Snabb genomgång' | 'Fördjupad genomgång';
export type QueenChangeStatus = 'Inte aktuell' | 'Planerat' | 'Genomfört';

export const hiveEventTypes = [
  'Avläggare skapad',
  'Samhälle förenat',
  'Drottning bytt',
  'Drottning märkt/årgång',
  'Skattlåda påsatt',
  'Skattning/slungning',
  'Invintring startad',
  'Invintring slutförd',
  'Stödfodring',
  'Vinterförlust',
  'Rensningsflyg observerad',
  'Samhälle dött/avvecklat',
] as const;

export type HiveEventType = (typeof hiveEventTypes)[number];

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ApiaryZone = 'syd' | 'mellan' | 'nord';

export type ApiaryLocationDetails = {
  locality?: string;
  municipality?: string;
  county?: string;
  countryCode?: string;
  source: 'auto' | 'manual';
  zone?: ApiaryZone;
};

export type Apiary = {
  id: string;
  name: string;
  location: string;
  notes: string;
  coordinates?: Coordinates;
  locationDetails?: ApiaryLocationDetails;
};

export type QueenHistoryEntry = {
  id: string;
  year: string;
  note: string;
};

export type QueenHistoryInput = Omit<QueenHistoryEntry, 'id'>;

export type Hive = {
  id: string;
  apiaryId: string;
  name: string;
  status: HiveStatus;
  queenStatus: QueenStatus;
  strength: HiveStrength;
  temperament: HiveTemperament;
  boxSystem: HiveBoxSystem;
  queenYear?: string;
  queenMarkingColor?: QueenMarkingColor;
  queenOrigin?: string;
  queenIntroducedAt?: string;
  queenHistory: QueenHistoryEntry[];
  lastInspectionAt?: string;
  notes: string;
};

export type InspectionWeather = {
  condition?: InspectionWeatherCondition;
  wind?: InspectionWeatherWind;
  temperatureC?: number;
  note?: string;
};

export type InspectionAdvancedDetails = {
  treatment?: string;
  feeding?: string;
  honeySuperOn?: boolean;
  splitMade?: boolean;
  queenChangeStatus?: QueenChangeStatus;
};

export type InspectionVarroaDetails = {
  checked: boolean;
  controlMethod?: VarroaControlMethod;
  measurementValue?: string;
  treatmentPerformed?: boolean;
  treatmentNote?: string;
};

export type HiveEventDetails = {
  mergedWithHiveName?: string;
  queenYear?: string;
  queenMarkingColor?: QueenMarkingColor;
  queenOrigin?: string;
  queenIntroducedAt?: string;
  queenStatus?: QueenStatus;
  queenHistoryNote?: string;
  markingNote?: string;
  honeySuperCount?: number;
  harvestSummary?: string;
  feedingSummary?: string;
};

export type Inspection = {
  id: string;
  hiveId: string;
  performedAt: string;
  mode: InspectionMode;
  queenSeen: boolean;
  eggsSeen: boolean;
  openBrood: boolean;
  cappedBrood: boolean;
  honey: boolean;
  pollen: boolean;
  queenCells: boolean;
  swarmSigns: boolean;
  varroaLevel: VarroaLevel;
  varroaDetails?: InspectionVarroaDetails;
  temperament: HiveTemperament;
  actionNeeded: boolean;
  weather?: InspectionWeather;
  advancedDetails?: InspectionAdvancedDetails;
  notes: string;
};

export type HiveEvent = {
  id: string;
  hiveId: string;
  type: HiveEventType;
  performedAt: string;
  notes: string;
  details?: HiveEventDetails;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  hiveId?: string;
  apiaryId?: string;
  priority: TaskPriority;
  source: TaskSource;
  completed: boolean;
};

export type Recommendation = {
  id: string;
  hiveId: string;
  title: string;
  detail: string;
  severity: RecommendationSeverity;
  kind: RecommendationKind;
  season: SeasonLabel;
  createdAt: string;
};

export type NewInspectionInput = Omit<Inspection, 'id' | 'performedAt'>;
export type NewHiveEventInput = Omit<HiveEvent, 'id' | 'performedAt'>;
export type NewApiaryInput = Omit<Apiary, 'id'>;
export type NewHiveInput = Pick<Hive, 'apiaryId' | 'name' | 'queenStatus' | 'strength' | 'temperament' | 'boxSystem' | 'notes'> & {
  queenYear?: string;
  queenMarkingColor?: QueenMarkingColor;
  queenOrigin?: string;
  queenIntroducedAt?: string;
  queenHistory?: QueenHistoryInput[];
};
export type UpdateApiaryInput = NewApiaryInput;
export type UpdateHiveInput = NewHiveInput;