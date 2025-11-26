/**
 * OpenF1 API Client
 * Modern REST API for Formula 1 data: https://api.openf1.org
 * 
 * FastF1 is a Python library (not a REST API), so we use OpenF1 which provides:
 * - Real-time and historical data
 * - Free access to historical data
 * - Modern REST API with good documentation
 * 
 * For FastF1 integration, you would need a Python backend that exposes REST endpoints.
 * See FASTF1_BACKEND.md for instructions on creating a FastF1 backend.
 */

import { rateLimitedFetch } from './rateLimiter';

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

export interface OpenF1Session {
  session_key: number;
  meeting_key: number;
  date_start: string;
  date_end: string;
  session_name: string;
  session_type: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  headshot_url: string;
  country_code: string;
}

export interface OpenF1Lap {
  meeting_key: number;
  session_key: number;
  driver_number: number;
  i1_speed?: number;
  i2_speed?: number;
  st_speed?: number;
  date_start: string;
  lap_duration?: number;
  segments_sector_1?: number;
  segments_sector_2?: number;
  segments_sector_3?: number;
  lap_number: number;
}

export interface OpenF1Position {
  date: string;
  driver_number: number;
  meeting_key: number;
  position: number;
  session_key: number;
}

export interface OpenF1RaceControl {
  date: string;
  flag: string;
  lap_number?: number;
  meeting_key: number;
  message: string;
  scope: string;
  sector?: number;
  session_key: number;
}

export interface OpenF1Stint {
  compound: string;
  driver_number: number;
  lap_end?: number;
  lap_start: number;
  meeting_key: number;
  session_key: number;
  stint_number: number;
  tyre_age_at_start?: number;
}

/**
 * Get sessions for a meeting (race weekend)
 */
export const fetchSessions = async (
  year: number,
  location?: string
): Promise<OpenF1Session[]> => {
  try {
    console.log(`[OpenF1] 📅 Fetching sessions for year ${year}${location ? `, location: ${location}` : ''}`);
    const params = new URLSearchParams({ year: year.toString() });
    if (location) {
      params.append('location', location);
    }
    
    const response = await rateLimitedFetch(`${OPENF1_BASE_URL}/sessions?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: OpenF1Session[] = await response.json();
    console.log(`[OpenF1] ✅ Found ${data.length} sessions for ${year}`);
    return data;
  } catch (error) {
    console.error(`Error fetching sessions for ${year}${location ? `, location: ${location}` : ''}:`, error);
    throw error;
  }
};

/**
 * Get drivers for a session
 */
export const fetchDrivers = async (
  sessionKey: number
): Promise<OpenF1Driver[]> => {
  try {
    console.log(`[OpenF1] 👤 Fetching drivers for session ${sessionKey}`);
    const response = await rateLimitedFetch(
      `${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data: OpenF1Driver[] = await response.json();
    console.log(`[OpenF1] ✅ Found ${data.length} drivers for session ${sessionKey}`);
    return data;
  } catch (error) {
    console.error(`Error fetching drivers for session ${sessionKey}:`, error);
    throw error;
  }
};

/**
 * Get all drivers (across all sessions)
 */
export const fetchAllDrivers = async (): Promise<OpenF1Driver[]> => {
  try {
    console.log(`[OpenF1] 👥 Fetching all drivers`);
    const response = await rateLimitedFetch(`${OPENF1_BASE_URL}/drivers`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data: OpenF1Driver[] = await response.json();
    // Remove duplicates based on driver_number
    const unique = Array.from(
      new Map(data.map((d) => [d.driver_number, d])).values()
    );
    console.log(`[OpenF1] ✅ Found ${unique.length} unique drivers`);
    return unique;
  } catch (error) {
    console.error('Error fetching all drivers:', error);
    throw error;
  }
};

/**
 * Get lap times for a session
 */
export const fetchLaps = async (
  sessionKey: number,
  driverNumber?: number
): Promise<OpenF1Lap[]> => {
  try {
    const params = new URLSearchParams({ session_key: sessionKey.toString() });
    if (driverNumber) params.append('driver_number', driverNumber.toString());
    
    const response = await rateLimitedFetch(`${OPENF1_BASE_URL}/laps?${params}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data: OpenF1Lap[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching laps for session ${sessionKey}:`, error);
    throw error;
  }
};

/**
 * Get positions for a session
 */
export const fetchPositions = async (
  sessionKey: number
): Promise<OpenF1Position[]> => {
  try {
    console.log(`[OpenF1] 📊 Fetching positions for session ${sessionKey}`);
    const response = await rateLimitedFetch(
      `${OPENF1_BASE_URL}/position?session_key=${sessionKey}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data: OpenF1Position[] = await response.json();
    console.log(`[OpenF1] ✅ Found ${data.length} position records for session ${sessionKey}`);
    return data;
  } catch (error) {
    console.error(`Error fetching positions for session ${sessionKey}:`, error);
    throw error;
  }
};

/**
 * Get race control messages (safety cars, flags, etc.)
 */
export const fetchRaceControl = async (
  sessionKey: number
): Promise<OpenF1RaceControl[]> => {
  try {
    console.log(`[OpenF1] 🚦 Fetching race control for session ${sessionKey}`);
    const response = await rateLimitedFetch(
      `${OPENF1_BASE_URL}/race_control?session_key=${sessionKey}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data: OpenF1RaceControl[] = await response.json();
    console.log(`[OpenF1] ✅ Found ${data.length} race control events for session ${sessionKey}`);
    return data;
  } catch (error) {
    console.error(`Error fetching race control for session ${sessionKey}:`, error);
    throw error;
  }
};

/**
 * Get tyre stints for a session
 */
export const fetchStints = async (
  sessionKey: number,
  driverNumber?: number
): Promise<OpenF1Stint[]> => {
  try {
    console.log(`[OpenF1] 🛞 Fetching stints for session ${sessionKey}${driverNumber ? `, driver ${driverNumber}` : ''}`);
    const params = new URLSearchParams({ session_key: sessionKey.toString() });
    if (driverNumber) params.append('driver_number', driverNumber.toString());
    
    const response = await rateLimitedFetch(`${OPENF1_BASE_URL}/stints?${params}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data: OpenF1Stint[] = await response.json();
    console.log(`[OpenF1] ✅ Found ${data.length} stints for session ${sessionKey}`);
    return data;
  } catch (error) {
    console.error(`Error fetching stints for session ${sessionKey}:`, error);
    throw error;
  }
};

/**
 * Get meetings (race weekends) for a year
 */
export const fetchMeetings = async (year: number): Promise<any[]> => {
  try {
    console.log(`[OpenF1] 🏁 Fetching meetings for year ${year}`);
    const response = await rateLimitedFetch(
      `${OPENF1_BASE_URL}/meetings?year=${year}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    // Filter out pre-season testing
    const filtered = data.filter((m: any) => 
      !m.meeting_name?.toLowerCase().includes('testing') &&
      !m.meeting_name?.toLowerCase().includes('test')
    );
    console.log(`[OpenF1] ✅ Found ${filtered.length} meetings for ${year} (filtered from ${data.length} total)`);
    return filtered;
  } catch (error) {
    console.error(`Error fetching meetings for ${year}:`, error);
    throw error;
  }
};

