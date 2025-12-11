"use client";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to your Dashboard, {user?.displayName || "User"}!
        </h1>
        <p className="text-lg text-muted-foreground">
          This is your personalized space. More features coming soon!
        </p>
      </motion.div>
    </div>
  );
}
