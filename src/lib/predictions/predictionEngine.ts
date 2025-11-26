/**
 * Prediction Engine - Heuristic-based predictions
 * TODO: Replace with real ML models (TensorFlow, PyTorch, or external ML service)
 * 
 * Current heuristic combines:
 * - Recent form (last 5 races)
 * - Team performance this season
 * - Track-specific history
 * - Qualifying vs race pace delta
 */

import type {
  DriverPrediction,
  QualifyingPrediction,
  SeasonOutcomeProbabilities,
  DriverTitleProbability,
  TeamTitleProbability,
} from '@/types';
import {
  DRIVERS,
  TEAMS,
  CURRENT_SEASON,
  RACES_BY_SEASON,
} from '../data/mockData';
import {
  getRaceResults,
  getDriverResults,
  getSeasonStandings,
  getCircuitHistory,
  getDriver,
} from '../data/dataUtils';

/**
 * Calculate driver's recent form score (0-1)
 * Higher score = better recent performance
 */
const calculateRecentForm = (driverId: string, races: number = 5): number => {
  const driver = getDriver(driverId);
  if (!driver || driver.last5Results.length === 0) return 0.5;

  const recentResults = driver.last5Results.slice(-races);
  const avgPosition = recentResults.reduce((sum, pos) => sum + pos, 0) / recentResults.length;
  
  // Normalize: P1 = 1.0, P20 = 0.0
  return Math.max(0, 1 - (avgPosition - 1) / 19);
};

/**
 * Calculate team performance score (0-1)
 */
const calculateTeamPerformance = async (teamId: string): Promise<number> => {
  const standings = await getSeasonStandings(CURRENT_SEASON);
  const teamStanding = standings.teams.find((s: any) => s.team.id === teamId);
  
  if (!teamStanding) return 0.5;
  
  // Normalize: P1 = 1.0, P10 = 0.0
  const maxTeams = TEAMS.length;
  return Math.max(0, 1 - (teamStanding.position - 1) / (maxTeams - 1));
};

/**
 * Calculate track-specific performance (0-1)
 */
const calculateTrackPerformance = async (driverId: string, circuitId: string): Promise<number> => {
  const history = await getCircuitHistory(circuitId, 5);
  const driver = getDriver(driverId);
  if (!driver) return 0.5;

  const driverHistory: Array<{ finishPosition: number }> = [];
  for (const h of history) {
    const results = await getRaceResults(h.season, h.race.round);
    const result = results.find((r: any) => r.driverId === driverId);
    if (result) {
      driverHistory.push({ finishPosition: result.finishPosition });
    }
  }

  if (driverHistory.length === 0) return 0.5;

  const avgPosition = driverHistory.reduce((sum, r) => sum + r.finishPosition, 0) / driverHistory.length;
  return Math.max(0, 1 - (avgPosition - 1) / 19);
};

/**
 * Calculate qualifying vs race pace delta
 * Positive = better race pace, negative = better quali pace
 */
const calculatePaceDelta = async (driverId: string): Promise<number> => {
  const results = await getDriverResults(CURRENT_SEASON, driverId);
  if (results.length === 0) return 0;

  const avgGrid = results.reduce((sum: number, r: any) => sum + r.grid, 0) / results.length;
  const avgFinish = results.reduce((sum: number, r: any) => sum + r.finishPosition, 0) / results.length;
  
  return avgGrid - avgFinish; // Positive = gains positions
};

/**
 * Generate race predictions for a specific race
 */
