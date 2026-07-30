/** Create a URL-safe slug while preserving Persian/Arabic characters. */
export function createSlug(title: string): string {
  const normalized = String(title || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[\/\\?%*:|"<>]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return encodeURIComponent(normalized);
}

export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).replace(/-/g, " ");
  } catch {
    return slug.replace(/-/g, " ");
  }
}
