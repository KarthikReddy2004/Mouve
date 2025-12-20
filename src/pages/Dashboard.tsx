"use client";

import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  limit,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3 } from "lucide-react";

interface Booking {
  id: string;
  category: "MAT" | "HOT" | "REFORMER";
  date: string;
  weekday: string;
  startTime: string;
  slotType: string;
  createdAt: Timestamp;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Booking, "id">),
      }));

      setBookings(data);
      setLoading(false);
    };

    fetchBookings();
  }, [user]);

  const stats = {
    total: bookings.length,
    mat: bookings.filter((b) => b.category === "MAT").length,
    hot: bookings.filter((b) => b.category === "HOT").length,
    reformer: bookings.filter((b) => b.category === "REFORMER").length,
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="
              mb-6 mx-auto
              w-fit
              rounded-xl p-[1px]
              bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
            "
          >
            <div
              className="
                rounded-xl p-5
                bg-background/80 backdrop-blur
                shadow-lg
              "
            >
              <motion.div
                whileHover={{ rotate: 2 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="bg-white rounded-lg p-3"
              >
                <QRCode value={user.uid} size={150} />
              </motion.div>
            </div>
          </motion.div>
        )}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground">
            Welcome back, {user?.displayName || "User"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here’s an overview of your activity
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-24">
            <div className="inline-block animate-spin h-10 w-10 rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && bookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 border rounded-2xl"
          >
            <Calendar className="w-14 h-14 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-foreground text-2xl font-semibold mb-2">
              No bookings yet
            </h2>
            <p className="text-muted-foreground mb-8">
              Start your wellness journey by booking your first class
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/classes")}
              >
                Book a Class
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/plans")}
              >
                Buy Plan
              </Button>
            </div>
          </motion.div>
        )}

        {/* ANALYTICS */}
        {!loading && bookings.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard label="Total Bookings" value={stats.total} />
              <StatCard label="Mat / Hatha" value={stats.mat} />
              <StatCard label="Hot Classes" value={stats.hot} />
              <StatCard label="Reformer" value={stats.reformer} />
            </div>

            {/* Recent bookings */}
            <div className="border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-6 h-6" />
                <h2 className="text-2xl font-semibold">
                  Recent Bookings
                </h2>
              </div>

              <div className="space-y-4">
                {bookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between border rounded-lg p-4"
                  >
                    <div>
                      <p className="font-semibold">
                        {b.slotType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {b.weekday}, {b.date} • {b.startTime}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {b.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="border rounded-2xl p-6">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-4xl font-bold mt-2">{value}</p>
  </div>
);
