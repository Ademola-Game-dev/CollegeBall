import React, { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { 
  Users, 
  Search, 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  Contact, 
  CheckCircle2, 
  History,
  Info,
  ArrowRight,
  TrendingUp,
  School
} from "lucide-react";

const TransferRow = ({ prospect, onContact, onOffer, onScout }: any) => {
  const isCommitted = prospect.committed;
  
  return (
    <div className={`glass-medium group relative overflow-hidden rounded-[32px] border p-5 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${isCommitted ? 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_20px_60px_-10px_rgba(16,185,129,0.15)]' : 'border-white/5 bg-slate-950/40 hover:border-white/20 hover:bg-slate-900/60 shadow-2xl backdrop-blur-3xl'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
      {isCommitted && (
        <div className="absolute top-0 right-0 p-2">
          <div className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-tighter">
            Signed
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xl font-black text-white shadow-xl shadow-blue-900/20">
            {prospect.position}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border-2 border-white/20 flex items-center justify-center text-[10px] font-bold">
            {prospect.rating > 0 && prospect.scouted ? prospect.rating : "?"}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-black tracking-tight text-white uppercase group-hover:text-blue-400 transition-colors">
              {prospect.firstName} {prospect.lastName}
            </h3>
            {prospect.isTransfer && (
              <span className="text-[10px] bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded font-bold border border-blue-600/30">TRANSFER</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-white/40 text-xs">
            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
              <School className="w-3.5 h-3.5" />
              <span>from {prospect.previousSchool}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{prospect.region}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span>POT: {prospect.potentialRange[0]}-{prospect.potentialRange[1]}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden lg:block text-right">
          <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Interest Level</div>
          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${prospect.interestLevel > 0.7 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : prospect.interestLevel > 0.4 ? 'bg-blue-500' : 'bg-red-500'}`} 
              style={{ width: `${prospect.interestLevel * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!prospect.scouted && (
             <button 
               onClick={() => onScout(prospect.id)}
               className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
               title="Scout ratings"
             >
               <Search className="w-5 h-5" />
             </button>
          )}
          <button 
            onClick={() => onContact(prospect.id)}
            disabled={isCommitted}
            className={`p-3 rounded-xl border transition-all ${isCommitted ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-blue-500/50'}`}
            title="Contact Prospect"
          >
            <Contact className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onOffer(prospect.id)}
            disabled={isCommitted}
            className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${isCommitted ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-500 cursor-default flex items-center gap-2' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 active:scale-95'}`}
          >
            {isCommitted ? (
              <><CheckCircle2 className="w-4 h-4" /> Committed</>
            ) : prospect.offered ? (
              "Waiting..."
            ) : (
              "Offer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TransferPortalScreen() {
  const { season, prospects, scoutingPoints, scoutProspect, pitchProspect, offerProspect, setScreen, finishRecruiting } = useGameStore();
  const [filter, setFilter] = useState("ALL");

  if (!season) return null;

  const transfers = prospects.filter(p => p.isTransfer);
  const filteredTransfers = filter === "ALL" ? transfers : transfers.filter(p => p.position === filter);
  const committedCount = transfers.filter(p => p.committed).length;

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#07090c] text-white p-6 md:p-10 font-['Inter']">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 bg-dot-grid opacity-20" />
      <div className="fixed inset-0 z-0 glow-mesh opacity-30" />
      
      {/* Floating Orbs - Portal Focus (Deep Blue/Purple) */}
      <div className="fixed top-[15%] right-[5%] w-[35vw] h-[35vw] bg-indigo-600/10 rounded-full blur-[130px] animate-float pointer-events-none" />
      <div className="fixed bottom-[15%] left-[5%] w-[30vw] h-[30vw] bg-blue-600/10 rounded-full blur-[110px] animate-float pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-2xl shadow-blue-900/20">
              <GraduationCap className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic italic">
                  TRANSFER <span className="text-blue-500">PORTAL</span>
                </h1>
                <div className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded">PHASE 2</div>
              </div>
              <p className="text-white/40 text-sm font-medium tracking-wide">Secure veteran talent to bolster your roster for the upcoming season.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center min-w-[120px] backdrop-blur-md">
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Scouting Pts</div>
              <div className="text-2xl font-black text-white">{scoutingPoints}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center min-w-[120px] backdrop-blur-md border-emerald-500/20">
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Committed</div>
              <div className="text-2xl font-black text-emerald-400">{committedCount}</div>
            </div>
          </div>
        </div>

        {/* Tactical Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
            {["ALL", "PG", "SG", "SF", "PF", "C"].map((pos) => (
              <button
                key={pos}
                onClick={() => setFilter(pos)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${filter === pos ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                {pos}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => finishRecruiting()}
            className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 group active:scale-95"
          >
            Finalize Roster
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Portal Feed */}
        <div className="space-y-4">
          {filteredTransfers.length > 0 ? (
            filteredTransfers.map((p) => (
              <TransferRow 
                key={p.id} 
                prospect={p} 
                onContact={pitchProspect}
                onOffer={offerProspect}
                onScout={scoutProspect}
              />
            ))
          ) : (
            <div className="py-32 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
              <Users className="w-16 h-16 mx-auto mb-6 text-white/10" />
              <h3 className="text-xl font-bold text-white/40">No transfers found in this category</h3>
              <p className="text-sm text-white/20 mt-2 italic italic">Check back next week or expand your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
