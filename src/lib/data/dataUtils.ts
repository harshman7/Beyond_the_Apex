/**
 * Data utility functions for querying F1 data
 * TODO: Replace with real API calls (Ergast API, FastF1, etc.)
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
  DRIVERS,
  TEAMS,
  CIRCUITS,
  RACES_BY_SEASON,
  RESULTS_BY_RACE,
  CURRENT_SEASON,
} from './mockData';

export const getDriver = (driverId: string): Driver | undefined => {
  return DRIVERS.find((d) => d.id === driverId);
};

export const getTeam = (teamId: string): Team | undefined => {
  return TEAMS.find((t) => t.id === teamId);
};

export const getCircuit = (circuitId: string): Circuit | undefined => {
  return CIRCUITS.find((c) => c.id === circuitId);
};

export const getRace = (season: number, round: number): Race | undefined => {
  const races = RACES_BY_SEASON.get(season);
  return races?.find((r) => r.round === round);
};

export const getRaces = (season: number): Race[] => {
  return RACES_BY_SEASON.get(season) || [];
};

export const getNextRace = (): Race | undefined => {
  const races = RACES_BY_SEASON.get(CURRENT_SEASON) || [];
  return races.find((r) => !r.completed);
};

export const getRaceResults = (season: number, round: number): Result[] => {
  const raceId = `${season}-${round}`;
  return RESULTS_BY_RACE.get(raceId) || [];
};

export const getDriverResults = (season: number, driverId: string): Result[] => {
  const races = RACES_BY_SEASON.get(season) || [];
  const results: Result[] = [];

  races.forEach((race) => {
    const raceResults = getRaceResults(season, race.round);
    const driverResult = raceResults.find((r) => r.driverId === driverId);
    if (driverResult) {
      results.push(driverResult);
    }
  });

  return results.sort((a, b) => {
    const raceA = getRace(season, parseInt(a.raceId.split('-')[1]));
    const raceB = getRace(season, parseInt(b.raceId.split('-')[1]));
    return (raceA?.round || 0) - (raceB?.round || 0);
  });
};

export const getTeamResults = (season: number, teamId: string): Result[] => {
  const teamDrivers = DRIVERS.filter((d) => d.teamId === teamId);
  const results: Result[] = [];

  teamDrivers.forEach((driver) => {
    const driverResults = getDriverResults(season, driver.id);
    results.push(...driverResults);
  });

  return results;
};

export const getSeasonStandings = (season: number): {
  drivers: Array<{ driver: Driver; points: number; position: number }>;
  teams: Array<{ team: Team; points: number; position: number }>;
} => {
  const races = RACES_BY_SEASON.get(season) || [];
  const driverPoints = new Map<string, number>();
  const teamPoints = new Map<string, number>();

  races.forEach((race) => {
    if (race.completed) {
      const results = getRaceResults(season, race.round);
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
  });

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

export const getHistoricalResults = (seasons: number[]): {
  races: Race[];
  results: Map<string, Result[]>;
} => {
  const races: Race[] = [];
  const results = new Map<string, Result[]>();

  seasons.forEach((season) => {
    const seasonRaces = getRaces(season);
    races.push(...seasonRaces);

    seasonRaces.forEach((race) => {
      const raceResults = getRaceResults(season, race.round);
      if (raceResults.length > 0) {
        results.set(`${race.season}-${race.round}`, raceResults);
      }
    });
  });

  return { races, results };
};

export const getHistoricalMetric = (
  seasons: number[],
  metric: 'points' | 'wins' | 'podiums' | 'averageFinish' | 'averageGrid' | 'DNFs' | 'positionsGained',
  entityType: 'drivers' | 'teams',
  entityId?: string
): HistoricalMetric[] => {
  const metrics: HistoricalMetric[] = [];
  const entities = entityType === 'drivers' ? DRIVERS : TEAMS;
  const targetEntities = entityId ? entities.filter((e) => e.id === entityId) : entities;

  seasons.forEach((season) => {
    const races = getRaces(season).filter((r) => r.completed);

    targetEntities.forEach((entity) => {
      races.forEach((race) => {
        let value = 0;

        if (entityType === 'drivers') {
          const driver = entity as Driver;
          const result = getRaceResults(season, race.round).find((r) => r.driverId === driver.id);

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
          const teamDrivers = DRIVERS.filter((d) => d.teamId === team.id);
          const teamResults = getRaceResults(season, race.round).filter((r) =>
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
      });
    });
  });

  return metrics;
};

export const getCircuitHistory = (circuitId: string, years: number = 5): Array<{
  season: number;
  race: Race;
  winner: Driver | null;
  pole: Driver | null;
  safetyCars: number;
  notableStat?: string;
}> => {
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

  seasons.forEach((season) => {
    const races = getRaces(season);
    const race = races.find((r) => r.circuitId === circuitId && r.completed);

    if (race) {
      const results = getRaceResults(season, race.round);
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
  });

  return history.sort((a, b) => b.season - a.season);
};

// Re-export CURRENT_SEASON for convenience
export { CURRENT_SEASON } from './mockData';

