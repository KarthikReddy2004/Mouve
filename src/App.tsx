import { Suspense, lazy, useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";

import Maintenance from "./pages/Maintenance";
import Navbar from "./components/Navbar";
import PointsDock from "./components/PointsDock";
import Footer from "./components/Footer";
import Loading from "./components/Loading";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import { PointsProvider } from "./context/PointsProvider";

const HeroSection = lazy(() => import("./pages/HeroSection"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const Classes = lazy(() => import("./pages/Classes"));
const Plans = lazy(() => import("./pages/Plans"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function App() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      if (location.pathname === "/") {
        if (!user.displayName) {
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    }
  }, [user, loading, navigate, location.pathname]);

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

  if (loading || maintenanceLoading) return <Loading />;

  if (!isOpen && user && !allowedUsers.includes(user.email || "")) {
    return <Maintenance />;
  }

  return (
    <PointsProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <PointsDock />
        <main className="flex-1">
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<HeroSection />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
  );
}

export default App;
