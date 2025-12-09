import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  user: { phone: string } | null;
  login: (phone: string, password?: string) => void;
  register: (phone: string, password: string) => void;
  logout: () => void;
  setPhone: (phone: string) => void;
  phone: string;
  password: string;
  setPassword: (password: string) => void;
  otp: string;
  setOtp: (otp: string) => void;
  verifyOtp: () => void;
  resetPassword: (newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isLoggedIn") === "true";
    }
    return false;
  });
  const [user, setUser] = useState<{ phone: string } | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const login = (phone: string, password?: string) => {
    // Simulate login
    setUser({ phone });
    setIsLoggedIn(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("isLoggedIn", "true");
    }
  };

  const register = (phone: string, password: string) => {
    // Simulate register
    setUser({ phone });
    setIsLoggedIn(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("isLoggedIn", "true");
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedIn");
    }
  };

  const verifyOtp = () => {
    // Simulate OTP verification
    if (otp === "1234") {
      // Dummy OTP
      setIsLoggedIn(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("isLoggedIn", "true");
      }
    }
  };

  const resetPassword = (newPassword: string) => {
    // Simulate password reset
    setPassword(newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        login,
        register,
        logout,
        setPhone,
        phone,
        password,
        setPassword,
        otp,
        setOtp,
        verifyOtp,
        resetPassword,
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
