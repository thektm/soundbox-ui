type IpInfo = {
  country: string;
  province: string;
  city: string;
};

type ClientIpResponse = {
  ip?: string | null;
  source?: string | null;
};

type IpnumberiaAttemptDiagnostic = {
  transport: "https" | "http";
  status?: number;
  contentType?: string;
  finalUrl?: string;
  responseBytes?: number;
  classification?: "location" | "challenge" | "placeholder" | "invalid";
  reason: string;
  hasLocationTable?: boolean;
  hasSearchForm?: boolean;
  hasChallengeMarker?: boolean;
  returnedIp?: string | null;
  parsedLocation?: IpInfo | null;
};

type ProxyDiagnostics = {
  ip?: {
    selected?: string | null;
    source?: string | null;
    headerIp?: string | null;
    browserIp?: string | null;
    headerIsPublic?: boolean;
    browserIsPublic?: boolean;
  };
  ipnumberia?: IpnumberiaAttemptDiagnostic[];
  fallback?: {
    provider?: string;
    attempted?: boolean;
    status?: number;
    reason?: string;
  };
};

type LocationProxyResponse = {
  ok?: boolean;
  provider?: "ipnumberia" | "ipapi";
  transport?: "https" | "http";
  location?: IpInfo;
  diagnostics?: ProxyDiagnostics;
  error?: { code?: string };
};

let cachedIpInfo: IpInfo | null = null;
let lookupPromise: Promise<IpInfo | null> | null = null;

const DEFAULT_API_ROOT = "https://api.sedabox.com/api";

function getApiRoot(): string {
  const configured = String(process.env.NEXT_PUBLIC_API_ROOT || DEFAULT_API_ROOT).trim();
  return configured.replace(/\/+$/, "");
}

function locationLog(
  event: string,
  details?: Record<string, unknown>,
  level: "info" | "warn" | "error" = "info",
): void {
  if (typeof window === "undefined") return;
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  method(`[SEDABOX:LOCATION] ${event}`, details || "");
}

function normalizeText(value: string | null | undefined): string {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function looksLikeUsableIp(value: string | null | undefined): boolean {
  const ip = normalizeText(value);
  if (!ip) return false;
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return false;
  }
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return false;
  return /^[0-9a-f:.]+$/i.test(ip);
}

async function lookupFirstPartyClientIp(): Promise<string | null> {
  const url = `${getApiRoot()}/client-ip/`;
  locationLog("client-ip:start", { url });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });

    if (!response.ok) {
      locationLog("client-ip:http-failed", { status: response.status }, "warn");
      return null;
    }

    const payload = (await response.json()) as ClientIpResponse;
    const ip = normalizeText(payload.ip);
    const source = normalizeText(payload.source) || "unknown";
    if (!looksLikeUsableIp(ip)) {
      locationLog("client-ip:non-public", { ip: ip || null, source }, "warn");
      return null;
    }

    locationLog("client-ip:success", { ip, source });
    return ip;
  } catch (error) {
    locationLog(
      "client-ip:request-failed",
      { error: error instanceof Error ? error.message : String(error) },
      "warn",
    );
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function lookupLocation(): Promise<IpInfo | null> {
  const browserPublicIp = await lookupFirstPartyClientIp();
  const proxyUrl = browserPublicIp
    ? `/api/ip-proxy?ip=${encodeURIComponent(browserPublicIp)}`
    : "/api/ip-proxy";

  locationLog("proxy:start", {
    proxyUrl,
    browserPublicIp: browserPublicIp || null,
  });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    });

    let payload: LocationProxyResponse | null = null;
    try {
      payload = (await response.json()) as LocationProxyResponse;
    } catch (error) {
      locationLog(
        "proxy:invalid-json",
        {
          status: response.status,
          error: error instanceof Error ? error.message : String(error),
        },
        "error",
      );
      return null;
    }

    const diagnostics = payload?.diagnostics || {};

    if (!response.ok || !payload?.ok || !payload.location) {
      locationLog(
        "proxy:failed",
        {
          status: response.status,
          code: payload?.error?.code || `HTTP_${response.status}`,
          diagnostics,
        },
        "error",
      );
      return null;
    }

    const result: IpInfo = {
      country: normalizeText(payload.location.country),
      province: normalizeText(payload.location.province),
      city: normalizeText(payload.location.city),
    };

    if (!result.country || !result.province || !result.city) {
      locationLog(
        "proxy:empty-location",
        { provider: payload.provider, transport: payload.transport, result, diagnostics },
        "error",
      );
      return null;
    }

    if (payload.provider === "ipnumberia") {
      locationLog("ipnumberia:success", {
        provider: payload.provider,
        transport: payload.transport,
        ...result,
        diagnostics,
      });
    } else {
      locationLog("ipnumberia:failed-fallback:success", {
        provider: payload.provider,
        transport: payload.transport,
        ...result,
        diagnostics,
      }, "warn");
    }

    return result;
  } catch (error) {
    locationLog(
      "proxy:request-failed",
      { error: error instanceof Error ? error.message : String(error) },
      "error",
    );
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function performLookup(): Promise<IpInfo | null> {
  if (typeof window === "undefined") return null;
  locationLog("lookup:start");

  const result = await lookupLocation();
  if (result) {
    cachedIpInfo = result;
    locationLog("lookup:success", result);
    return result;
  }

  locationLog("lookup:failed-all-providers", undefined, "error");
  return null;
}

/**
 * Resolve location once after success. Failed lookups are not cached so a later
 * playback can retry with fresh proxy/provider diagnostics.
 */
export function scrapeIpInfo(): Promise<IpInfo | null> {
  if (cachedIpInfo) {
    locationLog("lookup:cache-hit", cachedIpInfo);
    return Promise.resolve(cachedIpInfo);
  }
  if (lookupPromise) {
    locationLog("lookup:join-inflight");
    return lookupPromise;
  }

  lookupPromise = performLookup().finally(() => {
    lookupPromise = null;
  });
  return lookupPromise;
}
