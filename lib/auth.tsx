"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";
import { createUserProfile, getMe, type UserProfile } from "./users";

type SignupData = {
  name: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  /* Admin status is resolved server-side and arrives with the profile, so the
     console gate doesn't need a second round trip to find out. */
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      setIsAdmin(false);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    try {
      const me = await getMe();
      setProfile(me.profile);
      setIsAdmin(me.isAdmin);
    } catch {
      // Never leave a stale isAdmin=true behind on a failed refresh.
      setProfile(null);
      setIsAdmin(false);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Load the profile from /api/me whenever the signed-in user changes.
  useEffect(() => {
    if (loading) return;
    loadProfile(user);
  }, [user, loading, loadProfile]);

  const value: AuthContextValue = {
    user,
    loading,
    profile,
    profileLoading,
    isAdmin,
    refreshProfile: () => loadProfile(user),
    login: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    signup: async (email, password, data) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: data.name });
      await createUserProfile(cred.user.uid, { name: data.name, email });
      await loadProfile(cred.user);
    },
    logout: async () => {
      await signOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
