type IpInfo = { country: string; province: string };

let cachedIpInfo: IpInfo | null = null;
let lookupPromise: Promise<IpInfo | null> | null = null;

async function performLookup(): Promise<IpInfo | null> {
  try {
    const response = await fetch("/api/ip-proxy", {
      headers: { Accept: "text/html" },
      cache: "force-cache",
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

    const countryLabels = ["کشور", "Country", "Land"];
    const provinceLabels = ["استان", "Province", "State", "Bundesland", "Staat"];

    let country = "Unknown";
    let province = "Unknown";

    const table = doc.getElementById("home_ip_info_data");
    if (table) {
      table.querySelectorAll("tr").forEach((row) => {
        const th = row.querySelector("th");
        const td = row.querySelector("td");
        if (!th || !td) return;

        const labelText = th.textContent?.trim() || "";
        if (countryLabels.some((label) => labelText.includes(label))) {
          country = td.textContent?.trim() || "Unknown";
        }
        if (provinceLabels.some((label) => labelText.includes(label))) {
          province = td.textContent?.trim() || "Unknown";
        }
      });
    } else {
      for (const label of countryLabels) {
        const regex = new RegExp(
          `<th[^>]*>[\\s\\S]*?${label}[\\s\\S]*?<\\/th>[\\s\\S]*?<td[^>]*>([\\s\\S]*?)<\\/td>`,
          "i",
        );
        const match = html.match(regex);
        if (match?.[1]) {
          country = match[1].replace(/<[^>]*>?/gm, "").trim();
          break;
        }
      }
      for (const label of provinceLabels) {
        const regex = new RegExp(
          `<th[^>]*>[\\s\\S]*?${label}[\\s\\S]*?<\\/th>[\\s\\S]*?<td[^>]*>([\\s\\S]*?)<\\/td>`,
          "i",
        );
        const match = html.match(regex);
        if (match?.[1]) {
          province = match[1].replace(/<[^>]*>?/gm, "").trim();
          break;
        }
      }
    }

    const result = { country, province };
    cachedIpInfo = result;
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[SEDABOX:IP_LOOKUP] lookup failed", error);
    }
    return null;
  }
}

/**
 * Resolve location at most once per browser module lifetime. Concurrent player
 * starts share the same request, and subsequent tracks reuse the result.
 */
export function scrapeIpInfo(): Promise<IpInfo | null> {
  if (cachedIpInfo) return Promise.resolve(cachedIpInfo);
  if (lookupPromise) return lookupPromise;

  lookupPromise = performLookup().finally(() => {
    lookupPromise = null;
  });
  return lookupPromise;
}
