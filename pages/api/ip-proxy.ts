import type { NextApiRequest, NextApiResponse } from "next";
import * as http from "http";
import * as https from "https";
import { isIP } from "net";

const IPNUMBERIA_HOST = "ipnumberia.com";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 768 * 1024;
const MAX_REDIRECTS = 3;

const IPAPI_HOST = "ipapi.co";
const IPAPI_TIMEOUT_MS = 7_000;

type LocationInfo = {
  country: string;
  province: string;
  city: string;
};

type UpstreamResult = {
  status: number;
  contentType: string;
  body: string;
  transport: "https" | "http";
  finalUrl: string;
};

type PageClassification = "location" | "challenge" | "placeholder" | "invalid";
type RequestMethod = "GET" | "POST";

type ClientIpSource =
  | "cf-connecting-ip"
  | "true-client-ip"
  | "x-real-ip"
  | "x-forwarded-for"
  | "socket"
  | "browser-query"
  | "none";

type IpResolution = {
  ip: string | null;
  source: ClientIpSource;
  headerIp: string | null;
  browserIp: string | null;
};

type IpnumberiaAttemptDiagnostic = {
  transport: "https" | "http";
  status?: number;
  contentType?: string;
  finalUrl?: string;
  responseBytes?: number;
  classification?: PageClassification;
  reason: string;
  hasLocationTable?: boolean;
  hasSearchForm?: boolean;
  hasChallengeMarker?: boolean;
  returnedIp?: string | null;
  parsedLocation?: LocationInfo | null;
  rawLocation?: Partial<LocationInfo> | null;
  pageTitle?: string | null;
  matchedChallengeMarkers?: string[];
  bodyTextPreview?: string;
};

type ProxyDiagnostics = {
  ip: {
    selected: string | null;
    source: ClientIpSource;
    headerIp: string | null;
    browserIp: string | null;
    headerIsPublic: boolean;
    browserIsPublic: boolean;
  };
  ipnumberia: IpnumberiaAttemptDiagnostic[];
  fallback?: {
    provider: "ipapi";
    attempted: boolean;
    status?: number;
    reason: string;
  };
};

class IpnumberiaError extends Error {
  code: string;
  diagnostics?: ProxyDiagnostics;

  constructor(code: string, diagnostics?: ProxyDiagnostics) {
    super(code);
    this.name = "IpnumberiaError";
    this.code = code;
    this.diagnostics = diagnostics;
  }
}

function firstHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function normalizeIp(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (value.includes(",")) value = value.split(",", 1)[0].trim();
  value = value.replace(/^for=/i, "").replace(/^"|"$/g, "");
  if (value.startsWith("::ffff:")) value = value.slice(7);
  if (value.startsWith("[") && value.includes("]")) {
    value = value.slice(1, value.indexOf("]"));
  }
  return isIP(value) ? value : null;
}

function isPublicIp(ip: string | null): boolean {
  if (!ip) return false;
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return false;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a >= 224) return false;
    return true;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return false;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return false;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return false;
    return true;
  }
  return false;
}

function resolveClientIp(req: NextApiRequest): IpResolution {
  const headerCandidates: Array<[ClientIpSource, string]> = [
    ["cf-connecting-ip", firstHeaderValue(req.headers["cf-connecting-ip"])],
    ["true-client-ip", firstHeaderValue(req.headers["true-client-ip"])],
    ["x-real-ip", firstHeaderValue(req.headers["x-real-ip"])],
    ["x-forwarded-for", firstHeaderValue(req.headers["x-forwarded-for"])],
    ["socket", req.socket?.remoteAddress || ""],
  ];

  let headerIp: string | null = null;
  let headerSource: ClientIpSource = "none";
  for (const [source, raw] of headerCandidates) {
    const parsed = normalizeIp(raw);
    if (!parsed) continue;
    headerIp = parsed;
    headerSource = source;
    if (isPublicIp(parsed)) break;
  }

  const queryValue = Array.isArray(req.query.ip) ? req.query.ip[0] : req.query.ip;
  const browserIp = normalizeIp(typeof queryValue === "string" ? queryValue : "");

  // Prefer a trustworthy public address from the incoming request. This prevents
  // client spoofing in production while still allowing localhost/Docker-internal
  // requests to supply the browser-discovered public IP explicitly.
  if (isPublicIp(headerIp)) {
    return { ip: headerIp, source: headerSource, headerIp, browserIp };
  }
  if (isPublicIp(browserIp)) {
    return { ip: browserIp, source: "browser-query", headerIp, browserIp };
  }
  return { ip: null, source: "none", headerIp, browserIp };
}

function isAllowedIpnumberiaUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    (url.protocol === "https:" || url.protocol === "http:") &&
    (host === IPNUMBERIA_HOST || host.endsWith(`.${IPNUMBERIA_HOST}`))
  );
}

function htmlToText(fragment: string): string {
  return fragment
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLabel(value: string): string {
  return htmlToText(value)
    .replace(/[：:]+$/g, "")
    .replace(/\u200c/g, "")
    .trim();
}

function isPlaceholderValue(value: string): boolean {
  const normalized = htmlToText(value).replace(/\s+/g, "").toLowerCase();
  return (
    !normalized ||
    normalized === "-" ||
    normalized === "--" ||
    normalized === "-(-)" ||
    normalized === "unknown" ||
    normalized === "n/a" ||
    normalized === "null"
  );
}

function extractReturnedIp(body: string): string | null {
  const tableMatch = body.match(
    /<table\b[^>]*id=["']home_ip_info_data["'][^>]*>([\s\S]*?)<\/table>/i,
  );
  const scope = tableMatch?.[1] || body;
  for (const match of Array.from(scope.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi))) {
    const row = match[1] || "";
    const headerMatch = row.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i);
    const valueMatch = row.match(/<td\b[^>]*>([\s\S]*?)<\/td>/i);
    if (!headerMatch || !valueMatch) continue;
    const label = normalizeLabel(headerMatch[1]);
    if (label === "ای پی" || label.toLowerCase() === "ip") {
      return normalizeIp(htmlToText(valueMatch[1]));
    }
  }
  return null;
}

function extractIpnumberiaRawLocation(body: string): Partial<LocationInfo> | null {
  const tableMatch = body.match(
    /<table\b[^>]*id=["']home_ip_info_data["'][^>]*>([\s\S]*?)<\/table>/i,
  );
  const scope = tableMatch?.[1] || body;
  const rows = Array.from(scope.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi));

  let country = "";
  let province = "";
  let city = "";

  for (const match of rows) {
    const row = match[1] || "";
    const headerMatch = row.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i);
    const valueMatch = row.match(/<td\b[^>]*>([\s\S]*?)<\/td>/i);
    if (!headerMatch || !valueMatch) continue;

    const label = normalizeLabel(headerMatch[1]);
    const value = htmlToText(valueMatch[1]);
    if (!label || !value) continue;

    if (!country && label.includes("کشور")) country = value;
    if (!province && label.includes("استان")) province = value;
    if (!city && label.includes("شهر")) city = value;
  }

  if (!country && !province && !city) return null;
  return { country, province, city };
}

function extractIpnumberiaLocation(body: string): LocationInfo | null {
  const raw = extractIpnumberiaRawLocation(body);
  const country = raw?.country || "";
  const province = raw?.province || "";
  const city = raw?.city || "";

  if (
    isPlaceholderValue(country) ||
    isPlaceholderValue(province) ||
    isPlaceholderValue(city)
  ) {
    return null;
  }

  return { country, province, city };
}

const CHALLENGE_MARKERS = [
  "cf-chl-",
  "challenge-platform",
  "checking your browser",
  "just a moment",
  "verify you are human",
  "are you human",
  "captcha",
  "recaptcha",
  "hcaptcha",
  "access denied",
  "ddos-guard",
  "bot verification",
  "robot verification",
  "checking if the site connection is secure",
];

