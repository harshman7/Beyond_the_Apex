/**
 * F1 Data Service - Main interface for fetching F1 data
 * Uses OpenF1 API (modern) with fallback to Ergast API, then mock data
 * 
 * OpenF1 API: https://api.openf1.org (modern, free, no CORS issues)
 * Ergast API: http://ergast.com/api/f1 (deprecated end of 2024, fallback)
 */

import type {
  Driver,
  Team,
  Race,
  Circuit,
  Result,
} from '@/types';
import {
  fetchSessions,
  fetchDrivers as fetchOpenF1Drivers,
  fetchAllDrivers,
  fetchPositions,
  fetchRaceControl,
  fetchStints,
  fetchMeetings,
} from './openF1Client';
import {
  transformOpenF1Driver,
  transformOpenF1Session,
  transformOpenF1Position,
  transformOpenF1Stint,
  calculateFinalPositions,
} from './openF1Transformers';
import {
  CURRENT_SEASON,
} from '../data/mockData';

// Configuration - OpenF1 API only, no fallbacks
const USE_API = true;
const USE_OPENF1 = true;

/**
 * Cache for API responses
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCached = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
};

const setCached = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Fetch races for a season - OpenF1 API only
 */
export const getRacesFromAPI = async (season: number): Promise<Race[]> => {
  if (!USE_API || !USE_OPENF1) {
    throw new Error('API is disabled');
  }

  const cacheKey = `races-${season}`;
  const cached = getCached<Race[]>(cacheKey);
  if (cached) {
    console.log(`[DataService] 💾 Cache hit: races for season ${season}`);
    return cached;
  }

  console.log(`[DataService] 🏎️ Fetching races for season ${season}...`);
  const startTime = Date.now();
  try {
    const meetings = await fetchMeetings(season);
    console.log(`[DataService] 📍 Processing ${meetings.length} meetings...`);
    const races: Race[] = [];
    let round = 1;

    for (const meeting of meetings) {
      try {
        // Add delay between meetings to respect rate limit (except first one)
        if (round > 1) {
          console.log(`[DataService] ⏳ Rate limit delay before meeting ${round}/${meetings.length}...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        console.log(`[DataService] 🔍 Processing meeting ${round}/${meetings.length}: ${meeting.meeting_name || meeting.location}`);
        // Get race session (session_type = 'Race')
        const sessions = await fetchSessions(season, meeting.location);
        const raceSession = sessions.find((s) => s.session_type === 'Race');
        
        if (raceSession) {
          try {
            // Add small delay before race control request
            await new Promise((resolve) => setTimeout(resolve, 500));
            const raceControl = await fetchRaceControl(raceSession.session_key);
            const race = transformOpenF1Session(raceSession, raceControl);
            race.round = round++;
            races.push(race);
          } catch (error) {
            // If race control fails, still create race without safety car data
            const race = transformOpenF1Session(raceSession, []);
            race.round = round++;
            races.push(race);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch sessions for meeting ${meeting.location}:`, error);
        // Continue with next meeting
      }
    }

    const duration = Date.now() - startTime;
    if (races.length > 0) {
      setCached(cacheKey, races);
      console.log(`[DataService] ✅ Successfully fetched ${races.length} races for season ${season} (${duration}ms)`);
      return races;
    }
    
    throw new Error(`No races found for season ${season}`);
  } catch (error) {
    console.error(`[DataService] ❌ Failed to fetch races for season ${season}:`, error);
    throw error;
  }
};

/**
 * Fetch race results - OpenF1 API only
 */
export const getRaceResultsFromAPI = async (
  season: number,
  round: number
): Promise<Result[]> => {
  if (!USE_API || !USE_OPENF1) {
    throw new Error('API is disabled');
  }

  const cacheKey = `results-${season}-${round}`;
  const cached = getCached<Result[]>(cacheKey);
  if (cached) {
    console.log(`[DataService] 💾 Cache hit: results for ${season}-R${round}`);
    return cached;
  }

  console.log(`[DataService] 🏁 Fetching race results for ${season}-R${round}...`);
  const startTime = Date.now();
  try {
    const meetings = await fetchMeetings(season);
    const meeting = meetings[round - 1]; // Assuming round order matches meeting order
    
    if (!meeting) {
      throw new Error(`Meeting not found for season ${season}, round ${round}`);
    }

    const sessions = await fetchSessions(season, meeting.location);
    const raceSession = sessions.find((s) => s.session_type === 'Race');
    
    if (!raceSession) {
      throw new Error(`Race session not found for season ${season}, round ${round}`);
    }

    // Stagger requests to avoid rate limiting
    console.log(`[DataService] 📊 Fetching race data for session ${raceSession.session_key}...`);
    const drivers = await fetchOpenF1Drivers(raceSession.session_key);
    console.log(`[DataService] ⏳ Rate limit delay...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const positions = await fetchPositions(raceSession.session_key);
    console.log(`[DataService] ⏳ Rate limit delay...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const stints = await fetchStints(raceSession.session_key);

    const finalPositions = calculateFinalPositions(positions);
    const results: Result[] = [];

    for (const driver of drivers) {
      const position = positions.find((p) => p.driver_number === driver.driver_number);
      if (position) {
        const result = transformOpenF1Position(
          position,
          driver,
          raceSession.session_key,
          finalPositions
        );

        // Add tyre stints
        const driverStints = stints.filter((s) => s.driver_number === driver.driver_number);
        result.tyreStints = driverStints.map(transformOpenF1Stint);

        results.push(result);
      }
    }

    const duration = Date.now() - startTime;
    if (results.length === 0) {
      throw new Error(`No results found for season ${season}, round ${round}`);
    }

    setCached(cacheKey, results);
    console.log(`[DataService] ✅ Successfully fetched ${results.length} results for ${season}-R${round} (${duration}ms)`);
    return results;
  } catch (error) {
    console.error(`[DataService] ❌ Failed to fetch results for ${season}-R${round}:`, error);
    throw error;
  }
};

/**
 * Fetch drivers - OpenF1 API only
 */
export const getDriversFromAPI = async (season?: number): Promise<Driver[]> => {
  if (!USE_API || !USE_OPENF1) {
    throw new Error('API is disabled');
  }

  const cacheKey = `drivers-${season || 'all'}`;
  const cached = getCached<Driver[]>(cacheKey);
  if (cached) {
    console.log(`[DataService] 💾 Cache hit: drivers`);
    return cached;
  }

  console.log(`[DataService] 👥 Fetching drivers...`);
  const startTime = Date.now();
  try {
    const openF1Drivers = await fetchAllDrivers();
    const drivers = openF1Drivers.map((d) => transformOpenF1Driver(d));
    
    if (drivers.length === 0) {
      throw new Error('No drivers found');
    }

    const duration = Date.now() - startTime;
    setCached(cacheKey, drivers);
    console.log(`[DataService] ✅ Successfully fetched ${drivers.length} drivers (${duration}ms)`);
    return drivers;
  } catch (error) {
    console.error('OpenF1 API failed for drivers:', error);
    throw error;
  }
};

/**
 * Fetch teams - OpenF1 API only (derived from drivers)
 */
export const getTeamsFromAPI = async (season?: number): Promise<Team[]> => {
  if (!USE_API || !USE_OPENF1) {
    throw new Error('API is disabled');
  }

  const cacheKey = `teams-${season || 'all'}`;
  const cached = getCached<Team[]>(cacheKey);
  if (cached) {
    console.log(`[DataService] 💾 Cache hit: teams`);
    return cached;
  }

  console.log(`[DataService] 🏎️ Fetching teams...`);
  const startTime = Date.now();
  try {
    // Get teams from drivers
    const drivers = await getDriversFromAPI(season);
    const teamMap = new Map<string, Team>();

    drivers.forEach((driver) => {
      if (!teamMap.has(driver.teamId)) {
        // Create team from driver's team info
        const teamDrivers = drivers.filter((d) => d.teamId === driver.teamId);
        teamMap.set(driver.teamId, {
          id: driver.teamId,
          name: driver.teamId, // Will be improved with better mapping
          engine: 'Unknown',
          primaryColor: '#666666',
          secondaryColor: '#000000',
          totalPoints: teamDrivers.reduce((sum, d) => sum + d.points, 0),
          wins: teamDrivers.reduce((sum, d) => sum + d.wins, 0),
          podiums: teamDrivers.reduce((sum, d) => sum + d.podiums, 0),
        });
      }
    });

    const teams = Array.from(teamMap.values());
    
    if (teams.length === 0) {
      throw new Error('No teams found');
    }

    const duration = Date.now() - startTime;
    setCached(cacheKey, teams);
    console.log(`[DataService] ✅ Successfully fetched ${teams.length} teams (${duration}ms)`);
    return teams;
  } catch (error) {
    console.error('OpenF1 API failed for teams:', error);
    throw error;
  }
};

/**
 * Fetch circuits - OpenF1 API only (derived from sessions)
 */
export const getCircuitsFromAPI = async (): Promise<Circuit[]> => {
  if (!USE_API || !USE_OPENF1) {
    throw new Error('API is disabled');
  }

  const cacheKey = 'circuits';
  const cached = getCached<Circuit[]>(cacheKey);
  if (cached) {
    console.log(`[DataService] 💾 Cache hit: circuits`);
    return cached;
  }

  console.log(`[DataService] 🏟️ Fetching circuits...`);
  const startTime = Date.now();
  try {
    // Get circuits from sessions
    const currentYear = new Date().getFullYear();
    const meetings = await fetchMeetings(currentYear);
    const circuitMap = new Map<string, Circuit>();

    for (const meeting of meetings) {
      const sessions = await fetchSessions(currentYear, meeting.location);
      const raceSession = sessions.find((s) => s.session_type === 'Race');
      
      if (raceSession && !circuitMap.has(raceSession.circuit_short_name)) {
        circuitMap.set(raceSession.circuit_short_name, {
          id: raceSession.circuit_short_name.toLowerCase().replace(/\s+/g, '-'),
          name: raceSession.circuit_short_name,
          country: raceSession.country_name,
          city: raceSession.location,
          laps: 50, // Default, would need to calculate from race data
          lapDistance: 5.0, // Default
          raceDistance: 250, // Default
          trackType: raceSession.circuit_short_name.includes('Street') || 
                     raceSession.circuit_short_name === 'Monaco' ? 'street' : 'permanent',
        });
      }
    }

    const circuits = Array.from(circuitMap.values());
    
    if (circuits.length === 0) {
      throw new Error('No circuits found');
    }

    const duration = Date.now() - startTime;
    setCached(cacheKey, circuits);
    console.log(`[DataService] ✅ Successfully fetched ${circuits.length} circuits (${duration}ms)`);
    return circuits;
  } catch (error) {
    console.error('OpenF1 API failed for circuits:', error);
    throw error;
  }
};

/**
 * Get current season
 */
export const getCurrentSeason = (): number => {
  return CURRENT_SEASON;
};

