/**
 * TournamentScreen – displays brackets and results for postseason tournaments.
 */

import { useGameStore } from "../store/gameStore";
import type { Tournament, TournamentRound, TournamentGame } from "../game/types";

export default function TournamentScreen() {
  const season = useGameStore((s) => s.season);
  const setScreen = useGameStore((s) => s.setScreen);
  const advanceTournamentRound = useGameStore((s) => s.advanceTournamentRound);
  const isSimulating = useGameStore((s) => s.isSimulating);

  if (!season || !season.tournaments || season.tournaments.length === 0) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#07111b] text-white">
        <h2 className="text-2xl font-black uppercase">No Active Tournaments</h2>
        <button 
          onClick={() => setScreen("season")}
          className="mt-6 rounded-full bg-white/5 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white/50 transition hover:bg-white/10"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  const activeTourney = season.tournaments[0]; // For now show the first one

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#07090c] text-white">
       {/* Background Ambience */}
       <div className="fixed inset-0 z-0 bg-dot-grid opacity-20" />
       <div className="fixed inset-0 z-0 glow-mesh opacity-30" />
       
       {/* Floating Orbs */}
       <div className="fixed top-[5%] left-[5%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[140px] animate-float pointer-events-none" />
       <div className="fixed bottom-[5%] right-[5%] w-[35vw] h-[35vw] bg-amber-600/10 rounded-full blur-[120px] animate-float pointer-events-none" style={{ animationDelay: '-12s' }} />
       <div className="fixed top-[40%] right-[10%] w-[25vw] h-[25vw] bg-purple-600/10 rounded-full blur-[100px] animate-float pointer-events-none" style={{ animationDelay: '-6s' }} />
       
       {isSimulating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
            <div className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-400 animate-pulse">Simulating Round...</div>
          </div>
        </div>
      )}

       <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-12">
          <header className="flex flex-col items-center justify-between gap-6 border-b border-white/5 pb-12 lg:flex-row">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.5em] text-cyan-400/60">Postseason Tournament</div>
              <h1 className="mt-2 text-5xl font-black uppercase tracking-tight text-white">{activeTourney.name}</h1>
              <p className="mt-2 text-sm text-white/40">Win or go home. The road to the championship continues.</p>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setScreen("season")}
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-[11px] font-black uppercase tracking-widest text-white/50 transition hover:bg-white/10"
              >
                Season Hub
              </button>
              {!activeTourney.winner && (
                <button 
                  onClick={() => advanceTournamentRound(activeTourney.id)}
                  className="rounded-2xl bg-cyan-400 px-10 py-4 text-[11px] font-black uppercase tracking-widest text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.3)] transition hover:bg-cyan-300"
                >
                  Simulate Round
                </button>
              )}
            </div>
          </header>

          <main className="mt-16 overflow-x-auto pb-12 scrollbar-hide">
             <div className="flex items-start gap-16 min-w-max px-8">
               {activeTourney.bracket.rounds.map((round, rIdx) => (
                 <TournamentRoundColumn 
                  key={round.name} 
                  round={round} 
                  isCurrent={activeTourney.currentRound === rIdx}
                  rIdx={rIdx}
                 />
               ))}
             </div>
          </main>
       </div>
    </div>
  );
}

function TournamentRoundColumn({ round, isCurrent, rIdx }: { round: TournamentRound; isCurrent: boolean; rIdx: number }) {
  return (
    <div className="flex flex-col gap-8 w-72">
      <div className="flex flex-col items-center">
         <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isCurrent ? 'text-cyan-400' : 'text-white/20'}`}>
           Round {rIdx + 1}
         </span>
         <h3 className={`mt-1 text-lg font-black uppercase tracking-tighter ${isCurrent ? 'text-white' : 'text-white/40'}`}>
           {round.name}
         </h3>
      </div>
      
      <div className="flex flex-1 flex-col justify-around gap-6">
        {round.games.map((game) => (
          <TournamentGameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}

function TournamentGameCard({ game }: { game: TournamentGame }) {
  const homeWinner = game.winnerId === game.homeTeam?.id && game.winnerId !== undefined;
  const awayWinner = game.winnerId === game.awayTeam?.id && game.winnerId !== undefined;

  return (
    <div className={`glass-medium relative overflow-hidden rounded-[20px] border transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] ${game.winnerId ? 'border-white/5 bg-slate-900/40' : 'border-white/10 bg-white/5'}`}>
      <div className="flex flex-col p-4 backdrop-blur-md">
        {/* Away Team */}
        <div className={`flex items-center justify-between py-2.5 transition-opacity duration-500 ${awayWinner ? 'opacity-100' : game.winnerId ? 'opacity-30' : 'opacity-80'}`}>
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[8px] font-black text-white/40">{game.awaySeed}</div>
             <span className={`text-[11px] font-black uppercase tracking-tight ${awayWinner ? 'text-blue-400' : 'text-white'}`}>
               {game.awayTeam?.name ?? 'TBD'}
             </span>
          </div>
          <span className={`text-sm font-black ${awayWinner ? 'text-blue-400' : 'text-white/60'}`}>{game.awayScore ?? ''}</span>
        </div>
        
        <div className="h-[1px] w-full bg-white/5 my-1" />

        {/* Home Team */}
        <div className={`flex items-center justify-between py-2.5 transition-opacity duration-500 ${homeWinner ? 'opacity-100' : game.winnerId ? 'opacity-30' : 'opacity-80'}`}>
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[8px] font-black text-white/40">{game.homeSeed}</div>
             <span className={`text-[11px] font-black uppercase tracking-tight ${homeWinner ? 'text-blue-400' : 'text-white'}`}>
               {game.homeTeam?.name ?? 'TBD'}
             </span>
          </div>
          <span className={`text-sm font-black ${homeWinner ? 'text-blue-400' : 'text-white/60'}`}>{game.homeScore ?? ''}</span>
        </div>
      </div>
      
      {game.winnerId && (
        <div className="absolute top-0 right-0 h-full w-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
      )}
    </div>
  );
}
