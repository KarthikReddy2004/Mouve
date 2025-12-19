import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  doc,
  onSnapshot,
  type Unsubscribe,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { FirebaseError } from "firebase/app";

import { db, functions } from "../../firebase";

import DateStrip from "@/components/DateStrip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar, Clock, Users, Zap, Check } from "lucide-react";

import { usePoints } from "../hooks/usePoints";
import { useAuth } from "../hooks/useAuth";

const SLOT_TYPE_TO_POINT_KEY = {
  HOT_YOGA: "hotPoints",
  HOT_PILATES: "hotPoints",
  HATHA: "matPoints",
  MAT: "matPoints",
  REFORMER: "reformerPoints",
} as const;

type SlotType = keyof typeof SLOT_TYPE_TO_POINT_KEY;

interface Slot {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: SlotType;
  capacity: number;
  active: boolean;
  timeLabel?: string;
}

type CategoryKey = "HOT" | "MAT" | "REFORMER";

const CATEGORY_ORDER: CategoryKey[] = ["HOT", "MAT", "REFORMER"];

const TYPE_LABELS: Record<SlotType, string> = {
  HOT_YOGA: "Hot Yoga",
  HOT_PILATES: "Hot Pilates",
  HATHA: "Hatha Yoga",
  MAT: "Mat Pilates",
  REFORMER: "Reformer",
};

const CATEGORY_CONFIG: Record<CategoryKey, { title: string; types: SlotType[] }> =
  {
    HOT: { title: "Hot Yoga / Hot Pilates", types: ["HOT_YOGA", "HOT_PILATES"] },
    MAT: { title: "Hatha Yoga / Mat Pilates", types: ["HATHA", "MAT"] },
    REFORMER: { title: "Reformer Pilates", types: ["REFORMER"] },
  };

