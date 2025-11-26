import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { TEAMS, DRIVERS } from '@/lib/data/mockData';
import {
  getSeasonStandings,
  getTeamResults,
  CURRENT_SEASON,
} from '@/lib/data/dataUtils';
import { getSeasonOutcomeProbabilities } from '@/lib/predictions/predictionEngine';
import { getTeam } from '@/lib/data/dataUtils';

export const Constructors: React.FC = () => {
  const standings = getSeasonStandings(CURRENT_SEASON);
  const seasonProbs = getSeasonOutcomeProbabilities(CURRENT_SEASON);

  // Driver contributions to team points
  const driverContributions = useMemo(() => {
    const data: Array<{ team: string; [key: string]: number | string }> = [];

    TEAMS.forEach((team) => {
      const teamDrivers = DRIVERS.filter((d) => d.teamId === team.id);
      const entry: { team: string; [key: string]: number | string } = { team: team.name };

      teamDrivers.forEach((driver) => {
        entry[driver.code] = driver.points;
      });

      data.push(entry);
    });

    return data;
  }, []);

  // Team outlook
  const teamOutlook = useMemo(() => {
    return seasonProbs.constructorTitle.map((prob) => ({
      team: getTeam(prob.teamId)?.name || '',
      p1: prob.projectedFinalPosition === 1 ? prob.titleProbability : 0,
      p2: prob.projectedFinalPosition === 2 ? prob.titleProbability : 0,
      p3: prob.projectedFinalPosition === 3 ? prob.titleProbability : 0,
    }));
  }, [seasonProbs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Constructors</h1>
        <p className="text-muted-foreground">Team performance and championship standings</p>
      </div>

      {/* Constructor Standings */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Constructor Standings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Pos</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Team</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Engine</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Drivers</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Points</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Wins</th>
                <th className="text-left p-2 text-sm font-semibold text-muted-foreground">Podiums</th>
              </tr>
            </thead>
            <tbody>
              {standings.teams.map((standing) => {
                const team = standing.team;
                const teamDrivers = DRIVERS.filter((d) => d.teamId === team.id);
                return (
                  <tr key={team.id} className="border-b border-border hover:bg-accent">
                    <td className="p-2 text-sm font-semibold">{standing.position}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.primaryColor }}
                        />
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">{team.engine}</td>
                    <td className="p-2 text-sm">
                      {teamDrivers.map((d) => d.code).join(', ')}
                    </td>
                    <td className="p-2 text-sm font-semibold">{standing.points}</td>
                    <td className="p-2 text-sm">{team.wins}</td>
                    <td className="p-2 text-sm">{team.podiums}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Contributions */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Driver Contributions to Team Points</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={driverContributions}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="team" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              {DRIVERS.map((driver) => {
                const team = getTeam(driver.teamId);
                return (
                  <Bar
                    key={driver.id}
                    dataKey={driver.code}
                    stackId="a"
                    fill={team?.primaryColor || '#666'}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Outlook */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Championship Outlook</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {seasonProbs.constructorTitle.slice(0, 3).map((prob) => {
            const team = getTeam(prob.teamId);
            return (
              <StatCard
                key={prob.teamId}
                title={team?.name || ''}
                value={`${(prob.titleProbability * 100).toFixed(1)}%`}
                subtitle={`Projected: P${prob.projectedFinalPosition} (${prob.projectedFinalPoints} pts)`}
              />
            );
          })}
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamOutlook}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="team" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="p1" stackId="a" fill="#FFD700" name="P1 Probability" />
              <Bar dataKey="p2" stackId="a" fill="#C0C0C0" name="P2 Probability" />
              <Bar dataKey="p3" stackId="a" fill="#CD7F32" name="P3 Probability" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

