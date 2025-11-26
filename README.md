# F1 Insights - Advanced Analytics Dashboard

A highly advanced Formula 1 analytics dashboard web application with predictions and detailed past results analysis.

## Features

- **Overview Dashboard**: Next race countdown, predicted podium, season points progression, team performance, and recent races
- **Race Weekend View**: Detailed analysis with circuit info, weather, qualifying results, race analysis, and predictions
- **Drivers Page**: Comprehensive driver statistics, performance charts, and individual driver detail views
- **Constructors Page**: Team standings, driver contributions, and championship outlook
- **Historical Analytics**: Deep dive into past results with customizable metrics and time ranges
- **Predictions**: Season title odds, race predictions, and "what-if" scenario modeling
- **Settings**: Theme customization and integration documentation

## Tech Stack

- **React 18** + **TypeScript** - Modern UI framework with type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - React charting library
- **React Router** - Client-side routing
- **date-fns** - Date utility library
- **Lucide React** - Icon library

## Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build**:
   ```bash
   npm run preview
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/          # Layout components (Sidebar, TopBar, MainLayout)
│   └── ui/              # Base UI components (Button, Input, Select, StatCard, etc.)
├── hooks/               # Custom React hooks
│   └── useTheme.ts      # Theme management hook
├── lib/                 # Core business logic
│   ├── data/            # Data layer
│   │   ├── mockData.ts  # Mock F1 data (drivers, teams, circuits, races, results)
│   │   └── dataUtils.ts # Data query utilities
│   └── predictions/     # Prediction engine
│       └── predictionEngine.ts  # Heuristic-based prediction algorithms
├── pages/               # Page components
│   ├── Overview.tsx
│   ├── RaceWeekend.tsx
│   ├── Drivers.tsx
│   ├── Constructors.tsx
│   ├── Historical.tsx
│   ├── Predictions.tsx
│   └── Settings.tsx
├── types/                # TypeScript type definitions
│   └── index.ts         # Domain models (Driver, Team, Race, Circuit, etc.)
├── App.tsx              # Main app component with routing
├── main.tsx             # Application entry point
└── index.css            # Global styles and Tailwind configuration
```

## Data Layer

### ✅ Current Implementation (OpenF1 API + Ergast Fallback + Mock)

The application now uses the **OpenF1 API** (modern, recommended) with fallback to Ergast API, then mock data:

