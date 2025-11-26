# ML Prediction Service Integration Guide

## Overview

The ML Prediction Service (`src/lib/predictions/mlService.ts`) provides a production-ready abstraction layer for integrating machine learning models into the F1 predictions system. Currently, it uses heuristic-based predictions, but it's designed to seamlessly switch to ML models when ready.

## Current Implementation

### Default: Heuristic-Based Predictions

The service currently uses weighted heuristics from `predictionEngine.ts`:
- **Recent Form** (last 5 races): 35%
- **Team Performance**: 30%
- **Track-Specific History**: 25%
- **Qualifying vs Race Pace Delta**: 10%

### Service Architecture

```typescript
import { mlPredictionService } from '@/lib/predictions/mlService';

// Configure the service
mlPredictionService.configure({
  modelType: 'heuristic', // or 'tensorflow', 'pytorch', 'cloud'
  modelUrl: '/models/f1-predictor.json', // for TensorFlow.js
  endpoint: 'https://api.example.com/predict', // for API-based models
  apiKey: 'your-api-key' // for authenticated APIs
});

// Get predictions
const racePredictions = await mlPredictionService.predictRace(2024, 5);
const qualiPredictions = await mlPredictionService.predictQualifying(2024, 5);
const seasonProbs = await mlPredictionService.predictSeason(2024);
```

## Integration Options

### Option 1: TensorFlow.js (In-Browser)

Run predictions directly in the browser without a backend.

#### Setup Steps

1. **Install TensorFlow.js:**
   ```bash
   npm install @tensorflow/tfjs
   ```

2. **Train and Export Your Model:**
   ```python
   # Example: Train a model using TensorFlow/Keras
   import tensorflow as tf
   
   model = tf.keras.Sequential([
       tf.keras.layers.Dense(64, activation='relu', input_shape=(feature_count,)),
       tf.keras.layers.Dense(32, activation='relu'),
       tf.keras.layers.Dense(20, activation='softmax')  # 20 drivers
   ])
   
   model.compile(optimizer='adam', loss='categorical_crossentropy')
   model.fit(training_data, training_labels, epochs=100)
   
   # Export for TensorFlow.js
   tfjs.converters.save_keras_model(model, './public/models/f1-predictor')
   ```

3. **Update `mlService.ts`:**
   ```typescript
   private async predictWithTensorFlow(
     season: number,
     round: number
   ): Promise<DriverPrediction[]> {
     const tf = await import('@tensorflow/tfjs');
     
     // Load model
     const model = await tf.loadLayersModel(this.config.modelUrl!);
     
     // Prepare input features
     const inputFeatures = await this.prepareInputFeatures(season, round);
     const inputTensor = tf.tensor2d([inputFeatures]);
     
     // Make prediction
     const prediction = model.predict(inputTensor) as tf.Tensor;
     const probabilities = await prediction.data();
     
     // Transform to DriverPrediction[]
     return this.transformPredictions(probabilities, season, round);
   }
   
   private async prepareInputFeatures(season: number, round: number): Promise<number[]> {
     // Extract features from race data, driver stats, etc.
     // Return array of numerical features
     const race = await getRace(season, round);
     const drivers = await getDriversFromAPI(season);
     // ... feature engineering
     return features;
   }
   ```

4. **Configure in Settings Page:**
   - Go to Settings → ML Model Configuration
   - Select "TensorFlow.js"
   - Enter model URL: `/models/f1-predictor/model.json`

#### Advantages
- ✅ No backend required
- ✅ Fast inference (runs in browser)
- ✅ Privacy-friendly (data stays client-side)

#### Limitations
- ⚠️ Model size limited by browser memory
- ⚠️ Training must be done separately

---

### Option 2: PyTorch/TensorFlow Backend API

Serve ML models via a REST API backend.

#### Setup Steps

