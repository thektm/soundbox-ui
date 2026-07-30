export type ClientLanguage = "fa" | "en";

export type LocalizedCopy = {
  fa: string;
  en: string;
};

export type ClientFailureKind =
  | "offline"
  | "timeout"
  | "network"
  | "interrupted"
  | "server"
  | "request"
  | "unknown";

const LANGUAGE_STORAGE_KEY = "sedabox.language";
const FETCH_GUARD_VERSION = 2;

const COPY: Record<ClientFailureKind, LocalizedCopy> = {
  offline: {
    fa: "اتصال اینترنت قطع است. اینترنت خود را بررسی کنید و دوباره تلاش کنید.",
    en: "You're offline. Check your internet connection and try again.",
  },
  timeout: {
    fa: "پاسخ سرور بیش از حد طول کشید. لطفاً دوباره تلاش کنید.",
    en: "The server took too long to respond. Please try again.",
  },
  network: {
    fa: "ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.",
    en: "Could not connect to the server. Check your internet connection and try again.",
  },
  interrupted: {
    fa: "درخواست کامل نشد. لطفاً دوباره تلاش کنید.",
    en: "The request was interrupted. Please try again.",
  },
  server: {
    fa: "سرور نتوانست درخواست را انجام دهد. لطفاً کمی بعد دوباره تلاش کنید.",
    en: "The server could not complete the request. Please try again shortly.",
  },
  request: {
    fa: "درخواست انجام نشد. لطفاً دوباره تلاش کنید.",
    en: "The request could not be completed. Please try again.",
  },
  unknown: {
    fa: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
    en: "Something went wrong. Please try again.",
  },
};

const NETWORK_PATTERNS = [
  /\bfailed to fetch\b/i,
  /\bfetch failed\b/i,
  /\bnetwork request failed\b/i,
  /\bnetworkerror\b/i,
  /\bnetwork error\b/i,
  /\bload failed\b/i,
  /\bthe internet connection appears to be offline\b/i,
  /\bthe network connection was lost\b/i,
  /\bconnection (?:was )?(?:refused|reset|closed|lost)\b/i,
  /\bunable to (?:fetch|connect)\b/i,
  /\bcould not (?:fetch|connect)\b/i,
  /\bfailed to execute ['\"]fetch['\"]/i,
  /\berr_(?:network|internet_disconnected|connection_refused|connection_reset)\b/i,
  /\b(?:econnrefused|econnreset|enotfound|eai_again|enetunreach|ehostunreach)\b/i,
  /\bcors\b.*\b(?:failed|blocked|error)\b/i,
];

const TIMEOUT_PATTERNS = [
  /\btimeout(?:error)?\b/i,
  /\btimed out\b/i,
  /\btime[- ]?out\b/i,
  /\bdeadline exceeded\b/i,
  /\btook too long\b/i,
  /\boperation was aborted due to timeout\b/i,
  /\betimedout\b/i,
];

const INTERRUPTED_PATTERNS = [
  /\babort(?:ed|error)?\b/i,
  /\brequest (?:was )?cancel(?:led|ed)\b/i,
  /\boperation (?:was )?cancel(?:led|ed)\b/i,
];

const TECHNICAL_REQUEST_PATTERNS = [
  /^typeerror\s*:/i,
  /^error\s*:/i,
  /^http\s*\d{3}\b/i,
  /\b(?:request|search|fetch|load) failed with (?:http )?status\s*\d{3}\b/i,
  /\bstatus(?:code)?\s*[:=]?\s*\d{3}\b/i,
  /\bundefined is not\b/i,
  /\bcannot read propert/i,
  /\bchunkloaderror\b/i,
  /\bscript error\b/i,
];

function compactText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function getSignal(input?: RequestInfo | URL, init?: RequestInit): AbortSignal | null {
  if (init?.signal) return init.signal;
  if (typeof Request !== "undefined" && input instanceof Request) {
    return input.signal;
  }
  return null;
}

function readStatus(input: any): number | null {
  const candidates = [
    input?.status,
    input?.response?.status,
    input?.body?.status,
    input?.error?.status,
    input?.meta?.status,
  ];
  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed >= 100 && parsed <= 599) {
      return parsed;
    }
  }
  const text = readErrorText(input);
  const match = text.match(/(?:http\s*|status(?:code)?\s*[:=]?\s*)(\d{3})/i);
  return match ? Number(match[1]) : null;
}

