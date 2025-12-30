import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import { LocationProvider } from "./contexts/LocationContext";

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

const queryClient = new QueryClient();

// Protected route for admin only
const AdminRoute = ({ element }: { element: React.ReactElement }) => {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return element;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
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
                <Route path="/route-selection" element={<RouteSelection />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/stoppage-details" element={<StoppageDetails />} />
                <Route path="/driver-info" element={<DriverInfo />} />
                <Route path="/faqs" element={<FAQs />} />
                <Route path="/about" element={<About />} />
                <Route path="/support" element={<Support />} />
                
                {/* Main App - Driver */}
                <Route path="/driver-home" element={<DriverHome />} />
                <Route path="/driver-profile" element={<DriverProfile />} />
                <Route path="/driver-bus-management" element={<DriverBusManagement />} />
                <Route path="/driver-stop-details" element={<DriverStopDetails />} />
                <Route path="/driver-settings" element={<DriverSettings />} />
                
                {/* Admin */}
                <Route path="/admin" element={<AdminRoute element={<AdminPanel />} />} />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
