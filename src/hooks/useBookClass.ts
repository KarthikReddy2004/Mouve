import { useState } from "react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";

export const useBookClass = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookClass = async (slotId: string) => {
    setLoading(true);
    setError(null);

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("You must be logged in to book a class.");
      setLoading(false);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const slotRef = doc(db, "classSlots", slotId);
        const slotDoc = await transaction.get(slotRef);

        if (!slotDoc.exists()) {
          throw new Error("Class slot not found.");
        }

        const slotData = slotDoc.data();
        if (slotData.remainingSlots <= 0) {
          throw new Error("No spots left in this class.");
        }

        // Additional logic for user points will be added here in the next task.
        
        transaction.update(slotRef, {
          remainingSlots: slotData.remainingSlots - 1,
        });

        // Add booking to user's bookings subcollection
        // This will also be implemented in a future task.
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { bookClass, loading, error };
};
