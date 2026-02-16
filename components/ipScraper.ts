export async function scrapeIpInfo() {
  try {
    console.log("Starting to scrap ipnumberia.com via proxy...");
    // Call our internal proxy to bypass CORS
    const response = await fetch("/api/ip-proxy");

    if (!response.ok) {
      throw new Error(`Failed to fetch ipinfo via proxy: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const countryLabels = ["کشور", "Country", "Land"];
    const provinceLabels = [
      "استان",
      "Province",
      "State",
      "Bundesland",
      "Staat",
    ];

    let country = "Unknown";
    let province = "Unknown";

    // Find the table with id "home_ip_info_data"
    const table = doc.getElementById("home_ip_info_data");
    if (table) {
      const rows = table.querySelectorAll("tr");
      rows.forEach((row) => {
        const th = row.querySelector("th");
        const td = row.querySelector("td");
        if (th && td) {
          const labelText = th.textContent?.trim() || "";
          
          // Check for Country
          if (countryLabels.some(label => labelText.includes(label))) {
            country = td.textContent?.trim() || "Unknown";
          }
          
          // Check for Province/State
          if (provinceLabels.some(label => labelText.includes(label))) {
            province = td.textContent?.trim() || "Unknown";
          }
        }
      });
    } else {
        // Fallback to regex if table not found by ID (sometimes DOMParser might behave differently)
        for (const label of countryLabels) {
          const regex = new RegExp(`<th[^>]*>[\\s\\S]*?${label}[\\s\\S]*?<\\/th>[\\s\\S]*?<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
          const match = html.match(regex);
          if (match && match[1]) {
            country = match[1].replace(/<[^>]*>?/gm, '').trim();
            break;
          }
        }
        for (const label of provinceLabels) {
          const regex = new RegExp(`<th[^>]*>[\\s\\S]*?${label}[\\s\\S]*?<\\/th>[\\s\\S]*?<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
          const match = html.match(regex);
          if (match && match[1]) {
            province = match[1].replace(/<[^>]*>?/gm, '').trim();
            break;
          }
        }
    }

    console.log("Scraped IP Info:", { country, province });
    
    // You can send this data to your server here if needed
    // Example: fetch('/api/log-location', { method: 'POST', body: JSON.stringify({ country, province }) });
    
    return { country, province };
  } catch (error) {
    console.error("Error scraping ipnumberia.com:", error);
    return null;
  }
}
