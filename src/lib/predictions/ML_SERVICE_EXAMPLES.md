# ML Prediction Service - Quick Examples

## Basic Usage

```typescript
import { mlPredictionService } from '@/lib/predictions/mlService';

// Get race predictions (uses configured model type)
const predictions = await mlPredictionService.predictRace(2024, 5);

// Get qualifying predictions
const qualiPredictions = await mlPredictionService.predictQualifying(2024, 5);

// Get season outcome probabilities
const seasonProbs = await mlPredictionService.predictSeason(2024);
```

## Configuration Examples

### 1. Heuristic Mode (Default)

```typescript
mlPredictionService.configure({
  modelType: 'heuristic'
});

// No additional config needed - uses built-in heuristics
const predictions = await mlPredictionService.predictRace(2024, 5);
```

### 2. TensorFlow.js Mode

```typescript
mlPredictionService.configure({
  modelType: 'tensorflow',
  modelUrl: '/models/f1-predictor/model.json'
});

const predictions = await mlPredictionService.predictRace(2024, 5);
```

### 3. PyTorch/TensorFlow Backend API

```typescript
mlPredictionService.configure({
  modelType: 'pytorch',
  endpoint: 'https://api.example.com/predict',
  apiKey: 'your-api-key' // Optional
});

const predictions = await mlPredictionService.predictRace(2024, 5);
```

### 4. Cloud ML Service

```typescript
mlPredictionService.configure({
  modelType: 'cloud',
  endpoint: 'https://your-sagemaker-endpoint.execute-api.us-east-1.amazonaws.com/predict',
  apiKey: 'your-aws-api-key'
});

const predictions = await mlPredictionService.predictRace(2024, 5);
```

## React Component Example

```typescript
import { useState, useEffect } from 'react';
import { mlPredictionService } from '@/lib/predictions/mlService';
import type { DriverPrediction } from '@/types';

function RacePredictions({ season, round }: { season: number; round: number }) {
  const [predictions, setPredictions] = useState<DriverPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPredictions = async () => {
      try {
        setLoading(true);
        const preds = await mlPredictionService.predictRace(season, round);
        setPredictions(preds);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();
  }, [season, round]);

  if (loading) return <div>Loading predictions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Race Predictions (using {mlPredictionService.getConfig().modelType})</h2>
      <table>
        <thead>
          <tr>
            <th>Driver</th>
            <th>Expected Position</th>
            <th>Win Probability</th>
            <th>Podium Probability</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((p) => (
            <tr key={p.driverId}>
              <td>{p.driverId}</td>
              <td>P{p.expectedFinishPosition}</td>
              <td>{(p.winProbability * 100).toFixed(1)}%</td>
              <td>{(p.podiumProbability * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Checking Current Configuration

```typescript
const config = mlPredictionService.getConfig();
console.log('Current model type:', config.modelType);
console.log('Endpoint:', config.endpoint);
console.log('Model URL:', config.modelUrl);
```

## Error Handling

The service automatically falls back to heuristics if ML models fail:

```typescript
try {
  const predictions = await mlPredictionService.predictRace(2024, 5);
  // Use predictions
} catch (error) {
  // Service will log error and fallback to heuristics
  // You can still use the predictions, they'll just be heuristic-based
  console.error('ML prediction failed, using heuristics:', error);
}
```

## Switching Models Dynamically

```typescript
// Switch to TensorFlow.js
mlPredictionService.configure({ modelType: 'tensorflow', modelUrl: '/models/model.json' });
const tfPredictions = await mlPredictionService.predictRace(2024, 5);

// Switch to API-based
mlPredictionService.configure({ modelType: 'pytorch', endpoint: 'https://api.example.com' });
const apiPredictions = await mlPredictionService.predictRace(2024, 5);

// Compare results
console.log('TensorFlow:', tfPredictions);
console.log('API:', apiPredictions);
```

