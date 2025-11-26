#!/usr/bin/env python3
"""
Load real F1 data from OpenF1 API for model training
"""

import requests
import time
import numpy as np
import pandas as pd
import json
import os
from typing import List, Dict, Tuple, Optional
from datetime import datetime

# OpenF1 API base URL
OPENF1_BASE_URL = "https://api.openf1.org/v1"

# Rate limiting - be respectful
REQUEST_DELAY = 0.5  # seconds between requests

def fetch_with_delay(url: str, params: dict = None) -> dict:
    """Fetch data from API with rate limiting"""
    time.sleep(REQUEST_DELAY)
    response = requests.get(url, params=params)
    response.raise_for_status()
    return response.json()

def get_meetings(year: int) -> List[dict]:
    """Get all meetings (race weekends) for a year"""
    url = f"{OPENF1_BASE_URL}/meetings"
    params = {"year": year}
    return fetch_with_delay(url, params)

def get_sessions(year: int, location: str = None) -> List[dict]:
    """Get sessions for a year/location"""
    url = f"{OPENF1_BASE_URL}/sessions"
    params = {"year": year}
    if location:
        params["location"] = location
    return fetch_with_delay(url, params)

def get_drivers(session_key: int) -> List[dict]:
    """Get drivers for a session"""
    url = f"{OPENF1_BASE_URL}/drivers"
    params = {"session_key": session_key}
    return fetch_with_delay(url, params)

def get_positions(session_key: int) -> List[dict]:
    """Get positions for a session"""
    url = f"{OPENF1_BASE_URL}/position"
    params = {"session_key": session_key}
    return fetch_with_delay(url, params)

def get_laps(session_key: int, driver_number: int = None) -> List[dict]:
    """Get lap times for a session"""
    url = f"{OPENF1_BASE_URL}/laps"
    params = {"session_key": session_key}
    if driver_number:
        params["driver_number"] = driver_number
    return fetch_with_delay(url, params)

def calculate_final_positions(positions: List[dict]) -> Dict[int, int]:
    """Calculate final race positions from position data"""
    # Get last position for each driver
    final = {}
    for pos in positions:
        driver_num = pos.get('driver_number')
        position = pos.get('position')
        if driver_num and position:
            # Keep the latest position
            if driver_num not in final or pos.get('date', '') > final.get('date', ''):
                final[driver_num] = position
    return final

def get_driver_history(driver_number: int, current_race_date: str, races_data: List[dict], max_races: int = 5) -> List[int]:
    """Get driver's recent race positions (last 5 races)"""
    history = []
    current_date = datetime.fromisoformat(current_race_date.replace('Z', '+00:00'))
    
    # Sort races by date
    sorted_races = sorted(races_data, key=lambda x: x.get('date', ''), reverse=True)
    
    for race in sorted_races:
        race_date_str = race.get('date', '')
        if not race_date_str:
            continue
        race_date = datetime.fromisoformat(race_date_str.replace('Z', '+00:00'))
        
        # Only look at races before current race
        if race_date >= current_date:
            continue
            
        # Check if driver participated
        driver_result = race.get('results', {}).get(driver_number)
        if driver_result and driver_result.get('position'):
            history.append(driver_result['position'])
            if len(history) >= max_races:
                break
    
    # Pad with average if less than 5 races
    while len(history) < max_races:
        history.append(10)  # Default to P10 if no history
    
    return history[:max_races]

