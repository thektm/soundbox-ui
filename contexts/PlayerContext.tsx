import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";

// Howl is imported dynamically to reduce initial bundle size
type HowlType = import("howler").Howl;

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
  next: () => void;
  previous: () => void;
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

  const howlRef = useRef<HowlType | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Update progress during playback - throttled to 250ms for performance
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (!isPlaying) return;

    progressIntervalRef.current = setInterval(() => {
      if (howlRef.current) {
        const seek = howlRef.current.seek() as number;
        setProgress(seek);
      }
    }, 250);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      if (howlRef.current) {
        howlRef.current.unload();
      }
    };
  }, []);

  // Internal function to play a track at a specific index
  const playAtIndex = useCallback(
    async (index: number, queueToUse?: Track[]) => {
      const q = queueToUse || queue;
      const track = q[index];
      if (!track) return;

      // Stop previous track
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      setIsLoading(true);
      setIsVisible(true);
      setProgress(0);

      // Dynamically import Howler only when needed
      const { Howl } = await import("howler");

      const howl = new Howl({
        src: [track.src],
        html5: true,
        volume: isMuted ? 0 : volume,
        onload: () => {
          setIsLoading(false);
          setDuration(howl.duration());
        },
        onplay: () => {
          setIsPlaying(true);
          setIsLoading(false);
        },
        onpause: () => {
          setIsPlaying(false);
        },
        onstop: () => {
          setIsPlaying(false);
        },
        onend: () => {
          setIsPlaying(false);
          setProgress(0);
          // Handle repeat and auto-next
          if (repeatMode === "one") {
            howl.seek(0);
            howl.play();
          } else {
            // Auto advance to next track
            const nextIdx =
              index < q.length - 1 ? index + 1 : repeatMode === "all" ? 0 : -1;
            if (nextIdx >= 0) {
              setCurrentIndex(nextIdx);
            }
          }
        },
        onloaderror: () => {
          setIsLoading(false);
          console.error("Error loading audio");
        },
        onplayerror: () => {
          setIsLoading(false);
          console.error("Error playing audio");
        },
      });

      howlRef.current = howl;
      howl.play();
    },
    [queue, volume, isMuted, repeatMode]
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
      // Check if track is already in queue
      const existingIndex = queue.findIndex((t) => t.id === track.id);
      if (existingIndex >= 0) {
        setCurrentIndex(existingIndex);
        playAtIndex(existingIndex);
      } else {
        // Add to queue and play
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
    if (!howlRef.current) return;
    if (isPlaying) {
      howlRef.current.pause();
    } else {
      howlRef.current.play();
    }
  }, [isPlaying]);

  const pause = useCallback(() => {
    if (howlRef.current && isPlaying) {
      howlRef.current.pause();
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (howlRef.current && !isPlaying) {
      howlRef.current.play();
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (howlRef.current) {
      howlRef.current.seek(time);
      setProgress(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (howlRef.current) {
      howlRef.current.volume(vol);
    }
    if (vol > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (howlRef.current) {
      if (isMuted) {
        howlRef.current.volume(volume);
      } else {
        howlRef.current.volume(0);
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

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(nextIdx);
    playAtIndex(nextIdx);
  }, [queue.length, currentIndex, playAtIndex]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;
    // If more than 3 seconds in, restart current track
    if (howlRef.current) {
      const currentSeek = howlRef.current.seek() as number;
      if (currentSeek > 3) {
        howlRef.current.seek(0);
        setProgress(0);
        return;
      }
    }
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : queue.length - 1;
    setCurrentIndex(prevIdx);
    playAtIndex(prevIdx);
  }, [queue.length, currentIndex, playAtIndex]);

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
    next,
    previous,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
