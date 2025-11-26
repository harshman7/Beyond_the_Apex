# TensorFlow.js Model Training Guide

## Overview

This guide explains how to train a TensorFlow.js model for F1 race predictions that works with the ML Prediction Service.

## Model Architecture

The model expects:
- **Input**: 24 features per driver (see feature list below)
- **Output**: Position predictions (1-20) or position probabilities

### Input Features (24 features per driver)

1. **Recent Form (5 features)**: Last 5 race positions (normalized)
2. **Driver Stats (4 features)**: Points, wins, podiums, poles (normalized)
3. **Team Stats (3 features)**: Team points, wins, podiums (normalized)
4. **Circuit Features (3 features)**: Laps, distance, track type (normalized)
5. **Track History (1 feature)**: Driver's historical performance at this track
6. **Weather (6 features)**: Temperature, condition (dry/wet/mixed), rain chance, wind
7. **Season Progress (1 feature)**: Current round / total rounds
8. **Average Finish (1 feature)**: Driver's average finish position this season

### Output Format

The model can output in two formats:

**Option 1: Position Scores (20 values)**
- One value per driver representing their predicted position score
- Higher score = better predicted position
- Service will rank drivers by score

**Option 2: Position Probabilities (400 values = 20 drivers × 20 positions)**
- Probability distribution for each driver's finish position
- More complex but potentially more accurate

## Training Data Preparation

### 1. Collect Historical Data

You'll need historical race data:
- Driver results (positions, points, wins, podiums)
- Team performance
- Circuit information
- Weather data
- Race dates and rounds

### 2. Feature Engineering

```python
import pandas as pd
import numpy as np

def prepare_features(driver_id, race_id, historical_data):
    """Prepare 24 features for a driver-race combination"""
    features = []
    
    # Recent form (last 5 races)
    recent_races = get_recent_races(driver_id, race_id, 5)
    recent_positions = [r['position'] for r in recent_races]
    # Normalize: P1 = 1.0, P20 = 0.05
    for pos in recent_positions[:5]:
        features.append((21 - pos) / 20 if pos else 0.5)
    # Pad if less than 5 races
    while len(features) < 5:
        features.append(0.5)
    
    # Driver stats (normalized)
    driver = get_driver(driver_id)
    features.append(driver['points'] / 500)
    features.append(driver['wins'] / 25)
    features.append(driver['podiums'] / 25)
    features.append(driver['poles'] / 25)
    
    # Team stats
    team = get_team(driver['team_id'])
    features.append(team['points'] / 1000)
    features.append(team['wins'] / 25)
    features.append(team['podiums'] / 50)
    
    # Circuit features
    circuit = get_circuit(race['circuit_id'])
    features.append(circuit['laps'] / 100)
    features.append(circuit['distance'] / 400)
    features.append(1 if circuit['type'] == 'street' else 0)
    
    # Track history
    track_history = get_track_history(driver_id, circuit['id'])
    features.append(min(1, track_history / 5))
    
    # Weather
    weather = race['weather']
    features.append(weather['temperature'] / 50)
    features.append(1 if weather['condition'] == 'dry' else 0)
    features.append(1 if weather['condition'] == 'wet' else 0)
    features.append(1 if weather['condition'] == 'mixed' else 0)
    features.append(weather['rain_chance'] / 100)
    features.append(weather['wind_speed'] / 50)
    
    # Season progress
    features.append(race['round'] / 24)
    
    # Average finish
    avg_finish = get_avg_finish(driver_id, race['season'])
    features.append((21 - avg_finish) / 20)
    
    return features
```

### 3. Create Training Dataset

```python
# Load historical data
races = load_historical_races(2020, 2024)
drivers = load_drivers()

X_train = []  # Features
y_train = []  # Target (finish position)

for race in races:
    for driver in drivers:
        features = prepare_features(driver['id'], race['id'], historical_data)
        X_train.append(features)
        
        # Get actual finish position
        result = get_race_result(race['id'], driver['id'])
        y_train.append(result['position'])

X_train = np.array(X_train)
y_train = np.array(y_train)
```

## Model Training

### Option 1: Simple Neural Network

```python
import tensorflow as tf
from tensorflow import keras

# Create model
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(24,)),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(20, activation='softmax')  # 20 positions
])

# Compile
model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Train
model.fit(
    X_train, y_train,
    epochs=100,
    batch_size=32,
    validation_split=0.2,
    verbose=1
)

# Save for TensorFlow.js
tfjs.converters.save_keras_model(model, './public/models/f1-predictor')
```

### Option 2: Regression Model (Position Scores)

```python
model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(24,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(1, activation='sigmoid')  # Position score (0-1)
])

model.compile(
    optimizer='adam',
    loss='mse',
    metrics=['mae']
)

# Normalize target to 0-1 range
y_train_normalized = (21 - y_train) / 20

model.fit(X_train, y_train_normalized, epochs=100, batch_size=32)
```