1. **Create Backend API (Python/FastAPI example):**
   ```python
   from fastapi import FastAPI, HTTPException
   from pydantic import BaseModel
   import torch
   import torch.nn as nn
   
   app = FastAPI()
   
   # Load your trained model
   model = torch.load('f1_predictor.pth')
   model.eval()
   
   class PredictionRequest(BaseModel):
       season: int
       round: int
   
   @app.post("/predict/race")
   async def predict_race(request: PredictionRequest):
       # Prepare features
       features = prepare_features(request.season, request.round)
       
       # Make prediction
       with torch.no_grad():
           prediction = model(torch.tensor(features))
       
       # Return predictions
       return {
           "predictions": transform_to_driver_predictions(prediction)
       }
   ```

2. **Deploy Backend:**
   - Deploy to AWS, Google Cloud, Azure, or your own server
   - Ensure CORS is enabled for your frontend domain

3. **Configure in Settings:**
   - Select "PyTorch/TensorFlow API"
   - Enter endpoint: `https://your-api.com/predict`
   - (Optional) Enter API key if authentication is required

#### Advantages
- ✅ No model size limitations
- ✅ Can use complex models (RNNs, Transformers, etc.)
- ✅ Centralized model updates
- ✅ Can leverage GPU servers

#### Limitations
- ⚠️ Requires backend infrastructure
- ⚠️ Network latency for predictions

---

### Option 3: Cloud ML Services

Use managed ML services from cloud providers.

#### AWS SageMaker

```typescript
private async predictWithCloudML(
  season: number,
  round: number
): Promise<DriverPrediction[]> {
  const response = await fetch(`${this.config.endpoint}/predict/race`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'x-api-key': this.config.apiKey, // AWS API Gateway
    },
    body: JSON.stringify({ season, round }),
  });
  
  const data = await response.json();
  return data.predictions;
}
```

#### Google Cloud ML

```typescript
// Similar structure, but with Google Cloud authentication
// Use Google Cloud AI Platform or Vertex AI
```

#### Azure Machine Learning

```typescript
// Similar structure, but with Azure authentication
// Use Azure ML endpoints
```

#### Advantages
- ✅ Fully managed infrastructure
- ✅ Auto-scaling
- ✅ Built-in monitoring and logging
- ✅ Enterprise-grade security

#### Limitations
- ⚠️ Cost (pay per prediction or compute time)
- ⚠️ Vendor lock-in

---

## Data Format

### Input Features

When implementing ML models, you'll need to prepare input features. Common features include:

```typescript
interface InputFeatures {
  // Driver features
  driverRecentForm: number[]; // Last 5 race positions
  driverPoints: number;
  driverWins: number;
  driverPodiums: number;
  
  // Team features
  teamPoints: number;
  teamRecentForm: number[];
  teamEngine: string; // encoded
  
  // Track features
  trackType: 'street' | 'permanent';
  trackLaps: number;
  driverTrackHistory: number[]; // Past positions at this track
  
  // Race features
  weatherCondition: 'dry' | 'wet' | 'mixed';
  temperature: number;
  chanceOfRain: number;
  
  // Qualifying features
  qualifyingPosition: number;
  gridPosition: number;
}
```

### Output Format

The service expects predictions in this format:

```typescript
interface DriverPrediction {
  driverId: string;
  expectedFinishPosition: number; // 1-20
  podiumProbability: number; // 0-1
  winProbability: number; // 0-1
  pointsProjection: number; // Expected points
  confidenceScore: number; // 0-1, model confidence
  reasoning?: string; // Optional explanation
}
```

---

## Usage Examples

### In React Components

