import React, { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { CURRENT_SEASON } from '@/lib/data/mockData';
import { refreshAllData, refreshRaces, refreshDrivers, refreshTeams } from '@/lib/utils/refresh';
import { mlPredictionService } from '@/lib/predictions/mlService';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [defaultSeason, setDefaultSeason] = useState(CURRENT_SEASON);
  const [defaultLandingPage, setDefaultLandingPage] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [mlModelType, setMlModelType] = useState<'heuristic' | 'tensorflow' | 'pytorch' | 'cloud'>('heuristic');
  const [mlEndpoint, setMlEndpoint] = useState('');
  const [mlApiKey, setMlApiKey] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your F1 Insights experience</p>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
        {/* Theme */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Theme</label>
              <Select value={theme} onChange={(e) => {
                if (e.target.value !== theme) {
                  toggleTheme();
                }
              }}>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Default Season</label>
              <Select
                value={defaultSeason}
                onChange={(e) => setDefaultSeason(Number(e.target.value))}
              >
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
                <option value={2022}>2022</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Default Landing Page</label>
              <Select
                value={defaultLandingPage}
                onChange={(e) => setDefaultLandingPage(e.target.value)}
              >
                <option value="overview">Overview</option>
                <option value="race-weekend">Race Weekend</option>
                <option value="drivers">Drivers</option>
                <option value="constructors">Constructors</option>
                <option value="historical">Historical</option>
                <option value="predictions">Predictions</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Data Management</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Manually refresh cached data from the OpenF1 API
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={async () => {
                    setRefreshing(true);
                    try {
                      await refreshAllData(defaultSeason);
                      alert('All data refreshed successfully!');
                    } catch (error) {
                      alert(`Error refreshing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    } finally {
                      setRefreshing(false);
                    }
                  }}
                  disabled={refreshing}
                  variant="outline"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh All Data'}
                </Button>
                <Button
                  onClick={async () => {
                    setRefreshing(true);
                    try {
                      await refreshRaces(defaultSeason);
                      alert('Races refreshed successfully!');
                    } catch (error) {
                      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    } finally {
                      setRefreshing(false);
                    }
                  }}
                  disabled={refreshing}
                  variant="outline"
                >
                  Refresh Races
                </Button>
                <Button
                  onClick={async () => {
                    setRefreshing(true);
                    try {
                      await refreshDrivers(defaultSeason);
                      await refreshTeams(defaultSeason);
                      alert('Drivers and teams refreshed successfully!');
                    } catch (error) {
                      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    } finally {
                      setRefreshing(false);
                    }
                  }}
                  disabled={refreshing}
                  variant="outline"
                >
                  Refresh Drivers/Teams
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ML Configuration */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">ML Model Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Model Type</label>
              <Select
                value={mlModelType}
                onChange={(e) => {
                  const newType = e.target.value as typeof mlModelType;
                  setMlModelType(newType);
                  mlPredictionService.configure({ modelType: newType });
                }}
              >
                <option value="heuristic">Heuristic (Current)</option>
                <option value="tensorflow">TensorFlow.js</option>
                <option value="pytorch">PyTorch/TensorFlow API</option>
                <option value="cloud">Cloud ML Service</option>
              </Select>
            </div>
            {(mlModelType === 'pytorch' || mlModelType === 'cloud') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">API Endpoint</label>
                  <input
                    type="text"
                    value={mlEndpoint}
                    onChange={(e) => {
                      setMlEndpoint(e.target.value);
                      mlPredictionService.configure({ endpoint: e.target.value });
                    }}
                    placeholder="https://api.example.com/predict"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">API Key (Optional)</label>
                  <input
                    type="password"
                    value={mlApiKey}
                    onChange={(e) => {
                      setMlApiKey(e.target.value);
                      mlPredictionService.configure({ apiKey: e.target.value });
                    }}
                    placeholder="Enter API key"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
              </>
            )}
            {mlModelType === 'tensorflow' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Model URL</label>
                <input
                  type="text"
                  value={mlEndpoint}
                  onChange={(e) => {
                    setMlEndpoint(e.target.value);
                    mlPredictionService.configure({ modelUrl: e.target.value });
                  }}
                  placeholder="/models/f1-predictor.json"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Current configuration: {mlPredictionService.getConfig().modelType}
            </p>
          </div>
        </div>

        {/* About */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">About</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Data Sources</h3>
              <p>
                <strong className="text-green-500">✅ Integrated:</strong> The app now uses <strong>OpenF1 API</strong> for real-time F1 data.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong>OpenF1 API:</strong> Modern REST API providing historical and real-time F1 data (api.openf1.org)
                </li>
                <li>
                  <strong>Rate Limiting:</strong> Automatic rate limiting (3 requests/second) with retry logic
                </li>
                <li>
                  <strong>Caching:</strong> 5-minute cache for improved performance
                </li>
              </ul>
              <p className="mt-2 text-sm">
                <strong>Alternative Options:</strong> FastF1 (Python backend), Ergast API (deprecated), or custom microservices
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Prediction Engine</h3>
              <p>
                The current prediction engine uses heuristic-based algorithms combining:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Recent form (last 5 races): 35%</li>
                <li>Team performance this season: 30%</li>
                <li>Track-specific history: 25%</li>
                <li>Qualifying vs race pace delta: 10%</li>
              </ul>
              <p className="mt-2">
                <strong>Future Enhancement:</strong> ML model integration options:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>TensorFlow.js:</strong> In-browser predictions (no backend required)</li>
                <li><strong>PyTorch/TensorFlow API:</strong> Backend model serving via REST API</li>
                <li><strong>Cloud ML Services:</strong> AWS SageMaker, Google Cloud ML, Azure ML</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                See <code className="bg-muted px-1 rounded">src/lib/predictions/predictionEngine.ts</code> for current implementation
                and README.md for integration guide.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Real-Time Telemetry</h3>
              <p>
                For live race weekend data:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>FastF1 library provides live timing data</li>
                <li>WebSocket connections for real-time updates</li>
                <li>F1 official timing data (requires API access)</li>
              </ul>
              <p className="mt-2">
                <strong>Available:</strong> WebSocket client structure created in <code className="bg-muted px-1 rounded">src/lib/data/telemetry.ts</code>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Connect to your WebSocket service for live race weekend updates. See the file for implementation details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

