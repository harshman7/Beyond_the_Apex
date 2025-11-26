/**
 * Data utility functions for querying F1 data
 * Now uses Ergast API with fallback to mock data
 */

import type {
  Driver,
  Team,
  Race,
  Circuit,
  Result,
  HistoricalMetric,
} from '@/types';
import {
  CURRENT_SEASON,
} from './mockData';
import {
  getRacesFromAPI,
  getRaceResultsFromAPI,
  getDriversFromAPI,
  getTeamsFromAPI,
  getCircuitsFromAPI,
} from '../api/f1DataService';

// Cache for API data
let driversCache: Driver[] | null = null;
let teamsCache: Team[] | null = null;
let circuitsCache: Circuit[] | null = null;
const racesCache = new Map<number, Race[]>();
const resultsCache = new Map<string, Result[]>();

// Initialize caches on first load - OpenF1 API only
let initialized = false;
const initializeCaches = async () => {
  if (initialized) {
    console.log('[Cache] ✅ Caches already initialized');
    return;
  }
  console.log('[Cache] 🚀 Initializing caches from OpenF1 API...');
  const startTime = Date.now();
  try {
    console.log('[Cache] 📦 Loading drivers...');
    driversCache = await getDriversFromAPI(CURRENT_SEASON);
    console.log('[Cache] 📦 Loading teams...');
    teamsCache = await getTeamsFromAPI(CURRENT_SEASON);
    console.log('[Cache] 📦 Loading circuits...');
    circuitsCache = await getCircuitsFromAPI();
    console.log('[Cache] 📦 Loading races...');
    const races = await getRacesFromAPI(CURRENT_SEASON);
    racesCache.set(CURRENT_SEASON, races);
    initialized = true;
    const duration = Date.now() - startTime;
    console.log(`[Cache] ✅ Caches initialized successfully (${duration}ms)`);
    console.log(`[Cache] 📊 Cache stats: ${driversCache?.length || 0} drivers, ${teamsCache?.length || 0} teams, ${circuitsCache?.length || 0} circuits, ${races.length} races`);
  } catch (error) {
    console.error('[Cache] ❌ Error initializing caches from OpenF1 API:', error);
    // Don't fallback - let the error propagate so UI can show it
    throw error;
  }
};

// Initialize on import (non-blocking) - don't block app startup
// Caches will be populated when first accessed
setTimeout(() => {
  initializeCaches().catch((error) => {
    console.error('[Cache] ❌ Failed to initialize caches:', error);
    // Don't throw - let the app continue with empty caches
  });
}, 100);

export const getDriver = (driverId: string): Driver | undefined => {
  if (!driversCache) {
    console.warn('Drivers cache not initialized yet');
    return undefined;
  }
  return driversCache.find((d) => d.id === driverId);
};

export const getTeam = (teamId: string): Team | undefined => {
  if (!teamsCache) {
    console.warn('Teams cache not initialized yet');
    return undefined;
  }
  return teamsCache.find((t) => t.id === teamId);
};

export const getCircuit = (circuitId: string): Circuit | undefined => {
  if (!circuitsCache) {
    console.warn('Circuits cache not initialized yet');
    return undefined;
  }
  return circuitsCache.find((c) => c.id === circuitId);
};

export const getRace = async (season: number, round: number): Promise<Race | undefined> => {
  let races = racesCache.get(season);
  if (!races) {
    races = await getRacesFromAPI(season);
    racesCache.set(season, races);
  }
  return races.find((r) => r.round === round);
};

export const getRaces = async (season: number): Promise<Race[]> => {
  let races = racesCache.get(season);
  if (!races) {
    races = await getRacesFromAPI(season);
    racesCache.set(season, races);
  }
  return races;
};

export const getNextRace = async (): Promise<Race | undefined> => {
  const races = await getRaces(CURRENT_SEASON);
  return races.find((r) => !r.completed);
};

