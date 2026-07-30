import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND_API_ROOT = (
  process.env.SEDABOX_API_ROOT || "https://api.sedabox.com/api"
).replace(/\/$/, "");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const upstream = await fetch(`${BACKEND_API_ROOT}/plans/premium/price/`, {
      cache: "no-store",
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      signal: controller.signal,
    });
    const text = await upstream.text();
    let payload: any = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!upstream.ok || !payload || typeof payload.price !== "number") {
      return res.status(502).json({
        error: "Premium price is temporarily unavailable",
      });
    }

    return res.status(200).json({
      plan: "premium",
      price: payload.price,
      currency: payload.currency || "TOMAN",
    });
  } catch (error: any) {
    const message =
      error?.name === "AbortError"
        ? "Premium price request timed out"
        : "Premium price is temporarily unavailable";
    return res.status(502).json({ error: message });
  } finally {
    clearTimeout(timeout);
  }
}