def prepare_features_for_driver(
    driver_number: int,
    race_data: dict,
    all_races: List[dict],
    driver_stats: dict,
    team_stats: dict
) -> List[float]:
    """Prepare 24 features for a driver-race combination"""
    features = []
    
    # Get driver's recent form (last 5 races)
    recent_positions = get_driver_history(
        driver_number,
        race_data['date'],
        all_races,
        max_races=5
    )
    # Normalize: P1 = 1.0, P20 = 0.05
    for pos in recent_positions:
        features.append((21 - pos) / 20 if pos else 0.5)
    
    # Driver stats (normalized)
    driver = driver_stats.get(driver_number, {})
    features.append(driver.get('points', 0) / 500)  # Max ~500 points in a season
    features.append(driver.get('wins', 0) / 25)  # Max ~25 wins
    features.append(driver.get('podiums', 0) / 25)  # Max ~25 podiums
    features.append(driver.get('poles', 0) / 25)  # Max ~25 poles
    
    # Team stats (normalized)
    team = team_stats.get(driver.get('team', ''), {})
    features.append(team.get('points', 0) / 1000)  # Team points
    features.append(team.get('wins', 0) / 25)
    features.append(team.get('podiums', 0) / 50)
    
    # Circuit features (simplified - OpenF1 doesn't provide all circuit details)
    # We'll use defaults or extract from session data if available
    circuit = race_data.get('circuit', {})
    features.append(circuit.get('laps', 50) / 100)  # Normalize laps
    features.append(circuit.get('distance', 300) / 400)  # Normalize distance (km)
    features.append(1 if circuit.get('type') == 'street' else 0)  # Track type
    
    # Track history (simplified - would need historical data)
    features.append(0.5)  # Default track history score
    
    # Weather features (simplified - OpenF1 may not have all weather data)
    weather = race_data.get('weather', {})
    features.append(weather.get('temperature', 25) / 50)  # Normalize temp
    features.append(1 if weather.get('condition') == 'dry' else 0)
    features.append(1 if weather.get('condition') == 'wet' else 0)
    features.append(1 if weather.get('condition') == 'mixed' else 0)
    features.append(weather.get('rain_chance', 0) / 100)
    features.append(weather.get('wind_speed', 0) / 50)
    
    # Season progress
    season = race_data.get('year', 2024)
    round_num = race_data.get('round', 1)
    features.append(round_num / 24)  # Assuming max 24 races
    
    # Average finish this season (up to this race)
    avg_finish = driver.get('avg_finish', 10.5)
    features.append((21 - avg_finish) / 20)  # Normalize
    
    return features

