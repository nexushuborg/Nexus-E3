import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
import BackButton from "@/components/BackButton";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import GradientButton from "@/components/GradientButton";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import DeleteAccountModal from "@/components/DeleteAccountModal";

const DriverSettings = () => {
  const { user } = useAuth();
  const [locationSharing, setLocationSharing] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <MobileLayout>
      <AuthCard className="max-h-[95vh] overflow-y-auto flex flex-col p-6 sm:p-8 my-auto">
        <div className="flex flex-col">
          <BackButton to="/driver-home" />

          <div className="flex-1 pt-8">
            <h1 className="text-2xl font-bold text-foreground text-center mb-8">Settings</h1>

            <div className="space-y-4">
              <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground font-medium">Location Sharing</p>
                  <p className="text-muted-foreground text-xs">Share your live location with the system</p>
                </div>
                <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
              </div>

              <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground font-medium">Notifications</p>
                  <p className="text-muted-foreground text-xs">App and route notifications</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>

              <div className="bg-muted rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground font-medium">Dark Mode</p>
                  <p className="text-muted-foreground text-xs">Toggle app appearance</p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <div className="bg-muted rounded-2xl p-4">
                <button onClick={() => navigate('/change-password')} className="w-full text-left font-medium text-foreground">Change Password</button>
              </div>

              <div className="bg-muted rounded-2xl p-4">
                <button onClick={() => navigate('/support')} className="w-full text-left font-medium text-foreground">Help & Support</button>
              </div>

              <GradientButton onClick={() => {}}>Save</GradientButton>

              {/* Danger Zone */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-destructive mb-3 uppercase tracking-wide">
                  Danger Zone
                </h3>
                <div className="bg-destructive/5 rounded-2xl overflow-hidden border border-destructive/20">
                  <button 
                    onClick={() => setDeleteModalOpen(true)}
                    className="flex items-center gap-3 p-4 w-full hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                    <span className="text-destructive font-medium">Delete Account</span>
                  </button>
                </div>
              </div>
            </div>

            <DeleteAccountModal 
              open={deleteModalOpen} 
              onOpenChange={setDeleteModalOpen}
            />
          </div>
        </div>
      </AuthCard>
    </MobileLayout>
  );
};

export default DriverSettings;
