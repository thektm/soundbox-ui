"use no memo";

// Keep the auth/session coordinator on baseline React semantics. The Capacitor
// build enables React Compiler for UI performance, but this module is a
// long-lived async state machine built around mutable refs, single-flight
// refresh promises, token rotation, storage synchronization and stale-response
// guards. Opting this one module out keeps native session behavior identical
// to the original web/base implementation while the rest of the native UI
// remains compiler-optimized.

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { toast } from "react-hot-toast";
import { useI18n } from "./I18nContext";
import { formatAuthError } from "./authErrors";
import { openAuthPrompt } from "./authPrompt";
import { clientTrace, withClientTimeout } from "../lib/clientDebug";
import { normalizeUserAvatarUrl } from "../lib/mediaUrl";
import type { FeaturedArtistLike } from "../lib/songDisplay";
import { isNativeAndroid, nativePreferences } from "../lib/nativePreferences";

export interface UserRecentlyPlayedItem {
  id: number;
  title: string;
  artist_id: number;
  artist_unique_id?: string | null;
  artist_name: string;
  featured_artists: FeaturedArtistLike[];
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

export const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSetting = {
  new_song_followed_artists: true,
  new_album_followed_artists: true,
  new_playlist: false,
  new_likes: true,
  new_follower: true,
  system_notifications: true,
};

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
  premium_expires_at?: string | null;
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
  applyUserSnapshot: (user: User) => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateProfileImage: (file: File) => Promise<UserProfileImage>;
  deleteProfileImage: () => Promise<void>;
  updateStreamQuality: (quality: "medium" | "high") => Promise<void>;
  updateNotificationSettings: (
    changes: Partial<UserNotificationSetting>,
  ) => Promise<UserNotificationSetting>;
  authenticatedFetch: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  getFreshAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
  verificationContext: string | null;
  setVerificationContext: (context: string | null) => void;
  formatErrorMessage: (error: any) => string;
  needsInitialCheck: boolean;
  setNeedsInitialCheck: (needs: boolean) => void;
  markInitialCheckCompleted: (genreIds: number[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeFollowCollection = (collection: any): UserFollows => ({
  ...(collection || {}),
  items: Array.isArray(collection?.items)
    ? collection.items.map((item: any) => ({
        ...item,
        image: normalizeUserAvatarUrl(item?.image),
      }))
    : [],
  total: Number(collection?.total || 0),
  page: Number(collection?.page || 1),
  has_next: Boolean(collection?.has_next),
  next: collection?.next || null,
});

const normalizeServerUser = (candidate: any): User => {
  const exactPlan = candidate?.plan === "premium" ? "premium" : "free";
  const rawImageProfile = candidate?.image_profile;
  const imageProfile = rawImageProfile
    ? {
        ...rawImageProfile,
        image: normalizeUserAvatarUrl(rawImageProfile.image),
      }
    : null;

  return {
    ...candidate,
    plan: exactPlan,
    is_premium: exactPlan === "premium",
    isPremium: exactPlan === "premium",
    subscription: candidate?.subscription
      ? { ...candidate.subscription, is_active: exactPlan === "premium" }
      : candidate?.subscription,
    image_profile: imageProfile,
    followers: normalizeFollowCollection(candidate?.followers),
    following: normalizeFollowCollection(candidate?.following),
    notification_setting: {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(candidate?.notification_setting || {}),
    },
  } as User;
};

const ACCESS_TOKEN_STORAGE_KEY = "sedaboxAccessToken";
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";
const NATIVE_AUTH_SESSION_STORAGE_KEY = "sedabox.auth.session.v1";
const AUTH_SESSION_UPDATED_AT_STORAGE_KEY = "sedabox.auth.session.updatedAt";
const REFRESH_LOCK_NAME = "sedabox-auth-refresh";

// These queues intentionally live at module scope instead of inside a mounted
// AuthProvider. Navigation warmups and Android lifecycle recreation can create
// overlapping async work around a provider remount; the session/refresh
// critical sections must survive that remount and remain single-owner for the
// whole JavaScript realm.
let authSessionMutationQueue: Promise<void> = Promise.resolve();
let refreshCriticalSectionQueue: Promise<void> = Promise.resolve();

const queueAuthSessionMutation = <T,>(operation: () => Promise<T>): Promise<T> => {
  const run = authSessionMutationQueue.then(operation, operation);
  authSessionMutationQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

const runInRefreshCriticalSection = <T,>(operation: () => Promise<T>): Promise<T> => {
  const run = refreshCriticalSectionQueue.then(operation, operation);
  refreshCriticalSectionQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

interface NativeAuthSession {
  accessToken: string;
  refreshToken: string;
  updatedAt: number;
}

const isNativeAuthPlatform = () => isNativeAndroid();

const getAccessTokenGeneration = (token: string | null): number => {
  if (!token || typeof window === "undefined") return 0;
  try {
    const payload = token.split(".")[1];
    if (!payload) return 0;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));
    const issuedAt = Number(decoded?.iat || 0);
    const expiresAt = Number(decoded?.exp || 0);
    // iat is the strongest rotation ordering signal. exp is a safe migration
    // fallback for JWTs that omit iat.
    return issuedAt > 0 ? issuedAt : expiresAt;
  } catch {
    return 0;
  }
};

const readNativeAuthSession = async (): Promise<NativeAuthSession | null> => {
  if (!isNativeAuthPlatform()) return null;
  try {
    const value = await nativePreferences.get(NATIVE_AUTH_SESSION_STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<NativeAuthSession>;
    if (
      typeof parsed.accessToken !== "string" ||
      !parsed.accessToken ||
      typeof parsed.refreshToken !== "string" ||
      !parsed.refreshToken
    ) {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      updatedAt:
        typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
          ? parsed.updatedAt
          : 0,
    };
  } catch (error) {
    clientTrace("AUTH", "native-session:read-failed", error, "warn");
    return null;
  }
};

const persistNativeAuthSession = async (
  accessToken: string,
  refreshToken: string,
  updatedAt = Date.now(),
): Promise<void> => {
  if (!isNativeAuthPlatform()) return;
  try {
    await nativePreferences.set(
      NATIVE_AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({ accessToken, refreshToken, updatedAt }),
    );
  } catch (error) {
    // Never turn a successful server login/refresh into a client-side failure.
    // localStorage remains the live session and the trace exposes persistence issues.
    clientTrace("AUTH", "native-session:write-failed", error, "warn");
  }
};

const removeNativeAuthSession = async (): Promise<void> => {
  if (!isNativeAuthPlatform()) return;
  try {
    await nativePreferences.remove(NATIVE_AUTH_SESSION_STORAGE_KEY);
  } catch (error) {
    clientTrace("AUTH", "native-session:remove-failed", error, "warn");
  }
};

const hydrateNativeAuthSession = async (): Promise<void> => {
  if (!isNativeAuthPlatform() || typeof window === "undefined") return;

  const nativeSession = await readNativeAuthSession();
  const localAccessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  const localRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  const rawLocalUpdatedAt = Number(
    localStorage.getItem(AUTH_SESSION_UPDATED_AT_STORAGE_KEY) || 0,
  );
  const localUpdatedAt = Number.isFinite(rawLocalUpdatedAt)
    ? Math.max(0, rawLocalUpdatedAt)
    : 0;
  const hasCompleteLocalPair = Boolean(localAccessToken && localRefreshToken);

  if (nativeSession && hasCompleteLocalPair) {
    const samePair =
      nativeSession.accessToken === localAccessToken &&
      nativeSession.refreshToken === localRefreshToken;
    if (samePair) {
      const newestTimestamp = Math.max(nativeSession.updatedAt, localUpdatedAt);
      if (newestTimestamp > 0) {
        localStorage.setItem(
          AUTH_SESSION_UPDATED_AT_STORAGE_KEY,
          String(newestTimestamp),
        );
      }
      return;
    }

    const nativeGeneration = getAccessTokenGeneration(nativeSession.accessToken);
    const localGeneration = getAccessTokenGeneration(localAccessToken);
    const localIsNewer =
      localUpdatedAt > nativeSession.updatedAt ||
      (localUpdatedAt === nativeSession.updatedAt &&
        localGeneration > 0 &&
        localGeneration >= nativeGeneration);

    if (localIsNewer) {
      // A prior native write can fail while localStorage still successfully
      // publishes the newer rotated pair. Never roll that newer pair backward
      // on the next WebView creation; repair the durable mirror instead.
      const repairedAt = localUpdatedAt || Date.now();
      await persistNativeAuthSession(
        localAccessToken!,
        localRefreshToken!,
        repairedAt,
      );
      localStorage.setItem(AUTH_SESSION_UPDATED_AT_STORAGE_KEY, String(repairedAt));
      clientTrace("AUTH", "native-session:repaired-from-newer-local", {
        nativeUpdatedAt: nativeSession.updatedAt,
        localUpdatedAt,
        nativeGeneration,
        localGeneration,
      }, "warn");
      return;
    }
  }

  if (nativeSession) {
    // Preferences is the durable recovery copy on native. Restore the pair
    // together before the normal auth initializer evaluates either token.
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, nativeSession.refreshToken);
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, nativeSession.accessToken);
    if (nativeSession.updatedAt > 0) {
      localStorage.setItem(
        AUTH_SESSION_UPDATED_AT_STORAGE_KEY,
        String(nativeSession.updatedAt),
      );
    }
    return;
  }

  // One-time migration for users upgrading from builds that stored auth only
  // in WebView localStorage. Preserve their current login if both tokens exist.
  if (localAccessToken && localRefreshToken) {
    const migratedAt = localUpdatedAt || Date.now();
    localStorage.setItem(AUTH_SESSION_UPDATED_AT_STORAGE_KEY, String(migratedAt));
    await persistNativeAuthSession(localAccessToken, localRefreshToken, migratedAt);
  }
};

const getStoredRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};

const setStoredRefreshToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

const isAccessTokenUsable = (token: string | null, skewSeconds = 30) => {
  if (!token) return false;
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));
    const expiresAt = Number(decoded?.exp || 0);
    return expiresAt > Math.floor(Date.now() / 1000) + skewSeconds;
  } catch {
    return false;
  }
};

const readStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (isAccessTokenUsable(token)) return token;
  if (token) localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  return null;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { language } = useI18n();
  const API_ROOT = "https://api.sedabox.com/api";

  const initialStoredAccessToken = readStoredAccessToken();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    // Synchronous hint for the first client-side render to prevent layout shifts.
    // A valid access token avoids an unnecessary refresh on every page reload.
    return !!initialStoredAccessToken || !!getStoredRefreshToken();
  });
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const isInitializingRef = useRef<boolean>(true);

  const updateIsInitializing = (val: boolean) => {
    clientTrace("AUTH", "initializing:set", {
      previous: isInitializingRef.current,
      next: val,
      hasStoredAccessToken: Boolean(readStoredAccessToken()),
      hasRefreshToken: Boolean(getStoredRefreshToken()),
    });
    setIsInitializing(val);
    isInitializingRef.current = val;
  };

  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [accessToken, setAccessToken] = useState<string | null>(
    initialStoredAccessToken,
  );
  const accessTokenRef = useRef<string | null>(initialStoredAccessToken);
  const authRevisionRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const profileRequestRef = useRef<{
    key: string;
    promise: Promise<User | null>;
  } | null>(null);
  const notificationSettingsQueueRef = useRef<Promise<void>>(Promise.resolve());
  const languageRef = useRef(language);
  languageRef.current = language;
  const authenticatedFetchRef = useRef<AuthContextType["authenticatedFetch"]>(
    async () => {
      throw new Error("Authenticated fetch is not ready");
    },
  );
  const tryRefreshTokenRef = useRef<(
    refreshTokenArg?: string,
    staleAccessToken?: string | null,
  ) => Promise<string | null>>(async () => null);

  const syncAccessTokenState = (val: string | null) => {
    if (accessTokenRef.current !== val) {
      authRevisionRef.current += 1;
    }
    setAccessToken(val);
    accessTokenRef.current = val;
  };

  const updateAccessToken = (val: string | null) => {
    syncAccessTokenState(val);
    if (typeof window !== "undefined") {
      if (val) localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, val);
      else localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  };

  const commitAuthSession = async (
    nextAccessToken: string,
    nextRefreshToken: string,
    expectedRefreshToken?: string,
  ): Promise<boolean> =>
    queueAuthSessionMutation(async () => {
      if (
        expectedRefreshToken &&
        getStoredRefreshToken() !== expectedRefreshToken
      ) {
        // This refresh response belongs to an older token generation. Never
        // let a late successful response overwrite a newer rotated session.
        return false;
      }

      // Persist the pair as one durable native record before publishing either
      // rotated token to WebView storage. A force-close can therefore recover
      // either the complete old pair or the complete new pair, never half of each.
      const committedAt = Date.now();
      await persistNativeAuthSession(
        nextAccessToken,
        nextRefreshToken,
        committedAt,
      );

      if (
        expectedRefreshToken &&
        getStoredRefreshToken() !== expectedRefreshToken
      ) {
        // A different browsing context may have changed the session while the
        // native bridge was committing. Restore its current pair to the native
        // mirror rather than publishing this stale refresh result locally.
        const currentAccessToken =
          typeof window !== "undefined"
            ? localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
            : null;
        const currentRefreshToken = getStoredRefreshToken();
        if (currentAccessToken && currentRefreshToken) {
          const currentUpdatedAt = Number(
            localStorage.getItem(AUTH_SESSION_UPDATED_AT_STORAGE_KEY) || 0,
          );
          await persistNativeAuthSession(
            currentAccessToken,
            currentRefreshToken,
            Number.isFinite(currentUpdatedAt) && currentUpdatedAt > 0
              ? currentUpdatedAt
              : Date.now(),
          );
        }
        return false;
      }

      localStorage.setItem(
        AUTH_SESSION_UPDATED_AT_STORAGE_KEY,
        String(committedAt),
      );
      setStoredRefreshToken(nextRefreshToken);
      updateAccessToken(nextAccessToken);
      return true;
    });

  const clearLocalAuth = async (expectedRefreshToken?: string): Promise<boolean> =>
    queueAuthSessionMutation(async () => {
      if (
        expectedRefreshToken &&
        getStoredRefreshToken() !== expectedRefreshToken
      ) {
        // Another refresh/login already replaced the token. This failure is stale.
        return false;
      }
      await removeNativeAuthSession();
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_SESSION_UPDATED_AT_STORAGE_KEY);
      }
      setStoredRefreshToken(null);
      updateAccessToken(null);
      setIsLoggedIn(false);
      setUser(null);
      setNeedsInitialCheck(false);
      return true;
    });
  const [verificationContext, setVerificationContext] = useState<string | null>(
    null,
  );
  const [needsInitialCheck, setNeedsInitialCheck] = useState<boolean>(false);

  const formatErrorMessage = useCallback(
    (errorArg: any): string => formatAuthError(errorArg, languageRef.current),
    [],
  );


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

  const fetchUserProfile = useCallback(async (providedToken?: string) => {
    const requestToken =
      providedToken || accessTokenRef.current || readStoredAccessToken();
    if (!requestToken) return;

    // React Strict Mode can execute the startup effect twice in development.
    // Multiple callers may also request the profile while a refresh is
    // completing. Share one request for the same access token so those paths
    // cannot race or perform duplicate profile reads.
    const requestKey = requestToken;
    const existingRequest = profileRequestRef.current;
    if (existingRequest?.key === requestKey) {
      await existingRequest.promise;
      return;
    }

    const revisionAtStart = authRevisionRef.current;
    const request = (async (): Promise<User | null> => {
      try {
        const url = `${API_ROOT}/profile/?_=${Date.now()}`;
        const requestInit: RequestInit = {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(providedToken
              ? { Authorization: `Bearer ${providedToken}` }
              : {}),
          },
        };

        // Do not send Cache-Control or Pragma request headers here. They are
        // not CORS-safelisted and caused the browser preflight to fail. The
        // cache-busting query parameter plus the API's no-store response header
        // already guarantee a fresh server-owned profile snapshot.
        const res = providedToken
          ? await fetch(url, requestInit)
          : await authenticatedFetchRef.current(url, requestInit);
        const body = await res.json().catch(() => null);
        if (!res.ok || !body) return null;

        // Never let an older profile response overwrite a session that was
        // refreshed, replaced, or explicitly logged out while this request was
        // in flight.
        if (
          authRevisionRef.current !== revisionAtStart ||
          accessTokenRef.current !== requestToken
        ) {
          return null;
        }

        const nextUser = normalizeServerUser(body);
        setUser(nextUser);
        return nextUser;
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        return null;
      }
    })();

    profileRequestRef.current = { key: requestKey, promise: request };
    try {
      await request;
    } finally {
      if (profileRequestRef.current?.promise === request) {
        profileRequestRef.current = null;
      }
    }
  }, []);

  const applyUserSnapshot = useCallback((nextUser: User) => {
    setUser(normalizeServerUser(nextUser));
  }, []);

  const updateProfile = async (updateData: Partial<User>) => {
    const r = await patch("/profile/", updateData);
    if (!r.ok) throw r.body || new Error("Failed to update profile");

    if (r.body) {
      setUser(normalizeServerUser(r.body));
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

    const nextImage: UserProfileImage = {
      ...data,
      image: normalizeUserAvatarUrl(data?.image),
    };

    // Commit the successful upload immediately so the edit sheet and every
    // avatar surface update even if the follow-up profile reconciliation is
    // delayed or temporarily offline. The server version query prevents stale
    // browser/CDN cache reuse after replacing a file with the same name.
    setUser((current) =>
      current ? { ...current, image_profile: nextImage } : current,
    );
    await fetchUserProfile();
    return nextImage;
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
          plan: r.body.plan === "premium" ? "premium" : r.body.plan === "free" ? "free" : prev.plan,
        };
        return updated;
      });
    }
  };

  const updateNotificationSettings = async (
    changes: Partial<UserNotificationSetting>,
  ): Promise<UserNotificationSetting> => {
    const allowedKeys: Array<keyof UserNotificationSetting> = [
      "new_song_followed_artists",
      "new_album_followed_artists",
      "new_playlist",
      "new_likes",
      "new_follower",
      "system_notifications",
    ];
    const payload = Object.fromEntries(
      Object.entries(changes).filter(
        ([key, value]) =>
          allowedKeys.includes(key as keyof UserNotificationSetting) &&
          typeof value === "boolean",
      ),
    ) as Partial<UserNotificationSetting>;

    if (Object.keys(payload).length === 0) {
      throw new Error("No valid notification preference was provided");
    }

    // Serialize preference writes in this tab. Every request remains a partial
    // PATCH, so rapid clicks or calls from multiple components cannot apply an
    // older full settings snapshot after a newer update.
    const operation = notificationSettingsQueueRef.current.then(async () => {
      const r = await patch("/profile/settings/notifications/", payload);
      if (!r.ok || !r.body) {
        throw r.body || new Error("Failed to update notification settings");
      }

      const nextSettings: UserNotificationSetting = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...r.body,
      };
      setUser((prev) =>
        prev ? { ...prev, notification_setting: nextSettings } : prev,
      );
      return nextSettings;
    });

    notificationSettingsQueueRef.current = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
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
    const r = await post("/profile/initial-check/", { genre_ids: genreIds });
    if (!r.ok) {
      const error =
        r.body instanceof Error
          ? r.body
          : new Error("Failed to save initial preferences");
      console.error("Failed to mark initial check completed", r.body);
      throw error;
    }

    setNeedsInitialCheck(false);
  };

  const performRefresh = async (
    requestedRefreshToken?: string,
    staleAccessToken?: string | null,
  ): Promise<string | null> => {
    const token = requestedRefreshToken || getStoredRefreshToken();
    if (!token) return null;

    const revisionAtStart = authRevisionRef.current;
    const accessAtStart = accessTokenRef.current;

    try {
      const response = await fetch(`${API_ROOT}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: token }),
      });

      const text = await response.text();
      let body: any = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = null;
      }

      if (!response.ok) {
        const refreshFailureCode = String(
          body?.error?.code || body?.code || "",
        ).toUpperCase();
        if (response.status === 401) {
          if (refreshFailureCode === "TOKEN_REVOKED" || refreshFailureCode === "TOKEN_INVALID") {
            if (getStoredRefreshToken() === token) {
              await clearLocalAuth(token);
            }
            return null;
          }
          // Give a concurrent context/session mutation a short chance to
          // publish its newer token pair before deciding this refresh is bad.
          await new Promise((resolve) => setTimeout(resolve, 100));

          const latestRefreshToken = getStoredRefreshToken();
          const latestAccessToken = readStoredAccessToken();
          const aNewerAuthStateExists =
            authRevisionRef.current !== revisionAtStart ||
            (latestAccessToken && latestAccessToken !== accessAtStart) ||
            latestRefreshToken !== token;

          if (
            latestAccessToken &&
            isAccessTokenUsable(latestAccessToken) &&
            (aNewerAuthStateExists || staleAccessToken === latestAccessToken)
          ) {
            // A failed proactive/duplicate rotation must never throw away an
            // access token that is still locally valid. The protected request
            // path will decide separately if the server has actually revoked it.
            syncAccessTokenState(latestAccessToken);
            setIsLoggedIn(true);
            clientTrace("AUTH", "refresh:401-preserved-valid-access", {
              newerState: aNewerAuthStateExists,
              refreshChanged: latestRefreshToken !== token,
            }, "warn");
            return latestAccessToken;
          }

          if (latestRefreshToken && latestRefreshToken !== token) {
            // The session changed while this refresh was in flight. Never reuse
            // or rotate the newly-published refresh token from this stale task.
            clientTrace("AUTH", "refresh:401-stale-generation", undefined, "warn");
            return latestAccessToken || accessTokenRef.current;
          }

          // Only startup/expired-token recovery is allowed to clear here. If a
          // still-usable access token exists, a refresh-endpoint 401 can be a
          // rotation race and is not sufficient evidence to log the user out.
          if (
            !latestAccessToken &&
            getStoredRefreshToken() === token &&
            authRevisionRef.current === revisionAtStart
          ) {
            await clearLocalAuth(token);
          }
        }
        // Network/server failures and stale 401s never destroy a valid session.
        return null;
      }

      const newAccessToken = body?.accessToken;
      const newRefreshToken = body?.refreshToken;
      if (!newAccessToken || !newRefreshToken) return null;

      // A refresh result may arrive after another refresh/login has already
      // committed. Only the response belonging to the refresh token that is
      // still current is allowed to publish a new pair.
      const committed = await commitAuthSession(
        newAccessToken,
        newRefreshToken,
        token,
      );
      if (!committed) {
        const latestAccessToken = readStoredAccessToken() || accessTokenRef.current;
        if (latestAccessToken && isAccessTokenUsable(latestAccessToken)) {
          syncAccessTokenState(latestAccessToken);
          setIsLoggedIn(true);
        }
        clientTrace("AUTH", "refresh:success-discarded-stale-generation", undefined, "warn");
        return latestAccessToken;
      }

      if (body.user) {
        setUser(normalizeServerUser(body.user));
      } else {
        await fetchUserProfile(newAccessToken);
      }
      setIsLoggedIn(true);
      void checkInitialStatus(newAccessToken);
      return newAccessToken;
    } catch (err: any) {
      if (
        err &&
        (err.name === "AbortError" || String(err).includes("aborted"))
      ) {
        return accessTokenRef.current;
      }
      // Offline, DNS and 5xx failures must not log the user out.
      return null;
    }
  };

  const tryRefreshToken = async (
    refreshTokenArg?: string,
    staleAccessToken?: string | null,
  ): Promise<string | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const refreshTask = (async () => {
      const run = async () => {
        const storedAccessToken = readStoredAccessToken();
        if (
          storedAccessToken &&
          storedAccessToken !== staleAccessToken &&
          isAccessTokenUsable(storedAccessToken)
        ) {
          syncAccessTokenState(storedAccessToken);
          setIsLoggedIn(true);
          return storedAccessToken;
        }
        return performRefresh(
          refreshTokenArg || getStoredRefreshToken() || undefined,
          staleAccessToken,
        );
      };

      const runInRealmLock = () => runInRefreshCriticalSection(run);

      if (typeof navigator !== "undefined") {
        const lockManager = (navigator as Navigator & {
          locks?: {
            request: <T>(
              name: string,
              callback: () => Promise<T>,
            ) => Promise<T>;
          };
        }).locks;
        if (lockManager?.request) {
          // Web Lock coordinates tabs/workers; the module-scope queue covers
          // Android/provider remounts and environments without Web Locks.
          return lockManager.request(REFRESH_LOCK_NAME, runInRealmLock);
        }
      }
      return runInRealmLock();
    })();

    refreshPromiseRef.current = refreshTask;
    try {
      return await refreshTask;
    } finally {
      if (refreshPromiseRef.current === refreshTask) {
        refreshPromiseRef.current = null;
      }
    }
  };

  tryRefreshTokenRef.current = tryRefreshToken;

  const getFreshAccessToken = useCallback(
    async (forceRefresh = false): Promise<string | null> => {
      const currentToken = accessTokenRef.current;
      if (!forceRefresh && isAccessTokenUsable(currentToken, 60)) {
        return currentToken;
      }

      const refreshedToken = await tryRefreshTokenRef.current(
        undefined,
        currentToken,
      );
      return refreshedToken || accessTokenRef.current;
    },
    [],
  );

  const authenticatedFetch = useCallback(async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    let currentToken = accessTokenRef.current;

    // If the auth layer is still initializing (refresh in progress), wait
    // briefly for it to complete. However, if we already have an accessToken
    // (e.g. set during tryRefreshToken), we can proceed immediately.
    if (isInitializingRef.current && !currentToken) {
      clientTrace("AUTH", "authenticated-fetch:waiting-for-init", {
        input: typeof input === "string" ? input : String(input),
      }, "warn");
      const waitStartedAt = performance.now();
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!isInitializingRef.current || accessTokenRef.current) {
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
      currentToken = accessTokenRef.current;
      clientTrace("AUTH", "authenticated-fetch:init-wait-ended", {
        elapsedMs: Math.round(performance.now() - waitStartedAt),
        hasAccessToken: Boolean(currentToken),
        stillInitializing: isInitializingRef.current,
      });
    }

    // Refresh currentToken once more just in case it was set during the wait
    if (!currentToken) {
      currentToken = accessTokenRef.current;
    }

    const method = (init?.method || "GET").toUpperCase();
    const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
    const hasStoredRefresh =
      typeof window !== "undefined" && !!localStorage.getItem("refreshToken");

    // Guests are allowed to reach public read endpoints. Mutations are blocked
    // locally and open the global login/register prompt instead of sending a
    // request that can never succeed.
    if (!currentToken && !hasStoredRefresh && !isSafeMethod) {
      openAuthPrompt({
        title: "برای انجام این کار وارد شوید",
        description:
          "برای لایک، دنبال‌کردن، ذخیره، دانلود یا تغییر اطلاعات حساب، ابتدا وارد شوید.",
      });
      return new Response(
        JSON.stringify({ error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." } }),
        {
          status: 401,
          statusText: "Unauthorized",
          headers: { "Content-Type": "application/json" },
        },
      );
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

      if (response.status === 401 && (currentToken || hasStoredRefresh)) {
        // A different request may already have refreshed while this request
        // was in flight. Retry that newer access token before rotating again.
        const latestAccessToken = accessTokenRef.current;
        if (
          latestAccessToken &&
          latestAccessToken !== currentToken &&
          isAccessTokenUsable(latestAccessToken)
        ) {
          response = await fetch(input, applyAuth(latestAccessToken));
        }

        if (response.status === 401) {
          const newToken = await tryRefreshTokenRef.current(
            undefined,
            currentToken,
          );
          if (newToken) {
            response = await fetch(input, applyAuth(newToken));
          }
        }
      }

      if (response.status === 401) {
        let authFailureCode = "";
        try {
          const authFailureBody = await response.clone().json();
          authFailureCode = String(
            authFailureBody?.error?.code || authFailureBody?.code || "",
          ).toUpperCase();
        } catch {
          // A body is optional; status and local auth state remain authoritative.
        }

        const stillAuthenticated = Boolean(
          accessTokenRef.current || getStoredRefreshToken(),
        );
        const sessionNeedsLogin = new Set([
          "AUTHENTICATION_REQUIRED",
          "TOKEN_INVALID",
          "TOKEN_REVOKED",
          "CURRENT_SESSION_INVALID",
        ]).has(authFailureCode);

        if (!stillAuthenticated || sessionNeedsLogin) {
          openAuthPrompt({
            title: sessionNeedsLogin ? "دوباره وارد شوید" : "برای ادامه وارد شوید",
            description: sessionNeedsLogin
              ? "نشست ورود شما معتبر نیست. برای ادامه دوباره وارد حساب شوید."
              : "برای دسترسی به این بخش یا انجام این کار، ابتدا وارد حساب شوید.",
          });
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

        const defaultMsg = response.status >= 500
          ? languageRef.current === "fa"
            ? "در ارتباط با سرور خطایی رخ داد. لطفاً بعداً دوباره تلاش کنید."
            : "The server could not complete the request. Please try again later."
          : languageRef.current === "fa"
            ? "درخواست انجام نشد. لطفاً دوباره تلاش کنید."
            : "The request could not be completed. Please try again.";

        const message = parsedBody
          ? formatErrorMessage(parsedBody)
          : defaultMsg;

        // A playback quality switch can intentionally return 409 when the
        // requested quality is unavailable for the current song. The player
        // handles this case itself (keeps the current stream and shows the
        // user-facing quality-unavailable message). Do not create a generic
        // API failure toast for this single handled playback scenario.
        const isHandledPlaybackQualityUnavailable =
          response.status === 409 &&
          String(input).includes("/playback-quality/") &&
          String(parsedBody?.error?.code || "").toUpperCase() ===
            "PLAYBACK_QUALITY_UNAVAILABLE";

        // Avoid showing toasts for 401 (unauthorized) responses — these are
        // handled elsewhere (refresh/logout logic) and often occur during
        // initialization or navigation races. Show toasts for other statuses.
        if (response.status !== 401 && !isHandledPlaybackQualityUnavailable) {
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

      const netMsg = languageRef.current === "fa"
        ? "ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید."
        : "Could not connect to the server. Check your internet connection and try again.";
      try {
        toast.error(netMsg);
      } catch (e) {
        console.error("Toast error", e);
      }
      throw err;
    }
  }, []);

  authenticatedFetchRef.current = authenticatedFetch;

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
    const initStartedAt = performance.now();

    const init = async () => {
      if (!mounted) return;

      // Android can recreate the WebView with localStorage missing even though
      // the native app data survived. Hydrate the durable token pair first.
      await hydrateNativeAuthSession();

      const storedAccessToken = readStoredAccessToken();
      const hasRefreshToken = Boolean(getStoredRefreshToken());
      clientTrace("AUTH", "init:start", {
        hasStoredAccessToken: Boolean(storedAccessToken),
        hasRefreshToken,
      });

      // Premium state is server-owned. Remove legacy optimistic hints from older builds.
      localStorage.removeItem("sedabox_user_plan");
      try {
        delete (window as any).sedabox_user_plan;
      } catch (error) {
        clientTrace("AUTH", "legacy-plan-cleanup:failed", error, "warn");
      }

      try {
        await withClientTimeout(
          "Auth initialization",
          (async () => {
            if (storedAccessToken) {
              clientTrace("AUTH", "init:reuse-access-token");
              // Normal reloads reuse the unexpired access token. This avoids token
              // rotation during splash-screen hydration and repeated refreshes.
              syncAccessTokenState(storedAccessToken);
              setIsLoggedIn(true);

              clientTrace("AUTH", "profile:request:start");
              await fetchUserProfile();
              clientTrace("AUTH", "profile:request:settled", {
                hasAccessToken: Boolean(accessTokenRef.current),
              });

              if (accessTokenRef.current) {
                clientTrace("AUTH", "initial-check:start");
                await checkInitialStatus(accessTokenRef.current);
                clientTrace("AUTH", "initial-check:settled");
              }
            } else {
              clientTrace("AUTH", "refresh:start", { hasRefreshToken });
              const refreshedToken = await tryRefreshToken();
              clientTrace("AUTH", "refresh:settled", {
                refreshed: Boolean(refreshedToken),
                hasAccessToken: Boolean(accessTokenRef.current),
              });
            }
          })(),
          12_000,
        );
      } catch (error) {
        // This used to leave isInitializing=true forever. Always fail open so
        // the public Home route can render and the client logs reveal the
        // failed auth stage instead of showing an endless skeleton.
        clientTrace("AUTH", "init:failed", error, "error");
        console.error("Auth initialization failed; releasing app gate", error);
      } finally {
        if (mounted) {
          updateIsInitializing(false);
          clientTrace("AUTH", "init:gate-released", {
            elapsedMs: Math.round(performance.now() - initStartedAt),
            isLoggedIn: Boolean(accessTokenRef.current || getStoredRefreshToken()),
            hasAccessToken: Boolean(accessTokenRef.current),
          });
        } else {
          clientTrace("AUTH", "init:settled-after-unmount", undefined, "warn");
        }
      }
    };

    void init().catch((error) => {
      // Defensive last line: the inner try/finally should already handle every
      // failure, but never allow a rejected startup promise to disappear.
      clientTrace("AUTH", "init:unhandled", error, "error");
      if (mounted) updateIsInitializing(false);
    });

    return () => {
      mounted = false;
      clientTrace("AUTH", "provider:unmounted", undefined, "warn");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ACCESS_TOKEN_STORAGE_KEY) {
        const nextToken =
          event.newValue && isAccessTokenUsable(event.newValue)
            ? event.newValue
            : null;
        syncAccessTokenState(nextToken);
        if (nextToken) setIsLoggedIn(true);
        else if (!getStoredRefreshToken()) {
          setIsLoggedIn(false);
          setUser(null);
          setNeedsInitialCheck(false);
        }
      }

      if (event.key === REFRESH_TOKEN_STORAGE_KEY && !event.newValue) {
        syncAccessTokenState(null);
        setIsLoggedIn(false);
        setUser(null);
        setNeedsInitialCheck(false);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = async (phoneArg: string, passwordArg?: string) => {
    const phoneNormalized = formatPhoneForApi(phoneArg);
    const r = await post("/auth/login/password/", {
      phone: phoneNormalized,
      password: passwordArg,
    });
    if (!r.ok) throw r.body || new Error("Login failed");
    const data = r.body;
    await commitAuthSession(data.accessToken, data.refreshToken);

    if (
      data.user &&
      (data.user.followers_count !== undefined || data.user.plan)
    ) {
      setUser(normalizeServerUser(data.user));
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
    await commitAuthSession(data.accessToken, data.refreshToken);

    if (
      data.user &&
      (data.user.followers_count !== undefined || data.user.plan)
    ) {
      setUser(normalizeServerUser(data.user));
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
    await commitAuthSession(data.accessToken, data.refreshToken);

    if (
      data.user &&
      (data.user.followers_count !== undefined || data.user.plan)
    ) {
      setUser(normalizeServerUser(data.user));
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
    const refresh = getStoredRefreshToken();
    try {
      if (refresh) {
        await post("/auth/logout/", { refreshToken: refresh });
      }
    } finally {
      await clearLocalAuth();
    }
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
        applyUserSnapshot,
        updateProfile,
        updateProfileImage,
        deleteProfileImage,
        updateStreamQuality,
        updateNotificationSettings,
        authenticatedFetch,
        getFreshAccessToken,
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
