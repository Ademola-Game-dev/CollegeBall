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
  Coach,
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
  SeasonRecord,
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
  createInitialSeason,
  generateJobOffers,
  setupUserTeam,
  rand,
  getConferenceTeams,
  generateConferenceTournament,
  generateMainTournament,
  generateInvitationalTournament,
  generateTransfers,
  AVAILABLE_TEAMS,
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
/** Divisor mapping coach recruiting rating (0–100) → scouting points. */
const RECRUITING_TO_SCOUTING_DIVISOR = 15;
/** Scouting action cost per prospect. */
const SCOUT_PROSPECT_COST = 1;

function calculateWeeklyScoutingPoints(recruitingRating: number): number {
  return Math.max(
    MIN_SCOUTING_POINTS,
    Math.round(recruitingRating / RECRUITING_TO_SCOUTING_DIVISOR)
  );
}

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
  /** Current overtime period: 0 = regulation, 1 = first OT, 2 = second OT, … */
  overtimePeriod: number;
  /** Raw sim events emitted on the latest tick. */
  latestEvents: SimEvent[];
  /** Whether a background simulation task is running. */
  isSimulating: boolean;

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
  /** Start a new season with a selected team and custom coach. */
  startSeason: (team: Team, coach: Coach) => void;
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
  /** Contact a prospect with a specific pitch to increase interest. */
  pitchProspect: (prospectId: string, pitch: "nil" | "playingTime" | "prestige" | "academic") => void;
  /** Offer an NIL package to a prospect. */
  offerNil: (prospectId: string, amount: number) => void;
  /** Offer a scholarship to a prospect. */
  offerProspect: (prospectId: string) => void;
  /** Advance to the next week in the season (regenerates recruiting points). */
  advanceWeek: () => void;
  /**
   * Finish recruiting: add committed prospects to the team roster and start the next year.
   */
  finishRecruiting: () => void;
  /** Upgrade the team's NIL collective level (costs budget). */
  upgradeNILCollective: () => void;
  /** Upgrade a coach rating using an available skill point. */
  upgradeCoach: (stat: "offense" | "defense" | "recruiting" | "development") => void;
  /** Upgrade a specialized coaching trait. */
  upgradeCoachTrait: (trait: import("../game/types").CoachTrait) => void;
  /** Accept a new job offer and move to that program. */
  acceptJobOffer: (offerId: string) => void;
  /** Clear all pending job offers (staying at current school). */
  stayAtSchool: () => void;
  /** Update the team's tactical game plan. */
  updateGamePlan: (plan: Partial<import("../game/types").GamePlan>) => void;
  /** Advance the current tournament by one round (simulates all games). */
  advanceTournamentRound: (tournamentId: string) => void;
  /** Advance to the transfer portal phase. */
  advanceToTransferPortal: () => void;
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
  isSimulating: false,

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
  startSeason: (selectedTeam: Team, coach: Coach) =>
    set({ 
      season: createInitialSeason(selectedTeam, coach), 
      screen: "season",
      gameContext: "season",
      prospects: generateProspects(60, coach.recruiting, selectedTeam.region),
      scoutingPoints: calculateWeeklyScoutingPoints(coach.recruiting),
    }),

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

  simulateSeasonGame: () => {
    set({ isSimulating: true });
    setTimeout(() => {
      set((state) => {
        const { season } = state;
        if (!season) return { ...state, isSimulating: false };
        const idx = season.currentGameIndex;
        const game = season.schedule[idx];
        if (!game || game.result !== null) return { ...state, isSimulating: false };

        const userOverall = computeTeamOverall(season.team);
        const prestigeBonus = game.isHome ? (season.prestige / 100) * 4 : 0;

        // Strategy Modifiers
        const paceFactor = season.gamePlan.pace === "Push" ? 1.15 : season.gamePlan.pace === "Relaxed" ? 0.85 : 1.0;
        const focusBonus = season.gamePlan.focus === "Outside" ? season.coach.offense / 100 * 2 : season.gamePlan.focus === "Inside" ? season.coach.defense / 100 * 2 : 0;
        const defenseBonus = season.gamePlan.defense === "Aggressive" ? 3 : season.gamePlan.defense === "Passive" ? -3 : 0;

        // Badge/Trait Effects (NBA 2K inspired)
        const userLineup = season.team.roster.filter(p => season.team.lineup.includes(p.id));
        const hasFloorGeneral = userLineup.some(p => p.traits.includes("Floor General"));
        const hasPostAnchor = userLineup.some(p => p.archetype === "Post Anchor");
        
        const badgeOffenseBonus = hasFloorGeneral ? 3 : 0;
        const badgeDefenseBonus = hasPostAnchor ? 3 : 0;

        const baseline = 65;
        let userScore = Math.round(
          (baseline + (userOverall / 100) * 20 + prestigeBonus + focusBonus + badgeOffenseBonus + (Math.random() - 0.5) * 12) * paceFactor
        );
        let oppScore = Math.round(
          (baseline + (game.opponent.overall / 100) * 20 - defenseBonus - badgeDefenseBonus + (Math.random() - 0.5) * 12) * paceFactor
        );
        while (userScore === oppScore) {
          userScore += 4 + Math.floor(Math.random() * 11);
          oppScore += 4 + Math.floor(Math.random() * 11);
        }
        const result: "win" | "loss" = userScore > oppScore ? "win" : "loss";

        const isConfGame = game.gameType === "conf" || game.gameType === "conf-title";

        const newSchedule = season.schedule.map((g, i) =>
          i === idx ? { ...g, result, userScore, opponentScore: oppScore } : g
        );

        const newWins = season.record.wins + (result === "win" ? 1 : 0);
        const newRecord = {
          wins: newWins,
          losses: season.record.losses + (result === "loss" ? 1 : 0),
        };

        // Goal Tracking (NCAA 13/College Dynasty inspired)
        let goalXpEarned = 0;
        const updatedGoals = season.goals.map(goal => {
          if (goal.completed) return goal;
          let current = goal.currentValue;
          if (goal.type === "wins") current = newWins;
          
          const isNowComplete = current >= goal.targetValue;
          if (isNowComplete && !goal.completed) {
            goalXpEarned += goal.rewardXP;
          }
          return { ...goal, currentValue: current, completed: isNowComplete };
        });

        const newsItem: import("../game/types").NewsItem = generateGameNewsItem(
          game, result, userScore, oppScore, newRecord, idx + 1
        );

        return {
          isSimulating: false,
          season: {
            ...season,
            schedule: newSchedule,
            record: newRecord,
            goals: updatedGoals,
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
              calculateCoachXP(season, result, game.opponent.overall) + goalXpEarned
            ),
            ...calculateRankingsUpdate(season, result),
            news: [newsItem, ...(season.news ?? [])].slice(0, 50),
          },
        };
      });
    }, 450);
  },

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

      let updatedSeason = season;
      if (state.gameContext === "season" && state.simStatus === "finished") {
        const idx = season.currentGameIndex;
        const game = season.schedule[idx];
        if (game && game.result === null) {
          const userScore = state.score.home;
          const opponentScore = state.score.away;
          const result: "win" | "loss" = userScore >= opponentScore ? "win" : "loss";

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

  advanceSeason: () =>
    set((state) => {
      const { season } = state;
      if (!season) return state;

      const offers = generateJobOffers(season.coach, season.team.id);
      const initialProspects = generateProspects(season.prestige, season.coach.recruiting, season.team.region);

      return {
        screen: offers.length > 0 ? "jobOffers" : "recruiting",
        season: {
          ...season,
          jobOffers: offers,
          postseasonStatus: "none",
        },
        prospects: initialProspects,
        scoutingPoints: calculateWeeklyScoutingPoints(season.coach.recruiting),
      };
    }),


  scoutProspect: (prospectId: string) =>
    set((state) => {
      if (!state.season || state.scoutingPoints < SCOUT_PROSPECT_COST) return state;
      return {
        prospects: state.prospects.map((p) => {
          if (p.id === prospectId) {
            const center = (p.potentialRange[0] + p.potentialRange[1]) / 2;
            const narrowRange: [number, number] = [
              Math.max(0, Math.round(center - 2)),
              Math.min(100, Math.round(center + 2))
            ];
            return { 
              ...p, 
              scouted: true, 
              potentialRange: narrowRange,
              scoutedRatings: { 
                speed: p.rating + (Math.random() - 0.5) * 5,
                shooting: p.rating + (Math.random() - 0.5) * 5,
              } 
            };
          }
          return p;
        }),
        scoutingPoints: state.scoutingPoints - SCOUT_PROSPECT_COST,
      };
    }),

  pitchProspect: (prospectId, pitch) =>
    set((state) => {
      const { season } = state;
      if (!season || season.recruitingPoints < 5) return state;

      return {
        season: {
          ...season,
          recruitingPoints: season.recruitingPoints - 5,
        },
        prospects: state.prospects.map((p) => {
          if (p.id === prospectId) {
            const priorityVal = p.priorities[pitch];
            const coachBonus = season.coach.recruiting / 100;
            const boost = (0.05 + priorityVal * 0.12) * (1 + coachBonus * 0.5);
            return { ...p, interestLevel: Math.min(1, p.interestLevel + boost) };
          }
          return p;
        }),
      };
    }),

  offerNil: (prospectId: string, amount: number) =>
    set((state) => {
      if (!state.season || state.season.nilBudget < amount) return state;
      
      return {
        prospects: state.prospects.map((p) => {
          if (p.id === prospectId) {
            const ratingFactor = Math.max(1, (p.rating - 60) / 10); 
            const interestBoost = amount / (150000 * ratingFactor); 
            return { 
              ...p, 
              nilOffer: p.nilOffer + amount, 
              interestLevel: Math.min(0.99, p.interestLevel + interestBoost) 
            };
          }
          return p;
        }),
        season: {
          ...state.season,
          nilBudget: state.season.nilBudget - amount,
        },
      };
    }),

  offerProspect: (prospectId: string) =>
    set((state) => {
      const prospect = state.prospects.find((p) => p.id === prospectId);
      if (!prospect || prospect.offered) return state;

      const committed = Math.random() < prospect.interestLevel;
      return {
        prospects: state.prospects.map((p) =>
          p.id === prospectId ? { ...p, offered: true, committed } : p
        ),
      };
    }),

  advanceWeek: () => {
    set({ isSimulating: true });
    setTimeout(() => {
      set((state) => {
        const { season, prospects } = state;
        if (!season) return { ...state, isSimulating: false };

        const hasRecruitingMagnet = season.coach.traits.includes("Recruiting Magnet");
        const hasNILGuru = season.coach.traits.includes("NIL Guru");
        
        const basePoints = 100 + (season.coach.recruiting / 100) * 50;
        const traitBonus = hasRecruitingMagnet ? 25 : 0;
        const newPoints = Math.round(basePoints + traitBonus);

        const nilBudgetBonus = hasNILGuru ? 5000 : 0;
        const updatedNilBudget = season.nilBudget + nilBudgetBonus;

        const updatedProspects = prospects.map((p) => {
          if (p.committed) return p;
          
          let interest = p.interestLevel * 0.95;
          const competitionFactor = (p.rating / 100) * 0.04;
          interest -= competitionFactor;

          if (p.nilOffer > 0) {
            const satisfaction = Math.min(0.05, p.nilOffer / 1000000);
            interest += satisfaction;
          }

          let committed = p.committed;
          if (p.offered && !committed) {
            const commitRoll = Math.random();
            if (commitRoll < (p.interestLevel * 0.2)) {
              committed = true;
            }
          }

          return { 
            ...p, 
            committed,
            interestLevel: Math.max(0.01, Math.min(0.99, interest)) 
          };
        });

        const isSeasonEnd = season.currentGameIndex >= season.schedule.length - 1;

        if (isSeasonEnd) {
          // Transition to Conference Tournament
          const confTeams = getConferenceTeams(season.conferenceName).map(makeOpponentTeam);
          const confTourney = generateConferenceTournament(season.conferenceName, confTeams);
          
          return {
            isSimulating: false,
            season: {
              ...season,
              postseasonStatus: "conf_tourney",
              tournaments: [confTourney],
            },
            screen: "tournaments" as import("../game/types").Screen,
          };
        }

        return {
          isSimulating: false,
          season: {
            ...season,
            recruitingPoints: newPoints,
            nilBudget: updatedNilBudget,
            currentGameIndex: season.currentGameIndex + 1,
          },
          scoutingPoints: calculateWeeklyScoutingPoints(season.coach.recruiting),
          prospects: updatedProspects,
        };
      });
    }, 500);
  },

  finishRecruiting: () =>
    set((state): Partial<GameStore> => {
      const { season, prospects } = state;
      if (!season) return state;

      // If we are in HS recruiting, move to Transfer Portal
      if (state.screen === "recruiting") {
        const transfers = generateTransfers(season.prestige);
        return {
          screen: "transfer-portal",
          prospects: transfers,
          scoutingPoints: 5,
        };
      }

      // If we are in Transfer Portal, finish the off-season
      // 1. Save History
      const historyEntry: import("../game/types").SeasonHistory = {
        year: season.year,
        teamId: season.team.id,
        teamName: season.team.name,
        wins: season.record.wins,
        losses: season.record.losses,
        postseason: season.postseasonStatus ?? "Regular Season",
      };
      const updatedHistory = [...season.coach.history, historyEntry];

      // 2. Graduate Seniors & Age Players
      const agedRoster = season.team.roster
        .filter(p => p.year !== 4) // Graduate seniors
        .map(p => {
          const nextYear = Math.min(4, (p.year as number) + 1) as 1 | 2 | 3 | 4;
          
          // Player Development logic
          const devBonus = (season.coach.development / 100) * 3;
          const randomJump = Math.random() * 4 + devBonus;
          
          return {
            ...p,
            year: nextYear,
            ratings: {
              speed: Math.min(99, p.ratings.speed + randomJump * 0.5),
              shooting: Math.min(99, p.ratings.shooting + randomJump),
              passing: Math.min(99, p.ratings.passing + randomJump),
              defense: Math.min(99, p.ratings.defense + randomJump * 0.8),
              rebounding: Math.min(99, p.ratings.rebounding + randomJump * 0.8),
              endurance: Math.min(99, p.ratings.endurance + randomJump * 0.5),
            }
          };
        });

      // 3. Add Committed Recruits
      const committed = prospects.filter((p) => p.committed);
      const usedNumbers = new Set(agedRoster.map((p) => p.number));
      let nextNum = 1;
      const getNum = (): number => {
        while (usedNumbers.has(nextNum)) nextNum++;
        usedNumbers.add(nextNum);
        return nextNum++;
      };

      for (const prospect of committed) {
        agedRoster.push(prospectToPlayer(prospect, getNum()));
      }

      // 4. Update Lineup
      const newLineup = agedRoster.slice(0, 5).map(p => p.id) as import("../game/types").Lineup;
      const updatedTeam = { ...season.team, roster: agedRoster, lineup: newLineup };

      // 5. Generate New Schedule
      const newYear = season.year + 1;
      const confName = season.conferenceName;
      const confOpponents = getConferenceTeams(confName);
      
      const newSchedule: import("../game/types").SeasonGame[] = [];
      // 4 Non-conf
      AVAILABLE_TEAMS.slice(rand(0, 200), rand(0, 200) + 4).forEach((opp, i) => {
        newSchedule.push({
          id: `game_${newYear}_nc_${i}`,
          week: i + 1,
          isHome: i % 2 === 0,
          opponent: opp,
          result: null,
          userScore: 0,
          opponentScore: 0,
          gameType: "non-conf"
        });
      });
      // 8 Conference
      confOpponents.slice(0, 8).forEach((opp, i) => {
        newSchedule.push({
          id: `game_${newYear}_conf_${i}`,
          week: i + 5,
          isHome: i % 2 === 1,
          opponent: opp,
          result: null,
          userScore: 0,
          opponentScore: 0,
          gameType: "conf"
        });
      });

      const classRating = committed.reduce((sum, p) => sum + p.rating, 0) / Math.max(1, committed.length);
      const classRank = Math.max(1, Math.min(100, Math.round(100 - (classRating - 60) * 2.5)));

      return {
        season: {
          ...season,
          year: newYear,
          history: updatedHistory,
          coach: { ...season.coach, history: updatedHistory },
          team: updatedTeam,
          schedule: newSchedule,
          record: { wins: 0, losses: 0 },
          conferenceRecord: { wins: 0, losses: 0 },
          currentGameIndex: 0,
          seasonStats: {},
          gamesPlayedWithStats: 0,
          rank: null,
          top25: [],
          recruitingClassRating: Math.round(classRating),
          recruitingClassRank: classRank,
          postseasonStatus: "none",
          tournaments: [],
        },
        prospects: [],
        scoutingPoints: 0,
        screen: "season" as Screen,
      };
    }),


  upgradeNILCollective: () =>
    set((state) => {
      const { season } = state;
      if (!season) return state;
      const cost = (season.nilCollectiveLevel + 1) * 2000;
      if (season.budget < cost) return state;
      return {
        season: { ...season, nilCollectiveLevel: season.nilCollectiveLevel + 1, budget: season.budget - cost, nilBudget: season.nilBudget + 15000 },
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
  
  upgradeCoachTrait: (trait) =>
    set((state) => {
      const { season } = state;
      if (!season || season.coach.traitPoints <= 0 || season.coach.traits.includes(trait)) return state;

      return {
        season: {
          ...season,
          coach: {
            ...season.coach,
            traitPoints: season.coach.traitPoints - 1,
            traits: [...season.coach.traits, trait],
          },
        },
      };
    }),

  acceptJobOffer: (offerId) =>
    set((state) => {
      const { season } = state;
      if (!season) return state;
      const offer = season.jobOffers.find((o) => o.id === offerId);
      if (!offer) return state;

      // Move to new program
      const baseTeam = AVAILABLE_TEAMS.find(t => t.id === offer.teamId) || {
        id: offer.teamId, 
        name: offer.teamName, 
        nickname: "Warriors", 
        abbreviation: offer.teamId.substring(0, 3).toUpperCase(),
        primaryColor: "#333",
        secondaryColor: "#777",
        region: "Midwest" as const,
        chemistry: 70
      };
      
      const setupBase = {
        id: baseTeam.id,
        name: baseTeam.name,
        nickname: (baseTeam as any).nickname || "Warriors",
        abbreviation: baseTeam.abbreviation,
        primaryColor: baseTeam.primaryColor,
        secondaryColor: baseTeam.secondaryColor,
        region: baseTeam.region,
        chemistry: (baseTeam as any).chemistry ?? 70,
      };

      const newTeam = setupUserTeam(setupBase, offer.prestige);

      const updatedCoach: import("../game/types").Coach = {
        ...season.coach,
        history: [
          ...season.coach.history,
          {
            teamId: season.team.id,
            teamName: season.team.name,
            year: season.year - 1,
            wins: season.record.wins,
            losses: season.record.losses,
            postseason: season.postseasonStatus ?? null,
          },
        ],
      };

      const newSeason = createInitialSeason(newTeam, updatedCoach);

      return {
        season: {
          ...newSeason,
          year: season.year, 
          budget: Math.round(offer.salary / 100), 
          nilBudget: offer.nilBudget,
        },
        screen: "season",
      };
    }),

  stayAtSchool: () =>
    set((state) => {
      if (!state.season) return state;
      return {
        season: {
          ...state.season,
          jobOffers: [],
        },
      };
    }),

  updateGamePlan: (plan) =>
    set((state) => ({
      season: state.season ? { ...state.season, gamePlan: { ...state.season.gamePlan, ...plan } } : null,
    })),

  advanceTournamentRound: (tournamentId: string) => {
    set({ isSimulating: true });
    setTimeout(() => {
      set((state) => {
        const { season } = state;
        if (!season) return { ...state, isSimulating: false };

        const updatedTournaments = season.tournaments.map((t) => {
          if (t.id !== tournamentId || t.winner) return t;

          const round = t.bracket.rounds[t.currentRound];
          
          // Simulate all games in current round
          const updatedGames = round.games.map((g) => {
            if (g.winnerId) return g;
            
            const home = g.homeTeam;
            const away = g.awayTeam;
            if (!home || !away) return g;

            const hOverall = computeTeamOverall(home);
            const aOverall = computeTeamOverall(away);
            const prob = 0.5 + (hOverall - aOverall) / 50;
            const winner = Math.random() < prob ? home : away;
            
            return {
              ...g,
              homeScore: Math.round(65 + Math.random() * 20),
              awayScore: Math.round(65 + Math.random() * 20),
              winnerId: winner.id
            };
          });

          const updatedRounds = [...t.bracket.rounds];
          updatedRounds[t.currentRound] = { ...round, games: updatedGames };

          // Advance winners to next round
          const nextRound = t.bracket.rounds[t.currentRound + 1];
          if (nextRound) {
            const nextRoundGames = [...nextRound.games];
            updatedGames.forEach((g, idx) => {
              const winner = g.winnerId === g.homeTeam?.id ? g.homeTeam : g.awayTeam;
              const nextGameIdx = Math.floor(idx / 2);
              const isHome = idx % 2 === 0;
              const nextGame = { ...nextRoundGames[nextGameIdx] };
              
              if (isHome) nextGame.homeTeam = winner;
              else nextGame.awayTeam = winner;
              
              nextRoundGames[nextGameIdx] = nextGame;
            });
            updatedRounds[t.currentRound + 1] = { ...nextRound, games: nextRoundGames };
          }

          const isLastRound = t.currentRound === t.bracket.rounds.length - 1;
          const winnerId = isLastRound ? updatedGames[0].winnerId : undefined;

          return {
            ...t,
            bracket: { rounds: updatedRounds },
            currentRound: isLastRound ? t.currentRound : t.currentRound + 1,
            winner: winnerId
          };
        });

        // Check if postseason needs to transition
        let nextStatus = season.postseasonStatus;
        let newTours = updatedTournaments;

        const activeTourney = updatedTournaments.find(t => t.id === tournamentId);
        if (activeTourney?.winner) {
          if (season.postseasonStatus === "conf_tourney") {
            nextStatus = "main_tourney";
            const main = generateMainTournament(AVAILABLE_TEAMS.map(at => makeOpponentTeam(at)));
            const nit = generateInvitationalTournament(AVAILABLE_TEAMS.map(at => makeOpponentTeam(at)));
            newTours = [main, nit];
          } else if (season.postseasonStatus === "main_tourney" || season.postseasonStatus === "nit_tourney") {
            nextStatus = "complete";
            return {
              isSimulating: false,
              season: {
                ...season,
                tournaments: updatedTournaments,
                postseasonStatus: "complete",
                jobOffers: generateJobOffers(season.coach, season.team.id)
              }
            };
          }
        }

        return {
          isSimulating: false,
          season: {
            ...season,
            tournaments: newTours,
            postseasonStatus: nextStatus,
          }
        };
      });
    }, 800);
  },

  advanceToTransferPortal: () =>
    set((state) => {
      const { season } = state;
      if (!season) return state;

      const transfers = generateTransfers(season.prestige);
      
      return {
        screen: "transfer-portal",
        prospects: transfers,
        scoutingPoints: 5,
        season: {
          ...season,
          recruitingPoints: 50,
        }
      };
    }),
}));

/**
 * Calculate post-game revenue based on prestige, attendance, and result.
 */
function calculatePostGameRevenue(
  season: Season,
  game: SeasonGame,
  result: "win" | "loss"
): number {
  const prestigeFactor = season.prestige / 100;
  const attendance = Math.round(
    ((season.prestige * 2 + game.opponent.overall) / 3) * 85
  );
  const ticketPrice = 40;
  const ticketRevenue = game.isHome ? attendance * ticketPrice : attendance * ticketPrice * 0.15;
  const merchRevenue = attendance * (prestigeFactor * 12 + Math.random() * 8);
  const winBonus = result === "win" ? 1800 : 300;
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
function updateCoachProgression(coach: Coach, xp: number): Coach {
  let { level, experience, skillPoints, traitPoints } = coach;
  experience += xp;
  const xpNeeded = level * 120 + 80;
  if (experience >= xpNeeded) {
    level += 1;
    experience -= xpNeeded;
    skillPoints += 1;
    // Award a trait point every 3 levels
    if (level % 3 === 0) {
      traitPoints += 1;
    }
  }
  return { ...coach, level, experience, skillPoints, traitPoints };
}

/**
 * Update team rank and Top 25 list after a game.
 */
function calculateRankingsUpdate(season: Season, result: "win" | "loss") {
  const userTeamId = season.team.id;
  let newTop25 = [...season.top25];
  const userEntry = newTop25.find(t => t.teamId === userTeamId);
  if (userEntry) {
    userEntry.record = {
      wins: season.record.wins + (result === "win" ? 1 : 0),
      losses: season.record.losses + (result === "loss" ? 1 : 0),
    };
    userEntry.votes += result === "win" ? 45 : -30;
  }
  newTop25 = newTop25.map(t => {
    if (t.teamId === userTeamId) return t;
    const roll = Math.random();
    return { ...t, votes: t.votes + (roll > 0.6 ? 15 : roll < 0.2 ? -15 : 0) };
  });
  newTop25.sort((a, b) => b.votes - a.votes);
  const newRankIdx = newTop25.findIndex(t => t.teamId === userTeamId);
  const newRank = newRankIdx !== -1 ? newRankIdx + 1 : null;
  return { top25: newTop25, rank: newRank };
}

/**
 * Generate a rich news item for a game result.
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
  const venue = game.isHome ? "home" : "at " + opp.abbreviation;

  let headline = "";
  let detail = "";
  let tone: "positive" | "neutral" | "negative" = result === "win" ? "positive" : "negative";

  if (result === "win") {
    if (isUpset && isBlowout) {
      headline = `Dominant upset! ${userScore}–${oppScore} statement win vs ${opp.name} ${opp.nickname}`;
    } else if (isUpset) {
      headline = `Upset alert! Knock off ${opp.name} ${opp.nickname} ${userScore}–${oppScore}`;
    } else if (isBlowout) {
      headline = `Blowout win — ${userScore}–${oppScore} over ${opp.name} ${opp.nickname}`;
    } else if (isNailBiter) {
      headline = `Survived! Escape ${venue} in ${userScore}–${oppScore} thriller`;
    } else {
      headline = `Win over ${opp.name} ${opp.nickname} ${userScore}–${oppScore}`;
    }
    detail = `Program builds momentum heading into the heart of the schedule.`;
  } else {
    headline = `Fell to ${opp.name} ${opp.nickname} ${userScore}–${oppScore}`;
    detail = `Record drops to ${newRecord.wins}–${newRecord.losses}. Bounce-back game needed soon.`;
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
