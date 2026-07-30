const DEFAULT_API_ROOT = "https://api.sedabox.com/api";

const getApiOrigin = (): string => {
  const configured = (process.env.NEXT_PUBLIC_API_ROOT || DEFAULT_API_ROOT).trim();
  try {
    const parsed = new URL(configured);
    return parsed.origin;
  } catch {
    return "https://api.sedabox.com";
  }
};

const unwrapNextImageUrl = (value: string): string => {
  try {
    const parsed = new URL(
      value,
      typeof window !== "undefined" ? window.location.origin : "http://localhost",
    );
    if (parsed.pathname === "/_next/image") {
      const inner = parsed.searchParams.get("url");
      return inner ? decodeURIComponent(inner) : value;
    }
  } catch {
    // Keep the original value; normalization below still handles relative paths.
  }
  return value;
};

const extractString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const candidate = value as Record<string, unknown>;
  for (const key of ["image", "url", "src", "profile_image", "avatar"]) {
    if (typeof candidate[key] === "string") return candidate[key] as string;
  }
  return "";
};

/**
 * Normalize every user-avatar shape returned by old and new API endpoints.
 * Local `/media/` URLs must point to the API host, not the Next.js frontend,
 * and remote avatars bypass Next's optimizer through the shared avatar image.
 */
export const normalizeUserAvatarUrl = (value: unknown): string => {
  let source = extractString(value).trim();
  if (!source) return "";

  source = unwrapNextImageUrl(source).replace(/\\/g, "/");

  if (source.startsWith("//")) source = `https:${source}`;

  if (source.startsWith("/media/")) {
    return `${getApiOrigin()}${source}`;
  }
  if (source.startsWith("media/")) {
    return `${getApiOrigin()}/${source}`;
  }

  if (/^https?:\/\//i.test(source)) {
    try {
      const parsed = new URL(source);
      if (
        parsed.protocol === "http:" &&
        !["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)
      ) {
        parsed.protocol = "https:";
      }
      return parsed.toString();
    } catch {
      return source;
    }
  }

  return source.startsWith("/") ? source : `/${source}`;
};
