import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  doc,
  onSnapshot,
  type Unsubscribe,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import DateStrip from "@/components/DateStrip";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Calendar, Clock, Users, Zap } from "lucide-react";

interface Slot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: string;
  capacity: number;
  active: boolean;
  timeLabel?: string;
}

interface UserPoints {
  reformerPoints: number;
  matPoints: number;
  hotPoints: number;
  [key: string]: number;
}

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const Classes: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [remainingSlots, setRemainingSlots] = useState<Record<string, number>>(
    {}
  );
  const [studioClosed, setStudioClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [confirmSlot, setConfirmSlot] = useState<Slot | null>(null);

  // Accurate IST time + unmount safety
  const [serverNow, setServerNow] = useState<Date>(new Date());
  const isMounted = useRef(true);
  const auth = getAuth();

  type CategoryKey = "HOT" | "MAT" | "REFORMER";

  const CATEGORY_ORDER: CategoryKey[] = ["HOT", "MAT", "REFORMER"];
  const TYPE_LABELS: Record<string, string> = {
    HOT_YOGA: "Hot Yoga",
    HOT_PILATES: "Hot Pilates",
    HATHA: "Hatha Yoga",
    MAT: "Mat Pilates",
    REFORMER: "Reformer",
  };

  const CATEGORY_CONFIG: Record<
    CategoryKey,
    { title: string; types: string[] }
  > = {
    HOT: {
      title: "Hot Yoga / Hot Pilates",
      types: ["HOT_YOGA", "HOT_PILATES"],
    },
    MAT: {
      title: "Hatha Yoga / Mat Pilates",
      types: ["HATHA", "MAT"],
    },
    REFORMER: {
      title: "Reformer Pilates",
      types: ["REFORMER"],
    },
  };

  const categorizedSlots = CATEGORY_ORDER.map((key) => {
  const { title, types } = CATEGORY_CONFIG[key];
    return {
      key,
      title,
      slots: slots.filter((slot) => types.includes(slot.type)),
    };
  }).filter((category) => category.slots.length > 0);

  // === Accurate India Time (IST) - 100% Safe ===
  useEffect(() => {
    isMounted.current = true;

    const fetchISTTime = async () => {
      try {
        const res = await fetch(
          "https://worldtimeapi.org/api/timezone/Asia/Kolkata"
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const time = new Date(data.datetime);
        if (isMounted.current) setServerNow(time);
      } catch {
        if (isMounted.current) setServerNow(new Date());
      }
    };

    fetchISTTime();
    const interval = setInterval(fetchISTTime, 5 * 60 * 1000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  // === Load User Points ===
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUserPoints(null);
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "points", user.uid));
        setUserPoints(
          docSnap.exists()
            ? (docSnap.data() as UserPoints)
            : { reformerPoints: 0, matPoints: 0, hotPoints: 0 }
        );
      } catch (err) {
        console.error(err);
      }
    });
    return unsub;
  }, [auth]);

  // === Realtime Schedule Listener ===
  useEffect(() => {
    setLoading(true);
    setSlots([]);
    setRemainingSlots({});
    setStudioClosed(false);

    const weekday = weekdayNames[selectedDate.getDay()];
    const ref = doc(db, "Classes", weekday);

    let unsub: Unsubscribe = () => {};

    const setup = async () => {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setLoading(false);
        return;
      }

      unsub = onSnapshot(ref, (docSnap) => {
        if (!docSnap.exists()) {
          setSlots([]);
          setLoading(false);
          return;
        }

        const data = docSnap.data()!;

        setStudioClosed(!!data.studioClosed);

        const raw = data.slots || {};
        const remaining = data.remainingSlots || {};

        const list: Slot[] = Object.entries(raw).map(([id, s]) => ({
          id,
          ...(s as Omit<Slot, "id">),
        }));
        list.sort((a, b) => a.startTime.localeCompare(b.startTime));

        setSlots(list);
        setRemainingSlots(remaining);
        setLoading(false);
      });
    };

    setup();

    return () => unsub();
  }, [selectedDate]);

  // === Bookable Logic ===
  const getBookableStatus = useCallback(
    (slot: Slot): { canBook: boolean; reason?: string } => {
      if (!slot.active)
        return { canBook: false, reason: "This class is not active" };
      if (!remainingSlots[slot.id] || remainingSlots[slot.id] <= 0)
        return { canBook: false, reason: "No spots remaining" };

      const [h, m] = slot.startTime.split(":").map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(h, m, 0, 0);

      if (slotTime <= serverNow)
        return { canBook: false, reason: "Class has already started" };

      const pointKey = slot.type.toLowerCase() + "Points";
      if (!userPoints || userPoints[pointKey] <= 0)
        return { canBook: false, reason: "Not enough points" };

      return { canBook: true };
    },
    [remainingSlots, selectedDate, serverNow, userPoints]
  );

  // === Booking ===
  const bookSlot = httpsCallable(functions, "bookSlot");

  const handleBook = (slot: Slot) => {
    const { canBook, reason } = getBookableStatus(slot);
    if (!canBook) {
      toast.error(reason || "Cannot book");
      return;
    }
    setConfirmSlot(slot);
  };

  const confirmBooking = async () => {
    if (!confirmSlot) return;

    try {
      await bookSlot({
        slotId: confirmSlot.id,
        date: selectedDate.toISOString().split("T")[0],
      });

      toast.success(
        `Booked! 🎉 ${confirmSlot.name} at ${confirmSlot.startTime}`
      );
    } catch (err: unknown) {
      const msg =
        (err instanceof Error ? err.message : String(err))?.toLowerCase() ||
        "";
      if (msg.includes("full"))
        toast.error("Just got full! Someone took the last spot.");
      else if (msg.includes("points"))
        toast.error("No points. Buy more to book.");
      else toast.error("Booking failed. Try again.");
    } finally {
      setConfirmSlot(null);
    }
  };

  const totalPoints = userPoints
    ? Object.values(userPoints).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Book Your Class
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Real-time availability • Instant booking • No waiting
          </p>
        </div>

        {/* If DateStrip expects a Date, keep it like this */}
        <DateStrip
          selectedDate={selectedDate.toISOString().split("T")[0]}
          onDateSelect={(dateString) => setSelectedDate(new Date(dateString))}
        />

        {/* Zero Points Banner */}
        {userPoints !== null && totalPoints === 0 && (
          <div className="my-10 p-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-center">
            <Zap className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <p className="text-xl font-semibold mb-4">
              You're out of points!
            </p>
            <Link to="/plans">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"
              >
                Buy Points Now
              </Button>
            </Link>
          </div>
        )}

        {/* States */}
        {loading && (
          <div className="text-center py-24">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-6 text-muted-foreground text-lg">
              Loading today's classes...
            </p>
          </div>
        )}

        {studioClosed && !loading && (
          <div className="text-center py-24">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-2xl font-medium text-muted-foreground">
              Studio is closed today
            </p>
            <p className="text-muted-foreground mt-2">See you tomorrow!</p>
          </div>
        )}

        {!loading && !studioClosed && slots.length === 0 && (
          <div className="text-center py-24">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-2xl font-medium text-muted-foreground">
              No classes scheduled
            </p>
            <p className="text-muted-foreground mt-2">
              Check back tomorrow
            </p>
          </div>
        )}

        {/* Classes Grid */}
        {!loading && !studioClosed && categorizedSlots.length > 0 && (
          <div className="space-y-16 mt-10">
            {categorizedSlots.map((category) => (
              <section key={category.key}>
                {/* Category Title */}
                <h2 className="text-3xl font-bold mb-8">
                  {category.title}
                </h2>

                {/* Category Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {category.slots.map((slot) => {
                    const spots = remainingSlots[slot.id] ?? 0;
                    const { canBook } = getBookableStatus(slot);
                    const isLow = spots <= 3 && spots > 0;

                    return (
                      <Card
                        key={slot.id}
                        className={`overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                          !slot.active ? "opacity-60" : ""
                        } ${canBook ? "border-primary/20" : ""}`}
                      >
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-2xl font-bold">
                              {slot.name}
                            </CardTitle>
                            <Badge
                              variant={slot.type.startsWith("HOT") ? "destructive" : "default"}
                            >
                              {TYPE_LABELS[slot.type]}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent >
                          <div className="flex items-center gap-3 text-3xl font-bold mb-3">
                            <Clock className="w-8 h-8 text-primary" />
                            <span>
                              {slot.timeLabel}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-8">
                            <div>
                              <p
                                className={`text-2xl font-bold ${
                                  isLow
                                    ? "text-red-600 animate-pulse"
                                    : "text-foreground"
                                }`}
                              >
                                {spots} {spots === 1 ? "spot" : "spots"} left
                              </p>
                              <p className="text-sm text-muted-foreground">
                                of {slot.capacity} total
                              </p>
                            </div>

                            <Button
                              size="lg"
                              onClick={() => handleBook(slot)}
                              disabled={!canBook}
                              className={`min-w-32 font-semibold text-lg ${
                                canBook
                                  ? "bg-primary hover:bg-primary/90 shadow-lg"
                                  : "bg-muted text-muted-foreground cursor-not-allowed"
                              }`}
                            >
                              {canBook
                                ? "Book Now"
                                : spots === 0
                                ? "Full"
                                : "Unavailable"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

      {/* Confirm Dialog */}
      <AlertDialog
        open={!!confirmSlot}
        onOpenChange={(open) => !open && setConfirmSlot(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">
              Confirm Your Booking
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg pt-4">
              You're booking:
              <br />
              <strong className="text-xl">{confirmSlot?.name}</strong>
              <span className="text-muted-foreground"> at </span>
              <strong className="text-xl">{confirmSlot?.startTime}</strong>
              <br />
              <br />
              This will deduct{" "}
              <strong>1 {confirmSlot?.type} point</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="px-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBooking}
              className="px-8 bg-primary hover:bg-primary/90"
            >
              Confirm Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  );
};

export default Classes;