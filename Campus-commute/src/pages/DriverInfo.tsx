import { Phone, User, Bus, Clock, MapPin } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import busRoutes from "@/data/busRoutes";

const DriverInfo = () => {
  const { user } = useAuth();

  const assignedRoute = busRoutes.find(route => route.busNumber === user?.selectedRoute);

  const driver = user;
  const conductor = {
    name: user?.conductorName,
    phone: user?.conductorPhone,
  };
  
  // ==============================
  // CALL HANDLERS
  // ==============================
  const driverPhone = driver?.phoneNumber || "";
  const conductorPhone = conductor?.phone || "";

  const handleCallDriver = () => {
    window.location.href = `tel:${driverPhone}`;
  };

  const handleCallConductor = () => {
    if (!conductorPhone) return;
    window.location.href = `tel:${conductorPhone}`;
  };

  // ==============================
  // UI
  // ==============================
  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen px-8 py-6">
        <BackButton to="/home" />

        <div className="flex-1 pt-8">
          <h1 className="text-2xl font-bold text-center mb-8">
            Driver's Info
          </h1>

          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {driver?.profileImage ? (
                <img
                  src={driver.profileImage}
                  alt="driver"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Driver Name */}
            <InfoCard
              icon={<User className="w-5 h-5 text-primary" />}
              label="Driver Name"
              value={driver?.fullName || "Not available"}
            />

            {/* Route */}
            <InfoCard
              icon={<Bus className="w-5 h-5 text-primary" />}
              label="Route Assigned"
              value={assignedRoute?.routeName || "Not assigned"}
            />

            {/* Timing */}
            <InfoCard
              icon={<Clock className="w-5 h-5 text-primary" />}
              label="Timing"
              value={assignedRoute?.classTime || "N/A"}
            />

            {/* Bus Number */}
            <InfoCard
              icon={<Bus className="w-5 h-5 text-primary" />}
              label="Bus Number"
              value={assignedRoute?.arrivalBus || "N/A"}
            />

            {/* Conductor Name */}
            {conductor.name && (
              <InfoCard
                icon={<User className="w-5 h-5 text-primary" />}
                label="Conductor Name"
                value={conductor.name}
              />
            )}

            {/* Duty Status */}
            <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Duty Status
                  </p>
                  <p className="font-medium">
                    {"On Duty"} {/* Assuming a default for now */}
                  </p>
                </div>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>

            {/* CALL DRIVER */}
            <PrimaryButton
              onClick={handleCallDriver}
              label="Call Driver"
              disabled={!driverPhone}
            />

            {/* CALL CONDUCTOR (SAME STYLE) */}
            {conductor?.name && (
              <PrimaryButton
                onClick={handleCallConductor}
                label={`Call ${conductor.name}`}
                disabled={!conductorPhone}
              />
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

// ==============================
// REUSABLE COMPONENTS
// ==============================
const InfoCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="bg-muted rounded-2xl p-4">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  </div>
);

const PrimaryButton = ({
  onClick,
  label,
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-center gap-3 transition-opacity
      ${disabled ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}`}
  >
    <Phone className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

export default DriverInfo;
