import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { usePlayer, Track } from "../contexts/PlayerContext";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import QueueSheet from "./QueueSheet";

// ============================================================================
// ICONS (Inline SVGs)
// ============================================================================
const Icon = {
  Play: ({ c = "w-6 h-6" }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  ),
  Pause: ({ c = "w-6 h-6" }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  ),
  Next: ({ c = "w-6 h-6" }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  ),
  Prev: ({ c = "w-6 h-6" }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  ),
  Shuffle: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  ),
  Repeat: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  ),
  RepeatOne: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
    </svg>
  ),
  Heart: ({
    c = "w-5 h-5",
    filled = false,
  }: {
    c?: string;
    filled?: boolean;
  }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  Volume: ({
    c = "w-5 h-5",
    muted = false,
  }: {
    c?: string;
    muted?: boolean;
  }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      {muted ? (
        <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
      ) : (
        <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
      )}
    </svg>
  ),
  Down: ({ c = "w-6 h-6" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M19 9l-7 7-7-7" />
    </svg>
  ),
  More: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  ),
  Queue: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  Share: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  ),
};

// ============================================================================
// UTILITIES
// ============================================================================
const formatTime = (s: number): string => {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const SWIPE_THRESHOLD = 80;

// ============================================================================
// PROGRESS BAR
// ============================================================================
interface ProgressProps {
  progress: number;
  duration: number;
  onSeek: (t: number) => void;
  mini?: boolean;
}

const ProgressBar = memo<ProgressProps>(
  ({ progress, duration, onSeek, mini }) => {
    const ref = useRef<HTMLDivElement>(null);
    const pct = duration > 0 ? (progress / duration) * 100 : 0;

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (!ref.current || mini) return;
        const rect = ref.current.getBoundingClientRect();
        onSeek(
          Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) *
            duration
        );
      },
      [duration, onSeek, mini]
    );

    if (mini) {
      return (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 w-full">
        <span className="text-xs text-neutral-400 w-10 text-right tabular-nums">
          {formatTime(progress)}
        </span>
        <div
          ref={ref}
          className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer relative group"
          onClick={handleClick}
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-neutral-400 w-10 tabular-nums">
          {formatTime(duration)}
        </span>
      </div>
    );
  }
);

// ============================================================================
// VOLUME SLIDER
// ============================================================================
const VolumeSlider = memo<{
  volume: number;
  muted: boolean;
  onChange: (v: number) => void;
  onMute: () => void;
}>(({ volume, muted, onChange, onMute }) => {
  const ref = useRef<HTMLDivElement>(null);
  const vol = muted ? 0 : volume;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      onChange(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
    },
    [onChange]
  );

  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={onMute}
        className="text-neutral-400 hover:text-white transition-colors"
      >
        <Icon.Volume c="w-5 h-5" muted={muted || volume === 0} />
      </button>
      <div
        ref={ref}
        className="w-24 h-1 bg-white/20 rounded-full cursor-pointer relative"
        onClick={handleClick}
      >
        <div
          className="h-full bg-white rounded-full"
          style={{ width: `${vol * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${vol * 100}%` }}
        />
      </div>
    </div>
  );
});

// ============================================================================
// LOADING SPINNER
// ============================================================================
const Spinner = ({ size = "w-5 h-5" }: { size?: string }) => (
  <div
    className={`${size} border-2 border-neutral-800 border-t-transparent rounded-full animate-spin`}
  />
);

// ============================================================================
// PLAYING BARS (CSS-only animation)
// ============================================================================
const PlayingBars = memo(() => (
  <div className="flex items-end gap-0.5 h-4">
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className="w-0.5 bg-emerald-400 rounded-full animate-pulse"
        style={{
          height: `${40 + Math.random() * 60}%`,
          animationDelay: `${i * 0.15}s`,
          animationDuration: "0.8s",
        }}
      />
    ))}
  </div>
));

