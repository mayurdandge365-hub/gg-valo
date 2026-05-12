import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TournamentGrid } from './components/TournamentGrid';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function HomePage() {
  return (
    <>
      <Hero />
      <TournamentGrid />
    </>
  );
}

export default function App() {
  // Bootstrap admin for the user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'hemlata11052008@gmail.com') {
        setDoc(doc(db, 'admins', user.uid), { email: user.email }, { merge: true });
      }
    });
    return () => unsub();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
          
          <footer className="py-12 border-t border-white/5 bg-zinc-950">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black italic tracking-tighter">VALO<span className="text-red-600">ARENA</span></span>
                <span className="text-white/20 text-[10px] uppercase font-mono tracking-widest ml-4">© 2024 Protocol V</span>
              </div>
              <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Engagement</a>
                <a href="#" className="hover:text-white transition-colors">Contact Intel</a>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
