import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RouteProvider } from "@/contexts/RouteContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "PROVIDE_CLIENT_ID_IN_ENV";

// Pages
import Onboarding from "./pages/Onboarding";
import StudentRole from "./pages/StudentRole";
import DriverRole from "./pages/DriverRole";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";
import DriverSignup from "./pages/DriverSignup";
import SetPassword from "./pages/SetPassword";
import OTPVerification from "./pages/OTPVerification";
import Success from "./pages/Success";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RouteSelection from "./pages/RouteSelection";
import Home from "./pages/Home";
import DriverHome from "./pages/DriverHome";
import DriverDashboard from "./pages/DriverDashboard";
import Profile from "./pages/Profile";
import DriverProfile from "./pages/DriverProfile";
import DriverBusManagement from "./pages/DriverBusManagement";
import DriverStopDetails from "./pages/DriverStopDetails";
import DriverSettings from "./pages/DriverSettings";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import StoppageDetails from "./pages/StoppageDetails";
import DriverInfo from "./pages/DriverInfo";
import FAQs from "./pages/FAQs";
import About from "./pages/About";
import Support from "./pages/Support";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import RunningStatus from "./pages/RunningStatus";

const queryClient = new QueryClient();

// Protected route for admin only
const AdminRoute = ({ element }: { element: React.ReactElement }) => {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return element;
};

// FIXED: Missing Role Route Guards (BUG 1)
const StudentRoute = ({ element }: { element: React.ReactElement }) => {
  const { user } = useAuth();
  if (user?.role !== "student") {
    return <Navigate to="/" replace />;
  }
  return element;
};

const DriverRoute = ({ element }: { element: React.ReactElement }) => {
  const { user } = useAuth();
  if (user?.role !== "driver") {
    return <Navigate to="/" replace />;
  }
  return element;
};

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RouteProvider>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Onboarding */}
              <Route path="/" element={<Onboarding />} />
              <Route path="/student-role" element={<StudentRole />} />
              <Route path="/driver-role" element={<DriverRole />} />
              
              {/* Authentication */}
              <Route path="/login" element={<Login />} />
              <Route path="/student-signup" element={<StudentSignup />} />
              <Route path="/driver-signup" element={<DriverSignup />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/otp-verification" element={<OTPVerification />} />
              <Route path="/success" element={<Success />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Main App - Student */}
              <Route path="/route-selection" element={<StudentRoute element={<RouteSelection />} />} />
              <Route path="/home" element={<StudentRoute element={<Home />} />} />
              <Route path="/profile" element={<StudentRoute element={<Profile />} />} />
              <Route path="/settings" element={<StudentRoute element={<Settings />} />} />
              <Route path="/change-password" element={<StudentRoute element={<ChangePassword />} />} />
              <Route path="/stoppage-details" element={<StudentRoute element={<StoppageDetails />} />} />
              <Route path="/driver-info" element={<StudentRoute element={<DriverInfo />} />} />
              <Route path="/faqs" element={<StudentRoute element={<FAQs />} />} />
              <Route path="/about" element={<StudentRoute element={<About />} />} />
              <Route path="/support" element={<StudentRoute element={<Support />} />} />
              <Route path="/running-status" element={<StudentRoute element={<RunningStatus />} />} />
              
              {/* Main App - Driver */}
              <Route path="/driver-home" element={<DriverRoute element={<DriverHome />} />} />
              <Route path="/driver-dashboard" element={<DriverRoute element={<DriverDashboard />} />} />
              <Route path="/driver-profile" element={<DriverRoute element={<DriverProfile />} />} />
              <Route path="/driver-bus-management" element={<DriverRoute element={<DriverBusManagement />} />} />
              <Route path="/driver-stop-details" element={<DriverRoute element={<DriverStopDetails />} />} />
              <Route path="/driver-settings" element={<DriverRoute element={<DriverSettings />} />} />
              
              {/* Admin */}
              <Route path="/admin" element={<AdminRoute element={<AdminPanel />} />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RouteProvider>
    </AuthProvider>
  </ThemeProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
