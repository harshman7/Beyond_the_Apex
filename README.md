# F1 Insights - Advanced Analytics Dashboard

A highly advanced Formula 1 analytics dashboard web application with predictions and detailed past results analysis.

## Features

- **Overview Dashboard**: Next race countdown, predicted podium, season points progression, team performance, and recent races
- **Race Weekend View**: Detailed analysis with circuit info, weather, qualifying results, race analysis, and predictions
- **Drivers Page**: Comprehensive driver statistics, performance charts, and individual driver detail views
- **Constructors Page**: Team standings, driver contributions, and championship outlook
- **Historical Analytics**: Deep dive into past results with customizable metrics and time ranges
- **Predictions**: Season title odds, race predictions, and "what-if" scenario modeling
- **Settings**: Theme customization, ML model configuration, and data management
- **Data Export**: Export data to CSV or JSON format
- **Data Refresh**: Manual cache clearing and data refresh
- **Error Handling**: Global error boundary with graceful error recovery
- **Real-Time Telemetry**: WebSocket client for live race weekend data (ready for integration)

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
│   └── ui/              # Base UI components (Button, Input, Select, StatCard, ErrorBoundary, etc.)
├── hooks/               # Custom React hooks
│   ├── useTheme.ts      # Theme management hook
│   └── useTelemetry.ts  # Real-time telemetry hook
├── lib/                 # Core business logic
│   ├── api/             # API clients and data service
│   │   ├── openF1Client.ts      # OpenF1 API client
│   │   ├── openF1Transformers.ts # OpenF1 data transformers
│   │   ├── rateLimiter.ts       # Rate limiting utility
│   │   └── f1DataService.ts     # Main data service with caching
│   ├── data/            # Data layer
│   │   ├── mockData.ts  # Mock F1 data (for reference)
│   │   ├── dataUtils.ts # Data query utilities
│   │   └── telemetry.ts # WebSocket telemetry client
│   ├── predictions/     # Prediction engine
│   │   ├── predictionEngine.ts  # Heuristic-based prediction algorithms
│   │   └── mlService.ts         # ML prediction service interface
│   └── utils/           # Utility functions
│       ├── export.ts    # Data export (CSV/JSON)
│       ├── refresh.ts   # Data refresh utilities
│       ├── retry.ts     # Retry logic with backoff
│       ├── analytics.ts # Advanced analytics calculations
│       └── performance.ts # Performance optimization utilities
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

### ✅ Current Implementation (OpenF1 API)

The application uses **OpenF1 API** exclusively for real-time F1 data:

