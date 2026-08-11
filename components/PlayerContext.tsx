"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import { useGuestAccess } from "./GuestAccessContext";
import dynamic from "next/dynamic";
// hls.js is heavy (~200 KB) — import it lazily the first time HLS playback is needed.
// import Hls from "hls.js";
import { toast } from "react-hot-toast";
import { useI18n } from "./I18nContext";
import { getPlayerFeaturedArtists, getSongDisplayTitle } from "../lib/songDisplay";
import type {
  DownloadFlowStatus,
  DownloadQuality,
  DownloadQualityOption,
} from "./DownloadFlowModal";

const DownloadFlowModal = dynamic(() => import("./DownloadFlowModal"), {
  ssr: false,
  loading: () => null,
});
import {
  clearPlaybackSession,
  compactPlaybackQueue,
  type PersistedPlaybackSession,
  playbackAudienceKey,
  readPlaybackSession,
  writePlaybackSession,
} from "../lib/playbackSession";

// Ensure any URL coming from the server uses HTTPS where possible.
function ensureHttps(u?: string | null): string | undefined {
  if (!u) return u ?? undefined;
  try {
    if (/^\/\//.test(u)) return "https:" + u;
    if (/^http:\/\//i.test(u)) return u.replace(/^http:\/\//i, "https://");
  } catch (e) {
    // ignore
  }
  return u;
}

const GUEST_PREVIEW_DURATION_SECONDS = 30;
const PLAYBACK_PERSIST_DEBOUNCE_MS = 900;

interface PlayAtIndexOptions {
  startAtSeconds?: number;
  shouldPlay?: boolean;
  restoring?: boolean;
}

interface PlaybackSnapshot {
  queue: Track[];
  currentIndex: number;
  positionSeconds: number;
  mediaDurationSeconds: number;
  wasPlaying: boolean;
  isLoading: boolean;
  isVisible: boolean;
  isExpanded: boolean;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: "off" | "all" | "one";
  quality: "low" | "medium" | "high";
}

function formatTrackDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function asGuestPreviewTrack(track: Track, previewSeconds?: number): Track {
  const requested = Number(previewSeconds || track.durationSeconds || GUEST_PREVIEW_DURATION_SECONDS);
  const durationSeconds = Math.min(
    GUEST_PREVIEW_DURATION_SECONDS,
    Number.isFinite(requested) && requested > 0 ? requested : GUEST_PREVIEW_DURATION_SECONDS,
  );
  return {
    ...track,
    isPreview: true,
    durationSeconds,
    duration: formatTrackDuration(durationSeconds),
  };
}

function waitForAudioReady(
  audio: HTMLAudioElement,
  signal: AbortSignal,
  timeoutMs = 15000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer = 0;
    const cleanup = () => {
      window.clearTimeout(timer);
      audio.removeEventListener("loadedmetadata", ready);
      audio.removeEventListener("canplay", ready);
      audio.removeEventListener("error", failed);
      signal.removeEventListener("abort", aborted);
    };
    const ready = () => {
      cleanup();
      resolve();
    };
    const failed = () => {
      cleanup();
      reject(new Error("AUDIO_SOURCE_LOAD_FAILED"));
    };
    const aborted = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };
    timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("AUDIO_SOURCE_LOAD_TIMEOUT"));
    }, timeoutMs);
    audio.addEventListener("loadedmetadata", ready, { once: true });
    audio.addEventListener("canplay", ready, { once: true });
    audio.addEventListener("error", failed, { once: true });
    signal.addEventListener("abort", aborted, { once: true });
  });
}

export interface Ad {
  id: number;
  title: string;
  audio_url: string;
  image_cover: string | null;
  navigate_link: string | null;
  duration: number;
  skippable_after: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: number | string;
  artistUniqueId?: string;
  featuredArtists?: Array<{
    id: number | string;
    name: string;
    uniqueId?: string;
  }>;
  image: string;
  duration: string;
  durationSeconds?: number;
  src: string;
  isLiked?: boolean;
  likesCount?: number;
  lyrics?: string;
  isPreview?: boolean;
  previewUrl?: string;
}

interface PlayerContextType {
  // State
  currentTrack: Track | null;
  previousTrack: Track | null;
  nextTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  isExpanded: boolean;
  isVisible: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  isShuffle: boolean;
  repeatMode: "off" | "all" | "one";
  quality: "low" | "medium" | "high";
  uniqueOtplayId: string | null;
  isLiked: boolean;
  likesCount: number;
  isLiking: boolean;
  lyrics: string | null;
  isAdPlaying: boolean;
  currentAd: Ad | null;

  // Actions
  playTrack: (track: Track) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  expand: () => void;
  collapse: () => void;
  toggleExpand: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  cycleQuality: () => void;
  setQuality: (quality: "low" | "medium" | "high") => Promise<void>;
  next: () => void;
  previous: () => void;
  toggleLike: () => Promise<void>;
  download: (track?: Track, preferredQuality?: DownloadQuality) => Promise<void>;
  close: () => void;
  reorderQueue: (newQueue: Track[]) => void;
  shuffleQueue: () => void;
}

interface PlayerActionsContextType {
  playTrack: PlayerContextType["playTrack"];
  setQueue: PlayerContextType["setQueue"];
  setQuality: PlayerContextType["setQuality"];
}

interface PlayerLayoutContextType {
  isVisible: boolean;
  isExpanded: boolean;
  hasCollapsedPlayer: boolean;
}

interface PlayerPlaybackContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: PlayerContextType["playTrack"];
  setQueue: PlayerContextType["setQueue"];
  togglePlay: PlayerContextType["togglePlay"];
  download: PlayerContextType["download"];
}

const PlayerContext = createContext<PlayerContextType | null>(null);
const PlayerActionsContext = createContext<PlayerActionsContextType | null>(null);
const PlayerLayoutContext = createContext<PlayerLayoutContextType | null>(null);
const PlayerPlaybackContext = createContext<PlayerPlaybackContextType | null>(null);

export function usePlayerLayoutState() {
  const context = useContext(PlayerLayoutContext);
  if (!context) {
    throw new Error("usePlayerLayoutState must be used within a PlayerProvider");
  }
  return context;
}

export function usePlayerPlayback() {
  const context = useContext(PlayerPlaybackContext);
  if (!context) {
    throw new Error("usePlayerPlayback must be used within a PlayerProvider");
  }
  return context;
}

