import { clientTrace, withClientTimeout } from "./clientDebug";

export const HOME_SUMMARY_URL = "https://api.sedabox.com/api/home/summary/";

const PREFETCH_TTL_MS = 15_000;
const MAX_RECORDS = 4;
const FETCH_TIMEOUT_MS = 15_000;
const BODY_TIMEOUT_MS = 10_000;

type HomeSummaryRecord = {
  createdAt: number;
  promise: Promise<any>;
};

const records = new Map<string, HomeSummaryRecord>();

export const buildHomeSummaryRequestKey = (
  accessToken: string | null,
  language: string,
): string => {
  if (!accessToken) return `guest:${language}`;
  // The suffix differentiates sessions without retaining a complete JWT in a
  // long-lived key or exposing it anywhere outside this in-memory module.
  return `member:${accessToken.slice(-24)}:${language}`;
};

const describeKey = (key: string) => ({
  audience: key.startsWith("member:") ? "member" : "guest",
  language: key.split(":").at(-1) || "unknown",
});

export const invalidateHomeSummaryRequest = (key: string): void => {
  const deleted = records.delete(key);
  clientTrace("HOME_API", "cache:invalidated", {
    ...describeKey(key),
    deleted,
  });
};

const pruneRecords = (): void => {
  const now = Date.now();
  for (const [key, record] of records) {
    if (now - record.createdAt > PREFETCH_TTL_MS) {
      records.delete(key);
      clientTrace("HOME_API", "cache:expired", describeKey(key));
    }
  }

  while (records.size > MAX_RECORDS) {
    const oldestKey = records.keys().next().value as string | undefined;
    if (!oldestKey) break;
    records.delete(oldestKey);
    clientTrace("HOME_API", "cache:pruned", describeKey(oldestKey));
  }
};

export const requestHomeSummary = (
  key: string,
  request: () => Promise<Response>,
): Promise<any> => {
  pruneRecords();

  const keyDescription = describeKey(key);
  const existing = records.get(key);
  if (existing && Date.now() - existing.createdAt <= PREFETCH_TTL_MS) {
    clientTrace("HOME_API", "request:reuse-inflight-or-cache", {
      ...keyDescription,
      ageMs: Date.now() - existing.createdAt,
    });
    return existing.promise;
  }

  const startedAt = performance.now();
  clientTrace("HOME_API", "request:start", {
    ...keyDescription,
    url: HOME_SUMMARY_URL,
  });

  const promise = withClientTimeout(
    "Home summary response",
    request(),
    FETCH_TIMEOUT_MS,
  )
    .then(async (response) => {
      clientTrace("HOME_API", "response:received", {
        ...keyDescription,
        status: response.status,
        ok: response.ok,
        type: response.type,
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
        elapsedMs: Math.round(performance.now() - startedAt),
      });

      if (!response.ok) {
        throw new Error(
          `Home summary request failed with status ${response.status}`,
        );
      }

      const bodyStartedAt = performance.now();
      const text = await withClientTimeout(
        "Home summary body read",
        response.text(),
        BODY_TIMEOUT_MS,
      );
      clientTrace("HOME_API", "response:body-read", {
        ...keyDescription,
        bytes: text.length,
        elapsedMs: Math.round(performance.now() - bodyStartedAt),
      });

      try {
        const parsed = text ? JSON.parse(text) : null;
        clientTrace("HOME_API", "response:json-parsed", {
          ...keyDescription,
          topLevelKeys:
            parsed && typeof parsed === "object" ? Object.keys(parsed) : [],
          totalElapsedMs: Math.round(performance.now() - startedAt),
        });
        return parsed;
      } catch (error) {
        clientTrace(
          "HOME_API",
          "response:json-parse-failed",
          {
            error,
            ...keyDescription,
            bodyPreview: text.slice(0, 300),
          },
          "error",
        );
        throw error;
      }
    })
    .then((data) => {
      clientTrace("HOME_API", "request:resolved", {
        ...keyDescription,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      return data;
    })
    .catch((error) => {
      const current = records.get(key);
      if (current?.promise === promise) records.delete(key);
      clientTrace(
        "HOME_API",
        "request:rejected",
        {
          ...keyDescription,
          elapsedMs: Math.round(performance.now() - startedAt),
          error,
        },
        "error",
      );
      throw error;
    });

  records.set(key, { createdAt: Date.now(), promise });
  clientTrace("HOME_API", "cache:stored", {
    ...keyDescription,
    records: records.size,
  });
  pruneRecords();
  return promise;
};
