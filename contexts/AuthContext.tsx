import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type User = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  pendingEmail?: string | null;
  login: (email: string) => void;
  verifyOtp: (code: string) => Promise<boolean>;
  resendOtp: () => void;
  logout: () => void;
  updateProfile: (data: {
    firstName?: string | null;
    lastName?: string | null;
  }) => void;
};

const LOCAL_USER_KEY = "userOfSoundBox";
const LOCAL_PENDING_KEY = "pendingUserForSoundBox";
const LOCAL_OTP_KEY = "otpForSoundBox";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) {
        setUser(JSON.parse(raw));
      }
      const pending = localStorage.getItem(LOCAL_PENDING_KEY);
      if (pending) setPendingEmail(pending);
    } catch (e) {
      // ignore
    }
  }, []);

  const saveUser = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(LOCAL_USER_KEY);
  };

  const generateOtp = () => {
    // generate a 4-digit numeric OTP between 1000 and 9999
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    return code;
  };

  const login = (email: string) => {
    const otp = generateOtp();
    try {
      localStorage.setItem(LOCAL_PENDING_KEY, email);
      localStorage.setItem(LOCAL_OTP_KEY, otp);
      setPendingEmail(email);
      // In a real app we'd send this OTP to the user's email/phone.
      // For this client-only demo we keep it in localStorage so /verify can validate.
      console.info("Generated OTP (dev only):", otp);
    } catch (e) {
      console.error(e);
    }
  };

  const resendOtp = () => {
    const otp = generateOtp();
    try {
      localStorage.setItem(LOCAL_OTP_KEY, otp);
      console.info("Resent OTP (dev only):", otp);
    } catch (e) {
      console.error(e);
    }
  };

  const verifyOtp = async (code: string) => {
    try {
      const stored = localStorage.getItem(LOCAL_OTP_KEY);
      const pending = localStorage.getItem(LOCAL_PENDING_KEY);
      if (!stored || !pending) return false;
      if (stored === code) {
        const u: User = {
          email: pending,
          firstName: null,
          lastName: null,
          phone: null,
        };
        saveUser(u);
        localStorage.removeItem(LOCAL_PENDING_KEY);
        localStorage.removeItem(LOCAL_OTP_KEY);
        setPendingEmail(null);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    saveUser(null);
    localStorage.removeItem(LOCAL_PENDING_KEY);
    localStorage.removeItem(LOCAL_OTP_KEY);
    setPendingEmail(null);
  };

  const updateProfile = (data: {
    firstName?: string | null;
    lastName?: string | null;
  }) => {
    try {
      setUser((prev) => {
        // Only merge name fields. Email and phone are treated as identity/immutable here.
        const updated: User | null = prev
          ? {
              ...prev,
              firstName: data.firstName ?? prev.firstName ?? null,
              lastName: data.lastName ?? prev.lastName ?? null,
            }
          : null;
        if (updated)
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      pendingEmail,
      login,
      verifyOtp,
      resendOtp,
      logout,
      updateProfile,
    }),
    [user, pendingEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
