import React, { useMemo, useState, useEffect } from 'react';
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
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Calendar, MapPin, Cloud } from 'lucide-react';
import {
  getNextRace,
  getSeasonStandings,
  CURRENT_SEASON,
} from '@/lib/data/dataUtils';
import { getRacePredictions } from '@/lib/predictions/predictionEngine';
import { getCircuit, getDriver, getTeam } from '@/lib/data/dataUtils';
import { useRaces } from '@/hooks/useF1Data';
import { getTeamsFromAPI } from '@/lib/api/f1DataService';
import type { Team, Driver } from '@/types';

export const Overview: React.FC = () => {
  const [nextRace, setNextRace] = useState<any>(null);
  const [standings, setStandings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  const { data: races, loading: racesLoading, error: racesError } = useRaces(CURRENT_SEASON);
  const completedRaces = useMemo(() => races?.filter((r) => r.completed) || [], [races]);

  useEffect(() => {
    const loadData = async () => {
      console.log('[Overview] 🚀 Starting data load...');
      const startTime = Date.now();
      try {
        setLoading(true);
        setError(null);
        console.log('[Overview] 📊 Fetching next race, standings, and teams...');
        const [nextRaceData, standingsData, teamsData] = await Promise.all([
          getNextRace(),
          getSeasonStandings(CURRENT_SEASON),
          getTeamsFromAPI(CURRENT_SEASON),
        ]);
        setNextRace(nextRaceData);
        setStandings(standingsData);
        setTeams(teamsData);
        const duration = Date.now() - startTime;
        console.log(`[Overview] ✅ Data loaded successfully (${duration}ms)`);
      } catch (err) {
        console.error('[Overview] ❌ Error loading overview data:', err);
        setError(err instanceof Error ? err : new Error(`Failed to load data from OpenF1 API: ${err instanceof Error ? err.message : 'Unknown error'}`));
      } finally {
        setLoading(false);
      }
    };
    
    // Wait a bit for caches to initialize
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

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

  const [nextRacePredictions, setNextRacePredictions] = useState<any[]>([]);

  useEffect(() => {
    const loadPredictions = async () => {
      if (!nextRace) {
        console.log('[Overview] ⏭️ No next race, skipping predictions');
        setNextRacePredictions([]);
        return;
      }
      console.log(`[Overview] 🔮 Loading predictions for race ${nextRace.round}...`);
      try {
        const predictions = await getRacePredictions(CURRENT_SEASON, nextRace.round);
        const top3 = predictions
          .slice(0, 3)
          .sort((a, b) => a.expectedFinishPosition - b.expectedFinishPosition);
        setNextRacePredictions(top3);
        console.log(`[Overview] ✅ Loaded ${top3.length} predictions`);
      } catch (error) {
        console.error('[Overview] ❌ Error loading race predictions:', error);
        setNextRacePredictions([]);
      }
    };
    loadPredictions();
  }, [nextRace]);

  if (loading || racesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Loading F1 data from OpenF1 API...</p>
        <p className="text-xs text-muted-foreground">This may take a moment on first load</p>
      </div>
    );
  }

  if (error || racesError) {
    const displayError = error || racesError || new Error('Unknown error');
    return (
      <div className="p-6 space-y-4">
        <ErrorMessage 
          error={displayError} 
          onRetry={() => {
            setLoading(true);
            setError(null);
            window.location.reload();
          }} 
        />
        <div className="bg-card rounded-2xl p-6 border border-border">
          <p className="text-sm text-muted-foreground mb-2">
            The app is configured to use only OpenF1 API (no fallbacks).
          </p>
          <p className="text-sm text-muted-foreground">
            If you're seeing this error, the API might be temporarily unavailable or rate-limited. 
            Check the browser console (F12) for more details.
          </p>
        </div>
      </div>
    );
  }

  if (!standings || !races || races.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border text-center">
        <p className="text-muted-foreground mb-2">No data available from OpenF1 API</p>
        <p className="text-sm text-muted-foreground">
          The API might be rate-limited (max 3 requests/second) or the season data is not yet available.
        </p>
      </div>
    );
  }

  // Season points progression
  const pointsProgression = useMemo(() => {
    if (!standings) return { data: [], drivers: [] };
    const topDrivers = standings.drivers.slice(0, 5);
    return { data: [], drivers: topDrivers.map((s: any) => getDriver(s.driver.id)!).filter(Boolean) };
  }, [standings]);

  // Team performance - simplified for now
  const teamPerformance = useMemo(() => {
    return [];
  }, []);

  // Recent races - simplified, will be populated with async data
  const recentRaces = useMemo(() => {
    return completedRaces.slice(-10).reverse().map((race) => ({
      ...race,
      winner: null as Driver | null,
      pole: null as Driver | null,
      fastestLap: null as Driver | null,
      circuit: getCircuit(race.circuitId),
    }));
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
                      {winProbabilityData.map((_, index) => (
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
              {pointsProgression.drivers.map((driver: Driver, index: number) => (
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
              {teams.slice(0, 5).map((team: Team) => (
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

