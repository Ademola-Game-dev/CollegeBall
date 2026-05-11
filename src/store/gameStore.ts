/**
 * Central game state store powered by Zustand.
 *
 * This is the single source of truth that React UI reads from.
 * The simulation engine writes to it each tick via `applySimState`.
 * UI controls (play/pause, speed) also mutate it directly.
 */

import { create } from "zustand";
import type {
  Screen,
  GameSpeed,
  SimStatus,
  Team,
  ScoreState,
  GameClock,
  ShotClock,
  Possession,
  SimulationState,
  GameSettings,
  SimPlayer,
  CameraMode,
  PlayerGameStats,
  MatchPhase,
  SimEvent,
  Season,
  SeasonGame,
  Prospect,
} from "../game/types";
import {
  defaultHomeTeam,
  defaultAwayTeam,
  defaultGameSettings,
  createDefaultSeason,
  makeOpponentTeam,
  computeTeamOverall,
  generateProspects,
  developAndAdvancePlayer,
  prospectToPlayer,
  generateTop25,
} from "../game/data/defaults";

// ---------------------------------------------------------------------------
// Recruiting constants (ported from CFHC's off-season flow)
// ---------------------------------------------------------------------------

/** Minimum number of prospects offered slots each recruiting cycle. */
const MIN_RECRUITING_CLASS_SIZE = 3;
/** How many extra prospects to add to the pool beyond the open-spots count. */
const RECRUITING_POOL_BUFFER = 12;
/** Minimum scouting points a coach with any recruiting rating will have. */
const MIN_SCOUTING_POINTS = 3;
/** Divisor mapping coach recruiting rating (0â€“100) â†’ scouting points. */
const RECRUITING_TO_SCOUTING_DIVISOR = 15;

export interface GameStore {
  // ---- Navigation ----
  screen: Screen;
  setScreen: (s: Screen) => void;
  isPauseMenuOpen: boolean;
  openPauseMenu: () => void;
  closePauseMenu: () => void;
  togglePauseMenu: () => void;
  returnToMainMenu: () => void;

  // ---- Teams ----
  homeTeam: Team;
  awayTeam: Team;

  // ---- Settings ----
  settings: GameSettings;

  // ---- Simulation control ----
  simStatus: SimStatus;
  gameSpeed: GameSpeed;
  cameraMode: CameraMode;
  setSimStatus: (s: SimStatus) => void;
  setGameSpeed: (s: GameSpeed) => void;
  setCameraMode: (m: CameraMode) => void;

  // ---- Live game state (written by sim each tick) ----
  score: ScoreState;
  gameClock: GameClock;
  shotClock: ShotClock;
  possession: Possession;
  simPlayers: SimPlayer[];
  ballPosition: { x: number; y: number };
  ballHeight: number;
  shotInFlight: boolean;
  /** Per-team foul count for the current half. */
  teamFouls: { home: number; away: number };
  /** Per-player game statistics accumulated across the full game. */
  playerStats: Record<string, PlayerGameStats>;
  /** The current phase of the match (e.g. PRE_GAME, IN_PLAY, FULL_TIME). */
  phase: MatchPhase;
  /** Current overtime period: 0 = regulation, 1 = first OT, 2 = second OT, â€¦ */
  overtimePeriod: number;
  /** Raw sim events emitted on the latest tick. */
  latestEvents: SimEvent[];

  // ---- Actions ----
  /** Initialise a new exhibition game with default data. */
  startExhibition: () => void;
  /** Apply the latest simulation snapshot to the store. */
  applySimState: (state: SimulationState) => void;

  // ---- Season / Head Coach mode ----
  /** Active season (null when not in season mode). */
  season: Season | null;
  /** Whether the current in-progress game belongs to a season or is a standalone exhibition. */
  gameContext: "exhibition" | "season";
  /** Start a new default season and navigate to the season hub. */
  startSeason: () => void;
  /** Launch the next scheduled season game in the 3D engine. */
  playSeasonGame: () => void;
  /** Instantly resolve the next scheduled season game without 3D rendering. */
  simulateSeasonGame: () => void;
  /** Record the result of the just-finished season game and return to the season hub. */
  returnToSeasonHub: () => void;
  /**
   * Advance to the next season: graduate seniors, develop returning players, and
   * enter the recruiting screen. Ported from CFHC's `advanceSeason` flow.
   */
  advanceSeason: () => void;

