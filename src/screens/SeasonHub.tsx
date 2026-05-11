/**
 * SeasonHub – the main screen for head-coach / season mode.
 *
 * Displays the coach profile, current record, the next scheduled game,
 * and the full season schedule with results.
 */

import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import type { Coach, Season, SeasonGame, SeasonRecord } from "../game/types";
import type { Player, PlayerGameStats } from "../game/types";

const TABS = ["Dashboard", "Coach", "Roster", "Schedule", "Rankings", "History", "News"] as const;
type Tab = (typeof TABS)[number];

const POSITION_LABELS: Record<string, string> = {
  PG: "PG",
  SG: "SG",
  SF: "SF",
  PF: "PF",
  C: "C",
};

export default function SeasonHub() {
  const season             = useGameStore((s) => s.season);
  const playSeasonGame     = useGameStore((s) => s.playSeasonGame);
  const simulateSeasonGame = useGameStore((s) => s.simulateSeasonGame);
  const startSeason        = useGameStore((s) => s.startSeason);
  const advanceSeason      = useGameStore((s) => s.advanceSeason);
  const setScreen          = useGameStore((s) => s.setScreen);
  const upgradeNILCollective = useGameStore((s) => s.upgradeNILCollective);
  const upgradeCoach       = useGameStore((s) => s.upgradeCoach);
  const upgradeCoachTrait  = useGameStore((s) => s.upgradeCoachTrait);
  const updateGamePlan     = useGameStore((s) => s.updateGamePlan);
  const stayAtSchool       = useGameStore((s) => s.stayAtSchool);
  const isSimulating      = useGameStore((s) => s.isSimulating);

  if (!season) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#07111b] text-white">
        <button
          onClick={() => setScreen("menu")}
          className="rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10"
        >
          Back to Menu
        </button>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");

  const nextGame        = season.schedule[season.currentGameIndex] ?? null;
  const isSeasonComplete = season.currentGameIndex >= season.schedule.length;

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#07111b] pb-[max(1rem,env(safe-area-inset-bottom,0px))] text-white">
      <SeasonBackgroundLayers />
      
      {isSimulating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
            <div className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-400 animate-pulse">Simulating...</div>
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        {/* ---- Broadcast Header ---- */}
        <header className="relative flex flex-col gap-6 border-b border-white/5 pb-8 lg:flex-row lg:items-end lg:justify-between mobile-stack">
          <div className="flex items-center gap-6">
            <div 
              className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${season.team.primaryColor}, ${season.team.secondaryColor})` }}
            >
              <div className="absolute inset-0 bg-black/10" />
              <span className="relative z-10 text-4xl font-black italic tracking-tighter text-white drop-shadow-lg">
                {season.team.abbreviation}
              </span>
              <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-white/10 blur-xl" />
            </div>
            
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-cyan-400 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-950">
                  {season.rank ? `#${season.rank}` : "Unranked"}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/30">
                  Week {season.currentGameIndex + 1} · {season.year} Campaign
                </span>
              </div>
              <h1 className="mt-2 text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                {season.team.name}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium text-white/40">
                <span>{season.team.nickname}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-cyan-400/80">{season.conferenceName} Conference</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end px-4 border-r border-white/10">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">NIL Budget</span>
              <span className="text-xl font-black text-white">${(season.nilBudget / 1000).toFixed(1)}k</span>
            </div>
            <button
              onClick={() => setScreen("menu")}
              className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition hover:bg-white/10"
              title="Return to Menu"
            >
              <svg className="h-5 w-5 text-white/40 transition group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* ---- Navigation ---- */}
        <nav className="sticky top-0 z-40 -mx-5 mt-4 bg-[#07111b]/80 px-5 py-3 backdrop-blur-md lg:mx-0 lg:rounded-2xl lg:px-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative shrink-0 rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === tab
                    ? "bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-cyan-400" />
                )}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex flex-1 flex-col gap-5 py-5">
          {activeTab === "Dashboard" && (
            <>
              {/* ---- Coach + Record + Economy ---- */}
              <div className="grid gap-5 sm:grid-cols-3">
                <CoachCard coach={season.coach} season={season} onUpgrade={upgradeCoach} />
                <RecordCard
                  record={season.record}
                  conferenceRecord={season.conferenceRecord}
                  conferenceName={season.conferenceName}
                  gamesPlayed={season.currentGameIndex}
                  total={season.schedule.length}
                  rank={season.rank}
                />
                <div className="flex flex-col gap-5">
                  <EconomyCard season={season} onUpgradeNIL={upgradeNILCollective} />
                  <RecruitingCard season={season} onRecruit={() => setScreen("recruiting")} />
                </div>
              </div>

              {season.postseasonStatus !== "none" && season.postseasonStatus !== "complete" && (
                <div className="glass-thick relative overflow-hidden rounded-[32px] border border-cyan-400/30 p-8 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-transparent" />
                  <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Postseason Active</div>
                      <h2 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white">The Tournament Awaits</h2>
                      <p className="mt-1 text-sm text-white/50">Your team has qualified for postseason play. Prepare your strategy.</p>
                    </div>
                    <button 
                      onClick={() => setScreen("tournaments")}
                      className="rounded-2xl bg-cyan-400 px-10 py-4 text-[11px] font-black uppercase tracking-widest text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                    >
                      Enter Bracket
                    </button>
                  </div>
                </div>
              )}

              {/* ---- Next game or season-complete banner ---- */}
              {isSeasonComplete ? (
                <SeasonCompleteCard 
                  record={season.record} 
                  rank={season.rank}
                  onNewSeason={() => setScreen("menu")} 
                  onAdvanceSeason={advanceSeason} 
                />
              ) : (
                nextGame && (
                  <NextGameCard
                    game={nextGame}
                    onPlay={playSeasonGame}
                    onSim={simulateSeasonGame}
                  />
                )
              )}

              {/* ---- Quick News Snippet ---- */}
              <div className="grid gap-5 lg:grid-cols-2">
                <NewsPanel news={season.news?.slice(0, 5) || []} isCompact />
                <RankingPanel top25={season.top25} userTeamId={season.team.id} isCompact />
              </div>
            </>
          )}

              {activeTab === "Coach" && (
                <div className="flex flex-col gap-8">
                  <CoachProfilePanel coach={season.coach} onUpgrade={upgradeCoach} onUpgradeTrait={upgradeCoachTrait} />
                  
                  {/* Job Offers Banner if available */}
                  {season.jobOffers && season.jobOffers.length > 0 && (
                    <div className="glass-thick relative overflow-hidden rounded-[32px] border border-cyan-400/30 p-8 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-transparent" />
                      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Carousel Opportunity</div>
                          <h2 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white">Pending Job Offers</h2>
                          <p className="mt-1 text-sm text-white/50">Your performance has caught the eye of other programs. Review your options before the new year.</p>
                        </div>
                        <div className="flex gap-4">
                           <button 
                            onClick={() => setScreen("jobOffers")}
                            className="rounded-2xl bg-cyan-400 px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-950 transition hover:bg-cyan-300 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                           >
                            View Offers ({season.jobOffers.length})
                           </button>
                           <button 
                            onClick={stayAtSchool}
                            className="rounded-2xl border border-white/10 bg-white/5 px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-white/70 transition hover:bg-white/10 active:scale-95"
                           >
                            Stay at {season.team.name}
                           </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-8 lg:grid-cols-2">
                    <CareerHistoryPanel history={season.coach.history} currentTeam={season.team.name} currentRecord={season.record} />
                    <CoachTraitsPanel coach={season.coach} onUpgrade={upgradeCoachTrait} />
                  </div>
                </div>
              )}

              {activeTab === "Roster" && (
            <>
              <RosterPanel season={season} />
              {season.gamesPlayedWithStats > 0 && (
                <SeasonStatsPanel season={season} />
              )}
            </>
          )}

          {activeTab === "Schedule" && (
            <ScheduleGrid schedule={season.schedule} currentIndex={season.currentGameIndex} />
          )}

          {activeTab === "Rankings" && (
            <RankingPanel top25={season.top25} userTeamId={season.team.id} />
          )}

          {activeTab === "History" && (
            <HistoryPanel history={season.history} />
          )}

          {activeTab === "News" && (
            <NewsPanel news={season.news || []} />
          )}
        </main>
      </div>
    </div>
  );
}

