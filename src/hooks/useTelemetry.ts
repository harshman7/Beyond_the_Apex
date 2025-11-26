/**
 * React hook for real-time telemetry data
 * 
 * @example
 * ```typescript
 * const { positions, isConnected, connect, disconnect } = useTelemetry('wss://api.example.com/telemetry');
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createTelemetryClient, type TelemetryClient } from '@/lib/data/telemetry';

export interface TelemetryData {
  positions: Map<number, any>;
  laps: Map<number, any[]>;
  sectors: Map<number, any[]>;
  flags: any[];
  safetyCar: boolean;
  weather: any | null;
}

export const useTelemetry = (url: string | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<TelemetryData>({
    positions: new Map(),
    laps: new Map(),
    sectors: new Map(),
    flags: [],
    safetyCar: false,
    weather: null,
  });
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<TelemetryClient | null>(null);

  const connect = useCallback(() => {
    if (!url) {
      console.warn('[useTelemetry] No URL provided');
      return;
    }

    if (clientRef.current) {
      console.log('[useTelemetry] Already connected, disconnecting first...');
      clientRef.current.disconnect();
    }

    console.log(`[useTelemetry] 🔌 Connecting to ${url}...`);
    const client = createTelemetryClient(url);
    clientRef.current = client;

    client.on('connect', () => {
      console.log('[useTelemetry] ✅ Connected');
      setIsConnected(true);
      setError(null);
    });

    client.on('disconnect', () => {
      console.log('[useTelemetry] 🔌 Disconnected');
      setIsConnected(false);
    });

    client.on('error', (err) => {
      console.error('[useTelemetry] ❌ Error:', err);
      setError(err instanceof Error ? err : new Error('Telemetry error'));
      setIsConnected(false);
    });

    client.on('position', (positionData: any) => {
      setData((prev) => {
        const newPositions = new Map(prev.positions);
        if (positionData.driverNumber) {
          newPositions.set(positionData.driverNumber, positionData);
        }
        return { ...prev, positions: newPositions };
      });
    });

    client.on('lap', (lapData: any) => {
      setData((prev) => {
        const newLaps = new Map(prev.laps);
        if (lapData.driverNumber) {
          const driverLaps = newLaps.get(lapData.driverNumber) || [];
          newLaps.set(lapData.driverNumber, [...driverLaps, lapData]);
        }
        return { ...prev, laps: newLaps };
      });
    });

    client.on('sector', (sectorData: any) => {
      setData((prev) => {
        const newSectors = new Map(prev.sectors);
        if (sectorData.driverNumber) {
          const driverSectors = newSectors.get(sectorData.driverNumber) || [];
          newSectors.set(sectorData.driverNumber, [...driverSectors, sectorData]);
        }
        return { ...prev, sectors: newSectors };
      });
    });

    client.on('flag', (flagData: any) => {
      setData((prev) => ({
        ...prev,
        flags: [...prev.flags, flagData],
      }));
    });

    client.on('safety_car', (scData: any) => {
      setData((prev) => ({
        ...prev,
        safetyCar: scData.active || false,
      }));
    });

    client.on('weather', (weatherData: any) => {
      setData((prev) => ({
        ...prev,
        weather: weatherData,
      }));
    });

    client.connect();
  }, [url]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      console.log('[useTelemetry] 🔌 Disconnecting...');
      clientRef.current.disconnect();
      clientRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    data,
    error,
    connect,
    disconnect,
  };
};

