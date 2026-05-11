/**
 * JobOffersScreen – the "Coaching Carousel" interface.
 *
 * Players review offers from other programs at the end of a season.
 * They can choose to accept a new challenge or stay put.
 */

import { useGameStore } from "../store/gameStore";
import type { JobOffer } from "../game/types";

export default function JobOffersScreen() {
  const season = useGameStore((s) => s.season);
  const acceptJobOffer = useGameStore((s) => s.acceptJobOffer);
  const stayAtSchool = useGameStore((s) => s.stayAtSchool);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!season || !season.jobOffers || season.jobOffers.length === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#07111b] text-white">
        <h2 className="text-2xl font-black uppercase">No Active Offers</h2>
        <button 
          onClick={() => setScreen("season")}
          className="mt-6 rounded-full bg-white/5 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white/50 transition hover:bg-white/10"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#07090c] text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 bg-dot-grid opacity-20" />
      <div className="fixed inset-0 z-0 glow-mesh opacity-30" />
      
      {/* Floating Orbs */}
      <div className="fixed top-[15%] right-[10%] w-[35vw] h-[35vw] bg-cyan-600/10 rounded-full blur-[130px] animate-float pointer-events-none" />
      <div className="fixed bottom-[15%] left-[10%] w-[30vw] h-[30vw] bg-blue-600/10 rounded-full blur-[110px] animate-float pointer-events-none" style={{ animationDelay: '-8s' }} />

      <div className="fixed top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[1000px] px-6 py-12 sm:py-20">
        <header className="mb-16 text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.6em] text-cyan-400/60">The Coaching Carousel</div>
          <h1 className="mt-4 text-5xl font-black uppercase tracking-tight text-white sm:text-7xl">Job Offers</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/40">
            Your reputation precedes you. Programs across the nation are looking for leadership. 
            Choose your next destination carefully.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {season.jobOffers.map((offer) => (
            <JobOfferCard 
              key={offer.id} 
              offer={offer} 
              onAccept={() => acceptJobOffer(offer.id)} 
            />
          ))}

          {/* Stay Put Card */}
          <div className="glass-thick group relative overflow-hidden rounded-[40px] border border-white/5 p-10 transition-all hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
            <div className="relative flex h-full flex-col items-center justify-center text-center">
               <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-4xl shadow-2xl">
                 ðŸ   
               </div>
               <h3 className="mt-6 text-3xl font-black uppercase tracking-tight">Stay at {season.team.name}</h3>
               <p className="mt-3 text-xs leading-relaxed text-white/30">
                 Commit to the program you've built. Continue your legacy with the {season.team.nickname}.
               </p>
               <button 
                onClick={() => {
                  stayAtSchool();
                  setScreen("season");
                }}
                className="mt-8 rounded-2xl bg-white/10 px-10 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/20 active:scale-95"
               >
                Reject All Offers
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JobOfferCard({ offer, onAccept }: { offer: JobOffer; onAccept: () => void }) {
  return (
    <div className="glass-medium group relative overflow-hidden rounded-[48px] border border-white/5 p-1 transition-all duration-500 hover:border-cyan-400/40 hover:scale-[1.01] hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)]">
      <div className="relative overflow-hidden rounded-[44px] bg-slate-950/40 p-8 sm:p-12 backdrop-blur-3xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-[100px] group-hover:bg-cyan-400/20 transition-all duration-1000" />
        
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                  {offer.expectations}
                </span>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Prestige {offer.prestige}</span>
              </div>
              <h2 className="mt-5 text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white italic">{offer.teamName}</h2>
              <div className="mt-2 text-sm font-bold text-white/40 uppercase tracking-widest">Official Offer Sheet</div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-y-10 border-t border-white/5 pt-10">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Annual Package</div>
              <div className="text-3xl font-black text-white italic">${(offer.salary / 1000).toFixed(0)}K</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">NIL Resources</div>
              <div className="text-3xl font-black text-cyan-400 italic">${(offer.nilBudget / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Recruiting</div>
              <div className="text-3xl font-black text-white italic">{offer.recruitingBudget} <span className="text-xs text-white/40 not-italic">PTS</span></div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Term</div>
              <div className="text-3xl font-black text-white italic">4 <span className="text-xs text-white/40 not-italic">YEARS</span></div>
            </div>
          </div>

          <button 
            onClick={onAccept}
            className="mt-12 w-full rounded-3xl bg-cyan-500 py-6 text-[13px] font-black uppercase tracking-[0.3em] text-slate-950 transition-all duration-300 hover:bg-cyan-400 hover:shadow-[0_20px_50px_rgba(34,211,238,0.4)] active:scale-95 flex items-center justify-center gap-3 group"
          >
            Accept Contract
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
