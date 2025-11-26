# Quick Start: Train Your F1 Prediction Model

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Setup (One-Time)

```bash
# 1. Create virtual environment
python3 -m venv f1-ml-env

# 2. Activate virtual environment
# On macOS/Linux:
source f1-ml-env/bin/activate
# On Windows:
# f1-ml-env\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt
```

## Train Model

```bash
# Make sure virtual environment is activated
python train_model.py
```

The script will:
1. **Fetch real F1 data** from OpenF1 API (2021-2024 seasons)
   - First run: Takes 10-30 minutes (API rate limiting)
   - Subsequent runs: Uses cached data (instant)
2. Extract 24 features per driver-race combination
3. Train a neural network model
4. Export to TensorFlow.js format
5. Save model to `public/models/f1-predictor/`

**Note**: The first run fetches data from OpenF1 API which can take time. Data is automatically cached for future runs.

## Use Model in App

1. Start the app: `npm run dev`
2. Go to Settings → ML Model Configuration
3. Select "TensorFlow.js"
4. Enter model URL: `/models/f1-predictor/model.json`
5. Save and test predictions!

## Using Real Data

The training script now uses **real F1 data from OpenF1 API** by default!

The `load_real_data.py` script:
- Fetches historical race data from OpenF1 API (2021-2024)
- Extracts 24 features per driver-race combination
- Prepares training data automatically

To adjust which years to use, edit `train_model.py`:
```python
X, y = load_training_data(years=[2021, 2022, 2023, 2024])  # Change years here
```

**Note**: Loading real data takes time due to API rate limiting (about 0.5s per request). For faster training, you can:
- Use fewer years initially
- Cache the data (save to CSV/JSON after first load)
- Use a subset of races

See `TENSORFLOW_MODEL_GUIDE.md` for detailed feature engineering instructions.