  // ---- Recruiting (off-season) ----
  /** Available incoming-class prospects for the current recruiting cycle. */
  prospects: Prospect[];
  /** Scouting points remaining this off-season (used to reveal prospect ratings). */
  scoutingPoints: number;
  /** Scout a prospect (costs 1 point; reveals true rating). */
  scoutProspect: (prospectId: string) => void;
  /** Offer a scholarship to a prospect. */
  offerProspect: (prospectId: string) => void;
  /**
   * with the refreshed roster and a new season schedule.
   */
  finishRecruiting: () => void;
  /** Upgrade the team's NIL collective level (costs budget). */
  upgradeNILCollective: () => void;
  /** Upgrade a coach rating using an available skill point. */
  upgradeCoach: (stat: "offense" | "defense" | "recruiting" | "development") => void;
  /** Update the team's tactical game plan. */
  updateGamePlan: (plan: Partial<import("../game/types").GamePlan>) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Navigation
  screen: "menu",
  setScreen: (screen) => set({ screen }),
  isPauseMenuOpen: false,
  openPauseMenu: () =>
    set((state) => ({
      isPauseMenuOpen: state.simStatus !== "finished",
      simStatus: state.simStatus === "running" ? "paused" : state.simStatus,
    })),
  closePauseMenu: () =>
    set((state) => ({
      isPauseMenuOpen: false,
      simStatus: state.simStatus === "paused" ? "running" : state.simStatus,
    })),
  togglePauseMenu: () =>
    set((state) => {
      if (state.simStatus !== "running" && state.simStatus !== "paused") {
        return state;
      }

      const nextOpen = !state.isPauseMenuOpen;
      return {
        isPauseMenuOpen: nextOpen,
        simStatus:
          state.simStatus === "running" && nextOpen
            ? "paused"
            : state.simStatus === "paused" && !nextOpen
            ? "running"
            : state.simStatus,
      };
    }),
  returnToMainMenu: () =>
    set({
      screen: "menu",
      simStatus: "idle",
      isPauseMenuOpen: false,
      score: { home: 0, away: 0 },
      teamFouls: { home: 0, away: 0 },
      playerStats: {},
      phase: "PRE_GAME" as MatchPhase,
      overtimePeriod: 0,
      latestEvents: [],
      gameClock: {
        remaining: defaultGameSettings.halfLength,
        half: 1,
        running: false,
      },
      shotClock: {
        remaining: defaultGameSettings.shotClockLength,
        running: false,
      },
      possession: {
        team: "home",
        ballHandlerId: defaultHomeTeam.lineup[0],
      },
      simPlayers: [],
      ballPosition: { x: 0, y: 0 },
      ballHeight: 0,
      shotInFlight: false,
    }),

  // Teams
  homeTeam: defaultHomeTeam,
  awayTeam: defaultAwayTeam,

  // Settings
  settings: defaultGameSettings,

