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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('cachedUserProfile');
    return cached ? JSON.parse(cached) : null;
  });
  const [currentMess, setCurrentMess] = useState<Mess | null>(() => {
    const cached = localStorage.getItem('cachedCurrentMess');
    return cached ? JSON.parse(cached) : null;
  });
  const [managedMesses, setManagedMesses] = useState<Mess[]>(() => {
    const cached = localStorage.getItem('cachedManagedMesses');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(() => {
    return localStorage.getItem('cachedUserProfile') ? false : true;
  });
  const [hasEntered, setHasEnteredState] = useState(() => {
    return localStorage.getItem('hasEntered') === 'true';
  });
  const setHasEntered = (val: boolean) => {
    localStorage.setItem('hasEntered', val ? 'true' : 'false');
    setHasEnteredState(val);
  };
  const isSupreme = user?.email === 'nabidahamed2003@gmail.com' || userProfile?.email === 'nabidahamed2003@gmail.com';

  const fetchProfileAndMess = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const messesRef = collection(db, 'messes');
      const qManagers = query(messesRef, where('managerIds', 'array-contains', uid));

      // Fetch user profile and managed messes in parallel!
      const [userSnap, managedSnap] = await Promise.all([
        getDoc(userRef),
        getDocs(qManagers)
      ]);
      
      let profile: UserProfile | null = null;
      if (userSnap.exists()) {
        profile = userSnap.data() as UserProfile;
        profile.id = userSnap.id;
      }

      let managed = managedSnap.docs.map(d => ({ id: d.id, ...d.data() } as Mess));

      // Build parallel list for remaining secondary checks
      const secondaryRequests = [];
      let legacyIdx = -1;
      if (profile?.role === 'Manager') {
        const qLegacy = query(messesRef, where('managerId', '==', uid));
        legacyIdx = secondaryRequests.push(getDocs(qLegacy)) - 1;
      }

      let missingChunks: string[][] = [];
      let missingChunkIndices: number[] = [];
      if (profile?.messIds && profile.messIds.length > 0) {
        const missingIds = profile.messIds.filter(id => !managed.find(m => m.id === id));
        for (let i = 0; i < missingIds.length; i += 10) {
          const chunk = missingIds.slice(i, i + 10);
          missingChunks.push(chunk);
          const qMore = query(messesRef, where(documentId(), 'in', chunk));
          missingChunkIndices.push(secondaryRequests.push(getDocs(qMore)) - 1);
        }
      }

      let activeMessFetchIdx = -1;
      if (profile && profile.messId) {
        const activeManaged = managed.find(m => m.id === profile.messId);
        if (!activeManaged) {
          const messRef = doc(db, 'messes', profile.messId);
          activeMessFetchIdx = secondaryRequests.push(getDoc(messRef)) - 1;
        }
      }

      // Resolve secondary queries concurrently
      const secondaryResults = await Promise.all(secondaryRequests);

      if (legacyIdx !== -1) {
        const legacySnap = secondaryResults[legacyIdx] as any;
        legacySnap.docs.forEach((doc: any) => {
          if (!managed.find(m => m.id === doc.id)) {
            managed.push({ id: doc.id, ...doc.data() } as Mess);
          }
        });
      }

      missingChunkIndices.forEach((queryIdx) => {
        const moreSnap = secondaryResults[queryIdx] as any;
        moreSnap.docs.forEach((doc: any) => {
          if (!managed.find(m => m.id === doc.id)) {
            managed.push({ id: doc.id, ...doc.data() } as Mess);
          }
        });
      });

      let activeMess: Mess | null = null;
      if (profile) {
        if (profile.messId) {
          const activeManaged = managed.find(m => m.id === profile.messId);
          if (activeManaged) {
            activeMess = activeManaged;
          } else if (activeMessFetchIdx !== -1) {
            const messSnap = secondaryResults[activeMessFetchIdx] as any;
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

      // Save to localStorage cache
      if (profile) {
        localStorage.setItem('cachedUserProfile', JSON.stringify(profile));
      }
      if (activeMess) {
        localStorage.setItem('cachedCurrentMess', JSON.stringify(activeMess));
      } else {
        localStorage.removeItem('cachedCurrentMess');
      }
      localStorage.setItem('cachedManagedMesses', JSON.stringify(managed));
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
      localStorage.removeItem('cachedUserProfile');
      localStorage.removeItem('cachedCurrentMess');
      localStorage.removeItem('cachedManagedMesses');
      localStorage.removeItem('hasEntered');
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
