# API Integration Guide

## Current Implementation

The application now uses the **OpenF1 API** (https://api.openf1.org) exclusively for real F1 data. No mock data fallbacks are used.

## Features

- ✅ Real-time F1 data from Ergast API
- ✅ Real-time data from OpenF1 API (no mock data)
- ✅ Response caching (5 minutes)
- ✅ Loading states and error handling
- ✅ Custom React hooks for data fetching

## CORS Issues

**Important**: The Ergast API uses HTTP (not HTTPS) which may cause CORS issues in browsers. If you encounter CORS errors:

### Option 1: Use a CORS Proxy (Development)

Update `src/lib/api/ergastClient.ts`:

```typescript
const ERGAST_BASE_URL = 'https://cors-anywhere.herokuapp.com/http://ergast.com/api/f1';
```

Or use a custom proxy server.

### Option 2: Use HTTPS Version (If Available)

Some CORS proxies provide HTTPS access to Ergast:
- `https://ergast.com/api/f1/` (if available)
- Or use a service like `https://api.allorigins.win/raw?url=`

### Option 3: Backend Proxy (Production)

Create a backend service that proxies requests to Ergast API:

```javascript
// Example Express.js proxy
app.get('/api/f1/*', async (req, res) => {
  const path = req.params[0];
  const response = await fetch(`http://ergast.com/api/f1/${path}`);
  const data = await response.json();
  res.json(data);
});
```

Then update `ERGAST_BASE_URL` to point to your backend.

## Configuration

### Enable/Disable API

In `src/lib/api/f1DataService.ts`:

```typescript
const USE_API = true; // Always true - API is required
// No mock data fallback - application uses only real API data
```

### Cache Duration

Adjust cache duration in `src/lib/api/f1DataService.ts`:

```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

## API Endpoints Used

- `GET /{season}.json` - Get all races for a season
- `GET /{season}/{round}/results.json` - Get race results
- `GET /{season}/{round}/qualifying.json` - Get qualifying results
- `GET /{season}/driverStandings.json` - Get driver standings
- `GET /{season}/constructorStandings.json` - Get constructor standings
- `GET /drivers.json` - Get all drivers
- `GET /constructors.json` - Get all constructors
- `GET /circuits.json` - Get all circuits

## Data Transformation

The API responses are transformed to match our domain models in `src/lib/api/dataTransformers.ts`:

- Ergast drivers → Our Driver model
- Ergast constructors → Our Team model
- Ergast races → Our Race model
- Ergast results → Our Result model

## Custom Hooks

Use the provided hooks for data fetching with loading/error states:

```typescript
import { useRaces, useRaceResults, useDrivers, useTeams } from '@/hooks/useF1Data';

function MyComponent() {
  const { data: races, loading, error, refetch } = useRaces(2024);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  
  return <div>{/* Use races data */}</div>;
}
```

## Alternative APIs

If you want to use different APIs:

### OpenF1 API
- URL: https://api.openf1.org
- Real-time data, requires paid account for live data
- Update `ergastClient.ts` to use OpenF1 endpoints

### Formula Live Pulse
- URL: https://f1livepulse.com
- Via RapidAPI
- Requires API key
- Add authentication headers in `ergastClient.ts`

### Hyprace F1 Data API
- URL: https://developers.hyprace.com
- Real-time and historical data
- Requires API key

## Testing

1. **Test with API enabled**: Verify data loads from Ergast
2. **Test API errors**: Check browser console for API error messages
3. **Test error handling**: Simulate API errors to verify fallback works

## Performance

- Responses are cached for 5 minutes
- Multiple requests for the same data use cache
- Consider implementing request deduplication for concurrent requests

## Rate Limiting

Ergast API has rate limits:
- 4 calls per second
- Consider implementing request throttling if needed

## Next Steps

1. **Handle CORS**: Implement proxy or use HTTPS version
2. **Add real-time updates**: Use WebSocket for live race data
3. **Improve caching**: Add persistent cache (localStorage/IndexedDB)
4. **Add request retry**: Implement exponential backoff for failed requests
5. **Add request deduplication**: Prevent duplicate concurrent requests

