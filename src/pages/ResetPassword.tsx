"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { FirebaseError } from "firebase/app";

const validatePassword = (pwd: string): string | null => {
  if (pwd.length < 7) return "Password must be more than 6 characters.";
  if (!/[A-Z]/.test(pwd)) return "Must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pwd)) return "Must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pwd)) return "Must contain at least one number.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Must contain at least one special character.";
  return null;
};

interface ResetPasswordProps {
  onSuccess?: (email: string) => void; // Optional: trigger login modal with email
}

export default function ResetPassword({ onSuccess }: ResetPasswordProps) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = params.get("oobCode");
  const emailFromParams = params.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  // Verify reset link
  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or expired reset link.");
      return;
    }
    verifyPasswordResetCode(auth, oobCode).catch(() => {
      setError("This reset link is invalid or has expired.");
    });
  }, [oobCode]);

  const handleReset = async () => {
    setError("");

    if (!oobCode) {
      setError("Invalid reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    try {
      setLoading(true);
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(emailFromParams);
        }, 1000);
      } else {
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
      }
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/expired-action-code":
            setError("This reset link has expired.");
            break;
          case "auth/invalid-action-code":
            setError("This reset link is invalid.");
            break;
          case "auth/network-request-failed":
            setError("Network error. Please check your connection and try again.");
            break;
          default:
            setError("Failed to reset password. Please try again.");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Password reset successful 🎉</h1>
          <p className="text-muted-foreground">
            {onSuccess ? "Opening login…" : "Redirecting you back to MOUVE…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-background p-6 rounded-xl shadow-xl space-y-4">
        <h1 className="text-2xl font-semibold text-center">Reset your password</h1>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <div className="relative">
          <Input
            ref={passwordRef}
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>

        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />

        <Button className="w-full" onClick={handleReset} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting…
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </div>
    </div>
  );
}
