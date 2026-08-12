export type ClientTraceLevel = "log" | "info" | "warn" | "error";

export type ClientTraceEntry = {
  timestamp: string;
  elapsedMs: number;
  level: ClientTraceLevel;
  scope: string;
  event: string;
  details?: unknown;
};

declare global {
  interface Window {
    __SEDABOX_CLIENT_LOGS__?: ClientTraceEntry[];
    __SEDABOX_DUMP_CLIENT_LOGS__?: () => ClientTraceEntry[];
    __SEDABOX_CLIENT_DIAGNOSTICS_INSTALLED__?: boolean;
    __SEDABOX_CLIENT_STARTED_AT__?: number;
  }
}

const MAX_LOG_ENTRIES = 500;
const CLIENT_DIAGNOSTICS_ENABLED =
  process.env.NEXT_PUBLIC_SEDABOX_DEBUG === "1";

const getElapsedMs = (): number => {
  if (typeof window === "undefined") return 0;
  if (!window.__SEDABOX_CLIENT_STARTED_AT__) {
    window.__SEDABOX_CLIENT_STARTED_AT__ = performance.now();
  }
  return Math.round(performance.now() - window.__SEDABOX_CLIENT_STARTED_AT__);
};

const normalizeError = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: (value as Error & { cause?: unknown }).cause,
    };
  }
  return value;
};

export const clientTrace = (
  scope: string,
  event: string,
  details?: unknown,
  level: ClientTraceLevel = "log",
): void => {
  if (typeof window === "undefined" || !CLIENT_DIAGNOSTICS_ENABLED) return;

  const entry: ClientTraceEntry = {
    timestamp: new Date().toISOString(),
    elapsedMs: getElapsedMs(),
    level,
    scope,
    event,
    details: normalizeError(details),
  };

  const logs = window.__SEDABOX_CLIENT_LOGS__ || [];
  logs.push(entry);
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.splice(0, logs.length - MAX_LOG_ENTRIES);
  }
  window.__SEDABOX_CLIENT_LOGS__ = logs;

  const method = console[level] || console.log;
  method.call(
    console,
    `[SEDABOX:${scope}] +${entry.elapsedMs}ms ${event}`,
    entry.details ?? "",
  );
};

export const installGlobalClientDiagnostics = (): (() => void) => {
  if (typeof window === "undefined" || !CLIENT_DIAGNOSTICS_ENABLED) {
    return () => undefined;
  }

  window.__SEDABOX_DUMP_CLIENT_LOGS__ = () => {
    const logs = [...(window.__SEDABOX_CLIENT_LOGS__ || [])];
    console.table(
      logs.map(({ timestamp, elapsedMs, level, scope, event }) => ({
        timestamp,
        elapsedMs,
        level,
        scope,
        event,
      })),
    );
    return logs;
  };

  if (window.__SEDABOX_CLIENT_DIAGNOSTICS_INSTALLED__) {
    clientTrace("GLOBAL", "diagnostics:already-installed");
    return () => undefined;
  }

  window.__SEDABOX_CLIENT_DIAGNOSTICS_INSTALLED__ = true;
  clientTrace("GLOBAL", "diagnostics:installed", {
    href: window.location.href,
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    visibility: document.visibilityState,
  });

  const onError = (event: ErrorEvent) => {
    clientTrace(
      "GLOBAL",
      "window:error",
      {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: normalizeError(event.error),
      },
      "error",
    );
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    clientTrace(
      "GLOBAL",
      "window:unhandledrejection",
      normalizeError(event.reason),
      "error",
    );
  };

  const onVisibilityChange = () => {
    clientTrace("GLOBAL", "document:visibility", {
      visibility: document.visibilityState,
    });
  };

  const onOnline = () => clientTrace("GLOBAL", "network:online");
  const onOffline = () => clientTrace("GLOBAL", "network:offline", undefined, "warn");

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.__SEDABOX_CLIENT_DIAGNOSTICS_INSTALLED__ = false;
    clientTrace("GLOBAL", "diagnostics:removed");
  };
};

export const withClientTimeout = async <T,>(
  label: string,
  task: Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([task, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};
