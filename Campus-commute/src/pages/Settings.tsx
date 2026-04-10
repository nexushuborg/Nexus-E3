import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Lock, Bell, MapPin, HelpCircle, Info, Phone, Moon, Sun, Trash2 } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";
import BackButton from "@/components/BackButton";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import DeleteAccountModal from "@/components/DeleteAccountModal";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [locationSharing, setLocationSharing] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <MobileLayout>
      <AuthCard className="max-h-[95vh] overflow-y-auto flex flex-col p-6 sm:p-8 my-auto">
        <div className="flex flex-col">
          <BackButton to="/home" />
          
          <div className="flex-1 pt-8">
            <h1 className="text-2xl font-bold text-foreground text-center mb-8">
              Settings
            </h1>

            {/* Appearance */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 text-center tracking-wide">
              </h2>
              <div className="bg-muted rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-background">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <Moon className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Sun className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="text-foreground">Dark Mode</span>
                  </div>
                  <Switch 
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </div>
            </div>

            {/* Password & Security */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 text-center tracking-wide">
              </h2>
              <div className="bg-muted rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-background">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-foreground text-sm font-medium">Location Sharing</span>
                      <span className="text-xs text-muted-foreground">Share your live location with the system</span>
                    </div>
                  </div>
                  <Switch 
                    checked={locationSharing}
                    onCheckedChange={setLocationSharing}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border-b border-background">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-foreground text-sm font-medium">Notifications</span>
                      <span className="text-xs text-muted-foreground">App and route notifications</span>
                    </div>
                  </div>
                  <Switch 
                    checked={notificationEnabled}
                    onCheckedChange={setNotificationEnabled}
                  />
                </div>

                <button 
                  onClick={() => navigate("/change-password")}
                  className="flex items-center justify-between p-4 w-full border-b border-background hover:bg-background/50 transition-colors"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-foreground text-sm font-medium">Change Password</span>
                  </div>
                </button>

                <button 
                  onClick={() => navigate("/support")}
                  className="flex items-center justify-between p-4 w-full hover:bg-background/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground text-sm font-medium">Help & Support</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <button 
              onClick={() => {}}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white py-3 rounded-full font-medium transition-colors mb-6 shadow-sm shadow-blue-500/20"
            >
              Save
            </button>

            {/* Danger Zone */}
            <div className="mt-8">
              <h2 className="text-xs font-semibold text-red-500 mb-3 tracking-wide uppercase">
                Danger Zone
              </h2>
              <div className="bg-red-500/10 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setDeleteModalOpen(true)}
                  className="flex items-center gap-3 p-4 w-full hover:bg-red-500/20 transition-colors text-left"
                >
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <span className="block text-red-600 dark:text-red-400 font-medium">Delete Account</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthCard>

      <DeleteAccountModal 
        open={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
      />
    </MobileLayout>
  );
};

export default Settings;