export const getRacePredictions = async (
  season: number,
  round: number
): Promise<DriverPrediction[]> => {
  const race = RACES_BY_SEASON.get(season)?.find((r) => r.round === round);
  if (!race) return [];

  const predictions: DriverPrediction[] = [];

  for (const driver of DRIVERS) {
    const recentForm = calculateRecentForm(driver.id);
    const teamPerf = await calculateTeamPerformance(driver.teamId);
    const trackPerf = await calculateTrackPerformance(driver.id, race.circuitId);
    const paceDelta = await calculatePaceDelta(driver.id);

    // Weighted combination
    const baseScore = 
      recentForm * 0.35 +
      teamPerf * 0.30 +
      trackPerf * 0.25 +
      (paceDelta > 0 ? 0.1 : 0) * 0.10;

    // Convert score to expected position (1-20)
    const expectedPosition = Math.max(1, Math.min(20, Math.round(21 - baseScore * 20)));

    // Calculate probabilities
    const winProbability = baseScore > 0.85 ? baseScore * 0.6 : baseScore * 0.3;
    const podiumProbability = baseScore > 0.7 ? baseScore * 0.8 : baseScore * 0.5;

    // Points projection
    const pointsMap = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    const pointsProjection = expectedPosition <= 10 ? pointsMap[expectedPosition - 1] : 0;

    // Confidence based on data availability
    const history = await getCircuitHistory(race.circuitId, 5);
    const hasHistory = history.length > 0;
    const hasRecentResults = driver.last5Results.length >= 3;
    const confidenceScore = (hasHistory ? 0.4 : 0.2) + (hasRecentResults ? 0.4 : 0.2) + 0.2;

    predictions.push({
      driverId: driver.id,
      expectedFinishPosition: expectedPosition,
      podiumProbability: Math.min(1, Math.max(0, podiumProbability)),
      winProbability: Math.min(1, Math.max(0, winProbability)),
      pointsProjection,
      confidenceScore: Math.min(1, Math.max(0, confidenceScore)),
      reasoning: `Based on recent form (${(recentForm * 100).toFixed(0)}%), team performance, and track history.`,
    });
  }

  return predictions.sort((a, b) => a.expectedFinishPosition - b.expectedFinishPosition);
};

/**
 * Generate qualifying predictions
 */
export const getQualiPredictions = async (
  season: number,
  round: number
): Promise<QualifyingPrediction[]> => {
  const race = RACES_BY_SEASON.get(season)?.find((r) => r.round === round);
  if (!race) return [];

  const racePredictions = await getRacePredictions(season, round);
  
  // Qualifying is similar but with slight adjustments
  const qualiPreds: QualifyingPrediction[] = [];
  for (const pred of racePredictions) {
    const paceDelta = await calculatePaceDelta(pred.driverId);
    
    // Drivers with better quali pace get slight boost
    const qualiAdjustment = paceDelta < 0 ? -1 : paceDelta > 2 ? 1 : 0;
    const expectedGrid = Math.max(1, Math.min(20, pred.expectedFinishPosition + qualiAdjustment));

    // Mock times (in reality, would use historical quali times)
    const baseTime = 90 + Math.random() * 5; // 90-95 seconds
    const timeDelta = (expectedGrid - 1) * 0.3; // ~0.3s per position

    const qualiPred: QualifyingPrediction = {
      ...pred,
      expectedGridPosition: expectedGrid,
      predictedQ1Time: `${Math.floor(baseTime + timeDelta)}.${Math.floor((baseTime + timeDelta - Math.floor(baseTime + timeDelta)) * 1000).toString().padStart(3, '0')}`,
      predictedQ2Time: `${Math.floor(baseTime + timeDelta - 1)}.${Math.floor((baseTime + timeDelta - 1 - Math.floor(baseTime + timeDelta - 1)) * 1000).toString().padStart(3, '0')}`,
      predictedQ3Time: `${Math.floor(baseTime + timeDelta - 2)}.${Math.floor((baseTime + timeDelta - 2 - Math.floor(baseTime + timeDelta - 2)) * 1000).toString().padStart(3, '0')}`,
      q3CutoffProbability: expectedGrid <= 10 ? 0.8 : expectedGrid <= 15 ? 0.4 : 0.1,
    };
    qualiPreds.push(qualiPred);
  }
  return qualiPreds;
};

/**
 * Calculate season outcome probabilities
 */
