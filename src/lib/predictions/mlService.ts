/**
 * ML Prediction Service Interface
 * 
 * This service provides an abstraction layer for ML model predictions.
 * Supports:
 * - TensorFlow.js models (in-browser)
 * - PyTorch/TensorFlow backend API
 * - Cloud ML services (AWS SageMaker, Google Cloud ML, Azure ML)
 * - Heuristic fallback
 * 
 * Usage:
 * ```typescript
 * import { mlPredictionService } from '@/lib/predictions/mlService';
 * 
 * // Configure TensorFlow.js
 * mlPredictionService.configure({
 *   modelType: 'tensorflow',
 *   modelUrl: '/models/f1-predictor/model.json'
 * });
 * 
 * const predictions = await mlPredictionService.predictRace(season, round);
 * ```
 */

import * as tf from '@tensorflow/tfjs';
import type {
  DriverPrediction,
  QualifyingPrediction,
  SeasonOutcomeProbabilities,
  Driver,
  Race,
} from '@/types';
import {
  getRacePredictions,
  getQualiPredictions,
  getSeasonOutcomeProbabilities,
} from './predictionEngine';
import {
  getRace,
  getRaces,
  getDriverResults,
  getTeam,
  getCircuit,
  getCircuitHistory,
  getSeasonStandings,
} from '../data/dataUtils';
import { getDriversFromAPI } from '../api/f1DataService';

export interface MLModelConfig {
  modelType: 'heuristic' | 'tensorflow' | 'pytorch' | 'cloud';
  modelUrl?: string;
  apiKey?: string;
  endpoint?: string;
}

class MLPredictionService {
  private config: MLModelConfig = {
    modelType: 'heuristic', // Default to heuristic, can be changed to ML models
  };
  
  // Cache for TensorFlow.js models
  private modelCache: tf.LayersModel | null = null;
  private modelUrl: string | null = null;

  /**
   * Configure the ML service
   */
  configure(config: Partial<MLModelConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[MLService] 🔧 Configuration updated:', this.config);
    
    // Clear model cache if URL changed
    if (config.modelUrl && config.modelUrl !== this.modelUrl) {
      this.modelCache = null;
      this.modelUrl = null;
    }
  }
  
