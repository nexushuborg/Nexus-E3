import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
import Logo from "@/components/Logo";
import GradientButton from "@/components/GradientButton";
import { useAuth } from "@/contexts/AuthContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const { setPendingRole } = useAuth();

  const handleStudentClick = () => {
    setPendingRole("student");
    navigate("/student-role");
  };

  const handleDriverClick = () => {
    setPendingRole("driver");
    navigate("/driver-role");
  };

  return (
    <MobileLayout>
      <AuthCard>
        <div className="flex flex-col items-center justify-between min-h-[calc(100vh-5rem)]">
          <div className="flex-1 flex flex-col items-center justify-center">
            <Logo size="lg" />
            
            <h1 className="text-3xl font-bold text-foreground mt-8 mb-3">
              Campus Commute
            </h1>
            <p className="text-muted-foreground text-center">
              Smart real-time bus tracking for students
            </p>
          </div>

          <div className="w-full space-y-4">
            <GradientButton onClick={handleStudentClick}>
              Student
            </GradientButton>
            <GradientButton onClick={handleDriverClick}>
              Driver
            </GradientButton>
          </div>
        </div>
      </AuthCard>
    </MobileLayout>
  );
};

export default Onboarding;
