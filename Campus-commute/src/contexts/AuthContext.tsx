import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "student" | "driver" | "admin" | null;

interface UserData {
  email: string;
  fullName: string;
  role: UserRole;
  yearBatch?: string;
  routeNo?: string;
  timing?: string;
  selectedRoute?: number;
  password?: string;
  phoneNumber?: string;
  branch?: string;
  course?: string;
  semester?: string;
  profileImage?: string;
  busNumber?: string;
  licenseId?: string;
  registrationNo?: string;
  busStop?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  pendingRole: UserRole;
  pendingEmail: string;
  pendingUserData: Partial<UserData>;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  googleLogin: (accessToken: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  setPendingRole: (role: UserRole) => void;
  setPendingEmail: (email: string) => void;
  setPendingUserData: (data: Partial<UserData>) => void;
  completeSignup: (data: Partial<UserData>) => Promise<boolean>;
  updateUser: (data: Partial<UserData>) => void;
  setSelectedRoute: (route: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const stored = localStorage.getItem("campus-commute-session");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);

  useEffect(() => {
    if (user) {
      localStorage.setItem("campus-commute-session", JSON.stringify(user));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem("campus-commute-session");
      setIsAuthenticated(false);
    }
  }, [user]);
  const [pendingRole, setPendingRole] = useState<UserRole>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUserData, setPendingUserData] = useState<Partial<UserData>>({});

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:8000/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) return false;
      
      const { user: serverUser } = await response.json();
      setIsAuthenticated(true);
      setUser({
        email: serverUser.email,
        fullName: serverUser.fullname,
        role: serverUser.role || role,
        routeNo: serverUser.routeNo,
        selectedRoute: 1
      });
      return true;
    } catch {
      return false;
    }
  };

  const googleLogin = async (accessToken: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:8000/user/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, role })
      });
      if (!response.ok) return false;
      
      const { user: serverUser } = await response.json();
      setIsAuthenticated(true);
      setUser({
        email: serverUser.email,
        fullName: serverUser.fullname,
        role: serverUser.role,
        routeNo: serverUser.routeNo,
        profileImage: serverUser.profileImage,
        selectedRoute: 1
      });
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:8000/user/logout", { method: "POST" });
    } catch {}
    setIsAuthenticated(false);
    setUser(null);
    setPendingRole(null);
    setPendingEmail("");
    setPendingUserData({});
  };

  const completeSignup = async (data: Partial<UserData>): Promise<boolean> => {
    try {
      const payload = {
         fullname: pendingUserData.fullName || pendingEmail.split('@')[0],
         email: pendingEmail,
         password: pendingUserData.password || "OAuthDefaultPassword!12",
         role: pendingRole,
         regdNo: pendingUserData.registrationNo,
         routeNo: pendingUserData.routeNo,
         timing: pendingUserData.timing,
         phone: pendingUserData.phoneNumber
      };

      const res = await fetch("http://localhost:8000/user/register", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Backend registration failed");

      const { user: serverUser } = await res.json();
      setIsAuthenticated(true);
      setUser({
        email: serverUser.email,
        fullName: serverUser.fullname,
        role: serverUser.role,
        routeNo: serverUser.routeNo,
        selectedRoute: 1
      });
      setPendingEmail("");
      setPendingUserData({});
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateUser = (data: Partial<UserData>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
    }
  };

  const setSelectedRoute = (route: number) => {
    if (user) {
      setUser({ ...user, selectedRoute: route });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        pendingRole,
        pendingEmail,
        pendingUserData,
        login,
        googleLogin,
        logout,
        setPendingRole,
        setPendingEmail,
        setPendingUserData,
        completeSignup,
        updateUser,
        setSelectedRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
