/**
 * Default data used to bootstrap a new exhibition game.
 * In the future these could come from a database, save file, or recruiting system.
 */

import type {
  Team,
  Player,
  PlayerPosition,
  GameSettings,
  Lineup,
  Coach,
  SeasonOpponent,
  SeasonGame,
  Season,
  Prospect,
} from "../types";
import { randomFirstName, randomLastName } from "./names";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _nextId = 100;
const uid = (): string => `player_${_nextId++}`;

const NICKNAMES = [
  "Wildcats", "Tigers", "Bulldogs", "Spartans", "Bruins", "Wolverines", "Huskies", "Jayhawks", 
  "Tar Heels", "Blue Devils", "Longhorns", "Aggies", "Buckeyes", "Badgers", "Gators", 
  "Cardinals", "Utes", "Ducks", "Beavers", "Golden Bears"
];

/** Return a random integer in [min, max]. */
export function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Per-position rating ranges (min, max) for each skill dimension.
 * Guards are faster with better passing; bigs have more rebounding and defense.
 */
const RATING_RANGES: Record<PlayerPosition, Record<keyof import("../types").PlayerRatings, [number, number]>> = {
  PG: { speed: [65, 92], shooting: [55, 85], passing: [68, 90], defense: [50, 78], rebounding: [35, 62], endurance: [60, 90] },
  SG: { speed: [60, 88], shooting: [62, 92], passing: [52, 80], defense: [50, 80], rebounding: [38, 66], endurance: [55, 85] },
  SF: { speed: [56, 85], shooting: [58, 88], passing: [50, 78], defense: [55, 83], rebounding: [48, 76], endurance: [52, 82] },
  PF: { speed: [44, 74], shooting: [44, 76], passing: [36, 66], defense: [60, 88], rebounding: [65, 90], endurance: [48, 78] },
  C:  { speed: [35, 65], shooting: [38, 72], passing: [32, 62], defense: [62, 90], rebounding: [70, 92], endurance: [45, 75] },
};

function randomHeight(pos: PlayerPosition): number {
  const ranges: Record<PlayerPosition, [number, number]> = {
    PG: [70, 76], // 5'10" - 6'4"
    SG: [74, 79], // 6'2" - 6'7"
    SF: [77, 82], // 6'5" - 6'10"
    PF: [80, 84], // 6'8" - 7'0"
    C:  [82, 87], // 6'10" - 7'3"
  };
  return rand(...ranges[pos]);
}

function pickSkinTone(): number {
  return rand(1, 5);
}

