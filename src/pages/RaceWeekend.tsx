import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Select } from '@/components/ui/Select';
import { StatCard } from '@/components/ui/StatCard';
import { getRaces, getRace, getRaceResults, getCircuitHistory, CURRENT_SEASON } from '@/lib/data/dataUtils';
import { getRacePredictions, getQualiPredictions } from '@/lib/predictions/predictionEngine';
import { getCircuit, getDriver, getTeam } from '@/lib/data/dataUtils';
import { DRIVERS, TEAMS } from '@/lib/data/mockData';

export const RaceWeekend: React.FC = () => {
  const [season, setSeason] = useState(CURRENT_SEASON);
  const [round, setRound] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'qualifying' | 'race' | 'predictions'>('overview');

  const races = getRaces(season);
  const race = getRace(season, round);
  const circuit = race ? getCircuit(race.circuitId) : null;
  const results = race ? getRaceResults(season, round) : [];
  const circuitHistory = circuit ? getCircuitHistory(circuit.id, 5) : [];
  const racePredictions = race ? getRacePredictions(season, round) : [];
  const qualiPredictions = race ? getQualiPredictions(season, round) : [];

  // Position vs lap data (mock for now)
  const positionData = useMemo(() => {
    if (!race || results.length === 0) return [];
    const top5 = results.slice(0, 5);
    const data: Array<{ lap: number; [key: string]: number | string }> = [];

    for (let lap = 1; lap <= (circuit?.laps || 50); lap += 5) {
      const entry: { lap: number; [key: string]: number | string } = { lap };
      top5.forEach((result) => {
        const driver = getDriver(result.driverId);
        // Mock position changes
        const position = result.finishPosition + Math.sin(lap / 10) * 2;
        entry[driver?.code || ''] = Math.max(1, Math.min(20, Math.round(position)));
      });
      data.push(entry);
    }

    return data;
  }, [race, results, circuit]);

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'qualifying' as const, label: 'Qualifying' },
    { id: 'race' as const, label: 'Race Analysis' },
    { id: 'predictions' as const, label: 'Predictions' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Race Weekend</h1>
        <p className="text-muted-foreground">Detailed analysis and predictions for race weekends</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end">
        <Select
          label="Season"
          value={season}
          onChange={(e) => {
            setSeason(Number(e.target.value));
            setRound(1);
          }}
        >
          {[2022, 2023, 2024].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          label="Round"
          value={round}
          onChange={(e) => setRound(Number(e.target.value))}
        >
          {races.map((r) => (
            <option key={r.round} value={r.round}>
              Round {r.round}: {r.name}
            </option>
          ))}
        </Select>
      </div>

      {!race && (
        <div className="bg-card rounded-2xl p-6 border border-border text-center">
          <p className="text-muted-foreground">Select a race to view details</p>
        </div>
      )}

      {race && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 font-medium transition-colors
                  ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {circuit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-2xl p-6 border border-border">
                    <h2 className="text-xl font-bold text-foreground mb-4">Circuit Information</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-semibold">{circuit.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-semibold">{circuit.country}, {circuit.city}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Laps</p>
                          <p className="font-semibold">{circuit.laps}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Distance</p>
                          <p className="font-semibold">{circuit.raceDistance.toFixed(2)} km</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Track Type</p>
                        <p className="font-semibold capitalize">{circuit.trackType}</p>
                      </div>
                    </div>
                  </div>

                  {race.weatherSummary && (
                    <div className="bg-card rounded-2xl p-6 border border-border">
                      <h2 className="text-xl font-bold text-foreground mb-4">Weather Forecast</h2>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Temperature</p>
                          <p className="font-semibold text-2xl">{race.weatherSummary.temperature}°C</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Condition</p>
                          <p className="font-semibold capitalize">{race.weatherSummary.condition}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Chance of Rain</p>
                          <p className="font-semibold">{race.weatherSummary.chanceOfRain.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Wind Speed</p>
                          <p className="font-semibold">{race.weatherSummary.windSpeed.toFixed(1)} km/h</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Circuit History */}
              {circuitHistory.length > 0 && (
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-4">Past Results at This Circuit</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Year</th>
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Winner</th>
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Team</th>
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Pole</th>
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">SC</th>
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {circuitHistory.map((h) => (
                          <tr key={h.season} className="border-b border-border hover:bg-accent">
                            <td className="p-2 text-sm">{h.season}</td>
                            <td className="p-2 text-sm">{h.winner?.code || 'N/A'}</td>
                            <td className="p-2 text-sm">{h.winner ? getTeam(h.winner.teamId)?.name : 'N/A'}</td>
                            <td className="p-2 text-sm">{h.pole?.code || 'N/A'}</td>
                            <td className="p-2 text-sm">{h.safetyCars}</td>
                            <td className="p-2 text-sm text-muted-foreground">{h.notableStat || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Qualifying Tab */}
          {activeTab === 'qualifying' && (
            <div className="space-y-6">
              {results.length > 0 ? (
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <h2 className="text-xl font-bold text-foreground mb-4">Qualifying Results</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Pos</th>
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Driver</th>
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Team</th>
                          <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Grid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results
                          .sort((a, b) => a.grid - b.grid)
                          .map((result) => {
                            const driver = getDriver(result.driverId);
                            const team = driver ? getTeam(driver.teamId) : null;
                            return (
                              <tr key={result.driverId} className="border-b border-border hover:bg-accent">
                                <td className="p-2 text-sm font-semibold">{result.grid}</td>
                                <td className="p-2 text-sm">{driver?.name || 'N/A'}</td>
                                <td className="p-2 text-sm">{team?.name || 'N/A'}</td>
                                <td className="p-2 text-sm">{result.grid}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <p className="text-muted-foreground">Qualifying results not available yet</p>
                </div>
              )}
            </div>
          )}

          {/* Race Analysis Tab */}
          {activeTab === 'race' && (
            <div className="space-y-6">
              {results.length > 0 ? (
                <>
                  <div className="bg-card rounded-2xl p-6 border border-border">
                    <h2 className="text-xl font-bold text-foreground mb-4">Position vs Lap</h2>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={positionData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="lap" stroke="hsl(var(--muted-foreground))" />
                          <YAxis reversed stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Legend />
                          {results.slice(0, 5).map((result) => {
                            const driver = getDriver(result.driverId);
                            return (
                              <Line
                                key={result.driverId}
                                type="monotone"
                                dataKey={driver?.code || ''}
                                stroke={getTeam(driver?.teamId || '')?.primaryColor || '#666'}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl p-6 border border-border">
                    <h2 className="text-xl font-bold text-foreground mb-4">Race Results</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Pos</th>
                            <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Driver</th>
                            <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Team</th>
                            <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Grid</th>
                            <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Points</th>
                            <th className="text-left p-2 text-sm font-semibold text-muted-foreground">FL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result) => {
                            const driver = getDriver(result.driverId);
                            const team = driver ? getTeam(driver.teamId) : null;
                            return (
                              <tr key={result.driverId} className="border-b border-border hover:bg-accent">
                                <td className="p-2 text-sm font-semibold">{result.finishPosition}</td>
                                <td className="p-2 text-sm">{driver?.name || 'N/A'}</td>
                                <td className="p-2 text-sm">{team?.name || 'N/A'}</td>
                                <td className="p-2 text-sm">{result.grid}</td>
                                <td className="p-2 text-sm">{result.points}</td>
                                <td className="p-2 text-sm">{result.fastestLap ? '✓' : '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <p className="text-muted-foreground">Race results not available yet</p>
                </div>
              )}
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="space-y-6">
              {/* Qualifying Predictions */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-xl font-bold text-foreground mb-4">Qualifying Predictions</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Predicted Grid</th>
                        <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Driver</th>
                        <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Team</th>
                        <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Q3 Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qualiPredictions
                        .sort((a, b) => a.expectedGridPosition - b.expectedGridPosition)
                        .slice(0, 15)
                        .map((pred) => {
                          const driver = getDriver(pred.driverId);
                          const team = driver ? getTeam(driver.teamId) : null;
                          return (
                            <tr key={pred.driverId} className="border-b border-border hover:bg-accent">
                              <td className="p-2 text-sm font-semibold">{pred.expectedGridPosition}</td>
                              <td className="p-2 text-sm">{driver?.name || 'N/A'}</td>
                              <td className="p-2 text-sm">{team?.name || 'N/A'}</td>
                              <td className="p-2 text-sm">{(pred.q3CutoffProbability * 100).toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Race Predictions */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-xl font-bold text-foreground mb-4">Race Predictions</h2>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Predicted Pos</th>
                        <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Driver</th>
                        <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Win Prob</th>
                        <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Podium Prob</th>
                        <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {racePredictions.slice(0, 10).map((pred) => {
                        const driver = getDriver(pred.driverId);
                        return (
                          <tr key={pred.driverId} className="border-b border-border hover:bg-accent">
                            <td className="p-2 text-sm font-semibold">{pred.expectedFinishPosition}</td>
                            <td className="p-2 text-sm">{driver?.name || 'N/A'}</td>
                            <td className="p-2 text-sm">{(pred.winProbability * 100).toFixed(1)}%</td>
                            <td className="p-2 text-sm">{(pred.podiumProbability * 100).toFixed(1)}%</td>
                            <td className="p-2 text-sm">{pred.pointsProjection}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Expected Points Chart */}
                <div className="h-64 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={racePredictions.slice(0, 10).map((p) => ({
                      driver: getDriver(p.driverId)?.code || '',
                      points: p.pointsProjection,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="driver" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="points" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Prediction Explanation */}
              <div className="bg-card rounded-2xl p-6 border border-border">
                <h2 className="text-xl font-bold text-foreground mb-4">Prediction Methodology</h2>
                <p className="text-muted-foreground">
                  Predictions are based on a weighted combination of:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Recent form (last 5 races): 35%</li>
                  <li>Team performance this season: 30%</li>
                  <li>Track-specific history: 25%</li>
                  <li>Qualifying vs race pace delta: 10%</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  TODO: Replace with real ML models (TensorFlow, PyTorch, or external ML service)
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

