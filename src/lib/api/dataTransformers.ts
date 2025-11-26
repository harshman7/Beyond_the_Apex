/**
 * Data transformation functions to convert Ergast API responses to our domain models
 */

import type {
  Driver,
  Team,
  Race,
  Circuit,
  Result,
} from '@/types';
import type {
  ErgastRace,
  ErgastResult,
  ErgastDriver,
  ErgastConstructor,
} from './ergastClient';

/**
 * Transform Ergast driver to our Driver model
 */
export const transformDriver = (
  ergastDriver: ErgastDriver,
  teamId?: string,
  stats?: {
    points: number;
    wins: number;
    podiums: number;
    poles: number;
    last5Results: number[];
  }
): Driver => {
  return {
    id: ergastDriver.driverId,
    name: `${ergastDriver.givenName} ${ergastDriver.familyName}`,
    code: ergastDriver.code || ergastDriver.driverId.toUpperCase().slice(0, 3),
    teamId: teamId || '',
    carNumber: parseInt(ergastDriver.permanentNumber || '0'),
    nationality: ergastDriver.nationality,
    rookie: false, // Would need additional data to determine
    points: stats?.points || 0,
    wins: stats?.wins || 0,
    podiums: stats?.podiums || 0,
    poles: stats?.poles || 0,
    last5Results: stats?.last5Results || [],
  };
};

/**
 * Transform Ergast constructor to our Team model
 */
export const transformTeam = (
  ergastConstructor: ErgastConstructor,
  stats?: {
    totalPoints: number;
    wins: number;
    podiums: number;
  }
): Team => {
  // Map constructor names to our team IDs and colors
  const teamMap: Record<string, { id: string; primaryColor: string; secondaryColor: string; engine: string }> = {
    'red bull': { id: 'redbull', primaryColor: '#1E41FF', secondaryColor: '#0600EF', engine: 'Honda RBPT' },
    'red bull racing': { id: 'redbull', primaryColor: '#1E41FF', secondaryColor: '#0600EF', engine: 'Honda RBPT' },
    'mercedes': { id: 'mercedes', primaryColor: '#00D2BE', secondaryColor: '#000000', engine: 'Mercedes' },
    'ferrari': { id: 'ferrari', primaryColor: '#DC143C', secondaryColor: '#000000', engine: 'Ferrari' },
    'mclaren': { id: 'mclaren', primaryColor: '#FF8700', secondaryColor: '#000000', engine: 'Mercedes' },
    'aston martin': { id: 'aston-martin', primaryColor: '#00665E', secondaryColor: '#000000', engine: 'Mercedes' },
    'alpine': { id: 'alpine', primaryColor: '#0090FF', secondaryColor: '#FF014D', engine: 'Renault' },
    'williams': { id: 'williams', primaryColor: '#005AFF', secondaryColor: '#FFFFFF', engine: 'Mercedes' },
    'alphatauri': { id: 'alphatauri', primaryColor: '#2B4562', secondaryColor: '#FFFFFF', engine: 'Honda RBPT' },
    'rb': { id: 'alphatauri', primaryColor: '#2B4562', secondaryColor: '#FFFFFF', engine: 'Honda RBPT' },
    'alfa romeo': { id: 'alfa-romeo', primaryColor: '#900000', secondaryColor: '#FFFFFF', engine: 'Ferrari' },
    'sauber': { id: 'alfa-romeo', primaryColor: '#900000', secondaryColor: '#FFFFFF', engine: 'Ferrari' },
    'haas': { id: 'haas', primaryColor: '#FFFFFF', secondaryColor: '#ED1C24', engine: 'Ferrari' },
  };

  const nameLower = ergastConstructor.name.toLowerCase();
  const teamInfo = teamMap[nameLower] || {
    id: ergastConstructor.constructorId,
    primaryColor: '#666666',
    secondaryColor: '#000000',
    engine: 'Unknown',
  };

  return {
    id: teamInfo.id,
    name: ergastConstructor.name,
    engine: teamInfo.engine,
    primaryColor: teamInfo.primaryColor,
    secondaryColor: teamInfo.secondaryColor,
    totalPoints: stats?.totalPoints || 0,
    wins: stats?.wins || 0,
    podiums: stats?.podiums || 0,
  };
};

/**
 * Transform Ergast race to our Race model
 */
