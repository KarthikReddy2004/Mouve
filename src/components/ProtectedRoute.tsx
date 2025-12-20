"use client";

import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Loading from "./Loading";
import LoginModal from "./Login";

interface ProtectedRouteProps {
  redirectPath?: string;
  onboardingPath?: string;
}

export default function ProtectedRoute({
  redirectPath = "/",
  onboardingPath = "/onboarding",
}: ProtectedRouteProps) {
  const { user, loading, isUserOnboarded } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setShowLoginModal(true);
      } else {
        setShowLoginModal(false);
      }
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && user) {
      if (isUserOnboarded === false && window.location.pathname !== onboardingPath) {
        navigate(onboardingPath);
      } else if (isUserOnboarded === true && window.location.pathname === onboardingPath) {
        navigate("/dashboard");
      }
    }
  }, [loading, user, isUserOnboarded, navigate, onboardingPath]);

  if (loading) {
    return <Loading />;
  }

  if (user && isUserOnboarded === null) {
    return <Loading />;
  }

  if (!user) {
    return (
      <>
        <LoginModal isOpen={showLoginModal} onClose={() => navigate(redirectPath)} />
        {/* Render a fallback or redirect to landing page while modal is open */}
        <div className="text-center p-4">You need to log in to access this page.</div>
      </>
    );
  }

  if (isUserOnboarded === false && window.location.pathname !== onboardingPath) {
    return null; // The useEffect above will handle the navigation to onboarding
  }

  return <Outlet />;
}
