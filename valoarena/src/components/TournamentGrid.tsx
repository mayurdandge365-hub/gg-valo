import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TournamentCard } from './TournamentCard';
import { motion } from 'motion/react';
import { Swords } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function TournamentGrid() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'tournaments'),
      orderBy('startTime', 'asc'),
      limit(12)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTournaments(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      checkAndSeed();
    }
  }, [isAdmin]);

  const checkAndSeed = async () => {
    const snap = await getDocs(collection(db, 'tournaments'));
    if (snap.empty) {
      const samples = [
        {
          name: "Radiant Rampage #42",
          entryFee: 20,
          prizePool: 150,
          maxPlayers: 10,
          playersCount: 4,
          status: 'open',
          startTime: new Date(Date.now() + 3600000),
          game: 'VALORANT',
          type: 'DEATHMATCH',
          createdAt: serverTimestamp()
        },
        {
          name: "Icebox Headshot Jam",
          entryFee: 50,
          prizePool: 400,
          maxPlayers: 10,
          playersCount: 8,
          status: 'open',
          startTime: new Date(Date.now() + 7200000),
          game: 'VALORANT',
          type: 'DEATHMATCH',
          createdAt: serverTimestamp()
        },
        {
          name: "Bind Blaster Pro",
          entryFee: 100,
          prizePool: 800,
          maxPlayers: 10,
          playersCount: 10,
          status: 'full',
          startTime: new Date(Date.now() + 10800000),
          game: 'VALORANT',
          type: 'DEATHMATCH',
          createdAt: serverTimestamp()
        }
      ];
      for (const t of samples) {
        await addDoc(collection(db, 'tournaments'), t);
      }
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white/5 h-64 rounded-sm border border-white/5" />
      ))}
    </div>
  );

  return (
    <section className="py-20 max-w-7xl mx-auto px-6" id="tournaments">
      <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-[#FF4655]" />
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Operational Arenas</h2>
            <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-1 font-bold">Active Combat Zones Identified</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Syncing</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <span>Real-time Intel</span>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="bg-zinc-900 border border-dashed border-white/10 p-20 text-center rounded-sm">
          <Swords className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-white/40 uppercase tracking-widest font-bold">No active tournaments found</h3>
          <p className="text-white/20 text-sm mt-2">Checking for new events...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <TournamentCard tournament={t} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
