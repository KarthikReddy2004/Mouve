"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { WhatsAppIcon } from '../components/SocialIcons';
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
import { auth, db } from "../../firebase";

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

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; }

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

type CategoryType = "REFORMER" | "MAT" | "HOT" | "FITMAX COMBO" | "NUTRITION" | "FITMAX";

interface Plan {
  id: string;
  name: string;
  code: string;
  category: CategoryType;
  reformerPoints: number;
  matPoints: number;
  hotPoints: number;
  nutritionPoints: number;
  durationDays: number;
  price: number;
  description: string;
  popular?: boolean;
  bestValue?: boolean;
  active: boolean;
  createdAt?: Timestamp | null;
}

function ManualPaymentModal({
  open,
  plan,
  onClose,
}: {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
}) {
  if (!open || !plan) return null;
  const totalPoints =
    plan.reformerPoints +
    plan.matPoints +
    plan.hotPoints +
    plan.nutritionPoints;
  const message = `
Hi,
This is *${auth.currentUser?.displayName || "User"}.*
This is my Email : *${auth.currentUser?.email || "??"}*
I would like to purchase the following plan:

Plan Name -
*${plan.name}*

Plan Code -
*${plan.code}*
`;
  const whatsappUrl = `https://wa.me/8074078804?text=${encodeURIComponent(message)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-lg rounded-lg bg-background p-6"
      >
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {plan.description}
        </p>

        {/* Plan summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-lg font-semibold">
              ₹{plan.price.toLocaleString()}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Validity</div>
            <div className="text-lg font-semibold">
              {plan.durationDays <= 1
                ? "Single use"
                : `${plan.durationDays} days`}
            </div>
          </div>

          <div className="rounded-md border p-3 col-span-2">
            <div className="text-xs text-muted-foreground">
              Total Points
            </div>
            <div className="text-lg font-semibold">
              {totalPoints}
            </div>
          </div>
        </div>

        {/* Important message */}
        <div className="rounded-md border border-yellow-400 bg-yellow-50 p-4 mb-4">
          <p className="text-sm text-yellow-900 font-medium">
            🚧 Payment Gateway Not Integrated
          </p>
          <p className="text-sm text-yellow-800 mt-1">
            Online payments are currently unavailable.
            <br />
            Please click the WhatsApp button below or visit the studio to complete your payment.
            <br />
            Your points will be credited to your account once the payment is confirmed.
          </p>
        </div>
        <div className="flex justify-center mb-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors"
          >
            <WhatsAppIcon />
          </a>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function PlanCard({ plan, onBuy }: { plan: Plan; onBuy: (plan: Plan) => void }) {
  const totalPoints = plan.reformerPoints + plan.matPoints + plan.hotPoints + plan.nutritionPoints;
  const costPerPoint = totalPoints > 0 ? plan.price / totalPoints : null;
  const isPopular = plan.popular;
  const isBestValue = plan.bestValue;
  const isHighlighted = isPopular || isBestValue;
  const isBoth = isPopular && isBestValue;


  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <Card
        className={cn(
          "relative h-full transition-all duration-300 overflow-hidden border",
          isHighlighted && "border-green-500 shadow-lg shadow-green-500/20",
          isBoth && "border-2 shadow-xl"
        )}
      >
        {(plan.popular || plan.bestValue) && (
          <div className="absolute top-0 right-0 z-10">
            <Badge
              className={cn(
                "rounded-bl-lg rounded-tr-lg rounded-tl-none rounded-br-none px-3 py-1 flex items-center gap-1 text-xs font-semibold",
                plan.popular && plan.bestValue && "bg-green-600",
                plan.popular && !plan.bestValue && "bg-green-500",
                plan.bestValue && !plan.popular && "bg-green-500"
              )}
            >
              {plan.popular && plan.bestValue ? (
                <>
                  <Sparkles className="w-3 h-3" />
                  Popular & Best Value
                </>
              ) : plan.popular ? (
                <>
                  <Sparkles className="w-3 h-3" />
                  Popular
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3" />
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
            {(plan.hotPoints) > 0 && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                {plan.hotPoints} Hot
              </Badge>
            )}
            {plan.nutritionPoints > 0 && (
              <Badge variant="outline" className="text-xs">
                <Award className="w-3 h-3 mr-1" />
                {plan.nutritionPoints} Nutrition
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

export default function PlansPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<"ALL" | CategoryType | "FITMAX">("ALL");
  const [loading, setLoading] = React.useState(true);
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const categories: (CategoryType | "ALL" | "FITMAX")[] = ["ALL", "REFORMER", "MAT", "HOT", "FITMAX", "NUTRITION"];
  React.useEffect(() => {
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
          hotPoints: d.hotPoints || 0,
          nutritionPoints: d.nutritionPoints || 0,
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
    const filtered = selectedCategory === "ALL" ? plans : plans.filter((p) => p.category === selectedCategory || (selectedCategory === "FITMAX" && p.category === "FITMAX COMBO"));
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground">Plans & Points</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose a package and unlock access to sessions using points.
          </p>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((c) => {
            const isActive = selectedCategory === c;
            const label =
              c === "ALL"
                ? "All"
                : c === "REFORMER"
                ? "Reformer"
                : c === "MAT"
                ? "Yoga & Mat"
                : c === "HOT"
                ? "Hot Yoga / Hot Pilates"
                : c === "NUTRITION"
                ? "Nutritional Consultation"
                : "Fitmax Combo";
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
                  {category === "NUTRITION" && <Award className="w-6 h-6 text-primary" />}
                  <h2 className="text-2xl font-bold text-foreground">
                    {category === "REFORMER"
                      ? "Reformer Pilates"
                      : category === "MAT"
                      ? "Hatha Yoga / Mat Pilates"
                      : category === "HOT"
                      ? "Hot Yoga / Hot Pilates"
                      : category === "NUTRITION"
                      ? "Nutritional Consultation" 
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

      <ManualPaymentModal
        open={modalOpen}
        plan={selectedPlan}
        onClose={handleModalClose}
      />
    </div>
  );
}