function classifyIpnumberiaHtml(result: UpstreamResult): PageClassification {
  const body = result.body || "";
  const lower = body.toLowerCase();
  if (CHALLENGE_MARKERS.some((marker) => lower.includes(marker))) return "challenge";

  const location = extractIpnumberiaLocation(body);
  if (location) return "location";

  const hasLocationTable = /id=["']home_ip_info_data["']/i.test(body);
  if (hasLocationTable) return "placeholder";
  return "invalid";
}

function requestHtml(
  target: URL,
  clientIp: string,
  method: RequestMethod,
  body: string | null,
  redirectCount = 0,
): Promise<UpstreamResult> {
  return new Promise((resolve, reject) => {
    if (!isAllowedIpnumberiaUrl(target)) {
      reject(new Error("IPNUMBERIA_REDIRECT_BLOCKED"));
      return;
    }

    const transport = target.protocol === "https:" ? https : http;
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "identity",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Connection: "close",
      Referer: `${target.protocol}//${target.host}/`,
      Origin: `${target.protocol}//${target.host}`,
      "X-Forwarded-For": clientIp,
      "X-Real-IP": clientIp,
      "CF-Connecting-IP": clientIp,
      "True-Client-IP": clientIp,
      "Client-IP": clientIp,
      Forwarded: `for=${clientIp}`,
    };

    if (method === "POST" && body !== null) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = String(Buffer.byteLength(body));
    }

    const request = transport.request(
      target,
      {
        method,
        headers,
        ...(target.protocol === "https:" ? { rejectUnauthorized: false } : {}),
      },
      (response) => {
        const status = response.statusCode || 502;
        const location = response.headers.location;

        if (
          location &&
          [301, 302, 303, 307, 308].includes(status) &&
          redirectCount < MAX_REDIRECTS
        ) {
          response.resume();
          const nextUrl = new URL(location, target);
          const isSameHostHttpsUpgrade =
            method === "POST" &&
            target.protocol === "http:" &&
            nextUrl.protocol === "https:" &&
            target.hostname.toLowerCase() === nextUrl.hostname.toLowerCase();
          const preservePost =
            method === "POST" &&
            (status === 307 || status === 308 || isSameHostHttpsUpgrade);
          const nextMethod: RequestMethod = preservePost ? method : "GET";
          const nextBody = preservePost ? body : null;
          requestHtml(nextUrl, clientIp, nextMethod, nextBody, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        let totalBytes = 0;
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          totalBytes += buffer.length;
          if (totalBytes > MAX_RESPONSE_BYTES) {
            request.destroy(new Error("IPNUMBERIA_RESPONSE_TOO_LARGE"));
            return;
          }
          chunks.push(buffer);
        });
        response.on("end", () => {
          resolve({
            status,
            contentType: String(response.headers["content-type"] || "text/html"),
            body: Buffer.concat(chunks).toString("utf8"),
            transport: target.protocol === "https:" ? "https" : "http",
            finalUrl: target.toString(),
          });
        });
      },
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("IPNUMBERIA_TIMEOUT"));
    });
    request.on("error", reject);
    if (method === "POST" && body) request.write(body);
    request.end();
  });
}

