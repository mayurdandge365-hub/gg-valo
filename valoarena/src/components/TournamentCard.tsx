import { motion } from 'motion/react';
import { Users, Trophy, ChevronRight, Zap, Target, Medal } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

interface Tournament {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  playersCount: number;
  status: 'open' | 'full' | 'in-progress' | 'completed';
  startTime: any;
  winners?: { userId: string; displayName: string; score: number }[];
}

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const { profile, user } = useAuth();

  const handleJoin = async () => {
    if (!user || !profile) {
      alert('Please sign in to join');
      return;
    }

    if (profile.balance < tournament.entryFee) {
      alert('Insufficient funds. Check your wallet.');
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const tournamentRef = doc(db, 'tournaments', tournament.id);
        const userRef = doc(db, 'users', user.uid);
        const participantRef = doc(db, `tournaments/${tournament.id}/participants`, user.uid);
        
        const tourneyDoc = await transaction.get(tournamentRef);
        if (!tourneyDoc.exists()) throw "Tournament not found";
        
        const data = tourneyDoc.data();
        if (data.playersCount >= data.maxPlayers) throw "Tournament is full";
        if (data.status !== 'open') throw "Tournament not open";

        // Check if already joined
        const pDoc = await transaction.get(participantRef);
        if (pDoc.exists()) throw "Already registered";

        transaction.set(participantRef, {
          joinedAt: serverTimestamp(),
          userId: user.uid,
          displayName: profile.displayName
        });

        transaction.update(tournamentRef, {
          playersCount: data.playersCount + 1,
          status: data.playersCount + 1 === data.maxPlayers ? 'full' : 'open'
        });

        transaction.update(userRef, {
          balance: profile.balance - tournament.entryFee
        });

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          userId: user.uid,
          amount: tournament.entryFee,
          type: 'entry_fee',
          tournamentId: tournament.id,
          description: `Entry fee for ${tournament.name}`,
          timestamp: serverTimestamp()
        });
      });
      alert('Mission Accepted. Deploying to Arena.');
    } catch (e) {
      console.error(e);
      alert('Deployment failed: ' + e);
    }
  };

  const isFull = tournament.playersCount >= tournament.maxPlayers;
  const isCompleted = tournament.status === 'completed';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "glass-card rounded-2xl p-6 val-border relative group overflow-hidden transition-all",
        isCompleted ? "opacity-90 border-white/5" : "hover:shadow-2xl hover:shadow-cyan-400/5 hover:border-cyan-400/30"
      )}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#FF4655] mb-1 font-black block">VALORANT PROTOCOL</span>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-cyan-400 transition-colors">{tournament.name}</h3>
        </div>
        <div className={cn(
          "px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest",
          tournament.status === 'open' ? "bg-green-500/10 text-green-400" : 
          tournament.status === 'completed' ? "bg-white/10 text-white/40" : "bg-yellow-500/10 text-yellow-500"
        )}>
          {tournament.status}
        </div>
      </div>

      {!isCompleted ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col group-hover:bg-white/10 transition-colors">
              <span className="text-[10px] uppercase text-white/40 mb-1 font-bold tracking-widest">Entry Unit</span>
              <span className="font-mono font-black text-white text-lg">{formatCurrency(tournament.entryFee)}</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col group-hover:bg-white/10 transition-colors">
              <span className="text-[10px] uppercase text-white/40 mb-1 font-bold tracking-widest">Bounty Pool</span>
              <span className="font-mono font-black text-cyan-400 text-lg">{formatCurrency(tournament.prizePool)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-white/40 font-bold">
              <span>Roster Depth</span>
              <span className="text-white font-mono">{tournament.playersCount}/{tournament.maxPlayers}</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(tournament.playersCount / tournament.maxPlayers) * 100}%` }}
                className="h-full bg-cyan-400 transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-white/20" />
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Incursion Window</span>
              </div>
              <span className="text-white/80 text-[10px] font-mono font-bold">
                {tournament.startTime?.toDate ? format(tournament.startTime.toDate(), 'HH:mm | MMM dd') : 'IMMEDIATE'}
              </span>
            </div>
            
            <button 
              onClick={handleJoin}
              disabled={isFull || isCompleted || tournament.status !== 'open'}
              className={cn(
                "w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                isFull || isCompleted 
                  ? "bg-white/5 text-white/20 cursor-not-allowed" 
                  : "accent-gradient text-white hover:glow-cyan shadow-xl active:scale-95"
              )}
            >
              {isFull ? 'Roster Sealed' : isCompleted ? 'Terminal Phase' : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Initiate Deployment
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#FF4655]/10 border border-[#FF4655]/20 p-4 rounded-xl">
             <div className="flex items-center gap-2 mb-3">
               <Trophy className="w-4 h-4 text-yellow-500" />
               <span className="text-[10px] uppercase font-black text-white tracking-widest underline decoration-yellow-500 underline-offset-4">Top Operatives</span>
             </div>
             <div className="space-y-2">
               {tournament.winners?.map((winner, idx) => (
                 <div key={winner.userId} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                   <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center text-[10px] font-black",
                        idx === 0 ? "bg-yellow-500 text-black" : idx === 1 ? "bg-slate-300 text-black" : "bg-amber-600 text-white"
                      )}>
                        {idx + 1}
                      </div>
                      <span className="text-xs font-bold text-white/80 truncate max-w-[100px]">{winner.displayName}</span>
                   </div>
                   <span className="text-cyan-400 font-mono text-xs font-bold">{winner.score} pts</span>
                 </div>
               ))}
             </div>
          </div>
          <div className="pt-4 border-t border-white/5">
            <button className="w-full py-3 rounded-lg bg-white/5 text-white/40 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">
              View After-Action Report
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

import { collection } from 'firebase/firestore';