- ✅ **OpenF1 API** (https://api.openf1.org) - Modern, free, no CORS issues
- ✅ **Rate limiting** - Automatic throttling (400ms minimum interval) with exponential backoff retry logic
- ✅ **Response caching** (5 minutes) for improved performance
- ✅ **Loading states** and comprehensive error handling
- ✅ **Custom React hooks** for data fetching
- ✅ **Detailed logging** for debugging and monitoring
- ✅ **Data refresh utilities** - Manual cache clearing and refresh
- ✅ **Data export** - CSV and JSON export functionality

**Why OpenF1 instead of FastF1?**
- FastF1 is a Python library, not a REST API
- OpenF1 provides similar data as a REST API (no backend needed)
- See `FASTF1_BACKEND.md` if you want to use FastF1 via a Python backend

**Files:**
- `src/lib/api/openF1Client.ts` - OpenF1 API client
- `src/lib/api/openF1Transformers.ts` - Transform OpenF1 responses
- `src/lib/api/rateLimiter.ts` - Rate limiting and retry logic
- `src/lib/api/f1DataService.ts` - Main data service with caching
- `src/lib/utils/refresh.ts` - Data refresh utilities
- `src/lib/utils/export.ts` - Data export utilities (CSV/JSON)

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

### ✅ Current Implementation (Heuristic-Based)

The prediction engine in `src/lib/predictions/predictionEngine.ts` uses weighted heuristics:

- **Recent Form** (last 5 races): 35%
- **Team Performance**: 30%
- **Track-Specific History**: 25%
- **Qualifying vs Race Pace Delta**: 10%

### ✅ ML Prediction Service Interface

A production-ready ML service abstraction is implemented in `src/lib/predictions/mlService.ts`:

- ✅ **Service interface** - Clean abstraction for different ML backends
- ✅ **Heuristic fallback** - Currently uses heuristic engine
- ✅ **Configuration** - Configurable via Settings page
- ✅ **Multiple backend support** - Ready for TensorFlow.js, PyTorch/TensorFlow API, or Cloud ML

**Usage:**
```typescript
import { mlPredictionService } from '@/lib/predictions/mlService';

// Configure (or use Settings page)
mlPredictionService.configure({ modelType: 'heuristic' });

// Get predictions
const predictions = await mlPredictionService.predictRace(2024, 5);
```

### 🔮 Future: Integrating ML Models

#### Option 1: TensorFlow.js (In-Browser)

Run predictions directly in the browser:

```typescript
import * as tf from '@tensorflow/tfjs';

// Load pre-trained model
const model = await tf.loadLayersModel('/models/f1-predictor.json');

// Make predictions
const prediction = model.predict(inputTensor);
```

**Integration Steps:**
1. Install `@tensorflow/tfjs`: `npm install @tensorflow/tfjs`
2. Train and export your model
3. Update `predictWithTensorFlow` in `mlService.ts`
4. Configure model URL in Settings page

#### Option 2: PyTorch/TensorFlow Backend

Serve ML models via API:

1. Train model using PyTorch/TensorFlow
2. Deploy model as REST API (Flask/FastAPI)
3. Configure endpoint and API key in Settings page
4. Service automatically handles API calls

#### Option 3: Cloud ML Services

Use managed ML services:

- **AWS SageMaker**
- **Google Cloud ML**
- **Azure Machine Learning**

**Current Status:**
- ✅ Heuristic-based predictions implemented and working
- ✅ ML service interface ready for integration
- ✅ Configuration UI in Settings page
- 🔮 Future: Implement actual ML model loading/inference

## Real-Time Telemetry

### ✅ WebSocket Client Implementation

A production-ready WebSocket telemetry client is implemented:

**Files:**
- `src/lib/data/telemetry.ts` - WebSocket client with reconnection logic
- `src/hooks/useTelemetry.ts` - React hook for telemetry data

**Features:**
- ✅ Automatic reconnection with exponential backoff
- ✅ Event-based message handling (position, lap, sector, flag, safety_car, weather)
- ✅ Type-safe message interfaces
- ✅ Connection state management
- ✅ React hook for easy component integration

**Usage:**

```typescript
// Using the React hook (recommended)
import { useTelemetry } from '@/hooks/useTelemetry';

const { isConnected, data, connect, disconnect } = useTelemetry('wss://api.example.com/telemetry');

// Or using the client directly
import { createTelemetryClient } from '@/lib/data/telemetry';

const client = createTelemetryClient('wss://your-telemetry-service.com');
client.on('position', (data) => {
  console.log('Position update:', data);
});
client.connect();
```

**Data Sources:**
- FastF1 WebSocket: Use FastF1's live timing data
- F1 Official API: Requires API access
- Custom WebSocket Service: Build your own real-time data service

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

## Enhancements & Utilities

### ✅ Implemented Features

- **Data Export**: Export standings, results, and analytics to CSV or JSON
  - `src/lib/utils/export.ts` - Export utilities
  - Available on Drivers, Constructors, Historical, and Race Weekend pages

- **Data Refresh**: Manual cache clearing and data refresh
  - `src/lib/utils/refresh.ts` - Refresh utilities
  - Available in Settings page

- **Error Handling**: Global error boundary for graceful error recovery
  - `src/components/ui/ErrorBoundary.tsx` - Error boundary component
  - Integrated in `App.tsx` for app-wide error catching

- **Advanced Analytics**: Additional statistical calculations
  - `src/lib/utils/analytics.ts` - Analytics utilities
  - Includes consistency, reliability, momentum, and performance breakdowns

- **Performance Utilities**: Optimization helpers
  - `src/lib/utils/performance.ts` - Debounce, throttle, batch requests
  - `src/lib/utils/retry.ts` - Retry logic with exponential backoff

- **ML Prediction Service**: Production-ready ML service interface
  - `src/lib/predictions/mlService.ts` - ML service abstraction
  - Configurable via Settings page
  - Ready for TensorFlow.js, PyTorch/TensorFlow API, or Cloud ML integration

- **Real-Time Telemetry**: WebSocket client for live data
  - `src/lib/data/telemetry.ts` - WebSocket client
  - `src/hooks/useTelemetry.ts` - React hook for telemetry
  - Automatic reconnection with exponential backoff

## Performance Considerations

- **Code splitting**: Routes are automatically code-split by Vite
- **Memoization**: Use `useMemo` and `useCallback` for expensive computations
- **Lazy loading**: Consider lazy loading heavy components
- **Data caching**: Implement caching for API responses (5-minute cache)
- **Rate limiting**: Automatic rate limiting for API requests (400ms minimum interval)
- **Batch requests**: Utility for batching API requests

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

**Note**: This application uses OpenF1 API for real-time F1 data. ML model integration for predictions is a future enhancement as described above.
