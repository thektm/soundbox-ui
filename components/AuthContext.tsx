import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  isInitializing: boolean;
  user: { id?: string; phone: string; is_verified?: boolean } | null;
  accessToken: string | null;
  login: (phone: string, password?: string) => Promise<void>;
  register: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setPhone: (phone: string) => void;
  phone: string;
  password: string;
  setPassword: (password: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  verifyOtp: (otpCode?: string) => Promise<boolean>;
  verifyLoginOtp: (otpCode?: string) => Promise<boolean>;
  resetPassword: (newPassword: string) => Promise<boolean>;
  requestLoginOtp: (phone: string) => Promise<boolean>;
  requestPasswordReset: (phone: string) => Promise<boolean>;
  verificationContext: string | null;
  setVerificationContext: (context: string | null) => void;
  formatErrorMessage: (error: any) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const API_ROOT = "https://api.sedabox.com/api";

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<{
    id?: string;
    phone: string;
    is_verified?: boolean;
  } | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [verificationContext, setVerificationContext] = useState<string | null>(
    null
  );

  const formatErrorMessage = (error: any): string => {
    if (!error) return "خطای نامشخص رخ داده است";

    if (error.code === "RATE_LIMIT") {
      const seconds = error.retry_after_seconds || 30;
      return `لطفا ${seconds} ثانیه صبر کنید و سپس دوباره امتحان کنید`;
    }

    let msg = error.message || "خطا رخ داده است";
    if (error.fields) {
      msg += ": " + Object.values(error.fields).flat().join(", ");
    }
    return msg;
  };

  async function post(path: string, body: any) {
    console.log(
      "Making POST request to:",
      `${API_ROOT}${path}`,
      "with body:",
      body
    );
    const res = await fetch(`${API_ROOT}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    console.log("Response status:", res.status, "ok:", res.ok);
    const text = await res.text();
    console.log("Response text:", text);
    try {
      return {
        ok: res.ok,
        status: res.status,
        body: text ? JSON.parse(text) : null,
      };
    } catch (e) {
      return { ok: res.ok, status: res.status, body: text };
    }
  }

  const tryRefreshToken = async (refreshToken?: string) => {
    const token =
      refreshToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null);
    if (!token) return false;
    try {
      const r = await post("/auth/token/refresh/", { refreshToken: token });
      if (!r.ok) {
        if (typeof window !== "undefined")
          localStorage.removeItem("refreshToken");
        setAccessToken(null);
        setIsLoggedIn(false);
        return false;
      }
      const data = r.body;
      setAccessToken(data.accessToken);
      if (typeof window !== "undefined")
        localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user || null);
      setIsLoggedIn(true);
      return true;
    } catch (err) {
      return false;
    }
  };

  const formatPhoneForApi = (phoneArg: string) => {
    if (!phoneArg) return phoneArg;
    const digits = ("" + phoneArg).replace(/\D/g, "");
    // handle +98, 0098, 98 -> 09xxxxxxxxx
    if (digits.startsWith("0098") && digits.length >= 13)
      return "0" + digits.slice(4);
    if (digits.startsWith("98") && digits.length >= 11)
      return "0" + digits.slice(2);
    if (digits.startsWith("09") && digits.length === 11) return digits;
    if (digits.startsWith("0") && digits.length === 11) return digits;
    if (digits.startsWith("9") && digits.length === 10) return "0" + digits; // 9123456789 -> 09123456789
    if (digits.length === 9) return "09" + digits; // 335301755 -> 09335301755
    return digits;
  };

  const requestLoginOtp = async (phoneArg: string) => {
    const phone = formatPhoneForApi(phoneArg);
    const r = await post("/auth/login/otp/request/", { phone });
    if (!r.ok) throw r.body || new Error("OTP request failed");
    return true;
  };

  const requestPasswordReset = async (phoneArg: string) => {
    const phone = formatPhoneForApi(phoneArg);
    const r = await post("/auth/password/forgot/", { phone });
    if (!r.ok) throw r.body || new Error("Password reset request failed");
    return true;
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const start = Date.now();
      if (!mounted) return;
      await tryRefreshToken();
      const elapsed = Date.now() - start;
      const remaining = 2000 - elapsed;
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      if (mounted) setIsInitializing(false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (phoneArg: string, passwordArg?: string) => {
    const phoneNormalized = formatPhoneForApi(phoneArg);
    const r = await post("/auth/login/password/", {
      phone: phoneNormalized,
      password: passwordArg,
    });
    if (!r.ok) throw r.body || new Error("Login failed");
    const data = r.body;
    setAccessToken(data.accessToken);
    if (typeof window !== "undefined")
      localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user || { phone: phoneNormalized });
    setIsLoggedIn(true);
  };

  const register = async (phoneArg: string, passwordArg: string) => {
    const phoneNormalized = formatPhoneForApi(phoneArg);
    const r = await post("/auth/register/", {
      phone: phoneNormalized,
      password: passwordArg,
    });
    if (!r.ok) throw r.body || new Error("Registration failed");
    return;
  };

  const verifyOtp = async (otpCode?: string) => {
    const phoneNormalized = formatPhoneForApi(phone);
    const r = await post("/auth/verify/", {
      phone: phoneNormalized,
      otp: otpCode || otp,
    });
    if (!r.ok) throw r.body || new Error("Verification failed");
    const data = r.body;
    setAccessToken(data.accessToken);
    if (typeof window !== "undefined")
      localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user || { phone });
    setIsLoggedIn(true);
    return true;
  };

  const verifyLoginOtp = async (otpCode?: string) => {
    const phoneNormalized = formatPhoneForApi(phone);
    const r = await post("/auth/login/otp/verify/", {
      phone: phoneNormalized,
      otp: otpCode || otp,
    });
    if (!r.ok) throw r.body || new Error("Verification failed");
    const data = r.body;
    setAccessToken(data.accessToken);
    if (typeof window !== "undefined")
      localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user || { phone });
    setIsLoggedIn(true);
    return true;
  };

  const resetPassword = async (newPassword: string) => {
    const phoneNormalized = formatPhoneForApi(phone);
    const r = await post("/auth/password/reset/", {
      phone: phoneNormalized,
      otp,
      newPassword,
    });
    if (!r.ok) throw r.body || new Error("Password reset failed");
    return true;
  };

  const logout = async () => {
    const refresh =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;
    if (refresh) {
      await post("/auth/logout/", { refreshToken: refresh });
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("refreshToken");
    }
    setAccessToken(null);
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isInitializing,
        user,
        accessToken,
        login,
        register,
        requestLoginOtp,
        requestPasswordReset,
        logout,
        setPhone,
        phone,
        password,
        setPassword,
        otp,
        setOtp,
        verifyOtp,
        verifyLoginOtp,
        resetPassword,
        verificationContext,
        setVerificationContext,
        formatErrorMessage,
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