```typescript
import { mlPredictionService } from '@/lib/predictions/mlService';
import { useState, useEffect } from 'react';

function PredictionsPage() {
  const [predictions, setPredictions] = useState([]);
  
  useEffect(() => {
    const loadPredictions = async () => {
      // Service automatically uses configured model type
      const preds = await mlPredictionService.predictRace(2024, 5);
      setPredictions(preds);
    };
    loadPredictions();
  }, []);
  
  return (
    <div>
      {predictions.map(p => (
        <div key={p.driverId}>
          {p.driverId}: P{p.expectedFinishPosition} 
          (Win: {(p.winProbability * 100).toFixed(1)}%)
        </div>
      ))}
    </div>
  );
}
```

### Configuration from Settings Page

The Settings page (`src/pages/Settings.tsx`) provides a UI for configuring the ML service:

```typescript
// User selects model type
mlPredictionService.configure({ 
  modelType: 'tensorflow',
  modelUrl: '/models/f1-predictor.json'
});

// Or for API-based models
mlPredictionService.configure({
  modelType: 'pytorch',
  endpoint: 'https://api.example.com/predict',
  apiKey: 'your-key'
});
```

---

## Testing Your Integration

### 1. Test Heuristic Mode (Current)

```typescript
mlPredictionService.configure({ modelType: 'heuristic' });
const predictions = await mlPredictionService.predictRace(2024, 5);
console.log('Heuristic predictions:', predictions);
```

### 2. Test TensorFlow.js Mode

```typescript
mlPredictionService.configure({ 
  modelType: 'tensorflow',
  modelUrl: '/models/f1-predictor/model.json'
});
const predictions = await mlPredictionService.predictRace(2024, 5);
console.log('ML predictions:', predictions);
```

### 3. Test API Mode

```typescript
mlPredictionService.configure({
  modelType: 'pytorch',
  endpoint: 'http://localhost:8000/predict',
});
const predictions = await mlPredictionService.predictRace(2024, 5);
console.log('API predictions:', predictions);
```

---

## Model Training Tips

### Data Collection

1. **Historical Race Data:**
   - Driver positions, points, fastest laps
   - Team performance metrics
   - Track-specific results

2. **Feature Engineering:**
   - Rolling averages (last 3, 5, 10 races)
   - Track-specific performance
   - Weather impact
   - Qualifying vs race pace delta

3. **Target Variables:**
   - Finish position (regression)
   - Podium probability (classification)
   - Win probability (classification)

### Model Architecture Suggestions

- **Simple Models:** Linear Regression, Random Forest
- **Neural Networks:** Dense layers (64, 32, 20 neurons)
- **Time Series:** LSTM/GRU for sequential race data
- **Advanced:** Transformer models for complex patterns

---

## Current Status

✅ **Implemented:**
- Service interface and abstraction layer
- Heuristic-based predictions (working)
- Configuration system
- Settings page UI for configuration
- Fallback to heuristics if ML fails

🔮 **Future Enhancements:**
- Actual TensorFlow.js model loading
- Pre-trained model examples
- Model performance monitoring
- A/B testing between models
- Model versioning

---

## Troubleshooting

### Model Not Loading (TensorFlow.js)

- Check model URL is correct
- Verify model format (should be TensorFlow.js format)
- Check browser console for errors
- Ensure CORS is enabled if loading from different domain

### API Errors (Backend)

- Verify endpoint URL is correct
- Check API authentication (API key)
- Verify request format matches backend expectations
- Check network tab for HTTP errors

### Predictions Seem Wrong

- Verify input features are correctly prepared
- Check model was trained on similar data
- Compare ML predictions with heuristic predictions
- Review model confidence scores

---

## Next Steps

1. **Choose Integration Option:** TensorFlow.js, Backend API, or Cloud ML
2. **Train Your Model:** Use historical F1 data
3. **Implement Integration:** Update `mlService.ts` methods
4. **Test Thoroughly:** Compare with heuristic predictions
5. **Deploy:** Update Settings page configuration

For questions or issues, refer to:
- `src/lib/predictions/mlService.ts` - Service implementation
- `src/lib/predictions/predictionEngine.ts` - Current heuristic engine
- `src/pages/Settings.tsx` - Configuration UI

