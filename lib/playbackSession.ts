export type PlaybackRepeatMode = "off" | "all" | "one";
export type PlaybackQuality = "low" | "medium" | "high";

export interface PersistedPlaybackArtist {
  id: string | number;
  name: string;
  uniqueId?: string;
}

export interface PersistedPlaybackTrack {
  id: string;
  title: string;
  artist: string;
  artistId?: string | number;
  artistUniqueId?: string;
  featuredArtists?: PersistedPlaybackArtist[];
  image: string;
  duration: string;
  durationSeconds?: number;
  src: string;
  isLiked?: boolean;
  likesCount?: number;
  isPreview?: boolean;
  previewUrl?: string;
}

export interface PersistedPlaybackSession {
  version: 1;
  owner: string;
  savedAt: number;
  queue: PersistedPlaybackTrack[];
  currentIndex: number;
  positionSeconds: number;
  mediaDurationSeconds: number;
  wasPlaying: boolean;
  isVisible: boolean;
  isExpanded: boolean;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: PlaybackRepeatMode;
  quality: PlaybackQuality;
}

const STORAGE_NAMESPACE = "sedabox:playback-session:v1";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_QUEUE_ITEMS = 500;
const MAX_TEXT_LENGTH = 512;
const MAX_URL_LENGTH = 4096;

function storageKey(owner: string): string {
  return `${STORAGE_NAMESPACE}:${encodeURIComponent(owner)}`;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cleanText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function cleanOptionalText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | undefined {
  const result = cleanText(value, maxLength);
  return result || undefined;
}

function cleanIdentifier(value: unknown): string | number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) return value.slice(0, 128);
  return undefined;
}

function cleanUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const candidate = value.trim().slice(0, MAX_URL_LENGTH);
  if (!candidate) return "";
  if (/^(?:javascript|data|blob):/i.test(candidate)) return "";
  if (/^http:\/\//i.test(candidate)) return candidate.replace(/^http:\/\//i, "https://");
  if (/^(?:https:\/\/|\/)/i.test(candidate)) return candidate;
  return "";
}

function sanitizeTrack(candidate: unknown): PersistedPlaybackTrack | null {
  if (!candidate || typeof candidate !== "object") return null;
  const raw = candidate as Record<string, unknown>;
  const id = cleanText(raw.id, 128);
  const title = cleanText(raw.title);
  const artist = cleanText(raw.artist);
  if (!id || !title || !artist) return null;

  const durationSeconds = finiteNumber(raw.durationSeconds, 0);
  const likesCount = finiteNumber(raw.likesCount, 0);
  const featuredArtists = Array.isArray(raw.featuredArtists)
    ? raw.featuredArtists
        .slice(0, 20)
        .map<PersistedPlaybackArtist | null>((artistCandidate) => {
          if (!artistCandidate || typeof artistCandidate !== "object") return null;
          const artistRaw = artistCandidate as Record<string, unknown>;
          const artistId = cleanIdentifier(artistRaw.id);
          const name = cleanText(artistRaw.name);
          if (artistId === undefined || !name) return null;
          return {
            id: artistId,
            name,
            uniqueId: cleanOptionalText(artistRaw.uniqueId, 128),
          } satisfies PersistedPlaybackArtist;
        })
        .filter((artist): artist is PersistedPlaybackArtist => artist !== null)
    : undefined;

  return {
    id,
    title,
    artist,
    artistId: cleanIdentifier(raw.artistId),
    artistUniqueId: cleanOptionalText(raw.artistUniqueId, 128),
    featuredArtists: featuredArtists?.length ? featuredArtists : undefined,
    image: cleanUrl(raw.image),
    duration: cleanText(raw.duration, 32),
    durationSeconds: durationSeconds > 0 ? durationSeconds : undefined,
    src: cleanUrl(raw.src),
    isLiked: typeof raw.isLiked === "boolean" ? raw.isLiked : undefined,
    likesCount: likesCount >= 0 ? likesCount : undefined,
    isPreview: typeof raw.isPreview === "boolean" ? raw.isPreview : undefined,
    previewUrl: cleanUrl(raw.previewUrl) || undefined,
  };
}

