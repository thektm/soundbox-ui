// Share links utility for sedabox
// Generates clean, human-readable share URLs.

export type ShareType = "song" | "artist" | "album" | "playlist" | "user-playlist" | "genre";

/**
 * Converts a string into a URL-friendly slug.
 * Keeps Latin letters/digits, Persian/Arabic characters, and hyphens.
 */
export function slugify(str: string): string {
  return String(str)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const TYPE_PREFIX: Record<ShareType, string> = {
  song: "track",
  artist: "artists",
  album: "album",
  playlist: "playlist",
  "user-playlist": "playlist",
  genre: "genres",
};

// ─── Legacy decode helpers (for old /s/{code} links) ─────────────────────────
const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SALT = 0x5edb0;

const TYPE_MAP: Record<string, ShareType> = {
  s: "song",
  a: "artist",
  l: "album",
  p: "playlist",
  u: "user-playlist",
};

const REVERSE_TYPE_MAP: Record<ShareType, string> = {
  song: "s",
  artist: "a",
  album: "l",
  playlist: "p",
  "user-playlist": "u",
};

/**
 * Gets the relative share path for a piece of content.
 * Format: /{prefix}/{id}-{name-slug}
 */
export function getSharePath(
  type: ShareType,
  id: string | number,
  name?: string,
): string {
  const prefix = TYPE_PREFIX[type];
  const namePart = name ? `-${slugify(name)}` : "";
  return `/${prefix}/${id}${namePart}`;
}

/**
 * Gets the full share URL for a piece of content.
 * Format: https://app.sedabox.com/{prefix}/{id}-{name-slug}
 */
export function getFullShareUrl(
  type: ShareType,
  id: string | number,
  name?: string,
): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${getSharePath(type, id, name)}`;
}

// ─── Legacy compatibility ─────────────────────────────────────────────────────
// These allow old /s/{code} deep-links arriving from previously shared URLs to
// still open the correct page via NavigationContext.

/** @deprecated – new share URLs are human-readable. Use getSharePath instead. */
export function encodeShare(type: ShareType, id: string | number): string {
  return `${REVERSE_TYPE_MAP[type]}${id}`;
}

/**
 * Decodes a legacy /s/{code} share code.
 * Supports both the old obfuscated format and newer plain "{typeChar}{id}" format.
 */
export function decodeShare(
  code: string,
): { type: ShareType; id: string } | null {
  if (!code || code.length < 2) return null;

  const typeChar = code[0];
  const type = TYPE_MAP[typeChar];
  if (!type) return null;

  const raw = code.slice(1);

  // Plain numeric format (new links or already-decoded)
  if (/^\d+$/.test(raw)) {
    return { type, id: raw };
  }

  // Legacy obfuscated base-62 + XOR format
  try {
    let n = 0;
    for (let i = 0; i < raw.length; i++) {
      const idx = ALPHABET.indexOf(raw[i]);
      if (idx === -1) throw new Error("invalid char");
      n = n * 62 + idx;
    }
    const id = (n ^ SALT).toString();
    if (parseInt(id, 10) > 0) return { type, id };
  } catch (_) {
    // ignore
  }

  // Fallback: treat remaining string as id as-is
  return { type, id: raw };
}