export function readErrorText(input: any): string {
  if (input == null) return "";
  if (typeof input === "string") return compactText(input);
  if (input instanceof Error) return compactText(input.message);

  const candidates = [
    input?.message,
    input?.detail,
    input?.error?.message,
    input?.error?.detail,
    input?.body?.error?.message,
    input?.body?.error?.detail,
    input?.body?.message,
    input?.body?.detail,
    input?.response?.data?.error?.message,
    input?.response?.data?.message,
    input?.response?.data?.detail,
  ];
  for (const candidate of candidates) {
    const text = compactText(candidate);
    if (text) return text;
  }
  return "";
}

export function getRuntimeClientLanguage(): ClientLanguage {
  if (typeof document !== "undefined") {
    const documentLanguage = String(document.documentElement.lang || "")
      .toLowerCase()
      .trim();
    if (documentLanguage.startsWith("en")) return "en";
    if (documentLanguage.startsWith("fa")) return "fa";
  }
  if (typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en"
        ? "en"
        : "fa";
    } catch {
      return "fa";
    }
  }
  return "fa";
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return Boolean(text) && patterns.some((pattern) => pattern.test(text));
}

export function classifyClientFailure(input: any): ClientFailureKind {
  const text = readErrorText(input);
  const name = compactText(input?.name || input?.constructor?.name);
  const code = compactText(input?.code || input?.error?.code).toUpperCase();
  const status = readStatus(input);

  if (
    name === "TimeoutError" ||
    code === "TIMEOUT" ||
    code === "ETIMEDOUT" ||
    matchesAny(text, TIMEOUT_PATTERNS)
  ) {
    return "timeout";
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine === false &&
    (matchesAny(text, NETWORK_PATTERNS) || name === "TypeError" || !text)
  ) {
    return "offline";
  }

  if (
    code === "CLIENT_NETWORK_ERROR" ||
    code === "ERR_NETWORK" ||
    matchesAny(text, NETWORK_PATTERNS)
  ) {
    return "network";
  }

  if (
    name === "AbortError" ||
    code === "ABORT_ERR" ||
    matchesAny(text, INTERRUPTED_PATTERNS)
  ) {
    return "interrupted";
  }

  if (status !== null) {
    return status >= 500 ? "server" : "request";
  }

  if (matchesAny(text, TECHNICAL_REQUEST_PATTERNS)) return "request";
  return "unknown";
}

export function isTechnicalClientErrorText(value: unknown): boolean {
  const text = compactText(value);
  if (!text) return false;
  return (
    matchesAny(text, NETWORK_PATTERNS) ||
    matchesAny(text, TIMEOUT_PATTERNS) ||
    matchesAny(text, INTERRUPTED_PATTERNS) ||
    matchesAny(text, TECHNICAL_REQUEST_PATTERNS)
  );
}

function languageMatches(text: string, language: ClientLanguage): boolean {
  const hasPersian = /[\u0600-\u06ff]/.test(text);
  const hasLatin = /[a-z]/i.test(text);
  if (!hasPersian && !hasLatin) return true;
  if (language === "fa") return hasPersian;
  return hasLatin && !hasPersian;
}

function resolveFallback(
  language: ClientLanguage,
  fallback?: string | LocalizedCopy,
): string {
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  if (fallback && typeof fallback === "object") {
    const localized = compactText(fallback[language]);
    if (localized) return localized;
  }
  return COPY.unknown[language];
}

export function getLocalizedFailureCopy(
  kind: ClientFailureKind,
  language: ClientLanguage,
): string {
  return (COPY[kind] || COPY.unknown)[language];
}

export function sanitizeUserFacingErrorText(
  value: unknown,
  language: ClientLanguage = getRuntimeClientLanguage(),
  fallback?: string | LocalizedCopy,
): string {
  const text = compactText(value);
  const resolvedFallback = resolveFallback(language, fallback);
  if (!text) return resolvedFallback;

  const kind = classifyClientFailure({ message: text });
  if (kind !== "unknown") return getLocalizedFailureCopy(kind, language);

  // Browser/runtime messages in the wrong language are not suitable UI copy.
  if (!languageMatches(text, language)) return resolvedFallback;
  return text;
}

