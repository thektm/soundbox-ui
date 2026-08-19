"use client";

import { Capacitor } from "@capacitor/core";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { useI18n } from "./I18nContext";
import { useSplashVisibility } from "./SplashVisibilityContext";

const NOTIFICATION_ROLE = "audience" as const;

export interface ApiNotification {
  id: number;
  recipient_role: typeof NOTIFICATION_ROLE;
  text: string;
  text_en?: string;
  has_read: boolean;
  created_at: string;
  removing?: boolean;
}

type RealtimeStatus = "disabled" | "connecting" | "connected" | "reconnecting";

interface NotificationContextValue {
  notifications: ApiNotification[];
  hasUnread: boolean;
  unreadCount: number;
  isLoading: boolean;
  markingReadIds: Set<number>;
  isMarkingAll: boolean;
  realtimeStatus: RealtimeStatus;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  formatTimeAgo: (dateStr: string) => string;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_ROOT || "https://api.sedabox.com/api"
).replace(/\/$/, "");
const NOTIFICATIONS_URL = `${API_ROOT}/notifications/`;
const roleScopedUrl = (url: string): string => {
  const parsed = new URL(url, typeof window === "undefined" ? API_ROOT : window.location.href);
  parsed.searchParams.set("role", NOTIFICATION_ROLE);
  return parsed.toString();
};
const SOCKET_PUBLIC_PROTOCOL = "sedabox.notifications";
const CONNECTED_RECONCILE_MS = 5 * 60_000;
const DISCONNECTED_RECONCILE_MS = 60_000;
const FOCUS_RECONCILE_AGE_MS = 45_000;
const HEARTBEAT_INTERVAL_MS = 25_000;
const SOCKET_STALE_MS = 75_000;

function buildNotificationsSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL?.trim();
  if (configured) {
    const url = new URL(configured, window.location.href);
    if (url.protocol === "https:") url.protocol = "wss:";
    if (url.protocol === "http:") url.protocol = "ws:";
    url.searchParams.set("role", NOTIFICATION_ROLE);
    return url.toString();
  }

  try {
    const api = new URL(API_ROOT);
    api.protocol = api.protocol === "https:" ? "wss:" : "ws:";
    api.pathname = "/ws/notifications/";
    api.search = "";
    api.searchParams.set("role", NOTIFICATION_ROLE);
    api.hash = "";
    return api.toString();
  } catch {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/notifications/?role=${NOTIFICATION_ROLE}`;
  }
}

function normalizeNotification(candidate: unknown): ApiNotification | null {
  const value = candidate as Record<string, unknown> | null;
  const id = Number(value?.id);
  if (
    !Number.isFinite(id) ||
    value?.recipient_role !== NOTIFICATION_ROLE ||
    typeof value?.text !== "string" ||
    typeof value?.has_read !== "boolean" ||
    typeof value?.created_at !== "string"
  ) {
    return null;
  }

  return {
    id,
    recipient_role: NOTIFICATION_ROLE,
    text: value.text,
    text_en: typeof value.text_en === "string" ? value.text_en : value.text,
    has_read: value.has_read === true,
    created_at: value.created_at,
  };
}

function normalizeNotificationList(body: unknown): ApiNotification[] | null {
  const record = body as { results?: unknown } | null;
  const rows = Array.isArray(body)
    ? body
    : Array.isArray(record?.results)
      ? record.results
      : null;
  if (!rows) return null;

  const byId = new Map<number, ApiNotification>();
  for (const row of rows) {
    const notification = normalizeNotification(row);
    if (notification && !notification.has_read) {
      byId.set(notification.id, notification);
    }
  }

  return [...byId.values()].sort((a, b) => {
    const dateDelta = Date.parse(b.created_at) - Date.parse(a.created_at);
    return dateDelta || b.id - a.id;
  });
}

function upsertNotification(
  current: ApiNotification[],
  incoming: ApiNotification,
): ApiNotification[] {
  const withoutIncoming = current.filter((item) => item.id !== incoming.id);
  return [incoming, ...withoutIncoming].sort((a, b) => {
    const dateDelta = Date.parse(b.created_at) - Date.parse(a.created_at);
    return dateDelta || b.id - a.id;
  });
}

function notificationEventKey(notification: ApiNotification): string {
  return `${notification.id}:${notification.created_at}`;
}

function claimCrossTabToast(eventKey: string): boolean {
  if (typeof window === "undefined" || document.visibilityState !== "visible") {
    return false;
  }

  // Every browser tab has its own WebSocket. Coordinate the visible toast so a
  // user with multiple open tabs normally sees one toast, while every tab still
  // receives and applies the unread state immediately.
  try {
    const storageKey = `sedabox.notifications.${NOTIFICATION_ROLE}.last-toast`;
    const now = Date.now();
    const previous = JSON.parse(window.localStorage.getItem(storageKey) || "null") as
      | { key?: string; at?: number }
      | null;
    if (
      previous?.key === eventKey &&
      Number.isFinite(Number(previous.at)) &&
      now - Number(previous.at) < 15_000
    ) {
      return false;
    }
    window.localStorage.setItem(storageKey, JSON.stringify({ key: eventKey, at: now }));
  } catch {
    // Privacy modes can deny localStorage. Per-tab deduplication below still works.
  }
  return true;
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    accessToken,
    authenticatedFetch,
    getFreshAccessToken,
    isInitializing,
    isLoggedIn,
    user,
  } = useAuth();
  const { language } = useI18n();
  const { splashVisible } = useSplashVisibility();
  const deferNativeStartup = Capacitor.isNativePlatform() && splashVisible;

  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadHint, setUnreadHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [markingReadIds, setMarkingReadIds] = useState<Set<number>>(new Set());
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("disabled");

  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;
  const authenticatedFetchRef = useRef(authenticatedFetch);
  authenticatedFetchRef.current = authenticatedFetch;
  const getFreshAccessTokenRef = useRef(getFreshAccessToken);
  getFreshAccessTokenRef.current = getFreshAccessToken;
  const languageRef = useRef(language);
  languageRef.current = language;
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;

  const requestRef = useRef<{
    token: string;
    version: number;
    promise: Promise<void>;
  } | null>(null);
  const fetchVersionRef = useRef(0);
  const mutationDepthRef = useRef(0);
  const refreshQueuedRef = useRef(false);
  const markingReadIdsRef = useRef<Set<number>>(new Set());
  const markingAllRef = useRef(false);
  const lastHttpSyncRef = useRef(0);
  const sessionIdentityRef = useRef<string | null>(null);
  const hasHttpBaselineRef = useRef(false);
  const maxSeenNotificationIdRef = useRef(0);
  const maxSeenCreatedAtRef = useRef(0);
  const seenEventKeysRef = useRef<Set<string>>(new Set());
  const toastedEventKeysRef = useRef<Set<string>>(new Set());

  const rememberNotification = useCallback((notification: ApiNotification) => {
    seenEventKeysRef.current.add(notificationEventKey(notification));
    maxSeenNotificationIdRef.current = Math.max(
      maxSeenNotificationIdRef.current,
      notification.id,
    );
    const createdAt = Date.parse(notification.created_at);
    if (Number.isFinite(createdAt)) {
      maxSeenCreatedAtRef.current = Math.max(
        maxSeenCreatedAtRef.current,
        createdAt,
      );
    }

    // Bound long-running sessions without losing the high-water marks used for
    // missed-event recovery.
    if (seenEventKeysRef.current.size > 1000) {
      seenEventKeysRef.current = new Set(
        Array.from(seenEventKeysRef.current).slice(-500),
      );
    }
  }, []);

  const showNewNotificationToast = useCallback(
    (notification: ApiNotification) => {
      const eventKey = notificationEventKey(notification);
      if (toastedEventKeysRef.current.has(eventKey)) return;
      toastedEventKeysRef.current.add(eventKey);
      if (toastedEventKeysRef.current.size > 250) {
        toastedEventKeysRef.current = new Set(
          Array.from(toastedEventKeysRef.current).slice(-125),
        );
      }
      if (!claimCrossTabToast(eventKey)) return;

      toast(
        languageRef.current === "fa"
          ? notification.text
          : (notification.text_en || notification.text),
        {
          id: `notification:${eventKey}`,
          icon: "🔔",
          duration: 5000,
          style: {
            direction: languageRef.current === "fa" ? "rtl" : "ltr",
            textAlign: languageRef.current === "fa" ? "right" : "left",
          },
        },
      );
    },
    [],
  );

  const refreshNotifications = useCallback((): Promise<void> => {
    const requestToken = accessTokenRef.current;
    if (!requestToken || !isLoggedIn) {
      fetchVersionRef.current += 1;
      refreshQueuedRef.current = false;
      notificationsRef.current = [];
      setNotifications([]);
      setUnreadHint(false);
      setIsLoading(false);
      return Promise.resolve();
    }

    if (mutationDepthRef.current > 0) {
      refreshQueuedRef.current = true;
      return Promise.resolve();
    }

    const requestVersion = fetchVersionRef.current;
    const existing = requestRef.current;
    if (
      existing?.token === requestToken &&
      existing.version === requestVersion
    ) {
      return existing.promise;
    }

    setIsLoading(true);
    const request = (async () => {
      try {
        const response = await authenticatedFetchRef.current(roleScopedUrl(NOTIFICATIONS_URL), {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Notification fetch failed with ${response.status}`);
        }

        const body = await response.json();
        const rows = normalizeNotificationList(body);
        if (!rows) {
          throw new Error("Notification API returned an invalid payload");
        }
        const isCurrent =
          requestVersion === fetchVersionRef.current &&
          mutationDepthRef.current === 0 &&
          accessTokenRef.current === requestToken;

        if (isCurrent) {
          refreshQueuedRef.current = false;
          const hadBaseline = hasHttpBaselineRef.current;
          const previousMaxId = maxSeenNotificationIdRef.current;
          const previousMaxCreatedAt = maxSeenCreatedAtRef.current;
          const recoveredNotifications = hadBaseline
            ? rows.filter((notification) => {
                const eventKey = notificationEventKey(notification);
                if (seenEventKeysRef.current.has(eventKey)) return false;
                const createdAt = Date.parse(notification.created_at);
                return (
                  notification.id > previousMaxId ||
                  (Number.isFinite(createdAt) && createdAt > previousMaxCreatedAt)
                );
              })
            : [];

          notificationsRef.current = rows;
          setNotifications(rows);
          setUnreadHint(rows.length > 0);
          for (const notification of rows) rememberNotification(notification);
          hasHttpBaselineRef.current = true;
          lastHttpSyncRef.current = Date.now();

          // HTTP is the recovery path for socket downtime. Do not toast existing
          // unread rows on the initial login baseline; do toast genuinely newer
          // rows discovered by later reconciliation.
          for (const notification of recoveredNotifications) {
            showNewNotificationToast(notification);
          }
        } else {
          refreshQueuedRef.current = true;
        }
      } catch {
      }
    })().finally(() => {
      if (requestRef.current?.promise === request) {
        requestRef.current = null;
      }
      if (accessTokenRef.current === requestToken) {
        setIsLoading(false);
      }

      if (
        refreshQueuedRef.current &&
        mutationDepthRef.current === 0 &&
        accessTokenRef.current === requestToken
      ) {
        refreshQueuedRef.current = false;
        queueMicrotask(() => void refreshNotifications());
      }
    });

    requestRef.current = {
      token: requestToken,
      version: requestVersion,
      promise: request,
    };
    return request;
  }, [
    isLoggedIn,
    rememberNotification,
    showNewNotificationToast,
  ]);

  const finishMutation = useCallback(() => {
    mutationDepthRef.current = Math.max(0, mutationDepthRef.current - 1);
    if (mutationDepthRef.current === 0) {
      // Always reconcile after a mutation. A notification committed concurrently
      // with mark-all must not be accidentally cleared by optimistic UI state.
      refreshQueuedRef.current = false;
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAsRead = useCallback(
    async (id: number) => {
      if (
        !Number.isFinite(id) ||
        markingAllRef.current ||
        markingReadIdsRef.current.has(id)
      ) {
        return;
      }

      markingReadIdsRef.current.add(id);
      mutationDepthRef.current += 1;
      fetchVersionRef.current += 1;
      setMarkingReadIds((current) => new Set(current).add(id));

      try {
        const response = await authenticatedFetchRef.current(
          roleScopedUrl(`${NOTIFICATIONS_URL}${id}/read/`),
          { method: "POST" },
        );
        if (!response.ok) {
          throw new Error(`Mark notification read failed with ${response.status}`);
        }
        const remaining = notificationsRef.current.filter((item) => item.id !== id);
        notificationsRef.current = remaining;
        setNotifications(remaining);
        setUnreadHint(remaining.length > 0);
      } catch {
      } finally {
        markingReadIdsRef.current.delete(id);
        setMarkingReadIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
        finishMutation();
      }
    },
    [finishMutation],
  );

  const markAllAsRead = useCallback(async () => {
    if (
      markingAllRef.current ||
      mutationDepthRef.current > 0 ||
      (!unreadHint && notificationsRef.current.length === 0)
    ) {
      return;
    }

    markingAllRef.current = true;
    mutationDepthRef.current += 1;
    fetchVersionRef.current += 1;
    setIsMarkingAll(true);
    const requestedThroughId = notificationsRef.current.reduce(
      (maximum, item) => Math.max(maximum, item.id),
      0,
    );

    try {
      const response = await authenticatedFetchRef.current(roleScopedUrl(`${NOTIFICATIONS_URL}read/`), {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Mark all notifications read failed with ${response.status}`);
      }
      let readThroughId = requestedThroughId;
      try {
        const body = await response.json();
        const serverWatermark = Number(body?.read_through_id);
        if (Number.isFinite(serverWatermark) && serverWatermark > 0) {
          readThroughId = serverWatermark;
        }
      } catch {
        // Older compatible servers may return an empty/non-JSON success body.
      }
      const remaining = notificationsRef.current.filter(
        (item) => item.id > readThroughId,
      );
      notificationsRef.current = remaining;
      setNotifications(remaining);
      setUnreadHint(remaining.length > 0);
    } catch {
    } finally {
      markingAllRef.current = false;
      setIsMarkingAll(false);
      finishMutation();
    }
  }, [finishMutation, unreadHint]);

  useEffect(() => {
    // Invalidate responses tied to an old token. Toast/history state is reset only
    // when the actual signed-in user changes, not on a silent access-token refresh.
    fetchVersionRef.current += 1;
    refreshQueuedRef.current = false;

    const nextIdentity =
      !isInitializing && isLoggedIn && accessToken
        ? `user:${user?.id ?? accessToken}`
        : null;
    const sessionChanged = sessionIdentityRef.current !== nextIdentity;
    sessionIdentityRef.current = nextIdentity;

    if (sessionChanged) {
      hasHttpBaselineRef.current = false;
      maxSeenNotificationIdRef.current = 0;
      maxSeenCreatedAtRef.current = 0;
      seenEventKeysRef.current.clear();
      toastedEventKeysRef.current.clear();
      lastHttpSyncRef.current = 0;
    }

    if (!nextIdentity) {
      notificationsRef.current = [];
      setNotifications([]);
      setUnreadHint(false);
      setIsLoading(false);
      return;
    }

    if (deferNativeStartup) {
      setIsLoading(false);
      return;
    }

    void refreshNotifications();
  }, [
    accessToken,
    deferNativeStartup,
    isInitializing,
    isLoggedIn,
    refreshNotifications,
    user?.id,
  ]);

  useEffect(() => {
    if (isInitializing || !isLoggedIn || !accessToken || deferNativeStartup) {
      setRealtimeStatus("disabled");
      return;
    }

    let disposed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let connectTimeout: number | null = null;
    let reconnectAttempt = 0;
    let lastMessageAt = Date.now();
    let lastFailureReconcileAt = 0;
    let preparingConnection = false;
    let authRecoveryBeforeNextConnect: Promise<void> | null = null;
    let tokenUsedForHandshake: string | null = null;
    let socketWasAccepted = false;

    const clearSocketTimers = () => {
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      if (connectTimeout !== null) window.clearTimeout(connectTimeout);
      heartbeatTimer = null;
      connectTimeout = null;
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== null || !navigator.onLine) return;
      reconnectAttempt += 1;
      const base = Math.min(30_000, 1_000 * 2 ** Math.min(reconnectAttempt - 1, 5));
      const delay = Math.round(base * (0.8 + Math.random() * 0.4));
      setRealtimeStatus("reconnecting");
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, delay);
    };

    const handleMessage = (event: MessageEvent<string>) => {
      if (disposed) return;
      lastMessageAt = Date.now();
      let message: any;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (
        message?.type !== "pong" &&
        message?.recipient_role !== NOTIFICATION_ROLE
      ) {
        return;
      }

      switch (message?.type) {
        case "notifications.connected": {
          const unreadCount = Number(message.unread_count) || 0;
          setUnreadHint(unreadCount > 0);
          // HTTP is authoritative and recovers every event missed while offline.
          void refreshNotifications();
          break;
        }
        case "notification.created": {
          const incoming = normalizeNotification(message.notification);
          if (!incoming || incoming.has_read) return;

          fetchVersionRef.current += 1;
          if (requestRef.current) refreshQueuedRef.current = true;
          const nextNotifications = upsertNotification(
            notificationsRef.current,
            incoming,
          );
          notificationsRef.current = nextNotifications;
          setNotifications(nextNotifications);
          setUnreadHint(true);

          rememberNotification(incoming);
          showNewNotificationToast(incoming);
          break;
        }
        case "notification.read": {
          const notificationId = Number(message.notification_id);
          if (!Number.isFinite(notificationId)) return;
          fetchVersionRef.current += 1;
          const remaining = notificationsRef.current.filter(
            (item) => item.id !== notificationId,
          );
          notificationsRef.current = remaining;
          setNotifications(remaining);
          setUnreadHint(
            message.has_unread === true || remaining.length > 0,
          );
          // The exact remaining unread state is reconciled without trusting
          // cross-tab timing or message ordering.
          void refreshNotifications();
          break;
        }
        case "notifications.read_all": {
          fetchVersionRef.current += 1;
          const readThroughId = Number(message.read_through_id);
          const remaining = Number.isFinite(readThroughId) && readThroughId > 0
            ? notificationsRef.current.filter((item) => item.id > readThroughId)
            : [];
          notificationsRef.current = remaining;
          setNotifications(remaining);
          setUnreadHint(message.has_unread === true || remaining.length > 0);
          void refreshNotifications();
          break;
        }
        case "pong":
          break;
        default:
      }
    };

    const connect = async () => {
      if (disposed || preparingConnection) return;
      if (!navigator.onLine) {
        setRealtimeStatus("reconnecting");
        return;
      }
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      preparingConnection = true;
      setRealtimeStatus(reconnectAttempt ? "reconnecting" : "connecting");

      try {
        // A failed WebSocket handshake is not reliable proof that the JWT is
        // invalid (1006 is only an abnormal close). If the previous handshake
        // asked for HTTP reconciliation, let authenticatedFetch validate/recover
        // the session first; it refreshes only on an actual HTTP 401.
        const pendingRecovery = authRecoveryBeforeNextConnect;
        if (pendingRecovery) await pendingRecovery;

        const currentToken = await getFreshAccessTokenRef.current(false);
        if (disposed || !currentToken) {
          if (!disposed) setRealtimeStatus("disabled");
          return;
        }

        accessTokenRef.current = currentToken;
        tokenUsedForHandshake = currentToken;
        socketWasAccepted = false;

        socket = new WebSocket(buildNotificationsSocketUrl(), [
          SOCKET_PUBLIC_PROTOCOL,
          `jwt.${currentToken}`,
        ]);
      } catch {
        scheduleReconnect();
        return;
      } finally {
        preparingConnection = false;
      }

      connectTimeout = window.setTimeout(() => {
        if (socket?.readyState === WebSocket.CONNECTING) {
          socket.close(4000, "connect timeout");
        }
      }, 12_000);

      socket.onopen = () => {
        socketWasAccepted = true;
        if (disposed) {
          socket?.close(1000, "provider disposed");
          return;
        }
        reconnectAttempt = 0;
        lastMessageAt = Date.now();
        setRealtimeStatus("connected");
        clearSocketTimers();

        heartbeatTimer = window.setInterval(() => {
          if (!socket || socket.readyState !== WebSocket.OPEN) return;
          if (Date.now() - lastMessageAt > SOCKET_STALE_MS) {
            socket.close(4001, "heartbeat timeout");
            return;
          }
          socket.send(JSON.stringify({ type: "ping", ts: Date.now() }));
        }, HEARTBEAT_INTERVAL_MS);
      };
      socket.onmessage = handleMessage;
      socket.onerror = (error) => {
      };
      socket.onclose = (event) => {
        clearSocketTimers();
        const rejectedBeforeAccept = !socketWasAccepted && event.code !== 1000;
        socket = null;

        if (
          rejectedBeforeAccept &&
          tokenUsedForHandshake &&
          tokenUsedForHandshake === accessTokenRef.current &&
          !authRecoveryBeforeNextConnect
        ) {
          // 1006/other pre-open failures can be network, proxy, TLS, WebView
          // scheduling, or auth. Do not rotate a refresh token speculatively.
          // Reconcile over HTTP first; authenticatedFetch owns real 401 recovery.
          const recovery = refreshNotifications().finally(() => {
            if (authRecoveryBeforeNextConnect === recovery) {
              authRecoveryBeforeNextConnect = null;
            }
          });
          authRecoveryBeforeNextConnect = recovery;
        }
        tokenUsedForHandshake = null;
        socketWasAccepted = false;

        if (!disposed) {
          const now = Date.now();
          if (
            event.code !== 1000 &&
            event.code !== 4002 &&
            now - lastFailureReconcileAt >= 30_000
          ) {
            lastFailureReconcileAt = now;
            void refreshNotifications();
          }
          scheduleReconnect();
        }
      };
    };

    const handleOnline = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      void connect();
      void refreshNotifications();
    };
    const handleOffline = () => {
      socket?.close(4002, "browser offline");
      setRealtimeStatus("reconnecting");
    };
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState !== "visible") return;
      if (!socket || socket.readyState !== WebSocket.OPEN) void connect();
      if (Date.now() - lastHttpSyncRef.current > FOCUS_RECONCILE_AGE_MS) {
        void refreshNotifications();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    void connect();

    return () => {
      disposed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      clearSocketTimers();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close(1000, "provider cleanup");
        socket = null;
      }
    };
  }, [
    accessToken,
    deferNativeStartup,
    isInitializing,
    isLoggedIn,
    refreshNotifications,
    rememberNotification,
    showNewNotificationToast,
  ]);

  useEffect(() => {
    if (isInitializing || !isLoggedIn || !accessToken || deferNativeStartup) return;
    const intervalMs =
      realtimeStatus === "connected"
        ? CONNECTED_RECONCILE_MS
        : DISCONNECTED_RECONCILE_MS;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshNotifications();
      }
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [
    accessToken,
    deferNativeStartup,
    isInitializing,
    isLoggedIn,
    realtimeStatus,
    refreshNotifications,
  ]);

  const formatTimeAgo = useCallback(
    (dateStr: string): string => {
      const timestamp = Date.parse(dateStr);
      if (!Number.isFinite(timestamp)) return "";
      const seconds = Math.round((timestamp - Date.now()) / 1000);
      const formatter = new Intl.RelativeTimeFormat(
        language === "fa" ? "fa-IR" : "en-US",
        { numeric: "auto" },
      );
      if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
      const minutes = Math.round(seconds / 60);
      if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
      const hours = Math.round(minutes / 60);
      if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
      return formatter.format(Math.round(hours / 24), "day");
    },
    [language],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      hasUnread: unreadHint || notifications.some((item) => !item.has_read),
      unreadCount: notifications.filter((item) => !item.has_read).length,
      isLoading,
      markingReadIds,
      isMarkingAll,
      realtimeStatus,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      formatTimeAgo,
    }),
    [
      formatTimeAgo,
      isLoading,
      isMarkingAll,
      markAllAsRead,
      markAsRead,
      markingReadIds,
      notifications,
      realtimeStatus,
      refreshNotifications,
      unreadHint,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
