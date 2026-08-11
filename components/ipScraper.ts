type IpInfo = { country: string; province: string };

type IpApiResponse = {
  country_name?: string | null;
  country?: string | null;
  region?: string | null;
  region_code?: string | null;
  error?: boolean;
};

let cachedIpInfo: IpInfo | null = null;
let lookupPromise: Promise<IpInfo | null> | null = null;

async function performLookup(): Promise<IpInfo | null> {
  if (typeof window === "undefined") return null;

  try {
    // This request intentionally goes straight from the browser to the IP
    // provider. Never proxy it through Next/Netlify: the provider must see the
    // listener's public IP, not the hosting/server IP.
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });

    if (!response.ok) {
      const lookupError = new Error("IP_LOOKUP_REQUEST_FAILED") as Error & {
        status?: number;
      };
      lookupError.status = response.status;
      throw lookupError;
    }

    const data = (await response.json()) as IpApiResponse;
    if (data?.error) throw new Error("IP_LOOKUP_PROVIDER_ERROR");

    const country = String(data?.country_name || data?.country || "Unknown").trim();
    const province = String(data?.region || data?.region_code || "Unknown").trim();
    const result = {
      country: country || "Unknown",
      province: province || "Unknown",
    };

    cachedIpInfo = result;
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[SEDABOX:IP_LOOKUP] client lookup failed", error);
    }
    return null;
  }
}

/**
 * Resolve location at most once per browser module lifetime. Concurrent player
 * starts share the same direct client request, and later tracks reuse it.
 */
export function scrapeIpInfo(): Promise<IpInfo | null> {
  if (cachedIpInfo) return Promise.resolve(cachedIpInfo);
  if (lookupPromise) return lookupPromise;

  lookupPromise = performLookup().finally(() => {
    lookupPromise = null;
  });
  return lookupPromise;
}