  /**
   * Load TensorFlow.js model (with caching)
   */
  private async loadModel(): Promise<tf.LayersModel> {
    if (!this.config.modelUrl) {
      throw new Error('TensorFlow.js model URL not configured');
    }
    
    // Return cached model if URL matches
    if (this.modelCache && this.modelUrl === this.config.modelUrl) {
      console.log('[MLService] ✅ Using cached TensorFlow.js model');
      return this.modelCache;
    }
    
    console.log(`[MLService] 📥 Loading TensorFlow.js model from ${this.config.modelUrl}...`);
    try {
      const model = await tf.loadLayersModel(this.config.modelUrl);
      this.modelCache = model;
      this.modelUrl = this.config.modelUrl;
      console.log('[MLService] ✅ TensorFlow.js model loaded successfully');
      return model;
    } catch (error) {
      console.error('[MLService] ❌ Error loading TensorFlow.js model:', error);
      throw new Error(`Failed to load TensorFlow.js model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Prepare input features for a driver in a race
   */
  private async prepareDriverFeatures(
    driver: Driver,
    race: Race,
    season: number,
    round: number
  ): Promise<number[]> {
    const team = getTeam(driver.teamId);
    const circuit = getCircuit(race.circuitId);
    const driverResults = await getDriverResults(season, driver.id);
    const circuitHistory = await getCircuitHistory(race.circuitId, 5);
    
    // Recent form (last 5 races) - normalized positions
    const recentForm = driver.last5Results.slice(-5);
    const recentFormFeatures = Array(5).fill(0).map((_, i) => {
      if (i < recentForm.length) {
        return (21 - recentForm[i]) / 20; // Normalize: P1 = 1.0, P20 = 0.05
      }
      return 0.5; // Default for missing data
    });
    
    // Driver stats (normalized)
    const driverStats = [
      driver.points / 500, // Normalize points (max ~500 in a season)
      driver.wins / 25, // Normalize wins
      driver.podiums / 25, // Normalize podiums
      driver.poles / 25, // Normalize poles
    ];
    
    // Team stats (normalized)
    const teamStats = team ? [
      team.totalPoints / 1000, // Team points
      team.wins / 25,
      team.podiums / 50,
    ] : [0, 0, 0];
    
    // Circuit features
    const circuitFeatures = circuit ? [
      circuit.laps / 100, // Normalize laps
      circuit.raceDistance / 400, // Normalize distance (max ~400km)
      circuit.trackType === 'street' ? 1 : 0, // One-hot: street = 1, permanent = 0
    ] : [0.5, 0.5, 0];
    
    // Track-specific history for this driver
    const driverTrackHistory = circuitHistory
      .filter(h => h.winner?.id === driver.id || h.pole?.id === driver.id)
      .length;
    const trackHistoryFeature = Math.min(1, driverTrackHistory / 5); // Normalize
    
    // Weather features
    const weatherFeatures = [
      race.weatherSummary.temperature / 50, // Normalize temp (0-50°C)
      race.weatherSummary.condition === 'dry' ? 1 : 0,
      race.weatherSummary.condition === 'wet' ? 1 : 0,
      race.weatherSummary.condition === 'mixed' ? 1 : 0,
      race.weatherSummary.chanceOfRain / 100, // Normalize rain chance
      race.weatherSummary.windSpeed / 50, // Normalize wind speed
    ];
    
    // Season progress
    const seasonProgress = round / 24; // Normalize (assuming 24 races max)
    
    // Average finish position this season
    const avgFinish = driverResults.length > 0
      ? driverResults.reduce((sum, r) => sum + r.finishPosition, 0) / driverResults.length
      : 10.5;
    const avgFinishFeature = (21 - avgFinish) / 20; // Normalize
    
    // Combine all features
    return [
      ...recentFormFeatures, // 5 features
      ...driverStats, // 4 features
      ...teamStats, // 3 features
      ...circuitFeatures, // 3 features
      trackHistoryFeature, // 1 feature
      ...weatherFeatures, // 6 features
      seasonProgress, // 1 feature
      avgFinishFeature, // 1 feature
    ]; // Total: 24 features
  }
  
  /**
   * Scale features to match training data scaling
   * In production, load the saved scaler. For now, do basic normalization.
   */
  private scaleFeatures(features: number[][]): number[][] {
    if (features.length === 0) return features;
    
    const numFeatures = features[0].length;
    const scaled: number[][] = [];
    
    // Calculate mean and std for each feature across all drivers
    for (let i = 0; i < numFeatures; i++) {
      const featureValues = features.map(f => f[i]);
      const mean = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;
      const variance = featureValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / featureValues.length;
      const std = Math.sqrt(variance) || 1; // Avoid division by zero
      
      // Standardize: (x - mean) / std
      for (let j = 0; j < features.length; j++) {
        if (!scaled[j]) scaled[j] = [];
        scaled[j][i] = (features[j][i] - mean) / std;
      }
    }
    
    return scaled;
  }
  
  /**
   * Transform model output matrix to DriverPrediction[]
   * Model output is [num_drivers][20] where each row is probability distribution over 20 positions (0-19)
   */
  private transformPredictionsFromMatrix(
    predictionMatrix: number[][],
    drivers: Driver[]
  ): DriverPrediction[] {
    const predictions: DriverPrediction[] = [];
    
    // predictionMatrix shape: [num_drivers][20]
    // Each row contains probabilities for positions 0-19 (representing actual positions 1-20)
    for (let i = 0; i < drivers.length && i < predictionMatrix.length; i++) {
      const driverProbs = predictionMatrix[i];
      
      // Find the position class (0-19) with highest probability
      const predictedClass = driverProbs.indexOf(Math.max(...driverProbs));
      const expectedPosition = predictedClass + 1; // Convert from 0-19 to 1-20
      const confidence = driverProbs[predictedClass];
      
      // Calculate probabilities
      const winProbability = driverProbs[0] || 0; // Probability of position 1 (class 0)
      const podiumProbability = (driverProbs[0] || 0) + (driverProbs[1] || 0) + (driverProbs[2] || 0); // Sum of P1, P2, P3
      
      predictions.push({
        driverId: drivers[i].id,
        expectedFinishPosition: expectedPosition,
        winProbability,
        podiumProbability,
        pointsProjection: this.calculatePoints(expectedPosition),
        confidenceScore: Math.min(1, Math.max(0, confidence)),
        reasoning: `ML model prediction: Expected position ${expectedPosition} (confidence: ${(confidence * 100).toFixed(1)}%)`,
      });
    }
    
    // Sort by expected position
    return predictions.sort((a, b) => a.expectedFinishPosition - b.expectedFinishPosition);
  }
  
  
  /**
   * Calculate points for a finish position
   */
  private calculatePoints(position: number): number {
    const pointsMap = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    return position <= 10 ? pointsMap[position - 1] : 0;
  }

  /**
   * Predict race results
   */
  async predictRace(
    season: number,
    round: number
  ): Promise<DriverPrediction[]> {
    console.log(`[MLService] 🔮 Predicting race ${season}-R${round} using ${this.config.modelType}...`);
    
    switch (this.config.modelType) {
      case 'tensorflow':
        return this.predictWithTensorFlow(season, round);
      case 'pytorch':
        return this.predictWithPyTorch(season, round);
      case 'cloud':
        return this.predictWithCloudML(season, round);
      case 'heuristic':
      default:
        return getRacePredictions(season, round);
    }
  }

  /**
   * Predict qualifying results
   */
  async predictQualifying(
    season: number,
    round: number
  ): Promise<QualifyingPrediction[]> {
    console.log(`[MLService] 🔮 Predicting qualifying ${season}-R${round} using ${this.config.modelType}...`);
    
    switch (this.config.modelType) {
      case 'tensorflow':
        return this.predictQualifyingWithTensorFlow(season, round);
      case 'pytorch':
        return this.predictQualifyingWithPyTorch(season, round);
      case 'cloud':
        return this.predictQualifyingWithCloudML(season, round);
      case 'heuristic':
      default:
        return getQualiPredictions(season, round);
    }
  }

  /**
   * Predict season outcomes
   */
  async predictSeason(
    season: number
  ): Promise<SeasonOutcomeProbabilities> {
    console.log(`[MLService] 🔮 Predicting season ${season} using ${this.config.modelType}...`);
    
    switch (this.config.modelType) {
      case 'tensorflow':
        return this.predictSeasonWithTensorFlow(season);
      case 'pytorch':
        return this.predictSeasonWithPyTorch(season);
      case 'cloud':
        return this.predictSeasonWithCloudML(season);
      case 'heuristic':
      default:
        return getSeasonOutcomeProbabilities(season);
    }
  }

  // TensorFlow.js implementations
  private async predictWithTensorFlow(
    season: number,
    round: number
  ): Promise<DriverPrediction[]> {
    try {
      // Load model
      const model = await this.loadModel();
      
      // Get race data
      const race = await getRace(season, round);
      if (!race) {
        throw new Error(`Race ${season}-R${round} not found`);
      }
      
      // Get all drivers
      const drivers = await getDriversFromAPI(season);
      if (drivers.length === 0) {
        throw new Error('No drivers found');
      }
      
      console.log(`[MLService] 🔮 Preparing features for ${drivers.length} drivers...`);
      
      // Prepare features for all drivers
      const featuresArray: number[][] = [];
      for (const driver of drivers) {
        const features = await this.prepareDriverFeatures(driver, race, season, round);
        featuresArray.push(features);
      }
      
      // Scale features (same as training)
      // Note: In production, you'd load the scaler from the saved file
      // For now, we'll do basic normalization
      const scaledFeatures = this.scaleFeatures(featuresArray);
      
      // Convert to TensorFlow tensor
      // Shape: [num_drivers, 24_features]
      const inputTensor = tf.tensor2d(scaledFeatures);
      console.log(`[MLService] 📊 Input tensor shape: ${inputTensor.shape}`);
      
      // Make prediction
      // Output shape: [num_drivers, 20] where each row is probability distribution over 20 positions (0-19)
      console.log('[MLService] 🧠 Running model inference...');
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const predictionMatrix = await prediction.array() as number[][];
      console.log(`[MLService] 📊 Output shape: [${predictionMatrix.length}, ${predictionMatrix[0]?.length || 0}]`);
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      // Transform predictions
      // predictionMatrix is [num_drivers][20] - each driver has 20 position probabilities
      const predictions = this.transformPredictionsFromMatrix(predictionMatrix, drivers);
      
      console.log(`[MLService] ✅ TensorFlow.js predictions generated for ${predictions.length} drivers`);
      return predictions;
    } catch (error) {
      console.error('[MLService] ❌ TensorFlow.js prediction error:', error);
      console.warn('[MLService] ⚠️ Falling back to heuristics');
      return getRacePredictions(season, round);
    }
  }

  private async predictQualifyingWithTensorFlow(
    season: number,
    round: number
  ): Promise<QualifyingPrediction[]> {
    try {
      // For qualifying, we can use the same model or a separate one
      // For now, use race predictions and adapt them
      const racePredictions = await this.predictWithTensorFlow(season, round);
      
      // Transform to qualifying predictions
      return racePredictions.map((pred) => ({
        ...pred,
        expectedGridPosition: pred.expectedFinishPosition,
        q3CutoffProbability: pred.expectedFinishPosition <= 10 ? 0.8 : 0.2,
        reasoning: `Qualifying prediction based on race model: Expected grid ${pred.expectedFinishPosition}`,
      })) as QualifyingPrediction[];
    } catch (error) {
      console.error('[MLService] ❌ TensorFlow.js qualifying prediction error:', error);
      console.warn('[MLService] ⚠️ Falling back to heuristics');
      return getQualiPredictions(season, round);
    }
  }

  private async predictSeasonWithTensorFlow(
    season: number
  ): Promise<SeasonOutcomeProbabilities> {
    try {
      // For season predictions, we can aggregate race predictions
      // or use a separate season model
      // For now, use current standings and project forward
      const standings = await getSeasonStandings(season);
      const races = await getRaces(season);
      const completedRaces = races.filter((r) => r.completed).length;
      const totalRaces = races.length;
      const remainingRaces = totalRaces - completedRaces;
      
      // Get predictions for remaining races and aggregate
      const remainingRacesList = races.filter((r) => !r.completed);
      const driverPoints: Record<string, number> = {};
      
      // Initialize with current points
      standings.drivers.forEach((s) => {
        driverPoints[s.driver.id] = s.points;
      });
      
      // Project points from remaining races
      for (const race of remainingRacesList.slice(0, 5)) { // Limit to next 5 for performance
        try {
          const racePreds = await this.predictWithTensorFlow(season, race.round);
          racePreds.forEach((pred) => {
            driverPoints[pred.driverId] = (driverPoints[pred.driverId] || 0) + pred.pointsProjection;
          });
        } catch (error) {
          console.warn(`[MLService] ⚠️ Could not predict race ${race.round}, skipping`);
        }
      }
      
      // Calculate probabilities based on projected points
      const sortedDrivers = Object.entries(driverPoints)
        .sort(([, a], [, b]) => b - a)
        .map(([driverId], index) => ({
          driverId,
          projectedPoints: driverPoints[driverId],
          position: index + 1,
        }));
      
      return {
        driverTitle: sortedDrivers.map((d, index) => ({
          driverId: d.driverId,
          titleProbability: index === 0 
            ? Math.min(0.95, 0.5 + (d.projectedPoints - sortedDrivers[1]?.projectedPoints || 0) / 100)
            : Math.max(0.01, 0.3 - index * 0.1),
          projectedFinalPoints: Math.round(d.projectedPoints),
          projectedFinalPosition: index + 1,
        })),
        constructorTitle: standings.teams.map((s, index) => ({
          teamId: s.team.id,
          titleProbability: index === 0 ? 0.6 : Math.max(0.01, 0.3 - index * 0.1),
          projectedFinalPoints: s.points + (s.points / completedRaces) * remainingRaces,
          projectedFinalPosition: index + 1,
        })),
      };
    } catch (error) {
      console.error('[MLService] ❌ TensorFlow.js season prediction error:', error);
      console.warn('[MLService] ⚠️ Falling back to heuristics');
      return getSeasonOutcomeProbabilities(season);
    }
  }

  // PyTorch/TensorFlow backend API implementations (placeholder)
  private async predictWithPyTorch(
    season: number,
    round: number
  ): Promise<DriverPrediction[]> {
    if (!this.config.endpoint) {
      throw new Error('PyTorch endpoint not configured');
    }

    try {
      const response = await fetch(`${this.config.endpoint}/predict/race`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ season, round }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.predictions;
    } catch (error) {
      console.error('[MLService] ❌ PyTorch API error:', error);
      console.warn('[MLService] ⚠️ Falling back to heuristics');
      return getRacePredictions(season, round);
    }
  }

  private async predictQualifyingWithPyTorch(
    season: number,
    round: number
  ): Promise<QualifyingPrediction[]> {
    if (!this.config.endpoint) {
      throw new Error('PyTorch endpoint not configured');
    }

    try {
      const response = await fetch(`${this.config.endpoint}/predict/qualifying`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ season, round }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.predictions;
    } catch (error) {
      console.error('[MLService] ❌ PyTorch API error:', error);
      console.warn('[MLService] ⚠️ Falling back to heuristics');
      return getQualiPredictions(season, round);
    }
  }

  private async predictSeasonWithPyTorch(
    season: number
  ): Promise<SeasonOutcomeProbabilities> {
    if (!this.config.endpoint) {
      throw new Error('PyTorch endpoint not configured');
    }

    try {
      const response = await fetch(`${this.config.endpoint}/predict/season`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ season }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[MLService] ❌ PyTorch API error:', error);
      console.warn('[MLService] ⚠️ Falling back to heuristics');
      return getSeasonOutcomeProbabilities(season);
    }
  }

  // Cloud ML service implementations (placeholder)
  private async predictWithCloudML(
    season: number,
    round: number
  ): Promise<DriverPrediction[]> {
    if (!this.config.endpoint) {
      throw new Error('Cloud ML endpoint not configured');
    }

    try {
      const response = await fetch(`${this.config.endpoint}/predict/race`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ season, round }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.predictions;
    } catch (error) {
      console.error('[MLService] ❌ Cloud ML API error:', error);
      console.warn('[MLService] ⚠️ Falling back to heuristics');
      return getRacePredictions(season, round);
    }
  }

  private async predictQualifyingWithCloudML(
    season: number,
    round: number
  ): Promise<QualifyingPrediction[]> {
    if (!this.config.endpoint) {
      throw new Error('Cloud ML endpoint not configured');
    }

    try {
      const response = await fetch(`${this.config.endpoint}/predict/qualifying`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ season, round }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.predictions;
    } catch (error) {
      console.error('[MLService] ❌ Cloud ML API error:', error);
      console.warn('[MLService] ⚠️ Falling back to heuristics');
      return getQualiPredictions(season, round);
    }
  }

  private async predictSeasonWithCloudML(
    season: number
  ): Promise<SeasonOutcomeProbabilities> {
    if (!this.config.endpoint) {
      throw new Error('Cloud ML endpoint not configured');
    }

    try {
      const response = await fetch(`${this.config.endpoint}/predict/season`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ season }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[MLService] ❌ Cloud ML API error:', error);
      console.warn('[MLService] ⚠️ Falling back to heuristics');
      return getSeasonOutcomeProbabilities(season);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MLModelConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const mlPredictionService = new MLPredictionService();