async function tryIpnumberia(
  url: string,
  clientIp: string,
): Promise<{ location: LocationInfo | null; diagnostic: IpnumberiaAttemptDiagnostic }> {
  const transport: "https" | "http" = url.startsWith("https:") ? "https" : "http";
  try {
    const formBody = new URLSearchParams({
      search_value: clientIp,
      submit: "",
    }).toString();

    const result = await requestHtml(new URL(url), clientIp, "POST", formBody);
    const classification = classifyIpnumberiaHtml(result);
    const rawLocation = extractIpnumberiaRawLocation(result.body);
    const parsedLocation = extractIpnumberiaLocation(result.body);
    const returnedIp = extractReturnedIp(result.body);
    const lower = result.body.toLowerCase();
    const matchedChallengeMarkers = CHALLENGE_MARKERS.filter((marker) => lower.includes(marker));
    const titleMatch = result.body.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    const pageTitle = titleMatch ? htmlToText(titleMatch[1]) : null;
    const bodyTextPreview = htmlToText(result.body).slice(0, 320);

    let reason = "OK";
    if (result.status < 200 || result.status >= 400) reason = `HTTP_${result.status}`;
    else if (!result.body.trim()) reason = "EMPTY_RESPONSE";
    else if (classification === "challenge") reason = "CHALLENGE_PAGE";
    else if (classification === "placeholder") reason = "PLACEHOLDER_LOCATION_ROWS";
    else if (classification === "invalid") reason = "LOCATION_TABLE_NOT_FOUND";
    else if (returnedIp && returnedIp !== clientIp) reason = "RETURNED_IP_MISMATCH";

    const diagnostic: IpnumberiaAttemptDiagnostic = {
      transport,
      status: result.status,
      contentType: result.contentType,
      finalUrl: result.finalUrl,
      responseBytes: Buffer.byteLength(result.body),
      classification,
      reason,
      hasLocationTable: /id=["']home_ip_info_data["']/i.test(result.body),
      hasSearchForm: /name=["']search_value["']/i.test(result.body),
      hasChallengeMarker: matchedChallengeMarkers.length > 0,
      returnedIp,
      parsedLocation,
      rawLocation,
      pageTitle,
      matchedChallengeMarkers,
      bodyTextPreview,
    };

    if (
      reason === "OK" &&
      classification === "location" &&
      parsedLocation
    ) {
      return { location: parsedLocation, diagnostic };
    }
    return { location: null, diagnostic };
  } catch (error) {
    return {
      location: null,
      diagnostic: {
        transport,
        reason: error instanceof Error ? error.message : "REQUEST_FAILED",
      },
    };
  }
}

function requestIpapi(clientIp: string): Promise<{
  location: LocationInfo | null;
  status?: number;
  reason: string;
}> {
  return new Promise((resolve) => {
    const path = `/${encodeURIComponent(clientIp)}/json/`;
    const req = https.request(
      {
        hostname: IPAPI_HOST,
        path,
        method: "GET",
        headers: {
          "User-Agent": "Sedabox/1.0",
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      },
      (response) => {
        const status = response.statusCode || 502;
        const chunks: Buffer[] = [];
        let total = 0;
        response.on("data", (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          total += buffer.length;
          if (total <= 256 * 1024) chunks.push(buffer);
        });
        response.on("end", () => {
          if (status < 200 || status >= 300) {
            resolve({ location: null, status, reason: `HTTP_${status}` });
            return;
          }
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
              error?: boolean;
              reason?: string;
              country_name?: string | null;
              country?: string | null;
              region?: string | null;
              region_code?: string | null;
              city?: string | null;
            };
            if (data.error) {
              resolve({
                location: null,
                status,
                reason: data.reason || "PROVIDER_ERROR",
              });
              return;
            }
            const location: LocationInfo = {
              country: htmlToText(data.country_name || data.country || ""),
              province: htmlToText(data.region || data.region_code || ""),
              city: htmlToText(data.city || ""),
            };
            if (
              isPlaceholderValue(location.country) ||
              isPlaceholderValue(location.province) ||
              isPlaceholderValue(location.city)
            ) {
              resolve({ location: null, status, reason: "EMPTY_LOCATION" });
              return;
            }
            resolve({ location, status, reason: "OK" });
          } catch {
            resolve({ location: null, status, reason: "INVALID_JSON" });
          }
        });
      },
    );
    req.setTimeout(IPAPI_TIMEOUT_MS, () => req.destroy(new Error("IPAPI_TIMEOUT")));
    req.on("error", (error) => {
      resolve({ location: null, reason: error.message || "REQUEST_FAILED" });
    });
    req.end();
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
  }

  const resolved = resolveClientIp(req);
  const diagnostics: ProxyDiagnostics = {
    ip: {
      selected: resolved.ip,
      source: resolved.source,
      headerIp: resolved.headerIp,
      browserIp: resolved.browserIp,
      headerIsPublic: isPublicIp(resolved.headerIp),
      browserIsPublic: isPublicIp(resolved.browserIp),
    },
    ipnumberia: [],
  };

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (!resolved.ip) {
    console.warn("[SEDABOX:LOCATION:PROXY] client-ip-unavailable", diagnostics.ip);
    return res.status(503).json({
      ok: false,
      error: { code: "CLIENT_PUBLIC_IP_UNAVAILABLE" },
      diagnostics,
    });
  }

  const httpsAttempt = await tryIpnumberia("https://ipnumberia.com/", resolved.ip);
  diagnostics.ipnumberia.push(httpsAttempt.diagnostic);
  if (httpsAttempt.location) {
    console.info("[SEDABOX:LOCATION:PROXY] ipnumberia-success", {
      ipSource: resolved.source,
      transport: "https",
      diagnostic: httpsAttempt.diagnostic,
    });
    return res.status(200).json({
      ok: true,
      provider: "ipnumberia",
      transport: "https",
      location: httpsAttempt.location,
      diagnostics,
    });
  }

  const httpAttempt = await tryIpnumberia("http://ipnumberia.com/", resolved.ip);
  diagnostics.ipnumberia.push(httpAttempt.diagnostic);
  if (httpAttempt.location) {
    console.info("[SEDABOX:LOCATION:PROXY] ipnumberia-success", {
      ipSource: resolved.source,
      transport: "http",
      diagnostic: httpAttempt.diagnostic,
    });
    return res.status(200).json({
      ok: true,
      provider: "ipnumberia",
      transport: "http",
      location: httpAttempt.location,
      diagnostics,
    });
  }

  const fallback = await requestIpapi(resolved.ip);
  diagnostics.fallback = {
    provider: "ipapi",
    attempted: true,
    status: fallback.status,
    reason: fallback.reason,
  };

  if (fallback.location) {
    console.warn("[SEDABOX:LOCATION:PROXY] ipnumberia-failed-fallback-success", diagnostics);
    return res.status(200).json({
      ok: true,
      provider: "ipapi",
      transport: "https",
      location: fallback.location,
      diagnostics,
    });
  }

  console.error("[SEDABOX:LOCATION:PROXY] all-providers-failed", diagnostics);
  return res.status(503).json({
    ok: false,
    error: { code: "LOCATION_LOOKUP_FAILED" },
    diagnostics,
  });
}