export const getRaceResults = async (season: number, round: number): Promise<Result[]> => {
  const raceId = `${season}-${round}`;
  let results = resultsCache.get(raceId);
  if (!results) {
    results = await getRaceResultsFromAPI(season, round);
    resultsCache.set(raceId, results);
  }
  return results;
};

export const getDriverResults = async (season: number, driverId: string): Promise<Result[]> => {
  const races = await getRaces(season);
  const results: Result[] = [];

  for (const race of races) {
    const raceResults = await getRaceResults(season, race.round);
    const driverResult = raceResults.find((r) => r.driverId === driverId);
    if (driverResult) {
      results.push(driverResult);
    }
  }

  return results.sort((a, b) => {
    const roundA = parseInt(a.raceId.split('-')[1]);
    const roundB = parseInt(b.raceId.split('-')[1]);
    return roundA - roundB;
  });
};

export const getTeamResults = async (season: number, teamId: string): Promise<Result[]> => {
  if (!driversCache) {
    throw new Error('Drivers cache not initialized');
  }
  const teamDrivers = driversCache.filter((d) => d.teamId === teamId);
  const results: Result[] = [];

  for (const driver of teamDrivers) {
    const driverResults = await getDriverResults(season, driver.id);
    results.push(...driverResults);
  }

  return results;
};

export const getSeasonStandings = async (season: number): Promise<{
  drivers: Array<{ driver: Driver; points: number; position: number }>;
  teams: Array<{ team: Team; points: number; position: number }>;
}> => {
  const races = await getRaces(season);
  const driverPoints = new Map<string, number>();
  const teamPoints = new Map<string, number>();

  for (const race of races) {
    if (race.completed) {
      const results = await getRaceResults(season, race.round);
      results.forEach((result) => {
        const driver = getDriver(result.driverId);
        if (driver) {
          const current = driverPoints.get(driver.id) || 0;
          driverPoints.set(driver.id, current + result.points);

          const teamCurrent = teamPoints.get(driver.teamId) || 0;
          teamPoints.set(driver.teamId, teamCurrent + result.points);
        }
      });
    }
  }

  const driverStandings = Array.from(driverPoints.entries())
    .map(([driverId, points]) => ({
      driver: getDriver(driverId)!,
      points,
      position: 0,
    }))
    .sort((a, b) => b.points - a.points);

  driverStandings.forEach((standing, index) => {
    standing.position = index + 1;
  });

  const teamStandings = Array.from(teamPoints.entries())
    .map(([teamId, points]) => ({
      team: getTeam(teamId)!,
      points,
      position: 0,
    }))
    .sort((a, b) => b.points - a.points);

  teamStandings.forEach((standing, index) => {
    standing.position = index + 1;
  });

  return {
    drivers: driverStandings,
    teams: teamStandings,
  };
};

export const getHistoricalResults = async (seasons: number[]): Promise<{
  races: Race[];
  results: Map<string, Result[]>;
}> => {
  const races: Race[] = [];
  const results = new Map<string, Result[]>();

  for (const season of seasons) {
    const seasonRaces = await getRaces(season);
    races.push(...seasonRaces);

    for (const race of seasonRaces) {
      const raceResults = await getRaceResults(season, race.round);
      if (raceResults.length > 0) {
        results.set(`${race.season}-${race.round}`, raceResults);
      }
    }
  }

  return { races, results };
};

