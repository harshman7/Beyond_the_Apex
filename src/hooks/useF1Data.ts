/**
 * Custom hooks for fetching F1 data with loading and error states
 */

import { useState, useEffect } from 'react';
import type { Driver, Team, Race, Circuit, Result } from '@/types';
import {
  getRacesFromAPI,
  getRaceResultsFromAPI,
  getDriversFromAPI,
  getTeamsFromAPI,
  getCircuitsFromAPI,
} from '@/lib/api/f1DataService';

export interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch races for a season
 */
export const useRaces = (season: number): UseDataResult<Race[]> => {
  const [data, setData] = useState<Race[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const races = await getRacesFromAPI(season);
      setData(races);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch races'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [season]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to fetch race results
 */
export const useRaceResults = (
  season: number,
  round: number
): UseDataResult<Result[]> => {
  const [data, setData] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await getRaceResultsFromAPI(season, round);
      setData(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch race results'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (season && round) {
      fetchData();
    }
  }, [season, round]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to fetch drivers
 */
export const useDrivers = (season?: number): UseDataResult<Driver[]> => {
  const [data, setData] = useState<Driver[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const drivers = await getDriversFromAPI(season);
      setData(drivers);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch drivers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [season]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to fetch teams
 */
export const useTeams = (season?: number): UseDataResult<Team[]> => {
  const [data, setData] = useState<Team[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const teams = await getTeamsFromAPI(season);
      setData(teams);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch teams'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [season]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook to fetch circuits
 */
export const useCircuits = (): UseDataResult<Circuit[]> => {
  const [data, setData] = useState<Circuit[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const circuits = await getCircuitsFromAPI();
      setData(circuits);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch circuits'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

