import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
import Logo from "@/components/Logo";
import GradientButton from "@/components/GradientButton";
import { useAuth } from "@/contexts/AuthContext";

const DriverRole = () => {
  const navigate = useNavigate();
  const { setPendingRole } = useAuth();

  const handleLogin = () => {
    setPendingRole("driver");
    navigate("/login");
  };

  const handleSignUp = () => {
    setPendingRole("driver");
    navigate("/driver-signup");
  };

  return (
    <MobileLayout>
      <AuthCard>
        <div className="flex flex-col items-center justify-between min-h-[calc(100vh-5rem)]">
          <div className="flex-1 flex flex-col items-center justify-center">
            <Logo size="xl" />
            
            <h1 className="text-3xl font-bold text-foreground mt-8 mb-3">
              Driver
            </h1>
            <p className="text-muted-foreground text-center">
              Smart real-time bus tracking for drivers
            </p>
          </div>

          <div className="w-full space-y-4">
            <GradientButton onClick={handleLogin}>
              Log In
            </GradientButton>
            <GradientButton variant="outline" onClick={handleSignUp}>
              Sign Up
            </GradientButton>
          </div>
        </div>
      </AuthCard>
    </MobileLayout>
  );
};

export default DriverRole;