  // Simulation control
  simStatus: "idle",
  gameSpeed: 1,
  cameraMode: "broadcast" as CameraMode,
  setSimStatus: (simStatus) => set({ simStatus }),
  setGameSpeed: (gameSpeed) => set({ gameSpeed }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  score: { home: 0, away: 0 },
  gameClock: { remaining: defaultGameSettings.halfLength, half: 1, running: false },
  shotClock: { remaining: defaultGameSettings.shotClockLength, running: false },
  possession: { team: "home", ballHandlerId: null },
  simPlayers: [],
  ballPosition: { x: 0, y: 0 },
  ballHeight: 0,
  shotInFlight: false,
  teamFouls: { home: 0, away: 0 },
  playerStats: {},
  phase: "PRE_GAME" as MatchPhase,
  overtimePeriod: 0,
  latestEvents: [],

  // Season / Head Coach mode initial state
  season: null,
  gameContext: "exhibition" as "exhibition" | "season",

  // Recruiting initial state
  prospects: [],
  scoutingPoints: 0,

  // Actions
  startExhibition: () =>
    set({
      latestEvents: [],
      gameClock: {
        remaining: defaultGameSettings.halfLength,
        half: 1,
        running: false,
      },
      shotClock: {
        remaining: defaultGameSettings.shotClockLength,
        running: false,
      },
      possession: {
        team: "home",
        ballHandlerId: defaultHomeTeam.lineup[0],
      },
      simPlayers: [],
      ballPosition: { x: 0, y: 0 },
      ballHeight: 3.5,
      shotInFlight: false,
    }),

  applySimState: (state) =>
    set({
      score: state.score,
      gameClock: state.gameClock,
      shotClock: state.shotClock,
      possession: state.possession,
      simPlayers: state.players,
      ballPosition: state.ballPosition,
      ballHeight: state.ballHeight,
      shotInFlight: state.shotInFlight,
      teamFouls: state.teamFouls,
      playerStats: state.playerStats,
      phase: state.phase,
      overtimePeriod: state.overtimePeriod,
      latestEvents: state.events,
    }),

  // Season / Head Coach mode
  startSeason: () =>
    set({ season: createDefaultSeason(), screen: "season" }),

  playSeasonGame: () =>
    set((state) => {
      const { season } = state;
      if (!season) return state;
      const game = season.schedule[season.currentGameIndex];
      if (!game || game.result !== null) return state;

      const opponentTeam = makeOpponentTeam(game.opponent);

      return {
        homeTeam: season.team,
        awayTeam: opponentTeam,
        settings: {
          ...defaultGameSettings,
          homeCourtBonus: game.isHome,
          coachOffense: season.coach.offense,
          coachDefense: season.coach.defense,
          gamePlan: season.gamePlan,
        },
        screen: "game" as Screen,
        simStatus: "running" as SimStatus,
        gameContext: "season" as "exhibition" | "season",
        isPauseMenuOpen: false,
        score: { home: 0, away: 0 },
        teamFouls: { home: 0, away: 0 },
        playerStats: {},
        phase: "PRE_GAME" as MatchPhase,
        overtimePeriod: 0,
        latestEvents: [],
        gameClock: {
          remaining: defaultGameSettings.halfLength,
          half: 1,
          running: false,
        },
        shotClock: {
          remaining: defaultGameSettings.shotClockLength,
          running: false,
        },
        possession: {
          team: "home" as const,
          ballHandlerId: season.team.lineup[0],
        },
        simPlayers: [],
        ballPosition: { x: 0, y: 0 },
        ballHeight: 3.5,
        shotInFlight: false,
      };
    }),

  simulateSeasonGame: () =>
    set((state) => {
      const { season } = state;
      if (!season) return state;
      const idx = season.currentGameIndex;
      const game = season.schedule[idx];
      if (!game || game.result !== null) return state;

      // Quick statistical sim based on relative team quality and program prestige.
      // Adapted from CFHC's statistical sim: prestige provides a small home-court
      // advantage and overall quality gap determines score spread.
      const userOverall = computeTeamOverall(season.team);
      const prestigeBonus = game.isHome ? (season.prestige / 100) * 4 : 0;
      const paceFactor = season.gamePlan.pace === "fast" ? 1.12 : season.gamePlan.pace === "slow" ? 0.88 : 1.0;
      const baseline = 63;
      const spread = 18;
      const userScore = Math.round(
        (baseline + (userOverall / 100) * spread + prestigeBonus + (Math.random() - 0.5) * 14) * paceFactor
      );
      const oppScore = Math.round(
        (baseline + (game.opponent.overall / 100) * spread + (Math.random() - 0.5) * 14) * paceFactor
      );
      const result: "win" | "loss" = userScore > oppScore ? "win" : "loss";

      const isConfGame = game.gameType === "conf" || game.gameType === "conf-title";

      const newSchedule = season.schedule.map((g, i) =>
        i === idx ? { ...g, result, userScore, opponentScore: oppScore } : g
      );

      const newRecord = {
        wins:   season.record.wins   + (result === "win"  ? 1 : 0),
        losses: season.record.losses + (result === "loss" ? 1 : 0),
      };

      const newsItem: import("../game/types").NewsItem = generateGameNewsItem(
        game, result, userScore, oppScore, newRecord, idx + 1
      );

      return {
        season: {
          ...season,
          schedule: newSchedule,
          record: newRecord,
          conferenceRecord: isConfGame ? {
            wins:   season.conferenceRecord.wins   + (result === "win"  ? 1 : 0),
            losses: season.conferenceRecord.losses + (result === "loss" ? 1 : 0),
          } : season.conferenceRecord,
          currentGameIndex: idx + 1,
          budget: season.budget + calculatePostGameRevenue(season, game, result),
          coach: updateCoachProgression(
            {
              ...season.coach,
              careerWins: season.coach.careerWins + (result === "win" ? 1 : 0),
              careerLosses: season.coach.careerLosses + (result === "loss" ? 1 : 0),
            },
            calculateCoachXP(season, result, game.opponent.overall)
          ),
          ...calculateRankingsUpdate(season, result),
          news: [newsItem, ...(season.news ?? [])].slice(0, 50),
        },
      };
    }),

  returnToSeasonHub: () =>
    set((state) => {
      const { season } = state;
      if (!season) {
        return {
          screen: "menu" as Screen,
          simStatus: "idle" as SimStatus,
          isPauseMenuOpen: false,
        };
      }

      // Record the result of the just-played game when returning from the 3D engine
      let updatedSeason = season;
      if (state.gameContext === "season" && state.simStatus === "finished") {
        const idx = season.currentGameIndex;
        const game = season.schedule[idx];
        if (game && game.result === null) {
          // User's team is always homeTeam in playSeasonGame
          const userScore = state.score.home;
          const opponentScore = state.score.away;
          const result: "win" | "loss" = userScore >= opponentScore ? "win" : "loss";

          // Merge this game's player stats into the cumulative season stats
          const prevSeasonStats = season.seasonStats ?? {};
          const mergedStats: Record<string, import("../game/types").PlayerGameStats> = { ...prevSeasonStats };
          for (const [playerId, stats] of Object.entries(state.playerStats)) {
            const gameStats = stats as import("../game/types").PlayerGameStats;
            const prev = mergedStats[playerId];
            if (!prev) {
              mergedStats[playerId] = { ...gameStats };
            } else {
              mergedStats[playerId] = {
                points:               prev.points               + gameStats.points,
                fieldGoalsMade:       prev.fieldGoalsMade       + gameStats.fieldGoalsMade,
                fieldGoalsAttempted:  prev.fieldGoalsAttempted  + gameStats.fieldGoalsAttempted,
                threesMade:           prev.threesMade           + gameStats.threesMade,
                threesAttempted:      prev.threesAttempted      + gameStats.threesAttempted,
                freeThrowsMade:       prev.freeThrowsMade       + gameStats.freeThrowsMade,
                freeThrowsAttempted:  prev.freeThrowsAttempted  + gameStats.freeThrowsAttempted,
                rebounds:             prev.rebounds             + gameStats.rebounds,
                assists:              prev.assists              + gameStats.assists,
                steals:               prev.steals               + gameStats.steals,
                turnovers:            prev.turnovers            + gameStats.turnovers,
                blocks:               prev.blocks               + gameStats.blocks,
                fouls:                prev.fouls                + gameStats.fouls,
                minutesPlayed:        prev.minutesPlayed        + gameStats.minutesPlayed,
              };
            }
          }

          updatedSeason = {
            ...season,
            schedule: season.schedule.map((g, i) =>
              i === idx ? { ...g, result, userScore, opponentScore } : g
            ),
            record: {
              wins:   season.record.wins   + (result === "win"  ? 1 : 0),
              losses: season.record.losses + (result === "loss" ? 1 : 0),
            },
            conferenceRecord: (game.gameType === "conf" || game.gameType === "conf-title") ? {
              wins:   season.conferenceRecord.wins   + (result === "win"  ? 1 : 0),
              losses: season.conferenceRecord.losses + (result === "loss" ? 1 : 0),
            } : season.conferenceRecord,
            currentGameIndex: idx + 1,
            seasonStats: mergedStats,
            gamesPlayedWithStats: (season.gamesPlayedWithStats ?? 0) + 1,
            budget: season.budget + calculatePostGameRevenue(season, game, result),
            coach: updateCoachProgression(
              {
                ...season.coach,
                careerWins: season.coach.careerWins + (result === "win" ? 1 : 0),
                careerLosses: season.coach.careerLosses + (result === "loss" ? 1 : 0),
              },
              calculateCoachXP(season, result, game.opponent.overall)
            ),
            ...calculateRankingsUpdate(season, result),
          };
        }
      }

      return {
        season:      updatedSeason,
        screen:      "season" as Screen,
        simStatus:   "idle" as SimStatus,
        gameContext: "exhibition" as "exhibition" | "season",
        isPauseMenuOpen: false,
        score:       { home: 0, away: 0 },
        teamFouls:   { home: 0, away: 0 },
        playerStats: {},
        phase:       "PRE_GAME" as MatchPhase,
        overtimePeriod: 0,
        latestEvents: [],
        gameClock: {
          remaining: defaultGameSettings.halfLength,
          half:      1,
          running:   false,
        },
        shotClock: {
          remaining: defaultGameSettings.shotClockLength,
          running:   false,
        },
        possession:  { team: "home" as const, ballHandlerId: null },
        simPlayers:  [],
        ballPosition: { x: 0, y: 0 },
        ballHeight:  0,
        shotInFlight: false,
      };
    }),

  /**
   * Advance to the next season:
   *  1. Graduate all seniors (year = 4) from the roster.
   *  2. Apply development gains to all returning players (year 1â€“3) using the
   *     coach's development rating â€” mirrors CFHC's `advanceSeason` logic.
   *  3. Adjust program prestige based on win %.
   *  4. Generate a fresh incoming-class prospect pool sized to fill open spots.
   *  5. Navigate to the recruiting screen.
   */
  advanceSeason: () =>
    set((state) => {
      const { season } = state;
      if (!season) return state;

      const { coach, team, record } = season;
      const totalGames = record.wins + record.losses;
      const winPct = totalGames > 0 ? record.wins / totalGames : 0;

      // 1 & 2: Develop and advance players; seniors return null (graduated)
      // Also handle transfers: players with low morale are likely to leave (OOTP style)
      const returnees = team.roster
        .map((p) => developAndAdvancePlayer(p, coach.development))
        .filter((p): p is NonNullable<typeof p> => p !== null);

      const afterTransfers = returnees.filter((p) => {
        const leaveChance = (100 - p.morale) / 250; // max ~25% chance to leave if morale is 35
        return Math.random() > leaveChance;
      });

      const graduatedCount = team.roster.length - returnees.length;
      const transferCount = returnees.length - afterTransfers.length;
      const openSpots = Math.max(graduatedCount + transferCount, MIN_RECRUITING_CLASS_SIZE);

      // 3: Update prestige â€” wins above .500 raise it, losses lower it
      const prestigeDelta = Math.round((winPct - 0.5) * 12);
      const newPrestige = Math.max(30, Math.min(99, season.prestige + prestigeDelta));

      // 4: Generate prospects. Scouting points scale with coach's recruiting rating.
      const prospectCount = openSpots + RECRUITING_POOL_BUFFER;
      const newProspects = generateProspects(newPrestige, coach.recruiting, team.region, prospectCount);
      const scoutingPoints = Math.max(MIN_SCOUTING_POINTS, Math.round(coach.recruiting / RECRUITING_TO_SCOUTING_DIVISOR));

      // Update lineup to only include returnees (trim if needed)
      const returneeIds = new Set(afterTransfers.map((p) => p.id));
      const newLineup = team.lineup
        .filter((id) => returneeIds.has(id))
        .slice(0, 5) as import("../game/types").Lineup;

      const updatedTeam = { ...team, roster: afterTransfers, lineup: newLineup };

      
      const postseasonStatus = (season.rank && season.rank <= 25) ? "The Tournament" : 
                               (winPct >= 0.55) ? "NIT Invitation" : "Home for March";

      const historyEntry: import("../game/types").SeasonHistory = {
        year: season.year,
        record: { ...season.record },
        prestige: season.prestige,
        recruitingRank: season.recruitingClassRank,
        postseason: postseasonStatus, // Need to add this to SeasonHistory too
      };

      // 5: Generate off-season news (transfers, graduations)
      const offSeasonNews: import("../game/types").NewsItem[] = [];
      if (graduatedCount > 0) {
        offSeasonNews.push({
          id: `news_grad_${season.year}_${Date.now()}`,
          week: 0,
          category: "recruiting",
          headline: `Senior Class Graduating`,
          detail: `${graduatedCount} player${graduatedCount !== 1 ? 's' : ''} have finished their eligibility and are moving on from the program.`,
          tone: "neutral",
        });
      }
      if (transferCount > 0) {
        offSeasonNews.push({
          id: `news_trans_${season.year}_${Date.now()}`,
          week: 0,
          category: "recruiting",
          headline: `Transfer Portal Impact`,
          detail: `${transferCount} player${transferCount !== 1 ? 's' : ''} have entered the transfer portal seeking new opportunities.`,
          tone: "negative",
        });
      }

      return {
        season: {
          ...season,
          team: updatedTeam,
          year: season.year + 1,
          prestige: newPrestige,
          recruitingClassRating: 0,
          recruitingClassRank: null,
          history: [...season.history, historyEntry],
          postseasonStatus: null,
          news: [...offSeasonNews, ...(season.news ?? [])].slice(0, 50),
        },
        prospects: newProspects,
        scoutingPoints,
        screen: "recruiting" as Screen,
      };
    }),

  // ---- Recruiting actions ----

  scoutProspect: (prospectId: string) =>
    set((state) => {
      if (state.scoutingPoints <= 0) return state;
      return {
        prospects: state.prospects.map((p) => {
          if (p.id === prospectId) {
            // Narrow the potential range (OOTP style)
            const center = (p.potentialRange[0] + p.potentialRange[1]) / 2;
            const narrowRange: [number, number] = [
              Math.max(0, Math.round(center - 3)),
              Math.min(100, Math.round(center + 3))
            ];
            return { ...p, scouted: true, potentialRange: narrowRange };
          }
          return p;
        }),
        scoutingPoints: state.scoutingPoints - 1,
      };
    }),

  offerProspect: (prospectId: string) =>
    set((state) => {
      const prospect = state.prospects.find((p) => p.id === prospectId);
      if (!prospect || prospect.offered) return state;

      // Prospect commits based on interest level
      const committed = Math.random() < prospect.interestLevel;
      return {
        prospects: state.prospects.map((p) =>
          p.id === prospectId ? { ...p, offered: true, committed } : p
        ),
      };
    }),

  /**
   * Finish recruiting: add committed prospects to the team roster, create a new
   * season schedule, and navigate back to the season hub.
   */
  finishRecruiting: () =>
    set((state) => {
      const { season, prospects } = state;
      if (!season) return state;

      const committed = prospects.filter((p) => p.committed);
      const roster = [...season.team.roster];

      // Assign jersey numbers to incoming freshmen (avoid collisions)
      const usedNumbers = new Set(roster.map((p) => p.number));
      let nextNum = 1;
      const getNum = (): number => {
        while (usedNumbers.has(nextNum)) nextNum++;
        usedNumbers.add(nextNum);
        return nextNum++;
      };

      for (const prospect of committed) {
        roster.push(prospectToPlayer(prospect, getNum()));
      }

      // Rebuild lineup: keep existing valid starters, then fill from new additions
      const existingLineupIds = new Set(season.team.lineup);
      const starters = season.team.lineup.filter((id) =>
        roster.some((p) => p.id === id)
      );
      const benchPool = roster.filter((p) => !existingLineupIds.has(p.id));
      const newLineup = [
        ...starters,
        ...benchPool.map((p) => p.id),
      ].slice(0, 5) as import("../game/types").Lineup;

      const updatedTeam = { ...season.team, roster, lineup: newLineup };

      // Build a fresh 13-game schedule from the default template, preserving
      // the current season's year, prestige, coach, and team.
      const templateSeason = createDefaultSeason();
      const templateSchedule = templateSeason.schedule;

      const classRating = committed.reduce((sum, p) => sum + p.rating, 0) / Math.max(1, committed.length);
      // Simplified rank: higher rating = lower (better) rank
      const classRank = Math.max(1, Math.min(100, Math.round(100 - (classRating - 60) * 2.5)));

      return {
        season: {
          ...season,
          team: updatedTeam,
          schedule: templateSchedule,
          record: { wins: 0, losses: 0 },
          conferenceRecord: { wins: 0, losses: 0 },
          currentGameIndex: 0,
          seasonStats: {},
          gamesPlayedWithStats: 0,
          rank: null,
          top25: generateTop25(updatedTeam, templateSchedule.map(g => g.opponent)),
          recruitingClassRating: Math.round(classRating),
          recruitingClassRank: classRank,
        },
        prospects: [],
        scoutingPoints: 0,
        screen: "season" as Screen,
      };
    }),

  upgradeCoach: (stat) =>
    set((state) => {
      const { season } = state;
      if (!season || season.coach.skillPoints <= 0) return state;

      const updatedCoach = {
        ...season.coach,
        skillPoints: season.coach.skillPoints - 1,
        [stat]: Math.min(99, season.coach[stat] + 3),
      };

      return {
        season: {
          ...season,
          coach: updatedCoach,
        },
      };
    }),

  updateGamePlan: (plan) =>
    set((state) => {
      const { season } = state;
      if (!season) return state;

      return {
        season: {
          ...season,
          gamePlan: {
            ...season.gamePlan,
            ...plan,
          },
        },
      };
    }),

  upgradeNILCollective: () =>
    set((state) => {
      const { season } = state;
      if (!season || season.nilCollectiveLevel >= 10) return state;
      const cost = 2500 + season.nilCollectiveLevel * 1500;
      if (season.budget < cost) return state;

      return {
        season: {
          ...season,
          budget: season.budget - cost,
          nilCollectiveLevel: season.nilCollectiveLevel + 1,
        },
      };
    }),
}));