// ---------- IST helpers (client) ----------
const formatISTDate = (d: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

const weekdayShortISTFromYYYYMMDD = (yyyyMmDd: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${yyyyMmDd}T00:00:00+05:30`));
};

// ---------- bookings hook ----------
const useUserBookings = (date: string, userId: string | null) => {
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId || !date) {
      setBookedSlotIds([]);
      return;
    }

    const fetchBookings = async () => {
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", userId),
        where("date", "==", date)
      );
      const snapshot = await getDocs(q);
      const ids = snapshot.docs.map((doc) => doc.data().slotId as string);
      setBookedSlotIds(ids);
    };

    fetchBookings();
  }, [date, userId]);

  return bookedSlotIds;
};

const Classes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userPoints = usePoints();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [clientNow, setClientNow] = useState<Date>(new Date());

  const [slots, setSlots] = useState<Slot[]>([]);
  const [remainingSlots, setRemainingSlots] = useState<Record<string, number>>(
    {}
  );
  const [studioClosed, setStudioClosed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [confirmSlot, setConfirmSlot] = useState<Slot | null>(null);

  // Use IST date string everywhere (Firestore, comparisons, callable payload)
  const selectedDateStr = formatISTDate(selectedDate);
  const bookedSlotIds = useUserBookings(selectedDateStr, user?.uid ?? null);

  const categorizedSlots = CATEGORY_ORDER.map((key) => {
    const { title, types } = CATEGORY_CONFIG[key];
    return {
      key,
      title,
      slots: slots.filter((slot) => types.includes(slot.type)),
    };
  }).filter((category) => category.slots.length > 0);

  useEffect(() => {
    const interval = setInterval(() => setClientNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Load classes doc by IST weekday derived from selectedDateStr
  useEffect(() => {
    setLoading(true);
    setSlots([]);
    setRemainingSlots({});
    setStudioClosed(false);

    const weekday = weekdayShortISTFromYYYYMMDD(selectedDateStr);
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

        const data = docSnap.data();

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
  }, [selectedDateStr]);

  const getBookableStatus = useCallback(
    (slot: Slot): { canBook: boolean; reason: string } => {
      if (!slot.active) return { canBook: false, reason: "Inactive" };

      const spots = remainingSlots[slot.id];
      if (spots === undefined || spots <= 0)
        return { canBook: false, reason: "Full" };

      if (bookedSlotIds.includes(slot.id))
        return { canBook: false, reason: "Already booked" };

      // Current time as IST parts (for cutoff)
      const istFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const parts = istFormatter.formatToParts(clientNow);
      const partsMap = parts.reduce((acc, part) => {
        if (part.type !== "literal" && part.type !== "timeZoneName") {
          acc[part.type] = part.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const currentHour = Number(partsMap.hour);
      const currentMinute = Number(partsMap.minute);
      const todayIST = `${partsMap.year}-${partsMap.month}-${partsMap.day}`;

      if (selectedDateStr < todayIST) return { canBook: false, reason: "Past date" };

      if (selectedDateStr === todayIST) {
        const [slotHour, slotMinute] = slot.startTime.split(":").map(Number);
        const slotStartInMinutes = slotHour * 60 + slotMinute;
        const currentInMinutes = currentHour * 60 + currentMinute;
        const cutoffInMinutes = slotStartInMinutes - 5;

        if (currentInMinutes >= cutoffInMinutes) {
          if (currentInMinutes < slotStartInMinutes) {
            return { canBook: false, reason: "Class starts soon" };
          }

          const [endHour, endMinute] = slot.endTime.split(":").map(Number);
          const slotEndInMinutes = endHour * 60 + endMinute;

          if (currentInMinutes >= slotStartInMinutes && currentInMinutes < slotEndInMinutes) {
            return { canBook: false, reason: "Class started" };
          }

          return { canBook: false, reason: "Unavailable" };
        }
      }

      const category = Object.entries(CATEGORY_CONFIG).find(([, config]) =>
        config.types.includes(slot.type)
      )?.[0] as CategoryKey | undefined;

      if (category) {
        const alreadyBookedInCategory = slots.some(
          (s) =>
            bookedSlotIds.includes(s.id) &&
            CATEGORY_CONFIG[category].types.includes(s.type)
        );

        if (alreadyBookedInCategory) {
          return { canBook: false, reason: "One per category per day" };
        }
      }

      const pointKey = SLOT_TYPE_TO_POINT_KEY[slot.type];
      if (!userPoints || userPoints[pointKey] <= 0) {
        return { canBook: false, reason: "No points" };
      }

      return { canBook: true, reason: "Book Now" };
    },
    [remainingSlots, selectedDateStr, clientNow, userPoints, bookedSlotIds, slots]
  );

  const bookSlot = httpsCallable(functions, "bookSlot");

  const handleBook = (slot: Slot) => {
    const { canBook, reason } = getBookableStatus(slot);
    if (!canBook) {
      toast.error(reason);
      return;
    }
    setConfirmSlot(slot);
  };

  const confirmBooking = async () => {
    if (!confirmSlot) return;

    try {
      await bookSlot({
        slotId: confirmSlot.id,
        date: selectedDateStr, // IST YYYY-MM-DD
      });

      toast.success(`Booked! ${confirmSlot.name} at ${confirmSlot.timeLabel}`);
      navigate("/dashboard");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        console.error("Booking error:", err.code, err.message, err);
        switch (err.code) {
          case "functions/failed-precondition":
            toast.error(err.message);
            break;
          case "functions/unauthenticated":
            toast.error("Please log in again.");
            break;
          case "functions/invalid-argument":
            toast.error("Invalid booking data.");
            break;
          default:
            toast.error("Booking failed. Try again.");
        }
      } else {
        toast.error("Unexpected error");
      }
    }
  };

  const totalPoints = userPoints
    ? Object.values(userPoints).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Book Your Class
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Real-time availability • Instant booking • No waiting
          </p>
        </div>

        <DateStrip
          selectedDate={selectedDateStr}
          onDateSelect={(dateString) =>
            // Create a Date that represents IST midnight for this YYYY-MM-DD
            setSelectedDate(new Date(`${dateString}T00:00:00+05:30`))
          }
        />

        {userPoints !== null && totalPoints === 0 && (
          <div className="my-10 p-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl text-center">
            <Zap className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <p className="text-xl text-black font-semibold mb-4">
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

        {loading && (
          <div className="text-center py-24">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-6 text-muted-foreground text-lg">
              Loading classes...
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
            <p className="text-muted-foreground mt-2">Check back tomorrow</p>
          </div>
        )}

        {!loading && !studioClosed && categorizedSlots.length > 0 && (
          <div className="space-y-16 mt-10">
            {categorizedSlots.map((category) => (
              <section key={category.key}>
                <h2 className="text-3xl font-bold mb-8">{category.title}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {category.slots.map((slot) => {
                    const spots = remainingSlots[slot.id] ?? 0;
                    const { canBook, reason } = getBookableStatus(slot);
                    const isLow = spots <= 3 && spots > 0;
                    const isBooked = bookedSlotIds.includes(slot.id);

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
                              variant={
                                slot.type.startsWith("HOT")
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {TYPE_LABELS[slot.type]}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="flex items-center gap-3 text-3xl font-bold mb-3">
                            <Clock className="w-8 h-8 text-primary" />
                            <span>{slot.timeLabel}</span>
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
                              disabled={!canBook || isBooked}
                              className={`min-w-32 font-semibold text-lg flex items-center gap-2 ${
                                isBooked
                                  ? "bg-green-600 hover:bg-green-700"
                                  : canBook
                                  ? "bg-primary hover:bg-primary/90 shadow-lg"
                                  : "bg-muted text-muted-foreground cursor-not-allowed"
                              }`}
                            >
                              {isBooked ? (
                                <>
                                  <Check className="w-5 h-5" />
                                  Booked
                                </>
                              ) : canBook ? (
                                "Book Now"
                              ) : (
                                reason
                              )}
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
                <strong className="text-xl">{confirmSlot?.timeLabel}</strong>
                <br />
                <br />
                This will deduct <strong>1 {confirmSlot?.type} point</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="px-8">Cancel</AlertDialogCancel>
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
