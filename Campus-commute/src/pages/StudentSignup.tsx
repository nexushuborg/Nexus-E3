import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
import FormInput from "@/components/FormInput";
import GradientButton from "@/components/GradientButton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const nameSchema = z.string()
  .min(2, "Name must be at least 2 characters")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters");

const yearSchema = z.string()
  .regex(/^\d{4}$/, "Year must be a 4-digit number")
  .refine((year) => {
    const num = parseInt(year);
    return num >= 2020 && num <= 2035;
  }, "Please enter a valid batch year");

const emailSchema = z.string().email("Invalid email address");

const StudentSignup = () => {
  const navigate = useNavigate();
  const { setPendingEmail, setPendingUserData, pendingRole } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [yearBatch, setYearBatch] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; yearBatch?: string; email?: string }>({});

  const validateForm = () => {
    const newErrors: { fullName?: string; yearBatch?: string; email?: string } = {};

    try {
      nameSchema.parse(fullName);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.fullName = err.errors[0]?.message;
      }
    }

    try {
      yearSchema.parse(yearBatch);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.yearBatch = err.errors[0]?.message;
      }
    }

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.email = err.errors[0]?.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = () => {
    if (!validateForm()) return;

    if (!termsAccepted) {
      toast({
        title: "Terms & Conditions",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      });
      return;
    }

    setPendingEmail(email);
    setPendingUserData({ fullName, yearBatch, role: pendingRole });
    navigate("/set-password");
  };

  return (
    <MobileLayout>
      <AuthCard>
        <div className="flex flex-col min-h-[calc(100vh-5rem)]">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground text-center mt-8 mb-2">
              Sign Up
            </h1>
            <p className="text-muted-foreground text-center mb-10">
              Please provide the details below<br />to create your account
            </p>

            <div className="space-y-4 mb-6">
              <FormInput
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
                error={errors.fullName}
              />
              <FormInput
                placeholder="Year (Batch)"
                value={yearBatch}
                onChange={(e) => setYearBatch(e.target.value.replace(/\D/g, "").slice(0, 4))}
                error={errors.yearBatch}
              />
              <FormInput
                placeholder="Enter your Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
            </div>

            <label className="flex items-start gap-3 mb-8 cursor-pointer">
              <div 
                onClick={() => setTermsAccepted(!termsAccepted)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  termsAccepted ? "bg-primary border-primary" : "border-muted-foreground"
                }`}
              >
                {termsAccepted && (
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                )}
              </div>
              <span className="text-sm text-foreground leading-relaxed">
                I agree with the{" "}
                <span className="underline">Terms and Conditions</span>
                {" "}and{" "}
                <span className="underline">Privacy Policy</span>
                {" "}of the app
              </span>
            </label>

            <GradientButton onClick={handleCreateAccount}>
              Create Account
            </GradientButton>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground font-medium hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </AuthCard>
    </MobileLayout>
  );
};

export default StudentSignup;
