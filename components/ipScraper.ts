type IpInfo = {
  country: string;
  province: string;
  city: string;
};

let cachedIpInfo: IpInfo | null = null;
let lookupPromise: Promise<IpInfo | null> | null = null;

const FIELD_LABELS = {
  country: ["کشور", "Country", "Land"],
  province: ["استان", "Province", "State", "Bundesland", "Staat", "Region"],
  city: ["شهر", "City", "Town", "Ort"],
} as const;

function normalizeText(value: string | null | undefined): string {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function labelMatches(label: string, candidates: readonly string[]): boolean {
  const normalized = normalizeText(label).replace(/[：:]+$/g, "").trim();
  return candidates.some((candidate) => {
    const expected = normalizeText(candidate);
    return normalized === expected || normalized.includes(expected);
  });
}

function decodeHtmlFragment(doc: Document, fragment: string): string {
  const holder = doc.createElement("div");
  holder.innerHTML = fragment.replace(/<br\s*\/?\s*>/gi, " ");
  return normalizeText(holder.textContent);
}

function extractByRegex(
  html: string,
  doc: Document,
  labels: readonly string[],
): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `<(?:th|td)[^>]*>[\\s\\S]*?${escaped}[\\s\\S]*?<\\/(?:th|td)>[\\s\\S]*?<(?:td|th)[^>]*>([\\s\\S]*?)<\\/(?:td|th)>`,
      "i",
    );
    const match = html.match(regex);
    if (match?.[1]) {
      const value = decodeHtmlFragment(doc, match[1]);
      if (value) return value;
    }
  }
  return null;
}

async function performLookup(): Promise<IpInfo | null> {
  if (typeof window === "undefined") return null;

  try {
    // Keep ipnumberia as the location source. The Next route handles its broken
    // TLS certificate/server-side HTTP fallback and returns only its HTML to us.
    const response = await fetch("/api/ip-proxy", {
      method: "GET",
      headers: { Accept: "text/html" },
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      const lookupError = new Error("IP_LOOKUP_REQUEST_FAILED") as Error & {
        status?: number;
      };
      lookupError.status = response.status;
      throw lookupError;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let country = "";
    let province = "";
    let city = "";

    // Prefer ipnumberia's known location table, but scan all rows as a fallback
    // because the site has changed markup in the past.
    const table = doc.getElementById("home_ip_info_data");
    const rows = table
      ? Array.from(table.querySelectorAll("tr"))
      : Array.from(doc.querySelectorAll("tr"));

    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("th,td"));
      if (cells.length < 2) continue;

      const label = normalizeText(cells[0]?.textContent);
      const value = normalizeText(cells.slice(1).map((cell) => cell.textContent || "").join(" "));
      if (!label || !value) continue;

      if (!country && labelMatches(label, FIELD_LABELS.country)) country = value;
      if (!province && labelMatches(label, FIELD_LABELS.province)) province = value;
      if (!city && labelMatches(label, FIELD_LABELS.city)) city = value;
    }

    // Last-resort parser for the older HTML layout where DOM table selection can
    // fail because of malformed markup.
    country ||= extractByRegex(html, doc, FIELD_LABELS.country) || "";
    province ||= extractByRegex(html, doc, FIELD_LABELS.province) || "";
    city ||= extractByRegex(html, doc, FIELD_LABELS.city) || "";

    const result: IpInfo = {
      country: country || "Unknown",
      province: province || "Unknown",
      city: city || "Unknown",
    };

    // Do not cache an empty/broken ipnumberia page. This allows a later playback
    // to retry automatically after a temporary upstream failure.
    if (
      result.country === "Unknown" &&
      result.province === "Unknown" &&
      result.city === "Unknown"
    ) {
      throw new Error("IPNUMBERIA_LOCATION_FIELDS_NOT_FOUND");
    }

    cachedIpInfo = result;
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[SEDABOX:IP_LOOKUP] ipnumberia lookup failed", error);
    }
    return null;
  }
}

/**
 * Resolve location at most once per browser module lifetime. Concurrent player
 * starts share one ipnumberia scrape, and subsequent tracks reuse the result.
 */
export function scrapeIpInfo(): Promise<IpInfo | null> {
  if (cachedIpInfo) return Promise.resolve(cachedIpInfo);
  if (lookupPromise) return lookupPromise;

  lookupPromise = performLookup().finally(() => {
    lookupPromise = null;
  });
  return lookupPromise;
}
