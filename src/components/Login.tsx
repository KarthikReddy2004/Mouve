"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, X, Mail, Lock } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "@/hooks/useAuth";
import "./Login.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillEmail?: string;
  focusPassword?: boolean;
}

export default function LoginModal({ isOpen, onClose, prefillEmail, focusPassword }: LoginModalProps) {
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
    setPasswordError("");
    setShowPasswordHint(false);
    setResetMessage("");
    setEmailError(false);
  };

  useEffect(() => {
    if (user) {
      setAuthLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
      setIsSignup(false); // force login mode
      if (focusPassword) {
        setTimeout(() => passwordRef.current?.focus(), 50);
      }
    }
  }, [prefillEmail, focusPassword]);

  // iOS browsers all use WebKit; treat all iOS as redirect-first. [web:21]
  const isIOS = () => {
    if (typeof window === "undefined") return false;
    return /iP(ad|hone|od)/.test(window.navigator.userAgent);
  };

  const storageAvailable = () => {
    try {
      const test = "__test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setResetMessage("");

    if (!email) {
      setEmailError(true);
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, email, {
        url: `https://mouve.in/reset-password?email=${encodeURIComponent(email)}`,
      });
      setResetMessage("Password reset email sent.Please check your inbox & spam.");
      setIsSignup(false);
      setPassword("");
      setShowPasswordHint(false);
      setEmailError(false);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;
          case "auth/user-not-found":
            setError("No account found with this email.");
            break;
          case "auth/network-request-failed":
            setError("Network error. Please try again.");
            break;
          default:
            setError("Failed to send reset email. Try again later.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setResetLoading(false);
    }
  };

    useEffect(() => {
      if (user && isOpen) {
        onClose();
      }
    }, [user, isOpen, onClose]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 7) return "Password must be more than 6 characters.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character.";
    return null;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPasswordError("");
    setShowPasswordHint(false);
    setLoading(true);

    try {
      if (isSignup) {
        const pwdError = validatePassword(password);
        if (pwdError) {
          setPasswordError(pwdError);
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setAuthLoading(true);
      resetForm();
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-email":
            setError("Please enter a valid email address.");
            break;
          case "auth/user-disabled":
            setError("This account has been disabled.");
            break;
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            setError("Invalid email or password.");
            setShowPasswordHint(true);
            break;
          case "auth/email-already-in-use":
            setError("This email is already registered. Try signing in.");
            break;
          case "auth/weak-password":
            setError(
              "Password is too weak. Use 7+ characters with uppercase, lowercase, number, and special character."
            );
            break;
          case "auth/operation-not-allowed":
            setError("Email/password accounts are not enabled.");
            break;
          case "auth/network-request-failed":
            setError("Network error. Please check your connection.");
            break;
          default:
            setError("An unexpected error occurred. Please try again.");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      if (!passwordError) setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (user || loading) return;

    setError("");

    // Redirect flow needs storage to preserve the initial state; otherwise you get "missing initial state". [web:21]
    if (!storageAvailable()) {
      setError(
        "Google login isn't supported in Private Browsing / storage-restricted mode on Safari. Please disable it or use another browser."
      );
      return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    // iOS: redirect (popup is unreliable on mobile Safari). [web:21]
    if (isIOS()) {
      setLoading(true);
      // Do not await: it navigates away.
      return signInWithRedirect(auth, provider);
    }

    // Desktop: popup.
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      setAuthLoading(true);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/popup-blocked":
            setError("Popup blocked. Please allow popups and try again.");
            break;
          case "auth/popup-closed-by-user":
            setError("Sign-in was cancelled.");
            break;
          case "auth/cancelled-popup-request":
            setError("Another sign-in is in progress.");
            break;
          case "auth/network-request-failed":
            setError("Network error. Please check your connection.");
            break;
          default:
            setError("Google sign-in failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred during Google sign-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="login-modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="login-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="login-modal-close-button"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="login-modal-body">
              {authLoading ? (
                <div className="text-center p-8">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-500" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {isSignup ? "Creating account..." : "Signing in..."}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">Please wait a moment.</p>
                </div>
              ) : (
                <>
                  <div className="login-modal-header">
                    <h2 className="login-modal-title">
                      {isSignup ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p className="login-modal-subtitle">
                      {isSignup ? "Join MOUVE Pilates today" : "Sign in to book your class"}
                    </p>
                  </div>

                  <form onSubmit={handleEmailAuth} className="login-form">

                    <div className="form-group">
                      <Label htmlFor="email">Email</Label>
                      <div className="input-icon-container">
                        <Mail className="input-icon" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError(false);
                          }}
                          className={`form-input ${emailError ? "input-error" : ""}`}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <Label htmlFor="password">Password</Label>
                      <div className="input-icon-container">
                        <Lock className="input-icon" />
                        <Input
                        ref={passwordRef}
                          id="password"
                          type="password"
                          placeholder={isSignup ? "7+ chars, A-z, 0-9, !@#" : "Your password"}
                          value={password}
                          onChange={(e) => {
                            const value = e.target.value;
                            setPassword(value);
                            if (isSignup) setPasswordError("");
                            if (!isSignup && value === "") setShowPasswordHint(true);
                          }}
                          onFocus={() => {
                            if (!isSignup && showPasswordHint) setShowPasswordHint(true);
                          }}
                          className="form-input"
                          required
                          minLength={7}
                          disabled={loading || resetLoading}
                        />
                      </div>

                      {isSignup && passwordError && (
                        <p className="password-error-message">{passwordError}</p>
                      )}

                      {isSignup && !passwordError && password && (
                        <p className="password-hint-message">
                          Must be 6+ characters with uppercase, lowercase, number, and special
                          character.
                        </p>
                      )}

                      {!isSignup && showPasswordHint && !password && (
                        <p className="password-error-message">
                          Must be 7+ characters with uppercase, lowercase, number, and special
                          character.
                        </p>
                      )}
                    
                      {!isSignup && (
                        <div className="forgot-password-container">
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="forgot-password-button"
                            disabled={resetLoading || loading}
                          >
                            {resetLoading ? "Sending..." : "Forgot password?"}
                          </button>
                        </div>
                      )}
                    </div>

                    {!isSignup && error && <p className="login-error-message">{error}</p>}
                    {resetMessage && (<p className="login-success-message">{resetMessage}</p>)}

                    <div className="login-button-container">
                      <Button
                        type="submit"
                        className="login-button"
                        variant="outline"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="loader-icon" />
                            {isSignup ? "Creating..." : "Signing in..."}
                          </>
                        ) : (
                          <>{isSignup ? "Create Account" : "Sign In"}</>
                        )}
                      </Button>
                    </div>
                  </form>

                  <div className="divider">
                    <div className="divider-text">
                      <span>OR</span>
                    </div>
                  </div>

                  <button
                    className="gsi-material-button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || !!user}
                  >
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          style={{ display: "block" }}
                        >
                          <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                          ></path>
                          <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                          ></path>
                          <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                          ></path>
                          <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                          ></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        {loading && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>

                      <span className="gsi-material-button-contents">
                        {loading
                          ? "Signing in…"
                          : user
                          ? "Signed In"
                          : "Continue with Google"}
                      </span>
                      <span style={{ display: "none" }}>Continue with Google</span>
                    </div>
                  </button>

                  {isSignup && error && <p className="login-error-message">{error}</p>}

                  <div className="signup-toggle-text">
                    <span className="muted">
                      {isSignup ? "Already have an account?" : "Don't have an account?"}
                    </span>{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignup(!isSignup);
                        resetForm();
                      }}
                      className="signup-toggle-button"
                      disabled={loading}
                    >
                      {isSignup ? "Sign In" : "Sign Up"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
