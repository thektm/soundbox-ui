import { Capacitor } from "@capacitor/core";
import { withClientTimeout } from "./clientDebug";
import { waitForSplashHidden } from "./splashRuntime";

export const HOME_SUMMARY_URL = "https://api.sedabox.com/api/home/summary/";

const PREFETCH_TTL_MS = 15_000;
const MAX_RECORDS = 4;
const FETCH_TIMEOUT_MS = 15_000;
const BODY_TIMEOUT_MS = 10_000;

type HomeSummaryRecord = {
  createdAt: number;
  promise: Promise<any>;
  settled: boolean;
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

export const invalidateHomeSummaryRequest = (key: string): void => {
  records.delete(key);
};

const pruneRecords = (): void => {
  const now = Date.now();
  for (const [key, record] of records) {
    if (now - record.createdAt > PREFETCH_TTL_MS) {
      records.delete(key);
    }
  }

  while (records.size > MAX_RECORDS) {
    const oldestKey = records.keys().next().value as string | undefined;
    if (!oldestKey) break;
    records.delete(oldestKey);
  }
};

export const requestHomeSummary = (
  key: string,
  request: () => Promise<Response>,
): Promise<any> => {
  pruneRecords();
  const cacheAcrossMounts = !key.startsWith("member:");

  const existing = records.get(key);
  if (
    existing &&
    (!existing.settled ||
      (cacheAcrossMounts &&
        Date.now() - existing.createdAt <= PREFETCH_TTL_MS))
  ) {
    return existing.promise;
  }

  const promise = withClientTimeout(
    "Home summary response",
    request(),
    FETCH_TIMEOUT_MS,
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Home summary request failed with status ${response.status}`,
        );
      }

      // On native Android the SVG path animation is paint-sensitive. The
      // request can finish in parallel with it, but reading/parsing a large
      // Home payload and waking every awaiting React consumer at the exact
      // arrival moment can create a long main-thread task. Keep network overlap
      // while postponing only body materialization until the splash is gone.
      if (Capacitor.isNativePlatform()) {
        await waitForSplashHidden();
      }

      const text = await withClientTimeout(
        "Home summary body read",
        response.text(),
        BODY_TIMEOUT_MS,
      );

      return text ? JSON.parse(text) : null;
    })
    .catch((error) => {
      const current = records.get(key);
      if (current?.promise === promise) records.delete(key);
      throw error;
    });

  // Keep member requests only for concurrent consumers (for example React
  // Strict Mode). A later home visit must contact the API so a revoked session
  // cannot keep rendering from a previous successful response.
  const record: HomeSummaryRecord = {
    createdAt: Date.now(),
    promise,
    settled: false,
  };
  records.set(key, record);
  void promise.then(
    () => {
      record.settled = true;
      if (!cacheAcrossMounts && records.get(key) === record) {
        records.delete(key);
      }
    },
    () => {
      record.settled = true;
      if (records.get(key) === record) records.delete(key);
    },
  );
  pruneRecords();
  return promise;
};
