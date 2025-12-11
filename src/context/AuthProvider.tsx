"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, type DocumentData } from "firebase/firestore";
import { AuthContext } from "./AuthContext";
import Loading from "../components/Loading";

const SESSION_INACTIVITY_LIMIT = 10 * 24 * 60 * 60 * 1000;

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [isUserOnboarded, setIsUserOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);

  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    try {
      localStorage.setItem("lastActivity", String(now));
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastActivity");
      if (saved) setLastActivity(Number(saved));
    } catch { /* empty */ }

    const handler = () => updateLastActivity();

    window.addEventListener("mousemove", handler);
    window.addEventListener("keydown", handler);
    window.addEventListener("scroll", handler);
    window.addEventListener("click", handler);

    return () => {
      window.removeEventListener("mousemove", handler);
      window.removeEventListener("keydown", handler);
      window.removeEventListener("scroll", handler);
      window.removeEventListener("click", handler);
    };
  }, [updateLastActivity]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setFirebaseUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          setIsUserOnboarded(null);
          setLoading(false);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
            setIsUserOnboarded(true);
          } else {
            setProfile(null);
            setIsUserOnboarded(false);
          }
        } catch {
          setError("Failed to load user profile.");
        }

        setLoading(false);
      },
      () => {
        setError("Authentication unavailable.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const check = async () => {
      const expired = Date.now() - lastActivity > SESSION_INACTIVITY_LIMIT;
      if (!expired) return;

      try {
        await signOut(auth);
      } catch { /* empty */ }

      setFirebaseUser(null);
      setProfile(null);
      setIsUserOnboarded(null);

      try {
        localStorage.removeItem("lastActivity");
      } catch { /* empty */ }
    };

    check();
  }, [lastActivity, firebaseUser]);

  const logout = async () => {
    try {
      await signOut(auth);
      try {
        localStorage.removeItem("lastActivity");
      } catch { /* empty */ }
      setFirebaseUser(null);
      setProfile(null);
      setIsUserOnboarded(null);
      window.location.href = "/";
    } catch {
      setError("Unable to log out. Please try again.");
    }
  };

  const authContextValue = {
    user: firebaseUser,
    profile,
    isUserOnboarded,
    loading,
    logout,
    updateOnboardingStatus: (status: boolean) => setIsUserOnboarded(status),
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="text-center text-red-500 p-4">{error}</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