/**
 * Calculate post-game revenue based on prestige, attendance, and result.
 * Ported from CFHC's team-budget and revenue logic.
 */
function calculatePostGameRevenue(
  season: Season,
  game: SeasonGame,
  result: "win" | "loss"
): number {
  const prestigeFactor = season.prestige / 100;
  // Attendance scales with prestige and opponent quality
  const attendance = Math.round(
    ((season.prestige * 2 + game.opponent.overall) / 3) * 85
  );
  const ticketPrice = 40;
  // Home games generate full ticket revenue; away games generate 15% (travel/payout)
  const ticketRevenue = game.isHome ? attendance * ticketPrice : attendance * ticketPrice * 0.15;
  const merchRevenue = attendance * (prestigeFactor * 12 + Math.random() * 8);
  const winBonus = result === "win" ? 1800 : 300;

  // NIL level provides a multiplier to merch and ticket sales (marketing boost)
  const nilMultiplier = 1 + season.nilCollectiveLevel * 0.045;

  return Math.round((ticketRevenue + merchRevenue + winBonus) * nilMultiplier);
}

/**
 * Calculate coach XP gain based on game result and opponent quality.
 */
function calculateCoachXP(season: Season, result: "win" | "loss", opponentOverall: number): number {
  const baseXP = result === "win" ? 60 : 20;
  const userOverall = computeTeamOverall(season.team);
  const upsetBonus = result === "win" && opponentOverall > userOverall + 5 ? 40 : 0;
  return baseXP + upsetBonus;
}

