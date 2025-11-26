/**
 * Mock F1 Data - Structured for easy replacement with real APIs
 * TODO: Replace with Ergast API or FastF1 integration
 */

import type {
  Driver,
  Team,
  Circuit,
  Race,
  Result,
} from '@/types';

// Team colors (F1 2024 inspired)
export const TEAMS: Team[] = [
  {
    id: 'redbull',
    name: 'Red Bull Racing',
    engine: 'Honda RBPT',
    primaryColor: '#1E41FF',
    secondaryColor: '#0600EF',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
  {
    id: 'mercedes',
    name: 'Mercedes',
    engine: 'Mercedes',
    primaryColor: '#00D2BE',
    secondaryColor: '#000000',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
  {
    id: 'ferrari',
    name: 'Ferrari',
    engine: 'Ferrari',
    primaryColor: '#DC143C',
    secondaryColor: '#000000',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
  {
    id: 'mclaren',
    name: 'McLaren',
    engine: 'Mercedes',
    primaryColor: '#FF8700',
    secondaryColor: '#000000',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
  {
    id: 'aston-martin',
    name: 'Aston Martin',
    engine: 'Mercedes',
    primaryColor: '#00665E',
    secondaryColor: '#000000',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
  {
    id: 'alpine',
    name: 'Alpine',
    engine: 'Renault',
    primaryColor: '#0090FF',
    secondaryColor: '#FF014D',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
  {
    id: 'williams',
    name: 'Williams',
    engine: 'Mercedes',
    primaryColor: '#005AFF',
    secondaryColor: '#FFFFFF',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
  {
    id: 'alphatauri',
    name: 'AlphaTauri',
    engine: 'Honda RBPT',
    primaryColor: '#2B4562',
    secondaryColor: '#FFFFFF',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
  {
    id: 'alfa-romeo',
    name: 'Alfa Romeo',
    engine: 'Ferrari',
    primaryColor: '#900000',
    secondaryColor: '#FFFFFF',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
  {
    id: 'haas',
    name: 'Haas',
    engine: 'Ferrari',
    primaryColor: '#FFFFFF',
    secondaryColor: '#ED1C24',
    totalPoints: 0,
    wins: 0,
    podiums: 0,
  },
];

export const DRIVERS: Driver[] = [
  {
    id: 'verstappen',
    name: 'Max Verstappen',
    code: 'VER',
    teamId: 'redbull',
    carNumber: 1,
    nationality: 'Dutch',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'perez',
    name: 'Sergio Pérez',
    code: 'PER',
    teamId: 'redbull',
    carNumber: 11,
    nationality: 'Mexican',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'hamilton',
    name: 'Lewis Hamilton',
    code: 'HAM',
    teamId: 'mercedes',
    carNumber: 44,
    nationality: 'British',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'russell',
    name: 'George Russell',
    code: 'RUS',
    teamId: 'mercedes',
    carNumber: 63,
    nationality: 'British',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'leclerc',
    name: 'Charles Leclerc',
    code: 'LEC',
    teamId: 'ferrari',
    carNumber: 16,
    nationality: 'Monegasque',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'sainz',
    name: 'Carlos Sainz',
    code: 'SAI',
    teamId: 'ferrari',
    carNumber: 55,
    nationality: 'Spanish',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'norris',
    name: 'Lando Norris',
    code: 'NOR',
    teamId: 'mclaren',
    carNumber: 4,
    nationality: 'British',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'piastri',
    name: 'Oscar Piastri',
    code: 'PIA',
    teamId: 'mclaren',
    carNumber: 81,
    nationality: 'Australian',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'alonso',
    name: 'Fernando Alonso',
    code: 'ALO',
    teamId: 'aston-martin',
    carNumber: 14,
    nationality: 'Spanish',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'stroll',
    name: 'Lance Stroll',
    code: 'STR',
    teamId: 'aston-martin',
    carNumber: 18,
    nationality: 'Canadian',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'ocon',
    name: 'Esteban Ocon',
    code: 'OCO',
    teamId: 'alpine',
    carNumber: 31,
    nationality: 'French',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'gasly',
    name: 'Pierre Gasly',
    code: 'GAS',
    teamId: 'alpine',
    carNumber: 32,
    nationality: 'French',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'albon',
    name: 'Alexander Albon',
    code: 'ALB',
    teamId: 'williams',
    carNumber: 23,
    nationality: 'Thai',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'sargeant',
    name: 'Logan Sargeant',
    code: 'SAR',
    teamId: 'williams',
    carNumber: 2,
    nationality: 'American',
    rookie: true,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'tsunoda',
    name: 'Yuki Tsunoda',
    code: 'TSU',
    teamId: 'alphatauri',
    carNumber: 22,
    nationality: 'Japanese',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'ricciardo',
    name: 'Daniel Ricciardo',
    code: 'RIC',
    teamId: 'alphatauri',
    carNumber: 3,
    nationality: 'Australian',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'bottas',
    name: 'Valtteri Bottas',
    code: 'BOT',
    teamId: 'alfa-romeo',
    carNumber: 77,
    nationality: 'Finnish',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'zhou',
    name: 'Guanyu Zhou',
    code: 'ZHO',
    teamId: 'alfa-romeo',
    carNumber: 24,
    nationality: 'Chinese',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'magnussen',
    name: 'Kevin Magnussen',
    code: 'MAG',
    teamId: 'haas',
    carNumber: 20,
    nationality: 'Danish',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
  {
    id: 'hulkenberg',
    name: 'Nico Hülkenberg',
    code: 'HUL',
    teamId: 'haas',
    carNumber: 27,
    nationality: 'German',
    rookie: false,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    last5Results: [],
  },
];

export const CIRCUITS: Circuit[] = [
  {
    id: 'bahrain',
    name: 'Bahrain International Circuit',
    country: 'Bahrain',
    city: 'Sakhir',
    laps: 57,
    lapDistance: 5.412,
    raceDistance: 308.238,
    trackType: 'permanent',
  },
  {
    id: 'jeddah',
    name: 'Jeddah Corniche Circuit',
    country: 'Saudi Arabia',
    city: 'Jeddah',
    laps: 50,
    lapDistance: 6.174,
    raceDistance: 308.45,
    trackType: 'street',
  },
  {
    id: 'melbourne',
    name: 'Albert Park Circuit',
    country: 'Australia',
    city: 'Melbourne',
    laps: 58,
    lapDistance: 5.278,
    raceDistance: 306.124,
    trackType: 'street',
  },
  {
    id: 'suzuka',
    name: 'Suzuka International Racing Course',
    country: 'Japan',
    city: 'Suzuka',
    laps: 53,
    lapDistance: 5.807,
    raceDistance: 307.471,
    trackType: 'permanent',
  },
  {
    id: 'shanghai',
    name: 'Shanghai International Circuit',
    country: 'China',
    city: 'Shanghai',
    laps: 56,
    lapDistance: 5.451,
    raceDistance: 305.066,
    trackType: 'permanent',
  },
  {
    id: 'miami',
    name: 'Miami International Autodrome',
    country: 'USA',
    city: 'Miami',
    laps: 57,
    lapDistance: 5.412,
    raceDistance: 308.326,
    trackType: 'street',
  },
  {
    id: 'imola',
    name: 'Autodromo Enzo e Dino Ferrari',
    country: 'Italy',
    city: 'Imola',
    laps: 63,
    lapDistance: 4.909,
    raceDistance: 309.049,
    trackType: 'permanent',
  },
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    city: 'Monaco',
    laps: 78,
    lapDistance: 3.337,
    raceDistance: 260.286,
    trackType: 'street',
  },
  {
    id: 'montreal',
    name: 'Circuit Gilles Villeneuve',
    country: 'Canada',
    city: 'Montreal',
    laps: 70,
    lapDistance: 4.361,
    raceDistance: 305.27,
    trackType: 'permanent',
  },
  {
    id: 'barcelona',
    name: 'Circuit de Barcelona-Catalunya',
    country: 'Spain',
    city: 'Barcelona',
    laps: 66,
    lapDistance: 4.675,
    raceDistance: 308.424,
    trackType: 'permanent',
  },
  {
    id: 'red-bull-ring',
    name: 'Red Bull Ring',
    country: 'Austria',
    city: 'Spielberg',
    laps: 71,
    lapDistance: 4.318,
    raceDistance: 306.452,
    trackType: 'permanent',
  },
  {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'United Kingdom',
    city: 'Silverstone',
    laps: 52,
    lapDistance: 5.891,
    raceDistance: 306.198,
    trackType: 'permanent',
  },
  {
    id: 'hungaroring',
    name: 'Hungaroring',
    country: 'Hungary',
    city: 'Budapest',
    laps: 70,
    lapDistance: 4.381,
    raceDistance: 306.63,
    trackType: 'permanent',
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    city: 'Spa',
    laps: 44,
    lapDistance: 7.004,
    raceDistance: 308.052,
    trackType: 'permanent',
  },
  {
    id: 'zandvoort',
    name: 'Circuit Zandvoort',
    country: 'Netherlands',
    city: 'Zandvoort',
    laps: 72,
    lapDistance: 4.259,
    raceDistance: 306.587,
    trackType: 'permanent',
  },
  {
    id: 'monza',
    name: 'Autodromo Nazionale di Monza',
    country: 'Italy',
    city: 'Monza',
    laps: 53,
    lapDistance: 5.793,
    raceDistance: 306.72,
    trackType: 'permanent',
  },
  {
    id: 'baku',
    name: 'Baku City Circuit',
    country: 'Azerbaijan',
    city: 'Baku',
    laps: 51,
    lapDistance: 6.003,
    raceDistance: 306.049,
    trackType: 'street',
  },
  {
    id: 'singapore',
    name: 'Marina Bay Street Circuit',
    country: 'Singapore',
    city: 'Singapore',
    laps: 61,
    lapDistance: 5.063,
    raceDistance: 308.706,
    trackType: 'street',
  },
  {
    id: 'cota',
    name: 'Circuit of the Americas',
    country: 'USA',
    city: 'Austin',
    laps: 56,
    lapDistance: 5.513,
    raceDistance: 308.405,
    trackType: 'permanent',
  },
  {
    id: 'mexico',
    name: 'Autódromo Hermanos Rodríguez',
    country: 'Mexico',
    city: 'Mexico City',
    laps: 71,
    lapDistance: 4.304,
    raceDistance: 305.354,
    trackType: 'permanent',
  },
  {
    id: 'interlagos',
    name: 'Autódromo José Carlos Pace',
    country: 'Brazil',
    city: 'São Paulo',
    laps: 71,
    lapDistance: 4.309,
    raceDistance: 305.879,
    trackType: 'permanent',
  },
  {
    id: 'las-vegas',
    name: 'Las Vegas Strip Circuit',
    country: 'USA',
    city: 'Las Vegas',
    laps: 50,
    lapDistance: 6.12,
    raceDistance: 305.88,
    trackType: 'street',
  },
  {
    id: 'qatar',
    name: 'Lusail International Circuit',
    country: 'Qatar',
    city: 'Lusail',
    laps: 57,
    lapDistance: 5.38,
    raceDistance: 306.66,
    trackType: 'permanent',
  },
  {
    id: 'abu-dhabi',
    name: 'Yas Marina Circuit',
    country: 'UAE',
    city: 'Abu Dhabi',
    laps: 58,
    lapDistance: 5.281,
    raceDistance: 306.183,
    trackType: 'permanent',
  },
];

// Generate mock races for current season (2024)
const CURRENT_SEASON = 2024;
const generateRaces = (season: number): Race[] => {
  const races: Race[] = [];
  const raceNames = [
    'Bahrain Grand Prix',
    'Saudi Arabian Grand Prix',
    'Australian Grand Prix',
    'Japanese Grand Prix',
    'Chinese Grand Prix',
    'Miami Grand Prix',
    'Emilia Romagna Grand Prix',
    'Monaco Grand Prix',
    'Canadian Grand Prix',
    'Spanish Grand Prix',
    'Austrian Grand Prix',
    'British Grand Prix',
    'Hungarian Grand Prix',
    'Belgian Grand Prix',
    'Dutch Grand Prix',
    'Italian Grand Prix',
    'Azerbaijan Grand Prix',
    'Singapore Grand Prix',
    'United States Grand Prix',
    'Mexico City Grand Prix',
    'São Paulo Grand Prix',
    'Las Vegas Grand Prix',
    'Qatar Grand Prix',
    'Abu Dhabi Grand Prix',
  ];

  const circuitIds = CIRCUITS.map((c) => c.id);
  const startDate = new Date(`${season}-03-01`);

  raceNames.forEach((name, index) => {
    const raceDate = new Date(startDate);
    raceDate.setDate(startDate.getDate() + index * 14);

    races.push({
      season,
      round: index + 1,
      name,
      circuitId: circuitIds[index % circuitIds.length],
      date: raceDate.toISOString(),
      weatherSummary: {
        temperature: 20 + Math.floor(Math.random() * 15),
        condition: Math.random() > 0.8 ? 'wet' : Math.random() > 0.9 ? 'mixed' : 'dry',
        chanceOfRain: Math.random() * 30,
        windSpeed: 5 + Math.random() * 15,
      },
      safetyCars: Math.floor(Math.random() * 3),
      DNFs: Math.floor(Math.random() * 4),
      completed: index < 5, // First 5 races completed
    });
  });

  return races;
};

// Store races by season
const RACES_BY_SEASON: Map<number, Race[]> = new Map();
RACES_BY_SEASON.set(CURRENT_SEASON, generateRaces(CURRENT_SEASON));
RACES_BY_SEASON.set(2023, generateRaces(2023));
RACES_BY_SEASON.set(2022, generateRaces(2022));

// Generate mock results
const generateResults = (race: Race): Result[] => {
  const results: Result[] = [];
  const shuffledDrivers = [...DRIVERS].sort(() => Math.random() - 0.5);
  const circuit = CIRCUITS.find((c) => c.id === race.circuitId);
  const totalLaps = circuit?.laps || 50;

  shuffledDrivers.forEach((driver, index) => {
    const finishPosition = index + 1;
    const grid = Math.max(1, finishPosition + Math.floor(Math.random() * 5) - 2);
    const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][finishPosition - 1] || 0;
    const fastestLap = finishPosition === 1 && Math.random() > 0.5;
    const DNF = finishPosition > 15 && Math.random() > 0.85;

    results.push({
      raceId: `${race.season}-${race.round}`,
      driverId: driver.id,
      grid,
      finishPosition: DNF ? 20 : finishPosition,
      points: DNF ? 0 : points,
      fastestLap,
      tyreStints: [
        {
          compound: ['soft', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'soft' | 'medium' | 'hard',
          laps: Math.floor(totalLaps * (0.4 + Math.random() * 0.3)),
          startLap: 1,
          endLap: Math.floor(totalLaps * (0.4 + Math.random() * 0.3)),
        },
        {
          compound: ['soft', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'soft' | 'medium' | 'hard',
          laps: totalLaps - Math.floor(totalLaps * (0.4 + Math.random() * 0.3)),
          startLap: Math.floor(totalLaps * (0.4 + Math.random() * 0.3)) + 1,
          endLap: totalLaps,
        },
      ],
      DNF,
      DNFReason: DNF ? ['Crash', 'Engine', 'Gearbox', 'Hydraulics'][Math.floor(Math.random() * 4)] : undefined,
    });
  });

  return results.sort((a, b) => a.finishPosition - b.finishPosition);
};

// Store results by race
const RESULTS_BY_RACE: Map<string, Result[]> = new Map();

// Initialize results for completed races
RACES_BY_SEASON.forEach((races) => {
  races.forEach((race) => {
    if (race.completed) {
      const raceId = `${race.season}-${race.round}`;
      RESULTS_BY_RACE.set(raceId, generateResults(race));
    }
  });
});

// Update driver and team stats from results
const updateStats = async () => {
  // Reset stats
  DRIVERS.forEach((driver) => {
    driver.points = 0;
    driver.wins = 0;
    driver.podiums = 0;
    driver.poles = 0;
    driver.last5Results = [];
  });

  TEAMS.forEach((team) => {
    team.totalPoints = 0;
    team.wins = 0;
    team.podiums = 0;
  });

  // Calculate stats from results
  RESULTS_BY_RACE.forEach((results) => {
    results.forEach((result) => {
      const driver = DRIVERS.find((d) => d.id === result.driverId);
      const team = TEAMS.find((t) => t.id === driver?.teamId);

      if (driver) {
        driver.points += result.points;
        if (result.finishPosition === 1) driver.wins++;
        if (result.finishPosition <= 3) driver.podiums++;
        if (result.grid === 1) driver.poles++;
        driver.last5Results.push(result.finishPosition);
        if (driver.last5Results.length > 5) driver.last5Results.shift();
      }

      if (team) {
        team.totalPoints += result.points;
        if (result.finishPosition === 1) team.wins++;
        if (result.finishPosition <= 3) team.podiums++;
      }
    });
  });
};

updateStats();

export { RACES_BY_SEASON, RESULTS_BY_RACE, CURRENT_SEASON };

