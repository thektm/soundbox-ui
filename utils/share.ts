// Share links utility for sedabox
// Encodes and decodes shared content pointers

type ShareType = "song" | "artist" | "album" | "playlist" | "user-playlist";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SALT = 0x5EDB0; // SedaBox-ish hex salt

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

function encodeContentId(type: ShareType, id: string | number): string {
  const typeChar = REVERSE_TYPE_MAP[type];
  const numericId = typeof id === "number" ? id : parseInt(id, 10);
  
  if (isNaN(numericId)) {
    // Fallback if not numeric (unlikely for our DB IDs)
    return btoa(`${typeChar}${id}`).replace(/=+$/, "").split("").reverse().join("");
  }

  // Obfuscate
  let n = numericId ^ SALT;
  let str = "";
  while (n > 0) {
    str = ALPHABET[n % 62] + str;
    n = Math.floor(n / 62);
  }
  return typeChar + (str || "0");
}

function decodeContentId(code: string): { type: ShareType; id: string } | null {
  try {
    const typeChar = code.charAt(0);
    const type = TYPE_MAP[typeChar];
    if (!type) return null;

    const encodedId = code.substring(1);
    let n = 0;
    for (let i = 0; i < encodedId.length; i++) {
      const idx = ALPHABET.indexOf(encodedId[i]);
      if (idx === -1) throw new Error("Invalid char");
      n = n * 62 + idx;
    }
    
    const id = (n ^ SALT).toString();
    return { type, id };
  } catch (e) {
    // Fallback for old links or non-numeric
    try {
      const normalB64 = code.split("").reverse().join("");
      let padded = normalB64.replace(/-/g, "+").replace(/_/g, "/");
      while (padded.length % 4 !== 0) padded += "=";
      const decoded = atob(padded);
      const typeChar = decoded.charAt(0);
      const id = decoded.substring(1);
      const type = TYPE_MAP[typeChar];
      if (type && id) return { type, id };
    } catch (e2) {}
    return null;
  }
}

/**
 * Encodes a type and id into a "nice" looking short string.
 */
export function encodeShare(type: ShareType, id: string | number): string {
  return encodeContentId(type, id);
}

/**
 * Decodes a shared string back into type and id.
 */
export function decodeShare(code: string): { type: ShareType; id: string } | null {
  return decodeContentId(code);
}

/**
 * Gets the relative share path for a specific content
 */
export function getSharePath(type: ShareType, id: string | number): string {
  return `/s/${encodeShare(type, id)}`;
}

/**
 * Gets the full share URL
 */
export function getFullShareUrl(type: ShareType, id: string | number): string {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  return `${origin}${getSharePath(type, id)}`;
}
