import React from "react";
import { useGameStore } from "../store/gameStore";
import { 
  Trophy, 
  Gamepad2, 
  Settings as SettingsIcon, 
  Play, 
  Clock, 
  Users, 
  Info,
  ChevronRight,
  ShieldCheck,
  Star
} from "lucide-react";

// Local asset path from previous step
const HERO_IMAGE = "college_basketball_main_menu_hero_1778534953987.png";

const MenuButton = ({ onClick, icon: Icon, children, primary, subtitle }: any) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center justify-between w-full p-6 rounded-3xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
      primary 
        ? "bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-900/40" 
        : "bg-white/5 border border-white/10 hover:bg-white/10"
    }`}
  >
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${primary ? 'bg-white/20' : 'bg-blue-600/20'}`}>
        <Icon className={`w-6 h-6 ${primary ? 'text-white' : 'text-blue-400'}`} />
      </div>
      <div className="text-left">
        <div className={`text-xl font-black uppercase tracking-wider ${primary ? 'text-white' : 'text-white/90'}`}>
          {children}
        </div>
        {subtitle && <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${primary ? 'text-white/60' : 'text-white/30'}`}>{subtitle}</div>}
      </div>
    </div>
    <ChevronRight className={`w-5 h-5 ${primary ? 'text-white/40' : 'text-white/10'} group-hover:translate-x-1 transition-transform`} />
  </button>
);

export default function MainMenu() {
  const { startExhibition, setScreen, season } = useGameStore();

  return (
    <div className="min-h-screen bg-[#07090c] text-white font-['Inter'] relative overflow-hidden flex flex-col lg:flex-row">
      
      {/* Visual Side (Hero) */}
      <div className="relative w-full lg:w-3/5 h-[40vh] lg:h-screen overflow-hidden group">
        <img 
          src={HERO_IMAGE} 
          alt="College Basketball Hero" 
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-[10000ms] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#07090c] via-transparent to-transparent" />
        
        {/* Brand Overlay */}
        <div className="absolute top-12 left-12 z-20">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Trophy className="w-6 h-6 text-white" />
             </div>
             <div className="text-xs font-black uppercase tracking-[0.6em] text-white/40">Athletic Division</div>
          </div>
          <h1 className="text-6xl lg:text-8xl font-black italic uppercase leading-none tracking-tighter">
            COLLEGE<br />
            <span className="text-blue-600">BALL</span>
          </h1>
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-12 left-12 z-20 hidden lg:block">
           <div className="flex items-center gap-8">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Sim Engine</div>
                <div className="text-sm font-bold text-white/80">Hyper-Reactive AI v2.4</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Program Count</div>
                <div className="text-sm font-bold text-white/80">350+ Division 1 Teams</div>
              </div>
           </div>
        </div>
      </div>

      {/* Menu Side */}
      <div className="flex-1 flex flex-col justify-center p-8 lg:p-20 relative z-10 bg-[#07090c]">
        <div className="max-w-md w-full mx-auto space-y-4">
          
          <div className="mb-12">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Main Menu</h2>
            <p className="text-white/40 text-sm italic">The journey to the championship begins with a single tip-off.</p>
          </div>

          {season ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-[32px] p-6 mb-8 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-10 transform group-hover:scale-110 transition-transform">
                  <Star className="w-24 h-24 text-white" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Active Career</span>
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{season.team.name} {season.team.nickname}</span>
                  </div>
                  <div className="text-3xl font-black italic uppercase tracking-tight mb-4">
                    SEASON {season.year}
                  </div>
                  <div className="flex items-center gap-6 mb-6">
                    <div>
                      <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Record</div>
                      <div className="text-xl font-black">{season.record.wins}–{season.record.losses}</div>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div>
                      <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Current Rank</div>
                      <div className="text-xl font-black text-blue-400">#{season.rank || "NR"}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setScreen("season")}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-blue-400 transition-colors active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    Continue Legacy
                  </button>
                </div>
              </div>

              <MenuButton 
                onClick={() => setScreen("new-game")} 
                icon={Users}
                subtitle="Start a fresh 10-season coaching career"
              >
                New Career
              </MenuButton>
            </div>
          ) : (
            <MenuButton 
              onClick={() => setScreen("new-game")} 
              icon={Gamepad2} 
              primary
              subtitle="Build a program over 10 seasons"
            >
              Start Career
            </MenuButton>
          )}

          <MenuButton 
            onClick={startExhibition} 
            icon={Play}
            subtitle="Quick play with random matchups"
          >
            Exhibition
          </MenuButton>

          <MenuButton 
            onClick={() => setScreen("settings")} 
            icon={SettingsIcon}
            subtitle="Audio, Gameplay, and Video preferences"
          >
            Settings
          </MenuButton>

          <div className="pt-12 flex items-center justify-between border-t border-white/5">
             <div className="flex gap-4">
               <button className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Credits
               </button>
               <button className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> License
               </button>
             </div>
             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10">Build ID: CB-LEGACY-26</div>
          </div>
        </div>
      </div>
    </div>
  );
}
