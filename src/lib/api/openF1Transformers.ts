/**
 * Transform OpenF1 API responses to our domain models
 */

import type {
  Driver,
  Race,
  Result,
  TyreStint,
} from '@/types';
import type {
  OpenF1Session,
  OpenF1Driver,
  OpenF1Position,
  OpenF1Stint,
  OpenF1RaceControl,
} from './openF1Client';

/**
 * Transform OpenF1 driver to our Driver model
 */
export const transformOpenF1Driver = (
  openF1Driver: OpenF1Driver,
  stats?: {
    points: number;
    wins: number;
    podiums: number;
    poles: number;
    last5Results: number[];
  }
): Driver => {
  // Map team names to our team IDs
  const teamMap: Record<string, string> = {
    'Red Bull Racing': 'redbull',
    'Red Bull': 'redbull',
    'Mercedes': 'mercedes',
    'Ferrari': 'ferrari',
    'McLaren': 'mclaren',
    'Aston Martin': 'aston-martin',
    'Alpine': 'alpine',
    'Williams': 'williams',
    'AlphaTauri': 'alphatauri',
    'RB': 'alphatauri',
    'Visa Cash App RB': 'alphatauri',
    'Alfa Romeo': 'alfa-romeo',
    'Sauber': 'alfa-romeo',
    'Kick Sauber': 'alfa-romeo',
    'Haas': 'haas',
  };

  const teamId = teamMap[openF1Driver.team_name] || 'unknown';

  return {
    id: `driver-${openF1Driver.driver_number}`,
    name: openF1Driver.full_name || `${openF1Driver.first_name} ${openF1Driver.last_name}`,
    code: openF1Driver.name_acronym || openF1Driver.broadcast_name.split(' ').map((n: string) => n[0]).join(''),
    teamId,
    carNumber: openF1Driver.driver_number,
    nationality: openF1Driver.country_code,
    rookie: false, // Would need additional data
    points: stats?.points || 0,
    wins: stats?.wins || 0,
    podiums: stats?.podiums || 0,
    poles: stats?.poles || 0,
    last5Results: stats?.last5Results || [],
  };
};

/**
 * Transform OpenF1 session to our Race model
 */
export const transformOpenF1Session = (
  session: OpenF1Session,
  raceControl?: OpenF1RaceControl[]
): Race => {
  // Count safety cars from race control
  const safetyCars = raceControl?.filter(
    (rc) => rc.flag === 'SC' || rc.message.toLowerCase().includes('safety car')
  ).length || 0;

  return {
    season: new Date(session.date_start).getFullYear(),
    round: 0, // Will need to be determined from meeting order
    name: session.session_name,
    circuitId: session.circuit_short_name.toLowerCase().replace(/\s+/g, '-'),
    date: session.date_start,
    weatherSummary: {
      temperature: 20, // Not available in OpenF1
      condition: 'dry',
      chanceOfRain: 0,
      windSpeed: 0,
    },
    safetyCars,
    DNFs: 0, // Will be calculated from results
    completed: new Date(session.date_end) < new Date(),
  };
};

/**
 * Transform OpenF1 positions to our Result model
 */
export const transformOpenF1Position = (
  position: OpenF1Position,
  driver: OpenF1Driver,
  sessionKey: number,
  finalPositions?: Map<number, number>
): Result => {
  const finishPosition = finalPositions?.get(position.driver_number) || position.position;
  const pointsMap: Record<number, number> = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
  };

  return {
    raceId: `session-${sessionKey}`,
    driverId: `driver-${driver.driver_number}`,
    grid: position.position, // Will need to get from qualifying
    finishPosition,
    points: finishPosition <= 10 ? (pointsMap[finishPosition] || 0) : 0,
    fastestLap: false, // Will need to determine from lap times
    tyreStints: [], // Will be populated from stints
    DNF: finishPosition > 20,
  };
};

/**
 * Transform OpenF1 stint to our TyreStint model
 */
export const transformOpenF1Stint = (stint: OpenF1Stint): TyreStint => {
  const compoundMap: Record<string, 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet'> = {
    'SOFT': 'soft',
    'MEDIUM': 'medium',
    'HARD': 'hard',
    'INTERMEDIATE': 'intermediate',
    'WET': 'wet',
  };

  return {
    compound: compoundMap[stint.compound.toUpperCase()] || 'medium',
    laps: (stint.lap_end || stint.lap_start) - stint.lap_start + 1,
    startLap: stint.lap_start,
    endLap: stint.lap_end || stint.lap_start,
  };
};

/**
 * Calculate final positions from position data
 */
export const calculateFinalPositions = (
  positions: OpenF1Position[]
): Map<number, number> => {
  // Get the latest position for each driver
  const finalPositions = new Map<number, number>();
  const sorted = positions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sorted.forEach((pos) => {
    if (!finalPositions.has(pos.driver_number)) {
      finalPositions.set(pos.driver_number, pos.position);
    }
  });

  return finalPositions;
};

/**
 * Calculate DNFs from positions
 */
export const calculateDNFs = (
  positions: OpenF1Position[],
  drivers: OpenF1Driver[]
): number => {
  const finalPositions = calculateFinalPositions(positions);
  const driverNumbers = new Set(drivers.map((d) => d.driver_number));
  
  // Count drivers who didn't finish in top 20
  let dnfs = 0;
  driverNumbers.forEach((driverNumber) => {
    const position = finalPositions.get(driverNumber);
    if (!position || position > 20) {
      dnfs++;
    }
  });

  return dnfs;
};

