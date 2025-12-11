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

    if (user) {
      try {
        let photoURL: string;
        const googleProvider = user.providerData.find(p => p?.providerId === "google.com");
        if (googleProvider && user.photoURL) {
          photoURL = user.photoURL.replace(/=s\d+-c/g, "=s256-c");
        } else if (googleProvider) {
          const providerPhotoUrl = googleProvider.photoURL;
          const googleId = providerPhotoUrl?.split("/").pop();
          if (googleId) {
            photoURL = `https://lh3.googleusercontent.com/a/${googleId}=s256-c`;
          } else {
            photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=6366f1&color=fff&bold=true&size=256`;
          }
        } else {
          photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=6366f1&color=fff&bold=true&size=256`;
        }

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
        setError("Failed to save profile. Please try again.");
        console.error("Onboarding error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card text-card-foreground p-8 rounded-2xl shadow-2xl border border-gray-700"
      >
        <div className="mb-8 text-center">
          <img
            src={getProfileImage(user?.photoURL, name)}
            alt="Profile"
            className="w-28 h-28 rounded-full mx-auto mb-4 border-4 border-gray-700 object-cover"
          />
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Welcome to Mouve!
          </h2>
          <p className="text-muted-foreground mt-2">
            Let's complete your profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              placeholder="Your full name"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex items-center mt-2">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-background text-muted-foreground text-sm">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) {
                    setPhone(val);
                  }
                }}
                placeholder="XXXXXXXXXX"
                className="rounded-l-none"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Area, City, State"
            />
          </div>

          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
