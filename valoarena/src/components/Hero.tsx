import { motion } from 'motion/react';
import { Trophy, Target, Users, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function Hero() {
  const { user } = useAuth();

  const handleJoin = async () => {
    if (user) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden accent-gradient p-12 md:p-20 shadow-2xl glow-cyan">
          <div className="absolute right-[-40px] top-[-40px] opacity-10 font-black text-9xl italic pointer-events-none select-none">ARENA</div>
          
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 bg-black/20 text-white/90 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8 border border-white/10">
              <Zap className="w-3 h-3 text-cyan-400" />
              Protocol v2.4 Live Alpha
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none mb-6">
              DOMINATE THE <br />
              <span className="text-black/40">DEATHMATCH</span>
            </h1>
            
            <p className="text-lg text-white/80 max-w-lg mb-10 leading-relaxed font-medium">
              Elite 10-player rooms. Instant automated prize distribution for the top 3 survivors. 
              Secure your entry, clear the zone, claim the bounty.
            </p>

            <div className="flex flex-wrap gap-6 items-center">
              <button 
                onClick={handleJoin}
                className="bg-black text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-valorant-bg transition-all transform hover:scale-105 active:scale-95 shadow-xl"
              >
                Join Next Mission
              </button>
              
              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-white/50 tracking-widest font-bold">Entry</span>
                  <span className="text-xl font-bold font-mono">₹20.00</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-white/50 tracking-widest font-bold">Prize Pool</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">₹150.00</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Subtle decorative elements */}
          <div className="absolute bottom-0 right-0 p-8 hidden lg:block opacity-20 hover:opacity-100 transition-opacity">
            <Trophy className="w-32 h-32 text-white" />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card rounded-2xl p-6 border-l-4 border-[#FF4655]">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Payouts</div>
            <div className="text-2xl font-black text-white">₹5.2M+</div>
          </div>
          <div className="glass-card rounded-2xl p-6 border-l-4 border-cyan-400">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Active Arenas</div>
            <div className="text-2xl font-black text-white">124</div>
          </div>
          <div className="glass-card rounded-2xl p-6 border-l-4 border-white/20">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Players Online</div>
            <div className="text-2xl font-black text-white">12,402</div>
          </div>
          <div className="glass-card rounded-2xl p-6 border-l-4 border-purple-500">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Elite Rank</div>
            <div className="text-2xl font-black text-white">Top 1%</div>
          </div>
        </div>
      </div>
    </section>
  );
}
