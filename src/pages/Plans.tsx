"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Sparkles,
  TrendingUp,
  Zap,
  Award,
  Clock,
  Users,
  Activity,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../../firebase";

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/* ---- Types matching the Firestore structure you specified ---- */
type CategoryType = "REFORMER" | "MAT" | "HOT" | "FITMAX";

interface Plan {
  id: string;
  name: string;
  code: string;
  category: CategoryType;
  reformerPoints: number;
  matPoints: number;
  hotYogaPoints: number;
  hotPilatesPoints: number;
  durationDays: number; // 0 or 1 for single sessions; else 30/45/90/180
  price: number;
  description: string;
  popular?: boolean;
  bestValue?: boolean;
  active: boolean;
  createdAt?: Timestamp | null;
}
/* -------------------------------------------------------------- */

/* ---------- Modal for summary & payment flow ---------- */
function SummaryModal({
  open,
  plan,
  onClose,
  userId,
  onSuccess,
}: {
  open: boolean;
  plan: Plan | null;
  userId: string | null;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
}) {
  const [creating, setCreating] = React.useState(false);
  const popupRef = React.useRef<Window | null>(null);
  const pollRef = React.useRef<number | null>(null);
  const timeoutRef = React.useRef<number | null>(null);
  const [status, setStatus] = React.useState<"idle" | "pending" | "success" | "cancelled">("idle");

  React.useEffect(() => {
    if (!open) {
      cleanup();
    }
    return cleanup;
  }, [open]);

  function cleanup() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
      popupRef.current = null;
    }
    setCreating(false);
    setStatus("idle");
  }

  const openCheckoutPopup = (url: string) => {
    // open a centered popup
    const w = 600;
    const h = 800;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    popupRef.current = window.open(url, "payment_checkout", `width=${w},height=${h},left=${left},top=${top}`);
  };

  const pollPaymentStatus = (paymentId: string) => {
    // poll /api/paymentStatus?paymentId=...
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/paymentStatus?paymentId=${paymentId}`);
        if (!res.ok) return;
        const data = await res.json();
        // Expected: { status: 'PENDING'|'SUCCESS'|'FAILED' }
        if (data?.status === "SUCCESS") {
          setStatus("success");
          cleanup();
          onSuccess(paymentId);
        } else if (data?.status === "FAILED") {
          setStatus("cancelled");
          cleanup();
        }
      } catch (err) {
        // ignore; continue polling
        console.error("poll error", err);
      }
    }, 3000);
  };

  const waitForPopupClose = (paymentId: string) => {
    // If user closes popup prematurely, show cancel confirmation
    timeoutRef.current = window.setTimeout(() => {
      console.log("Payment timed out for paymentId:", paymentId);
      // After 5 minutes, stop polling and mark as cancelled
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setStatus("cancelled");
      setCreating(false);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
        popupRef.current = null;
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  const handleProceedToPayment = async () => {
    if (!plan) return;
    setCreating(true);
    setStatus("pending");

    try {
      // Call your cloud function to create payment & PhonePe order
      // This endpoint must return { paymentId, checkoutUrl }
      // For now it's a dummy endpoint that you will implement on the server
      const res = await fetch("/api/createPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.code || plan.id,
          price: plan.price,
          userId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create payment");
      }
      const data = await res.json();
      const pid = data?.paymentId;
      const url = data?.checkoutUrl;

      if (!pid || !url) {
        throw new Error("Invalid response from createPayment");
      }

      // open popup to payment provider
      openCheckoutPopup(url);

      // start polling payment status
      pollPaymentStatus(pid);
      // watch for popup close or success
      const popupInterval = window.setInterval(() => {
        if (!popupRef.current) {
          window.clearInterval(popupInterval);
          // popup not created (shouldn't happen)
          return;
        }
        if (popupRef.current.closed) {
          // popup closed before success -> we keep polling for a small window (30s), then show cancelled
          window.clearInterval(popupInterval);
          // let the polling continue for another 30 seconds to allow async callback to mark success
          setTimeout(async () => {
            try {
              const r = await fetch(`/api/paymentStatus?paymentId=${pid}`);
              const d = await r.json();
              if (d?.status === "SUCCESS") {
                setStatus("success");
                cleanup();
                onSuccess(pid);
                return;
              } else {
                setStatus("cancelled");
                cleanup();
              }
            } catch {
              setStatus("cancelled");
              cleanup();
            }
          }, 30000);
        }
      }, 1000);

      // overall session timeout (5 minutes)
      waitForPopupClose(pid);
    } catch (err) {
      console.error(err);
      setStatus("cancelled");
      setCreating(false);
    }
  };

  if (!open || !plan) return null;

  // compute cost per point if relevant:
  const totalPoints = plan.reformerPoints + plan.matPoints + plan.hotYogaPoints + plan.hotPilatesPoints;
  const costPerPoint = totalPoints > 0 ? plan.price / totalPoints : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-lg rounded-lg bg-background p-6"
      >
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-lg font-semibold">₹{plan.price.toLocaleString()}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Validity</div>
            <div className="text-lg font-semibold">
              {plan.durationDays <= 1 ? "Single use" : `${plan.durationDays} days`}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Reformer</div>
            <div className="text-lg font-semibold">{plan.reformerPoints}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Mat</div>
            <div className="text-lg font-semibold">{plan.matPoints}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Hot Yoga</div>
            <div className="text-lg font-semibold">{plan.hotYogaPoints + plan.hotPilatesPoints}</div>
          </div>
          {costPerPoint !== null && (
            <div className="rounded-md border p-3 col-span-2">
              <div className="text-xs text-muted-foreground">Approx. cost per point</div>
              <div className="text-lg font-semibold">₹{Math.round(costPerPoint)}</div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Close
          </Button>
          <Button onClick={handleProceedToPayment} disabled={creating}>
            {creating ? "Processing..." : "Proceed to Payment"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {status === "pending" && <p className="mt-3 text-sm text-muted-foreground">Awaiting payment...</p>}
        {status === "success" && <p className="mt-3 text-sm text-green-600">Payment successful!</p>}
        {status === "cancelled" && <p className="mt-3 text-sm text-red-600">Payment was cancelled or timed out.</p>}
      </motion.div>
    </div>
  );
}

/* ---------- PlanCard component ---------- */
function PlanCard({ plan, onBuy }: { plan: Plan; onBuy: (plan: Plan) => void }) {
  const totalPoints = plan.reformerPoints + plan.matPoints + plan.hotYogaPoints + plan.hotPilatesPoints;
  const costPerPoint = totalPoints > 0 ? plan.price / totalPoints : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <Card
        className={cn(
          "relative h-full transition-all duration-300 overflow-hidden",
          plan.popular && "border-primary shadow-lg shadow-primary/20",
          plan.bestValue && "border-green-500 shadow-lg shadow-green-500/20"
        )}
      >
        {(plan.popular || plan.bestValue) && (
          <div className="absolute top-0 right-0 z-10">
            <Badge
              className={cn(
                "rounded-bl-lg rounded-tr-lg rounded-tl-none rounded-br-none",
                plan.popular && "bg-primary",
                plan.bestValue && "bg-green-500"
              )}
            >
              {plan.popular && (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Popular
                </>
              )}
              {plan.bestValue && (
                <>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Best Value
                </>
              )}
            </Badge>
          </div>
        )}

        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="text-lg mb-1">{plan.name}</CardTitle>
            <CardDescription className="text-sm">{plan.description}</CardDescription>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">₹{plan.price.toLocaleString()}</span>
            <span className="ml-2 text-sm text-muted-foreground">
              {plan.durationDays <= 1 ? "Single session" : `${plan.durationDays} days`}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {plan.reformerPoints > 0 && (
              <Badge variant="outline" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                {plan.reformerPoints} Reformer
              </Badge>
            )}
            {plan.matPoints > 0 && (
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {plan.matPoints} Mat
              </Badge>
            )}
            {(plan.hotYogaPoints + plan.hotPilatesPoints) > 0 && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                {plan.hotYogaPoints + plan.hotPilatesPoints} Hot
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {plan.durationDays <= 1 ? "Single use" : `${plan.durationDays} days`}
            </Badge>
            {costPerPoint !== null && (
              <Badge variant="outline" className="text-xs">
                ~₹{Math.round(costPerPoint)}/pt
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Button className="w-full group" variant={plan.popular || plan.bestValue ? "default" : "outline"} onClick={() => onBuy(plan)}>
            Buy Plan
            <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------- The main page ---------- */
export default function PlansPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<"ALL" | CategoryType | "FITMAX">("ALL");
  const [loading, setLoading] = React.useState(true);
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  // Replace with real logged-in user id from auth
  const userId = "demo-user-id";

  const categories: (CategoryType | "ALL" | "FITMAX")[] = ["ALL", "REFORMER", "MAT", "HOT", "FITMAX"];

  React.useEffect(() => {
    // subscribe to plans where active == true
    const q = query(collection(db, "plans"), where("active", "==", true));
    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Plan[] = [];
        snapshot.forEach((doc) => {
        const d = doc.data() as DocumentData;
        loaded.push({
          id: doc.id,
          name: d.name,
          code: d.code,
          category: d.category,
          reformerPoints: d.reformerPoints || 0,
          matPoints: d.matPoints || 0,
          hotYogaPoints: d.hotYogaPoints || 0,
          hotPilatesPoints: d.hotPilatesPoints || 0,
          durationDays: d.durationDays ?? 0,
          price: d.price ?? 0,
          description: d.description ?? "",
          popular: !!d.popular,
          bestValue: !!d.bestValue,
          active: !!d.active,
          createdAt: d.createdAt ?? null,
        });
      });
        loaded.sort((a, b) => a.price - b.price);
        setPlans(loaded);
        setLoading(false);
      },
      (err) => {
        console.error("plans subscription error", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const grouped = React.useMemo(() => {
    const filtered = selectedCategory === "ALL" ? plans : plans.filter((p) => p.category === selectedCategory || (selectedCategory === "FITMAX" && p.category === "FITMAX"));
    const group: Record<string, Plan[]> = {};
    for (const p of filtered) {
      const key = p.category;
      if (!group[key]) group[key] = [];
      group[key].push(p);
    }
    return group;
  }, [plans, selectedCategory]);

  const onBuy = (plan: Plan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPlan(null);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    // on success, you may navigate to dashboard or show success toast
    // For now, we'll close modal and log
    console.log("Payment success", paymentId);
    setModalOpen(false);
    setSelectedPlan(null);
    // Frontend should also listen to user's points document to reflect updates (as per spec)
    // e.g., points/{userId} will be incremented by cloud function on successful payment
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground">Plans & Points</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose a package and get Reformer, Mat, or Hot Yoga points to book classes.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((c) => {
            const isActive = selectedCategory === c;
            const label = c === "ALL" ? "All" : c === "REFORMER" ? "Reformer" : c === "MAT" ? "Yoga & Mat" : c === "HOT" ? "Hot Yoga / Hot Pilates" : "Fitmax Combo";
            return (
              <Button key={c} variant={isActive ? "default" : "outline"} onClick={() => setSelectedCategory(c)} className="transition-all">
                {label}
              </Button>
            );
          })}
        </div>

        {loading && <p className="text-center text-sm text-muted-foreground">Loading plans…</p>}

        <div className="space-y-12">
          {Object.entries(grouped).length === 0 && !loading && <p className="text-center text-muted-foreground">No plans available.</p>}
          {Object.entries(grouped).map(([category, categoryPlans]) => (
            <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {category === "REFORMER" && <Activity className="w-6 h-6 text-primary" />}
                  {category === "MAT" && <Users className="w-6 h-6 text-primary" />}
                  {category === "HOT" && <Zap className="w-6 h-6 text-primary" />}
                  {category === "FITMAX" && <Award className="w-6 h-6 text-primary" />}
                  <h2 className="text-2xl font-bold text-foreground">
                    {category === "REFORMER"
                      ? "Reformer Pilates"
                      : category === "MAT"
                      ? "Hatha Yoga / Mat Pilates"
                      : category === "HOT"
                      ? "Hot Yoga / Hot Pilates"
                      : "Fitmax Combo"}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onBuy={onBuy} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <SummaryModal open={modalOpen} plan={selectedPlan} onClose={handleModalClose} userId={userId} onSuccess={handlePaymentSuccess} />
    </div>
  );
}