def load_f1_data(years: List[int] = [2021, 2022, 2023, 2024], use_cache: bool = True) -> Tuple[np.ndarray, np.ndarray]:
    """
    Load real F1 data from OpenF1 API
    
    Args:
        years: List of years to fetch data for
        use_cache: If True, load from cache if available, save after fetching
    
    Returns:
        X: Feature array of shape (num_samples, 24)
        y: Target array of shape (num_samples,) - finish positions (1-20)
    """
    cache_file = f"f1_data_cache_{'-'.join(map(str, years))}.npz"
    
    # Try to load from cache
    if use_cache and os.path.exists(cache_file):
        print("=" * 60)
        print("Loading Real F1 Data from Cache")
        print("=" * 60)
        print(f"📂 Loading cached data from {cache_file}...")
        try:
            data = np.load(cache_file)
            X = data['X']
            y = data['y']
            print(f"✅ Loaded {len(X)} samples from cache")
            return X, y
        except Exception as e:
            print(f"⚠️  Cache file corrupted, fetching fresh data: {e}")
    
    print("=" * 60)
    print("Loading Real F1 Data from OpenF1 API")
    print("=" * 60)
    print("⚠️  This will take several minutes due to API rate limiting...")
    
    all_features = []
    all_positions = []
    all_races_data = []
    
    # Track driver and team stats as we process races
    driver_stats = {}  # {driver_number: {points, wins, podiums, poles, team, avg_finish}}
    team_stats = {}  # {team_name: {points, wins, podiums}}
    
    for year in years:
        print(f"\n📅 Processing year {year}...")
        try:
            meetings = get_meetings(year)
            print(f"   Found {len(meetings)} meetings")
            
            for round_num, meeting in enumerate(meetings, 1):
                location = meeting.get('location')
                if not location:
                    continue
                
                print(f"   Round {round_num}: {location}")
                
                try:
                    # Get race session
                    sessions = get_sessions(year, location)
                    race_session = next((s for s in sessions if s.get('session_type') == 'Race'), None)
                    
                    if not race_session:
                        print(f"      ⚠️  No race session found, skipping")
                        continue
                    
                    session_key = race_session['session_key']
                    
                    # Get drivers and positions
                    drivers = get_drivers(session_key)
                    positions = get_positions(session_key)
                    
                    if not drivers or not positions:
                        print(f"      ⚠️  No driver/position data, skipping")
                        continue
                    
                    # Calculate final positions
                    final_positions = calculate_final_positions(positions)
                    
                    # Prepare race data structure
                    race_data = {
                        'year': year,
                        'round': round_num,
                        'date': race_session.get('date_start', ''),
                        'circuit': {
                            'laps': 50,  # Default, would need circuit data
                            'distance': 300,
                            'type': 'permanent'  # Default
                        },
                        'weather': {
                            'temperature': 25,
                            'condition': 'dry',
                            'rain_chance': 0,
                            'wind_speed': 0
                        },
                        'results': {}
                    }
                    
                    # Process each driver
                    for driver in drivers:
                        driver_number = driver.get('driver_number')
                        if not driver_number:
                            continue
                        
                        position = final_positions.get(driver_number)
                        if not position or position > 20:
                            continue
                        
                        # Store result
                        race_data['results'][driver_number] = {
                            'position': position,
                            'driver': driver
                        }
                        
                        # Update driver stats
                        if driver_number not in driver_stats:
                            driver_stats[driver_number] = {
                                'points': 0,
                                'wins': 0,
                                'podiums': 0,
                                'poles': 0,
                                'team': driver.get('team_name', ''),
                                'positions': [],
                                'avg_finish': 10.5
                            }
                        
                        driver_stats[driver_number]['positions'].append(position)
                        driver_stats[driver_number]['avg_finish'] = np.mean(driver_stats[driver_number]['positions'])
                        
                        # Update points (simplified scoring)
                        points_map = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
                        if position <= 10:
                            driver_stats[driver_number]['points'] += points_map[position - 1]
                        
                        if position == 1:
                            driver_stats[driver_number]['wins'] += 1
                        if position <= 3:
                            driver_stats[driver_number]['podiums'] += 1
                        
                        # Update team stats
                        team_name = driver.get('team_name', '')
                        if team_name:
                            if team_name not in team_stats:
                                team_stats[team_name] = {'points': 0, 'wins': 0, 'podiums': 0}
                            if position <= 10:
                                team_stats[team_name]['points'] += points_map[position - 1]
                            if position == 1:
                                team_stats[team_name]['wins'] += 1
                            if position <= 3:
                                team_stats[team_name]['podiums'] += 1
                    
                    # Now prepare features for each driver in this race
                    for driver_number, result in race_data['results'].items():
                        features = prepare_features_for_driver(
                            driver_number,
                            race_data,
                            all_races_data,
                            driver_stats,
                            team_stats
                        )
                        
                        all_features.append(features)
                        all_positions.append(result['position'])
                    
                    # Store race data for history tracking
                    all_races_data.append(race_data)
                    
                    print(f"      ✓ Processed {len(race_data['results'])} drivers")
                    
                except Exception as e:
                    print(f"      ❌ Error processing round {round_num}: {e}")
                    continue
        
        except Exception as e:
            print(f"   ❌ Error processing year {year}: {e}")
            continue
    
    if len(all_features) == 0:
        raise ValueError("No data loaded! Check API access and data availability.")
    
    X = np.array(all_features)
    y = np.array(all_positions)
    
    print(f"\n✅ Loaded {len(X)} samples with {X.shape[1]} features")
    print(f"   Position distribution: min={y.min()}, max={y.max()}, mean={y.mean():.2f}")
    
    # Save to cache
    if use_cache:
        print(f"\n💾 Saving data to cache: {cache_file}")
        np.savez(cache_file, X=X, y=y)
        print(f"   ✓ Cache saved for future use")
    
    return X, y

if __name__ == '__main__':
    # Test loading
    try:
        X, y = load_f1_data(years=[2023, 2024])  # Start with recent years
        print(f"\n✅ Successfully loaded data:")
        print(f"   Features shape: {X.shape}")
        print(f"   Targets shape: {y.shape}")
        print(f"   Sample features (first driver): {X[0]}")
        print(f"   Sample target (first driver): {y[0]}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

