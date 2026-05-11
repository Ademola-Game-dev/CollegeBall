import React from "react";
import { useGameStore } from "../store/gameStore";
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Shield, 
  Target, 
  Award, 
  ChevronRight, 
  ArrowLeft,
  Briefcase,
  History,
  Star
} from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { BackgroundAmbience } from "../components/BackgroundAmbience";

const StatCard = ({ label, value, icon: Icon, color, onUpgrade, canUpgrade }: any) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-white/60 text-xs font-medium uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
    </div>
    {canUpgrade && (
      <button 
        onClick={onUpgrade}
        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 active:scale-95"
      >
        <TrendingUp className="w-4 h-4" />
      </button>
    )}
  </div>
);

export default function CoachHub() {
  const { season, setScreen, upgradeCoach } = useGameStore();
  const coach = season?.coach;

  if (!coach) return null;

  const xpNeeded = coach.level * 120 + 80;
  const xpProgress = (coach.experience / xpNeeded) * 100;

  const careerWinPct = (coach.careerWins + coach.careerLosses) > 0 
    ? ((coach.careerWins / (coach.careerWins + coach.careerLosses)) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#07090c] text-white p-6 md:p-10 font-['Inter']">
      <BackgroundAmbience />
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <ScreenHeader 
          title={`${coach.firstName} ${coach.lastName}`}
          subtitle="Head Coach"
          category={`Level ${coach.level}`}
          categoryColor="bg-blue-600"
          onBack={() => setScreen("season")}
          actions={
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="text-right">
                <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Experience</div>
                <div className="text-sm font-bold text-white">{coach.experience} / {xpNeeded} XP</div>
              </div>
              <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          }
        />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Upgrades */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-thick group relative overflow-hidden rounded-[40px] border border-white/5 p-8 transition-all duration-500 hover:border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
            <div className="absolute top-[-20%] right-[-10%] p-6 opacity-5 transform group-hover:scale-110 transition-transform duration-1000">
              <Award className="w-64 h-64" />
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-3 italic">
                <Target className="w-5 h-5 text-blue-500" />
                COACHING ATTRIBUTES
              </h2>
              {coach.skillPoints > 0 && (
                <div className="bg-amber-500/20 text-amber-500 text-xs font-black px-3 py-1.5 rounded-full border border-amber-500/30 animate-pulse">
                  {coach.skillPoints} SKILL POINTS AVAILABLE
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard 
                label="Offensive System" 
                value={coach.offense} 
                icon={Target} 
                color="bg-red-600" 
                canUpgrade={coach.skillPoints > 0}
                onUpgrade={() => upgradeCoach("offense")}
              />
              <StatCard 
                label="Defensive Scheme" 
                value={coach.defense} 
                icon={Shield} 
                color="bg-blue-600" 
                canUpgrade={coach.skillPoints > 0}
                onUpgrade={() => upgradeCoach("defense")}
              />
              <StatCard 
                label="Recruiting" 
                value={coach.recruiting} 
                icon={Users} 
                color="bg-purple-600" 
                canUpgrade={coach.skillPoints > 0}
                onUpgrade={() => upgradeCoach("recruiting")}
              />
              <StatCard 
                label="Player Development" 
                value={coach.development} 
                icon={TrendingUp} 
                color="bg-emerald-600" 
                canUpgrade={coach.skillPoints > 0}
                onUpgrade={() => upgradeCoach("development")}
              />
            </div>
          </div>

          {/* Career Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Career Wins</div>
              <div className="text-3xl font-black text-white">{coach.careerWins}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Win Percentage</div>
              <div className="text-3xl font-black text-white">{careerWinPct}%</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Championships</div>
              <div className="text-3xl font-black text-amber-500">{coach.championships || 0}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Tourney Apps</div>
              <div className="text-3xl font-black text-blue-400">{coach.tourneyAppearances || 0}</div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-6 italic">
              <History className="w-5 h-5 text-blue-500" />
              PROGRAM HISTORY
            </h2>
            <div className="overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest">
                    <th className="pb-4">Season</th>
                    <th className="pb-4">Program</th>
                    <th className="pb-4">Record</th>
                    <th className="pb-4">Postseason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {coach.history.length > 0 ? (
                    coach.history.map((h, i) => (
                      <tr key={i} className="group hover:bg-white/5 transition-colors">
                        <td className="py-4 text-sm font-bold text-white/80">{h.year}</td>
                        <td className="py-4 text-sm font-bold text-white">{h.teamName}</td>
                        <td className="py-4 text-sm font-mono text-white/60">{h.wins}–{h.losses}</td>
                        <td className="py-4">
                          {h.postseason ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                              {h.postseason}
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/20">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-white/20 text-sm italic italic">No historical data available. First season in progress.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Specializations & Traits */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3 italic">
                <Star className="w-5 h-5 text-amber-500" />
                TRAITS
              </h2>
              {coach.traitPoints > 0 && (
                <div className="text-[10px] font-black bg-amber-500 text-black px-2 py-1 rounded">
                  {coach.traitPoints} PT
                </div>
              )}
            </div>

            <div className="space-y-4">
              {coach.traits.length > 0 ? (
                coach.traits.map((trait, i) => (
                  <div key={i} className="bg-white/10 border border-white/10 p-4 rounded-xl flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{trait}</div>
                      <div className="text-[10px] text-white/40 leading-relaxed mt-1">Specialized bonus providing passive boosts to program performance.</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-white/20">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="text-sm italic">No specialized traits unlocked yet. Unlocked at levels 3, 6, 9...</p>
                </div>
              )}
            </div>
            
            {coach.traitPoints > 0 && (
              <button className="w-full mt-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-400 transition-colors active:scale-95">
                Unlock New Trait
              </button>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
             <h2 className="text-lg font-bold mb-4 italic">CAREER PHILOSOPHY</h2>
             <p className="text-sm text-white/40 leading-relaxed italic">
               "{coach.firstName} is known for a {coach.offense > 75 ? 'fast-paced offensive' : coach.defense > 75 ? 'hard-nosed defensive' : 'balanced'} style that prioritizes {coach.recruiting > coach.development ? 'raw talent acquisition' : 'steady player growth'}. Building a legacy one game at a time."
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