### Option 3: Advanced Model (LSTM for Sequential Data)

```python
# Reshape for LSTM (sequence of races)
X_train_seq = X_train.reshape(-1, 5, 24)  # 5 races, 24 features each

model = keras.Sequential([
    keras.layers.LSTM(64, return_sequences=True, input_shape=(5, 24)),
    keras.layers.LSTM(32),
    keras.layers.Dense(20, activation='softmax')
])
```

## Export to TensorFlow.js

### Install TensorFlow.js Converter

```bash
pip install tensorflowjs
```

### Convert Model

```python
import tensorflowjs as tfjs

# Convert Keras model
tfjs.converters.save_keras_model(model, './public/models/f1-predictor')

# This creates:
# - model.json (model architecture)
# - weights.bin (or weights shards)
```

### Model Structure

```
public/
  models/
    f1-predictor/
      model.json
      weights.bin (or weights.1.bin, weights.2.bin, etc.)
```

## Integration with the App

### 1. Place Model Files

Place your trained model in the `public/models/` directory:

```
public/
  models/
    f1-predictor/
      model.json
      weights.bin
```

### 2. Configure in Settings

1. Go to Settings page
2. Select "TensorFlow.js" as Model Type
3. Enter model URL: `/models/f1-predictor/model.json`
4. Save configuration

### 3. Test the Model

```typescript
import { mlPredictionService } from '@/lib/predictions/mlService';

// Configure
mlPredictionService.configure({
  modelType: 'tensorflow',
  modelUrl: '/models/f1-predictor/model.json'
});

// Test prediction
const predictions = await mlPredictionService.predictRace(2024, 5);
console.log('ML Predictions:', predictions);
```

## Model Optimization Tips

### 1. Feature Selection
- Remove features with low correlation to target
- Add interaction features (e.g., driver × track type)
- Consider time-based features (days since last race)

### 2. Data Augmentation
- Use multiple seasons of data
- Balance classes (positions 1-20)
- Handle missing data (imputation or separate model)

### 3. Hyperparameter Tuning
- Learning rate: 0.001 - 0.01
- Batch size: 16, 32, 64
- Dropout: 0.2 - 0.5
- Hidden layers: 2-4 layers, 32-128 neurons each

### 4. Model Evaluation
- Use cross-validation
- Track accuracy per position (P1 accuracy, P2 accuracy, etc.)
- Monitor overfitting (train vs validation loss)

## Example Training Script

```python
#!/usr/bin/env python3
"""
Train TensorFlow.js model for F1 predictions
"""

import tensorflow as tf
import tensorflowjs as tfjs
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Load and prepare data
def load_data():
    # Your data loading logic here
    X, y = prepare_training_data()
    return X, y

# Create model
def create_model(input_dim=24):
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(128, activation='relu', input_shape=(input_dim,)),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(0.2),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(20, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

# Main training
if __name__ == '__main__':
    print("Loading data...")
    X, y = load_data()
    
    print(f"Training set: {X.shape[0]} samples, {X.shape[1]} features")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Create and train model
    print("Creating model...")
    model = create_model(X.shape[1])
    
    print("Training model...")
    history = model.fit(
        X_train, y_train,
        epochs=100,
        batch_size=32,
        validation_data=(X_test, y_test),
        verbose=1
    )
    
    # Evaluate
    test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest accuracy: {test_acc:.4f}")
    
    # Export to TensorFlow.js
    print("Exporting to TensorFlow.js...")
    tfjs.converters.save_keras_model(
        model,
        './public/models/f1-predictor'
    )
    
    print("✅ Model exported successfully!")
    print("Place model files in public/models/f1-predictor/")
```

## Troubleshooting

### Model Not Loading
- Check model.json path is correct
- Verify weights files are in same directory
- Check browser console for CORS errors
- Ensure model format is TensorFlow.js compatible

### Poor Predictions
- Check feature normalization matches training
- Verify input features are in correct order
- Test with known data to verify model works
- Consider retraining with more data

### Performance Issues
- Use model quantization (reduce model size)
- Consider using smaller model architecture
- Cache model predictions
- Use Web Workers for inference

## Next Steps

1. **Collect Data**: Gather historical F1 data (2020-2024)
2. **Train Model**: Use the training script above
3. **Export Model**: Convert to TensorFlow.js format
4. **Deploy**: Place model in `public/models/`
5. **Test**: Configure in Settings and test predictions
6. **Iterate**: Improve model based on prediction accuracy

For questions, see:
- `src/lib/predictions/mlService.ts` - Service implementation
- `ML_INTEGRATION_GUIDE.md` - General ML integration guide
- TensorFlow.js docs: https://www.tensorflow.org/js

