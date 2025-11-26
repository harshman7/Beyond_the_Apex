# FastF1 Backend Integration Guide

## Why FastF1 Requires a Backend

FastF1 is a **Python library**, not a REST API. To use FastF1 in a React/TypeScript application, you need to create a Python backend that:

1. Uses FastF1 to fetch data
2. Exposes REST API endpoints
3. Your React app calls these endpoints

## Option 1: Simple FastAPI Backend

### Setup

1. **Create a Python backend directory:**
   ```bash
   mkdir f1-backend
   cd f1-backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install fastapi uvicorn fastf1
   ```

2. **Create `main.py`:**
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware
   import fastf1
   from datetime import datetime
   
   app = FastAPI()
   
   # Enable CORS
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],  # Your React app URL
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   
   @app.get("/api/f1/sessions/{year}")
   async def get_sessions(year: int):
       """Get all sessions for a year"""
       schedule = fastf1.get_event_schedule(year)
       return schedule.to_dict('records')
   
   @app.get("/api/f1/session/{session_key}")
   async def get_session_data(session_key: int):
       """Get session data"""
       session = fastf1.get_session(2024, session_key, 'R')
       session.load()
       
       return {
           "laps": session.laps.to_dict('records'),
           "results": session.results.to_dict('records'),
           "telemetry": session.get_telemetry().to_dict('records')[:1000],  # Limit for performance
       }
   
   @app.get("/api/f1/drivers/{year}")
   async def get_drivers(year: int):
       """Get drivers for a season"""
       schedule = fastf1.get_event_schedule(year)
       drivers = set()
       for event in schedule.itertuples():
           try:
               session = fastf1.get_session(year, event.RoundNumber, 'R')
               session.load()
               for driver in session.results['Abbreviation']:
                   drivers.add(driver)
           except:
               continue
       return list(drivers)
   
   if __name__ == "__main__":
       import uvicorn
       uvicorn.run(app, host="0.0.0.0", port=8000)
   ```

3. **Run the backend:**
   ```bash
   python main.py
   ```

4. **Update React client** to call `http://localhost:8000/api/f1/...`

## Option 2: Use OpenF1 API (Recommended)

OpenF1 API provides similar data to FastF1 but as a REST API, so no backend needed!

**Already integrated in this project** - see `src/lib/api/openF1Client.ts`

## Option 3: Hybrid Approach

Use OpenF1 for most data, FastF1 backend for advanced telemetry:

- **OpenF1**: Races, drivers, positions, basic data
- **FastF1 Backend**: Detailed telemetry, advanced analysis

## Comparison

| Feature | OpenF1 API | FastF1 (Backend) |
|---------|------------|------------------|
| Setup | ✅ No backend needed | ❌ Requires Python backend |
| Real-time | ✅ Yes | ✅ Yes |
| Historical | ✅ Yes | ✅ Yes |
| Telemetry | ⚠️ Limited | ✅ Full telemetry |
| CORS | ✅ HTTPS, no issues | ⚠️ Need to configure |
| Cost | ✅ Free | ✅ Free (library) |

## Recommendation

**Use OpenF1 API** (already integrated) because:
- ✅ No backend required
- ✅ Modern REST API
- ✅ No CORS issues (HTTPS)
- ✅ Free and actively maintained
- ✅ Similar data to FastF1

Use FastF1 backend only if you need:
- Advanced telemetry analysis
- Custom data processing
- Python-specific features

