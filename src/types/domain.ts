export type HiveStatus = 'Stabilt' | 'Behöver åtgärd' | 'Under uppbyggnad';
export type QueenStatus = 'Bekräftad' | 'Osäker' | 'Behöver följas upp';
export type HiveStrength = 'Starkt' | 'Medel' | 'Svagt';
export type HiveTemperament = 'Lugnt' | 'Vaksamt' | 'Hetsigt';
export type TaskPriority = 'Låg' | 'Medel' | 'Hög';
export type RecommendationSeverity = 'info' | 'warning' | 'critical';
export type RecommendationKind = 'alert' | 'seasonal' | 'reminder' | 'status';
export type SeasonLabel = 'Vintertillsyn' | 'Vårutveckling' | 'Svärmperiod' | 'Drag och skattning' | 'Invintring' | 'Vinterro';
export type HiveBoxSystem = 'Lågnormal' | 'Svea' | 'Langstroth' | 'Dadant';
export type TaskSource = 'Egen planering' | 'Beslutsstöd';
export type VarroaLevel = 'Ej kontrollerad' | 'Låg' | 'Förhöjd' | 'Hög';
export type InspectionWeatherCondition = 'Soligt' | 'Växlande molnighet' | 'Mulet' | 'Duggregn' | 'Regn';
export type InspectionWeatherWind = 'Lugnt' | 'Måttlig vind' | 'Blåsigt';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Apiary = {
  id: string;
  name: string;
  location: string;
  notes: string;
  coordinates?: Coordinates;
};

export type Hive = {
  id: string;
  apiaryId: string;
  name: string;
  status: HiveStatus;
  queenStatus: QueenStatus;
  strength: HiveStrength;
  temperament: HiveTemperament;
  boxSystem: HiveBoxSystem;
  lastInspectionAt?: string;
  notes: string;
};

export type InspectionWeather = {
  condition?: InspectionWeatherCondition;
  wind?: InspectionWeatherWind;
  temperatureC?: number;
  note?: string;
};

export type Inspection = {
  id: string;
  hiveId: string;
  performedAt: string;
  queenSeen: boolean;
  eggsSeen: boolean;
  openBrood: boolean;
  cappedBrood: boolean;
  honey: boolean;
  pollen: boolean;
  queenCells: boolean;
  swarmSigns: boolean;
  varroaLevel: VarroaLevel;
  temperament: HiveTemperament;
  actionNeeded: boolean;
  weather?: InspectionWeather;
  notes: string;
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
export type NewApiaryInput = Omit<Apiary, 'id'>;
export type NewHiveInput = Pick<Hive, 'apiaryId' | 'name' | 'strength' | 'temperament' | 'boxSystem' | 'notes'>;
export type UpdateApiaryInput = NewApiaryInput;
export type UpdateHiveInput = NewHiveInput;