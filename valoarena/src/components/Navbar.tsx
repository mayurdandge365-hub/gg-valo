import { motion } from 'motion/react';
import { Swords, Trophy, LayoutDashboard, Settings, LogIn, LogOut, Wallet } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/utils';

export function Navbar() {
  const { user, profile, isAdmin } = useAuth();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0B0E14] border-b border-white/5 px-8 h-16 flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center space-x-10">
          <div className="flex items-center space-x-2 group cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-8 h-8 bg-[#FF4655] flex items-center justify-center font-bold text-lg rounded-sm text-white">V</div>
            <span className="text-xl font-black tracking-tighter uppercase text-white">VAL-ARENA</span>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-white/60">
            <a href="/" className="hover:text-white transition-colors">Tournaments</a>
            <a href="#" className="hover:text-white transition-colors">Leaderboards</a>
            {user && (
              <a href="/dashboard" className="hover:text-white transition-colors">Earnings</a>
            )}
            {isAdmin && (
              <a href="/admin" className="hover:text-white transition-colors">Admin Panel</a>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {user ? (
            <div className="flex items-center space-x-6">
              <div className="bg-white/5 px-4 py-1.5 rounded-full flex items-center space-x-2">
                <span className="text-cyan-400 font-bold">
                  {formatCurrency(profile?.balance || 0)}
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Wallet</span>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src={user.photoURL || ''} 
                  className="w-10 h-10 rounded-full border-2 border-white/10 bg-gradient-to-tr from-[#FF4655] to-purple-600"
                  alt="avatar"
                />
                <button 
                  onClick={() => signOut(auth)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="accent-gradient px-6 py-2 rounded-lg font-bold uppercase tracking-tighter text-sm glow-cyan"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
