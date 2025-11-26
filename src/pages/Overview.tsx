import React, { useMemo } from 'react';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { Calendar, MapPin, Cloud, AlertCircle } from 'lucide-react';
import {
  getNextRace,
  getSeasonStandings,
  getRaces,
  getRaceResults,
  CURRENT_SEASON,
} from '@/lib/data/dataUtils';
import { getRacePredictions } from '@/lib/predictions/predictionEngine';
import { getCircuit, getDriver, getTeam } from '@/lib/data/dataUtils';
import { DRIVERS, TEAMS } from '@/lib/data/mockData';

export const Overview: React.FC = () => {
  const nextRace = getNextRace();
  const standings = getSeasonStandings(CURRENT_SEASON);
  const races = getRaces(CURRENT_SEASON);
  const completedRaces = races.filter((r) => r.completed);

  // Next race countdown
  const countdown = useMemo(() => {
    if (!nextRace) return null;
    const now = new Date();
    const raceDate = new Date(nextRace.date);
    const days = differenceInDays(raceDate, now);
    const hours = differenceInHours(raceDate, now) % 24;
    const minutes = differenceInMinutes(raceDate, now) % 60;
    return { days, hours, minutes };
  }, [nextRace]);

  // Next race predictions
  const nextRacePredictions = useMemo(() => {
    if (!nextRace) return [];
    return getRacePredictions(CURRENT_SEASON, nextRace.round)
      .slice(0, 3)
      .sort((a, b) => a.expectedFinishPosition - b.expectedFinishPosition);
  }, [nextRace]);

  // Season points progression
  const pointsProgression = useMemo(() => {
    const topDrivers = standings.drivers.slice(0, 5);
    const data: Array<{ round: number; [key: string]: number | string }> = [];

    completedRaces.forEach((race) => {
      const entry: { round: number; [key: string]: number | string } = { round: race.round };
      const results = getRaceResults(CURRENT_SEASON, race.round);

      topDrivers.forEach((standing) => {
        const result = results.find((r) => r.driverId === standing.driver.id);
        const driver = getDriver(standing.driver.id);
        entry[driver?.code || ''] = (entry[driver?.code || ''] as number || 0) + (result?.points || 0);
      });

      data.push(entry);
    });

    return { data, drivers: topDrivers.map((s) => getDriver(s.driver.id)!) };
  }, [standings, completedRaces]);

  // Team performance
  const teamPerformance = useMemo(() => {
    const data: Array<{ round: number; [key: string]: number }> = [];

    completedRaces.forEach((race) => {
      const entry: { round: number; [key: string]: number } = { round: race.round };
      const results = getRaceResults(CURRENT_SEASON, race.round);

      TEAMS.forEach((team) => {
        const teamDrivers = DRIVERS.filter((d) => d.teamId === team.id);
        const teamPoints = results
          .filter((r) => teamDrivers.some((d) => d.id === r.driverId))
          .reduce((sum, r) => sum + r.points, 0);
        entry[team.name] = teamPoints;
      });

      data.push(entry);
    });

    return data;
  }, [completedRaces]);

  // Recent races
  const recentRaces = useMemo(() => {
    return completedRaces
      .slice(-10)
      .reverse()
      .map((race) => {
        const results = getRaceResults(CURRENT_SEASON, race.round);
        const winner = results.find((r) => r.finishPosition === 1);
        const pole = results.find((r) => r.grid === 1);
        const fastestLap = results.find((r) => r.fastestLap);

        return {
          ...race,
          winner: winner ? getDriver(winner.driverId) : null,
          pole: pole ? getDriver(pole.driverId) : null,
          fastestLap: fastestLap ? getDriver(fastestLap.driverId) : null,
          circuit: getCircuit(race.circuitId),
        };
      });
  }, [completedRaces]);

  // Win probability data for donut chart
  const winProbabilityData = useMemo(() => {
    return nextRacePredictions.map((pred) => {
      const driver = getDriver(pred.driverId);
      return {
        name: driver?.code || '',
        value: pred.winProbability * 100,
        driver,
      };
    });
  }, [nextRacePredictions]);

  const COLORS = ['#1E41FF', '#DC143C', '#00D2BE'];

  const avgConfidence =
    nextRacePredictions.length > 0
      ? nextRacePredictions.reduce((sum, p) => sum + p.confidenceScore, 0) /
        nextRacePredictions.length
      : 0;

  const confidenceLevel =
    avgConfidence > 0.7 ? 'High' : avgConfidence > 0.4 ? 'Medium' : 'Low';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Overview Dashboard</h1>
        <p className="text-muted-foreground">Current season insights and predictions</p>
      </div>

      {/* Next Race Card */}
      {nextRace && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Next Race</h2>
                <p className="text-2xl font-bold text-primary">{nextRace.name}</p>
              </div>
              {countdown && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Time until race</p>
                  <p className="text-lg font-bold text-foreground">
                    {countdown.days}d {countdown.hours}h {countdown.minutes}m
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{getCircuit(nextRace.circuitId)?.country}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(nextRace.date), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cloud className="w-4 h-4" />
                <span>
                  {nextRace.weatherSummary.temperature}°C,{' '}
                  {nextRace.weatherSummary.condition}
                </span>
              </div>
            </div>

            {getCircuit(nextRace.circuitId) && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Laps</p>
                    <p className="font-semibold">{getCircuit(nextRace.circuitId)?.laps}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Distance</p>
                    <p className="font-semibold">
                      {getCircuit(nextRace.circuitId)?.raceDistance.toFixed(2)} km
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prediction Panel */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Predicted Podium</h2>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  confidenceLevel === 'High'
                    ? 'bg-green-500/20 text-green-500'
                    : confidenceLevel === 'Medium'
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'bg-red-500/20 text-red-500'
                }`}
              >
                {confidenceLevel} Confidence
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {nextRacePredictions.map((pred, index) => {
                const driver = getDriver(pred.driverId);
                const team = driver ? getTeam(driver.teamId) : null;
                return (
                  <div
                    key={pred.driverId}
                    className="flex items-center gap-3 p-3 bg-accent rounded-lg"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: team?.primaryColor || '#666' }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{driver?.name}</p>
                      <p className="text-xs text-muted-foreground">{team?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {(pred.winProbability * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">win prob</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {winProbabilityData.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={winProbabilityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {winProbabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Season Points Progression */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">Season Points Progression</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pointsProgression.data}>
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
              {pointsProgression.drivers.map((driver, index) => (
                <Line
                  key={driver.id}
                  type="monotone"
                  dataKey={driver.code}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">Team Performance</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamPerformance}>
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
              {TEAMS.slice(0, 5).map((team) => (
                <Bar
                  key={team.id}
                  dataKey={team.name}
                  stackId="a"
                  fill={team.primaryColor}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Races Table */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">Recent Races</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Round</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Race</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Winner</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Pole</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">SC</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">DNFs</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Fastest Lap</th>
              </tr>
            </thead>
            <tbody>
              {recentRaces.map((race) => (
                <tr key={`${race.season}-${race.round}`} className="border-b border-border hover:bg-accent">
                  <td className="p-2 text-sm">{race.round}</td>
                  <td className="p-2 text-sm font-medium">{race.name}</td>
                  <td className="p-2 text-sm">{race.winner?.code || 'N/A'}</td>
                  <td className="p-2 text-sm">{race.pole?.code || 'N/A'}</td>
                  <td className="p-2 text-sm">{race.safetyCars}</td>
                  <td className="p-2 text-sm">{race.DNFs}</td>
                  <td className="p-2 text-sm">{race.fastestLap?.code || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

