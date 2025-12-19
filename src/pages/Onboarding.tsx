"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { getProfileImage } from "@/utils/getProfileImage";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updateOnboardingStatus } = useAuth();

  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (!user) return;

    try {
      const photoURL = getProfileImage(user.photoURL, name);

      await setDoc(doc(db, "Users", user.uid), {
        name,
        email: user.email,
        phone: `+91${phone}`,
        address,
        photoURL,
        createdAt: serverTimestamp(),
      });

      updateOnboardingStatus(true);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-lg"
      >
        <div className="mb-8 text-center">
          <img
            src={getProfileImage(user?.photoURL, name)}
            alt="Profile"
            className="mx-auto mb-4 h-28 w-28 rounded-full border border-border object-cover"
          />

          <h2 className="text-3xl font-bold text-foreground">
            Welcome to <span className="text-primary">MOUVE</span>
          </h2>

          <p className="mt-2 text-muted-foreground">
            Let’s complete your profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Full Name
            </Label>
            <Input
              id="name"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="bg-background text-foreground placeholder:text-muted-foreground
                        focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground">
              Phone Number
            </Label>

            <div className="flex">
              <span
                className="inline-flex items-center rounded-l-md border border-border
                          bg-muted px-3 text-sm text-muted-foreground"
              >
                +91
              </span>

              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) setPhone(val);
                }}
                placeholder="XXXXXXXXXX"
                className="rounded-l-none bg-background text-foreground
                          placeholder:text-muted-foreground
                          focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-foreground">
              Address
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Area, City, State"
              className="bg-background text-foreground placeholder:text-muted-foreground
                        focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {loading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
