import { NextApiRequest, NextApiResponse } from "next";
import http from "http";
import https from "https";
import { pipeline } from "stream";
import { URL } from "url";

const ALLOWED_HOSTS = ["dls.musics-fa.com", "musics-fa.com"];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow CORS for the client
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range,Content-Type,Accept");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const urlParam = req.query.url;
  if (!urlParam || Array.isArray(urlParam)) {
    res.status(400).end("Missing url query parameter");
    return;
  }

  let target: URL;
  try {
    target = new URL(String(urlParam));
  } catch (e) {
    res.status(400).end("Invalid URL");
    return;
  }

  if (!ALLOWED_HOSTS.includes(target.hostname)) {
    res.status(403).end("Host not allowed");
    return;
  }

  const client = target.protocol === "https:" ? https : http;

  const headers: http.OutgoingHttpHeaders = {};
  // Forward range header if present so the remote server can respond with partial content
  if (req.headers.range) headers.range = req.headers.range as string;

  // Some servers require a User-Agent
  headers["user-agent"] = (req.headers["user-agent"] as string) || "node-proxy";

  const requestOptions = {
    method: req.method || "GET",
    headers,
    timeout: 20000,
  } as http.RequestOptions;

  const proxyReq = client.request(target, requestOptions, (proxyRes) => {
    // Copy status code
    res.statusCode = proxyRes.statusCode || 200;

    // Copy relevant headers from remote response
    Object.entries(proxyRes.headers).forEach(([k, v]) => {
      // Skip hop-by-hop headers
      if (k.toLowerCase() === "transfer-encoding") return;
      if (v) res.setHeader(k, String(v));
    });

    // Ensure we expose CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range,Content-Type,Accept");

    // Pipe remote response directly to client
    pipeline(proxyRes, res, (err) => {
      if (err) {
        try {
          res.end();
        } catch (e) {
          // ignore
        }
      }
    });
  });

  proxyReq.on("error", (err) => {
    console.error("Audio proxy request error:", err);
    if (!res.headersSent) res.statusCode = 502;
    try {
      res.end("Proxy error");
    } catch (e) {
      // ignore
    }
  });

  // In case client aborts, destroy the proxy request
  req.on("close", () => {
    try {
      proxyReq.destroy();
    } catch (e) {
      // ignore
    }
  });

  proxyReq.end();
}