// ============================================================================
// TRACK SLIDE
// ============================================================================
const TrackSlide = memo<{
  track: Track | null;
  playing: boolean;
  loading: boolean;
  current: boolean;
  onPlay: () => void;
  onNext: () => void;
}>(({ track, playing, loading, current, onPlay, onNext }) => {
  if (!track) {
    return (
      <div className="flex items-center gap-3 p-3 opacity-50">
        <div className="w-12 h-12 rounded-lg bg-neutral-800 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3">
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
        <img
          src={track.image}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {current && playing && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <PlayingBars />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0" dir="rtl">
        <h4 className="text-sm font-semibold text-white truncate">
          {track.title}
        </h4>
        <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
      </div>
      {current && (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? (
              <Spinner />
            ) : playing ? (
              <Icon.Pause c="w-5 h-5 text-neutral-900" />
            ) : (
              <Icon.Play c="w-5 h-5 text-neutral-900 ml-0.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="w-9 h-9 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <Icon.Next c="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// COLLAPSED PLAYER
// ============================================================================
const CollapsedPlayer = memo<{ onExpand: () => void }>(({ onExpand }) => {
  const {
    currentTrack,
    previousTrack,
    nextTrack,
    isPlaying,
    isLoading,
    togglePlay,
    progress,
    duration,
    next,
    previous,
  } = usePlayer();

  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const width = containerRef.current?.offsetWidth || 350;

  const handleDrag = useCallback(
    (_: unknown, info: PanInfo) => {
      if (!animating) setDragX(info.offset.x);
    },
    [animating]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;
      const left = offset.x < -SWIPE_THRESHOLD || velocity.x < -400;
      const right = offset.x > SWIPE_THRESHOLD || velocity.x > 400;

      if (left && nextTrack) {
        setAnimating(true);
        setDragX(-width);
        setTimeout(() => {
          next();
          setDragX(0);
          setAnimating(false);
        }, 200);
      } else if (right && previousTrack) {
        setAnimating(true);
        setDragX(width);
        setTimeout(() => {
          previous();
          setDragX(0);
          setAnimating(false);
        }, 200);
      } else {
        setDragX(0);
      }
    },
    [next, previous, nextTrack, previousTrack, width]
  );

  const handleTap = useCallback(() => {
    if (Math.abs(dragX) < 10) onExpand();
  }, [dragX, onExpand]);

  if (!currentTrack) return null;

  const dragPct = Math.abs(dragX) / width;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed left-0 right-0 z-40"
      style={{ bottom: 96 }}
    >
      <div className="mx-3">
        <div
          ref={containerRef}
          className="relative bg-neutral-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
        >
          <ProgressBar
            progress={progress}
            duration={duration}
            onSeek={() => {}}
            mini
          />

          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onTap={handleTap}
            className="relative cursor-grab active:cursor-grabbing"
            style={{ touchAction: "pan-y" }}
          >
            <div className="relative h-[72px] overflow-hidden">
              {/* Previous */}
              <div
                className="absolute inset-y-0 w-full"
                style={{
                  transform: `translateX(${-width + dragX}px)`,
                  opacity: dragPct,
                }}
              >
                <TrackSlide
                  track={previousTrack}
                  playing={false}
                  loading={false}
                  current={false}
                  onPlay={() => {}}
                  onNext={() => {}}
                />
              </div>

              {/* Current */}
              <div
                className="absolute inset-y-0 w-full"
                style={{
                  transform: `translateX(${dragX}px)`,
                  opacity: 1 - dragPct * 0.3,
                }}
              >
                <TrackSlide
                  track={currentTrack}
                  playing={isPlaying}
                  loading={isLoading}
                  current
                  onPlay={togglePlay}
                  onNext={next}
                />
              </div>

              {/* Next */}
              <div
                className="absolute inset-y-0 w-full"
                style={{
                  transform: `translateX(${width + dragX}px)`,
                  opacity: dragPct,
                }}
              >
                <TrackSlide
                  track={nextTrack}
                  playing={false}
                  loading={false}
                  current={false}
                  onPlay={() => {}}
                  onNext={() => {}}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================================================
// EXPANDED PLAYER
// ============================================================================
// EXPANDED PLAYER
// ============================================================================
const ExpandedPlayer = memo<{ onCollapse: () => void }>(({ onCollapse }) => {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    togglePlay,
    progress,
    duration,
    seek,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    isShuffle,
    repeatMode,
    toggleShuffle,
    cycleRepeat,
    next,
    previous,
  } = usePlayer();

  const [liked, setLiked] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.velocity.y > 500 || info.offset.y > 100) onCollapse();
    },
    [onCollapse]
  );

  if (!currentTrack) return null;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      className="fixed inset-0 z-60 flex flex-col bg-gradient-to-b from-neutral-900 via-neutral-950 to-black overflow-auto"
    >
      <div className="relative flex flex-col min-h-0 h-full px-3 py-4 sm:px-6 sm:py-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onCollapse}
            className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <Icon.Down c="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center" dir="rtl">
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              در حال پخش
            </span>
            <span className="text-sm font-medium text-white">
              {currentTrack.artist}
            </span>
          </div>
          <button className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors">
            <Icon.More c="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-4">
          <div className="relative w-full aspect-square" style={{ maxWidth: "min(60vh, 90vw)", maxHeight: "min(60vh, 90vw)" }}>
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={currentTrack.image}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {isPlaying && (
                <div className="absolute bottom-3 right-3">
                  <PlayingBars />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Track Info */}
        <div className="mt-4 sm:mt-8 mb-4 sm:mb-6" dir="rtl">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                {currentTrack.title}
              </h2>
              <p className="text-base sm:text-lg text-neutral-400 truncate mt-1">
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={() => setLiked((l) => !l)}
              className={`ml-4 transition-colors ${liked ? "text-emerald-500" : "text-neutral-400 hover:text-white"}`}
            >
              <Icon.Heart c="w-7 h-7" filled={liked} />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressBar progress={progress} duration={duration} onSeek={seek} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <button
            onClick={toggleShuffle}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isShuffle ? "text-emerald-500" : "text-neutral-400 hover:text-white"}`}
          >
            <Icon.Shuffle c="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={previous}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white hover:bg-neutral-800 flex items-center justify-center transition-colors"
            >
              <Icon.Prev c="w-10 h-10 sm:w-8 sm:h-8" />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-16 h-16 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center shadow-xl active:scale-95 transition-transform disabled:opacity-50"
            >
              {isLoading ? (
                <Spinner size="w-11 h-11" />
              ) : isPlaying ? (
                <Icon.Pause c="w-11 h-11 text-neutral-900" />
              ) : (
                <Icon.Play c="w-11 h-11 text-neutral-900 ml-1" />
              )}
            </button>
            <button
              onClick={next}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white hover:bg-neutral-800 flex items-center justify-center transition-colors"
            >
              <Icon.Next c="w-10 h-10 sm:w-8 sm:h-8" />
            </button>
          </div>

          <button
            onClick={cycleRepeat}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${repeatMode !== "off" ? "text-emerald-500" : "text-neutral-400 hover:text-white"}`}
          >
            {repeatMode === "one" ? (
              <Icon.RepeatOne c="w-5 h-5" />
            ) : (
              <Icon.Repeat c="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Bottom */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 pb-safe">
          <button className="text-neutral-400 hover:text-white transition-colors">
            <Icon.Share c="w-5 h-5" />
          </button>
          <VolumeSlider
            volume={volume}
            muted={isMuted}
            onChange={setVolume}
            onMute={toggleMute}
          />
          <button
            onClick={() => setIsQueueOpen(true)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <Icon.Queue c="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Queue Sheet */}
      <QueueSheet isOpen={isQueueOpen} onClose={() => setIsQueueOpen(false)} />
    </motion.div>
  );
});
// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MusicPlayer() {
  const { isAuthenticated } = useAuth();
  const {
    isVisible,
    isExpanded,
    expand,
    collapse,
    progress: _p,
    duration: _d,
  } = usePlayer();
  const [, forceUpdate] = useState(0);

  // Force re-render every second to update progress bar
  useEffect(() => {
    if (!isVisible) return;
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [isVisible]);

  if (!isAuthenticated || !isVisible) return null;

  return (
    <AnimatePresence mode="wait">
      {isExpanded ? (
        <ExpandedPlayer key="expanded" onCollapse={collapse} />
      ) : (
        <CollapsedPlayer key="collapsed" onExpand={expand} />
      )}
    </AnimatePresence>
  );
}
