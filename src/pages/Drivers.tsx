import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { DriverCard } from '@/components/ui/DriverCard';
import { StatCard } from '@/components/ui/StatCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DRIVERS, TEAMS } from '@/lib/data/mockData';
import {
  getDriverResults,
  getSeasonStandings,
  getNextRace,
  CURRENT_SEASON,
} from '@/lib/data/dataUtils';
import { getRacePredictions } from '@/lib/predictions/predictionEngine';
import { getDriver, getTeam } from '@/lib/data/dataUtils';

export const Drivers: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [nationalityFilter, setNationalityFilter] = useState<string>('all');

  const standings = getSeasonStandings(CURRENT_SEASON);
  const nextRace = getNextRace();

  // Filter drivers
  const filteredDrivers = useMemo(() => {
    return DRIVERS.filter((driver) => {
      const matchesSearch =
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = teamFilter === 'all' || driver.teamId === teamFilter;
      const matchesNationality =
        nationalityFilter === 'all' || driver.nationality === nationalityFilter;

      return matchesSearch && matchesTeam && matchesNationality;
    });
  }, [searchTerm, teamFilter, nationalityFilter]);

  const nationalities = useMemo(() => {
    return Array.from(new Set(DRIVERS.map((d) => d.nationality))).sort();
  }, []);

  const driver = selectedDriver ? getDriver(selectedDriver) : null;
  const driverResults = driver ? getDriverResults(CURRENT_SEASON, driver.id) : [];
  const driverStanding = driver
    ? standings.drivers.find((s) => s.driver.id === driver.id)
    : null;

  // Driver stats
  const driverStats = useMemo(() => {
    if (!driver || driverResults.length === 0) return null;

    const avgFinish =
      driverResults.reduce((sum, r) => sum + r.finishPosition, 0) / driverResults.length;
    const avgGrid =
      driverResults.reduce((sum, r) => sum + r.grid, 0) / driverResults.length;
    const positionsGained = driverResults.reduce(
      (sum, r) => sum + (r.grid - r.finishPosition),
      0
    );
    const avgPositionsGained = positionsGained / driverResults.length;
    const dnfs = driverResults.filter((r) => r.DNF).length;

    return {
      avgFinish: avgFinish.toFixed(1),
      avgGrid: avgGrid.toFixed(1),
      positionsGained: avgPositionsGained.toFixed(1),
      dnfs,
    };
  }, [driver, driverResults]);

  // Position progression chart data
  const positionProgression = useMemo(() => {
    if (!driver || driverResults.length === 0) return [];
    return driverResults.map((result, index) => ({
      race: index + 1,
      position: result.finishPosition,
    }));
  }, [driver, driverResults]);

  // Grid vs finish chart data
  const gridVsFinish = useMemo(() => {
    if (!driver || driverResults.length === 0) return [];
    return driverResults.map((result) => ({
      race: driverResults.indexOf(result) + 1,
      grid: result.grid,
      finish: result.finishPosition,
    }));
  }, [driver, driverResults]);

  // Next race prediction
  const nextRacePrediction = useMemo(() => {
    if (!driver || !nextRace) return null;
    const predictions = getRacePredictions(CURRENT_SEASON, nextRace.round);
    return predictions.find((p) => p.driverId === driver.id);
  }, [driver, nextRace]);

  if (selectedDriver && driver) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedDriver(null)}>
            ← Back to Drivers
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{driver.name}</h1>
            <p className="text-muted-foreground">{driver.code} • {getTeam(driver.teamId)?.name}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Points" value={driver.points} />
          <StatCard title="Wins" value={driver.wins} />
          <StatCard title="Podiums" value={driver.podiums} />
          <StatCard title="Poles" value={driver.poles} />
        </div>

        {driverStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Avg Finish" value={driverStats.avgFinish} />
            <StatCard title="Avg Grid" value={driverStats.avgGrid} />
            <StatCard
              title="Positions Gained"
              value={driverStats.positionsGained}
              subtitle="per race on average"
            />
            <StatCard title="DNFs" value={driverStats.dnfs} />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Finishing Position</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={positionProgression}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="race" stroke="hsl(var(--muted-foreground))" />
                  <YAxis reversed stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="position"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Grid vs Finish</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gridVsFinish}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="race" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="grid" fill="hsl(var(--muted))" name="Grid" />
                  <Bar dataKey="finish" fill="hsl(var(--primary))" name="Finish" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Past Results Table */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Season Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Round</th>
                  <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Grid</th>
                  <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Finish</th>
                  <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Points</th>
                  <th className="text-left p-2 text-sm font-semibold text-muted-foreground">FL</th>
                </tr>
              </thead>
              <tbody>
                {driverResults.map((result, index) => (
                  <tr key={index} className="border-b border-border hover:bg-accent">
                    <td className="p-2 text-sm">{index + 1}</td>
                    <td className="p-2 text-sm">{result.grid}</td>
                    <td className="p-2 text-sm font-semibold">{result.finishPosition}</td>
                    <td className="p-2 text-sm">{result.points}</td>
                    <td className="p-2 text-sm">{result.fastestLap ? '✓' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Next Race Prediction */}
        {nextRacePrediction && (
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Next Race Prediction</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Predicted Finish"
                value={`P${nextRacePrediction.expectedFinishPosition}`}
              />
              <StatCard
                title="Win Probability"
                value={`${(nextRacePrediction.winProbability * 100).toFixed(1)}%`}
              />
              <StatCard
                title="Podium Probability"
                value={`${(nextRacePrediction.podiumProbability * 100).toFixed(1)}%`}
              />
            </div>
            {nextRacePrediction.reasoning && (
              <p className="text-sm text-muted-foreground mt-4">{nextRacePrediction.reasoning}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Drivers</h1>
        <p className="text-muted-foreground">Explore driver statistics and performance</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="min-w-[150px]"
        >
          <option value="all">All Teams</option>
          {TEAMS.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
        <Select
          value={nationalityFilter}
          onChange={(e) => setNationalityFilter(e.target.value)}
          className="min-w-[150px]"
        >
          <option value="all">All Nationalities</option>
          {nationalities.map((nat) => (
            <option key={nat} value={nat}>
              {nat}
            </option>
          ))}
        </Select>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map((driver) => {
          const standing = standings.drivers.find((s) => s.driver.id === driver.id);
          return (
            <DriverCard
              key={driver.id}
              driver={driver}
              showDetails
              onClick={() => setSelectedDriver(driver.id)}
            />
          );
        })}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border text-center">
          <p className="text-muted-foreground">No drivers found matching your filters</p>
        </div>
      )}
    </div>
  );
};

