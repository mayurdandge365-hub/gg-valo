import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  addDoc, 
  getDocs,
  orderBy,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { Shield, Plus, Users, Play, CheckCircle, X, Save, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ParticipantResult {
  userId: string;
  displayName: string;
  kills: number;
  deaths: number;
  score: number;
}

export function AdminPanel() {
  const { isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [resultingTourney, setResultingTourney] = useState<any | null>(null);
  const [participants, setParticipants] = useState<ParticipantResult[]>([]);
  const [matchId, setMatchId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newTourney, setNewTourney] = useState({
    name: '',
    entryFee: 20,
    prizePool: 150,
  });

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setTournaments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tournaments'), {
        ...newTourney,
        maxPlayers: 10,
        playersCount: 0,
        status: 'open',
        startTime: new Date(Date.now() + 86400000), 
        game: 'VALORANT',
        type: 'DEATHMATCH',
        createdAt: serverTimestamp()
      });
      setShowCreate(false);
      setNewTourney({ name: '', entryFee: 20, prizePool: 150 });
    } catch (e) {
      alert('Failed to create: ' + e);
    }
  };

  const startResultEntry = async (tournament: any) => {
    try {
      const pSnap = await getDocs(collection(db, `tournaments/${tournament.id}/participants`));
      const pList = pSnap.docs.map(doc => ({
        userId: doc.id,
        displayName: doc.data().displayName || 'Unknown Agent',
        kills: 0,
        deaths: 0,
        score: 0
      }));
      setParticipants(pList);
      setResultingTourney(tournament);
      setMatchId(`VAL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
    } catch (e) {
      alert('Error fetching participants');
    }
  };

  const handleScoreChange = (userId: string, field: keyof ParticipantResult, value: number) => {
    setParticipants(prev => prev.map(p => 
      p.userId === userId ? { ...p, [field]: value } : p
    ));
  };

  const submitResults = async () => {
    if (!resultingTourney || submitting) return;
    setSubmitting(true);

    try {
      // Sort participants by score (desc) to find top 3
      const sorted = [...participants].sort((a, b) => b.score - a.score);
      const winners = sorted.slice(0, 3);
      const prizeAmount = 50; // As per requirement: Top 3 get 50 each

      await runTransaction(db, async (transaction) => {
        // 1. Update Tournament Status
        const tRef = doc(db, 'tournaments', resultingTourney.id);
        transaction.update(tRef, { 
          status: 'completed',
          matchId: matchId,
          completedAt: serverTimestamp(),
          winners: winners.map(w => ({
            userId: w.userId,
            displayName: w.displayName,
            score: w.score
          }))
        });

        // 2. Record Match Discovery
        const resultsRef = doc(collection(db, 'match_results'), matchId);
        transaction.set(resultsRef, {
          tournamentId: resultingTourney.id,
          name: resultingTourney.name,
          results: sorted,
          winners: winners.map(w => w.userId),
          timestamp: serverTimestamp()
        });

        // 3. Update Participant Stats and Rank in the subcollection
        for (let i = 0; i < sorted.length; i++) {
          const p = sorted[i];
          const pRef = doc(db, `tournaments/${resultingTourney.id}/participants`, p.userId);
          transaction.update(pRef, {
            kills: p.kills,
            deaths: p.deaths,
            score: p.score,
            rank: i + 1
          });

          // 4. Update Global User Stats
          const userRef = doc(db, 'users', p.userId);
          const isWinner = i < 3;
          
          transaction.update(userRef, {
            'stats.totalPlayed': increment(1),
            'stats.wins': increment(isWinner ? 1 : 0),
            'stats.totalEarnings': increment(isWinner ? prizeAmount : 0),
            'balance': increment(isWinner ? prizeAmount : 0)
          });

          // 5. Create Transaction Record for Winners
          if (isWinner) {
            const transRef = doc(collection(db, 'transactions'));
            transaction.set(transRef, {
              userId: p.userId,
              amount: prizeAmount,
              type: 'prize',
              tournamentId: resultingTourney.id,
              description: `Won ${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'} place in ${resultingTourney.name}`,
              timestamp: serverTimestamp()
            });
          }
        }
      });

      alert('Mission Finalized. Rewards Dispatched.');
      setResultingTourney(null);
    } catch (e) {
      console.error(e);
      alert('Error finalizing mission: ' + e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) return <div className="pt-40 text-center text-white/20 uppercase tracking-[0.5em] font-black italic text-2xl">Unauthorized Access</div>;

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
            <Shield className="w-10 h-10 text-[#FF4655]" />
            Command Center
          </h2>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Platform Administration & Logistics</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="accent-gradient text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 hover:glow-cyan shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Deploy New Arena
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-8 max-w-md w-full val-border shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter underline decoration-[#FF4655] underline-offset-8">Mission Protocol</h3>
                <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Arena Designation</label>
                  <input 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF4655] transition-colors"
                    value={newTourney.name}
                    onChange={(e) => setNewTourney({...newTourney, name: e.target.value})}
                    placeholder="e.g. Protocol: Ascent #1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Entry (₹)</label>
                    <input 
                      type="number"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF4655] transition-colors font-mono"
                      value={newTourney.entryFee}
                      onChange={(e) => setNewTourney({...newTourney, entryFee: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Pot (₹)</label>
                    <input 
                      type="number"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FF4655] transition-colors font-mono"
                      value={newTourney.prizePool}
                      onChange={(e) => setNewTourney({...newTourney, prizePool: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 accent-gradient text-white font-bold uppercase py-4 rounded-xl tracking-widest hover:glow-cyan transition-all">Authorize Mission</button>
                  <button type="button" onClick={() => setShowCreate(false)} className="px-6 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 uppercase font-bold text-xs">Abort</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {resultingTourney && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-8 max-w-4xl w-full val-border shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Finalize Results</h3>
                  <p className="text-[#FF4655] text-[10px] uppercase font-bold tracking-widest">{resultingTourney.name}</p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-white/40 uppercase font-bold">Match ID</span>
                  <span className="font-mono text-white text-sm">{matchId}</span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {participants.map((p) => (
                  <div key={p.userId} className="grid grid-cols-12 gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="col-span-4">
                      <span className="text-white font-bold uppercase tracking-tight truncate block">{p.displayName}</span>
                      <span className="text-white/20 text-[8px] font-mono">{p.userId}</span>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] text-white/40 uppercase mb-1">Kills</label>
                      <input 
                        type="number"
                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white font-mono"
                        value={p.kills}
                        onChange={(e) => handleScoreChange(p.userId, 'kills', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] text-white/40 uppercase mb-1">Deaths</label>
                      <input 
                        type="number"
                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white font-mono"
                        value={p.deaths}
                        onChange={(e) => handleScoreChange(p.userId, 'deaths', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[8px] text-white/40 uppercase mb-1">Total Score</label>
                      <input 
                        type="number"
                        className="w-full bg-white/10 border border-[#FF4655]/30 rounded px-3 py-1 text-[#FF4655] font-black text-lg focus:outline-none focus:border-[#FF4655]"
                        value={p.score}
                        onChange={(e) => handleScoreChange(p.userId, 'score', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={submitResults} 
                  disabled={submitting}
                  className="flex-1 accent-gradient text-white font-bold uppercase py-4 rounded-xl tracking-widest hover:glow-cyan transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {submitting ? 'Transmitting Data...' : 'Confirm Post-Match Data'}
                </button>
                <button 
                  onClick={() => setResultingTourney(null)} 
                  disabled={submitting}
                  className="px-8 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 uppercase font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-y-2 px-4">
            <thead>
              <tr className="text-[10px] uppercase text-white/40 font-bold bg-white/[0.02]">
                <th className="py-4 pl-4 rounded-tl-xl">Operational ID / Name</th>
                <th className="py-4">Capacity</th>
                <th className="py-4 text-cyan-400">Total Pot</th>
                <th className="py-4">Protocol Status</th>
                <th className="py-4 pr-4 text-right rounded-tr-xl">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t.id} className="bg-white/5 rounded-xl overflow-hidden group hover:bg-white/10 transition-colors">
                  <td className="py-4 pl-4 rounded-l-xl">
                    <div className="flex flex-col">
                      <span className="text-white font-black uppercase italic tracking-tighter text-lg leading-none">{t.name}</span>
                      <span className="text-white/20 text-[10px] uppercase font-mono tracking-widest mt-1">{t.id.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                       <Users className="w-4 h-4 text-white/20" />
                       <span className="font-mono font-bold">{t.playersCount} / {t.maxPlayers}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                       <span className="font-mono text-cyan-400 font-bold">{formatCurrency(t.prizePool)}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={cn(
                      "px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                      t.status === 'open' ? 'bg-green-500/10 text-green-400' : 
                      t.status === 'full' ? 'bg-yellow-500/10 text-yellow-500' : 
                      t.status === 'completed' ? 'bg-white/10 text-white/40' : 'bg-red-500/10 text-[#FF4655]'
                    )}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-right rounded-r-xl">
                    <div className="flex justify-end gap-3">
                      {t.status !== 'completed' && (
                         <button 
                          onClick={() => alert('Intel Feed Coming Soon')}
                          className="p-2.5 rounded-lg border border-white/10 hover:border-white/30 text-white/40 hover:text-white transition-all bg-white/5"
                          title="Monitor Intel"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {(t.status === 'full' || t.status === 'open') && (
                        <button 
                          onClick={() => startResultEntry(t)}
                          className="p-2.5 rounded-lg bg-[#FF4655]/10 border border-[#FF4655]/30 text-[#FF4655] hover:bg-[#FF4655]/20 transition-all font-bold group-hover:scale-110"
                          title="Enter Results"
                        >
                          <Trophy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

