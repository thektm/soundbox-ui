import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export interface UserRecentlyPlayedItem {
  id: number;
  title: string;
  artist_id: number;
  artist_unique_id?: string | null;
  artist_name: string;
  featured_artists: string[];
  album: number;
  album_title: string;
  is_single: boolean;
  stream_url: string | null;
  cover_image: string;
  duration_seconds: number;
  duration_display: string;
  plays: number;
  likes_count: number;
  is_liked: boolean;
  status: string;
  release_date: string;
  language: string;
  description: string;
  created_at: string;
  display_title: string;
  uploader_unique_id?: string | null;
}

export interface UserRecentlyPlayed {
  items: UserRecentlyPlayedItem[];
  total: number;
  page: number;
  has_next: boolean;
  next: string | null;
}

export interface UserNotificationSetting {
  new_song_followed_artists: boolean;
  new_album_followed_artists: boolean;
  new_playlist: boolean;
  new_likes: boolean;
  new_follower: boolean;
  system_notifications: boolean;
}

export interface UserFollowItem {
  id: number;
  type: string;
  name: string;
  image: string;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  unique_id?: string | null;
}

export interface UserFollows {
  items: UserFollowItem[];
  total: number;
  page: number;
  has_next: boolean;
  next: string | null;
}

export interface User {
  id: number;
  phone_number: string;
  unique_id?: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  roles: string[];
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
  followers_count: number;
  following_count: number;
  user_playlists_count: number;
  recently_played: UserRecentlyPlayed;
  notification_setting: UserNotificationSetting;
  plan: string;
  stream_quality: string;
  followers: UserFollows;
  following: UserFollows;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isInitializing: boolean;
  user: User | null;
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
  fetchUserProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateStreamQuality: (quality: "medium" | "high") => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [verificationContext, setVerificationContext] = useState<string | null>(
    null,
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

  async function get(path: string, token: string) {
    const res = await fetch(`${API_ROOT}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const text = await res.text();
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

  async function post(path: string, body: any) {
    console.log(
      "Making POST request to:",
      `${API_ROOT}${path}`,
      "with body:",
      body,
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

  async function patch(path: string, body: any, token: string) {
    const res = await fetch(`${API_ROOT}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
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

  const fetchUserProfile = async (providedToken?: string) => {
    const token =
      providedToken ||
      accessToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null);
    if (!token) return;

    try {
      const r = await get("/profile/", token);
      if (r.ok && r.body) {
        setUser(r.body as User);
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  const updateProfile = async (updateData: Partial<User>) => {
    const token =
      accessToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null);
    if (!token) throw new Error("Authentication required");

    const r = await patch("/profile/", updateData, token);
    if (!r.ok) throw r.body || new Error("Failed to update profile");

    if (r.body) {
      setUser(r.body as User);
    }
  };

  const updateStreamQuality = async (quality: "medium" | "high") => {
    const token =
      accessToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null);
    if (!token) throw new Error("Authentication required");

    const r = await patch(
      "/profile/settings/stream-quality/",
      { stream_quality: quality },
      token,
    );
    if (!r.ok) {
      throw r.body || new Error("Failed to update stream quality");
    }

    // Response returns new stream_quality and plan (GET returns both; update returns the new value)
    if (r.body) {
      // r.body may be { stream_quality: 'high' } or { stream_quality: 'high', plan: 'premium' }
      setUser((prev) => {
        if (!prev) return prev;
        const updated: User = {
          ...prev,
          stream_quality: r.body.stream_quality || prev.stream_quality,
          plan: r.body.plan || prev.plan,
        };
        return updated;
      });
    }
  };

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

      if (
        data.user &&
        (data.user.followers_count !== undefined || data.user.plan)
      ) {
        setUser(data.user as User);
      } else {
        // Fallback: if user info is incomplete, fetch it
        await fetchUserProfile(data.accessToken);
      }
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

    if (
      data.user &&
      (data.user.followers_count !== undefined || data.user.plan)
    ) {
      setUser(data.user as User);
    } else {
      await fetchUserProfile(data.accessToken);
    }
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

    if (
      data.user &&
      (data.user.followers_count !== undefined || data.user.plan)
    ) {
      setUser(data.user as User);
    } else {
      await fetchUserProfile(data.accessToken);
    }
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

    if (
      data.user &&
      (data.user.followers_count !== undefined || data.user.plan)
    ) {
      setUser(data.user as User);
    } else {
      await fetchUserProfile(data.accessToken);
    }
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
        fetchUserProfile,
        updateProfile,
        updateStreamQuality,
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
