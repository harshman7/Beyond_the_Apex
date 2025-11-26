/**
 * Core domain models for F1 Analytics Dashboard
 */

export interface Driver {
  id: string;
  name: string;
  code: string;
  teamId: string;
  carNumber: number;
  nationality: string;
  rookie: boolean;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  last5Results: number[]; // finish positions
}

export interface Team {
  id: string;
  name: string;
  engine: string;
  primaryColor: string;
  secondaryColor: string;
  totalPoints: number;
  wins: number;
  podiums: number;
}

export interface Circuit {
  id: string;
  name: string;
  country: string;
  city: string;
  laps: number;
  lapDistance: number; // in km
  raceDistance: number; // in km
  trackType: 'street' | 'permanent';
  layoutImageUrl?: string;
}

export interface Race {
  season: number;
  round: number;
  name: string;
  circuitId: string;
  date: string; // ISO date string
  weatherSummary: {
    temperature: number;
    condition: 'dry' | 'wet' | 'mixed';
    chanceOfRain: number;
    windSpeed: number;
  };
  safetyCars: number;
  DNFs: number;
  completed: boolean;
}

export interface Session {
  raceId: string;
  type: 'FP1' | 'FP2' | 'FP3' | 'Qualifying' | 'Race';
  results: SessionResult[];
}

export interface SessionResult {
  driverId: string;
  position: number;
  time?: string; // lap time
  q1Time?: string;
  q2Time?: string;
  q3Time?: string;
  grid?: number;
  points?: number;
  fastestLap?: boolean;
  tyreStints?: TyreStint[];
  DNF?: boolean;
  DNFReason?: string;
}

export interface TyreStint {
  compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
  laps: number;
  startLap: number;
  endLap: number;
}

export interface Result {
  raceId: string;
  driverId: string;
  grid: number;
  finishPosition: number;
  points: number;
  fastestLap: boolean;
  tyreStints: TyreStint[];
  DNF: boolean;
  DNFReason?: string;
}

export interface DriverPrediction {
  driverId: string;
  expectedFinishPosition: number;
  podiumProbability: number; // 0-1
  winProbability: number; // 0-1
  pointsProjection: number;
  confidenceScore: number; // 0-1
  reasoning?: string;
}

export interface QualifyingPrediction extends DriverPrediction {
  expectedGridPosition: number;
  predictedQ1Time?: string;
  predictedQ2Time?: string;
  predictedQ3Time?: string;
  q3CutoffProbability: number; // 0-1
}

export interface DriverTitleProbability {
  driverId: string;
  titleProbability: number; // 0-1
  projectedFinalPoints: number;
  projectedFinalPosition: number;
}

export interface TeamTitleProbability {
  teamId: string;
  titleProbability: number; // 0-1
  projectedFinalPoints: number;
  projectedFinalPosition: number;
}

export interface SeasonOutcomeProbabilities {
  driverTitle: DriverTitleProbability[];
  constructorTitle: TeamTitleProbability[];
}

export interface HistoricalMetric {
  season: number;
  round: number;
  driverId?: string;
  teamId?: string;
  value: number;
}

export interface PredictionAccuracy {
  raceId: string;
  driverId: string;
  predictedPosition: number;
  actualPosition: number;
  error: number; // absolute difference
}

