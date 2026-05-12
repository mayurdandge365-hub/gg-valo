import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { Trophy, Target, TrendingUp, Clock, CreditCard, X, Plus } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';

export function Dashboard() {
  const { profile, user } = useAuth();
  const [userTournaments, setUserTournaments] = useState<any[]>([]);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUserHistory = async () => {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      setUserTournaments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUserHistory();
  }, [user]);

  const handleTopUp = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: increment(topUpAmount)
      });
      
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: topUpAmount,
        type: 'top_up',
        description: 'Wallet Top Up',
        timestamp: serverTimestamp()
      });

      alert(`₹${topUpAmount} added to your account!`);
      setShowTopUp(false);
      window.location.reload(); // Refresh to show new balance (or use real-time listener)
    } catch (e) {
      alert('Top up failed: ' + e);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="pt-40 text-center text-white/20 uppercase tracking-[0.5em] font-black italic">Loading Profile...</div>;

  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Profile Info */}
        <aside className="col-span-12 md:col-span-3 space-y-6">
          <div className="glass-card rounded-xl p-8 text-center val-border">
            <div className="relative inline-block mb-4">
              <img 
                src={profile.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.uid}`} 
                alt={profile.displayName || ''} 
                className="w-24 h-24 rounded-full border-4 border-[#FF4655] mx-auto shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-black rounded-full" />
            </div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{profile.displayName}</h2>
            <p className="text-[#FF4655] text-[10px] uppercase tracking-widest mt-1 font-bold">Protocol Agent</p>
            
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="bg-white/5 p-4 rounded-xl text-left flex justify-between items-center group cursor-pointer" onClick={() => setShowTopUp(true)}>
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest block">Credits</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono leading-none">{formatCurrency(profile.balance)}</span>
                </div>
                <div className="p-2 bg-cyan-400/10 rounded-lg group-hover:bg-cyan-400 group-hover:text-black transition-all">
                  <Plus className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-[8px] text-white/40 uppercase tracking-widest block">XP Level</span>
                  <span className="text-white font-mono text-sm leading-none">24</span>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="text-[8px] text-white/40 uppercase tracking-widest block">Division</span>
                  <span className="text-[#FF4655] font-black uppercase text-sm leading-none">G3</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 border border-white/5">
            <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-4 font-bold flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-[#FF4655]" />
              Career Data
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                <span className="text-white/60 text-xs font-bold uppercase tracking-tight">K/D Ratio</span>
                <span className="text-white font-bold font-mono text-xs">1.24</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                <span className="text-white/60 text-xs font-bold uppercase tracking-tight">Win Ratio</span>
                <span className="text-white font-bold font-mono text-xs">
                  {profile.stats.totalPlayed > 0 
                    ? Math.round((profile.stats.wins / profile.stats.totalPlayed) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                <span className="text-white/60 text-xs font-bold uppercase tracking-tight">Career Bounty</span>
                <span className="text-cyan-400 font-bold font-mono text-xs">{formatCurrency(profile.stats.totalEarnings)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-span-12 md:col-span-9 space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="glass-card rounded-xl p-6 flex items-center justify-between hover:bg-white/10 transition-colors cursor-default val-border">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1 font-bold">Missions Won</span>
                  <span className="text-3xl font-black text-white italic leading-none">{profile.stats.wins}</span>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              <div className="glass-card rounded-xl p-6 flex items-center justify-between hover:bg-white/10 transition-colors cursor-default">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1 font-bold">Total Combat</span>
                  <span className="text-3xl font-black text-white italic leading-none">{profile.stats.totalPlayed}</span>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <Target className="w-6 h-6 text-[#FF4655]" />
                </div>
              </div>
              <div className="glass-card rounded-xl p-6 flex items-center justify-between hover:bg-white/10 transition-colors cursor-default">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1 font-bold">Active Time</span>
                  <span className="text-3xl font-black text-blue-400 italic leading-none">12h</span>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
              </div>
           </div>

           <div className="glass-card rounded-2xl overflow-hidden border border-white/5 flex flex-col">
             <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
               <h3 className="font-bold text-white uppercase italic tracking-tighter flex items-center gap-3">
                 <div className="w-1 h-6 bg-[#FF4655]" />
                 Mission History
               </h3>
               <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                 <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                 <span>Decentralized Log Sync Active</span>
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm border-separate border-spacing-y-2 px-4">
                 <thead className="text-[10px] uppercase text-white/40 font-bold">
                   <tr>
                     <th className="pb-2 pt-4 pl-4">Mission Reference</th>
                     <th className="pb-2 pt-4">Status</th>
                     <th className="pb-2 pt-4">Bounty Type</th>
                     <th className="pb-2 pt-4 text-cyan-400">Amount</th>
                     <th className="pb-2 pt-4 pr-4 text-right">Timestamp</th>
                   </tr>
                 </thead>
                 <tbody>
                    {userTournaments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-24 text-center text-white/20 uppercase tracking-[0.3em] font-black italic text-sm">
                          No missions records identified
                        </td>
                      </tr>
                    ) : (
                      userTournaments.map((tx) => (
                        <tr key={tx.id} className="bg-white/5 rounded-xl overflow-hidden group hover:bg-white/10 transition-colors">
                          <td className="py-4 pl-4 rounded-l-xl">
                            <span className="text-white font-black uppercase italic tracking-tight text-xs block">
                              {tx.description || (tx.type === 'entry_fee' ? 'DEPLOYMENT: ALPHA' : 'BOUNTY SETTLEMENT')}
                            </span>
                            <span className="text-white/20 text-[8px] font-mono tracking-widest uppercase mt-1">REF: {tx.id.slice(0, 10).toUpperCase()}</span>
                          </td>
                          <td className="py-4">
                             <span className={cn(
                               "px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest",
                               tx.type === 'prize' || tx.type === 'top_up' ? "bg-green-500/10 text-green-400" : "bg-[#FF4655]/10 text-[#FF4655]"
                             )}>
                               {tx.type === 'prize' || tx.type === 'top_up' ? 'CREDIT' : 'DEBIT'}
                             </span>
                          </td>
                          <td className="py-4">
                             <span className="text-white/40 text-[10px] uppercase font-bold tracking-tighter">
                               {tx.type === 'prize' ? 'Mission Reward' : tx.type === 'top_up' ? 'Wallet Funding' : 'Registration Fee'}
                             </span>
                          </td>
                          <td className={cn(
                            "py-4 font-mono font-black text-sm",
                            tx.type === 'prize' || tx.type === 'top_up' ? "text-cyan-400" : "text-white/60"
                          )}>
                            {tx.type === 'prize' || tx.type === 'top_up' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td className="py-4 pr-4 text-right rounded-r-xl text-[10px] text-white/40 font-mono font-bold tracking-tighter">
                            {tx.timestamp?.toDate ? format(tx.timestamp.toDate(), 'HH:mm | MMM dd, yyyy') : 'SECURE'}
                          </td>
                        </tr>
                      ))
                    )}
                 </tbody>
               </table>
             </div>
           </div>
        </main>
      </div>

      <AnimatePresence>
        {showTopUp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-8 max-w-sm w-full val-border shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter underline decoration-[#FF4655] underline-offset-8">Credit Injection</h3>
                <button onClick={() => setShowTopUp(false)} className="text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Currency Unit (₹)</label>
                  <input 
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white font-mono text-2xl focus:outline-none focus:border-cyan-400 transition-colors"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[100, 500, 1000, 2000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setTopUpAmount(amt)}
                      className={cn(
                        "py-2 rounded-lg border font-mono text-xs font-bold transition-all",
                        topUpAmount === amt ? "border-cyan-400 bg-cyan-400/10 text-cyan-400" : "border-white/5 text-white/40 hover:border-white/20"
                      )}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleTopUp}
                  disabled={loading}
                  className="w-full accent-gradient text-white font-bold uppercase py-4 rounded-xl tracking-widest hover:glow-cyan transition-all flex items-center justify-center gap-3"
                >
                  <CreditCard className="w-5 h-5" />
                  {loading ? 'Processing...' : 'Authorize Transaction'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

