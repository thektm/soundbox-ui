import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { toast } from "react-hot-toast";

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

export interface UserProfileImage {
  id: number;
  image: string;
  status: string;
  created_at: string;
  updated_at: string;
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
  image_profile: UserProfileImage | null;
  plan: string;
  // Optional fields used by various API versions to indicate premium status
  is_premium?: boolean | string | number;
  isPremium?: boolean;
  subscription?: { is_active?: boolean } | null;
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
  setPassword: Dispatch<SetStateAction<string>>;
  otp: string;
  setOtp: (otp: string) => void;
  verifyOtp: (otpCode?: string) => Promise<boolean>;
  verifyLoginOtp: (otpCode?: string) => Promise<boolean>;
  resetPassword: (newPassword: string) => Promise<boolean>;
  requestLoginOtp: (phone: string) => Promise<boolean>;
  requestPasswordReset: (phone: string) => Promise<boolean>;
  fetchUserProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateProfileImage: (file: File) => Promise<UserProfileImage>;
  deleteProfileImage: () => Promise<void>;
  updateStreamQuality: (quality: "medium" | "high") => Promise<void>;
  authenticatedFetch: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  verificationContext: string | null;
  setVerificationContext: (context: string | null) => void;
  formatErrorMessage: (error: any) => string;
  needsInitialCheck: boolean;
  setNeedsInitialCheck: (needs: boolean) => void;
  markInitialCheckCompleted: (genreIds: number[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const API_ROOT = "https://api.sedabox.com/api";

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    // Synchronous hint for the first client-side render to prevent layout shifts.
    // If a refreshToken exists, assume we are logged in so the Shell renders the Sidebar immediately.
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("refreshToken");
    }
    return false;
  });
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [verificationContext, setVerificationContext] = useState<string | null>(
    null,
  );
  const [needsInitialCheck, setNeedsInitialCheck] = useState<boolean>(false);

  const formatErrorMessage = (errorArg: any): string => {
    const error = errorArg?.error ?? errorArg;
    if (!error) return "خطای نامشخصی رخ داده است";

    const errorMap: Record<string, string> = {
      "Invalid credentials": "نام کاربری یا رمز عبور اشتباه است",
      "User already exists": "این کاربر قبلاً ثبت‌نام کرده است",
      "Invalid OTP": "کد تایید وارد شده اشتباه است",
      "OTP expired": "کد تایید منقضی شده است",
      "Phone number not found": "شماره همراه یافت نشد",
      "Passwords do not match": "رمز عبور با تکرار آن مطابقت ندارد",
      "Phone number already exists": "این شماره همراه قبلاً در سیستم وجود دارد",
      "Account is not active": "حساب کاربری فعال نیست",
      "Token is invalid or expired":
        "زمان نشست شما به پایان رسیده است، مجدداً وارد شوید",
      "User not found": "کاربر مورد نظر پیدا نشد",
      "Password reset failed": "تغییر رمز عبور با شکست مواجه شد",
      "Registration failed": "ثبت‌نام انجام نشد",
      "Login failed": "ورود به حساب با خطا مواجه شد",
      "Verification failed": "تایید کد ناموفق بود",
      "OTP request failed": "خطا در ارسال کد تایید",
      "Method Not Allowed": "دسترسی غیرمجاز",
      "Internal Server Error": "خطا در سمت سرور رخ داده است",
      "Bad Request": "درخواست نامعتبر",
      "Too many requests": "تعداد درخواست‌ها بیش از حد مجاز است",
      "User not logged in": "لطفا ابتدا وارد حساب خود شوید",
      "No active subscription found.": "شما اشتراک فعال ندارید",
    };

    if (error.code === "RATE_LIMIT") {
      const seconds = error.retry_after_seconds || 30;
      return `لطفا ${seconds} ثانیه صبر کنید و سپس دوباره امتحان کنید`;
    }

    // Helper for substring-based mapping (covers many server wording variants)
    const mapBySubstring = (s: string) => {
      const lc = (s || "").toLowerCase();
      if (
        lc.includes("current password") ||
        lc.includes("incorrect password") ||
        lc.includes("invalid password") ||
        lc.includes("current password is incorrect")
      )
        return "رمز فعلی اشتباه است";
      if (
        lc.includes("unique id") ||
        lc.includes("unique_id") ||
        lc.includes("user with this unique id")
      )
        return "شناسه منحصر به فرد قبلا استفاده شده است";
      if (lc.includes("refresh token") || lc.includes("refresh"))
        return "توکن رفرش نامعتبر است";
      if (lc.includes("not found") && lc.includes("session"))
        return "نشست پیدا نشد";
      if (lc.includes("too many requests") || lc.includes("rate limit"))
        return "تعداد درخواست‌ها بیش از حد مجاز است";
      return null;
    };

    if (error.fields) {
      const msgs = Object.values(error.fields)
        .flat()
        .map((m: any) => {
          const s = String(m || "");
          return (
            errorMap[s] ||
            mapBySubstring(s) ||
            "خطایی رخ داده است. لطفا دوباره تلاش کنید"
          );
        });
      return msgs.join(" - ");
    }

    const detail =
      error.detail ||
      error.message ||
      (typeof error === "string" ? error : null);
    if (detail) {
      const s = String(detail);
      // Exact map
      if (errorMap[s]) return errorMap[s];
      // Substring map
      const bySub = mapBySubstring(s);
      if (bySub) return bySub;
      // If the detail contains English letters, avoid returning raw English.
      if (/[a-zA-Z]/.test(s)) return "خطایی رخ داده است. لطفا دوباره تلاش کنید";
      return s;
    }

    return "خطایی رخ داده است. لطفا دوباره تلاش کنید";
  };

  async function get(path: string) {
    const res = await authenticatedFetch(`${API_ROOT}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
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
    // Only use authenticatedFetch for non-auth paths or if we want refresh logic
    // For login/refresh itself, we use standard fetch to avoid infinite loops
    const isAuthPath = path.includes("/auth/");
    const fetchFn = isAuthPath ? fetch : authenticatedFetch;

    const res = await fetchFn(`${API_ROOT}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  async function patch(path: string, body: any) {
    const res = await authenticatedFetch(`${API_ROOT}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
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
    // If a token is provided manually, we use it, otherwise authenticatedFetch handles it
    try {
      let r;
      if (providedToken) {
        const res = await fetch(`${API_ROOT}/profile/`, {
          headers: { Authorization: `Bearer ${providedToken}` },
        });
        const body = await res.json();
        r = { ok: res.ok, body };
      } else {
        r = await get("/profile/");
      }

      if (r.ok && r.body) {
        setUser(r.body as User);
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  const updateProfile = async (updateData: Partial<User>) => {
    const r = await patch("/profile/", updateData);
    if (!r.ok) throw r.body || new Error("Failed to update profile");

    if (r.body) {
      setUser(r.body as User);
    }
  };

  const updateProfileImage = async (file: File): Promise<UserProfileImage> => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await authenticatedFetch(`${API_ROOT}/profile/image/`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw data || new Error("Failed to upload profile image");

    // Re-fetch profile to update UI
    await fetchUserProfile();
    return data;
  };

  const deleteProfileImage = async (): Promise<void> => {
    const res = await authenticatedFetch(`${API_ROOT}/profile/image/delete/`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const text = await res.text();
      let err;
      try {
        err = JSON.parse(text);
      } catch {
        err = new Error("Failed to delete profile image");
      }
      throw err;
    }

    // Re-fetch profile to update UI
    await fetchUserProfile();
  };

  const updateStreamQuality = async (quality: "medium" | "high") => {
    const r = await patch("/profile/settings/stream-quality/", {
      stream_quality: quality,
    });
    if (!r.ok) {
      throw r.body || new Error("Failed to update stream quality");
    }

    if (r.body) {
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

  const checkInitialStatus = async (token?: string) => {
    try {
      const url = `${API_ROOT}/profile/initial-check/`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 404) {
        setNeedsInitialCheck(true);
      } else if (res.ok) {
        setNeedsInitialCheck(false);
      }
    } catch (err) {
      console.error("Failed to check initial status", err);
    }
  };

  const markInitialCheckCompleted = async (genreIds: number[]) => {
    try {
      const r = await post("/profile/initial-check/", { genre_ids: genreIds });
      if (r.ok) {
        setNeedsInitialCheck(false);
      }
    } catch (err) {
      console.error("Failed to mark initial check completed", err);
    }
  };

  const tryRefreshToken = async (
    refreshTokenArg?: string,
  ): Promise<string | null> => {
    const token =
      refreshTokenArg ||
      (typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null);
    if (!token) return null;
    try {
      const r = await post("/auth/token/refresh/", { refreshToken: token });
      if (!r.ok) {
        if (r.status === 401) {
          if (typeof window !== "undefined")
            localStorage.removeItem("refreshToken");
          setAccessToken(null);
          setIsLoggedIn(false);
          setUser(null);
        }
        return null;
      }
      const data = r.body;
      setAccessToken(data.accessToken);
      if (typeof window !== "undefined")
        localStorage.setItem("refreshToken", data.refreshToken);

      // If server returned full user object in refresh response, use it
      if (data.user) {
        setUser(data.user as User);
      } else {
        // Fallback: if user info not provided, fetch it
        await fetchUserProfile(data.accessToken);
      }
      setIsLoggedIn(true);

      // Check initial check status after refreshing token
      await checkInitialStatus(data.accessToken);

      return data.accessToken;
    } catch (err) {
      return null;
    }
  };

  const authenticatedFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    let currentToken = accessToken;

    // If the auth layer is still initializing (refresh in progress), wait
    // briefly for it to complete to avoid racing other components that
    // immediately call protected endpoints (e.g. opening /profile directly).
    if (isInitializing) {
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!isInitializing) {
            clearInterval(interval);
            resolve(null);
          }
        }, 50);
        // safety timeout to avoid hanging forever
        setTimeout(() => {
          clearInterval(interval);
          resolve(null);
        }, 5000);
      });
      // Refresh currentToken after init completes
      currentToken = accessToken;
    }

    // If we have neither an in-memory access token nor a stored refresh token,
    // avoid calling the API for protected endpoints — return a synthetic 401
    // response so callers can handle missing auth without triggering refresh/logout.
    if (
      !currentToken &&
      typeof window !== "undefined" &&
      !localStorage.getItem("refreshToken")
    ) {
      if (typeof Response !== "undefined") {
        return new Response(null, { status: 401, statusText: "Unauthorized" });
      }
      // Fallback for environments without Response constructor
      const fake: any = {
        ok: false,
        status: 401,
        text: async () => "",
        clone() {
          return this;
        },
      };
      return fake as Response;
    }

    const applyAuth = (token: string | null) => {
      const options = { ...init };
      const headers = new Headers(options.headers || {});
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (
        options.body &&
        typeof options.body === "string" &&
        !headers.has("Content-Type")
      ) {
        headers.set("Content-Type", "application/json");
      }
      options.headers = headers;
      return options;
    };

    try {
      let response = await fetch(input, applyAuth(currentToken));

      if (response.status === 401) {
        const newToken = await tryRefreshToken();
        if (newToken) {
          response = await fetch(input, applyAuth(newToken));
        }
      }

      if (!response.ok) {
        // Try to parse server error body to produce a nicer message.
        // Use a cloned response so we don't consume the original body stream
        // — callers may still want to read it (e.g. `get`/`post` helpers).
        let parsedBody: any = null;
        try {
          const text = await response.clone().text();
          parsedBody = text ? JSON.parse(text) : null;
        } catch (e) {
          parsedBody = null;
        }

        const defaultMsg =
          response.status >= 500
            ? "در ارتباط با سرور خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید"
            : "درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید";

        const message = parsedBody
          ? formatErrorMessage(parsedBody)
          : defaultMsg;

        // Avoid showing toasts for 401 (unauthorized) responses — these are
        // handled elsewhere (refresh/logout logic) and often occur during
        // initialization or navigation races. Show toasts for other statuses.
        if (response.status !== 401) {
          try {
            toast.error(message || defaultMsg);
          } catch (e) {
            console.error("Toast error", e);
          }
        }
      }

      return response;
    } catch (err: any) {
      // Network or other unexpected error
      // If the request was explicitly aborted (e.g. navigation/unmount),
      // don't show a network toast — it's an expected cancellation.
      if (
        err &&
        (err.name === "AbortError" || String(err).includes("aborted"))
      ) {
        throw err;
      }

      const netMsg =
        "در ارتباط با سرور خطایی رخ داد. لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید";
      try {
        toast.error(netMsg);
      } catch (e) {
        console.error("Toast error", e);
      }
      throw err;
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
      if (!mounted) return;
      // Fetch fresh token and user data without artificial delays
      // to reduce Cumulative Layout Shift (CLS) during hydration.
      await tryRefreshToken();
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
    await checkInitialStatus(data.accessToken);
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
    await checkInitialStatus(data.accessToken);
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
    await checkInitialStatus(data.accessToken);
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
    setNeedsInitialCheck(false);
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
        updateProfileImage,
        deleteProfileImage,
        updateStreamQuality,
        authenticatedFetch,
        verificationContext,
        setVerificationContext,
        formatErrorMessage,
        needsInitialCheck,
        setNeedsInitialCheck,
        markInitialCheckCompleted,
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