export const getSeasonOutcomeProbabilities = async (
  season: number
): Promise<SeasonOutcomeProbabilities> => {
  const standings = await getSeasonStandings(season);
  const races = RACES_BY_SEASON.get(season) || [];
  const completedRaces = races.filter((r) => r.completed).length;
  const totalRaces = races.length;
  const remainingRaces = totalRaces - completedRaces;

  // Driver championship
  const driverProbs: DriverTitleProbability[] = await Promise.all(standings.drivers.map(async (standing) => {
    const driver = standing.driver;
    const currentPoints = standing.points;
    const avgPointsPerRace = completedRaces > 0 ? currentPoints / completedRaces : 0;
    const projectedFinalPoints = currentPoints + avgPointsPerRace * remainingRaces;

    // Probability based on current lead and form
    const pointsGap = standing.position === 1 
      ? currentPoints - (standings.drivers[1]?.points || 0)
      : (standings.drivers[0]?.points || 0) - currentPoints;

    const formScore = calculateRecentForm(driver.id);
    const teamScore = await calculateTeamPerformance(driver.teamId);
    // teamScore is used in titleProbability calculation below

    // Heuristic probability
    let titleProbability = 0;
    if (standing.position === 1) {
      titleProbability = Math.min(0.95, 0.5 + (pointsGap / 100) + formScore * 0.2 + teamScore * 0.1);
    } else {
      titleProbability = Math.max(0.01, 0.3 - (standing.position - 1) * 0.1 + formScore * 0.15 + teamScore * 0.1);
    }

    return {
      driverId: driver.id,
      titleProbability: Math.min(1, Math.max(0, titleProbability)),
      projectedFinalPoints: Math.round(projectedFinalPoints),
      projectedFinalPosition: standing.position,
    };
  }));

  // Constructor championship
  const teamProbs: TeamTitleProbability[] = await Promise.all(standings.teams.map(async (standing) => {
    const team = standing.team;
    const currentPoints = standing.points;
    const avgPointsPerRace = completedRaces > 0 ? currentPoints / completedRaces : 0;
    const projectedFinalPoints = currentPoints + avgPointsPerRace * remainingRaces;

    const pointsGap = standing.position === 1
      ? currentPoints - (standings.teams[1]?.points || 0)
      : (standings.teams[0]?.points || 0) - currentPoints;

    const teamScore = await calculateTeamPerformance(team.id);

    let titleProbability = 0;
    if (standing.position === 1) {
      titleProbability = Math.min(0.95, 0.5 + (pointsGap / 150) + teamScore * 0.25);
    } else {
      titleProbability = Math.max(0.01, 0.25 - (standing.position - 1) * 0.08 + teamScore * 0.2);
    }

    return {
      teamId: team.id,
      titleProbability: Math.min(1, Math.max(0, titleProbability)),
      projectedFinalPoints: Math.round(projectedFinalPoints),
      projectedFinalPosition: standing.position,
    };
  }));

  // Normalize probabilities to sum to ~1.0
  const driverSum = driverProbs.reduce((sum, p) => sum + p.titleProbability, 0);
  driverProbs.forEach((p) => {
    p.titleProbability = p.titleProbability / driverSum;
  });

  const teamSum = teamProbs.reduce((sum, p) => sum + p.titleProbability, 0);
  teamProbs.forEach((p) => {
    p.titleProbability = p.titleProbability / teamSum;
  });

  return {
    driverTitle: driverProbs.sort((a, b) => b.titleProbability - a.titleProbability),
    constructorTitle: teamProbs.sort((a, b) => b.titleProbability - a.titleProbability),
  };
};

/**
 * Get prediction accuracy for historical races
 */
export const getPredictionAccuracy = async (
  season: number,
  rounds: number[]
): Promise<Array<{
  raceId: string;
  driverId: string;
  predictedPosition: number;
  actualPosition: number;
  error: number;
}>> => {
  const accuracy: Array<{
    raceId: string;
    driverId: string;
    predictedPosition: number;
    actualPosition: number;
    error: number;
  }> = [];

  for (const round of rounds) {
    const predictions = await getRacePredictions(season, round);
    const results = await getRaceResults(season, round);

    predictions.forEach((pred: any) => {
      const result = results.find((r: any) => r.driverId === pred.driverId);
      if (result) {
        accuracy.push({
          raceId: `${season}-${round}`,
          driverId: pred.driverId,
          predictedPosition: pred.expectedFinishPosition,
          actualPosition: result.finishPosition,
          error: Math.abs(pred.expectedFinishPosition - result.finishPosition),
        });
      }
    });
  }

  return accuracy;
};

