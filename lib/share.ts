const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SALT = 0x5EAB0; // SedaBox

export type ShareType = 'song' | 'artist' | 'album' | 'playlist' | 'user-playlist';

const typeToChar: Record<ShareType, string> = {
  'song': 's',
  'artist': 'a',
  'album': 'l',
  'playlist': 'p',
  'user-playlist': 'u'
};

const charToType: Record<string, ShareType> = {
  's': 'song',
  'a': 'artist',
  'l': 'album',
  'p': 'playlist',
  'u': 'user-playlist'
};

function encodeId(num: number): string {
  // Simple obfuscation: XOR with salt
  let n = num ^ SALT;
  let str = "";
  while (n > 0) {
    str = ALPHABET[n % 62] + str;
    n = Math.floor(n / 62);
  }
  return str || "0";
}

function decodeId(str: string): number {
  let num = 0;
  for (let char of str) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) return 0;
    num = num * 62 + idx;
  }
  return num ^ SALT;
}

export function generateShareCode(type: ShareType, id: number | string): string {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId)) return '';
  return typeToChar[type] + encodeId(numericId);
}

export function parseShareCode(code: string): { type: ShareType, id: number } | null {
  if (!code || code.length < 2) return null;
  const char = code[0];
  const type = charToType[char];
  if (!type) return null;
  const idStr = code.slice(1);
  const id = decodeId(idStr);
  return { type, id };
}

export function getShareUrl(type: ShareType, id: number | string): string {
  const code = generateShareCode(type, id);
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}/s/${code}`;
  }
  return `/s/${code}`;
}
