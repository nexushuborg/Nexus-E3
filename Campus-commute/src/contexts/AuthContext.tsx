import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "student" | "driver" | "admin" | null;

interface UserData {
  email: string;
  fullName: string;
  role: UserRole;
  yearBatch?: string;
  routeNo?: string;
  timing?: string;
  selectedRoute?: string;
  password?: string;
  phoneNumber?: string;
  branch?: string;
  course?: string;
  semester?: string;
  profileImage?: string;
  busNumber?: string;
  licenseId?: string;
  conductorName?: string;
  conductorPhone?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  pendingRole: UserRole;
  pendingEmail: string;
  pendingUserData: Partial<UserData>;
  selectedRoute?: string;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  setPendingRole: (role: UserRole) => void;
  setPendingEmail: (email: string) => void;
  setPendingUserData: (data: Partial<UserData>) => void;
  completeSignup: (data: Partial<UserData>) => void;
  updateUser: (data: Partial<UserData>) => void;
  setSelectedRoute: (route: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingUserData, setPendingUserData] = useState<Partial<UserData>>({});

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Get account from localStorage
    const registeredAccounts = JSON.parse(
      localStorage.getItem("campus-commute-accounts") || "[]"
    );
    const account = registeredAccounts.find(
      (acc: any) => acc.email === email && acc.role === role && acc.password === password
    );

    if (!account) {
      return false;
    }

    setIsAuthenticated(true);
    setUser({
      email: account.email,
      fullName: account.fullName,
      role: account.role,
      password: account.password,
      yearBatch: account.yearBatch,
      routeNo: account.routeNo,
      timing: account.timing,
      selectedRoute: account.selectedRoute,
      phoneNumber: account.phoneNumber,
      branch: account.branch,
      course: account.course,
      semester: account.semester,
      profileImage: account.profileImage,
      busNumber: account.busNumber,
      licenseId: account.licenseId,
      conductorName: account.conductorName,
      conductorPhone: account.conductorPhone,
    });
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setPendingRole(null);
    setPendingEmail("");
    setPendingUserData({});
  };

  const completeSignup = (data: Partial<UserData>) => {
    setIsAuthenticated(true);
    setUser({
      email: pendingEmail,
      fullName: pendingUserData.fullName || "",
      role: pendingRole,
      yearBatch: pendingUserData.yearBatch,
      routeNo: pendingUserData.routeNo,
      timing: pendingUserData.timing,
      ...data,
    });
    setPendingEmail("");
    setPendingUserData({});
  };

  const updateUser = (data: Partial<UserData>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);

      // Persist updates to registered accounts in localStorage if present
      try {
        const registeredAccounts = JSON.parse(
          localStorage.getItem("campus-commute-accounts") || "[]"
        );
        const idx = registeredAccounts.findIndex((acc: any) => acc.email === user.email && acc.role === user.role);
        if (idx !== -1) {
          registeredAccounts[idx] = { ...registeredAccounts[idx], ...data };
          localStorage.setItem("campus-commute-accounts", JSON.stringify(registeredAccounts));
        }
      } catch (err) {
        // ignore
      }
    }
  };

  const setSelectedRoute = (route: string) => {
    if (user) {
      updateUser({ ...user, selectedRoute: route });
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
        selectedRoute: user?.selectedRoute,
        login,
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
