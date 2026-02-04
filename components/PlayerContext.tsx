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
import Hls from "hls.js";

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

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: number | string;
  image: string;
  duration: string;
  durationSeconds?: number;
  src: string;
  isLiked?: boolean;
  likesCount?: number;
  lyrics?: string;
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
  next: () => void;
  previous: () => void;
  toggleLike: () => Promise<void>;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const FALLBACK_SRC = "https://cdn.sedabox.com/music.mp3";
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { accessToken } = useAuth();
  // mirror accessToken in a ref so long-lived handlers always see latest value
  const accessTokenRef = useRef<string | null>(accessToken || null);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);
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

  // Derived state for current, previous, and next tracks
  const currentTrack = useMemo(
    () => queue[currentIndex] || null,
    [queue, currentIndex],
  );

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
                  console.log("Submitting play count", {
                    unique_otplay_id: uid,
                    seconds: playSecondsRef.current,
                  });
                  const url = "https://api.sedabox.com/api/play/count/";
                  const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                  };
                  if (accessTokenRef.current)
                    headers["Authorization"] =
                      `Bearer ${accessTokenRef.current}`;
                  const body = JSON.stringify({
                    unique_otplay_id: uid,
                    city: "Tehran",
                    country: "iran",
                  });
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
        setDuration(audio.duration);
        setIsLoading(false);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      const handleCanPlay = () => {
        setIsLoading(false);
      };

      const handleError = (e: Event) => {
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
        } catch (err) {
          console.error("Error while processing audio error event:", err, e);
        }
        setIsLoading(false);
        setIsPlaying(false);
      };

      const handleStalled = () => console.warn("Audio stalled");
      const handleWaiting = () => console.warn("Audio waiting");
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
    async (index: number, queueToUse?: Track[]) => {
      const q = queueToUse || queue;
      const track = q[index];
      if (!track || !audioRef.current) return;

      setIsLoading(true);
      setIsVisible(true);
      setProgress(0);

      // Reset UID and counters for the new track/session
      setUniqueOtplayId(null);
      uniqueOtplayIdRef.current = null;
      playSecondsRef.current = 0;
      lastCountedSecondRef.current = -1;

      // Set initial duration from track data if available
      if (track.durationSeconds) {
        setDuration(track.durationSeconds);
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
            // Also update the track in queue to cache the lyrics
            setQueueState((prev) =>
              prev.map((t) =>
                String(t.id) === String(track.id)
                  ? { ...t, lyrics: data.lyrics || undefined }
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

      const initialSrc = (ensureHttps(track.src) as string) || FALLBACK_SRC;

      try {
        // Call the stream API (track.src) with Authorization to get the final media URL
        let resolvedSrc = initialSrc;
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
                  (text.trim().startsWith("#EXTM3U") || text.includes(".m3u8"))
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
                console.warn("Could not resolve final URL from response:", err);
              }
            }
          } else {
            console.warn("Stream API returned non-ok status:", resp.status);
          }
        } catch (fetchErr) {
          console.warn("Fetch to stream API failed:", fetchErr);
        }

        // Normalize resolved source to https to avoid mixed-content or blocked http loads
        try {
          resolvedSrc =
            (ensureHttps(resolvedSrc as string) as string) ||
            (resolvedSrc as string);
          console.debug("Resolved media source:", resolvedSrc);
        } catch (e) {
          console.debug("Resolved media source:", resolvedSrc);
        }

        // If it's an HLS playlist, use hls.js with Authorization headers for subsequent requests
        if (
          Hls.isSupported() &&
          (resolvedSrc.includes(".m3u8") || resolvedSrc.includes("hls"))
        ) {
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }
          const hls = new Hls({
            xhrSetup: (xhr, url) => {
              if (accessTokenRef.current)
                xhr.setRequestHeader(
                  "Authorization",
                  `Bearer ${accessTokenRef.current}`,
                );
            },
          });
          hlsRef.current = hls;
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error("HLS error:", event, data);
            setIsLoading(false);
            setIsPlaying(false);
          });
          hls.loadSource(resolvedSrc);
          hls.attachMedia(audioRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            audioRef.current
              ?.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
              })
              .catch((error) => {
                console.error("Playback failed:", error);
                setIsPlaying(false);
                setIsLoading(false);
              });
          });
        } else {
          // Regular media file: set src to resolved URL
          console.debug("Setting audio.src to", resolvedSrc);
          audioRef.current.src = resolvedSrc;
          audioRef.current.load();
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                setIsLoading(false);
                console.debug("Playback started successfully for", resolvedSrc);
              })
              .catch((error) => {
                console.error("Playback failed:", {
                  name: (error && error.name) || null,
                  message: (error && error.message) || String(error),
                });
                try {
                  const mediaErr = audioRef.current?.error;
                  console.error("audio.error after play failure:", mediaErr);
                } catch (inner) {
                  console.error(
                    "Error reading audio.error after play failure:",
                    inner,
                  );
                }
                setIsPlaying(false);
                setIsLoading(false);
              });
          }
        }
      } catch (error) {
        console.error("Error setting up audio:", error);
        setIsLoading(false);
      }
    },
    [queue],
  );

  // Handle Repeat/Next logic when track ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
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
          playAtIndex(nextIdx);
        } else {
          setIsPlaying(false);
        }
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentIndex, queue.length, repeatMode, playAtIndex]);

  const setQueue = useCallback(
    (tracks: Track[], startIndex: number = 0) => {
      const norm = tracks.map((t) => ({
        ...t,
        src: (ensureHttps(t.src) as string) || t.src,
        image: (ensureHttps(t.image) as string) || t.image,
      }));
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
        const normalized = {
          ...track,
          src: (ensureHttps(track.src) as string) || track.src,
          image: (ensureHttps(track.image) as string) || track.image,
        };
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
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying]);

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

  const cycleQuality = useCallback(() => {
    setQuality((prev) => {
      if (prev === "low") return "medium";
      if (prev === "medium") return "high";
      return "low";
    });
  }, []);

  const toggleLike = useCallback(async () => {
    if (!currentTrack || !accessTokenRef.current || isLiking) return;

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
  }, [currentTrack, isLiking, currentIndex]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    playAtIndex(nextIdx);
  }, [queue.length, currentIndex, playAtIndex]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      // Reload track to get fresh token and UID for counting
      playAtIndex(currentIndex);
      return;
    }
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    setCurrentIndex(prevIdx);
    playAtIndex(prevIdx);
  }, [queue.length, currentIndex, playAtIndex]);

  const close = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsVisible(false);
    setIsExpanded(false);
    setProgress(0);
    // reset counters and unique id when closing
    playSecondsRef.current = 0;
    lastCountedSecondRef.current = -1;
    setUniqueOtplayId(null);
    uniqueOtplayIdRef.current = null;
  }, []);

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
    toggleLike,
    next,
    previous,
    close,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