function RankingPanel({ 
  top25, 
  userTeamId,
  isCompact = false
}: { 
  top25: import("../game/types").RankingEntry[], 
  userTeamId: string,
  isCompact?: boolean
}) {
  const displayCount = isCompact ? 5 : 25;
  return (
    <div className="rounded-[36px] border border-white/10 bg-[rgba(6,14,23,0.82)] px-6 py-7">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/42">
          {isCompact ? "Top 25 Snippet" : "Top 25 Rankings"}
        </div>
        {!isCompact && <div className="text-[9px] font-bold uppercase tracking-widest text-white/20">Week {Math.max(1, top25[0]?.record.wins + top25[0]?.record.losses + 1)}</div>}
      </div>
      <div className="mt-4 flex flex-col gap-1">
        {top25.slice(0, displayCount).map((t, i) => (
          <div 
            key={t.teamId} 
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition ${
              t.teamId === userTeamId ? "bg-amber-300/10 border border-amber-300/20 shadow-[0_0_15px_rgba(251,191,36,0.05)]" : "hover:bg-white/5"
            }`}
          >
            <span className="w-4 text-[10px] font-black text-white/30">#{i + 1}</span>
            <span className="flex-1 text-xs font-bold text-white/80">{t.name}</span>
            <span className="text-[10px] font-mono text-white/40">{t.record.wins}–{t.record.losses}</span>
          </div>
        ))}
        {top25.length > displayCount && (
          <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-widest text-white/15">
            + {top25.length - displayCount} more teams
          </div>
        )}
      </div>
    </div>
  );
}

function StrategyCard({ 
  gamePlan, 
  onUpdate 
}: { 
  gamePlan: import("../game/types").GamePlan; 
  onUpdate: (p: Partial<import("../game/types").GamePlan>) => void 
}) {
  const options = {
    pace: ["slow", "balanced", "fast"],
    focus: ["interior", "balanced", "perimeter"],
    defensiveIntensity: ["conservative", "neutral", "aggressive"]
  };

  return (
    <div className="rounded-[36px] border border-white/10 bg-[rgba(6,14,23,0.82)] px-6 py-7">
      <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-200/50">Strategy</div>
      <div className="mt-4 flex flex-col gap-4">
        {Object.entries(options).map(([key, vals]) => (
          <div key={key}>
            <div className="mb-2 text-[9px] font-black uppercase tracking-widest text-white/30">
              {key === "defensiveIntensity" ? "Defense" : key}
            </div>
            <div className="flex gap-1 rounded-2xl bg-white/5 p-1">
              {vals.map((v) => (
                <button
                  key={v}
                  onClick={() => onUpdate({ [key]: v })}
                  className={`flex-1 rounded-xl px-2 py-1.5 text-[9px] font-black uppercase tracking-wider transition ${
                    gamePlan[key as keyof typeof gamePlan] === v
                      ? "bg-cyan-400 text-black"
                      : "text-white/40 hover:bg-white/5 hover:text-white/70"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CoachCardProps {
  coach: import("../game/types").Coach;
  season: import("../game/types").Season;
  onUpgrade?: (stat: "offense" | "defense" | "recruiting" | "development") => void;
}

function CoachCard({ coach, season, onUpgrade }: CoachCardProps) {
  const attrs: { label: string; key: "offense" | "defense" | "recruiting" | "development" }[] = [
    { label: "Off", key: "offense" },
    { label: "Def", key: "defense" },
    { label: "Rec", key: "recruiting" },
    { label: "Dev", key: "development" },
  ];

  const xpNeeded = coach.level * 120 + 80;
  const xpPct = (coach.experience / xpNeeded) * 100;

  return (
    <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-950/40 p-8 transition-all hover:border-white/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),transparent_50%)]" />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Coach Profile</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{coach.firstName} {coach.lastName}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Level {coach.level}</span>
              <div className="h-3 w-px bg-white/10" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{coach.careerWins}–{coach.careerLosses} Career</span>
            </div>
          </div>
          
          {/* Level Circle */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-cyan-400 shadow-lg" strokeDasharray={176} strokeDashoffset={176 - (176 * xpPct) / 100} strokeLinecap="round" />
            </svg>
            <span className="text-sm font-black text-white">{Math.round(xpPct)}%</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {attrs.map(({ label, key }) => (
            <CoachAttr 
              key={label} 
              label={label} 
              value={coach[key]} 
              canUpgrade={coach.skillPoints > 0 && coach[key] < 99}
              onUpgrade={() => onUpgrade?.(key)}
            />
          ))}
        </div>

        {coach.skillPoints > 0 && (
          <div className="mt-4 flex animate-pulse items-center gap-3 rounded-2xl bg-amber-400/10 p-4 border border-amber-400/20">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-amber-200">
              {coach.skillPoints} Skill Point{coach.skillPoints !== 1 ? 's' : ''} Ready
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CoachAttr({ 
  label, 
  value, 
  canUpgrade, 
  onUpgrade 
}: { 
  label: string; 
  value: number; 
  canUpgrade: boolean; 
  onUpgrade: () => void;
  key?: string;
}) {
  return (
    <div className="group relative rounded-[20px] border border-white/10 bg-black/18 px-4 py-3 backdrop-blur-sm transition-colors hover:border-white/20">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/38">
          {label}
        </div>
        {canUpgrade && (
          <button 
            onClick={onUpgrade}
            className="rounded-full bg-cyan-400/20 p-1 text-cyan-300 transition hover:bg-cyan-400 hover:text-black active:scale-90"
            title="Upgrade stat"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-xl font-black text-white">{value}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400/70"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface RecordCardProps {
  record: SeasonRecord;
  conferenceRecord: SeasonRecord;
  conferenceName: string;
  gamesPlayed: number;
  total: number;
  rank: number | null;
}

function RecordCard({ record, conferenceRecord, conferenceName, gamesPlayed, total, rank }: RecordCardProps) {
  const pct = gamesPlayed > 0
    ? Math.round((record.wins / gamesPlayed) * 1000) / 10
    : 0;

  return (
    <div className="group relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-950/40 p-8 transition-all hover:border-white/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_50%)]" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
            Season Record
          </div>
          {rank && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-slate-950 glow-amber">
              #{rank}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-7xl font-black tracking-tighter text-white">{record.wins}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Wins</span>
          </div>
          <div className="h-12 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-7xl font-black tracking-tighter text-white/40">{record.losses}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Losses</span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">{conferenceName}</span>
            <span className="text-sm font-black text-cyan-400">{conferenceRecord.wins}–{conferenceRecord.losses}</span>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-medium text-white/30">{gamesPlayed} of {total} Played</span>
            <span className="text-[10px] font-black text-white/60">{pct}% Win</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EconomyCard({ season, onUpgradeNIL }: { season: Season; onUpgradeNIL: () => void }) {
  const nilUpgradeCost = 2500 + season.nilCollectiveLevel * 1500;
  const canAfford = season.budget >= nilUpgradeCost && season.nilCollectiveLevel < 10;

  return (
    <div className="glass-medium relative overflow-hidden rounded-[32px] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.1),transparent_40%)]" />
      <div className="relative">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/40">
          Program Economy
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-white">${season.budget.toLocaleString()}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Available Budget</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xl font-black text-emerald-400">${(season.nilBudget / 1000).toFixed(1)}k</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/30">NIL Fund</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            disabled={!canAfford}
            onClick={onUpgradeNIL}
            className={`group w-full rounded-2xl py-3.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${
              canAfford
                ? "bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            {season.nilCollectiveLevel >= 10 ? "Max NIL Level" : `Raise Funds ($${nilUpgradeCost.toLocaleString()})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecruitingCard({ season, onRecruit }: { season: Season; onRecruit: () => void }) {
  return (
    <div className="glass-medium relative overflow-hidden rounded-[32px] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.1),transparent_40%)]" />
      <div className="relative">
        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/40">
          Recruiting Pipeline
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-white">{season.recruitingPoints}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Recruiting Points</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <button
          onClick={onRecruit}
          className="mt-6 w-full rounded-2xl bg-cyan-400 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 transition-all hover:bg-cyan-300 active:scale-95"
        >
          Open Recruiting
        </button>
      </div>
    </div>
  );
}

interface NextGameCardProps {
  game: SeasonGame;
  onPlay: () => void;
  onSim: () => void;
}

function NextGameCard({ game, onPlay, onSim }: NextGameCardProps) {
  const oppOverall = computeTeamOverall(game.opponent);
  
  return (
    <div className="glass-thick group relative overflow-hidden rounded-[40px] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_60%)]" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/5 blur-[100px]" />
      
      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
        {/* Matchup Visual */}
        <div className="flex flex-1 items-center justify-between gap-6 px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black italic shadow-inner group-hover:scale-105 transition-transform duration-500">
               <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/10 to-transparent" />
               US
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Home Program</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-[11px] font-black uppercase tracking-[0.8em] text-amber-400/50">VS</div>
            <div className="mt-2 h-px w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div 
              className="relative h-24 w-24 rounded-full border border-white/20 flex items-center justify-center text-3xl font-black italic shadow-[0_0_40px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-500"
              style={{ background: `linear-gradient(135deg, ${game.opponent.primaryColor}, ${game.opponent.secondaryColor})` }}
            >
              <div className="absolute inset-0 rounded-full bg-black/10" />
              <span className="relative z-10">{game.opponent.abbreviation}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{game.isHome ? "Away Program" : "Home Program"}</span>
          </div>
        </div>

        {/* Info & Stats */}
        <div className="flex-[1.2] space-y-6 lg:border-l lg:border-white/5 lg:pl-10">
          <div>
            <div className="flex items-center gap-3">
               <span className="rounded-lg bg-amber-400/10 border border-amber-400/20 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-400">Week {game.week}</span>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Gameday Preview</span>
            </div>
            <h2 className="mt-4 text-4xl font-black uppercase italic tracking-tighter text-white sm:text-5xl">{game.opponent.name}</h2>
            <div className="text-sm font-bold text-white/40">{game.opponent.nickname}</div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                <span>Power Rating</span>
                <span className="text-white">{oppOverall}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(251,191,36,0.4)] transition-all duration-1000" style={{ width: `${oppOverall}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                <span>Threat Level</span>
                <span className={oppOverall > 80 ? "text-red-400" : "text-emerald-400"}>{oppOverall > 80 ? "EXTREME" : "MODERATE"}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <div className={`h-full transition-all duration-1000 ${oppOverall > 80 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${oppOverall}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 min-w-[220px]">
          <button
            onClick={onPlay}
            className="group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-3xl bg-white text-slate-950 transition-all hover:bg-amber-400 active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
          >
            <span className="relative z-10 text-xs font-black uppercase tracking-[0.3em]">Enter Match</span>
          </button>
          <button
            onClick={onSim}
            className="h-16 w-full rounded-3xl border border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-[0.3em] text-white/60 transition hover:bg-white/10 active:scale-95"
          >
            Simulate Result
          </button>
        </div>
      </div>
    </div>
  );
}

interface SeasonCompleteCardProps {
  record: SeasonRecord;
  rank: number | null;
  onNewSeason: () => void;
  onAdvanceSeason: () => void;
}

function SeasonCompleteCard({ record, rank, onNewSeason, onAdvanceSeason }: SeasonCompleteCardProps) {
  const total = record.wins + record.losses;
  const pct   = total > 0 ? Math.round((record.wins / total) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(4,120,87,0.15),rgba(6,14,23,0.96))] px-6 py-8 sm:px-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.42em] text-emerald-300/72">
        Season Complete
      </div>
      <h2 className="mt-3 text-3xl font-black uppercase tracking-[0.06em] text-white sm:text-4xl">
        Final Record: {record.wins}–{record.losses}
      </h2>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-sm text-white/60">
          {pct >= 70
            ? "Outstanding season — conference contender material."
            : pct >= 50
            ? "Solid year. Keep building the program."
            : "Tough year, but every lesson counts."}
        </span>
        {rank && rank <= 25 && (
          <span className="rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            Dancin'
          </span>
        )}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onAdvanceSeason}
          className="rounded-[22px] bg-emerald-400 px-7 py-3.5 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-emerald-300 active:scale-95"
        >
          Advance Season &amp; Recruit
        </button>
        <button
          onClick={onNewSeason}
          className="rounded-[22px] border border-white/12 bg-white/6 px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/12 active:scale-95"
        >
          New Season (Reset)
        </button>
      </div>
    </div>
  );
}

interface ScheduleGridProps {
  schedule: SeasonGame[];
  currentIndex: number;
}

// ---------------------------------------------------------------------------
// Roster Panel
// ---------------------------------------------------------------------------

interface RosterPanelProps {
  season: Season;
}


function RosterPanel({ season }: RosterPanelProps) {
  const { team } = season;
  const lineupIds = new Set(team.lineup);
  const starters = team.lineup
    .map((id) => team.roster.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);
  const bench = team.roster.filter((p) => !lineupIds.has(p.id));

  return (
    <div className="rounded-[36px] border border-white/10 bg-[rgba(6,14,23,0.82)] px-6 py-7 sm:px-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/42">
        Roster
      </div>

      {/* Starters */}
      <div className="mt-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/55">
          Starters
        </div>
        <div className="flex flex-col gap-2">
          {starters.map((p) => (
            <RosterRow 
              key={p.id} 
              player={p} 
              stats={season.seasonStats[p.id]} 
              gamesPlayed={season.gamesPlayedWithStats} 
            />
          ))}
        </div>
      </div>

      {/* Bench */}
      {bench.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/35">
            Bench
          </div>
          <div className="flex flex-col gap-2">
            {bench.map((p) => (
              <RosterRow 
                key={p.id} 
                player={p} 
                isBench 
                stats={season.seasonStats[p.id]}
                gamesPlayed={season.gamesPlayedWithStats}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RosterRowProps {
  player: Player;
  isBench?: boolean;
  stats?: PlayerGameStats;
  gamesPlayed?: number;
}

function RosterRow({ player: p, isBench = false, stats, gamesPlayed = 0 }: RosterRowProps) {
  const ppg = stats && gamesPlayed > 0 ? (stats.pts / gamesPlayed).toFixed(1) : "0.0";
  const rpg = stats && gamesPlayed > 0 ? (stats.reb / gamesPlayed).toFixed(1) : "0.0";
  const apg = stats && gamesPlayed > 0 ? (stats.ast / gamesPlayed).toFixed(1) : "0.0";

  const ratings = [
    { label: "SPD", value: p.ratings.speed },
    { label: "SHT", value: p.ratings.shooting },
    { label: "DEF", value: p.ratings.defense },
    { label: "REB", value: p.ratings.rebounding },
  ];

  const yearLabels: Record<1 | 2 | 3 | 4, string> = { 1: "Fr", 2: "So", 3: "Jr", 4: "Sr" };
  const yearLabel = yearLabels[p.year] ?? "";

  return (
    <div
      className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 ${
        isBench ? "border-white/6 bg-white/[0.02]" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      {/* Jersey number */}
      <div className="w-6 shrink-0 text-center text-[11px] font-mono font-semibold text-white/35">
        {p.number}
      </div>

      {/* Position badge */}
      <div className="w-8 shrink-0 rounded-md bg-white/8 px-1 py-0.5 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
        {POSITION_LABELS[p.position] ?? p.position}
      </div>

      {/* Name + Archetype */}
      <div className="flex flex-1 flex-col">
        <div className={`text-sm font-semibold flex items-baseline gap-2 ${isBench ? "text-white/55" : "text-white/85"}`}>
          <span>{p.firstName[0]}. {p.lastName}</span>
          <span className="text-[10px] font-medium text-white/20 tabular-nums">
            {Math.floor(p.heightInches / 12)}'{p.heightInches % 12}"
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-medium uppercase tracking-widest text-white/25">{p.archetype}</span>
          {p.traits.map(t => (
            <span key={t} className="rounded-sm bg-amber-400/10 px-1 text-[8px] font-bold uppercase tracking-wider text-amber-400/60 ring-1 ring-inset ring-amber-400/20">{t}</span>
          ))}
        </div>
      </div>

      {/* Potential Stars (OOTP style) */}
      <div className="mr-2 hidden shrink-0 items-center gap-0.5 sm:flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const stars = Math.ceil(p.potential / 20);
          return (
            <svg 
              key={i} 
              className={`h-2 w-2 ${i < stars ? "text-amber-400" : "text-white/10"}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        })}
      </div>

      {/* Year badge (from CFHC player year system: Fr/So/Jr/Sr) */}
      {yearLabel && (
        <div className={`hidden shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] sm:block ${
          p.year === 4
            ? "border border-amber-200/20 bg-amber-300/10 text-amber-200/70"
            : p.year === 1
            ? "border border-cyan-200/20 bg-cyan-300/10 text-cyan-200/70"
            : "border border-white/10 bg-white/5 text-white/40"
        }`}>
          {yearLabel}
        </div>
      )}

      {/* Stats Block (OOTP depth) */}
      <div className="flex w-24 shrink-0 items-center justify-end gap-3 pr-2 text-right">
        <div className="flex flex-col items-end">
          <div className="text-[10px] font-bold text-white/70">{ppg}</div>
          <div className="text-[8px] font-medium uppercase tracking-tighter text-white/25">PPG</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[10px] font-bold text-white/70">{rpg}</div>
          <div className="text-[8px] font-medium uppercase tracking-tighter text-white/25">RPG</div>
        </div>
      </div>

      {/* Ratings - Condensed for Mobile */}
      <div className="flex w-10 shrink-0 flex-col items-center">
        <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/30">OVR</span>
        <span className="mt-0.5 text-xs font-black text-white/80">
          {Math.round((p.ratings.speed + p.ratings.shooting + p.ratings.defense + p.ratings.rebounding) / 4)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Season Stats Panel
// ---------------------------------------------------------------------------

interface SeasonStatsPanelProps {
  season: Season;
}

function SeasonStatsPanel({ season }: SeasonStatsPanelProps) {
  const { team, seasonStats, gamesPlayedWithStats } = season;
  const gp = gamesPlayedWithStats;
  if (gp === 0) return null;

  const lineupIds = new Set(team.lineup);
  const starters = team.lineup
    .map((id) => team.roster.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined);
  const bench = team.roster.filter((p) => !lineupIds.has(p.id) && !!seasonStats[p.id]);
  const allPlayers = [...starters, ...bench];

  const avg = (n: number) => gp > 0 ? (n / gp).toFixed(1) : "—";

  const COL = "px-2 py-1.5 text-center text-[11px] font-mono";
  const HDR = `${COL} text-white/35 font-semibold tracking-wider`;

  return (
    <div className="rounded-[36px] border border-white/10 bg-[rgba(6,14,23,0.82)] px-6 py-7 sm:px-8">
      <div className="flex items-baseline gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/42">
          Season Stats
        </div>
        <div className="text-[10px] text-white/28">
          {gp} game{gp !== 1 ? "s" : ""} · per-game averages
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th className={`${HDR} text-left pl-0`} style={{ width: "38%" }}>Player</th>
              <th className={HDR}>PTS</th>
              <th className={HDR}>REB</th>
              <th className={HDR}>AST</th>
              <th className={HDR}>STL</th>
              <th className={HDR}>BLK</th>
              <th className={HDR}>PF</th>
            </tr>
          </thead>
          <tbody>
            {allPlayers.map((p) => {
              const s: PlayerGameStats = seasonStats[p.id] ?? {
                points: 0, fieldGoalsMade: 0, fieldGoalsAttempted: 0,
                threesMade: 0, threesAttempted: 0, freeThrowsMade: 0,
                freeThrowsAttempted: 0, rebounds: 0, assists: 0, steals: 0,
                turnovers: 0, blocks: 0, fouls: 0, minutesPlayed: 0,
              };
              const isBench = !lineupIds.has(p.id);
              return (
                <tr
                  key={p.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <td className="py-1.5 pl-0 text-left">
                    <span className="text-[10px] font-mono text-white/30 mr-1.5">#{p.number}</span>
                    <span className={`text-[11px] font-semibold ${isBench ? "text-white/50" : "text-white/80"}`}>
                      {p.firstName[0]}. {p.lastName}
                    </span>
                  </td>
                  <td className={`${COL} font-bold text-white`}>{avg(s.points)}</td>
                  <td className={`${COL} text-white/60`}>{avg(s.rebounds)}</td>
                  <td className={`${COL} text-white/60`}>{avg(s.assists)}</td>
                  <td className={`${COL} text-white/60`}>{avg(s.steals)}</td>
                  <td className={`${COL} text-white/60`}>{avg(s.blocks)}</td>
                  <td className={`${COL} text-white/60`}>{avg(s.fouls)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScheduleGrid({ schedule, currentIndex }: ScheduleGridProps) {
  return (
    <div className="rounded-[36px] border border-white/10 bg-[rgba(6,14,23,0.82)] px-6 py-7 sm:px-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/42">
        Schedule
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {schedule.map((game, i) => (
          <ScheduleRow
            key={game.id}
            game={game}
            isNext={i === currentIndex}
            isPast={i < currentIndex}
          />
        ))}
      </div>
    </div>
  );
}

interface ScheduleRowProps {
  game: SeasonGame;
  isNext: boolean;
  isPast: boolean;
  key?: string;
}

function ScheduleRow({ game, isNext, isPast }: ScheduleRowProps) {
  const resultColor =
    game.result === "win"  ? "text-emerald-400" :
    game.result === "loss" ? "text-red-400"     :
    "text-white/30";

  const resultLabel =
    game.result === "win"  ? "W" :
    game.result === "loss" ? "L" :
    isNext                 ? "Next" :
    "–";

  // Game type badge (from CFHC's conf / non-conf / conf-title model)
  const gameTypeBadge =
    game.gameType === "conf-title" ? { label: "Title", cls: "border-amber-200/25 bg-amber-300/10 text-amber-200/80" } :
    game.gameType === "conf"       ? { label: "Conf",  cls: "border-cyan-200/20 bg-cyan-300/8 text-cyan-200/65" } :
    { label: "OOC", cls: "border-white/10 bg-white/5 text-white/40" };

  return (
    <div
      className={`flex items-center gap-4 rounded-[20px] border px-5 py-3.5 transition ${
        isNext
          ? "border-amber-200/25 bg-amber-300/6"
          : "border-white/6 bg-white/[0.025]"
      }`}
    >
      {/* Week badge */}
      <div className="w-10 shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">
        Wk {game.week}
      </div>

      {/* Venue dot */}
      <div
        className={`h-2 w-2 shrink-0 rounded-full ${game.isHome ? "bg-cyan-400/60" : "bg-white/20"}`}
        title={game.isHome ? "Home" : "Away"}
      />

      {/* Game type label (Conference / OOC / Title) */}
      <div className={`hidden shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] sm:block ${gameTypeBadge.cls}`}>
        {gameTypeBadge.label}
      </div>

      {/* Opponent name */}
      <div className="flex-1 text-sm font-semibold text-white/80">
        {game.isHome ? "" : "@ "}{game.opponent.name}
      </div>

      {/* Score (if played) */}
      {isPast && game.userScore !== null && game.opponentScore !== null ? (
        <div className="text-right text-sm font-mono text-white/55">
          {game.userScore}–{game.opponentScore}
        </div>
      ) : null}

      {/* Result badge */}
      <div className={`w-10 shrink-0 text-right text-sm font-black uppercase ${resultColor}`}>
        {resultLabel}
      </div>
    </div>
  );
}

function NewsPanel({ news, isCompact = false }: { news: import("../game/types").NewsItem[], isCompact?: boolean }) {
  return (
    <div className="rounded-[36px] border border-white/10 bg-[rgba(6,14,23,0.82)] px-6 py-7">
      <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/42">
        {isCompact ? "Recent News" : "Program News Feed"}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {news.length === 0 ? (
          <div className="py-10 text-center text-xs text-white/20">No news yet this season.</div>
        ) : (
          news.map((item) => (
            <div key={item.id} className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      item.tone === "positive" ? "bg-emerald-400" : item.tone === "negative" ? "bg-red-400" : "bg-white/30"
                    }`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Week {item.week} · {item.category}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-white/90">{item.headline}</h3>
                  {!isCompact && item.detail && (
                    <p className="mt-1 text-xs leading-relaxed text-white/40">{item.detail}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
 function HistoryPanel({ history }: { history: import("../game/types").SeasonHistory[] }) {
  return (
    <div className="rounded-[36px] border border-white/10 bg-[rgba(6,14,23,0.82)] px-6 py-7 sm:px-8">
      <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/42">
        Career Legacy
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {history.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="h-1 w-12 rounded-full bg-white/5 mb-4" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">Establishing Foundation...</div>
            <div className="mt-2 text-xs text-white/10 italic">Your first season is currently in progress.</div>
          </div>
        ) : (
          [...history].reverse().map((h, i) => (
            <div key={i} className="group relative flex items-center gap-6 overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01] px-6 py-5 transition hover:bg-white/[0.03]">
              <div className="absolute left-0 top-0 h-full w-1 bg-white/5 group-hover:bg-cyan-400/40 transition-all" />
              
              <div className="flex flex-col">
                <span className="text-xl font-black text-white/20">{h.year}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/10">Season</span>
              </div>

              <div className="flex-1">
                <div className="text-sm font-bold text-white/80">{h.teamName}</div>
                <div className="mt-1 flex items-center gap-3">
                   <div className="text-xs font-mono font-bold text-cyan-400/70">{h.wins}W - {h.losses}L</div>
                   <div className="h-1 w-1 rounded-full bg-white/10" />
                   <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                     {((h.wins / (h.wins + h.losses || 1)) * 100).toFixed(1)}% Win rate
                   </div>
                </div>
              </div>

              {h.postseason && h.postseason !== "none" && (
                <div className="rounded-xl bg-cyan-400/5 border border-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                  {h.postseason}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
>
    </div>
  );
}

function SeasonBackgroundLayers() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_30%),linear-gradient(180deg,#07111b_0%,#040a12_100%)]" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/4" />
      <div className="absolute left-[8%] top-1/2 h-px w-[84%] bg-white/4" />
      <div className="absolute bottom-[-10%] left-1/2 h-[30vw] w-[30vw] min-h-[200px] min-w-[200px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.1),transparent_62%)] blur-3xl" />
    </>
  );
}

function CoachProfilePanel({ coach, onUpgrade }: { coach: Coach; onUpgrade: (s: any) => void; onUpgradeTrait: (t: any) => void }) {
  const stats = [
    { key: "offense", label: "Offensive System", value: coach.offense, color: "text-amber-400" },
    { key: "defense", label: "Defensive System", value: coach.defense, color: "text-blue-400" },
    { key: "recruiting", label: "Recruiting Quality", value: coach.recruiting, color: "text-cyan-400" },
    { key: "development", label: "Player Development", value: coach.development, color: "text-emerald-400" },
  ] as const;

  const xpNeeded = coach.level * 120 + 80;
  const xpPct = (coach.experience / xpNeeded) * 100;

  return (
    <div className="glass-thick relative overflow-hidden rounded-[40px] p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.05),transparent_50%)]" />
      
      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col gap-6">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-400">Master Coach</div>
            <h2 className="mt-2 text-5xl font-black tracking-tight text-white">{coach.firstName} {coach.lastName}</h2>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm font-bold text-white/40">Level {coach.level}</span>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${xpPct}%` }} />
              </div>
              <span className="text-[10px] font-black text-amber-400/60">{coach.experience} / {xpNeeded} XP</span>
            </div>
          </div>

          <div className="flex items-center gap-8 border-t border-white/5 pt-6">
             <div className="flex flex-col">
              <span className="text-2xl font-black text-white">{coach.careerWins}-{coach.careerLosses}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Career Record</span>
             </div>
             <div className="flex flex-col">
              <span className="text-2xl font-black text-cyan-400">{coach.skillPoints}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Skill Points</span>
             </div>
             <div className="flex flex-col">
              <span className="text-2xl font-black text-emerald-400">{coach.traitPoints}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Trait Points</span>
             </div>
          </div>
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          {stats.map((s) => (
            <div key={s.key} className="group relative rounded-[28px] border border-white/5 bg-white/[0.02] p-5 transition hover:border-white/10 hover:bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{s.label}</span>
                <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div className={`h-full opacity-50 ${s.color.replace('text-', 'bg-')}`} style={{ width: `${s.value}%` }} />
              </div>
              {coach.skillPoints > 0 && (
                <button 
                  onClick={() => onUpgrade(s.key)}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-white/20 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="text-lg">+</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CareerHistoryPanel({ history, currentTeam, currentRecord }: { history: any[]; currentTeam: string; currentRecord: any }) {
  return (
    <div className="glass-medium relative flex flex-col rounded-[32px] p-7">
      <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Career Legacy</div>
      <h3 className="mt-2 text-xl font-black text-white">Coaching History</h3>
      
      <div className="mt-6 space-y-4">
        {/* Current Entry */}
        <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-white/5">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{currentTeam}</span>
            <span className="text-[10px] font-medium text-white/30">Current Program</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-white">{currentRecord.wins}-{currentRecord.losses}</div>
            <div className="text-[10px] font-bold text-emerald-400">ACTIVE</div>
          </div>
        </div>

        {/* Past History */}
        {history.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/20">
            First Job in Career
          </div>
        ) : (
          [...history].reverse().map((h, i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white/80">{h.teamName}</span>
                <span className="text-[10px] font-medium text-white/20">{h.year} Season</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white/60">{h.wins}-{h.losses}</div>
                <div className="text-[10px] font-medium text-white/20">Final</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CoachTraitsPanel({ coach, onUpgrade }: { coach: import("../game/types").Coach; onUpgrade: (t: import("../game/types").CoachTrait) => void }) {
  const ALL_TRAITS: import("../game/types").CoachTrait[] = [
    "Big Man Whisperer", "NIL Guru", "Defensive Specialist", 
    "Recruiting Magnet", "Transfer King", "Tactical Genius", "Player Developer"
  ];

  const traitDetails: Record<import("../game/types").CoachTrait, { desc: string; icon: string }> = {
    "Big Man Whisperer": { desc: "+5 Rebounding to all Centers", icon: "⚒" },
    "NIL Guru": { desc: "+$5k NIL budget every week", icon: "💰" },
    "Defensive Specialist": { desc: "Permanent +3 to Team Defense rating", icon: "🛡️" },
    "Recruiting Magnet": { desc: "+25 Recruiting Points every week", icon: "🧲" },
    "Transfer King": { desc: "Reduced morale penalty for transfers", icon: "✈️" },
    "Tactical Genius": { desc: "Greater impact from Game Plan adjustments", icon: "📋" },
    "Player Developer": { desc: "+10% Off-season development gains", icon: "📈" },
  };

  return (
    <div className="glass-medium relative flex flex-col rounded-[32px] p-7">
      <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Specializations</div>
      <h3 className="mt-2 text-xl font-black text-white">Coaching Traits</h3>

      <div className="mt-6 grid gap-3">
        {ALL_TRAITS.map(t => {
          const isOwned = coach.traits.includes(t);
          const canAfford = coach.traitPoints > 0;
          const { desc, icon } = traitDetails[t];

          return (
            <div 
              key={t}
              className={`group flex items-center justify-between rounded-2xl border p-4 transition-all ${
                isOwned 
                  ? "border-emerald-400/30 bg-emerald-400/5" 
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${isOwned ? "bg-emerald-400/10" : "bg-white/5 opacity-40"}`}>
                  {icon}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[13px] font-bold ${isOwned ? "text-emerald-400" : "text-white/70"}`}>{t}</span>
                  <span className="text-[10px] text-white/30">{desc}</span>
                </div>
              </div>

              {!isOwned && (
                <button
                  disabled={!canAfford}
                  onClick={() => onUpgrade(t)}
                  className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                    canAfford 
                      ? "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white" 
                      : "bg-white/5 text-white/10"
                  }`}
                >
                  {canAfford ? "Unlock" : "Locked"}
                </button>
              )}
              {isOwned && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-[10px] text-slate-950 font-black">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
