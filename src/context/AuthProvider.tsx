"use client";

import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, type DocumentData } from "firebase/firestore";
import { AuthContext } from "./AuthContext";
import Loading from "../components/Loading";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [isUserOnboarded, setIsUserOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const logout = async () => {
    try {
      await signOut(auth);
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