export const getHistoricalMetric = async (
  seasons: number[],
  metric: 'points' | 'wins' | 'podiums' | 'averageFinish' | 'averageGrid' | 'DNFs' | 'positionsGained',
  entityType: 'drivers' | 'teams',
  entityId?: string
): Promise<HistoricalMetric[]> => {
  const metrics: HistoricalMetric[] = [];
  if (!driversCache || !teamsCache) {
    throw new Error('Data caches not initialized. Please wait for data to load.');
  }
  const entities = entityType === 'drivers' ? driversCache : teamsCache;
  const targetEntities = entityId ? entities.filter((e: Driver | Team) => e.id === entityId) : entities;

  for (const season of seasons) {
    const races = (await getRaces(season)).filter((r) => r.completed);

    for (const entity of targetEntities) {
      for (const race of races) {
        let value = 0;

        if (entityType === 'drivers') {
          const driver = entity as Driver;
          const results = await getRaceResults(season, race.round);
          const result = results.find((r) => r.driverId === driver.id);

          if (result) {
            switch (metric) {
              case 'points':
                value = result.points;
                break;
              case 'wins':
                value = result.finishPosition === 1 ? 1 : 0;
                break;
              case 'podiums':
                value = result.finishPosition <= 3 ? 1 : 0;
                break;
              case 'averageFinish':
                value = result.finishPosition;
                break;
              case 'averageGrid':
                value = result.grid;
                break;
              case 'DNFs':
                value = result.DNF ? 1 : 0;
                break;
              case 'positionsGained':
                value = result.grid - result.finishPosition;
                break;
            }
          }
        } else {
          const team = entity as Team;
          if (!driversCache) {
            continue; // Skip if cache not ready
          }
          const teamDrivers = driversCache.filter((d) => d.teamId === team.id);
          const raceResults = await getRaceResults(season, race.round);
          const teamResults = raceResults.filter((r) =>
            teamDrivers.some((d) => d.id === r.driverId)
          );

          switch (metric) {
            case 'points':
              value = teamResults.reduce((sum, r) => sum + r.points, 0);
              break;
            case 'wins':
              value = teamResults.some((r) => r.finishPosition === 1) ? 1 : 0;
              break;
            case 'podiums':
              value = teamResults.filter((r) => r.finishPosition <= 3).length;
              break;
            case 'averageFinish':
              value = teamResults.length > 0
                ? teamResults.reduce((sum, r) => sum + r.finishPosition, 0) / teamResults.length
                : 0;
              break;
            case 'averageGrid':
              value = teamResults.length > 0
                ? teamResults.reduce((sum, r) => sum + r.grid, 0) / teamResults.length
                : 0;
              break;
            case 'DNFs':
              value = teamResults.filter((r) => r.DNF).length;
              break;
            case 'positionsGained':
              value = teamResults.reduce((sum, r) => sum + (r.grid - r.finishPosition), 0);
              break;
          }
        }

        if (value !== 0 || metric === 'averageFinish' || metric === 'averageGrid') {
          metrics.push({
            season,
            round: race.round,
            driverId: entityType === 'drivers' ? entity.id : undefined,
            teamId: entityType === 'teams' ? entity.id : undefined,
            value,
          });
        }
      }
    }
  }

  return metrics;
};

export const getCircuitHistory = async (circuitId: string, years: number = 5): Promise<Array<{
  season: number;
  race: Race;
  winner: Driver | null;
  pole: Driver | null;
  safetyCars: number;
  notableStat?: string;
}>> => {
  const history: Array<{
    season: number;
    race: Race;
    winner: Driver | null;
    pole: Driver | null;
    safetyCars: number;
    notableStat?: string;
  }> = [];

  const currentYear = new Date().getFullYear();
  const seasons = Array.from({ length: years }, (_, i) => currentYear - i);

  for (const season of seasons) {
    const races = await getRaces(season);
    const race = races.find((r) => r.circuitId === circuitId && r.completed);

    if (race) {
      const results = await getRaceResults(season, race.round);
      const winnerResult = results.find((r) => r.finishPosition === 1);
      const poleResult = results.find((r) => r.grid === 1);

      history.push({
        season,
        race,
        winner: winnerResult ? getDriver(winnerResult.driverId) || null : null,
        pole: poleResult ? getDriver(poleResult.driverId) || null : null,
        safetyCars: race.safetyCars,
        notableStat: race.DNFs > 3 ? `High attrition: ${race.DNFs} DNFs` : undefined,
      });
    }
  }

  return history.sort((a, b) => b.season - a.season);
};

// Re-export CURRENT_SEASON for convenience
export { CURRENT_SEASON } from './mockData';

