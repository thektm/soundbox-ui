import type { NextApiRequest, NextApiResponse } from "next";
import * as http from "http";
import * as https from "https";
import { isIP } from "net";

const IPNUMBERIA_HOST = "ipnumberia.com";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 768 * 1024;
const MAX_REDIRECTS = 3;

type UpstreamResult = {
  status: number;
  contentType: string;
  body: string;
};

function firstHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function normalizeIp(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  // X-Forwarded-For may contain a proxy chain. The first item is the original
  // client when the reverse proxy is configured normally.
  if (value.includes(",")) value = value.split(",", 1)[0].trim();

  // Common proxy/socket forms.
  value = value.replace(/^for=/i, "").replace(/^"|"$/g, "");
  if (value.startsWith("::ffff:")) value = value.slice(7);
  if (value.startsWith("[") && value.includes("]")) {
    value = value.slice(1, value.indexOf("]"));
  }

  return isIP(value) ? value : null;
}

function getClientIp(req: NextApiRequest): string | null {
  const candidates = [
    firstHeaderValue(req.headers["cf-connecting-ip"]),
    firstHeaderValue(req.headers["x-nf-client-connection-ip"]),
    firstHeaderValue(req.headers["x-real-ip"]),
    firstHeaderValue(req.headers["x-forwarded-for"]),
    req.socket?.remoteAddress || "",
  ];

  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (ip) return ip;
  }
  return null;
}

function isAllowedIpnumberiaUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    (url.protocol === "https:" || url.protocol === "http:") &&
    (host === IPNUMBERIA_HOST || host.endsWith(`.${IPNUMBERIA_HOST}`))
  );
}

function requestHtml(
  target: URL,
  clientIp: string | null,
  redirectCount = 0,
): Promise<UpstreamResult> {
  return new Promise((resolve, reject) => {
    if (!isAllowedIpnumberiaUrl(target)) {
      reject(new Error("IPNUMBERIA_REDIRECT_BLOCKED"));
      return;
    }

    const transport = target.protocol === "https:" ? https : http;
    const forwardedHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    };

    // ipnumberia historically determines location from the requester IP. When
    // Sedabox is behind Next/Nginx/Docker, forward the real browser IP using the
    // common headers PHP/reverse-proxy stacks inspect. This keeps the old HTML
    // scraping flow while avoiding the Docker host IP whenever ipnumberia honors
    // forwarded client headers.
    if (clientIp) {
      forwardedHeaders["X-Forwarded-For"] = clientIp;
      forwardedHeaders["X-Real-IP"] = clientIp;
      forwardedHeaders["CF-Connecting-IP"] = clientIp;
      forwardedHeaders["True-Client-IP"] = clientIp;
      forwardedHeaders["Client-IP"] = clientIp;
      forwardedHeaders.Forwarded = `for=${clientIp}`;
    }

    const request = transport.request(
      target,
      {
        method: "GET",
        headers: forwardedHeaders,
        // ipnumberia currently presents an invalid/expired HTTPS certificate.
        // This exception is intentionally scoped to this fixed upstream only.
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
          requestHtml(nextUrl, clientIp, redirectCount + 1)
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
          });
        });
      },
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("IPNUMBERIA_TIMEOUT"));
    });
    request.on("error", reject);
    request.end();
  });
}

async function fetchIpnumberiaHtml(clientIp: string | null): Promise<UpstreamResult> {
  try {
    const httpsResult = await requestHtml(new URL("https://ipnumberia.com/"), clientIp);
    if (httpsResult.status >= 200 && httpsResult.status < 400) return httpsResult;
  } catch {
    // Deliberately continue to HTTP. The browser never sees this HTTP request,
    // so Sedabox remains HTTPS and browser mixed-content rules are not involved.
  }

  return requestHtml(new URL("http://ipnumberia.com/"), clientIp);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED" } });
  }

  const clientIp = getClientIp(req);

  try {
    const upstream = await fetchIpnumberiaHtml(clientIp);
    if (upstream.status < 200 || upstream.status >= 400 || !upstream.body.trim()) {
      return res.status(502).json({
        error: { code: "IP_LOOKUP_UPSTREAM_ERROR" },
      });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.status(200).send(upstream.body);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[SEDABOX:IPNUMBERIA_PROXY] lookup failed", error);
    }
    return res.status(502).json({
      error: { code: "IP_LOOKUP_UNAVAILABLE" },
    });
  }
}
