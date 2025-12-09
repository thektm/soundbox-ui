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

export interface Track {
  id: string;
  title: string;
  artist: string;
  image: string;
  duration: string;
  src: string;
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
  const FALLBACK_SRC = "/api/audio/music";
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
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Derived state for current, previous, and next tracks
  const currentTrack = useMemo(
    () => queue[currentIndex] || null,
    [queue, currentIndex]
  );
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
        setProgress(audio.currentTime);
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
        console.error("Audio error:", e);
        setIsLoading(false);
        setIsPlaying(false);
      };

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
        audio.pause();
        audio.src = "";
      };
    }
  }, []);

  // Handle Repeat/Next logic when track ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      } else {
        const nextIdx =
          currentIndex < queue.length - 1
            ? currentIndex + 1
            : repeatMode === "all"
            ? 0
            : -1;

        if (nextIdx >= 0) {
          setCurrentIndex(nextIdx);
          // The effect watching currentIndex will trigger playback
        } else {
          setIsPlaying(false);
        }
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentIndex, queue.length, repeatMode]);

  // Internal function to play a track at a specific index
  const playAtIndex = useCallback(
    async (index: number, queueToUse?: Track[]) => {
      const q = queueToUse || queue;
      const track = q[index];
      if (!track || !audioRef.current) return;

      setIsLoading(true);
      setIsVisible(true);
      setProgress(0);

      const initialSrc = track.src || FALLBACK_SRC;

      try {
        audioRef.current.src = initialSrc;
        audioRef.current.load();
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error("Playback failed:", error);
              setIsPlaying(false);
              setIsLoading(false);
            });
        }
      } catch (error) {
        console.error("Error setting up audio:", error);
        setIsLoading(false);
      }
    },
    [queue]
  );

  const setQueue = useCallback(
    (tracks: Track[], startIndex: number = 0) => {
      setQueueState(tracks);
      setCurrentIndex(startIndex);
      if (tracks.length > 0) {
        playAtIndex(startIndex, tracks);
      }
    },
    [playAtIndex]
  );

  const playTrack = useCallback(
    (track: Track) => {
      const existingIndex = queue.findIndex((t) => t.id === track.id);
      if (existingIndex >= 0) {
        setCurrentIndex(existingIndex);
        playAtIndex(existingIndex);
      } else {
        const newQueue = [...queue, track];
        const newIndex = newQueue.length - 1;
        setQueueState(newQueue);
        setCurrentIndex(newIndex);
        playAtIndex(newIndex, newQueue);
      }
    },
    [queue, playAtIndex]
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
      audioRef.current.currentTime = time;
      setProgress(time);
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

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    playAtIndex(nextIdx);
  }, [queue.length, currentIndex, playAtIndex]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
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
    next,
    previous,
    close,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
