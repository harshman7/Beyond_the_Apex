import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Select } from '@/components/ui/Select';
import { getHistoricalMetric } from '@/lib/data/dataUtils';
import type { HistoricalMetric } from '@/types';
import { getPredictionAccuracy } from '@/lib/predictions/predictionEngine';
import { DRIVERS, TEAMS, CURRENT_SEASON } from '@/lib/data/mockData';
import { getDriver, getTeam } from '@/lib/data/dataUtils';

export const Historical: React.FC = () => {
  const [seasons, setSeasons] = useState<number[]>([CURRENT_SEASON - 1, CURRENT_SEASON]);
  const [metric, setMetric] = useState<'points' | 'wins' | 'podiums' | 'averageFinish' | 'averageGrid' | 'DNFs' | 'positionsGained'>('points');
  const [entityType, setEntityType] = useState<'drivers' | 'teams'>('drivers');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');

  const [historicalData, setHistoricalData] = useState<Array<{ round: number; [key: string]: number | string }>>([]);

  // Historical metric data
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const data = await getHistoricalMetric(seasons, metric, entityType, selectedEntity !== 'all' ? selectedEntity : undefined);
        
        // Group by round for chart
        const grouped: Map<number, Array<{ season: number; round: number; value: number; entityId: string }>> = new Map();
        
        data.forEach((item: HistoricalMetric) => {
          const key = item.round;
          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key)!.push({
            season: item.season,
            round: item.round,
            value: item.value,
            entityId: item.driverId || item.teamId || '',
          });
        });

        // Convert to chart format
        const chartData: Array<{ round: number; [key: string]: number | string }> = [];
        grouped.forEach((items, round) => {
          const entry: { round: number; [key: string]: number | string } = { round };
          items.forEach((item) => {
            const entity = entityType === 'drivers' 
              ? getDriver(item.entityId)
              : getTeam(item.entityId);
            const label = entityType === 'drivers' 
              ? (entity as ReturnType<typeof getDriver>)?.code || ''
              : (entity as ReturnType<typeof getTeam>)?.name || '';
            entry[label] = item.value;
          });
          chartData.push(entry);
        });

        setHistoricalData(chartData.sort((a, b) => a.round - b.round));
      } catch (error) {
        console.error('Error loading historical data:', error);
        setHistoricalData([]);
      }
    };
    
    loadHistoricalData();
  }, [seasons, metric, entityType, selectedEntity]);

  const [predictionAccuracy, setPredictionAccuracy] = useState<Array<{ raceId: string; driverId: string; predictedPosition: number; actualPosition: number; error: number }>>([]);

  useEffect(() => {
    const loadPredictionAccuracy = async () => {
      const completedRounds = [1, 2, 3, 4, 5]; // First 5 completed races
      try {
        const accuracy = await getPredictionAccuracy(CURRENT_SEASON, completedRounds);
        setPredictionAccuracy(accuracy);
      } catch (error) {
        console.error('Error loading prediction accuracy:', error);
        setPredictionAccuracy([]);
      }
    };
    loadPredictionAccuracy();
  }, []);

  const avgError = useMemo(() => {
    if (predictionAccuracy.length === 0) return 0;
    return predictionAccuracy.reduce((sum, p) => sum + p.error, 0) / predictionAccuracy.length;
  }, [predictionAccuracy]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Historical Analytics</h1>
        <p className="text-muted-foreground">Deep dive into past results and trends</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <Select
          label="Seasons"
          value={seasons.join(',')}
          onChange={(e) => {
            const selected = e.target.value.split(',').map((s) => Number(s.trim()));
            setSeasons(selected);
          }}
        >
          <option value="2022,2023,2024">2022-2024</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2023,2024">2023-2024</option>
        </Select>
        <Select
          label="Metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value as typeof metric)}
        >
          <option value="points">Points</option>
          <option value="wins">Wins</option>
          <option value="podiums">Podiums</option>
          <option value="averageFinish">Average Finish</option>
          <option value="averageGrid">Average Grid</option>
          <option value="DNFs">DNFs</option>
          <option value="positionsGained">Positions Gained</option>
        </Select>
        <Select
          label="View"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value as typeof entityType)}
        >
          <option value="drivers">Drivers</option>
          <option value="teams">Teams</option>
        </Select>
        <Select
          label="Entity"
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
        >
          <option value="all">All</option>
          {(entityType === 'drivers' ? DRIVERS : TEAMS).map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entityType === 'drivers' 
                ? (entity as typeof DRIVERS[0]).name
                : (entity as typeof TEAMS[0]).name}
            </option>
          ))}
        </Select>
      </div>

      {/* Historical Chart */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {metric.charAt(0).toUpperCase() + metric.slice(1)} Over Time
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="round" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              {selectedEntity === 'all' && entityType === 'drivers' && DRIVERS.slice(0, 5).map((driver) => (
                <Line
                  key={driver.id}
                  type="monotone"
                  dataKey={driver.code}
                  stroke={getTeam(driver.teamId)?.primaryColor || '#666'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
              {selectedEntity === 'all' && entityType === 'teams' && TEAMS.slice(0, 5).map((team) => (
                <Line
                  key={team.id}
                  type="monotone"
                  dataKey={team.name}
                  stroke={team.primaryColor}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prediction Accuracy */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Prediction Accuracy</h2>
        <div className="mb-4">
          <p className="text-muted-foreground">
            Mean Absolute Error: <span className="font-semibold text-foreground">{avgError.toFixed(2)} positions</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Race</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Driver</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Predicted</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Actual</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Error</th>
              </tr>
            </thead>
            <tbody>
              {predictionAccuracy.slice(0, 20).map((acc, index) => {
                const driver = getDriver(acc.driverId);
                return (
                  <tr key={index} className="border-b border-border hover:bg-accent">
                    <td className="p-2 text-sm">{acc.raceId}</td>
                    <td className="p-2 text-sm">{driver?.code || 'N/A'}</td>
                    <td className="p-2 text-sm">P{acc.predictedPosition}</td>
                    <td className="p-2 text-sm">P{acc.actualPosition}</td>
                    <td className="p-2 text-sm">
                      <span className={acc.error <= 2 ? 'text-green-500' : acc.error <= 5 ? 'text-yellow-500' : 'text-red-500'}>
                        {acc.error}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