function normalizeSession(candidate: unknown, expectedOwner: string): PersistedPlaybackSession | null {
  if (!candidate || typeof candidate !== "object") return null;
  const raw = candidate as Record<string, unknown>;
  if (raw.version !== 1 || raw.owner !== expectedOwner) return null;

  const savedAt = finiteNumber(raw.savedAt, 0);
  if (!savedAt || Date.now() - savedAt > SESSION_TTL_MS || savedAt > Date.now() + 60_000) {
    return null;
  }

  if (!Array.isArray(raw.queue)) return null;
  const queue = raw.queue
    .slice(0, MAX_QUEUE_ITEMS)
    .map(sanitizeTrack)
    .filter((track): track is PersistedPlaybackTrack => Boolean(track));
  if (!queue.length) return null;

  const currentIndex = clamp(Math.trunc(finiteNumber(raw.currentIndex, 0)), 0, queue.length - 1);
  const mediaDurationSeconds = Math.max(0, finiteNumber(raw.mediaDurationSeconds, 0));
  let positionSeconds = Math.max(0, finiteNumber(raw.positionSeconds, 0));
  const trackDuration = queue[currentIndex]?.durationSeconds || mediaDurationSeconds;
  if (trackDuration > 0) {
    positionSeconds = Math.min(positionSeconds, trackDuration);
    if (trackDuration - positionSeconds <= 2) positionSeconds = 0;
  }
  if (queue[currentIndex]?.isPreview) {
    positionSeconds = Math.min(positionSeconds, 30);
  }

  const repeatMode: PlaybackRepeatMode =
    raw.repeatMode === "off" || raw.repeatMode === "one" ? raw.repeatMode : "all";
  const quality: PlaybackQuality =
    raw.quality === "low" || raw.quality === "high" ? raw.quality : "medium";

  return {
    version: 1,
    owner: expectedOwner,
    savedAt,
    queue,
    currentIndex,
    positionSeconds,
    mediaDurationSeconds,
    wasPlaying: raw.wasPlaying === true,
    isVisible: raw.isVisible !== false,
    isExpanded: raw.isExpanded === true,
    volume: clamp(finiteNumber(raw.volume, 0.8), 0, 1),
    isMuted: raw.isMuted === true,
    isShuffle: raw.isShuffle === true,
    repeatMode,
    quality,
  };
}

export function playbackAudienceKey(userId?: string | number | null): string {
  return userId === null || userId === undefined || userId === ""
    ? "guest"
    : `user:${String(userId)}`;
}

export function readPlaybackSession(owner: string): PersistedPlaybackSession | null {
  if (typeof window === "undefined") return null;
  const key = storageKey(owner);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const session = normalizeSession(JSON.parse(raw), owner);
    if (!session) window.localStorage.removeItem(key);
    return session;
  } catch {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage can be unavailable in hardened/private browser modes.
    }
    return null;
  }
}

export function writePlaybackSession(session: PersistedPlaybackSession): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(storageKey(session.owner), JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function clearPlaybackSession(owner: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(owner));
  } catch {
    // Ignore storage access failures. Playback itself must keep working.
  }
}

export function compactPlaybackQueue<T>(
  queue: T[],
  currentIndex: number,
  maxItems = MAX_QUEUE_ITEMS,
): { queue: T[]; currentIndex: number } {
  if (queue.length <= maxItems) {
    return {
      queue: [...queue],
      currentIndex: clamp(Math.trunc(currentIndex), 0, Math.max(0, queue.length - 1)),
    };
  }

  const safeIndex = clamp(Math.trunc(currentIndex), 0, queue.length - 1);
  const half = Math.floor(maxItems / 2);
  let start = Math.max(0, safeIndex - half);
  let end = Math.min(queue.length, start + maxItems);
  start = Math.max(0, end - maxItems);
  return {
    queue: queue.slice(start, end),
    currentIndex: safeIndex - start,
  };
}
