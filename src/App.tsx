import { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Maintenance from "./pages/Maintenance.tsx";
import Navbar from "./components/Navbar";
import PointsDock from "./components/PointsDock.tsx";
import Footer from "./components/Footer";
import Loading from "./components/Loading";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { useAuth } from "./hooks/useAuth.ts";
import { PointsProvider } from "./context/PointsProvider";
import { getRedirectResult } from "firebase/auth";
import { auth } from "../firebase";

const HeroSection = lazy(() => import("./pages/HeroSection.tsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.tsx"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions.tsx"));
const Classes = lazy(() => import("./pages/Classes.tsx"));
const Plans = lazy(() => import("./pages/Plans.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));

function App() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error("Redirect result error:", err);
    });
  }, []);

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const docRef = doc(db, "Users", "Settings");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsOpen(data.Open);
          setAllowedUsers(data.AllowedUsers || []);
        } else {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Error fetching maintenance status:", error);
        setIsOpen(true);
      } finally {
        setMaintenanceLoading(false);
      }
    };

    fetchMaintenanceStatus();
  }, []);

  if (loading || maintenanceLoading) {
    return <Loading />;
  }

  if (!isOpen && user && !allowedUsers.includes(user.email || "")) {
    return <Maintenance />;
  }

  return (
    <BrowserRouter>
      <PointsProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <PointsDock />
          <main className="flex-1">
            <ErrorBoundary>
              <Suspense fallback={<Loading />}>
                <Routes>
                  <Route path="/" element={<HeroSection />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/classes" element={<Classes />} />
                    <Route path="/plans" element={<Plans />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                  </Route>
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </PointsProvider>
    </BrowserRouter>
  );
}

export default App;
