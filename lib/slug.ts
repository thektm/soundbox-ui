const ARABIC_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

function asDecodedText(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value).trim();
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Create an ASCII/English-only URL slug.
 *
 * Persian/Arabic text is intentionally rejected rather than transliterated.
 * This keeps canonical content URLs language-independent: callers should emit
 * an ID-only URL when no real English slug source exists.
 */
export function createSlug(value: unknown): string {
  const text = asDecodedText(value);
  if (!text || ARABIC_SCRIPT_RE.test(text)) return "";

  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function own(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

/**
 * Resolve a content object's canonical English slug.
 *
 * A backend-provided `url_slug` is authoritative even when it is empty. That
 * empty value means the backend verified that no real English source exists,
 * so we must not fall back to localized/Farsi display text.
 */
export function getCanonicalSlug(source: unknown, fallback?: unknown): string {
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const record = source as Record<string, unknown>;
    for (const key of ["url_slug", "urlSlug"]) {
      if (own(record, key)) return createSlug(record[key]);
    }

    // Compatibility for payloads that predate `url_slug`. These are explicit
    // English fields only; normal localized `title`/`name` are not inspected.
    for (const key of [
      "artistic_name_en",
      "artisticNameEn",
      "stage_name_en",
      "stageNameEn",
      "title_en",
      "titleEn",
      "name_en",
      "nameEn",
    ]) {
      if (own(record, key)) {
        const slug = createSlug(record[key]);
        if (slug) return slug;
      }
    }
  }
  return createSlug(fallback);
}

export function getArtistCanonicalSlug(source: unknown, fallback?: unknown): string {
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const record = source as Record<string, unknown>;
    for (const key of ["artist_url_slug", "artistUrlSlug"]) {
      if (own(record, key)) return createSlug(record[key]);
    }
  }
  return createSlug(fallback);
}

export function getAlbumCanonicalSlug(source: unknown, fallback?: unknown): string {
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const record = source as Record<string, unknown>;
    for (const key of ["album_url_slug", "albumUrlSlug"]) {
      if (own(record, key)) return createSlug(record[key]);
    }
  }
  return createSlug(fallback);
}

export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).replace(/-/g, " ");
  } catch {
    return slug.replace(/-/g, " ");
  }
}
