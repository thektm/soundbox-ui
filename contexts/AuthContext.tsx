import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { API_BASE_URL } from "../lib/api";

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  artistName?: string;
  verificationStatus?: VerificationStatus;
  verificationType?: "new" | "existing";
  verificationData?: any;
}

export interface OtpDispatchResult {
  status: string;
  resendAfterSeconds?: number;
  expiresInSeconds?: number;
}

export interface ArtistResetVerificationResult {
  status: string;
  resetToken: string;
  expiresInSeconds?: number;
}

class ApiRequestError extends Error {
  code?: string;
  retryAfterSeconds?: number;

  constructor(message: string, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  verificationStatus: VerificationStatus;
  showVerificationModal: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<OtpDispatchResult>;
  resendOtp: (phone: string, isReset: boolean) => Promise<OtpDispatchResult>;
  verifyOtp: (
    otp: string,
    isReset?: boolean,
  ) => Promise<any | ArtistResetVerificationResult>;
  resetPassword: (
    phone: string,
    resetToken: string,
    newPassword: string,
  ) => Promise<void>;
  submitVerification: (data: any, type: "new" | "existing") => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setCurrentPhone: (phone: string | null) => void;
  recheckVerification: () => Promise<VerificationStatus>;
  devAcceptVerification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = API_BASE_URL;

const flattenFieldMessage = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = flattenFieldMessage(item);
      if (message) return message;
    }
    return null;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    for (const item of Object.values(record)) {
      const message = flattenFieldMessage(item);
      if (message) return message;
    }
  }
  return null;
};

