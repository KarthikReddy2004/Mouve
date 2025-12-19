import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { PointsContext, type UserPoints } from "./PointsContext";

export const PointsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [points, setPoints] = useState<UserPoints | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setPoints(null);
        return;
      }

      return onSnapshot(doc(db, "points", user.uid), (snap) => {
        setPoints(
          snap.exists()
            ? (snap.data() as UserPoints)
            : { reformerPoints: 0, matPoints: 0, hotPoints: 0, nutritionPoints : 0 }
        );
      });
    });

    return () => unsubAuth();
  }, [auth]);

  return (
    <PointsContext.Provider value={points}>
      {children}
    </PointsContext.Provider>
  );
};
