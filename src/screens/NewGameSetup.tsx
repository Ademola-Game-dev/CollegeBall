/**
 * NewGameSetup – premium career-start screen.
 *
 * Players can:
 *  - Select their starting program from the available teams
 *  - Name their coach and distribute initial skill points
 *  - Finalize and launch the career
 */

import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { AVAILABLE_TEAMS, setupUserTeam } from "../game/data/defaults";
import type { Coach, Team } from "../game/types";

export default function NewGameSetup() {
  const startSeason = useGameStore((s) => s.startSeason);
  const setScreen   = useGameStore((s) => s.setScreen);

  // Coach State
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Coach");
  const [recruiting, setRecruiting] = useState(50);
  const [offense, setOffense] = useState(50);
  const [defense, setDefense] = useState(50);
  const [development, setDevelopment] = useState(50);

  // Team Selection
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(AVAILABLE_TEAMS[0].id);

  const handleStart = () => {
    const baseTeam = AVAILABLE_TEAMS.find(t => t.id === selectedTeamId)!;
    const fullTeam = setupUserTeam(baseTeam);
    
    const coach: Coach = {
      id: "coach_user",
      firstName,
      lastName,
      recruiting,
      offense,
      defense,
      development,
      level: 1,
      experience: 0,
      skillPoints: 0,
      traitPoints: 1, // Start with 1 trait point for early customization
      traits: [],
      careerWins: 0,
      careerLosses: 0,
      history: [],
    };

    startSeason(fullTeam, coach);
  };

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#07111b] text-white">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08),transparent_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[900px] flex-col px-6 py-10 sm:px-12 sm:py-16">
        <header className="mb-12 border-b border-white/8 pb-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.45em] text-cyan-200/70">
            Career Foundation
          </div>
          <h1 className="mt-4 text-5xl font-black uppercase tracking-tight text-white sm:text-6xl">
            New Career
          </h1>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <section className="flex flex-col gap-10">
            {/* Coach Profile */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">1. Coach Profile</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InputGroup label="First Name" value={firstName} onChange={setFirstName} />
                <InputGroup label="Last Name" value={lastName} onChange={setLastName} />
              </div>
            </div>

            {/* Program Selection */}
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">2. Select Program</h2>
                <input 
                  type="text"
                  placeholder="Search programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
              
              <div className="mt-6 grid h-[400px] gap-3 overflow-y-auto pr-2 scrollbar-hide">
                {AVAILABLE_TEAMS
                  .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.region.toLowerCase().includes(searchTerm.toLowerCase()))
                  .slice(0, 50) // Limit to 50 for performance
                  .map((t) => (
                  <TeamCard 
                    key={t.id} 
                    team={t} 
                    selected={selectedTeamId === t.id} 
                    onSelect={() => setSelectedTeamId(t.id)} 
                  />
                ))}
                {AVAILABLE_TEAMS.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 50 && (
                   <div className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-white/20">
                     Keep typing to narrow down {AVAILABLE_TEAMS.length} teams...
                   </div>
                )}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-8">
            <div className="sticky top-10 rounded-[32px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
              <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-200/50">Strategy Focus</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/30">
                Choose your coaching philosophy. These can be improved as you level up.
              </p>

              <div className="mt-8 flex flex-col gap-6">
                <RatingSlider label="Recruiting" value={recruiting} onChange={setRecruiting} color="emerald" />
                <RatingSlider label="Offense" value={offense} onChange={setOffense} color="cyan" />
                <RatingSlider label="Defense" value={defense} onChange={setDefense} color="red" />
                <RatingSlider label="Player Dev" value={development} onChange={setDevelopment} color="amber" />
              </div>

              <button
                onClick={handleStart}
                className="group mt-10 w-full rounded-2xl bg-cyan-400 py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition-all hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-95"
              >
                Launch Career
              </button>
              
              <button
                onClick={() => setScreen("menu")}
                className="mt-3 w-full rounded-2xl border border-white/10 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 transition hover:bg-white/5 hover:text-white/60"
              >
                Back to Menu
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</label>
      <input
        type="text"
        id={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        title={label}
        placeholder={`Enter ${label}...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/10 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
      />
    </div>
  );
}

function TeamCard({ team: t, selected, onSelect }: { team: any; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`relative flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all ${
        selected 
          ? "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]" 
          : "border-white/8 bg-white/[0.02] hover:bg-white/5"
      }`}
    >
      <div 
        className="h-10 w-10 rounded-full shadow-inner border border-white/10" 
        style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.secondaryColor})` }} 
      />
      <div className="flex flex-col items-start">
        <div className="text-sm font-bold text-white">{t.name} {t.nickname}</div>
        <div className="text-[10px] uppercase tracking-widest text-white/30">{t.region} Region · {t.abbreviation}</div>
      </div>
      {selected && (
        <div className="ml-auto rounded-full bg-cyan-400 px-2 py-0.5 text-[8px] font-black uppercase text-slate-900">Selected</div>
      )}
    </button>
  );
}

function RatingSlider({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  const barColor = color === "emerald" ? "bg-emerald-400" :
                   color === "cyan"    ? "bg-cyan-400" :
                   color === "red"     ? "bg-red-400" :
                                         "bg-amber-400";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</span>
        <span className={`text-xs font-black ${color === "emerald" ? "text-emerald-400" : color === "cyan" ? "text-cyan-400" : color === "red" ? "text-red-400" : "text-amber-400"}`}>{value}</span>
      </div>
      <input
        type="range"
        min="30"
        max="70"
        title={label}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-cyan-400"
      />
    </div>
  );
}