export const transformRace = (ergastRace: ErgastRace): Race => {
  return {
    season: parseInt(ergastRace.season),
    round: parseInt(ergastRace.round),
    name: ergastRace.raceName,
    circuitId: ergastRace.Circuit.circuitId,
    date: ergastRace.date,
    weatherSummary: {
      temperature: 20, // Not available in Ergast, using default
      condition: 'dry',
      chanceOfRain: 0,
      windSpeed: 0,
    },
    safetyCars: 0, // Not available in Ergast
    DNFs: 0, // Will be calculated from results
    completed: !!ergastRace.Results && ergastRace.Results.length > 0,
  };
};

/**
 * Transform Ergast circuit to our Circuit model
 */
export const transformCircuit = (ergastCircuit: any): Circuit => {
  // Ergast doesn't provide lap distance directly, using estimates
  const circuitEstimates: Record<string, { laps: number; lapDistance: number }> = {
    'bahrain': { laps: 57, lapDistance: 5.412 },
    'jeddah': { laps: 50, lapDistance: 6.174 },
    'albert_park': { laps: 58, lapDistance: 5.278 },
    'suzuka': { laps: 53, lapDistance: 5.807 },
    'shanghai': { laps: 56, lapDistance: 5.451 },
    'miami': { laps: 57, lapDistance: 5.412 },
    'imola': { laps: 63, lapDistance: 4.909 },
    'monaco': { laps: 78, lapDistance: 3.337 },
    'villeneuve': { laps: 70, lapDistance: 4.361 },
    'catalunya': { laps: 66, lapDistance: 4.675 },
    'red_bull_ring': { laps: 71, lapDistance: 4.318 },
    'silverstone': { laps: 52, lapDistance: 5.891 },
    'hungaroring': { laps: 70, lapDistance: 4.381 },
    'spa': { laps: 44, lapDistance: 7.004 },
    'zandvoort': { laps: 72, lapDistance: 4.259 },
    'monza': { laps: 53, lapDistance: 5.793 },
    'baku': { laps: 51, lapDistance: 6.003 },
    'marina_bay': { laps: 61, lapDistance: 5.063 },
    'americas': { laps: 56, lapDistance: 5.513 },
    'rodriguez': { laps: 71, lapDistance: 4.304 },
    'interlagos': { laps: 71, lapDistance: 4.309 },
    'vegas': { laps: 50, lapDistance: 6.12 },
    'losail': { laps: 57, lapDistance: 5.38 },
    'yas_marina': { laps: 58, lapDistance: 5.281 },
  };

  const circuitId = ergastCircuit.circuitId;
  const estimate = circuitEstimates[circuitId] || { laps: 50, lapDistance: 5.0 };

  return {
    id: circuitId,
    name: ergastCircuit.circuitName,
    country: ergastCircuit.Location.country,
    city: ergastCircuit.Location.locality,
    laps: estimate.laps,
    lapDistance: estimate.lapDistance,
    raceDistance: estimate.laps * estimate.lapDistance,
    trackType: circuitId.includes('street') || circuitId === 'monaco' || circuitId === 'baku' || circuitId === 'marina_bay' ? 'street' : 'permanent',
  };
};

/**
 * Transform Ergast result to our Result model
 */
export const transformResult = (
  ergastResult: ErgastResult,
  raceId: string
): Result => {
  const position = parseInt(ergastResult.position);
  const points = parseFloat(ergastResult.points);
  const grid = parseInt(ergastResult.grid);
  const status = ergastResult.status.toLowerCase();
  const DNF = !status.includes('finished') && status !== 'classified';

  return {
    raceId,
    driverId: ergastResult.Driver.driverId,
    grid,
    finishPosition: DNF ? 20 : position,
    points: DNF ? 0 : points,
    fastestLap: ergastResult.FastestLap?.rank === '1',
    tyreStints: [
      // Mock tyre stints since Ergast doesn't provide this
      {
        compound: 'medium' as const,
        laps: parseInt(ergastResult.laps || '0'),
        startLap: 1,
        endLap: parseInt(ergastResult.laps || '0'),
      },
    ],
    DNF,
    DNFReason: DNF ? status : undefined,
  };
};

/**
 * Calculate DNFs and safety cars from results
 */
export const calculateRaceStats = (results: ErgastResult[]): {
  DNFs: number;
  safetyCars: number;
} => {
  const DNFs = results.filter(
    (r) => !r.status.toLowerCase().includes('finished') && r.status !== 'classified'
  ).length;

  // Safety cars not available in Ergast, using estimate based on DNFs
  const safetyCars = DNFs > 3 ? 2 : DNFs > 1 ? 1 : 0;

  return { DNFs, safetyCars };
};

