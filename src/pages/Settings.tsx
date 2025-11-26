import React, { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { useTheme } from '@/hooks/useTheme';
import { CURRENT_SEASON } from '@/lib/data/mockData';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [defaultSeason, setDefaultSeason] = useState(CURRENT_SEASON);
  const [defaultLandingPage, setDefaultLandingPage] = useState('overview');

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

        {/* About */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">About</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Data Sources</h3>
              <p>
                Currently using mock data for demonstration. To integrate real F1 data:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong>Ergast API:</strong> Free F1 historical data API (ergast.com/api/f1)
                </li>
                <li>
                  <strong>FastF1:</strong> Python library for live timing and telemetry data
                </li>
                <li>
                  <strong>Custom Microservice:</strong> Build your own data aggregation service
                </li>
              </ul>
              <p className="mt-2">
                TODO: Replace mock data in <code className="bg-muted px-1 rounded">src/lib/data/mockData.ts</code> with API calls
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
                TODO: Replace heuristic in <code className="bg-muted px-1 rounded">src/lib/predictions/predictionEngine.ts</code> with ML models:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>TensorFlow.js for in-browser predictions</li>
                <li>PyTorch model served via API</li>
                <li>External ML service (e.g., AWS SageMaker, Google Cloud ML)</li>
              </ul>
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
                TODO: Implement WebSocket client in <code className="bg-muted px-1 rounded">src/lib/data/</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

