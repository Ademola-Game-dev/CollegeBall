/**
 * RecruitingScreen – high-fidelity off-season recruiting hub.
 * 
 * Features:
 * - AAA-style scouting dashboard
 * - Card-based prospect browsing with star ratings
 * - Tactical interaction system (Scout, Contact, NIL, Offer)
 * - Real-time class signing feedback
 */

import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import type { Prospect } from "../game/types";
import { prospectGrade } from "../game/types";

const POSITION_ORDER = ["PG", "SG", "SF", "PF", "C", "All"] as const;
type PositionFilter = (typeof POSITION_ORDER)[number];

const REGION_ORDER = ["All", "West", "Midwest", "East", "South"] as const;
type RegionFilter = (typeof REGION_ORDER)[number];

export default function RecruitingScreen() {
  const season         = useGameStore((s) => s.season);
  const prospects      = useGameStore((s) => s.prospects);
  const scoutProspect  = useGameStore((s) => s.scoutProspect);
  const contactProspect = useGameStore((s) => s.contactProspect);
  const offerNil       = useGameStore((s) => s.offerNil);
  const offerProspect  = useGameStore((s) => s.offerProspect);
  const finishRecruiting = useGameStore((s) => s.finishRecruiting);

  const [posFilter, setPosFilter] = useState<PositionFilter>("All");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("All");
  const [sortBy, setSortBy] = useState<"rating" | "interest" | "position">("rating");

  if (!season) return null;

  const graduatingSeniors = season.team.roster.filter((p) => p.year === 4);
  const openSpots = Math.max(0, graduatingSeniors.length);
  const committed = prospects.filter((p) => p.committed);

  const filtered = prospects.filter((p) => {
    if (posFilter !== "All" && p.position !== posFilter) return false;
    if (regionFilter !== "All" && p.region !== regionFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "interest") return b.interestLevel - a.interestLevel;
    return a.position.localeCompare(b.position);
  });

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#07111b] pb-20 text-white">
      <RecruitingBg />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-5 py-5 sm:px-8 sm:py-7">
        {/* Header */}
        <header className="relative flex flex-col gap-6 border-b border-white/5 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-400 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-950">
                  Off-Season
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/30">
                  Target Selection Cycle
                </span>
              </div>
              <h1 className="mt-2 text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
                Scouting Hub
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium text-white/40">
                <span>{season.team.name}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-emerald-400/80">Signing Window Open</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end px-4 border-r border-white/10">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Target Goal</span>
              <span className="text-xl font-black text-white">{committed.length} / {openSpots} Signed</span>
            </div>
            <button
              onClick={finishRecruiting}
              className="group relative flex h-14 items-center justify-center overflow-hidden rounded-2xl bg-emerald-400 px-8 text-slate-950 transition-all hover:bg-emerald-300 active:scale-95 glow-cyan"
            >
              <span className="relative z-10 text-sm font-black uppercase tracking-[0.2em]">Sign Class</span>
            </button>
          </div>
        </header>

        <main className="mt-10 flex flex-1 flex-col gap-8">
          {/* Summary stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <SummaryCard label="Weekly Pts" value={season.recruitingPoints} icon={<PointIcon />} />
            <SummaryCard label="NIL Fund" value={`$${(season.nilBudget / 1000).toFixed(1)}k`} icon={<NILIcon />} />
            <SummaryCard label="Open Spots" value={openSpots} icon={<SpotIcon />} />
            <SummaryCard label="Committed" value={committed.length} icon={<CheckIcon />} />
          </div>

          {/* Filters */}
          <div className="glass-thin flex flex-wrap items-center gap-4 rounded-[32px] p-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {POSITION_ORDER.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosFilter(pos)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    posFilter === pos ? "bg-white text-slate-950" : "text-white/40 hover:bg-white/5"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-white/10 hidden lg:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none"
            >
              <option value="rating">Sort: Talent</option>
              <option value="interest">Sort: Interest</option>
              <option value="position">Sort: Position</option>
            </select>
          </div>

          {/* List */}
          <div className="flex flex-col gap-3">
            {filtered.map((p) => (
              <ProspectRow
                key={p.id}
                p={p}
                scout={() => scoutProspect(p.id)}
                contact={() => contactProspect(p.id)}
                offerNil={(amt) => offerNil(p.id, amt)}
                offer={() => offerProspect(p.id)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProspectRow({ p, scout, contact, offerNil, offer }: { p: Prospect, scout: () => void, contact: () => void, offerNil: (amt: number) => void, offer: () => void }) {
  const starCount = Math.max(1, Math.min(5, Math.floor((p.rating - 55) / 7)));
  
  return (
    <div className={`group relative overflow-hidden rounded-[32px] border p-5 transition-all active:scale-[0.99] ${p.committed ? 'border-emerald-400/30 bg-emerald-400/5 shadow-[0_0_20px_rgba(52,211,153,0.1)]' : 'border-white/5 bg-slate-950/40 hover:border-white/15 hover:bg-slate-900/60'}`}>
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Info */}
        <div className="flex min-w-[260px] items-center gap-5">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black transition-all ${p.committed ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
            {p.position}
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors">{p.firstName} {p.lastName}</h3>
            <div className="mt-1 flex items-center gap-2">
              <StarRating count={starCount} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{p.region} · {p.scouted ? p.rating : prospectGrade(p.rating)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="flex flex-1 items-center gap-8 px-4 lg:border-x lg:border-white/5">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/20">
              <span>Talent Potential</span>
              <span className="text-cyan-400/80 font-mono">{p.potentialRange[0]}–{p.potentialRange[1]}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div 
                className={`h-full transition-all duration-700 ease-out ${p.committed ? 'bg-emerald-400' : 'bg-cyan-400/60'}`} 
                style={{ width: `${(p.rating - 50) * 2}%` }} 
              />
            </div>
          </div>
          <div className="flex flex-col items-center min-w-[80px]">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Interest</span>
            <span className={`text-lg font-black transition-colors ${p.interestLevel > 0.8 ? 'text-emerald-400' : 'text-white'}`}>
              {Math.round(p.interestLevel * 100)}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:min-w-[340px] lg:justify-end">
          {p.committed ? (
            <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 animate-pulse">
               <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
               <span className="text-[10px] font-black uppercase tracking-widest">Signed & Committed</span>
            </div>
          ) : (
            <>
              {!p.scouted && <ActionBtn onClick={scout} label="Scout" color="cyan" icon="radar" />}
              <ActionBtn onClick={contact} label="Contact" color="cyan" icon="phone" />
              <ActionBtn onClick={() => offerNil(5000)} label="+$5k NIL" color="amber" icon="money" />
              <button
                onClick={offer}
                disabled={p.offered}
                className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                  p.offered ? "bg-white/5 text-white/20 border border-white/5" : "bg-white text-slate-950 hover:bg-cyan-400 hover:shadow-cyan-500/20 active:scale-95"
                }`}
              >
                {p.offered ? "Offered" : "Offer Scholarship"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, label, color, icon }: { onClick: () => void, label: string, color: string, icon?: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-12 flex-1 rounded-2xl border px-4 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 group/btn flex items-center justify-center gap-2 ${
        color === "cyan" ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950" : "border-amber-400/20 bg-amber-400/5 text-amber-400 hover:bg-amber-400 hover:text-slate-950"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value, icon }: { label: string, value: string | number, icon: any }) {
  return (
    <div className="glass-thin rounded-[32px] p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/40">{icon}</div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</div>
          <div className="text-2xl font-black text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-3 w-3 ${i < count ? "text-amber-400" : "text-white/10"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
      ))}
    </div>
  );
}

const PointIcon = () => <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const NILIcon = () => <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SpotIcon = () => <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CheckIcon = () => <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

function RecruitingBg() {
  return (
    <>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_40%),linear-gradient(180deg,#07111b_0%,#040a12_100%)]" />
      <div className="fixed left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/5" />
    </>
  );
}
