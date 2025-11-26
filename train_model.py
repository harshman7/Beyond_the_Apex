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
import os
import pickle

# Import real data loader
from load_real_data import load_f1_data

def load_training_data(years=[2021, 2022, 2023, 2024], use_cache=True):
    """Load real F1 data from OpenF1 API"""
    print("\n[Loading] Fetching real F1 data from OpenF1 API...")
    if use_cache:
        print("         Using cache if available (set use_cache=False to force fresh data)...")
    else:
        print("         Fetching fresh data (this may take several minutes due to API rate limiting)...")
    X, y = load_f1_data(years=years, use_cache=use_cache)
    return X, y

def create_model(input_dim=24):
    """Create improved neural network model"""
    model = tf.keras.Sequential([
        # Input layer with batch normalization
        tf.keras.layers.Dense(256, activation='relu', input_shape=(input_dim,)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.4),
        
        # Hidden layers
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.3),
        
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.2),
        
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dropout(0.1),
        
        # Output layer
        tf.keras.layers.Dense(20, activation='softmax')  # 20 positions (0-19, representing positions 1-20)
    ])
    
    # Use Adam optimizer with learning rate
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
    
    model.compile(
        optimizer=optimizer,
        loss='sparse_categorical_crossentropy',  # Expects labels 0-19
        metrics=['accuracy', 'sparse_top_k_categorical_accuracy']  # Also track top-3 accuracy
    )
    
    return model

def main():
    print("=" * 50)
    print("F1 Prediction Model Training")
    print("=" * 50)
    
    # Load data
    print("\n[1/5] Loading data...")
    # Load real F1 data from OpenF1 API
    # Adjust years list to include more historical data for better training
    # Set use_cache=False to force fresh data fetch
    X, y = load_training_data(years=[2021, 2022, 2023, 2024], use_cache=True)
    print(f"   ✓ Loaded {X.shape[0]} samples with {X.shape[1]} features")
    
    # Convert positions from 1-20 to 0-19 for TensorFlow (0-indexed)
    print("\n   🔄 Converting positions to 0-indexed (1-20 → 0-19)...")
    y = y - 1  # Subtract 1 to convert from 1-20 to 0-19
    print(f"   ✓ Position range: min={y.min()}, max={y.max()}")
    
    # Scale features for better training
    print("\n[2/6] Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    print(f"   ✓ Features scaled (mean=0, std=1)")
    
    # Save scaler for later use (if needed)
    import pickle
    scaler_path = './public/models/f1-predictor/scaler.pkl'
    os.makedirs(os.path.dirname(scaler_path), exist_ok=True)
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"   ✓ Scaler saved to {scaler_path}")
    
    # Split data
    print("\n[3/6] Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=None
    )
    print(f"   ✓ Training: {X_train.shape[0]} samples")
    print(f"   ✓ Testing: {X_test.shape[0]} samples")
    
    # Create model with improved architecture
    print("\n[4/6] Creating model...")
    model = create_model(X.shape[1])
    model.summary()
    
    # Add callbacks for better training
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
    
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True,
        verbose=1
    )
    
    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=1e-6,
        verbose=1
    )
    
    # Train model
    print("\n[5/6] Training model...")
    print("   This may take a few minutes...")
    print("   Using early stopping and learning rate reduction...")
    history = model.fit(
        X_train, y_train,
        epochs=200,  # Increased epochs, early stopping will stop early if needed
        batch_size=32,
        validation_data=(X_test, y_test),
        callbacks=[early_stopping, reduce_lr],
        verbose=1
    )
    
    # Evaluate
    print("\n[6/6] Evaluating model...")
    test_results = model.evaluate(X_test, y_test, verbose=0)
    test_loss = test_results[0]
    test_acc = test_results[1]
    test_top3_acc = test_results[2] if len(test_results) > 2 else None
    
    print(f"   ✓ Test accuracy: {test_acc:.4f} ({test_acc*100:.2f}%)")
    print(f"   ✓ Test loss: {test_loss:.4f}")
    if test_top3_acc:
        print(f"   ✓ Top-3 accuracy: {test_top3_acc:.4f} ({test_top3_acc*100:.2f}%)")
    
    # Calculate position error (mean absolute error in positions)
    y_pred = model.predict(X_test, verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    position_errors = np.abs(y_pred_classes - y_test)
    mean_position_error = np.mean(position_errors)
    print(f"   ✓ Mean position error: {mean_position_error:.2f} positions")
    
    # Show some predictions for verification
    print("\n   📊 Sample predictions (first 5 test samples):")
    sample_predictions = model.predict(X_test[:5], verbose=0)
    for i in range(5):
        predicted_class = np.argmax(sample_predictions[i])
        actual_class = y_test[i]
        predicted_position = predicted_class + 1  # Convert back to 1-20
        actual_position = actual_class + 1  # Convert back to 1-20
        confidence = sample_predictions[i][predicted_class]
        print(f"      Sample {i+1}: Predicted P{predicted_position} (confidence: {confidence:.2f}), Actual P{actual_position}")
    
    # Export to TensorFlow.js
    print("\n[6/6] Exporting to TensorFlow.js...")
    output_path = './public/models/f1-predictor'
    os.makedirs(output_path, exist_ok=True)
    tfjs.converters.save_keras_model(model, output_path)
    print(f"   ✓ Model exported to: {output_path}")
    print(f"   ✓ Files created:")
    print(f"     - {output_path}/model.json")
    print(f"     - {output_path}/weights.bin (or shards)")
    
    print("\n" + "=" * 50)
    print("✅ Training complete!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Model is ready in: public/models/f1-predictor/")
    print("2. Start your app: npm run dev")
    print("3. Go to Settings → ML Model Configuration")
    print("4. Select 'TensorFlow.js' and enter: /models/f1-predictor/model.json")

if __name__ == '__main__':
    main()

