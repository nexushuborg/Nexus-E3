import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
import BackButton from "@/components/BackButton";
import { Phone, User, Bus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DriverBusManagement = () => {
  const { user } = useAuth();

  // Try to read admin info from localStorage (if admin created assignments)
  const adminInfo = JSON.parse(localStorage.getItem("campus-commute-admin") || "null");

  const handleCallAdmin = () => {
    if (adminInfo?.phone) window.location.href = `tel:${adminInfo.phone}`;
  };

  return (
    <MobileLayout>
      <AuthCard className="max-h-[95vh] overflow-y-auto flex flex-col p-6 sm:p-8 my-auto">
        <div className="flex flex-col">
          <BackButton to="/driver-home" />

          <div className="flex-1 pt-8">
            <h1 className="text-2xl font-bold text-foreground text-center mb-8">Bus Management</h1>

            <div className="space-y-4">
              <div className="bg-muted rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">Admin Name</p>
                <p className="text-foreground font-medium">{adminInfo?.name || "Not available"}</p>
              </div>

              <div className="bg-muted rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">Admin Phone</p>
                <p className="text-foreground font-medium">{adminInfo?.phone || "-"}</p>
              </div>

              <div className="bg-muted rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">Bus Assignment</p>
                <p className="text-foreground font-medium">{user?.busNumber || "Unassigned"}</p>
              </div>

              <div className="bg-muted rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">Route Assignment</p>
                <p className="text-foreground font-medium">{user?.routeNo ? `Route ${user.routeNo}` : "Unassigned"}</p>
              </div>

              <div className="bg-muted rounded-2xl p-4">
                <p className="text-sm text-muted-foreground">Duty Instructions</p>
                <p className="text-foreground font-medium">{adminInfo?.instructions || "No instructions"}</p>
              </div>

              <button onClick={handleCallAdmin} className="w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-center gap-3 mt-4">
                <Phone className="w-5 h-5" />
                <span className="font-medium">Call Admin</span>
              </button>
            </div>
          </div>
        </div>
      </AuthCard>
    </MobileLayout>
  );
};

export default DriverBusManagement;
