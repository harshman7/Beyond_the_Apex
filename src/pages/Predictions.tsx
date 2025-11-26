import React, { useState, useMemo, useEffect } from 'react';
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
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  getRacePredictions,
} from '@/lib/predictions/predictionEngine';
import { mlPredictionService } from '@/lib/predictions/mlService';
import { getRaces, getNextRace, CURRENT_SEASON, getTeam } from '@/lib/data/dataUtils';
import { getDriver } from '@/lib/data/dataUtils';
import { getTeamsFromAPI } from '@/lib/api/f1DataService';
import { exportToJSON } from '@/lib/utils/export';
import { Download } from 'lucide-react';
import type { Race, Team } from '@/types';

export const Predictions: React.FC = () => {
  const [season] = useState(CURRENT_SEASON);
  const [races, setRaces] = useState<Race[]>([]);
  const [, setNextRace] = useState<Race | undefined>(undefined);
  const [seasonProbs, setSeasonProbs] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [next3RacesPredictions, setNext3RacesPredictions] = useState<Map<number, any[]>>(new Map());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [racesData, nextRaceData, teamsData] = await Promise.all([
          getRaces(season),
          getNextRace(),
          getTeamsFromAPI(season),
        ]);
        setRaces(racesData);
        setNextRace(nextRaceData);
        setTeams(teamsData);
        // Use ML service (currently uses heuristics, but can be switched to ML models)
        const probs = await mlPredictionService.predictSeason(season);
        setSeasonProbs(probs);
      } catch (error) {
        console.error('Error loading predictions data:', error);
      }
    };
    loadData();
  }, [season]);

  const next3Races = races.filter((r: Race) => !r.completed).slice(0, 3);

  useEffect(() => {
    const loadRacePredictions = async () => {
      const predictionsMap = new Map<number, any[]>();
      for (const race of next3Races) {
        try {
          const predictions = await getRacePredictions(season, race.round);
          predictionsMap.set(race.round, predictions);
        } catch (error) {
          console.error(`Error loading predictions for race ${race.round}:`, error);
          predictionsMap.set(race.round, []);
        }
      }
      setNext3RacesPredictions(predictionsMap);
    };
    if (next3Races.length > 0) {
      loadRacePredictions();
    }
  }, [next3Races, season]);

  // What-if parameters
  const [teamBoost, setTeamBoost] = useState<Record<string, number>>({});
  const [rainChance, setRainChance] = useState<number>(0);

  // Adjusted predictions with what-if
  const adjustedDriverProbs = useMemo(() => {
    if (!seasonProbs) return [];
    return seasonProbs.driverTitle.map((prob: any) => {
      const driver = getDriver(prob.driverId);
      const boost = driver ? teamBoost[driver.teamId] || 0 : 0;
      return {
        ...prob,
        titleProbability: Math.min(1, prob.titleProbability * (1 + boost / 100)),
      };
    });
  }, [seasonProbs, teamBoost]);

  const handleTeamBoost = (teamId: string, value: number) => {
    setTeamBoost((prev) => ({ ...prev, [teamId]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Predictions</h1>
          <p className="text-muted-foreground">Championship odds and race predictions</p>
          <p className="text-xs text-muted-foreground mt-1">
            Using: {mlPredictionService.getConfig().modelType} model
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (seasonProbs) {
                exportToJSON(seasonProbs, `predictions-${season}`);
              }
            }}
            disabled={!seasonProbs}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Predictions
          </Button>
        </div>
      </div>

      {!seasonProbs ? (
        <div className="bg-card rounded-2xl p-6 border border-border text-center">
          <p className="text-muted-foreground">Loading predictions...</p>
        </div>
      ) : (
        <>
          {/* Season Title Odds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drivers' Championship */}
            <div className="bg-card rounded-2xl p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Drivers' Championship</h2>
              <div className="space-y-3 mb-4">
                {seasonProbs.driverTitle.slice(0, 5).map((prob: any) => {
              const driver = getDriver(prob.driverId);
              return (
                <div key={prob.driverId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{driver?.name || 'N/A'}</span>
                      <span className="text-sm font-semibold">
                        {(prob.titleProbability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${prob.titleProbability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2">Driver</th>
                  <th className="text-left p-2">Probability</th>
                  <th className="text-left p-2">Projected Points</th>
                  <th className="text-left p-2">Projected Pos</th>
                </tr>
              </thead>
              <tbody>
                {seasonProbs.driverTitle.map((prob: any) => {
                  const driver = getDriver(prob.driverId);
                  return (
                    <tr key={prob.driverId} className="border-b border-border hover:bg-accent">
                      <td className="p-2">{driver?.code || 'N/A'}</td>
                      <td className="p-2">{(prob.titleProbability * 100).toFixed(1)}%</td>
                      <td className="p-2">{prob.projectedFinalPoints}</td>
                      <td className="p-2">P{prob.projectedFinalPosition}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Constructors' Championship */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Constructors' Championship</h2>
          <div className="space-y-3 mb-4">
            {seasonProbs.constructorTitle.slice(0, 5).map((prob: any) => {
              const team = getTeam(prob.teamId);
              return (
                <div key={prob.teamId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{team?.name || 'N/A'}</span>
                      <span className="text-sm font-semibold">
                        {(prob.titleProbability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${prob.titleProbability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2">Team</th>
                  <th className="text-left p-2">Probability</th>
                  <th className="text-left p-2">Projected Points</th>
                  <th className="text-left p-2">Projected Pos</th>
                </tr>
              </thead>
              <tbody>
                {seasonProbs.constructorTitle.map((prob: any) => {
                  const team = getTeam(prob.teamId);
                  return (
                    <tr key={prob.teamId} className="border-b border-border hover:bg-accent">
                      <td className="p-2">{team?.name || 'N/A'}</td>
                      <td className="p-2">{(prob.titleProbability * 100).toFixed(1)}%</td>
                      <td className="p-2">{prob.projectedFinalPoints}</td>
                      <td className="p-2">P{prob.projectedFinalPosition}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Next 3 Races Outlook */}
      {next3Races.length > 0 && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Next 3 Races Outlook</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {next3Races.map((race: Race) => {
            const predictions = next3RacesPredictions.get(race.round) || [];
            const predictedWinner = predictions.find((p: any) => p.expectedFinishPosition === 1);
            const driver = predictedWinner ? getDriver(predictedWinner.driverId) : null;
            const chaosLevel = race.safetyCars + race.DNFs;
            
            return (
              <div key={race.round} className="bg-accent rounded-xl p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-2">{race.name}</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Predicted Winner: </span>
                    <span className="font-medium">{driver?.code || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Chaos Level: </span>
                    <span className={`font-medium ${
                      chaosLevel > 5 ? 'text-red-500' : chaosLevel > 2 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {chaosLevel > 5 ? 'High' : chaosLevel > 2 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expected SC: </span>
                    <span className="font-medium">{race.safetyCars}</span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* What-If Scenarios */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">What-If Scenarios</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Adjust parameters to see how predictions change
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Performance Boost */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Team Performance Boost (%)</h3>
            <div className="space-y-2">
              {teams.slice(0, 5).map((team: Team) => (
                <div key={team.id} className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground w-32">{team.name}</label>
                  <Input
                    type="number"
                    min="-50"
                    max="50"
                    value={teamBoost[team.id] || 0}
                    onChange={(e) => handleTeamBoost(team.id, Number(e.target.value))}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rain Chance */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Rain Chance Adjustment (%)</h3>
            <Input
              type="number"
              min="0"
              max="100"
              value={rainChance}
              onChange={(e) => setRainChance(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-2">
              This would affect race predictions (not yet implemented in heuristic)
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setTeamBoost({});
            setRainChance(0);
          }}
          variant="outline"
          className="mt-4"
        >
          Reset
        </Button>

        {/* Adjusted Probabilities */}
        {Object.keys(teamBoost).length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-foreground mb-3">Adjusted Driver Championship Probabilities</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adjustedDriverProbs.slice(0, 10).map((p: any) => ({
                  driver: getDriver(p.driverId)?.code || '',
                  original: seasonProbs?.driverTitle.find((orig: any) => orig.driverId === p.driverId)?.titleProbability || 0,
                  adjusted: p.titleProbability,
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
                  <Legend />
                  <Bar dataKey="original" fill="hsl(var(--muted))" name="Original" />
                  <Bar dataKey="adjusted" fill="hsl(var(--primary))" name="Adjusted" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