/**
 * Handle coach leveling and skill point accumulation.
 */
function updateCoachProgression(coach: import("../game/types").Coach, xp: number): import("../game/types").Coach {
  let { level, experience, skillPoints } = coach;
  experience += xp;
  const xpNeeded = level * 120 + 80;
  if (experience >= xpNeeded) {
    level += 1;
    experience -= xpNeeded;
    skillPoints += 1;
  }
  return { ...coach, level, experience, skillPoints };
}

/**
 * Update team rank and Top 25 list after a game.
 */
function calculateRankingsUpdate(season: Season, result: "win" | "loss") {
  // Simplified logic: adjust votes based on result, then re-sort
  const userTeamId = season.team.id;
  let newTop25 = [...season.top25];
  
  // Update user team votes
  const userEntry = newTop25.find(t => t.teamId === userTeamId);
  if (userEntry) {
    userEntry.record = {
      wins: season.record.wins + (result === "win" ? 1 : 0),
      losses: season.record.losses + (result === "loss" ? 1 : 0),
    };
    userEntry.votes += result === "win" ? 45 : -30;
  } else if (result === "win" && season.record.wins > season.record.losses) {
    // If not ranked, potentially enter Top 25 if we keep winning
    // For now we just check the list
  }

  // Randomly adjust other teams to simulate a living world
  newTop25 = newTop25.map(t => {
    if (t.teamId === userTeamId) return t;
    const roll = Math.random();
    return {
      ...t,
      votes: t.votes + (roll > 0.6 ? 15 : roll < 0.2 ? -15 : 0)
    };
  });

  newTop25.sort((a, b) => b.votes - a.votes);
  const newRankIdx = newTop25.findIndex(t => t.teamId === userTeamId);
  const newRank = newRankIdx !== -1 ? newRankIdx + 1 : null;

  return { top25: newTop25, rank: newRank };
}

