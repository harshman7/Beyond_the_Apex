/**
 * Data Export Utilities
 * Export F1 data to CSV, JSON, or other formats
 */

import type { Driver, Team, Race, Result } from '@/types';

/**
 * Export data to CSV format
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void => {
  if (data.length === 0) {
    console.warn('[Export] No data to export');
    return;
  }

  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [
    csvHeaders.join(','),
    ...data.map((row) =>
      csvHeaders.map((header) => {
        const value = row[header];
        // Handle commas, quotes, and newlines in CSV
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`[Export] ✅ Exported ${data.length} rows to ${filename}.csv`);
};

/**
 * Export data to JSON format
 */
export const exportToJSON = <T>(data: T, filename: string): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`[Export] ✅ Exported to ${filename}.json`);
};

/**
 * Export driver standings to CSV
 */
export const exportDriverStandings = (
  standings: Array<{ driver: Driver; points: number; position: number }>,
  filename = 'driver-standings'
): void => {
  const data = standings.map((s) => ({
    Position: s.position,
    Driver: s.driver.name,
    Code: s.driver.code,
    Team: s.driver.teamId,
    Points: s.points,
    Nationality: s.driver.nationality,
  }));

  exportToCSV(data, filename, ['Position', 'Driver', 'Code', 'Team', 'Points', 'Nationality']);
};

/**
 * Export team standings to CSV
 */
export const exportTeamStandings = (
  standings: Array<{ team: Team; points: number; position: number }>,
  filename = 'team-standings'
): void => {
  const data = standings.map((s) => ({
    Position: s.position,
    Team: s.team.name,
    Points: s.points,
    Wins: s.team.wins || 0,
    Podiums: s.team.podiums || 0,
  }));

  exportToCSV(data, filename, ['Position', 'Team', 'Points', 'Wins', 'Podiums']);
};

/**
 * Export race results to CSV
 */
export const exportRaceResults = (
  results: Result[],
  raceName: string,
  filename?: string
): void => {
  const data = results.map((r) => ({
    Position: r.finishPosition,
    Grid: r.grid,
    Driver: r.driverId,
    Points: r.points,
    Status: r.DNF ? 'DNF' : 'Finished',
    FastestLap: r.fastestLap ? 'Yes' : 'No',
    PitStops: r.tyreStints?.length || 0,
  }));

  exportToCSV(
    data,
    filename || `race-results-${raceName.toLowerCase().replace(/\s+/g, '-')}`,
    ['Position', 'Grid', 'Driver', 'Points', 'Status', 'FastestLap', 'PitStops']
  );
};

/**
 * Export season data to JSON
 */
export const exportSeasonData = (
  season: number,
  races: Race[],
  results: Map<string, Result[]>,
  filename = `season-${season}-data`
): void => {
  const data = {
    season,
    exportedAt: new Date().toISOString(),
    races: races.map((race) => ({
      ...race,
      results: results.get(`${race.season}-${race.round}`) || [],
    })),
  };

  exportToJSON(data, filename);
};

