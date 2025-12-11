"use client";

import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Loading from "./Loading";
import LoginModal from "./Login"; // Assuming you have a LoginModal component
// import { auth } from "../../firebase"; // This import is not used in ProtectedRoute

interface ProtectedRouteProps {
  redirectPath?: string;
  onboardingPath?: string;
}

export default function ProtectedRoute({
  redirectPath = "/",
  onboardingPath = "/onboarding",
}: ProtectedRouteProps) {
  const { user, loading, isUserOnboarded } = useAuth(); // Get isUserOnboarded from AuthContext
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated, show login modal
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
        navigate("/dashboard"); // Redirect to dashboard if already onboarded
      }
    }
  }, [loading, user, isUserOnboarded, navigate, onboardingPath]);

  if (loading || isUserOnboarded === null) { // Show loading while onboarding status is being determined
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