/**
 * Generate a rich news item for a game result (OOTP-style).
 */
function generateGameNewsItem(
  game: SeasonGame,
  result: "win" | "loss",
  userScore: number,
  oppScore: number,
  newRecord: { wins: number; losses: number },
  gameNumber: number
): import("../game/types").NewsItem {
  const opp = game.opponent;
  const margin = Math.abs(userScore - oppScore);
  const isUpset = result === "win" && opp.overall > 78;
  const isBlowout = margin > 18;
  const isNailBiter = margin <= 4;
  const isConf = game.gameType === "conf" || game.gameType === "conf-title";
  const venue = game.isHome ? "home" : "at " + opp.abbreviation;

  let headline = "";
  let detail = "";
  let tone: "positive" | "neutral" | "negative" = result === "win" ? "positive" : "negative";

  if (result === "win") {
    if (isUpset && isBlowout) {
      headline = `Dominant upset! ${userScore}â€“${oppScore} statement win vs ${opp.name} ${opp.nickname}`;
      detail = `Complete team effort in a convincing victory over a top program. The polls will take notice.`;
    } else if (isUpset) {
      headline = `Upset alert! Knock off ${opp.name} ${opp.nickname} ${userScore}â€“${oppScore}`;
      detail = `Gutsy performance against a more-talented opponent. National recognition could follow.`;
    } else if (isBlowout) {
      headline = `Blowout win â€” ${userScore}â€“${oppScore} over ${opp.name} ${opp.nickname}`;
      detail = `Dominant on both ends. The margin of victory sends a clear message to the conference.`;
    } else if (isNailBiter) {
      headline = `Survived! Escape ${venue} in ${userScore}â€“${oppScore} thriller`;
      detail = `Nerves of steel. The final buzzer couldn't come soon enough in a hard-fought contest.`;
    } else if (isConf) {
      headline = `Conference win â€” ${userScore}â€“${oppScore} over ${opp.name} ${opp.nickname}`;
      detail = `Important league victory improves conference standing. Standings tighten at the top.`;
    } else {
      const phrases = [
        `Pick up win number ${newRecord.wins}, ${userScore}â€“${oppScore} over ${opp.name} ${opp.nickname}`,
        `${opp.name} ${opp.nickname} fall ${userScore}â€“${oppScore} in solid team effort`,
        `Win over ${opp.name} ${opp.nickname} ${userScore}â€“${oppScore}. Record moves to ${newRecord.wins}â€“${newRecord.losses}`,
      ];
      headline = phrases[Math.floor(Math.random() * phrases.length)];
      detail = `Program builds momentum heading into the heart of the schedule.`;
    }
  } else {
    tone = "negative";
    if (isBlowout) {
      headline = `Tough loss â€” fell ${userScore}â€“${oppScore} to ${opp.name} ${opp.nickname}`;
      detail = `A difficult performance. The coaching staff will have much to review on film.`;
    } else if (isNailBiter) {
      headline = `Heartbreaker â€” lose ${userScore}â€“${oppScore} at the wire to ${opp.name} ${opp.nickname}`;
      detail = `Controlled the game but couldn't finish. A loss that will sting for days.`;
    } else if (isConf) {
      headline = `Conference loss â€” ${userScore}â€“${oppScore} to ${opp.name} ${opp.nickname}`;
      detail = `Standings hit. Must regroup quickly with important games ahead.`;
    } else {
      headline = `Fell to ${opp.name} ${opp.nickname} ${userScore}â€“${oppScore} in ${game.isHome ? "home" : "road"} setback`;
      detail = `Record drops to ${newRecord.wins}â€“${newRecord.losses}. Bounce-back game needed next week.`;
    }
  }

  return {
    id: `news_game_${gameNumber}_${Date.now()}`,
    week: game.week,
    category: "game",
    headline,
    detail,
    tone,
  };
}
