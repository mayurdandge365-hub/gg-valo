import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'player' | 'admin';
  balance: number;
  stats: {
    wins: number;
    totalPlayed: number;
    totalEarnings: number;
  };
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminState, setIsAdminState] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check if profile exists
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const adminDocRef = doc(db, 'admins', firebaseUser.uid);
        
        // Listen to profile changes
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Initialize profile
            const initialProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              role: 'player',
              balance: 1000, // Give some initial virtual cash for demo
              stats: { wins: 0, totalPlayed: 0, totalEarnings: 0 }
            };
            setDoc(userDocRef, initialProfile);
          }
        });

        // Check if admin
        const adminSnap = await getDoc(adminDocRef);
        setIsAdminState(adminSnap.exists());
        
        setLoading(false);
        return () => unsubProfile();
      } else {
        setProfile(null);
        setIsAdminState(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin: isAdminState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
