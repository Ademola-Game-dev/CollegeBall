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
function rand(min: number, max: number): number {
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

const SEASON_OPPONENTS: SeasonOpponent[] = [
  { id: "opp_1",  name: "Riverside",   nickname: "Hawks",     abbreviation: "RVH", primaryColor: "#7c3aed", secondaryColor: "#ffffff", overall: 68, region: "West" },
  { id: "opp_2",  name: "Eastern",     nickname: "Eagles",    abbreviation: "EWE", primaryColor: "#0369a1", secondaryColor: "#fbbf24", overall: 72, region: "East" },
  { id: "opp_3",  name: "Summit",      nickname: "Wolves",    abbreviation: "SMW", primaryColor: "#047857", secondaryColor: "#ffffff", overall: 76, region: "West" },
  { id: "opp_4",  name: "Lakewood",    nickname: "Lions",     abbreviation: "LWL", primaryColor: "#b45309", secondaryColor: "#ffffff", overall: 71, region: "Midwest" },
  { id: "opp_5",  name: "Northern",    nickname: "Rams",      abbreviation: "NGR", primaryColor: "#be123c", secondaryColor: "#f1f5f9", overall: 80, region: "South" },
  { id: "opp_6",  name: "Coastal",     nickname: "Cougars",   abbreviation: "CWC", primaryColor: "#0f766e", secondaryColor: "#ffffff", overall: 74, region: "Midwest" },
  { id: "opp_7",  name: "Midland",     nickname: "Falcons",   abbreviation: "MDF", primaryColor: "#6d28d9", secondaryColor: "#fbbf24", overall: 78, region: "South" },
  { id: "opp_8",  name: "Hillside",    nickname: "Spartans",  abbreviation: "HLS", primaryColor: "#1e3a8a", secondaryColor: "#e2e8f0", overall: 69, region: "East" },
  { id: "opp_9",  name: "Western",     nickname: "Bears",     abbreviation: "WBB", primaryColor: "#92400e", secondaryColor: "#ffffff", overall: 83, region: "West" },
  { id: "opp_10", name: "Pinewood",    nickname: "Panthers",  abbreviation: "PWP", primaryColor: "#1f2937", secondaryColor: "#10b981", overall: 65, region: "East" },
];

const CONF_OPPONENTS: SeasonOpponent[] = [
  { id: "conf_1", name: "Bay State",   nickname: "Huskies",   abbreviation: "BSH", primaryColor: "#1e3a8a", secondaryColor: "#f8fafc", overall: 72, region: "East" },
  { id: "conf_2", name: "Hartwick",    nickname: "Colonials", abbreviation: "HTC", primaryColor: "#7c2d12", secondaryColor: "#fef3c7", overall: 76, region: "East" },
  { id: "conf_3", name: "Northfield",  nickname: "Knights",   abbreviation: "NHK", primaryColor: "#064e3b", secondaryColor: "#d1fae5", overall: 74, region: "East" },
  { id: "conf_4", name: "Providence",  nickname: "Friars",    abbreviation: "PRV", primaryColor: "#1c1917", secondaryColor: "#f1f5f9", overall: 79, region: "East" },
  { id: "conf_5", name: "Kingston",    nickname: "Rams",      abbreviation: "KGR", primaryColor: "#7c3aed", secondaryColor: "#ede9fe", overall: 70, region: "East" },
  { id: "conf_6", name: "Albright",    nickname: "Monarchs",  abbreviation: "ALB", primaryColor: "#065f46", secondaryColor: "#d1fae5", overall: 77, region: "East" },
  { id: "conf_7", name: "Lakewell",    nickname: "Chargers",  abbreviation: "LWC", primaryColor: "#c2410c", secondaryColor: "#fef3c7", overall: 73, region: "East" },
  { id: "conf_8", name: "Bluemont",    nickname: "Bears",     abbreviation: "BLB", primaryColor: "#0369a1", secondaryColor: "#f0f9ff", overall: 68, region: "East" },
];

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
