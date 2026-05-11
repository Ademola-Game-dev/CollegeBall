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
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#07111b] text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.08),transparent_70%)]" />
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
    <div className="glass-medium group relative overflow-hidden rounded-[40px] border border-white/5 p-1 transition-all hover:border-cyan-400/30">
      <div className="relative overflow-hidden rounded-[36px] bg-slate-900/40 p-8 sm:p-10">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/5 blur-3xl group-hover:bg-cyan-400/10 transition-all" />
        
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                  {offer.expectations}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Prestige: {offer.prestige}</span>
              </div>
              <h2 className="mt-4 text-4xl font-black uppercase tracking-tight text-white">{offer.teamName}</h2>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-2xl font-black italic text-white/20">
              {offer.teamName.substring(0, 1)}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-8 border-y border-white/5 py-8 mobile-stack">
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/20">Annual Salary</div>
              <div className="mt-1 text-2xl font-black text-white">${(offer.salary / 1000).toFixed(0)}k</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/20">NIL Resources</div>
              <div className="mt-1 text-2xl font-black text-cyan-400">${(offer.nilBudget / 1000).toFixed(0)}k</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/20">Recruiting</div>
              <div className="mt-1 text-2xl font-black text-white">{offer.recruitingBudget} pts</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/20">Contract</div>
              <div className="mt-1 text-2xl font-black text-white">4 Years</div>
            </div>
          </div>

          <button 
            onClick={onAccept}
            className="mt-8 w-full rounded-2xl bg-cyan-400 py-5 text-[12px] font-black uppercase tracking-[0.25em] text-slate-950 transition-all hover:bg-cyan-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-95"
          >
            Accept Job Offer
          </button>
        </div>
      </div>
    </div>
  );
}
