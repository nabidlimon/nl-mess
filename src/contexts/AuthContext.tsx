import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, Mess } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-error';
import { AppLoadingScreen } from '../components/AppLoadingScreen';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  currentMess: Mess | null;
  managedMesses: Mess[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isSupreme: boolean;
  hasEntered: boolean;
  setHasEntered: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentMess, setCurrentMess] = useState<Mess | null>(null);
  const [managedMesses, setManagedMesses] = useState<Mess[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const isSupreme = user?.email === 'nabidahamed2003@gmail.com' || userProfile?.email === 'nabidahamed2003@gmail.com';

  const fetchProfileAndMess = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      let profile: UserProfile | null = null;
      if (userSnap.exists()) {
        profile = userSnap.data() as UserProfile;
        profile.id = userSnap.id;
      }

      // Always fetch all messes user manages, regardless of current active site
      const messesRef = collection(db, 'messes');
      const qManagers = query(messesRef, where('managerIds', 'array-contains', uid));
      const managedSnap = await getDocs(qManagers);
      let managed = managedSnap.docs.map(d => ({ id: d.id, ...d.data() } as Mess));

      // Also fetch by legacy managerId if role is Manager
      if (profile?.role === 'Manager') {
        const qLegacy = query(messesRef, where('managerId', '==', uid));
        const legacySnap = await getDocs(qLegacy);
        legacySnap.docs.forEach(doc => {
           if (!managed.find(m => m.id === doc.id)) {
              managed.push({ id: doc.id, ...doc.data() } as Mess);
           }
        });
      }

      // Also check messIds array in profile to ensure all belonging messes are loaded
      if (profile?.messIds && profile.messIds.length > 0) {
        const missingIds = profile.messIds.filter(id => !managed.find(m => m.id === id));
        if (missingIds.length > 0) {
           // Fetch the specific missing messes (limit to 10 at a time for 'in' query)
           for (let i = 0; i < missingIds.length; i += 10) {
              const chunk = missingIds.slice(i, i + 10);
              const qMore = query(messesRef, where(documentId(), 'in', chunk));
              const moreSnap = await getDocs(qMore);
              moreSnap.docs.forEach(doc => {
                 if (!managed.find(m => m.id === doc.id)) {
                    managed.push({ id: doc.id, ...doc.data() } as Mess);
                 }
              });
           }
        }
      }

      // Fetch current active mess
      let activeMess: Mess | null = null;
      if (profile) {
        if (profile.messId) {
           const activeManaged = managed.find(m => m.id === profile.messId);
           if (activeManaged) {
             activeMess = activeManaged;
           } else {
             const messRef = doc(db, 'messes', profile.messId);
             const messSnap = await getDoc(messRef);
             if (messSnap.exists()) {
                activeMess = { id: messSnap.id, ...messSnap.data() } as Mess;
             }
           }
        } else if (managed.length > 0) {
           activeMess = managed[0];
        }
      }

      // Batch state updates together at the end of the async flow to prevent flashing renders
      setUserProfile(profile);
      setManagedMesses(managed);
      setCurrentMess(activeMess);
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfileAndMess(user.uid);
      } else {
        setUserProfile(null);
        setCurrentMess(null);
        setManagedMesses([]);
        setHasEntered(false); // Reset on logout
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndMess(user.uid);
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setHasEntered(false);
      setUserProfile(null);
      setCurrentMess(null);
      setManagedMesses([]);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, currentMess, managedMesses, loading, signInWithGoogle, logout, refreshProfile, isSupreme, hasEntered, setHasEntered }}>
      {loading ? <AppLoadingScreen /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
