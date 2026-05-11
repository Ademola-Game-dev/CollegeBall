import React from "react";
import { useGameStore } from "../store/gameStore";
import { 
  Volume2, 
  Settings, 
  Gamepad2, 
  Video, 
  Clock, 
  ArrowLeft,
  Check,
  ChevronRight,
  ShieldAlert,
  Trophy
} from "lucide-react";

const SettingRow = ({ label, description, icon: Icon, children }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-colors">
        <Icon className="w-5 h-5 text-white/40 group-hover:text-blue-400 transition-colors" />
      </div>
      <div>
        <div className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors uppercase tracking-wider">{label}</div>
        <div className="text-xs text-white/30 mt-1 max-w-sm">{description}</div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {children}
    </div>
  </div>
);

const ToggleButton = ({ active, onClick, children }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
        : "bg-white/5 text-white/30 hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

export default function SettingsScreen() {
  const { settings, setScreen } = useGameStore();
  
  const updateSettings = (updates: any) => {
    useGameStore.setState((state) => ({
      settings: { ...state.settings, ...updates }
    }));
  };

  const DIFFICULTIES = ["Freshman", "Varsity", "All-American", "Legend"];
  const CAMERAS = ["broadcast", "overhead", "endzone"];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-10 font-['Inter'] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="flex items-center gap-6 mb-12">
          <button 
            onClick={() => setScreen("menu")}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors group"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-1">System Preferences</div>
            <h1 className="text-4xl font-black uppercase tracking-tight italic">Game <span className="text-blue-500">Settings</span></h1>
          </div>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-md">
          {/* Audio Section */}
          <div className="px-8 py-4 bg-white/5 border-b border-white/10">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
              <Volume2 className="w-3 h-3" /> Audio & Sound
            </h2>
          </div>
          <SettingRow 
            label="Master Volume" 
            description="Adjust the overall volume of the game, including crowd and sound effects."
            icon={Volume2}
          >
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={settings.audioVolume} 
              onChange={(e) => updateSettings({ audioVolume: parseFloat(e.target.value) })}
              className="w-32 accent-blue-600 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
            <span className="text-xs font-mono text-white/40 w-8 text-right">{Math.round(settings.audioVolume * 100)}%</span>
          </SettingRow>

          {/* Gameplay Section */}
          <div className="px-8 py-4 bg-white/5 border-b border-white/10 mt-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
              <Gamepad2 className="w-3 h-3" /> Gameplay & Difficulty
            </h2>
          </div>
          <SettingRow 
            label="Game Difficulty" 
            description="Affects AI intelligence, shot accuracy, and recruiting difficulty."
            icon={Trophy}
          >
            <div className="flex gap-1">
              {DIFFICULTIES.map((d, i) => (
                <ToggleButton 
                  key={d} 
                  active={settings.difficulty === i}
                  onClick={() => updateSettings({ difficulty: i })}
                >
                  {d}
                </ToggleButton>
              ))}
            </div>
          </SettingRow>

          <SettingRow 
            label="Half Length" 
            description="Duration of each half in minutes. (NCAA standard is 20:00)"
            icon={Clock}
          >
            <div className="flex gap-1">
              {[5, 10, 20].map((m) => (
                <ToggleButton 
                  key={m} 
                  active={settings.halfLength === m * 60}
                  onClick={() => updateSettings({ halfLength: m * 60 })}
                >
                  {m}:00
                </ToggleButton>
              ))}
            </div>
          </SettingRow>

          {/* Visual Section */}
          <div className="px-8 py-4 bg-white/5 border-b border-white/10 mt-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
              <Video className="w-3 h-3" /> Presentation
            </h2>
          </div>
          <SettingRow 
            label="Default Camera" 
            description="The preferred viewing angle when starting a new game."
            icon={Video}
          >
            <div className="flex gap-1">
              {CAMERAS.map((c) => (
                <ToggleButton 
                  key={c} 
                  active={settings.defaultCamera === c}
                  onClick={() => updateSettings({ defaultCamera: c })}
                >
                  {c}
                </ToggleButton>
              ))}
            </div>
          </SettingRow>

          <SettingRow 
            label="Home Court Bonus" 
            description="Enable small attribute boosts for the home team to simulate crowd energy."
            icon={ShieldAlert}
          >
             <ToggleButton 
               active={settings.homeCourtBonus} 
               onClick={() => updateSettings({ homeCourtBonus: !settings.homeCourtBonus })}
             >
               {settings.homeCourtBonus ? "Enabled" : "Disabled"}
             </ToggleButton>
          </SettingRow>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">Version 1.2.0 · Build Stable</p>
        </div>
      </div>
    </div>
  );
}