export function usePlayerActions() {
  const context = useContext(PlayerActionsContext);
  if (!context) {
    throw new Error("usePlayerActions must be used within a PlayerProvider");
  }
  return context;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueueState] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("all");
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");
  const [uniqueOtplayId, setUniqueOtplayId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isAdPlaying, setIsAdPlaying] = useState<boolean>(false);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [userLocation, setUserLocation] = useState({
    country: "Unknown",
    city: "Unknown",
  });
  const [downloadTrack, setDownloadTrack] = useState<Track | null>(null);
  const [downloadOptions, setDownloadOptions] = useState<
    DownloadQualityOption[]
  >([]);
  const [selectedDownloadQuality, setSelectedDownloadQuality] =
    useState<DownloadQuality | null>(null);
  const [downloadStatus, setDownloadStatus] =
    useState<DownloadFlowStatus>("ready");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadLoadedBytes, setDownloadLoadedBytes] = useState(0);
  const [downloadTotalBytes, setDownloadTotalBytes] = useState<number | null>(
    null,
  );
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<any>(null);
  const {
    accessToken,
    authenticatedFetch,
    formatErrorMessage,
    user: authUser,
    isInitializing: isAuthInitializing,
  } = useAuth();
  const { requestAuth } = useGuestAccess();
  const { t } = useI18n();
  // mirror accessToken in a ref so long-lived handlers always see latest value
  const accessTokenRef = useRef<string | null>(accessToken || null);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    const savedQuality = authUser?.stream_quality;
    if (savedQuality === "medium" || savedQuality === "high") {
      setQuality(savedQuality);
    }
  }, [authUser?.stream_quality]);
  // play counting refs
  const playSecondsRef = useRef<number>(0);
  const lastCountedSecondRef = useRef<number>(-1);
  const isUserSeekingRef = useRef<boolean>(false);
  const submitInProgressRef = useRef<boolean>(false);
  // keep a ref mirror so long-lived event handlers see latest value
  const uniqueOtplayIdRef = useRef<string | null>(null);
  const lastSubmitAttemptRef = useRef<number | null>(null);
  const isActuallyPlayingRef = useRef<boolean>(false);
  const submittedForCurrentRef = useRef<boolean>(false);
  const submittedUidsRef = useRef<Set<string>>(new Set());
  const resolvedUrlsRef = useRef<Map<string, string>>(new Map());
  const userLocationRef = useRef({ country: "Unknown", city: "Unknown" });
  const isAdPlayingRef = useRef<boolean>(false);
  const adSubmitIdRef = useRef<string | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const previewRefreshAttemptsRef = useRef<Set<string>>(new Set());
  const downloadAbortRef = useRef<AbortController | null>(null);
  const qualitySwitchAbortRef = useRef<AbortController | null>(null);
  const qualitySwitchSequenceRef = useRef(0);
  const playbackRequestSequenceRef = useRef(0);
  const restorationAbortRef = useRef<AbortController | null>(null);
  const pendingRestoredPlaybackRef = useRef<PlayAtIndexOptions | null>(null);
  const pendingPlaybackSessionRef = useRef<PersistedPlaybackSession | null>(null);
  const restoredAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const playbackHydrationAttemptedRef = useRef(false);
  const playbackPersistenceReadyRef = useRef(false);
  const playbackAudienceRef = useRef<string | null>(null);
  const playbackPersistTimerRef = useRef<number | null>(null);
  const skipShuffleEffectOnceRef = useRef(false);
  const playbackSnapshotRef = useRef<PlaybackSnapshot>({
    queue: [],
    currentIndex: 0,
    positionSeconds: 0,
    mediaDurationSeconds: 0,
    wasPlaying: false,
    isLoading: false,
    isVisible: false,
    isExpanded: false,
    volume: 0.8,
    isMuted: false,
    isShuffle: false,
    repeatMode: "all",
    quality: "medium",
  });

  // Derived state for current, previous, and next tracks
  const currentTrack = useMemo(
    () => queue[currentIndex] || null,
    [queue, currentIndex],
  );

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Keep ref mirrored to latest isPlaying state for long-lived handlers
  useEffect(() => {
    isActuallyPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Listen for external like-change events (from drawers or other UI)
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent)?.detail;
        if (!detail || !detail.id) return;
        const sid = String(detail.id);
        const liked = detail.liked;
        const likes_count = detail.likes_count;

        // Update current track like state if it matches
        if (currentTrack && String(currentTrack.id) === sid) {
          if (liked !== undefined) setIsLiked(Boolean(liked));
          if (likes_count !== undefined) setLikesCount(Number(likes_count));
        }

        // Update queue entries immutably so consumers re-render
        setQueueState((prev) => {
          if (!prev || prev.length === 0) return prev;
          let changed = false;
          const next = prev.map((t) => {
            if (String(t.id) === sid) {
              changed = true;
              return {
                ...t,
                isLiked: liked !== undefined ? Boolean(liked) : t.isLiked,
                likesCount:
                  likes_count !== undefined
                    ? Number(likes_count)
                    : t.likesCount,
              };
            }
            return t;
          });
          return changed ? next : prev;
        });
      } catch (err) {
        console.error("Error handling song-like-changed event:", err);
      }
    };

    window.addEventListener("song-like-changed", handler as EventListener);
    return () =>
      window.removeEventListener("song-like-changed", handler as EventListener);
  }, [currentTrack]);
  const previousTrack = useMemo(() => {
    if (queue.length === 0) return null;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    return queue[prevIndex] || null;
  }, [queue, currentIndex]);
  const nextTrack = useMemo(() => {
    if (queue.length === 0) return null;
    const nextIndex = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    return queue[nextIndex] || null;
  }, [queue, currentIndex]);

  // Initialize Audio object
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio();
      audioRef.current = audio;

      const handleTimeUpdate = () => {
        const currentTime = audio.currentTime;
        setProgress(currentTime);

        try {
          // Check if we already successfully submitted for this specific play session
          const currentUid = uniqueOtplayIdRef.current;
          if (currentUid && submittedUidsRef.current.has(currentUid)) {
            return;
          }

          // Only count when audio is actually playing and not paused
          if (!audio.paused && !isUserSeekingRef.current) {
            const currentSecond = Math.floor(currentTime);
            const last = lastCountedSecondRef.current;
            // only increment when time advances by at least 1 second forward
            if (currentSecond > last) {
              // avoid counting huge jumps caused by drag/seek
              if (currentSecond - last <= 3) {
                playSecondsRef.current += currentSecond - last;
                // log each second individually for debugging
                for (let s = last + 1; s <= currentSecond; s++) {
                  const relative = playSecondsRef.current - (currentSecond - s);
                  console.log("play-seconds", { second: relative });
                }
              } else {
                // big jump -> do not count intermediate seconds, treat as user jump
                console.log(
                  "play-seconds: large jump detected, not counting intermediate seconds",
                  { from: last, to: currentSecond },
                );
              }
              lastCountedSecondRef.current = currentSecond;
            }

            // When we've accumulated at least 60 seconds, submit and reset counter
            if (playSecondsRef.current >= 60 && !submitInProgressRef.current) {
              submitInProgressRef.current = true;
              (async () => {
                // helper: wait up to timeoutMs for uid to appear
                const waitForUid = async (timeoutMs = 5000, interval = 250) => {
                  const start = Date.now();
                  while (Date.now() - start < timeoutMs) {
                    if (uniqueOtplayIdRef.current)
                      return uniqueOtplayIdRef.current;
                    await new Promise((r) => setTimeout(r, interval));
                  }
                  return null;
                };

                let uid = uniqueOtplayIdRef.current;
                if (!uid) {
                  const now = Date.now();
                  // throttle repeated attempts to avoid spamming when uid never appears
                  if (
                    lastSubmitAttemptRef.current &&
                    now - lastSubmitAttemptRef.current < 10000
                  ) {
                    console.warn(
                      "No uid available and last attempt was recent; deferring submit",
                    );
                    submitInProgressRef.current = false;
                    return;
                  }
                  lastSubmitAttemptRef.current = now;
                  uid = await waitForUid(5000, 250);
                  if (!uid) {
                    console.warn(
                      "No unique_otplay_id after wait; will retry later",
                    );
                    submitInProgressRef.current = false;
                    return;
                  }
                }

                try {
                  const url = "https://api.sedabox.com/api/play/count/";
                  const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                  };
                  if (accessTokenRef.current)
                    headers["Authorization"] =
                      `Bearer ${accessTokenRef.current}`;
                  const body = JSON.stringify({
                    unique_otplay_id: uid,
                    city: userLocationRef.current.city,
                    country: userLocationRef.current.country,
                  });
                  console.log("Submitting play count body:", body);
                  const resp = await fetch(url, {
                    method: "POST",
                    headers,
                    body,
                  });
                  let respText = null;
                  try {
                    respText = await resp.text();
                  } catch (e) {
                    respText = null;
                  }
                  console.log("Play count submitted", {
                    status: resp.status,
                    body: respText,
                  });

                  if (resp.status === 200) {
                    if (uid) {
                      submittedUidsRef.current.add(uid);
                      console.log(
                        "UID marked as submitted, stopping further counts for this session",
                        { uid },
                      );
                    }
                  }
                } catch (err) {
                  console.error("Failed to submit play count:", err);
                } finally {
                  // reset so next 60s block can be submitted again
                  playSecondsRef.current = 0;
                  submitInProgressRef.current = false;
                }
              })();
            }
          }
        } catch (err) {
          console.warn("Error in timeupdate counting logic:", err);
        }
      };

      const handleLoadedMetadata = () => {
        const activeTrack = currentTrackRef.current;
        const mediaDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
        const safeDuration =
          !accessTokenRef.current && activeTrack?.isPreview
            ? Math.min(
                GUEST_PREVIEW_DURATION_SECONDS,
                mediaDuration || activeTrack.durationSeconds || GUEST_PREVIEW_DURATION_SECONDS,
              )
            : mediaDuration;
        setDuration(safeDuration);
        setIsLoading(false);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      const handleCanPlay = () => {
        setIsLoading(false);
      };

      const handleError = async (e: Event) => {
        const track = currentTrackRef.current;
        try {
          const mediaErr = audio.error;
          if (mediaErr) {
            console.error("Audio MediaError:", {
              code: mediaErr.code,
              message: (mediaErr as any).message || null,
            });
          } else {
            console.error("Audio error event:", e);
          }

          if (!navigator.onLine) {
            if (isActuallyPlayingRef.current || track) {
              toast.error("خطا در شبکه: اتصال اینترنت قطع شده است.", {
                id: "network-error-event",
                duration: 3000,
              });
            }
            setIsLoading(false);
            setIsPlaying(false);
            return;
          }

          // Guest preview URLs are signed and may expire while sitting in a
          // queue. Refresh the public song payload once per failed URL and
          // retry transparently before showing an error.
          if (!accessTokenRef.current && track?.isPreview) {
            const retryKey = `${track.id}:${track.src}`;
            if (!previewRefreshAttemptsRef.current.has(retryKey)) {
              previewRefreshAttemptsRef.current.add(retryKey);
              setIsLoading(true);
              try {
                const response = await fetch(
                  `https://api.sedabox.com/api/songs/${track.id}/`,
                  { headers: { Accept: "application/json" } },
                );
                if (response.ok) {
                  const data = await response.json();
                  const refreshedSrc = ensureHttps(
                    data.preview_url || data.stream_url || "",
                  ) as string;
                  if (refreshedSrc) {
                    const refreshedTrack = asGuestPreviewTrack({
                      ...track,
                      src: refreshedSrc,
                      previewUrl: refreshedSrc,
                    });
                    currentTrackRef.current = refreshedTrack;
                    setQueueState((previous) =>
                      previous.map((item) =>
                        String(item.id) === String(track.id)
                          ? refreshedTrack
                          : item,
                      ),
                    );
                    audio.src = refreshedSrc;
                    audio.load();
                    await audio.play();
                    setIsPlaying(true);
                    setIsLoading(false);
                    return;
                  }
                }
              } catch (refreshError) {
                console.error("Failed to refresh guest preview:", refreshError);
              }
            }
            toast.error("پیش‌نمایش در دسترس نیست؛ کمی بعد دوباره تلاش کنید.");
          }
        } catch (err) {
          console.error("Error while processing audio error event:", err, e);
        }
        setIsLoading(false);
        setIsPlaying(false);
      };

      const handleStalled = () => {
        console.warn("Audio stalled");
        if (
          !navigator.onLine &&
          (isActuallyPlayingRef.current || currentTrackRef.current)
        ) {
          toast.error("اتصال اینترنت قطع شد. پخش متوقف شد.", {
            id: "network-error-stalled",
            duration: 3000,
          });
        }
      };

      const handleWaiting = () => {
        console.warn("Audio waiting");
        // If navigator is offline and we're trying to play or waiting to load
        if (!navigator.onLine && isActuallyPlayingRef.current) {
          toast.error("در حال انتظار برای اتصال اینترنت...", {
            id: "network-error-waiting",
            duration: 3000,
          });
        }
      };

      const handleSuspend = () => console.warn("Audio suspend");

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);
      audio.addEventListener("stalled", handleStalled);
      audio.addEventListener("waiting", handleWaiting);
      audio.addEventListener("suspend", handleSuspend);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
        audio.removeEventListener("stalled", handleStalled);
        audio.removeEventListener("waiting", handleWaiting);
        audio.removeEventListener("suspend", handleSuspend);
        audio.pause();
        audio.src = "";
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }
  }, []);

  // Internal function to play a track at a specific index
  const playAtIndex = useCallback(
    async (
      index: number,
      queueToUse?: Track[],
      bypassAdCheckData?: any,
      options?: PlayAtIndexOptions,
    ) => {
      const requestSequence = ++playbackRequestSequenceRef.current;
      qualitySwitchAbortRef.current?.abort();
      qualitySwitchAbortRef.current = null;
      restorationAbortRef.current?.abort();
      const restorationController = options?.restoring
        ? new AbortController()
        : null;
      restorationAbortRef.current = restorationController;
      const q = queueToUse || queue;
      const track = q[index];
      if (!track || !audioRef.current) return;
      currentTrackRef.current = track;
      pendingRestoredPlaybackRef.current = null;
      if (!options?.restoring) {
        pendingPlaybackSessionRef.current = null;
        restoredAudioElementRef.current = null;
      }
      const requestedStartAt = Math.max(
        0,
        Number.isFinite(options?.startAtSeconds)
          ? Number(options?.startAtSeconds)
          : 0,
      );
      const shouldStartPlayback = options?.shouldPlay !== false;
      if (!track.src) {
        toast.error(
          accessTokenRef.current
            ? "فایل پخش این آهنگ در دسترس نیست."
            : "پیش‌نمایش این آهنگ هنوز آماده نشده است.",
        );
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsVisible(true);
      setProgress(requestedStartAt);

      // Reset UID and counters for the new track/session
      if (!bypassAdCheckData) {
        setIsAdPlaying(false);
        isAdPlayingRef.current = false;
        setCurrentAd(null);
        adSubmitIdRef.current = null;
      }

      setUniqueOtplayId(null);
      uniqueOtplayIdRef.current = null;
      playSecondsRef.current = 0;
      lastCountedSecondRef.current = -1;

      // Never flash the full song duration for guests while the signed
      // 30-second preview URL is being resolved.
      if (!accessTokenRef.current) {
        const previewTrack = asGuestPreviewTrack(track);
        setDuration(previewTrack.durationSeconds || GUEST_PREVIEW_DURATION_SECONDS);
      } else {
        setDuration(track.durationSeconds || 0);
      }

      // Set like state from track
      setIsLiked(!!track.isLiked);
      setLikesCount(track.likesCount || 0);
      setIsLiking(false);
      setLyrics(track.lyrics || null);

      // Fetch full details (including lyrics) in background
      (async () => {
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (accessTokenRef.current)
            headers["Authorization"] = `Bearer ${accessTokenRef.current}`;
          const resp = await fetch(
            `https://api.sedabox.com/api/songs/${track.id}/`,
            { headers },
          );
          if (resp.ok) {
            const data = await resp.json();
            setLyrics(data.lyrics || null);
            // Also update the track in queue to cache the lyrics and latest data
            setQueueState((prev) =>
              prev.map((t) =>
                String(t.id) === String(track.id)
                  ? {
                      ...t,
                      lyrics: data.lyrics || t.lyrics,
                      image:
                        ensureHttps(data.image) ||
                        ensureHttps(data.image_cover) ||
                        t.image,
                      title: getSongDisplayTitle(data) || t.title,
                      artist:
                        data.artist?.name ||
                        data.artist_name ||
                        data.artist ||
                        t.artist,
                      artistId: data.artist_id || data.artist?.id || t.artistId,
                      artistUniqueId:
                        data.artist_unique_id ||
                        data.artist?.unique_id ||
                        t.artistUniqueId,
                      featuredArtists: Array.isArray(data.featured_artists)
                        ? getPlayerFeaturedArtists(data)
                        : t.featuredArtists,
                    }
                  : t,
              ),
            );
            // Update like state too
            setIsLiked(data.is_liked);
            setLikesCount(data.likes_count);
          }
        } catch (err) {
          console.error("Failed to fetch song details for player:", err);
        }
      })();

      let initialSrc = (ensureHttps(track.src) as string) || track.src;
      let resolvedSrc = initialSrc;

      try {
        if (bypassAdCheckData) {
          console.debug(
            "Bypassing ad check, playing from provided data:",
            bypassAdCheckData,
          );
          const data = bypassAdCheckData;
          // extract unique play id if present
          const uid =
            data.unique_otplay_id || data.uniqueOtplayId || data.unique || null;
          if (uid && typeof uid === "string") {
            setUniqueOtplayId(uid);
            uniqueOtplayIdRef.current = uid;
            playSecondsRef.current = 0;
            lastCountedSecondRef.current = -1;
          }
          const candidate =
            data.stream_url ||
            data.url ||
            data.file ||
            data.stream ||
            (data.data && (data.data.stream_url || data.data.url));
          if (candidate && typeof candidate === "string") {
            resolvedSrc = candidate;
          }
        } else if (!accessTokenRef.current) {
          // A queue may survive logout. If it still contains a protected stream
          // wrapper, exchange it for the current public preview before playing.
          if (!track.isPreview) {
            const response = await fetch(
              `https://api.sedabox.com/api/songs/${track.id}/`,
              { headers: { Accept: "application/json" } },
            );
            if (!response.ok) throw new Error("Unable to load guest preview");
            const data = await response.json();
            const previewSrc = ensureHttps(
              data.preview_url || data.stream_url || "",
            ) as string;
            if (!previewSrc) {
              toast.error("پیش‌نمایش این آهنگ هنوز آماده نشده است.");
              setIsLoading(false);
              return;
            }
            initialSrc = previewSrc;
            resolvedSrc = previewSrc;
            const guestTrack = asGuestPreviewTrack(
              {
                ...track,
                src: previewSrc,
                previewUrl: previewSrc,
              },
              data.preview_duration_seconds,
            );
            setDuration(guestTrack.durationSeconds || GUEST_PREVIEW_DURATION_SECONDS);
            currentTrackRef.current = guestTrack;
            setQueueState((previous) =>
              previous.map((item) =>
                String(item.id) === String(track.id) ? guestTrack : item,
              ),
            );
          } else {
            // Guest tracks already point to a signed 30-second media file.
            resolvedSrc = initialSrc;
          }
        } else {
          // A queue may survive login. Upgrade a guest preview to the protected
          // full-stream wrapper before resolving it.
          if (track.isPreview) {
            const response = await fetch(
              `https://api.sedabox.com/api/songs/${track.id}/`,
              {
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${accessTokenRef.current}`,
                },
              },
            );
            if (!response.ok) throw new Error("Unable to upgrade preview stream");
            const data = await response.json();
            const fullStream = ensureHttps(data.stream_url || "") as string;
            if (!fullStream) throw new Error("Full stream is unavailable");
            initialSrc = fullStream;
            resolvedSrc = fullStream;
            const fullTrack = {
              ...track,
              src: fullStream,
              isPreview: false,
            };
            currentTrackRef.current = fullTrack;
            setQueueState((previous) =>
              previous.map((item) =>
                String(item.id) === String(track.id) ? fullTrack : item,
              ),
            );
          }

          // Authenticated tracks use the protected unwrap endpoint.
          try {
            console.debug("Requesting stream API (needs auth):", initialSrc);
            const headers: Record<string, string> = {};
            if (accessTokenRef.current)
              headers["Authorization"] = `Bearer ${accessTokenRef.current}`;

            let resp = await fetch(initialSrc, {
              method: "GET",
              mode: "cors",
              headers,
            });

            // Always capture and log the response body for this stream token request
            let respText: string | null = null;
            try {
              respText = await resp.clone().text();
            } catch (e) {
              respText = null;
            }
            console.debug("Stream API response:", {
              status: resp.status,
              statusText: resp.statusText,
              body: respText,
              headers: Array.from(resp.headers.entries()),
            });

            // If server indicates this stream URL has already been used (413) and provides a new_stream_url, follow it
            if (resp.status === 413) {
              try {
                const parsed = respText ? JSON.parse(respText) : null;
                let newUrl =
                  parsed && (parsed.new_stream_url || parsed.new_stream_uri);
                if (newUrl && typeof newUrl === "string") {
                  try {
                    // If newUrl is relative, resolve against the initial source origin
                    if (/^\//.test(newUrl)) {
                      try {
                        const base = new URL(initialSrc).origin;
                        newUrl = base + newUrl;
                      } catch (e) {
                        // fallback: leave as-is
                      }
                    }

                    // Normalize to HTTPS to avoid preflight redirect issues
                    // normalize any server-provided URL
                    newUrl = (ensureHttps(newUrl) as string) || newUrl;
                    if (/^https?:\/\//i.test(newUrl)) {
                      console.debug(
                        "Normalized new_stream_url to HTTPS:",
                        newUrl,
                      );
                    }

                    console.debug(
                      "Stream token expired. Fetching new stream URL (normalized):",
                      newUrl,
                    );
                    const resp2 = await fetch(newUrl, {
                      method: "GET",
                      mode: "cors",
                      headers,
                    });
                    let resp2Text: string | null = null;
                    try {
                      resp2Text = await resp2.clone().text();
                    } catch (e) {
                      resp2Text = null;
                    }
                    console.debug("Stream API (follow) response:", {
                      status: resp2.status,
                      statusText: resp2.statusText,
                      body: resp2Text,
                      headers: Array.from(resp2.headers.entries()),
                    });
                    resp = resp2;
                    respText = resp2Text;
                  } catch (innerErr) {
                    console.warn(
                      "Failed to fetch normalized new_stream_url:",
                      innerErr,
                    );
                  }
                }
              } catch (err) {
                console.warn("Failed to follow new_stream_url:", err);
              }
            }

            if (resp.status === 401) {
              console.error(
                "Stream API returned 401 Unauthorized for",
                initialSrc,
              );
              setIsLoading(false);
              setIsPlaying(false);
              return;
            }

            if (resp.ok) {
              const ct = resp.headers.get("content-type") || "";
              if (ct.includes("application/json")) {
                try {
                  const data = respText
                    ? JSON.parse(respText)
                    : await resp.json();
                  console.debug("Stream API JSON response:", data);

                  // Handle Ad Type
                  if (data.type === "ad") {
                    pendingRestoredPlaybackRef.current = options?.restoring
                      ? {
                          startAtSeconds: requestedStartAt,
                          shouldPlay: shouldStartPlayback,
                          restoring: true,
                        }
                      : null;
                    setIsAdPlaying(true);
                    isAdPlayingRef.current = true;
                    setCurrentAd(data.ad);
                    adSubmitIdRef.current = data.submit_id;

                    console.debug("Ad detected, playing ad:", data.ad);

                    setDuration(data.ad.duration);
                    setProgress(0);
                    resolvedSrc = data.ad.audio_url;
                  } else {
                    // extract unique play id if present
                    const uid =
                      data.unique_otplay_id ||
                      data.uniqueOtplayId ||
                      data.unique ||
                      null;
                    if (uid && typeof uid === "string") {
                      setUniqueOtplayId(uid);
                      uniqueOtplayIdRef.current = uid;
                      // reset counters for new id/track
                      playSecondsRef.current = 0;
                      lastCountedSecondRef.current = -1;
                    }
                    // common keys that might contain the final url
                    const candidate =
                      data.stream_url ||
                      data.url ||
                      data.file ||
                      data.stream ||
                      (data.data && (data.data.stream_url || data.data.url));
                    if (candidate && typeof candidate === "string") {
                      resolvedSrc = candidate;
                    }
                  }
                } catch (err) {
                  console.warn("Failed to parse JSON from stream API:", err);
                }
              } else if (
                ct.includes("text") ||
                ct.includes("mpegurl") ||
                ct.includes("vnd.apple.mpegurl")
              ) {
                // Some APIs return a plain text URL or playlist
                try {
                  const text = respText ?? (await resp.text());
                  console.debug(
                    "Stream API text response preview:",
                    (text || "").slice(0, 400),
                  );
                  // If the text looks like a URL, use it
                  const urlMatch = text?.match(/https?:\/\/[^\s"']+/);
                  if (urlMatch) resolvedSrc = urlMatch[0];
                  else if (
                    text &&
                    (text.trim().startsWith("#EXTM3U") ||
                      text.includes(".m3u8"))
                  ) {
                    // treat the body as playlist content; create a blob URL so audio can load it
                    const blob = new Blob([text], {
                      type: "application/vnd.apple.mpegurl",
                    });
                    resolvedSrc = URL.createObjectURL(blob);
                  }
                } catch (err) {
                  console.warn("Failed to read text from stream API:", err);
                }
              } else {
                // Fallback: if the response redirected to the final url, use its URL
                try {
                  const finalUrl = resp.url;
                  if (finalUrl && finalUrl !== initialSrc) {
                    resolvedSrc = finalUrl;
                    console.debug("Stream API redirected to", finalUrl);
                  }
                } catch (err) {
                  console.warn(
                    "Could not resolve final URL from response:",
                    err,
                  );
                }
              }
            } else {
              console.warn("Stream API returned non-ok status:", resp.status);
            }
          } catch (fetchErr) {
            console.warn("Fetch to stream API failed:", fetchErr);
            if (!navigator.onLine) {
              toast.error(
                "خطا در برقراری ارتباط؛ لطفاً اتصال اینترنت خود را بررسی کنید.",
                { id: "network-error" },
              );
            } else {
              toast.error("خطا در بارگذاری موسیقی؛ دوباره تلاش کنید.", {
                id: "network-error",
              });
            }
          }
        }

        // Normalize resolved source to https to avoid mixed-content or blocked http loads
        try {
          resolvedSrc =
            (ensureHttps(resolvedSrc as string) as string) ||
            (resolvedSrc as string);
          console.debug("Resolved media source:", resolvedSrc);
          // Store the resolved URL for downloading
          if (track && track.id) {
            resolvedUrlsRef.current.set(String(track.id), resolvedSrc);
          }
        } catch (e) {
          console.debug("Resolved media source:", resolvedSrc);
        }

        if (requestSequence !== playbackRequestSequenceRef.current) return;

        const applyRequestedPosition = () => {
          const audio = audioRef.current;
          if (!audio || requestSequence !== playbackRequestSequenceRef.current) {
            return false;
          }
          const knownDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
          const maxPosition = knownDuration > 0 ? knownDuration : requestedStartAt;
          const safePosition = Math.max(0, Math.min(requestedStartAt, maxPosition));
          try {
            audio.currentTime = safePosition;
          } catch {
            // Some browsers reject seeking until metadata is fully available.
          }
          setProgress(safePosition);
          lastCountedSecondRef.current = Math.floor(safePosition);
          return true;
        };

        const markPreparedWithoutAutoplay = () => {
          if (requestSequence !== playbackRequestSequenceRef.current) return;
          applyRequestedPosition();
          setIsPlaying(false);
          setIsLoading(false);
        };

        const handleAutoplayFailure = (error: any) => {
          if (requestSequence !== playbackRequestSequenceRef.current) return;
          const autoplayWasBlocked =
            error?.name === "NotAllowedError" ||
            error?.name === "AbortError";
          if (!autoplayWasBlocked) {
            console.error("Playback failed:", {
              name: error?.name || null,
              message: error?.message || String(error),
            });
          }
          // Browser autoplay policy must never destroy the restored session.
          // Keep the player visible and paused at the saved position.
          applyRequestedPosition();
          setIsPlaying(false);
          setIsLoading(false);
        };

        const onPlaybackStarted = () => {
          if (requestSequence !== playbackRequestSequenceRef.current) return;
          setIsPlaying(true);
          setIsLoading(false);
          void import("./ipScraper")
            .then(({ scrapeIpInfo }) => scrapeIpInfo())
            .then((res) => {
              if (res) {
                userLocationRef.current = {
                  country: res.country,
                  city: res.city,
                };
              }
            })
            .catch(() => undefined);
        };

        // If it's an HLS playlist, use hls.js with Authorization headers for subsequent requests.
        const isHlsSrc =
          resolvedSrc.includes(".m3u8") || resolvedSrc.includes("hls");
        const HlsMod = isHlsSrc ? (await import("hls.js")).default : null;
        if (requestSequence !== playbackRequestSequenceRef.current) return;

        if (HlsMod && HlsMod.isSupported() && isHlsSrc) {
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
          const hls = new HlsMod({
            xhrSetup: (xhr) => {
              if (accessTokenRef.current) {
                xhr.setRequestHeader(
                  "Authorization",
                  `Bearer ${accessTokenRef.current}`,
                );
              }
            },
          });
          hlsRef.current = hls;
          hls.on(HlsMod.Events.ERROR, (event: any, data: any) => {
            if (requestSequence !== playbackRequestSequenceRef.current) return;
            console.error("HLS error:", event, data);
            if (!navigator.onLine) {
              toast.error("خطای پخش HLS: اتصال اینترنت قطع شده است.", {
                id: "network-error",
              });
            }
            setIsLoading(false);
            setIsPlaying(false);
          });
          hls.on(HlsMod.Events.MANIFEST_PARSED, async () => {
            if (requestSequence !== playbackRequestSequenceRef.current) return;
            applyRequestedPosition();
            if (!shouldStartPlayback) {
              markPreparedWithoutAutoplay();
              return;
            }
            try {
              await audioRef.current?.play();
              onPlaybackStarted();
            } catch (error) {
              handleAutoplayFailure(error);
            }
          });
          hls.loadSource(resolvedSrc);
          hls.attachMedia(audioRef.current);
        } else {
          // Regular media file: set src to resolved URL.
          const audio = audioRef.current;
          console.debug("Setting audio.src to", resolvedSrc);
          try {
            audio.pause();
            audio.currentTime = 0;
            if (audio.src) {
              audio.src = "";
              audio.load();
            }
          } catch (error) {
            console.debug("Error preparing audio element:", error);
          }

          audio.src = resolvedSrc;
          audio.load();

          if (options?.restoring) {
            const signal = restorationController?.signal;
            if (!signal) return;
            try {
              await waitForAudioReady(audio, signal);
              if (
                signal.aborted ||
                requestSequence !== playbackRequestSequenceRef.current
              ) {
                return;
              }
              applyRequestedPosition();
              if (!shouldStartPlayback) {
                markPreparedWithoutAutoplay();
                return;
              }
              try {
                await audio.play();
                onPlaybackStarted();
              } catch (error) {
                handleAutoplayFailure(error);
              }
            } catch (error: any) {
              if (error?.name === "AbortError") return;
              console.error("Failed to restore audio source:", error);
              setIsPlaying(false);
              setIsLoading(false);
            } finally {
              if (restorationAbortRef.current === restorationController) {
                restorationAbortRef.current = null;
              }
            }
          } else {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.then(onPlaybackStarted).catch(handleAutoplayFailure);
            }
          }
        }
      } catch (error) {
        console.error("Error setting up audio:", error);
        if (!navigator.onLine) {
          toast.error("خطا در راه‌اندازی پخش؛ لطفاً اینترنت خود را چک کنید.", {
            id: "network-error",
          });
        }
        setIsLoading(false);
      }
    },
    [queue],
  );

  const flushPlaybackSession = useCallback(() => {
    if (!playbackPersistenceReadyRef.current) return;
    const owner = playbackAudienceRef.current;
    if (!owner) return;

    if (playbackPersistTimerRef.current !== null) {
      window.clearTimeout(playbackPersistTimerRef.current);
      playbackPersistTimerRef.current = null;
    }

    const snapshot = playbackSnapshotRef.current;
    if (!snapshot.isVisible || snapshot.queue.length === 0) {
      clearPlaybackSession(owner);
      return;
    }

    const audio = audioRef.current;
    const pendingSession = pendingPlaybackSessionRef.current;
    const activeTrackId = snapshot.queue[snapshot.currentIndex]?.id;
    const pendingTrackId =
      pendingSession?.queue[pendingSession.currentIndex]?.id;
    const isRestoringPersistedSession = Boolean(
      snapshot.isLoading &&
        pendingSession &&
        String(activeTrackId || "") === String(pendingTrackId || ""),
    );
    const audioPosition =
      audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const positionSeconds = isAdPlayingRef.current
      ? Math.max(
          0,
          Number(pendingRestoredPlaybackRef.current?.startAtSeconds || 0),
        )
      : isRestoringPersistedSession && pendingSession
        ? pendingSession.positionSeconds
        : Math.max(0, audioPosition || snapshot.positionSeconds);
    const wasPlaying =
      isRestoringPersistedSession && pendingSession
        ? pendingSession.wasPlaying
        : audio
          ? !audio.paused && !audio.ended
          : snapshot.wasPlaying;

    const createSession = (maxItems: number): PersistedPlaybackSession => {
      const compacted = compactPlaybackQueue(
        snapshot.queue,
        snapshot.currentIndex,
        maxItems,
      );
      const persistedQueue = compacted.queue.map((track) => ({
        id: String(track.id),
        title: getSongDisplayTitle(track),
        artist: track.artist,
        artistId: track.artistId,
        artistUniqueId: track.artistUniqueId,
        featuredArtists: track.featuredArtists,
        image: track.image,
        duration: track.duration,
        durationSeconds: track.durationSeconds,
        src: track.src,
        isLiked: track.isLiked,
        likesCount: track.likesCount,
        isPreview: track.isPreview,
        previewUrl: track.previewUrl,
      }));
      return {
        version: 1,
        owner,
        savedAt: Date.now(),
        queue: persistedQueue,
        currentIndex: compacted.currentIndex,
        positionSeconds,
        mediaDurationSeconds: Math.max(
          0,
          Number.isFinite(audio?.duration)
            ? Number(audio?.duration)
            : snapshot.mediaDurationSeconds,
        ),
        wasPlaying,
        isVisible: snapshot.isVisible,
        isExpanded: snapshot.isExpanded,
        volume: snapshot.volume,
        isMuted: snapshot.isMuted,
        isShuffle: snapshot.isShuffle,
        repeatMode: snapshot.repeatMode,
        quality: snapshot.quality,
      };
    };

    // LocalStorage quotas vary by browser. Preserve the current track and the
    // nearest queue entries if an unusually large queue cannot be stored.
    if (writePlaybackSession(createSession(500))) return;
    if (writePlaybackSession(createSession(100))) return;
    writePlaybackSession(createSession(25));
  }, []);

  const schedulePlaybackSessionWrite = useCallback(() => {
    if (
      !playbackPersistenceReadyRef.current ||
      playbackPersistTimerRef.current !== null
    ) {
      return;
    }
    playbackPersistTimerRef.current = window.setTimeout(() => {
      playbackPersistTimerRef.current = null;
      flushPlaybackSession();
    }, PLAYBACK_PERSIST_DEBOUNCE_MS);
  }, [flushPlaybackSession]);

  useEffect(() => {
    playbackSnapshotRef.current = {
      queue,
      currentIndex,
      positionSeconds: progress,
      mediaDurationSeconds: duration,
      wasPlaying: isPlaying,
      isLoading,
      isVisible,
      isExpanded,
      volume,
      isMuted,
      isShuffle,
      repeatMode,
      quality,
    };
    schedulePlaybackSessionWrite();
  }, [
    currentIndex,
    duration,
    isExpanded,
    isMuted,
    isPlaying,
    isLoading,
    isShuffle,
    isVisible,
    progress,
    quality,
    queue,
    repeatMode,
    schedulePlaybackSessionWrite,
    volume,
  ]);

  useEffect(() => {
    if (isAuthInitializing) return;
    const owner = playbackAudienceKey(authUser?.id ?? null);

    const launchPendingRestore = () => {
      const restored = pendingPlaybackSessionRef.current;
      const audio = audioRef.current;
      if (
        !restored ||
        !audio ||
        restoredAudioElementRef.current === audio
      ) {
        return;
      }

      restoredAudioElementRef.current = audio;
      audio.volume = restored.isMuted ? 0 : restored.volume;
      const restoredQueue = restored.queue as Track[];
      const restoredIndex = Math.min(
        Math.max(0, restored.currentIndex),
        restoredQueue.length - 1,
      );

      void playAtIndex(restoredIndex, restoredQueue, undefined, {
        startAtSeconds: restored.positionSeconds,
        shouldPlay: restored.wasPlaying,
        restoring: true,
      }).catch((error) => {
        console.error("Failed to restore persisted playback:", error);
        if (restoredAudioElementRef.current === audio) {
          setIsPlaying(false);
          setIsLoading(false);
        }
      });
    };

    if (playbackHydrationAttemptedRef.current) {
      if (playbackAudienceRef.current !== owner) {
        playbackAudienceRef.current = owner;
        pendingPlaybackSessionRef.current = null;
        restoredAudioElementRef.current = null;
        schedulePlaybackSessionWrite();
        return;
      }

      // React Strict Mode intentionally destroys and recreates the Audio
      // element once in development. Resume the same persisted session only
      // for the genuinely new element; ordinary state rerenders reuse the
      // existing element and cannot duplicate the restore request.
      launchPendingRestore();
      return;
    }

    playbackHydrationAttemptedRef.current = true;
    playbackAudienceRef.current = owner;
    const restored = readPlaybackSession(owner);
    if (!restored || !restored.isVisible || restored.queue.length === 0) {
      playbackPersistenceReadyRef.current = true;
      return;
    }

    pendingPlaybackSessionRef.current = restored;
    const restoredQueue = restored.queue as Track[];
    const restoredIndex = Math.min(
      Math.max(0, restored.currentIndex),
      restoredQueue.length - 1,
    );
    skipShuffleEffectOnceRef.current = restored.isShuffle;
    setQueueState(restoredQueue);
    setCurrentIndex(restoredIndex);
    setIsVisible(true);
    setIsExpanded(restored.isExpanded);
    setProgress(restored.positionSeconds);
    setDuration(restored.mediaDurationSeconds);
    setVolumeState(restored.volume);
    setIsMuted(restored.isMuted);
    setIsShuffle(restored.isShuffle);
    setRepeatMode(restored.repeatMode);
    setQuality(restored.quality);
    setIsPlaying(false);
    setIsLoading(true);

    playbackSnapshotRef.current = {
      queue: restoredQueue,
      currentIndex: restoredIndex,
      positionSeconds: restored.positionSeconds,
      mediaDurationSeconds: restored.mediaDurationSeconds,
      wasPlaying: restored.wasPlaying,
      isLoading: true,
      isVisible: true,
      isExpanded: restored.isExpanded,
      volume: restored.volume,
      isMuted: restored.isMuted,
      isShuffle: restored.isShuffle,
      repeatMode: restored.repeatMode,
      quality: restored.quality,
    };

    playbackPersistenceReadyRef.current = true;
    launchPendingRestore();
  }, [
    authUser?.id,
    isAuthInitializing,
    playAtIndex,
    schedulePlaybackSessionWrite,
  ]);

  useEffect(() => {
    const flushOnPageExit = () => flushPlaybackSession();
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushPlaybackSession();
    };

    window.addEventListener("pagehide", flushOnPageExit);
    window.addEventListener("beforeunload", flushOnPageExit);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushOnPageExit);
      window.removeEventListener("beforeunload", flushOnPageExit);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      if (playbackPersistTimerRef.current !== null) {
        window.clearTimeout(playbackPersistTimerRef.current);
        playbackPersistTimerRef.current = null;
      }
      restorationAbortRef.current?.abort();
      restorationAbortRef.current = null;
    };
  }, [flushPlaybackSession]);

  // Handle Repeat/Next logic when track ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = async () => {
      // Handle Ad Completion
      if (isAdPlayingRef.current && adSubmitIdRef.current) {
        setIsLoading(true);
        console.debug("Ad ended, submitting ID:", adSubmitIdRef.current);
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (accessTokenRef.current)
            headers["Authorization"] = `Bearer ${accessTokenRef.current}`;

          const resp = await fetch(`https://api.sedabox.com/api/ads/submit/`, {
            method: "POST",
            headers,
            body: JSON.stringify({ submit_id: adSubmitIdRef.current }),
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data.type === "stream") {
              console.debug("Ad submit success, transition to stream:", data);

              // Completely reset audio element to clear any error state from ad playback
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.src = "";
                try {
                  audioRef.current.load();
                } catch (e) {
                  console.debug("Error resetting audio element:", e);
                }
              }

              // Destroy any HLS instance that might be attached
              if (hlsRef.current) {
                try {
                  hlsRef.current.destroy();
                } catch (e) {
                  console.debug("Error destroying HLS instance:", e);
                }
                hlsRef.current = null;
              }

              // Reset ad state
              setIsAdPlaying(false);
              isAdPlayingRef.current = false;
              setCurrentAd(null);
              adSubmitIdRef.current = null;

              // Use currentTrackRef to ensure we have the track we were trying to play
              if (currentTrackRef.current) {
                // Now play the actual song using playAtIndex logic
                // We'll pass the resolution data so it skips the fetch/ad check
                // The response has "url" which playAtIndex will recognize
                const restoredPlayback = pendingRestoredPlaybackRef.current;
                pendingRestoredPlaybackRef.current = null;
                playAtIndex(
                  currentIndex,
                  queue,
                  data,
                  restoredPlayback || undefined,
                );
              }
              return;
            }
          } else {
            console.warn("Ad submit failed with status:", resp.status);
          }
        } catch (err) {
          console.error("Ad submit failed with error:", err);
        }
        setIsLoading(false);
        setIsAdPlaying(false);
        isAdPlayingRef.current = false;
        setCurrentAd(null);
        adSubmitIdRef.current = null;
        // if for some reason submission failed, we fall through to normal logic
      }

      if (repeatMode === "one") {
        // Refresh token on auto-repeat
        playAtIndex(currentIndex);
      } else {
        const nextIdx =
          currentIndex < queue.length - 1
            ? currentIndex + 1
            : repeatMode === "all"
              ? 0
              : -1;

        if (nextIdx >= 0) {
          setCurrentIndex(nextIdx);
          playAtIndex(nextIdx, queue);
        } else {
          setIsPlaying(false);
        }
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentIndex, queue.length, repeatMode, playAtIndex, queue]);

  const setQueue = useCallback(
    (tracks: Track[], startIndex: number = 0) => {
      const norm = tracks.map((t) => {
        const normalized = {
          ...t,
          src: (ensureHttps(t.src) as string) || t.src,
          image: (ensureHttps(t.image) as string) || t.image,
        };
        return accessTokenRef.current
          ? { ...normalized, isPreview: false }
          : asGuestPreviewTrack(normalized);
      });
      setQueueState(norm);
      setCurrentIndex(startIndex);
      if (norm.length > 0) {
        playAtIndex(startIndex, norm);
      }
    },
    [playAtIndex],
  );

  const playTrack = useCallback(
    (track: Track) => {
      const existingIndex = queue.findIndex((t) => t.id === track.id);
      if (existingIndex >= 0) {
        setCurrentIndex(existingIndex);
        playAtIndex(existingIndex);
      } else {
        const baseTrack = {
          ...track,
          src: (ensureHttps(track.src) as string) || track.src,
          image: (ensureHttps(track.image) as string) || track.image,
        };
        const normalized = accessTokenRef.current
          ? { ...baseTrack, isPreview: false }
          : asGuestPreviewTrack(baseTrack);
        const newQueue = [...queue, normalized];
        const newIndex = newQueue.length - 1;
        setQueueState(newQueue);
        setCurrentIndex(newIndex);
        playAtIndex(newIndex, newQueue);
      }
    },
    [queue, playAtIndex],
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (
      !isPlaying &&
      (!audioRef.current.currentSrc || audioRef.current.error) &&
      currentTrackRef.current
    ) {
      void playAtIndex(currentIndex);
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      if (pendingRestoredPlaybackRef.current) {
        pendingRestoredPlaybackRef.current.shouldPlay = false;
      }
      setIsPlaying(false);
    } else {
      if (pendingRestoredPlaybackRef.current) {
        pendingRestoredPlaybackRef.current.shouldPlay = true;
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          if (error?.name !== "NotAllowedError") console.error(error);
          setIsPlaying(false);
        });
      setIsVisible(true);
    }
  }, [currentIndex, isPlaying, playAtIndex]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      if (pendingRestoredPlaybackRef.current) {
        pendingRestoredPlaybackRef.current.shouldPlay = false;
      }
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && !isPlaying) {
      if (
        (!audioRef.current.currentSrc || audioRef.current.error) &&
        currentTrackRef.current
      ) {
        void playAtIndex(currentIndex);
        return;
      }
      if (pendingRestoredPlaybackRef.current) {
        pendingRestoredPlaybackRef.current.shouldPlay = true;
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          if (error?.name !== "NotAllowedError") console.error(error);
          setIsPlaying(false);
        });
      setIsVisible(true);
    }
  }, [currentIndex, isPlaying, playAtIndex]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      // mark that a user-initiated seek occurred to avoid counting jumps
      isUserSeekingRef.current = true;
      audioRef.current.currentTime = time;
      setProgress(time);
      // clear seeking flag shortly after seek completes and reset last counted second
      window.setTimeout(() => {
        isUserSeekingRef.current = false;
        try {
          lastCountedSecondRef.current = Math.floor(
            audioRef.current?.currentTime || 0,
          );
        } catch (e) {
          lastCountedSecondRef.current = -1;
        }
      }, 400);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (vol > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
      } else {
        audioRef.current.volume = 0;
      }
    }
    setIsMuted(!isMuted);
  }, [isMuted, volume]);

  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);
  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  const toggleShuffle = useCallback(() => setIsShuffle((prev) => !prev), []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const loadAudioSourceAt = useCallback(
    async (
      rawSource: string,
      positionSeconds: number,
      shouldResume: boolean,
      signal: AbortSignal,
    ) => {
      const audio = audioRef.current;
      if (!audio) throw new Error("AUDIO_ELEMENT_UNAVAILABLE");
      const source = (ensureHttps(rawSource) as string) || rawSource;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      const isHls = source.includes(".m3u8") || source.includes("hls");
      const HlsMod = isHls ? (await import("hls.js")).default : null;
      if (HlsMod && HlsMod.isSupported() && isHls) {
        await new Promise<void>((resolve, reject) => {
          const hls = new HlsMod();
          hlsRef.current = hls;
          const abort = () => {
            hls.destroy();
            if (hlsRef.current === hls) hlsRef.current = null;
            reject(new DOMException("Aborted", "AbortError"));
          };
          signal.addEventListener("abort", abort, { once: true });
          hls.on(HlsMod.Events.ERROR, (_event: unknown, data: any) => {
            if (!data?.fatal) return;
            signal.removeEventListener("abort", abort);
            hls.destroy();
            if (hlsRef.current === hls) hlsRef.current = null;
            reject(new Error("HLS_SOURCE_LOAD_FAILED"));
          });
          hls.on(HlsMod.Events.MANIFEST_PARSED, async () => {
            signal.removeEventListener("abort", abort);
            try {
              audio.currentTime = Math.max(0, positionSeconds);
              if (shouldResume) await audio.play();
              resolve();
            } catch (error) {
              reject(error);
            }
          });
          hls.loadSource(source);
          hls.attachMedia(audio);
        });
        return;
      }

      audio.src = source;
      audio.load();
      await waitForAudioReady(audio, signal);
      const safeDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      audio.currentTime = Math.max(0, Math.min(positionSeconds, safeDuration || positionSeconds));
      if (shouldResume) await audio.play();
    },
    [],
  );

  const setQualityValue = useCallback(
    async (q: "low" | "medium" | "high") => {
      if (!accessTokenRef.current) {
        requestAuth({
          title: "انتخاب کیفیت پخش",
          description: "برای پخش کامل و انتخاب کیفیت موسیقی وارد حساب شوید.",
        });
        return;
      }

      const requestedQuality = q === "high" ? "high" : "medium";
      setQuality(q);
      const track = currentTrackRef.current;
      const audio = audioRef.current;
      if (!track || !audio || track.isPreview || isAdPlayingRef.current) return;

      const sequence = ++qualitySwitchSequenceRef.current;
      qualitySwitchAbortRef.current?.abort();
      const controller = new AbortController();
      qualitySwitchAbortRef.current = controller;
      const previousSource = audio.currentSrc || audio.src;
      const previousTime = Number.isFinite(audio.currentTime) ? audio.currentTime : progress;
      const shouldResume = !audio.paused || isActuallyPlayingRef.current;

      audio.pause();
      setIsPlaying(false);
      setIsLoading(true);

      try {
        const response = await authenticatedFetch(
          `https://api.sedabox.com/api/songs/${track.id}/playback-quality/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quality: requestedQuality }),
            signal: controller.signal,
          },
        );
        const payload = await response.json().catch(() => ({}));

        if (response.status === 409 && payload?.error?.code === "PLAYBACK_QUALITY_UNAVAILABLE") {
          if (shouldResume) {
            await audio.play().catch(() => undefined);
            setIsPlaying(!audio.paused);
          }
          toast(t("کیفیت انتخاب‌شده برای این آهنگ موجود نیست؛ فایل فعلی ادامه پیدا می‌کند."));
          return;
        }
        if (!response.ok) {
          throw payload;
        }
        if (
          controller.signal.aborted ||
          sequence !== qualitySwitchSequenceRef.current ||
          String(currentTrackRef.current?.id) !== String(track.id)
        ) {
          return;
        }

        const replacementSource = payload.stream_url || payload.url;
        if (!replacementSource) throw new Error("PLAYBACK_SOURCE_UNAVAILABLE");
        try {
          await loadAudioSourceAt(
            replacementSource,
            previousTime,
            shouldResume,
            controller.signal,
          );
        } catch (switchError) {
          if (controller.signal.aborted) throw switchError;
          if (previousSource) {
            await loadAudioSourceAt(
              previousSource,
              previousTime,
              shouldResume,
              controller.signal,
            );
          }
          throw switchError;
        }

        if (sequence === qualitySwitchSequenceRef.current) {
          setProgress(previousTime);
          setIsPlaying(shouldResume);
          resolvedUrlsRef.current.set(String(track.id), replacementSource);
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        if (shouldResume && audioRef.current?.paused && previousSource) {
          try {
            await loadAudioSourceAt(
              previousSource,
              previousTime,
              true,
              new AbortController().signal,
            );
            setIsPlaying(true);
          } catch {
            setIsPlaying(false);
          }
        }
        throw error;
      } finally {
        if (sequence === qualitySwitchSequenceRef.current) {
          setIsLoading(false);
          qualitySwitchAbortRef.current = null;
        }
      }
    },
    [authenticatedFetch, loadAudioSourceAt, progress, requestAuth, t],
  );

  const cycleQuality = useCallback(() => {
    const nextQuality = quality === "high" ? "medium" : "high";
    void setQualityValue(nextQuality).catch((error) => {
      toast.error(formatErrorMessage(error) || t("خطا در تغییر کیفیت پخش"));
    });
  }, [formatErrorMessage, quality, setQualityValue, t]);

  const toggleLike = useCallback(async () => {
    if (!currentTrack || isLiking) return;
    if (!accessTokenRef.current) {
      requestAuth("برای لایک‌کردن آهنگ و نگه‌داشتن آن در حساب خود وارد شوید.");
      return;
    }

    setIsLiking(true);
    try {
      const url = `https://api.sedabox.com/api/songs/${currentTrack.id}/like/`;
      const headers: Record<string, string> = {};
      if (accessTokenRef.current) {
        headers["Authorization"] = `Bearer ${accessTokenRef.current}`;
      }

      const resp = await fetch(url, {
        method: "POST",
        headers,
      });

      if (resp.ok) {
        const data = await resp.json();
        setIsLiked(data.liked);
        setLikesCount(data.likes_count);

        // Update the track in the queue as well
        setQueueState((prevQueue) => {
          const newQueue = [...prevQueue];
          if (newQueue[currentIndex]) {
            newQueue[currentIndex] = {
              ...newQueue[currentIndex],
              isLiked: data.liked,
              likesCount: data.likes_count,
            };
          }
          return newQueue;
        });
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    } finally {
      setIsLiking(false);
    }
  }, [currentTrack, isLiking, currentIndex, requestAuth]);

  const next = useCallback(() => {
    if (queue.length === 0) return;

    // If repeat-one is active, replay the same track
    if (repeatMode === "one") {
      playAtIndex(currentIndex);
      return;
    }

    // If shuffle mode is active, pick a random next index (avoid immediate repeat when possible)
    if (isShuffle) {
      if (queue.length === 1) {
        playAtIndex(currentIndex);
        return;
      }
      let nextIdx = currentIndex;
      let tries = 0;
      while (nextIdx === currentIndex && tries < 10) {
        nextIdx = Math.floor(Math.random() * queue.length);
        tries += 1;
      }
      setCurrentIndex(nextIdx);
      playAtIndex(nextIdx);
      return;
    }

    // Normal sequential behavior. If repeat all is set, wrap; otherwise stop at end.
    const nextIdx =
      currentIndex < queue.length - 1
        ? currentIndex + 1
        : repeatMode === "all"
          ? 0
          : -1;
    if (nextIdx >= 0) {
      setCurrentIndex(nextIdx);
      playAtIndex(nextIdx);
    } else {
      // reached end and repeat is off
      setIsPlaying(false);
    }
  }, [queue.length, currentIndex, playAtIndex, repeatMode, isShuffle]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;

    if (audioRef.current && audioRef.current.currentTime > 3) {
      // Reload track to get fresh token and UID for counting
      playAtIndex(currentIndex);
      return;
    }

    // If repeat-one is active, replay the same track
    if (repeatMode === "one") {
      playAtIndex(currentIndex);
      return;
    }

    // If shuffle mode is active, pick a random previous index
    if (isShuffle) {
      if (queue.length === 1) {
        playAtIndex(currentIndex);
        return;
      }
      let prevIdx = currentIndex;
      let tries = 0;
      while (prevIdx === currentIndex && tries < 10) {
        prevIdx = Math.floor(Math.random() * queue.length);
        tries += 1;
      }
      setCurrentIndex(prevIdx);
      playAtIndex(prevIdx);
      return;
    }

    const prevIdx =
      currentIndex > 0
        ? currentIndex - 1
        : repeatMode === "all"
          ? queue.length - 1
          : -1;
    if (prevIdx >= 0) {
      setCurrentIndex(prevIdx);
      playAtIndex(prevIdx);
    } else {
      // At start and repeat is off: just restart current
      playAtIndex(currentIndex);
    }
  }, [queue.length, currentIndex, playAtIndex, repeatMode, isShuffle]);

  const close = useCallback(() => {
    ++playbackRequestSequenceRef.current;
    restorationAbortRef.current?.abort();
    restorationAbortRef.current = null;
    pendingRestoredPlaybackRef.current = null;
    pendingPlaybackSessionRef.current = null;
    restoredAudioElementRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsVisible(false);
    setIsExpanded(false);
    setProgress(0);
    playbackSnapshotRef.current = {
      ...playbackSnapshotRef.current,
      positionSeconds: 0,
      wasPlaying: false,
      isLoading: false,
      isVisible: false,
      isExpanded: false,
    };
    const owner = playbackAudienceRef.current;
    if (owner) clearPlaybackSession(owner);
    // reset counters and unique id when closing
    playSecondsRef.current = 0;
    lastCountedSecondRef.current = -1;
    setUniqueOtplayId(null);
    uniqueOtplayIdRef.current = null;
  }, []);

  const download = useCallback(
    async (track?: Track, preferredQuality?: DownloadQuality) => {
      const targetTrack = track || currentTrackRef.current;
      if (!targetTrack) return;
      if (!accessTokenRef.current) {
        requestAuth({
          title: "دانلود موسیقی",
          description: "دانلود برای کاربران واردشده و براساس پلن حساب در دسترس است.",
        });
        return;
      }

      downloadAbortRef.current?.abort();
      setDownloadTrack(targetTrack);
      setDownloadOptions([]);
      setSelectedDownloadQuality(null);
      setDownloadProgress(null);
      setDownloadLoadedBytes(0);
      setDownloadTotalBytes(null);
      setDownloadError(null);
      setDownloadStatus("loading-options");

      try {
        const response = await authenticatedFetch(
          `https://api.sedabox.com/api/songs/${targetTrack.id}/download/`,
          { headers: { Accept: "application/json" } },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw payload;
        const options: DownloadQualityOption[] = Array.isArray(payload.qualities)
          ? payload.qualities.filter(
              (option: any) =>
                option && (option.quality === "128" || option.quality === "320"),
            )
          : [];
        setDownloadOptions(options);
        const preferred = options.find(
          (option) =>
            option.quality === preferredQuality && option.available,
        );
        const preferenceFromPlayer = options.find(
          (option) =>
            option.quality === (quality === "high" ? "320" : "128") &&
            option.available,
        );
        const fallback = options.find((option) => option.available);
        setSelectedDownloadQuality(
          preferred?.quality || preferenceFromPlayer?.quality || fallback?.quality || null,
        );
        setDownloadStatus("ready");
      } catch (error: any) {
        setDownloadError(
          formatErrorMessage(error) || t("دریافت گزینه‌های دانلود انجام نشد."),
        );
        setDownloadStatus("error");
      }
    },
    [authenticatedFetch, formatErrorMessage, quality, requestAuth, t],
  );

  const closeDownloadFlow = useCallback(() => {
    if (downloadStatus === "downloading") return;
    downloadAbortRef.current?.abort();
    downloadAbortRef.current = null;
    setDownloadTrack(null);
    setDownloadOptions([]);
    setSelectedDownloadQuality(null);
    setDownloadStatus("ready");
    setDownloadProgress(null);
    setDownloadLoadedBytes(0);
    setDownloadTotalBytes(null);
    setDownloadError(null);
  }, [downloadStatus]);

  const startDownload = useCallback(async () => {
    const targetTrack = downloadTrack;
    const selectedQuality = selectedDownloadQuality;
    if (!targetTrack || !selectedQuality || downloadStatus === "downloading") return;

    downloadAbortRef.current?.abort();
    const controller = new AbortController();
    downloadAbortRef.current = controller;
    setDownloadStatus("downloading");
    setDownloadProgress(0);
    setDownloadLoadedBytes(0);
    setDownloadTotalBytes(null);
    setDownloadError(null);

    try {
      const prepareResponse = await authenticatedFetch(
        `https://api.sedabox.com/api/songs/${targetTrack.id}/download/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quality: selectedQuality }),
          signal: controller.signal,
        },
      );
      const prepared = await prepareResponse.json().catch(() => ({}));
      if (!prepareResponse.ok) throw prepared;
      const downloadUrl = ensureHttps(prepared.download_url) || prepared.download_url;
      if (!downloadUrl) throw new Error("DOWNLOAD_SOURCE_UNAVAILABLE");

      const directFetch = () =>
        fetch(downloadUrl, {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          signal: controller.signal,
        });
      const proxyUrl = ensureHttps(prepared.proxy_url) || prepared.proxy_url;
      let fileResponse: Response;
      try {
        fileResponse = await directFetch();
        if (!fileResponse.ok && proxyUrl) {
          fileResponse = await authenticatedFetch(proxyUrl, {
            method: "GET",
            signal: controller.signal,
          });
        }
      } catch (directError) {
        if (!proxyUrl || controller.signal.aborted) throw directError;
        fileResponse = await authenticatedFetch(proxyUrl, {
          method: "GET",
          signal: controller.signal,
        });
      }
      if (!fileResponse.ok) {
        const payload = await fileResponse.json().catch(() => null);
        if (payload) throw payload;
        throw new Error(`DOWNLOAD_HTTP_${fileResponse.status}`);
      }

      const contentLength = Number(fileResponse.headers.get("content-length") || 0);
      const totalBytes = Number.isFinite(contentLength) && contentLength > 0
        ? contentLength
        : null;
      setDownloadTotalBytes(totalBytes);

      let blob: Blob;
      if (fileResponse.body) {
        const reader = fileResponse.body.getReader();
        const chunks: ArrayBuffer[] = [];
        let loaded = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            // BlobPart requires an ArrayBuffer-backed view. Stream chunks are typed
            // as ArrayBufferLike and may theoretically be backed by SharedArrayBuffer,
            // so normalize each chunk without changing its bytes.
            let chunkBuffer: ArrayBuffer;
            if (value.buffer instanceof ArrayBuffer) {
              chunkBuffer =
                value.byteOffset === 0 && value.byteLength === value.buffer.byteLength
                  ? value.buffer
                  : value.buffer.slice(
                      value.byteOffset,
                      value.byteOffset + value.byteLength,
                    );
            } else {
              const copiedChunk = new Uint8Array(value.byteLength);
              copiedChunk.set(value);
              chunkBuffer = copiedChunk.buffer;
            }
            chunks.push(chunkBuffer);
            loaded += value.byteLength;
            setDownloadLoadedBytes(loaded);
            setDownloadProgress(
              totalBytes ? Math.min(100, (loaded / totalBytes) * 100) : null,
            );
          }
        }
        blob = new Blob(chunks, {
          type: fileResponse.headers.get("content-type") || "audio/mpeg",
        });
      } else {
        blob = await fileResponse.blob();
        setDownloadLoadedBytes(blob.size);
      }

      if (controller.signal.aborted) return;
      setDownloadProgress(100);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download =
        prepared.filename ||
        `${getSongDisplayTitle(targetTrack)} - ${targetTrack.artist} [${selectedQuality}kbps].mp3`.replace(
          /[<>:"/\\|?*]/g,
          "",
        );
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);

      setDownloadStatus("success");
      void authenticatedFetch("https://api.sedabox.com/api/profile/downloads/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          song_id: Number(targetTrack.id),
          quality: selectedQuality,
        }),
      })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw payload;
          window.dispatchEvent(
            new CustomEvent("sedabox:download-complete", {
              detail: {
                songId: String(targetTrack.id),
                quality: selectedQuality,
                historyItem: payload,
              },
            }),
          );
        })
        .catch((error) =>
          console.error("Failed to update download history:", error),
        );
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error("Download failed:", error);
      setDownloadError(
        formatErrorMessage(error) || t("دانلود انجام نشد. دوباره تلاش کنید."),
      );
      setDownloadStatus("error");
    } finally {
      if (downloadAbortRef.current === controller) {
        downloadAbortRef.current = null;
      }
    }
  }, [
    authenticatedFetch,
    downloadStatus,
    downloadTrack,
    formatErrorMessage,
    selectedDownloadQuality,
    t,
  ]);

  const reorderQueue = useCallback(
    (newQueue: Track[]) => {
      const currentId = currentTrackRef.current?.id;

      // If current track still exists in new queue, update index and keep playing
      if (currentId) {
        const newIdx = newQueue.findIndex((t) => t.id === currentId);
        if (newIdx !== -1) {
          setQueueState(newQueue);
          setCurrentIndex(newIdx);
          return;
        }
      }

      // Current track was removed (or there was no current). Handle accordingly.
      if (newQueue.length === 0) {
        // Stop playback and reset state
        if (audioRef.current) {
          try {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.src = "";
          } catch (e) {
            // ignore
          }
        }
        setIsPlaying(false);
        setIsVisible(false);
        setIsExpanded(false);
        setProgress(0);
        setUniqueOtplayId(null);
        uniqueOtplayIdRef.current = null;
        setQueueState([]);
        setCurrentIndex(0);
        return;
      }

      // Choose a sensible new index (clamp previous index) and start playing that track
      setQueueState(newQueue);
      setCurrentIndex((prevIndex) => {
        const newIndex = Math.min(prevIndex, newQueue.length - 1);
        // Start playback at the chosen index
        try {
          playAtIndex(newIndex, newQueue);
        } catch (e) {
          // ignore play errors here
        }
        return newIndex;
      });
    },
    [playAtIndex],
  );

  const shuffleQueue = useCallback(() => {
    if (queue.length <= 1) return;

    // Create a copy of the queue
    const newQueue = [...queue];
    const curTrack = newQueue[currentIndex];

    // Remove the current track from the array to shuffle the rest
    newQueue.splice(currentIndex, 1);

    // Fisher-Yates shuffle for the remaining tracks
    for (let i = newQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
    }

    // Put the current track back at the beginning (index 0)
    const finalQueue = [curTrack, ...newQueue];

    // Update both states
    setQueueState(finalQueue);
    setCurrentIndex(0);
  }, [queue, currentIndex]);

  // When shuffle mode is enabled, rearrange the queue so playback moves through a shuffled list.
  // Implement shuffle here using setQueueState to avoid depending on the shuffleQueue callback
  // (that callback's identity can change and would cause repeated runs).
  useEffect(() => {
    if (!isShuffle) return;
    if (skipShuffleEffectOnceRef.current) {
      skipShuffleEffectOnceRef.current = false;
      return;
    }

    setQueueState((prev) => {
      if (!prev || prev.length <= 1) return prev;

      const curId = currentTrackRef.current?.id;
      // find current track index in prev
      const idx = curId
        ? prev.findIndex((t) => String(t.id) === String(curId))
        : -1;
      const copy = [...prev];
      let curTrack = null as any;
      if (idx >= 0) {
        curTrack = copy.splice(idx, 1)[0];
      }

      // Fisher-Yates shuffle
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }

      const finalQueue = curTrack ? [curTrack, ...copy] : copy;
      // ensure playback index points to start
      setCurrentIndex(0);
      return finalQueue;
    });
  }, [isShuffle]);

  const actions = useMemo<PlayerActionsContextType>(
    () => ({
      playTrack,
      setQueue,
      setQuality: setQualityValue,
    }),
    [playTrack, setQueue, setQualityValue],
  );

  const layoutState = useMemo<PlayerLayoutContextType>(
    () => ({
      isVisible,
      isExpanded,
      hasCollapsedPlayer: isVisible && !isExpanded,
    }),
    [isExpanded, isVisible],
  );

  const playbackState = useMemo<PlayerPlaybackContextType>(
    () => ({
      currentTrack,
      isPlaying,
      playTrack,
      setQueue,
      togglePlay,
      download,
    }),
    [currentTrack, isPlaying, playTrack, setQueue, togglePlay, download],
  );

  const value: PlayerContextType = {
    currentTrack,
    previousTrack,
    nextTrack,
    queue,
    currentIndex,
    isPlaying,
    isExpanded,
    isVisible,
    progress,
    duration,
    volume,
    isMuted,
    isLoading,
    isShuffle,
    repeatMode,
    quality,
    uniqueOtplayId,
    isLiked,
    likesCount,
    isLiking,
    lyrics,
    isAdPlaying,
    currentAd,
    playTrack,
    setQueue,
    togglePlay,
    pause,
    resume,
    seek,
    setVolume,
    toggleMute,
    expand,
    collapse,
    toggleExpand,
    toggleShuffle,
    cycleRepeat,
    cycleQuality,
    setQuality: setQualityValue,
    toggleLike,
    next,
    previous,
    download,
    close,
    reorderQueue,
    shuffleQueue,
  };

  return (
    <PlayerActionsContext.Provider value={actions}>
      <PlayerLayoutContext.Provider value={layoutState}>
        <PlayerPlaybackContext.Provider value={playbackState}>
          <PlayerContext.Provider value={value}>
            {children}
            {downloadTrack && (
            <DownloadFlowModal
              isOpen
              track={downloadTrack}
              options={downloadOptions}
              selectedQuality={selectedDownloadQuality}
              status={downloadStatus}
              progress={downloadProgress}
              loadedBytes={downloadLoadedBytes}
              totalBytes={downloadTotalBytes}
              error={downloadError}
              onSelect={(selected: DownloadQuality) =>
                setSelectedDownloadQuality(selected)
              }
              onStart={() => void startDownload()}
              onClose={closeDownloadFlow}
            />
            )}
          </PlayerContext.Provider>
        </PlayerPlaybackContext.Provider>
      </PlayerLayoutContext.Provider>
    </PlayerActionsContext.Provider>
  );
}
