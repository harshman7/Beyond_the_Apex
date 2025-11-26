/**
 * Ergast API Client
 * Free F1 historical data API: http://ergast.com/mrd/
 * 
 * Alternative APIs (some require API keys):
 * - OpenF1 API: https://api.openf1.org (real-time data, requires paid for live)
 * - Formula Live Pulse: https://f1livepulse.com (via RapidAPI)
 * - Hyprace F1 Data API: https://developers.hyprace.com
 */

// Note: Ergast API uses HTTP which may cause CORS issues
// If you encounter CORS errors, use a proxy or backend service
// See API_INTEGRATION.md for solutions
const ERGAST_BASE_URL = 'http://ergast.com/api/f1';

// Alternative: Use a CORS proxy (uncomment if needed)
// const ERGAST_BASE_URL = 'https://cors-anywhere.herokuapp.com/http://ergast.com/api/f1';

export interface ErgastResponse<T> {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
    RaceTable?: T;
    DriverTable?: T;
    ConstructorTable?: T;
    StandingsTable?: T;
  };
}

export interface ErgastRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    url: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time?: string;
  Results?: ErgastResult[];
  QualifyingResults?: ErgastQualifyingResult[];
}

export interface ErgastResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: {
    driverId: string;
    permanentNumber: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
  };
  Constructor: {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  };
  grid: string;
  laps: string;
  status: string;
  FastestLap?: {
    rank: string;
    lap: string;
    Time: {
      time: string;
    };
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
  Time?: {
    millis: string;
    time: string;
  };
}

export interface ErgastQualifyingResult {
  number: string;
  position: string;
  Driver: {
    driverId: string;
    permanentNumber: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
  };
  Constructor: {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  };
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface ErgastDriver {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

export interface ErgastConstructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

export interface ErgastStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver?: ErgastDriver;
  Constructor?: ErgastConstructor;
}

/**
 * Fetch races for a season
 */
export const fetchRaces = async (season: number): Promise<ErgastRace[]> => {
  try {
    const response = await fetch(`${ERGAST_BASE_URL}/${season}.json?limit=100`);
    const data: ErgastResponse<{ Races: ErgastRace[] }> = await response.json();
    return data.MRData.RaceTable?.Races || [];
  } catch (error) {
    console.error(`Error fetching races for season ${season}:`, error);
    throw error;
  }
};

/**
 * Fetch race results
 */
export const fetchRaceResults = async (
  season: number,
  round: number
): Promise<ErgastResult[]> => {
  try {
    const response = await fetch(
      `${ERGAST_BASE_URL}/${season}/${round}/results.json`
    );
    const data: ErgastResponse<{ Races: Array<{ Results: ErgastResult[] }> }> =
      await response.json();
    return data.MRData.RaceTable?.Races[0]?.Results || [];
  } catch (error) {
    console.error(`Error fetching race results for ${season}/${round}:`, error);
    throw error;
  }
};

/**
 * Fetch qualifying results
 */
export const fetchQualifyingResults = async (
  season: number,
  round: number
): Promise<ErgastQualifyingResult[]> => {
  try {
    const response = await fetch(
      `${ERGAST_BASE_URL}/${season}/${round}/qualifying.json`
    );
    const data: ErgastResponse<{
      Races: Array<{ QualifyingResults: ErgastQualifyingResult[] }>;
    }> = await response.json();
    return data.MRData.RaceTable?.Races[0]?.QualifyingResults || [];
  } catch (error) {
    console.error(`Error fetching qualifying for ${season}/${round}:`, error);
    throw error;
  }
};

/**
 * Fetch driver standings for a season
 */
export const fetchDriverStandings = async (
  season: number
): Promise<ErgastStanding[]> => {
  try {
    const response = await fetch(
      `${ERGAST_BASE_URL}/${season}/driverStandings.json`
    );
    const data: ErgastResponse<{
      StandingsLists: Array<{ DriverStandings: ErgastStanding[] }>;
    }> = await response.json();
    return data.MRData.StandingsTable?.StandingsLists[0]?.DriverStandings || [];
  } catch (error) {
    console.error(`Error fetching driver standings for ${season}:`, error);
    throw error;
  }
};

/**
 * Fetch constructor standings for a season
 */
export const fetchConstructorStandings = async (
  season: number
): Promise<ErgastStanding[]> => {
  try {
    const response = await fetch(
      `${ERGAST_BASE_URL}/${season}/constructorStandings.json`
    );
    const data: ErgastResponse<{
      StandingsLists: Array<{ ConstructorStandings: ErgastStanding[] }>;
    }> = await response.json();
    return data.MRData.StandingsTable?.StandingsLists[0]?.ConstructorStandings || [];
  } catch (error) {
    console.error(`Error fetching constructor standings for ${season}:`, error);
    throw error;
  }
};

/**
 * Fetch all drivers
 */
export const fetchDrivers = async (season?: number): Promise<ErgastDriver[]> => {
  try {
    const url = season
      ? `${ERGAST_BASE_URL}/${season}/drivers.json?limit=100`
      : `${ERGAST_BASE_URL}/drivers.json?limit=1000`;
    const response = await fetch(url);
    const data: ErgastResponse<{ Drivers: ErgastDriver[] }> =
      await response.json();
    return data.MRData.DriverTable?.Drivers || [];
  } catch (error) {
    console.error('Error fetching drivers:', error);
    throw error;
  }
};

/**
 * Fetch all constructors
 */
export const fetchConstructors = async (
  season?: number
): Promise<ErgastConstructor[]> => {
  try {
    const url = season
      ? `${ERGAST_BASE_URL}/${season}/constructors.json?limit=100`
      : `${ERGAST_BASE_URL}/constructors.json?limit=1000`;
    const response = await fetch(url);
    const data: ErgastResponse<{ Constructors: ErgastConstructor[] }> =
      await response.json();
    return data.MRData.ConstructorTable?.Constructors || [];
  } catch (error) {
    console.error('Error fetching constructors:', error);
    throw error;
  }
};

/**
 * Fetch circuit information
 */
export const fetchCircuits = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${ERGAST_BASE_URL}/circuits.json?limit=1000`);
    const data = await response.json();
    return data.MRData.CircuitTable?.Circuits || [];
  } catch (error) {
    console.error('Error fetching circuits:', error);
    throw error;
  }
};