function pickHairColor(): string {
  const colors = ["#2d1b0d", "#1a1a1a", "#4a3728", "#8b5a2b", "#d2b48c"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function makeRatings(pos: PlayerPosition): import("../types").PlayerRatings {
  const r = RATING_RANGES[pos];
  return {
    speed:      rand(...r.speed),
    shooting:   rand(...r.shooting),
    passing:    rand(...r.passing),
    defense:    rand(...r.defense),
    rebounding: rand(...r.rebounding),
    endurance:  rand(...r.endurance),
  };
}

/**
 * Create a player with ratings scaled to a given overall quality level (60–90).
 * Ported from CFHC's `makeScaledRatings` logic.
 */
function makeScaledRatings(pos: PlayerPosition, overall: number): import("../types").PlayerRatings {
  const factor = Math.max(0, Math.min(1, (overall - 60) / 30));
  const r = RATING_RANGES[pos];
  const pick = (range: [number, number]): number => {
    const lo = range[0];
    const hi = range[1];
    const center = lo + (hi - lo) * factor;
    const spread = (hi - lo) * 0.25;
    return Math.round(Math.max(lo, Math.min(hi, center + (Math.random() - 0.5) * spread * 2)));
  };
  return {
    speed:      pick(r.speed),
    shooting:   pick(r.shooting),
    passing:    pick(r.passing),
    defense:    pick(r.defense),
    rebounding: pick(r.rebounding),
    endurance:  pick(r.endurance),
  };
}

/**
 * Assign a year (1–4) to a player slot based on its position in the roster.
 * Starters tend to be upperclassmen; bench players are younger.
 * Adapted from CFHC's year-distribution logic.
 */
function assignYear(slotIndex: number): 1 | 2 | 3 | 4 {
  if (slotIndex < 5) {
    const roll = Math.random();
    if (roll < 0.20) return 2;
    if (roll < 0.55) return 3;
    return 4;
  } else {
    const roll = Math.random();
    if (roll < 0.40) return 1;
    if (roll < 0.75) return 2;
    return 3;
  }
}

function makePlayers(
  _teamId: string,
  names: [string, string, PlayerPosition, number][]
): Player[] {
  return names.map(([first, last, pos, num], idx) => ({
    id: uid(),
    firstName: first,
    lastName: last,
    number: num,
    position: pos,
    ratings: makeRatings(pos),
    year: assignYear(idx),
    morale: 80 + rand(-5, 10), // start with healthy morale
    potential: 50 + rand(0, 45), // random potential 50-95
    archetype: pickArchetype(pos),
    traits: pickTraits(pos),
    heightInches: randomHeight(pos),
    skinTone: pickSkinTone(),
    hairColor: pickHairColor(),
  }));
}

function pickArchetype(pos: import("../types").PlayerPosition): import("../types").PlayerArchetype {
  const archetypes: Record<import("../types").PlayerPosition, import("../types").PlayerArchetype[]> = {
    PG: ["Pass-First PG", "Scoring Guard"],
    SG: ["Scoring Guard", "Wing Sniper"],
    SF: ["Wing Sniper", "Two-Way Wing"],
    PF: ["Stretch Big", "Post Anchor"],
    C:  ["Glass Cleaner", "Post Anchor"],
  };
  const list = archetypes[pos];
  return list[Math.floor(Math.random() * list.length)];
}

function pickTraits(pos: import("../types").PlayerPosition): import("../types").PlayerTrait[] {
  const pool: import("../types").PlayerTrait[] = ["Clutch", "Floor General", "Brick Wall", "Microwave", "Enforcer", "High Motor"];
  const traits: import("../types").PlayerTrait[] = [];
  if (Math.random() > 0.6) {
    traits.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return traits;
}

// ---------------------------------------------------------------------------
// Default teams
// ---------------------------------------------------------------------------

const homePlayers = makePlayers("home", [
  ["Marcus", "Johnson", "PG", 1],
  ["Jaylen", "Williams", "SG", 2],
  ["DeAndre", "Smith", "SF", 3],
  ["Tyler", "Brown", "PF", 4],
  ["Chris", "Davis", "C", 5],
  ["Malik", "Thompson", "PG", 11],
  ["Andre", "Wilson", "SG", 12],
  ["Devon", "Taylor", "SF", 13],
]);

const awayPlayers = makePlayers("away", [
  ["Jordan", "Carter", "PG", 1],
  ["Isaiah", "Harris", "SG", 2],
  ["Caleb", "Martin", "SF", 3],
  ["Darius", "Clark", "PF", 4],
  ["Elijah", "Walker", "C", 5],
  ["Terrance", "Lee", "PG", 11],
  ["Noah", "Young", "SG", 12],
  ["Jaden", "Allen", "SF", 13],
]);

export const defaultHomeTeam: Team = {
  id: "home",
  name: "State Bulldogs",
  abbreviation: "STB",
  primaryColor: "#1e40af",
  secondaryColor: "#ffffff",
  roster: homePlayers,
  lineup: homePlayers.slice(0, 5).map((p) => p.id) as Lineup,
  chemistry: 70,
  region: "Midwest",
};

export const defaultAwayTeam: Team = {
  id: "away",
  name: "Central",
  nickname: "Blue Devils", // Default user team nickname
  abbreviation: "PAC",
  primaryColor: "#b91c1c",
  secondaryColor: "#fbbf24",
  roster: awayPlayers,
  lineup: awayPlayers.slice(0, 5).map((p) => p.id) as Lineup,
  chemistry: 65,
  region: "South",
};

export const defaultGameSettings: GameSettings = {
  halfLength: 20 * 60,
  shotClockLength: 30,
  bonusFoulThreshold: 7,
  doubleBonusThreshold: 10,
  subStaminaThreshold: 25,
  homeCourtBonus: true,
  coachOffense: 50,
  coachDefense: 50,
};

export const defaultCoach: Coach = {
  id: "coach_default",
  firstName: "Mike",
  lastName: "Reynolds",
  offense: 72,
  defense: 68,
  recruiting: 65,
  development: 70,
  level: 1,
  experience: 0,
  skillPoints: 0,
  careerWins: 0,
  careerLosses: 0,
};

const TEAM_PREFIXES = [
  "State", "Central", "Western", "Eastern", "Northern", "Southern", "Pacific", "Atlantic", "Mountain", "Coastal"
];

const TEAM_NAMES = [
  "Abilene", "Akron", "Albany", "Alcorn", "American", "Appalachian", "Arizona", "Arkansas", "Auburn", "Austin",
  "Ball", "Baylor", "Belmont", "Bethune", "Boise", "Boston", "Bowling Green", "Bradley", "Brown", "Bucknell",
  "Buffalo", "Butler", "California", "Campbell", "Canisius", "Charleston", "Charlotte", "Chattanooga", "Chicago",
  "Cincinnati", "Clemson", "Cleveland", "Colgate", "Colorado", "Columbia", "Connecticut", "Coppin", "Cornell",
  "Creighton", "Dartmouth", "Davidson", "Dayton", "Delaware", "Denver", "DePaul", "Detroit", "Drake", "Drexel",
  "Duke", "Duquesne", "Elon", "Evansville", "Fairfield", "Fairleigh", "Florida", "Fordham",
  "Fresno", "Furman", "Gardner", "George", "Georgetown", "Georgia", "Gonzaga", "Grambling", "Grand", "Green Bay",
  "Hampton", "Hartford", "Harvard", "Hawaii", "High", "Hofstra", "Holy", "Houston", "Howard", "Idaho",
  "Illinois", "Incarnate", "Indiana", "Iona", "Iowa", "IUPUI", "Jackson", "Jacksonville", "James", "Kansas",
  "Kennesaw", "Kent", "Kentucky", "La Salle", "Lafayette", "Lamar", "Lehigh", "Liberty", "Lipscomb", "Little",
  "Long", "Louisiana", "Louisville", "Loyola", "LSU", "Maine", "Manhattan", "Marist", "Marquette", "Marshall",
  "Maryland", "McNeese", "Memphis", "Mercer", "Merrimack", "Miami", "Michigan", "Middle", "Milwaukee", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Morehead", "Morgan", "Mount", "Murray", "Navy", "NC", "Nebraska",
  "Nevada", "New", "Niagara", "Nicholls", "NJIT", "Norfolk", "North", "Northeastern", "Northwestern",
  "Notre Dame", "Oakland", "Ohio", "Oklahoma", "Old", "Ole Miss", "Oral", "Oregon", "Pacific", "Penn",
  "Pepperdine", "Pittsburgh", "Portland", "Prairie", "Presbyterian", "Princeton", "Providence", "Purdue", "Quinnipiac", "Radford",
  "Rhode Island", "Rice", "Richmond", "Rider", "Robert", "Rutgers", "Sacramento", "Sacred", "Saint", "Sam",
  "San Diego", "San Francisco", "San Jose", "Santa", "Savannah", "Seattle", "Seton", "Siena", "SIU", "SMU",
  "South", "Southeastern", "Southern", "Stanford", "Stephen", "Stetson", "Stony", "Syracuse", "TCU", "Temple",
  "Tennessee", "Texas", "Toledo", "Towson", "Troy", "Tulane", "Tulsa", "UAB", "UC", "UCF",
  "UCLA", "UCSB", "UMass", "UMBC", "UMKC", "UNC", "UNLV", "USC", "USF", "Utah",
  "UTEP", "UTRGV", "UTSA", "Valparaiso", "Vanderbilt", "VCU", "Vermont", "Villanova", "Virginia", "VMI",
  "Wagner", "Wake Forest", "Washington", "West", "Western", "Wichita", "William", "Winthrop", "Wisconsin", "Wofford",
  "Wright", "Wyoming", "Xavier", "Yale", "Youngstown"
];

const TEAM_NICKNAMES = [
  "Wildcats", "Tigers", "Bulldogs", "Spartans", "Bruins", "Wolverines", "Huskies", "Jayhawks", 
  "Tar Heels", "Blue Devils", "Longhorns", "Aggies", "Buckeyes", "Badgers", "Gators", 
  "Cardinals", "Utes", "Ducks", "Beavers", "Golden Bears", "Panthers", "Eagles", "Wolves", "Lions",
  "Rams", "Cougars", "Falcons", "Knights", "Friars", "Monarchs", "Chargers", "Owls", "Dolphins",
  "Rebels", "Gauchos", "Tritons", "Matadors", "Anteaters", "Highlanders", "Titans", "Lumberjacks",
  "Enforcers", "Miners", "Roadrunners", "Bison", "Redhawks", "Gaels", "Dons", "Toreros"
];

const REGIONS: ("West" | "Midwest" | "East" | "South")[] = ["West", "Midwest", "East", "South"];
const COLORS = ["#1e40af", "#b91c1c", "#047857", "#7c3aed", "#b45309", "#0f766e", "#6d28d9", "#1e3a8a", "#92400e", "#1f2937"];

/** Generate a massive list of 300+ teams dynamically */
function generateAllTeams(): SeasonOpponent[] {
  const teams: SeasonOpponent[] = [];
  let idCounter = 1;

  // Mix names, prefixes, and nicknames to reach 300+
  for (const name of TEAM_NAMES) {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const nickname = TEAM_NICKNAMES[Math.floor(Math.random() * TEAM_NICKNAMES.length)];
    const primary = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    teams.push({
      id: `team_${idCounter++}`,
      name: name,
      nickname: nickname,
      abbreviation: name.substring(0, 3).toUpperCase(),
      primaryColor: primary,
      secondaryColor: "#ffffff",
      overall: 65 + Math.floor(Math.random() * 25),
      region: region
    });

    // Add some "State" variations to reach the goal
    if (teams.length < 350 && Math.random() > 0.6) {
       const prefix = TEAM_PREFIXES[Math.floor(Math.random() * TEAM_PREFIXES.length)];
       teams.push({
         id: `team_${idCounter++}`,
         name: `${name} ${prefix}`,
         nickname: TEAM_NICKNAMES[Math.floor(Math.random() * TEAM_NICKNAMES.length)],
         abbreviation: (name.substring(0, 2) + prefix.substring(0, 1)).toUpperCase(),
         primaryColor: COLORS[Math.floor(Math.random() * COLORS.length)],
         secondaryColor: "#ffffff",
         overall: 60 + Math.floor(Math.random() * 25),
         region: region
       });
    }
  }

  return teams;
}

export const AVAILABLE_TEAMS = generateAllTeams();

const SEASON_OPPONENTS: SeasonOpponent[] = AVAILABLE_TEAMS.slice(0, 100);

const CONFERENCES = [
  "Big East", "ACC", "SEC", "Big 10", "Big 12", "Pac 12", "Mountain West", "A-10", "AAC", "MAC",
  "Sun Belt", "C-USA", "WCC", "Horizon", "MAAC", "MVC", "OVC", "Patriot", "SoCon", "Southland",
  "Summit", "SWAC", "WAC", "Big Sky", "Big South"
];

export function getConferenceTeams(confName: string): SeasonOpponent[] {
  // Simple deterministic assignment based on index
  const confIdx = CONFERENCES.indexOf(confName);
  const start = confIdx * 12;
  return AVAILABLE_TEAMS.slice(start, start + 12);
}

export function makeOpponentTeam(opponent: SeasonOpponent): Team {
  const slots: [PlayerPosition, number][] = [
    ["PG", 1], ["SG", 2], ["SF", 3], ["PF", 4], ["C", 5],
    ["PG", 11], ["SG", 12], ["SF", 13],
  ];
  const usedFirst = new Set<string>();
  const usedLast  = new Set<string>();
  const pickUniqueName = (used: Set<string>, picker: () => string): string => {
    let name = picker();
    let attempts = 0;
    while (used.has(name) && attempts < 20) {
      name = picker();
      attempts++;
    }
    used.add(name);
    return name;
  };

  const players: Player[] = slots.map(([pos, num], idx) => ({
    id: uid(),
    firstName: pickUniqueName(usedFirst, randomFirstName),
    lastName:  pickUniqueName(usedLast,  randomLastName),
    number:    num,
    position:  pos,
    ratings:   makeScaledRatings(pos, opponent.overall),
    year:      assignYear(idx),
    morale:    80 + rand(-5, 10),
    potential: 50 + rand(0, 40),
  }));

  return {
    id: opponent.id,
    name: opponent.name,
    nickname: opponent.nickname ?? opponent.name,
    abbreviation: opponent.abbreviation,
    primaryColor: opponent.primaryColor,
    secondaryColor: opponent.secondaryColor,
    roster: players,
    lineup: players.slice(0, 5).map((p) => p.id) as Lineup,
    chemistry: rand(45, 82),
    region: opponent.region,
  };
}

export function createInitialSeason(
  userTeam: Team,
  coach: Coach,
  settings: GameSettings
): Season {
  const confName = CONFERENCES[Math.floor(Math.random() * CONFERENCES.length)];
  return {
    year: 2026,
    coach,
    team: userTeam,
    schedule: [],
    record: { wins: 0, losses: 0 },
    conferenceRecord: { wins: 0, losses: 0 },
    prestige: 60,
    conferenceName: confName,
    currentGameIndex: 0,
    seasonStats: {},
    gamesPlayedWithStats: 0,
    budget: 5000,
    nilCollectiveLevel: 0,
    rank: null,
    top25: [],
    recruitingClassRank: null,
    recruitingClassRating: 0,
    gamePlan: {
      pace: "balanced",
      focus: "balanced",
      defensiveIntensity: "neutral",
    },
    recruitingPoints: 100,
    nilBudget: 50000,
    history: [],
    postseasonStatus: null,
    jobOffers: [],
    news: [],
    tournaments: [],
  };
}

export function generateConferenceTournament(confName: string, teams: Team[]): import("../types").Tournament {
  // Sort teams by record (simulated for AI teams as random or prestige-based)
  const seeded = [...teams].sort((a, b) => b.chemistry - a.chemistry); // Placeholder logic
  
  const round1: import("../types").TournamentRound = {
    name: "Semi-Finals",
    games: [
      { id: `conf_${confName}_sf1`, homeTeam: seeded[0], awayTeam: seeded[3], homeSeed: 1, awaySeed: 4 },
      { id: `conf_${confName}_sf2`, homeTeam: seeded[1], awayTeam: seeded[2], homeSeed: 2, awaySeed: 3 },
    ]
  };

  const round2: import("../types").TournamentRound = {
    name: "Championship",
    games: [
      { id: `conf_${confName}_f`, homeTeam: null, awayTeam: null }
    ]
  };

  return {
    id: `tourney_${confName}`,
    name: `${confName} Tournament`,
    type: "conference",
    teams: seeded,
    bracket: { rounds: [round1, round2] },
    currentRound: 0
  };
}

export function generateMainTournament(allTeams: Team[]): import("../types").Tournament {
  // Take top 64 teams by overall rating (simulating resume)
  const seeded = [...allTeams]
    .sort((a, b) => computeTeamOverall(b) - computeTeamOverall(a))
    .slice(0, 64);

  const rounds: import("../types").TournamentRound[] = [];
  const roundNames = ["Round of 64", "Round of 32", "Sweet 16", "Elite 8", "Final Four", "Championship"];
  
  let teamCount = 64;
  for (let i = 0; i < roundNames.length; i++) {
    const gamesCount = teamCount / 2;
    const games: import("../types").TournamentGame[] = [];
    
    for (let j = 0; j < gamesCount; j++) {
      games.push({
        id: `main_r${i}_g${j}`,
        homeTeam: i === 0 ? seeded[j] : null,
        awayTeam: i === 0 ? seeded[teamCount - 1 - j] : null,
        homeSeed: i === 0 ? j + 1 : undefined,
        awaySeed: i === 0 ? teamCount - j : undefined,
      });
    }
    
    rounds.push({ name: roundNames[i], games });
    teamCount /= 2;
  }

  return {
    id: "tourney_main",
    name: "National Championship",
    type: "main",
    teams: seeded,
    bracket: { rounds },
    currentRound: 0
  };
}

export function generateInvitationalTournament(allTeams: Team[]): import("../types").Tournament {
  // Take the next 32 teams after the top 64
  const seeded = [...allTeams]
    .sort((a, b) => computeTeamOverall(b) - computeTeamOverall(a))
    .slice(64, 96);

  const rounds: import("../types").TournamentRound[] = [];
  const roundNames = ["Round of 32", "Sweet 16", "Elite 8", "Final Four", "Championship"];
  
  let teamCount = 32;
  for (let i = 0; i < roundNames.length; i++) {
    const gamesCount = teamCount / 2;
    const games: import("../types").TournamentGame[] = [];
    
    for (let j = 0; j < gamesCount; j++) {
      games.push({
        id: `inv_r${i}_g${j}`,
        homeTeam: i === 0 ? seeded[j] : null,
        awayTeam: i === 0 ? seeded[teamCount - 1 - j] : null,
        homeSeed: i === 0 ? j + 1 : undefined,
        awaySeed: i === 0 ? teamCount - j : undefined,
      });
    }
    
    rounds.push({ name: roundNames[i], games });
    teamCount /= 2;
  }

  return {
    id: "tourney_inv",
    name: "Secondary Invitational",
    type: "invitational",
    teams: seeded,
    bracket: { rounds },
    currentRound: 0
  };
}

export function generateJobOffers(coach: Coach, currentTeamId: string): import("../types").JobOffer[] {
  const offers: import("../types").JobOffer[] = [];
  const totalGames = coach.careerWins + coach.careerLosses;
  const winPct = totalGames > 0 ? coach.careerWins / totalGames : 0;
  
  // Calculate Coach Prestige (0-100)
  // Factors: Level, Win %, Titles (simulated for now by high win pct seasons), and longevity
  const careerScore = (coach.level * 8) + (winPct * 40) + (Math.min(10, coach.history.length) * 2);
  const coachPrestige = Math.max(10, Math.min(99, careerScore));

  const currentTeam = AVAILABLE_TEAMS.find(t => t.id === currentTeamId);
  const availablePool = AVAILABLE_TEAMS.filter(t => t.id !== currentTeamId);
  
  // Sort pool by prestige to find appropriate tiers
  const elitePool = availablePool.filter(t => t.overall > 82); // Powerhouses
  const majorPool = availablePool.filter(t => t.overall >= 74 && t.overall <= 82); // Solid programs
  const midPool = availablePool.filter(t => t.overall < 74); // Mid-majors/Rebuilds

  // Tier 1: Elite Offers (Only for high prestige coaches)
  if (coachPrestige > 75) {
    const target = elitePool[rand(0, elitePool.length - 1)];
    if (target) {
      offers.push({
        id: `job_${target.id}_${Date.now()}`,
        teamId: target.id,
        teamName: target.name,
        prestige: target.overall,
        salary: 1200000 + (coach.level * 200000),
        nilBudget: 80000 + (target.overall * 2000),
        recruitingBudget: 300 + (target.overall * 5),
        expectations: "National Contender"
      });
    }
  }

  // Tier 2: Moving Up (Coach prestige exceeds current team prestige)
  if (coachPrestige > (currentTeam?.overall ?? 0) + 5) {
    const upwardPool = majorPool.filter(t => t.overall > (currentTeam?.overall ?? 0));
    const target = upwardPool[rand(0, upwardPool.length - 1)];
    if (target) {
      offers.push({
        id: `job_${target.id}_${Date.now()}_up`,
        teamId: target.id,
        teamName: target.name,
        prestige: target.overall,
        salary: 600000 + (coach.level * 100000),
        nilBudget: 40000 + (target.overall * 1000),
        recruitingBudget: 200 + (target.overall * 2),
        expectations: "Win Conference"
      });
    }
  }

  // Tier 3: Geographic/Lateral Moves (Programs in the same region looking for stability)
  if (currentTeam) {
    const regionalPool = availablePool.filter(t => t.region === currentTeam.region && Math.abs(t.overall - currentTeam.overall) < 10);
    const target = regionalPool[rand(0, regionalPool.length - 1)];
    if (target && !offers.some(o => o.teamId === target.id)) {
      offers.push({
        id: `job_${target.id}_${Date.now()}_reg`,
        teamId: target.id,
        teamName: target.name,
        prestige: target.overall,
        salary: 300000 + (coach.level * 50000),
        nilBudget: 20000 + (target.overall * 500),
        recruitingBudget: 150 + (target.overall * 1),
        expectations: target.overall > 75 ? "Compete" : "Rebuild"
      });
    }
  }

  // Ensure at least one fallback offer for decent coaches
  if (offers.length === 0 && coachPrestige > 30) {
    const target = midPool[rand(0, midPool.length - 1)];
    if (target) {
      offers.push({
        id: `job_${target.id}_fallback`,
        teamId: target.id,
        teamName: target.name,
        prestige: target.overall,
        salary: 150000 + (coach.level * 25000),
        nilBudget: 15000,
        recruitingBudget: 100,
        expectations: "Rebuild"
      });
    }
  }

  return offers;
}

export function setupUserTeam(t: Omit<Team, "roster" | "lineup">, overall = 75): Team {
  return makeTeam(t.name, t.nickname, t.abbreviation, t.primaryColor, t.secondaryColor, t.region, overall);
}

function makeTeam(name: string, nickname: string, abbrev: string, primary: string, secondary: string, region: string, overall: number): Team {
  const slots: [PlayerPosition, number][] = [["PG", 1], ["SG", 2], ["SF", 3], ["PF", 4], ["C", 5], ["PG", 11], ["SG", 12], ["SF", 13]];
  const roster = slots.map(([pos, num], idx) => ({
    id: uid(),
    firstName: randomFirstName(),
    lastName: randomLastName(),
    number: num,
    position: pos,
    ratings: makeScaledRatings(pos, overall),
    year: assignYear(idx),
    morale: 80,
    potential: 50,
    archetype: pickArchetype(pos),
    traits: [],
    heightInches: randomHeight(pos),
    skinTone: pickSkinTone(),
    hairColor: pickHairColor(),
  }));
  return {
    id: `opp_${uid()}`,
    name,
    nickname,
    abbreviation: abbrev,
    primaryColor: primary,
    secondaryColor: secondary,
    roster,
    lineup: roster.slice(0, 5).map(p => p.id) as Lineup,
    chemistry: 70,
    region: region as any,
  };
}

export function computeTeamOverall(team: Team): number {
  const n = team.roster.length || 1;
  const sum = team.roster.reduce((acc, p) => {
    const { speed, shooting, passing, defense, rebounding } = p.ratings;
    return acc + (speed + shooting + passing + defense + rebounding) / 5;
  }, 0);
  return Math.round(sum / n);
}

export function createDefaultSeason(): Season {
  const schedule: SeasonGame[] = [];
  let week = 1;

  SEASON_OPPONENTS.slice(0, 4).forEach((opp, i) => {
    schedule.push({
      id: `game_nc_${i + 1}`,
      week: week++,
      isHome: i % 2 === 0,
      opponent: opp,
      result: null,
      userScore: null,
      opponentScore: null,
      gameType: "non-conf",
    });
  });

  CONF_OPPONENTS.forEach((opp, i) => {
    schedule.push({
      id: `game_conf_${i + 1}`,
      week: week++,
      isHome: i % 2 === 0,
      opponent: opp,
      result: null,
      userScore: null,
      opponentScore: null,
      gameType: "conf",
    });
  });

  const titleOpponent = [...CONF_OPPONENTS].sort((a, b) => b.overall - a.overall)[0];
  schedule.push({
    id: "game_conf_title",
    week: week,
    isHome: false,
    opponent: titleOpponent,
    result: null,
    userScore: null,
    opponentScore: null,
    gameType: "conf-title",
  });

  return {
    year: 2025,
    coach: defaultCoach,
    team: { ...defaultHomeTeam, name: "Pacific", nickname: "Blue Devils" },
    schedule,
    record: { wins: 0, losses: 0 },
    conferenceRecord: { wins: 0, losses: 0 },
    prestige: 60,
    conferenceName: "Big East",
    currentGameIndex: 0,
    seasonStats: {},
    gamesPlayedWithStats: 0,
    budget: 1250,
    nilCollectiveLevel: 0,
    rank: null,
    top25: generateTop25(defaultHomeTeam, [...SEASON_OPPONENTS, ...CONF_OPPONENTS]),
    gamePlan: {
      pace: "balanced",
      focus: "balanced",
      defensiveIntensity: "neutral",
    },
    recruitingPoints: 100,
    nilBudget: 50000,
    history: [],
    postseasonStatus: null,
    news: [{
      id: "news_start",
      week: 0,
      category: "program",
      headline: `${defaultCoach.firstName} ${defaultCoach.lastName} begins ${new Date().getFullYear()} campaign`,
      detail: "Season tips off. The journey to a conference title begins today.",
      tone: "neutral",
    }],
  };
}

const REGIONS = ["West", "Midwest", "East", "South"] as const;
const POSITIONS: PlayerPosition[] = ["PG", "SG", "SF", "PF", "C"];
const ELITE_PROSPECT_MIN_RATING = 84;
const ELITE_PROSPECT_MAX_RATING = 96;
const STANDARD_PROSPECT_MIN_RATING = 52;
const STANDARD_PROSPECT_MAX_RATING = 83;
const MIN_RECRUITING_CLASS_SIZE = 3;
const RECRUITING_POOL_BUFFER = 12;
const MIN_SCOUTING_POINTS = 3;
const RECRUITING_TO_SCOUTING_DIVISOR = 15;

export function generateProspects(
  prestige: number,
  recruiting: number,
  teamRegion: string,
  count = 30
): Prospect[] {
  const prospects: Prospect[] = [];
  const prestigeFactor = prestige / 100;
  const recruitingFactor = recruiting / 100;
  const positionWeights = [2, 2, 2, 2, 1];

  for (let i = 0; i < count; i++) {
    const totalWeight = positionWeights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    let posIdx = 0;
    for (let j = 0; j < positionWeights.length; j++) {
      roll -= positionWeights[j];
      if (roll <= 0) { posIdx = j; break; }
    }
    const position = POSITIONS[posIdx];
    const eliteChance = 0.05 + prestigeFactor * 0.15 + recruitingFactor * 0.10;
    let rating: number;
    if (Math.random() < eliteChance) {
      rating = rand(ELITE_PROSPECT_MIN_RATING, ELITE_PROSPECT_MAX_RATING);
    } else {
      rating = rand(STANDARD_PROSPECT_MIN_RATING, STANDARD_PROSPECT_MAX_RATING);
    }
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const regionBias = region === teamRegion ? 0.12 : 0;
    const baseInterest = 0.35 + prestigeFactor * 0.40;
    const ratingPenalty = Math.max(0, (rating - 75) / 100) * 0.25;
    const interestLevel = Math.max(0.10, Math.min(0.95, baseInterest - ratingPenalty + regionBias + (Math.random() - 0.5) * 0.20));

    const pot = rating + rand(-5, 20);
    const potentialRange: [number, number] = [Math.max(0, pot - 15), Math.min(100, pot + 15)];

    prospects.push({
      id: uid(),
      firstName: randomFirstName(),
      lastName: randomLastName(),
      position,
      rating,
      scouted: false,
      region,
      interestLevel,
      offered: false,
      committed: false,
      potentialRange,
      archetype: pickArchetype(position),
      traits: pickTraits(position),
      heightInches: randomHeight(position),
      skinTone: pickSkinTone(),
      hairColor: pickHairColor(),
      nilOffer: 0,
    });
  }
  return prospects;
}

export function makeOpponents(count: number): SeasonOpponent[] {
  const opps: SeasonOpponent[] = [];
  const names = ["State", "Central", "Western", "North", "Coast", "Tech", "Valley", "Lakes", "Southern", "East"];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length] + (Math.random() > 0.5 ? " Univ" : "");
    const nickname = NICKNAMES[rand(0, NICKNAMES.length - 1)];
    opps.push({
      id: `opp_${i}`,
      name,
      nickname,
      abbreviation: (name.substring(0, 1) + nickname.substring(0, 2)).toUpperCase(),
      primaryColor: `hsl(${rand(0, 360)}, 70%, 50%)`,
      secondaryColor: "#ffffff",
      overall: rand(65, 88),
      region: REGIONS[rand(0, 3)],
    });
  }
  return opps;
}

export function developAndAdvancePlayer(player: Player, coachDevelopment: number): Player | null {
  if (player.year === 4) return null;
  const devFactor = coachDevelopment / 100;
  const potFactor = player.potential / 100;

  // Improvement is larger for younger players and capped by potential.
  const yearFactor = (4 - player.year) / 3; 
  const improvementBase = Math.round(yearFactor * devFactor * potFactor * 9);

  const improve = (val: number): number => Math.min(99, val + improvementBase + Math.round((Math.random() - 0.2) * 3));
  return {
    ...player,
    year: (player.year + 1) as 2 | 3 | 4,
    ratings: {
      speed: improve(player.ratings.speed),
      shooting: improve(player.ratings.shooting),
      passing: improve(player.ratings.passing),
      defense: improve(player.ratings.defense),
      rebounding: improve(player.ratings.rebounding),
      endurance: improve(player.ratings.endurance),
    },
    morale: Math.min(100, player.morale + rand(-5, 10)),
  };
}

export function prospectToPlayer(prospect: Prospect, number: number): Player {
  return {
    id: uid(),
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    number,
    position: prospect.position,
    year: 1,
    ratings: {
      speed: prospect.rating,
      shooting: prospect.rating,
      passing: prospect.rating,
      defense: prospect.rating,
      rebounding: prospect.rating,
      endurance: prospect.rating,
    },
    morale: 85 + rand(-2, 5),
    potential: prospect.rating + rand(-5, 15),
    archetype: prospect.archetype,
    traits: prospect.traits,
  };
}

export function generateTop25(userTeam: Team, opponents: SeasonOpponent[]): import("../types").RankingEntry[] {
  const allTeams = [userTeam, ...opponents];
  return allTeams
    .map((t) => {
      const overall = (t as any).overall ?? computeTeamOverall(t as Team);
      const winPct = t.id === userTeam.id ? 0 : 0.5 + (Math.random() - 0.5) * 0.2;
      const votes = Math.round((overall - 60) * 15 + winPct * 300 + (Math.random() - 0.5) * 50);
      return {
        teamId: t.id,
        name: t.name,
        nickname: (t as any).nickname,
        abbreviation: t.abbreviation,
        overall,
        record: { wins: 0, losses: 0 },
        votes,
      };
    })
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 25);
}
