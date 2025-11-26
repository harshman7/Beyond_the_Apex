/**
 * Advanced Analytics Utilities
 * Additional statistics and insights beyond basic data
 */

import type { Race, Result } from '@/types';

/**
 * Calculate driver consistency score (0-1)
 * Higher = more consistent finishes
 */
export const calculateConsistency = (results: Result[]): number => {
  if (results.length === 0) return 0;

  const positions = results.map((r) => r.finishPosition);
  const mean = positions.reduce((sum, p) => sum + p, 0) / positions.length;
  const variance = positions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / positions.length;
  const stdDev = Math.sqrt(variance);

  // Normalize: lower stdDev = higher consistency
  // Max stdDev for F1 is ~10 (very inconsistent), min is ~0 (perfect consistency)
  return Math.max(0, 1 - stdDev / 10);
};

/**
 * Calculate overtaking rate (overtakes per race)
 */
export const calculateOvertakingRate = (results: Result[]): number => {
  if (results.length === 0) return 0;

  const overtakes = results.filter((r) => r.finishPosition < r.grid).length;
  return overtakes / results.length;
};

/**
 * Calculate reliability score (0-1)
 * Higher = fewer DNFs
 */
export const calculateReliability = (results: Result[]): number => {
  if (results.length === 0) return 0;

  const finished = results.filter((r) => !r.DNF).length;
  return finished / results.length;
};

/**
 * Calculate average points per race
 */
export const calculateAveragePoints = (results: Result[]): number => {
  if (results.length === 0) return 0;

  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  return totalPoints / results.length;
};

/**
 * Calculate head-to-head record between two drivers
 */
export const calculateHeadToHead = (
  driver1Results: Result[],
  driver2Results: Result[]
): { driver1Wins: number; driver2Wins: number; ties: number } => {
  const commonRaces = new Set<string>();
  driver1Results.forEach((r) => commonRaces.add(r.raceId));
  driver2Results.forEach((r) => commonRaces.add(r.raceId));

  let driver1Wins = 0;
  let driver2Wins = 0;
  let ties = 0;

  commonRaces.forEach((raceId) => {
    const d1Result = driver1Results.find((r) => r.raceId === raceId);
    const d2Result = driver2Results.find((r) => r.raceId === raceId);

    if (d1Result && d2Result && !d1Result.DNF && !d2Result.DNF) {
      if (d1Result.finishPosition < d2Result.finishPosition) {
        driver1Wins++;
      } else if (d2Result.finishPosition < d1Result.finishPosition) {
        driver2Wins++;
      } else {
        ties++;
      }
    }
  });

  return { driver1Wins, driver2Wins, ties };
};

/**
 * Calculate team performance trend
 */
export const calculateTeamTrend = (
  teamResults: Result[],
  recentRaces: number = 5
): 'improving' | 'declining' | 'stable' => {
  if (teamResults.length < recentRaces) return 'stable';

  // Sort by raceId (assuming raceId format is "season-round" or similar)
  const sorted = [...teamResults].sort((a, b) => {
    return b.raceId.localeCompare(a.raceId);
  });

  const recent = sorted.slice(0, recentRaces);
  const older = sorted.slice(recentRaces, recentRaces * 2);

  if (older.length === 0) return 'stable';

  const recentAvg = recent.reduce((sum, r) => sum + r.finishPosition, 0) / recent.length;
  const olderAvg = older.reduce((sum, r) => sum + r.finishPosition, 0) / older.length;

  const diff = olderAvg - recentAvg; // Positive = improving (lower positions)

  if (diff > 2) return 'improving';
  if (diff < -2) return 'declining';
  return 'stable';
};

/**
 * Calculate championship momentum
 */
export const calculateMomentum = (
  recentResults: Result[],
  olderResults: Result[]
): number => {
  if (recentResults.length === 0 || olderResults.length === 0) return 0;

  const recentAvg = recentResults.reduce((sum, r) => sum + r.points, 0) / recentResults.length;
  const olderAvg = olderResults.reduce((sum, r) => sum + r.points, 0) / olderResults.length;

  // Normalize: -1 to 1, where 1 = strong positive momentum
  return Math.max(-1, Math.min(1, (recentAvg - olderAvg) / 10));
};

/**
 * Calculate race complexity score
 * Based on safety cars, DNFs, position changes
 */
export const calculateRaceComplexity = (results: Result[], race: Race): number => {
  const dnfCount = results.filter((r) => r.DNF).length;
  const safetyCars = race.safetyCars || 0;
  const positionChanges = results.filter((r) => r.finishPosition !== r.grid).length;

  // Normalize to 0-1 scale
  const dnfScore = Math.min(1, dnfCount / 10);
  const scScore = Math.min(1, safetyCars / 5);
  const positionScore = Math.min(1, positionChanges / 20);

  return (dnfScore * 0.4 + scScore * 0.3 + positionScore * 0.3);
};

/**
 * Get driver performance breakdown
 */
export interface DriverPerformanceBreakdown {
  consistency: number;
  overtakingRate: number;
  reliability: number;
  averagePoints: number;
  momentum: number;
  bestFinish: number;
  worstFinish: number;
  podiumRate: number;
  pointsFinishRate: number;
}

export const getDriverPerformanceBreakdown = (
  results: Result[]
): DriverPerformanceBreakdown => {
  if (results.length === 0) {
    return {
      consistency: 0,
      overtakingRate: 0,
      reliability: 0,
      averagePoints: 0,
      momentum: 0,
      bestFinish: 20,
      worstFinish: 20,
      podiumRate: 0,
      pointsFinishRate: 0,
    };
  }

  const finishedResults = results.filter((r) => !r.DNF);
  const positions = finishedResults.map((r) => r.finishPosition);

  return {
    consistency: calculateConsistency(finishedResults),
    overtakingRate: calculateOvertakingRate(results),
    reliability: calculateReliability(results),
    averagePoints: calculateAveragePoints(results),
    momentum: 0, // Would need historical comparison
    bestFinish: Math.min(...positions),
    worstFinish: Math.max(...positions),
    podiumRate: finishedResults.filter((r) => r.finishPosition <= 3).length / results.length,
    pointsFinishRate: finishedResults.filter((r) => r.points > 0).length / results.length,
  };
};

