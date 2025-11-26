/**
 * Data Refresh Utilities
 * Manually refresh cached data from the API
 */

import {
  getRacesFromAPI,
  getRaceResultsFromAPI,
  getDriversFromAPI,
  getTeamsFromAPI,
  getCircuitsFromAPI,
} from '@/lib/api/f1DataService';

/**
 * Clear all caches and refresh data
 */
export const refreshAllData = async (season: number): Promise<void> => {
  console.log(`[Refresh] 🔄 Refreshing all data for season ${season}...`);
  const startTime = Date.now();

  try {
    await Promise.all([
      getDriversFromAPI(season),
      getTeamsFromAPI(season),
      getCircuitsFromAPI(),
      getRacesFromAPI(season),
    ]);

    const duration = Date.now() - startTime;
    console.log(`[Refresh] ✅ All data refreshed (${duration}ms)`);
  } catch (error) {
    console.error('[Refresh] ❌ Error refreshing data:', error);
    throw error;
  }
};

/**
 * Refresh race data for a specific season
 */
export const refreshRaces = async (season: number): Promise<void> => {
  console.log(`[Refresh] 🔄 Refreshing races for season ${season}...`);
  try {
    await getRacesFromAPI(season);
    console.log(`[Refresh] ✅ Races refreshed`);
  } catch (error) {
    console.error('[Refresh] ❌ Error refreshing races:', error);
    throw error;
  }
};

/**
 * Refresh race results for a specific race
 */
export const refreshRaceResults = async (season: number, round: number): Promise<void> => {
  console.log(`[Refresh] 🔄 Refreshing results for ${season}-R${round}...`);
  try {
    await getRaceResultsFromAPI(season, round);
    console.log(`[Refresh] ✅ Race results refreshed`);
  } catch (error) {
    console.error('[Refresh] ❌ Error refreshing race results:', error);
    throw error;
  }
};

/**
 * Refresh driver data
 */
export const refreshDrivers = async (season?: number): Promise<void> => {
  console.log(`[Refresh] 🔄 Refreshing drivers...`);
  try {
    await getDriversFromAPI(season);
    console.log(`[Refresh] ✅ Drivers refreshed`);
  } catch (error) {
    console.error('[Refresh] ❌ Error refreshing drivers:', error);
    throw error;
  }
};

/**
 * Refresh team data
 */
export const refreshTeams = async (season?: number): Promise<void> => {
  console.log(`[Refresh] 🔄 Refreshing teams...`);
  try {
    await getTeamsFromAPI(season);
    console.log(`[Refresh] ✅ Teams refreshed`);
  } catch (error) {
    console.error('[Refresh] ❌ Error refreshing teams:', error);
    throw error;
  }
};