export function getUserFacingErrorMessage(
  input: any,
  language: ClientLanguage = getRuntimeClientLanguage(),
  fallback?: string | LocalizedCopy,
): string {
  const resolvedFallback = resolveFallback(language, fallback);
  const text = readErrorText(input);
  const kind = classifyClientFailure(input);

  if (kind !== "unknown") {
    return getLocalizedFailureCopy(kind, language);
  }
  if (!text || !languageMatches(text, language)) return resolvedFallback;
  return text;
}

export function createLocalizedFetchError(
  cause: unknown,
  language: ClientLanguage = getRuntimeClientLanguage(),
): Error & { code: string; kind: ClientFailureKind; originalMessage?: string } {
  const kind = classifyClientFailure(cause) === "timeout"
    ? "timeout"
    : typeof navigator !== "undefined" && navigator.onLine === false
      ? "offline"
      : "network";
  const error = new Error(getLocalizedFailureCopy(kind, language), {
    cause,
  }) as Error & {
    code: string;
    kind: ClientFailureKind;
    originalMessage?: string;
  };
  error.name = "SedaBoxNetworkError";
  error.code = "CLIENT_NETWORK_ERROR";
  error.kind = kind;
  error.originalMessage = readErrorText(cause) || undefined;
  return error;
}

function shouldGuardAppRequest(input: RequestInfo | URL): boolean {
  try {
    const rawUrl = input instanceof Request ? input.url : input.toString();
    const base = typeof window !== "undefined" ? window.location.href : "https://sedabox.com";
    const url = new URL(rawUrl, base);
    const configuredApiRoot = String(process.env.NEXT_PUBLIC_API_ROOT || "").trim();
    const configuredOrigin = configuredApiRoot
      ? new URL(configuredApiRoot, base).origin
      : "";

    return (
      url.origin === "https://api.sedabox.com" ||
      Boolean(configuredOrigin && url.origin === configuredOrigin) ||
      (typeof window !== "undefined" &&
        url.origin === window.location.origin &&
        url.pathname.startsWith("/api/"))
    );
  } catch {
    return false;
  }
}

type FetchGuardWindow = Window & {
  __sedaboxLanguageFetchPatched?: boolean;
  __sedaboxFetchGuard?: {
    version: number;
    originalFetch: typeof window.fetch;
    patchedFetch: typeof window.fetch;
  };
};

/**
 * Installs one app-wide fetch boundary before React renders. It attaches the
 * current language to first-party API calls and replaces browser-specific
 * network rejection strings with stable localized errors. Response bodies and
 * HTTP statuses are untouched, so domain validation remains owned by the API.
 */
export function installClientFetchGuard(): () => void {
  if (typeof window === "undefined" || typeof window.fetch !== "function") {
    return () => undefined;
  }

  const target = window as FetchGuardWindow;
  const existing = target.__sedaboxFetchGuard;
  if (existing?.version === FETCH_GUARD_VERSION) return () => undefined;

  const originalFetch = existing?.originalFetch || window.fetch.bind(window);

  const patchedFetch: typeof window.fetch = async (input, init = {}) => {
    if (!shouldGuardAppRequest(input)) return originalFetch(input, init);

    const headers = new Headers(
      init.headers || (input instanceof Request ? input.headers : undefined),
    );
    if (!headers.has("Accept-Language")) {
      headers.set(
        "Accept-Language",
        getRuntimeClientLanguage() === "en" ? "en-US" : "fa-IR",
      );
    }

    try {
      return await originalFetch(input, { ...init, headers });
    } catch (error: any) {
      const signal = getSignal(input, init);
      const reason = signal?.reason;
      const isTimeout =
        error?.name === "TimeoutError" ||
        reason?.name === "TimeoutError" ||
        matchesAny(readErrorText(error), TIMEOUT_PATTERNS);

      // Navigation/unmount cancellation is expected and must remain silent.
      if (error?.name === "AbortError" && !isTimeout) throw error;

      throw createLocalizedFetchError(
        isTimeout ? { name: "TimeoutError", message: readErrorText(error), cause: error } : error,
        getRuntimeClientLanguage(),
      );
    }
  };

  window.fetch = patchedFetch;
  target.__sedaboxLanguageFetchPatched = true;
  target.__sedaboxFetchGuard = {
    version: FETCH_GUARD_VERSION,
    originalFetch,
    patchedFetch,
  };

  // The guard is an application singleton. Provider remounts (including React
  // StrictMode) must not temporarily restore the raw browser fetch function.
  return () => undefined;
}
