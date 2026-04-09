import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

const AuthCard = ({ children, className = "" }: AuthCardProps) => {
  return (
    <div
      className={cn(
        "w-full max-w-[430px] mx-auto rounded-[2rem] border border-border bg-background/95 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.35)] p-8",
        className
      )}
    >
      {children}
    </div>
  );
};

export default AuthCard;