- ✅ **OpenF1 API** (https://api.openf1.org) - Modern, free, no CORS issues
- ✅ **Ergast API fallback** (http://ergast.com/api/f1/) - Deprecated end of 2024, used as fallback
- ✅ **Automatic fallback chain**: OpenF1 → Ergast → Mock data
- ✅ **Response caching** (5 minutes)
- ✅ **Loading states** and error handling
- ✅ **Custom React hooks** for data fetching

**Why OpenF1 instead of FastF1?**
- FastF1 is a Python library, not a REST API
- OpenF1 provides similar data as a REST API (no backend needed)
- See `FASTF1_BACKEND.md` if you want to use FastF1 via a Python backend

**Files:**
- `src/lib/api/openF1Client.ts` - OpenF1 API client (primary)
- `src/lib/api/openF1Transformers.ts` - Transform OpenF1 responses
- `src/lib/api/ergastClient.ts` - Ergast API client (fallback)
- `src/lib/api/dataTransformers.ts` - Transform Ergast responses
- `src/lib/api/f1DataService.ts` - Main data service with caching
- `src/hooks/useF1Data.ts` - React hooks for data fetching

**Configuration:**
- Enable/disable API: `src/lib/api/f1DataService.ts` → `USE_API`
- Use OpenF1: `src/lib/api/f1DataService.ts` → `USE_OPENF1`
- Ergast fallback: `src/lib/api/f1DataService.ts` → `USE_ERGAST_FALLBACK`
- Cache duration: `src/lib/api/f1DataService.ts` → `CACHE_DURATION`

### Alternative APIs

#### Option 1: OpenF1 API
- URL: https://api.openf1.org
- Real-time data (paid for live)
- Update `ergastClient.ts` to use OpenF1 endpoints

#### Option 2: FastF1 (Python Backend)
[FastF1](https://github.com/theOehrly/Fast-F1) provides live timing and telemetry data.

**Integration Steps:**
1. Create a Python backend service that uses FastF1
2. Expose REST API endpoints
3. Update `ergastClient.ts` to use your backend
4. Add authentication if needed

#### Option 3: Custom Microservice
Build your own data aggregation service that combines multiple sources.

**See `API_INTEGRATION.md` for detailed integration guide.**

## Prediction Engine

### Current Implementation (Heuristic-Based)

The prediction engine in `src/lib/predictions/predictionEngine.ts` uses weighted heuristics:

- **Recent Form** (last 5 races): 35%
- **Team Performance**: 30%
- **Track-Specific History**: 25%
- **Qualifying vs Race Pace Delta**: 10%

### Integrating ML Models

#### Option 1: TensorFlow.js (In-Browser)

Run predictions directly in the browser:

```typescript
import * as tf from '@tensorflow/tfjs';

// Load pre-trained model
const model = await tf.loadLayersModel('/models/f1-predictor.json');

// Make predictions
const prediction = model.predict(inputTensor);
```

**TODO:** Replace heuristic functions in `predictionEngine.ts` with model inference

#### Option 2: PyTorch/TensorFlow Backend

Serve ML models via API:

1. Train model using PyTorch/TensorFlow
2. Deploy model as REST API (Flask/FastAPI)
3. Create API client in `src/lib/predictions/mlApi.ts`
4. Replace heuristic calls with API requests

#### Option 3: Cloud ML Services

Use managed ML services:

- **AWS SageMaker**
- **Google Cloud ML**
- **Azure Machine Learning**

**TODO Locations:**
- `src/lib/predictions/predictionEngine.ts` - Replace heuristics with ML model calls
- Add model training scripts in separate repository

## Real-Time Telemetry

For live race weekend data:

1. **FastF1 WebSocket**: Use FastF1's live timing data
2. **F1 Official API**: Requires API access
3. **Custom WebSocket Service**: Build your own real-time data service

**Implementation:**

```typescript
// src/lib/data/telemetry.ts
const ws = new WebSocket('wss://your-telemetry-service.com');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update application state
};
```

**TODO:** Implement WebSocket client in `src/lib/data/telemetry.ts`

## Styling

The application uses Tailwind CSS with a custom design system:

- **Dark theme by default** with light theme support
- **Team colors** used throughout for visual consistency
- **Responsive design** for mobile, tablet, and desktop
- **Consistent spacing** and typography

### Customization

Edit `tailwind.config.js` to customize:
- Colors
- Spacing
- Typography
- Border radius

Edit `src/index.css` for:
- CSS variables (theme colors)
- Global styles

## Development

### TypeScript

The project uses strict TypeScript. All types are defined in `src/types/index.ts`.

### Code Organization

- **Components**: Reusable UI components in `components/`
- **Pages**: Full page views in `pages/`
- **Hooks**: Custom React hooks in `hooks/`
- **Lib**: Business logic and utilities in `lib/`

### Adding New Features

1. Define types in `src/types/index.ts`
2. Add data utilities in `src/lib/data/`
3. Create components in `src/components/`
4. Build pages in `src/pages/`
5. Add routes in `src/App.tsx`

## Performance Considerations

- **Code splitting**: Routes are automatically code-split by Vite
- **Memoization**: Use `useMemo` and `useCallback` for expensive computations
- **Lazy loading**: Consider lazy loading heavy components
- **Data caching**: Implement caching for API responses

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- Formula 1 data structure inspired by Ergast API
- Team colors based on 2024 F1 livery
- Prediction methodology inspired by F1 analytics community

---

**Note**: This is a demonstration application using mock data. For production use, integrate real F1 data sources and ML models as described above.
