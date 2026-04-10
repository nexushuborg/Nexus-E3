import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
import GradientButton from "@/components/GradientButton";
import { useAuth } from "@/contexts/AuthContext";

const Success = () => {
  const navigate = useNavigate();
  const { pendingRole, completeSignup } = useAuth();

  const handleContinue = async () => {
    const success = await completeSignup({});
    if (success) {
      if (pendingRole === "driver") {
        navigate("/driver-home");
      } else {
        navigate("/route-selection");
      }
    } else {
      toast({
         title: "Sync Error",
         description: "Failed to finalize your account on the server. Redirecting to login...",
         variant: "destructive"
      });
      navigate("/login");
    }
  };

  return (
    <MobileLayout>
      <AuthCard>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-8">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Success !!
          </h1>
          <p className="text-muted-foreground text-center mb-12">
            Congratulations! You have been<br />successfully authenticated.
          </p>

          <GradientButton onClick={handleContinue}>
            Continue
          </GradientButton>
        </div>
      </AuthCard>
    </MobileLayout>
  );
};

export default Success;
