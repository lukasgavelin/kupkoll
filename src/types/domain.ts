export type HiveStatus = 'Stabilt' | 'Behöver åtgärd' | 'Under uppbyggnad';
export type QueenStatus = 'Bekräftad' | 'Osäker' | 'Behöver följas upp';
export type HiveStrength = 'Starkt' | 'Medel' | 'Svagt';
export type HiveTemperament = 'Lugnt' | 'Vaksamt' | 'Hetsigt';
export type TaskPriority = 'Låg' | 'Medel' | 'Hög';
export type RecommendationSeverity = 'info' | 'warning' | 'critical';
export type SeasonLabel = 'Vintertillsyn' | 'Vårutveckling' | 'Svärmperiod' | 'Drag och skattning' | 'Invintring' | 'Vinterro';
export type HiveBoxSystem = 'Lågnormal 10 ramar' | 'Svensk normal' | 'Langstroth';
export type TaskSource = 'Egen planering' | 'Beslutsstöd';

export type Apiary = {
  id: string;
  name: string;
  location: string;
  notes: string;
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
  lastInspectionAt: string;
  notes: string;
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
  temperament: HiveTemperament;
  actionNeeded: boolean;
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
  season: SeasonLabel;
  createdAt: string;
};

export type NewInspectionInput = Omit<Inspection, 'id' | 'performedAt'>;