const parseApiError = (data: any, statusCode: number): ApiRequestError => {
  const error = data?.error;
  const code = typeof error?.code === "string" ? error.code : undefined;
  const retryAfter = Number(
    error?.retry_after_seconds ?? data?.retry_after_seconds ?? 0,
  );
  const fieldMessage = flattenFieldMessage(error?.fields ?? data?.fields);
  const message =
    fieldMessage ||
    (typeof error?.message === "string" && error.message) ||
    (typeof data?.message === "string" && data.message) ||
    (typeof data?.error === "string" && data.error) ||
    (statusCode >= 500
      ? "The server could not complete the request. Please try again."
      : "The request could not be completed.");
  return new ApiRequestError(
    message,
    code,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [currentPhone, setCurrentPhone] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("none");
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Helper for public auth calls with a stable English error contract.
  const apiCall = async (
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: any,
    params?: Record<string, string>,
  ) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) =>
        url.searchParams.append(key, value),
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Language": "en",
    };

    // These are public authentication endpoints. Never attach a stored access
    // token: an expired token can make DRF reject an AllowAny request with 401.

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiRequestError(
        "Unable to connect to the server. Check your internet connection and try again.",
        "NETWORK_ERROR",
      );
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw parseApiError(data, response.status);
    return data;
  };

  // Attempt to refresh access token using saved refresh token
  const refreshTokens = async (): Promise<boolean> => {
    const savedRefresh = localStorage.getItem("sedabox_refresh_token");
    if (!savedRefresh) return false;

    try {
      const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: savedRefresh }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return false;
      }

      if (data.accessToken) {
        localStorage.setItem("sedabox_token", data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem("sedabox_refresh_token", data.refreshToken);
      }

      return true;
    } catch (err) {
      console.error("Failed to refresh tokens:", err);
      return false;
    }
  };

  // Fetch existing artist auth submission for current user
  const fetchArtistAuth = async () => {
    const token = localStorage.getItem("sedabox_token");
    if (!token) return null;

    try {
      const res = await fetch(`${BASE_URL}/artist/auth/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 404) return null;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch artist auth");
      }

      const data = await res.json().catch(() => null);
      return data;
    } catch (err) {
      console.error("fetchArtistAuth error:", err);
      return null;
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsInitializing(true);
      const savedUser = localStorage.getItem("sedabox_user");
      const savedToken = localStorage.getItem("sedabox_token");

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);

          // If we have a refresh token, try to refresh while splash shows
          const savedRefresh = localStorage.getItem("sedabox_refresh_token");
          if (savedRefresh) {
            const ok = await refreshTokens();
            if (ok) {
              // After refreshing tokens, fetch artist auth to determine verification state
              const auth = await fetchArtistAuth();
              if (auth) {
                // There is an existing submission
                const updatedUser = {
                  ...parsedUser,
                  verificationStatus: auth.is_verified ? "approved" : "pending",
                  verificationData: auth,
                } as User;
                localStorage.setItem(
                  "sedabox_user",
                  JSON.stringify(updatedUser),
                );
                setUser(updatedUser);
                setIsLoggedIn(true);
                setVerificationStatus(updatedUser.verificationStatus || "none");
                // If pending, leave UI to show pending state; if approved, proceed
              } else {
                // No submission found on server — clear any stale verification state
                const clearedUser = { ...parsedUser } as User;
                delete (clearedUser as any).verificationData;
                clearedUser.verificationStatus = "none";
                localStorage.setItem(
                  "sedabox_user",
                  JSON.stringify(clearedUser),
                );
                setUser(clearedUser);
                setIsLoggedIn(true);
                setVerificationStatus("none");
              }
            } else {
              // Refresh failed: clear stored auth
              localStorage.removeItem("sedabox_user");
              localStorage.removeItem("sedabox_token");
              localStorage.removeItem("sedabox_refresh_token");
            }
          } else if (savedToken) {
            // No refresh token available but access token exists — try to fetch artist auth
            const auth = await fetchArtistAuth();
            if (auth) {
              const updatedUser = {
                ...parsedUser,
                verificationStatus: auth.is_verified ? "approved" : "pending",
                verificationData: auth,
              } as User;
              localStorage.setItem("sedabox_user", JSON.stringify(updatedUser));
              setUser(updatedUser);
              setIsLoggedIn(true);
              setVerificationStatus(updatedUser.verificationStatus || "none");
            } else {
              // No server submission — clear any stale verification status
              const clearedUser = { ...parsedUser } as User;
              delete (clearedUser as any).verificationData;
              clearedUser.verificationStatus = "none";
              localStorage.setItem("sedabox_user", JSON.stringify(clearedUser));
              setUser(clearedUser);
              setIsLoggedIn(true);
              setVerificationStatus("none");
            }
          }
        } catch (err) {
          console.error("Failed to parse saved user:", err);
          localStorage.removeItem("sedabox_user");
          localStorage.removeItem("sedabox_token");
          localStorage.removeItem("sedabox_refresh_token");
        }
      }

      setIsInitializing(false);
    };

    checkAuth();
  }, []);

  // Show verification modal for first-time logged in users
  useEffect(() => {
    if (isLoggedIn && verificationStatus === "none" && !isInitializing) {
      setShowVerificationModal(true);
    }
  }, [isLoggedIn, verificationStatus, isInitializing]);

  const login = async (phone: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall(
        "/auth/login/password/",
        "POST",
        {
          phone,
          password,
        },
        { artist: "true" },
      );

      const { accessToken, refreshToken, user: userData } = data;

      // Save to localStorage
      localStorage.setItem("sedabox_user", JSON.stringify(userData));
      localStorage.setItem("sedabox_token", accessToken);
      localStorage.setItem("sedabox_refresh_token", refreshToken);

      // Set basic user state first
      setUser(userData);
      setIsLoggedIn(true);

      // Immediately check for any existing artist auth on the server
      try {
        const auth = await fetchArtistAuth();
        if (auth) {
          // There's an existing submission on server — update user and verification status
          const updatedUser = {
            ...userData,
            verificationStatus: auth.is_verified ? "approved" : "pending",
            verificationData: auth,
          } as User;
          localStorage.setItem("sedabox_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          setVerificationStatus(updatedUser.verificationStatus || "none");
          // If there's an auth (pending or approved), do not show the initial artist verify modal
          setShowVerificationModal(false);
        } else {
          // No submission found — ensure modal to prompt artist verification is shown
          const clearedUser = { ...userData } as User;
          delete (clearedUser as any).verificationData;
          clearedUser.verificationStatus = "none";
          localStorage.setItem("sedabox_user", JSON.stringify(clearedUser));
          setUser(clearedUser);
          setVerificationStatus("none");
          setShowVerificationModal(true);
        }
      } catch (err) {
        // If fetchArtistAuth fails, fall back to userData's reported status
        console.error("login: fetchArtistAuth failed:", err);
        setVerificationStatus(userData.verificationStatus || "none");
      }
    } catch (err: any) {
      setError(err.message || "خطا در ورود. لطفاً دوباره تلاش کنید.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const submitVerification = async (data: any, type: "new" | "existing") => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append(
        "auth_type",
        type === "new" ? "fresh_artist" : "existing_artist",
      );

      if (type === "existing" && data.selectedArtist) {
        formData.append("artist_claimed", data.selectedArtist.id);
      }

      // Map UI fields to API fields
      formData.append("first_name", data.firstName);
      formData.append("last_name", data.lastName);
      formData.append(
        "stage_name",
        type === "new"
          ? data.artisticName
          : data.selectedArtist?.artistic_name ||
              data.selectedArtist?.name ||
              "",
      );
      formData.append("birth_date", data.birthDate);
      formData.append("national_id", data.nationalId);
      formData.append("phone_number", data.phoneNumber);
      formData.append("city", data.city);

      if (data.email) formData.append("email", data.email);
      if (data.address) formData.append("address", data.address);
      if (data.bio || data.additionalInfo) {
        formData.append("biography", data.bio || data.additionalInfo);
      }

      if (data.idCardFile) {
        formData.append("national_id_image", data.idCardFile);
      }

      const token = localStorage.getItem("sedabox_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Try POST first
      let response = await fetch(`${BASE_URL}/artist/auth/`, {
        method: "POST",
        headers,
        body: formData,
      });

      let responseData = await response.json().catch(() => ({}));

      // If already exists, use PATCH
      if (
        response.status === 400 &&
        (responseData.error?.includes("exists") ||
          responseData.message?.includes("exists") ||
          responseData.non_field_errors?.includes("Submission already exists"))
      ) {
        response = await fetch(`${BASE_URL}/artist/auth/`, {
          method: "PATCH",
          headers,
          body: formData,
        });
        responseData = await response.json().catch(() => ({}));
      }

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            JSON.stringify(responseData) ||
            "خطایی در ارسال درخواست رخ داده است",
        );
      }

      const updatedUser: User = {
        ...user!,
        verificationStatus: "pending",
        verificationType: type,
        verificationData: data,
      };

      // Update localStorage
      localStorage.setItem("sedabox_user", JSON.stringify(updatedUser));

      setUser(updatedUser);
      setVerificationStatus("pending");
      setShowVerificationModal(false);
    } catch (err: any) {
      setError(err.message || "خطا در ارسال درخواست. لطفاً دوباره تلاش کنید.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, phone: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall(
        "/auth/register/",
        "POST",
        {
          phone,
          password,
        },
        { artist: "true" },
      );

      // Move to OTP verification and keep the phone across a page refresh.
      setCurrentPhone(phone);
      setOtpVerified(false);
      sessionStorage.setItem("sedabox_artist_verify_phone", phone);
      return data;
    } catch (err: any) {
      setError(err.message || "خطا در ثبت نام. لطفاً دوباره تلاش کنید.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone: string): Promise<OtpDispatchResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall(
        "/auth/artist/password/forgot/",
        "POST",
        { phone },
      );
      setCurrentPhone(phone);
      setOtpVerified(false);
      sessionStorage.setItem("sedabox_artist_reset_phone", phone);
      sessionStorage.removeItem("sedabox_artist_reset_token");
      return data as OtpDispatchResult;
    } catch (err: any) {
      const message = err?.message || "Failed to send the verification code.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (
    phone: string,
    isReset: boolean,
  ): Promise<OtpDispatchResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isReset
        ? "/auth/artist/password/forgot/"
        : "/auth/artist/verify/resend/";
      const data = await apiCall(endpoint, "POST", { phone });
      setCurrentPhone(phone);
      if (isReset) {
        sessionStorage.setItem("sedabox_artist_reset_phone", phone);
        sessionStorage.removeItem("sedabox_artist_reset_token");
      } else {
        sessionStorage.setItem("sedabox_artist_verify_phone", phone);
      }
      return data as OtpDispatchResult;
    } catch (err: any) {
      const message = err?.message || "Failed to resend the verification code.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string, isReset: boolean = false) => {
    setIsLoading(true);
    setError(null);

    if (!currentPhone) {
      const missingPhone = new ApiRequestError(
        "Your phone number is missing. Start the verification process again.",
        "PHONE_REQUIRED",
      );
      setError(missingPhone.message);
      throw missingPhone;
    }

    try {
      if (isReset) {
        const data = (await apiCall(
          "/auth/artist/password/verify/",
          "POST",
          { phone: currentPhone, otp },
        )) as ArtistResetVerificationResult;
        setOtpVerified(true);
        sessionStorage.setItem("sedabox_artist_reset_phone", currentPhone);
        sessionStorage.setItem(
          "sedabox_artist_reset_token",
          data.resetToken,
        );
        return data;
      }

      const data = await apiCall(
        "/auth/verify/",
        "POST",
        { phone: currentPhone, otp },
        { artist: "true" },
      );
      const { accessToken, refreshToken, user: userData } = data;
      localStorage.setItem("sedabox_user", JSON.stringify(userData));
      localStorage.setItem("sedabox_token", accessToken);
      localStorage.setItem("sedabox_refresh_token", refreshToken);
      setUser(userData);
      setIsLoggedIn(true);
      setVerificationStatus(userData.verificationStatus || "none");
      setOtpVerified(true);
      sessionStorage.removeItem("sedabox_artist_verify_phone");
      return data;
    } catch (err: any) {
      const message = err?.message || "The verification code is invalid.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    phone: string,
    resetToken: string,
    newPassword: string,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall(
        "/auth/artist/password/reset/",
        "POST",
        { phone, resetToken, newPassword },
      );
      setOtpVerified(false);
      setCurrentPhone(null);
      sessionStorage.removeItem("sedabox_artist_reset_phone");
      sessionStorage.removeItem("sedabox_artist_reset_token");
      return data;
    } catch (err: any) {
      const message = err?.message || "Failed to reset the artist password.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("sedabox_user");
    localStorage.removeItem("sedabox_token");
    localStorage.removeItem("sedabox_refresh_token");
    sessionStorage.removeItem("sedabox_artist_verify_phone");
    sessionStorage.removeItem("sedabox_artist_reset_phone");
    sessionStorage.removeItem("sedabox_artist_reset_token");
    setUser(null);
    setIsLoggedIn(false);
    setOtpVerified(false);
    setCurrentPhone(null);
    setVerificationStatus("none");
    setShowVerificationModal(false);
  };

  const clearError = () => {
    setError(null);
  };

  const devAcceptVerification = () => {
    if (user) {
      const updatedUser: User = {
        ...user,
        verificationStatus: "approved",
      };
      localStorage.setItem("sedabox_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setVerificationStatus("approved");
    }
  };

  const recheckVerification = async (): Promise<VerificationStatus> => {
    setIsLoading(true);
    setError(null);
    try {
      const auth = await fetchArtistAuth();
      if (auth) {
        const status: VerificationStatus = auth.is_verified
          ? "approved"
          : "pending";
        if (user) {
          const updatedUser: User = {
            ...user,
            verificationStatus: status,
            verificationData: auth,
          };
          localStorage.setItem("sedabox_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
        setVerificationStatus(status);
        setShowVerificationModal(!auth.is_verified);
        return status;
      } else {
        if (user) {
          const clearedUser = { ...user } as User;
          delete (clearedUser as any).verificationData;
          clearedUser.verificationStatus = "none";
          localStorage.setItem("sedabox_user", JSON.stringify(clearedUser));
          setUser(clearedUser);
        }
        setVerificationStatus("none");
        setShowVerificationModal(true);
        return "none";
      }
    } catch (err) {
      console.error("recheckVerification error:", err);
      setError("خطا در بررسی وضعیت. لطفاً دوباره تلاش کنید.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        isInitializing,
        error,
        verificationStatus,
        showVerificationModal,
        login,
        register,
        sendOtp,
        resendOtp,
        verifyOtp,
        resetPassword,
        submitVerification,
        logout,
        clearError,
        setCurrentPhone,
        recheckVerification,
        devAcceptVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
