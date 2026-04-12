import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
import FormInput from "@/components/FormInput";
import GradientButton from "@/components/GradientButton";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

const SetPassword = () => {
  const navigate = useNavigate();
  const { pendingUserData, pendingEmail, pendingRole, setPendingUserData } = useAuth();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.newPassword = err.errors[0]?.message;
      }
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    // Save password into pending user data so completeSignup can use it
    setPendingUserData({ ...pendingUserData, password: newPassword });

    // Save account to localStorage
    const registeredAccounts = JSON.parse(
      localStorage.getItem("campus-commute-accounts") || "[]"
    );

    // Check if account already exists
    const accountExists = registeredAccounts.some(
      (acc: any) => acc.email === pendingEmail && acc.role === pendingRole
    );

    if (accountExists) {
      toast({
        title: "Account Already Exists",
        description: "This email is already registered",
        variant: "destructive",
      });
      return;
    }

    const newAccount = {
      email: pendingEmail,
      password: newPassword,
      role: pendingRole,
      fullName: pendingUserData.fullName || "",
      yearBatch: pendingUserData.yearBatch,
      // include any pending data (route, timing, phone etc.)
      ...pendingUserData,
    };

    registeredAccounts.push(newAccount);
    localStorage.setItem("campus-commute-accounts", JSON.stringify(registeredAccounts));

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/user/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send OTP email");
      }

      toast({
        title: "Code Sent",
        description: "We've sent a verification code to your email.",
      });
      navigate("/otp-verification");
    } catch (err: any) {
      console.error("OTP send failed:", err);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please check your backend connection or try again later.",
        variant: "destructive",
      });
      // DO NOT SKIP OTP! Wait for the user to try again or fix the backend.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout>
      <AuthCard>
        <div className="flex flex-col min-h-[calc(100vh-5rem)]">
          <div className="flex items-center justify-between mb-6">
            <BackButton />
          </div>

          <div className="flex-1 pt-2">
            <h1 className="text-3xl font-bold text-foreground text-center mb-2">
              Set Password
            </h1>
            <p className="text-muted-foreground text-center mb-10">
              Welcome!
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">New Password</label>
                <FormInput
                  type="password"
                  placeholder="••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  showPasswordToggle
                  showLockIcon
                  error={errors.newPassword}
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Confirm Password</label>
                <FormInput
                  type="password"
                  placeholder="••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  showPasswordToggle
                  showLockIcon
                  error={errors.confirmPassword}
                />
              </div>
            </div>

          <div className="mt-12">
            <GradientButton onClick={handleSignUp} disabled={isLoading}>
              {isLoading ? "Sending..." : "Sign Up"}
            </GradientButton>
          </div>
        </div>
      </div>
      </AuthCard>
    </MobileLayout>
  );
};

export default SetPassword;
