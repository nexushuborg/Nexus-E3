import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown, Save, Users, Settings, Shield, KeyRound, Bus, AlertTriangle, Ban, CheckCircle } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import FormInput from "@/components/FormInput";
import GradientButton from "@/components/GradientButton";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND = "http://localhost:8000";

interface AdminSettings {
  adminName: string;
  adminPhone: string;
  dutyInstructions: string;
  driverSecretKey: string;
}

interface Route {
  id: string;
  number: string;
  stops: string[];
  timing: string;
  assignedBus?: string;
}

interface Driver {
  _id: string;
  fullname: string;
  email: string;
  routeNo?: string;
  timing?: string;
}

interface AppUser {
  _id: string;
  fullname: string;
  email: string;
  role: string;
  regdNo?: string;
  isBlocked?: boolean;
  createdAt?: string;
}

type Tab = "settings" | "routes" | "drivers" | "users";

const AdminPanel = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("settings");

  // Settings
  const [settings, setSettings] = useState<AdminSettings>({
    adminName: "", adminPhone: "", dutyInstructions: "", driverSecretKey: ""
  });
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Routes (local)
  const [routes, setRoutes] = useState<Route[]>([]);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [rNum, setRNum] = useState("");
  const [rStops, setRStops] = useState("");
  const [rTiming, setRTiming] = useState("");
  const [rBus, setRBus] = useState("");
  const [lastSavedRoute, setLastSavedRoute] = useState<string | null>(null);

  // Drivers
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Users
  const [users, setUsers] = useState<AppUser[]>([]);
  const [userFilter, setUserFilter] = useState<"all" | "student" | "driver">("all");

  useEffect(() => {
    fetchSettings();
    fetchDrivers();
    fetchUsers();
    const saved = localStorage.getItem("adminRoutes");
    if (saved) { try { setRoutes(JSON.parse(saved)); } catch { setRoutes([]); } }
  }, []);

  const fetchSettings = async () => {
    try {
      const r = await fetch(`${BACKEND}/api/admin/settings`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); if (d.settings) setSettings(d.settings); }
    } catch {}
  };

  const fetchDrivers = async () => {
    try {
      const r = await fetch(`${BACKEND}/api/admin/drivers`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); if (d.drivers) setDrivers(d.drivers); }
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const r = await fetch(`${BACKEND}/api/admin/users`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); if (d.users) setUsers(d.users); }
    } catch {}
  };

  // ─── SETTINGS ──────────────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const r = await fetch(`${BACKEND}/api/admin/settings`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(settings),
      });
      if (r.ok) toast({ title: "Saved", description: "Global settings updated." });
      else throw new Error();
    } catch { toast({ title: "Error", description: "Failed to save.", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  // ─── ROUTES ────────────────────────────────────────────────────────────────
  const saveRoutes = (newR: Route[]) => {
    localStorage.setItem("adminRoutes", JSON.stringify(newR));
    setRoutes(newR);
  };

  const resetRouteForm = () => {
    setShowAddRoute(false); setEditingRoute(null);
    setRNum(""); setRStops(""); setRTiming(""); setRBus("");
  };

  const handleAddRoute = () => {
    if (!rNum.trim() || !rStops.trim() || !rTiming.trim()) {
      toast({ title: "Validation", description: "Fill Route No, Stops & Timing.", variant: "destructive" }); return;
    }
    const newRoute: Route = {
      id: Date.now().toString(), number: rNum.trim(),
      stops: rStops.split(",").map(s => s.trim()).filter(Boolean),
      timing: rTiming.trim(), assignedBus: rBus.trim() || undefined,
    };
    const updated = [...routes, newRoute];
    localStorage.setItem("adminRoutes", JSON.stringify(updated));
    setRoutes(updated);
    setLastSavedRoute(rNum.trim());
    setTimeout(() => setLastSavedRoute(null), 4000);
    // Close form and clear fields
    setShowAddRoute(false); setEditingRoute(null);
    setRNum(""); setRStops(""); setRTiming(""); setRBus("");
    toast({ title: "✅ Route Added", description: `Route ${rNum} saved successfully.` });
  };

  const handleEditSave = () => {
    if (!rNum.trim() || !rStops.trim() || !rTiming.trim()) {
      toast({ title: "Validation", description: "Fill required fields.", variant: "destructive" }); return;
    }
    saveRoutes(routes.map(r => r.id === editingRoute ? {
      ...r, number: rNum.trim(),
      stops: rStops.split(",").map(s => s.trim()).filter(Boolean),
      timing: rTiming.trim(), assignedBus: rBus.trim() || undefined,
    } : r));
    resetRouteForm();
    toast({ title: "Route Updated" });
  };

  const handleEditRoute = (r: Route) => {
    setRNum(r.number); setRStops(r.stops.join(", ")); setRTiming(r.timing); setRBus(r.assignedBus || "");
    setEditingRoute(r.id); setShowAddRoute(false);
  };

  // ─── DRIVERS ───────────────────────────────────────────────────────────────
  const handleAssignDriver = async (driverId: string, routeNo: string, timing: string) => {
    try {
      const r = await fetch(`${BACKEND}/api/admin/drivers/assign`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ driverId, routeNo, timing }),
      });
      if (r.ok) toast({ title: "Driver Updated" });
    } catch { toast({ title: "Error", description: "Failed to assign.", variant: "destructive" }); }
  };

  // ─── USERS ─────────────────────────────────────────────────────────────────
  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const r = await fetch(`${BACKEND}/api/admin/users/block`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ userId, block }),
      });
      if (r.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: block } : u));
        toast({ title: block ? "User Blocked" : "User Unblocked" });
      }
    } catch { toast({ title: "Error", description: "Failed.", variant: "destructive" }); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Permanently delete this user?")) return;
    try {
      const r = await fetch(`${BACKEND}/api/admin/users/${userId}`, {
        method: "DELETE", credentials: "include",
      });
      if (r.ok) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        toast({ title: "User Deleted" });
      }
    } catch { toast({ title: "Error", description: "Failed.", variant: "destructive" }); }
  };

  const filteredUsers = userFilter === "all" ? users : users.filter(u => u.role === userFilter);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "settings", label: "Global", icon: Settings },
    { id: "routes", label: "Routes", icon: Bus },
    { id: "drivers", label: "Drivers", icon: Shield },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen px-4 sm:px-6 py-6">
        <BackButton to="/" />
        <div className="flex-1 pt-8">
          <h1 className="text-2xl font-bold text-foreground text-center mb-6">Admin Control Panel</h1>

          {/* Tab Nav */}
          <div className="flex gap-1 mb-6 bg-muted p-1 rounded-2xl">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 ${
                  activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── SETTINGS TAB ─── */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="bg-muted rounded-2xl p-5 space-y-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2"><Settings className="w-4 h-4 text-primary" />Global Settings</h2>
                <FormInput label="Admin Name" value={settings.adminName} onChange={e => setSettings({ ...settings, adminName: e.target.value })} />
                <FormInput label="Admin Phone" value={settings.adminPhone} onChange={e => setSettings({ ...settings, adminPhone: e.target.value })} />
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Duty Instructions</label>
                  <textarea value={settings.dutyInstructions}
                    onChange={e => setSettings({ ...settings, dutyInstructions: e.target.value })}
                    className="w-full bg-background border-2 border-muted rounded-2xl p-3 text-foreground focus:border-primary focus:outline-none" rows={3} />
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                <h2 className="font-semibold text-foreground flex items-center gap-2"><KeyRound className="w-4 h-4 text-amber-500" />Driver Secret Key</h2>
                <p className="text-xs text-muted-foreground">Only drivers who know this key can sign up. Share it privately.</p>
                <div className="relative">
                  <input type={showKey ? "text" : "password"} value={settings.driverSecretKey}
                    onChange={e => setSettings({ ...settings, driverSecretKey: e.target.value })}
                    className="w-full bg-background border-2 border-muted rounded-2xl p-3 pr-16 text-foreground font-mono focus:border-amber-500 focus:outline-none"
                    placeholder="e.g. DRIVER2024"
                  />
                  <button onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground px-2 py-1 bg-muted rounded-lg">
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <GradientButton onClick={handleSaveSettings} disabled={isSaving} className="w-full">
                <Save className="w-4 h-4 mr-2 inline" /> {isSaving ? "Saving..." : "Save All Settings"}
              </GradientButton>
            </div>
          )}

          {/* ─── ROUTES TAB ─── */}
          {activeTab === "routes" && (
            <div className="space-y-3">
              {/* Success badge after adding a route */}
              {lastSavedRoute && (
                <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl px-4 py-3 text-sm text-emerald-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Route "{lastSavedRoute}" saved successfully!
                </div>
              )}

              {!showAddRoute && !editingRoute && (
                <button
                  type="button"
                  onClick={() => {
                    setRNum(""); setRStops(""); setRTiming(""); setRBus("");
                    setEditingRoute(null);
                    setShowAddRoute(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 font-medium mb-4"
                >
                  <Plus className="w-5 h-5" /> Add New Route
                </button>
              )}

              {(showAddRoute || editingRoute) && (
                <div className="bg-muted rounded-2xl p-5 mb-4 space-y-3">
                  <h2 className="font-semibold text-foreground">{editingRoute ? "Edit Route" : "Add New Route"}</h2>
                  <FormInput label="Route Number *" placeholder="e.g. CUTTACK-1-A" value={rNum} onChange={e => setRNum(e.target.value)} />
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Stops (comma-separated) *</label>
                    <textarea value={rStops} onChange={e => setRStops(e.target.value)} rows={3} placeholder="Stop A, Stop B, Stop C"
                      className="w-full bg-background border-2 border-muted rounded-2xl p-3 text-foreground focus:border-primary focus:outline-none" />
                  </div>
                  <FormInput label="Departure Timing *" placeholder="e.g. 06:30 AM" value={rTiming} onChange={e => setRTiming(e.target.value)} />
                  <FormInput label="Assigned Bus No." placeholder="e.g. OD-01-AB-1234" value={rBus} onChange={e => setRBus(e.target.value)} />
                  <div className="flex gap-2 pt-2">
                    <GradientButton onClick={editingRoute ? handleEditSave : handleAddRoute} className="flex-1">
                      {editingRoute ? "Update Route" : "Add Route"}
                    </GradientButton>
                    <button onClick={resetRouteForm} className="flex-1 py-3 px-4 border-2 border-foreground/20 rounded-2xl text-foreground font-medium hover:bg-muted">Cancel</button>
                  </div>
                </div>
              )}

              {routes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No routes added yet. Click "Add New Route" to start.</div>
              ) : routes.map(route => (
                <div key={route.id} className="bg-muted rounded-2xl overflow-hidden">
                  <button onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-background/50">
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{route.number}</p>
                      <p className="text-sm text-muted-foreground">{route.timing} {route.assignedBus && `· ${route.assignedBus}`}</p>
                    </div>
                    {expandedRoute === route.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedRoute === route.id && (
                    <div className="px-4 pb-4 border-t border-background pt-3 space-y-2">
                      <p className="text-sm text-muted-foreground">Stops: <span className="text-foreground">{route.stops.join(" → ")}</span></p>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleEditRoute(route)} className="flex-1 py-2 rounded-xl bg-primary/20 text-primary flex items-center justify-center gap-1 hover:bg-primary/30 text-sm">
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button 
                          onClick={async () => {
                            // FIXED: Deleted Route Crashes Driver Map (BUG 4)
                            try {
                              await fetch(`${BACKEND}/api/admin/routes/${route.number}/kick`, {
                                method: 'DELETE',
                                credentials: 'include'
                              });
                            } catch (e) {
                              console.error("Failed to emit kick event", e);
                            }
                            saveRoutes(routes.filter(r => r.id !== route.id));
                          }} 
                          className="flex-1 py-2 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center gap-1 hover:bg-destructive/30 text-sm"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── DRIVERS TAB ─── */}
          {activeTab === "drivers" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">Assign routes and timings to each driver. Changes save instantly.</p>
              {drivers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No drivers registered yet.</div>
              ) : drivers.map(driver => (
                <DriverCard key={driver._id} driver={driver} onSave={handleAssignDriver} />
              ))}
            </div>
          )}

          {/* ─── USERS TAB ─── */}
          {activeTab === "users" && (
            <div className="space-y-3">
              <div className="flex gap-2 mb-3">
                {(["all", "student", "driver"] as const).map(f => (
                  <button key={f} onClick={() => setUserFilter(f)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${
                      userFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>{f}</button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{filteredUsers.length} user(s) found</p>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">No users found.</div>
              ) : filteredUsers.map(u => (
                <div key={u._id} className={`bg-muted rounded-2xl p-4 border ${u.isBlocked ? "border-destructive/40" : "border-transparent"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{u.fullname}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          u.role === "driver" ? "bg-blue-500/20 text-blue-500" : "bg-green-500/20 text-green-600"
                        }`}>{u.role}</span>
                        {u.regdNo && <span className="text-[10px] px-2 py-0.5 bg-muted-foreground/20 text-muted-foreground rounded-full">Regd: {u.regdNo}</span>}
                        {u.isBlocked && <span className="text-[10px] px-2 py-0.5 bg-destructive/20 text-destructive rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Blocked</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {/* FIXED: Admin Can Block Themselves (BUG 3) */}
                      {u._id !== user?._id && (
                        <button onClick={() => handleBlockUser(u._id, !u.isBlocked)}
                          className={`p-2 rounded-xl ${u.isBlocked ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"}`}>
                          {u.isBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={() => handleDeleteUser(u._id)} className="p-2 rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

// ─── Inline Driver Card Component ─────────────────────────────────────────────
const DriverCard = ({ driver, onSave }: { driver: Driver; onSave: (id: string, route: string, timing: string) => void }) => {
  const [routeNo, setRouteNo] = useState(driver.routeNo || "");
  const [timing, setTiming] = useState(driver.timing || "");
  return (
    <div className="bg-muted rounded-2xl p-4 space-y-3">
      <div>
        <p className="font-semibold text-foreground">{driver.fullname}</p>
        <p className="text-xs text-muted-foreground">{driver.email}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Route No.</label>
          <input value={routeNo} onChange={e => setRouteNo(e.target.value)} placeholder="e.g. CUTTACK-1-A"
            className="w-full bg-background border-2 border-muted rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Timing</label>
          <input value={timing} onChange={e => setTiming(e.target.value)} placeholder="06:30 AM"
            className="w-full bg-background border-2 border-muted rounded-xl px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>
      <button onClick={() => onSave(driver._id, routeNo, timing)}
        className="w-full py-2 bg-primary/20 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 flex items-center justify-center gap-2">
        <Save className="w-4 h-4" /> Save Assignment
      </button>
    </div>
  );
};

export default AdminPanel;
