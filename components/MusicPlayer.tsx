"use client";

import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { usePlayer, Track } from "./PlayerContext";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import {
  motion,
  AnimatePresence,
  PanInfo,
  useMotionValue,
  animate,
} from "framer-motion";
import QueueSheet from "./QueueSheet";
import { MOCK_ARTISTS } from "./mockData";

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
  Close: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Minimize: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
    </svg>
  ),
  Lyrics: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9 18V5l12-2v13M9 9l12-2" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Fullscreen: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    </svg>
  ),
  Device: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
  Add: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
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
  variant?: "default" | "desktop";
}

const ProgressBar = memo<ProgressProps>(
  ({ progress, duration, onSeek, mini, variant = "default" }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isSeeking, setIsSeeking] = useState(false);
    const [hoverPosition, setHoverPosition] = useState<number | null>(null);
    const pct = duration > 0 ? (progress / duration) * 100 : 0;

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (!ref.current || mini) return;
        const rect = ref.current.getBoundingClientRect();
        setIsSeeking(true);
        onSeek(
          Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) *
            duration
        );
        setTimeout(() => setIsSeeking(false), 50);
      },
      [duration, onSeek, mini]
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        setHoverPosition(pos * duration);
      },
      [duration]
    );

    if (mini) {
      return (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-50">
          <div
            className="h-full bg-emerald-500 transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      );
    }

    if (variant === "desktop") {
      return (
        <div className="w-full">
          <div
            ref={ref}
            className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group"
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverPosition(null)}
          >
            {/* Hover preview */}
            {hoverPosition !== null && (
              <div
                className="absolute -top-8 px-2 py-1 bg-neutral-800 rounded text-xs text-white transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  left: `${(hoverPosition / duration) * 100}%`,
                }}
              >
                {formatTime(hoverPosition)}
              </div>
            )}
            {/* Track background on hover */}
            <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* Progress fill */}
            <div
              className={`h-full bg-white group-hover:bg-emerald-500 rounded-full relative ${
                isSeeking ? "" : "transition-[width] duration-100 ease-linear"
              }`}
              style={{ width: `${pct}%` }}
            >
              {/* Thumb */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-neutral-400 tabular-nums font-medium">
              {formatTime(progress)}
            </span>
            <span className="text-[11px] text-neutral-400 tabular-nums font-medium">
              {formatTime(duration)}
            </span>
          </div>
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
            className={`h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full ${
              isSeeking ? "" : "transition-[width] duration-1000 ease-linear"
            }`}
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
ProgressBar.displayName = "ProgressBar";

// ============================================================================
// LOADING SPINNER
// ============================================================================
const Spinner = ({ size = "w-5 h-5" }: { size?: string }) => (
  <div
    className={`${size} border-2 border-neutral-800 border-t-transparent rounded-full animate-spin`}
  />
);

// ============================================================================
// PLAYING BARS
// ============================================================================
const PlayingBars = memo(() => (
  <div className="flex items-end gap-[2px] h-3.5">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-[3px] bg-emerald-400 rounded-full playing-bar h-full"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
));
PlayingBars.displayName = "PlayingBars";

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
  onClose?: () => void;
}>(({ track, playing, loading, current, onPlay, onNext, onClose }) => {
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
    <div className="flex items-center gap-3 p-3 w-full">
      {current && onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-8 h-8 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Icon.Close c="w-4 h-4" />
        </button>
      )}
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
TrackSlide.displayName = "TrackSlide";

// ============================================================================
// ACTION PREVIEW COMPONENT
// ============================================================================
const ActionPreview = memo<{
  track: Track | null;
  label: string;
  align: "left" | "right";
  visibleRatio: number;
  isActive: boolean;
}>(({ track, label, align, visibleRatio, isActive }) => {
  if (!track) return null;

  const opacity = Math.min(1, visibleRatio * 2);
  const scale = 0.8 + 0.2 * Math.min(1, visibleRatio * 1.5);
  const translateX =
    align === "left" ? (1 - visibleRatio) * -20 : (1 - visibleRatio) * 20;

  return (
    <div
      className={`absolute top-2 bottom-2 w-[48%] rounded-lg overflow-hidden transition-all duration-300
        ${align === "left" ? "left-2" : "right-2"}
        ${
          isActive
            ? "bg-emerald-900/40 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            : "bg-white/5 border border-white/5"
        }
      `}
      style={{
        opacity,
        transform: `scale(${scale}) translateX(${translateX}px)`,
        zIndex: 10,
      }}
    >
      <div className="flex items-center h-full px-3 gap-2 w-full">
        {align === "right" && (
          <div className="flex-1 min-w-0 text-right">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 mb-0.5">
              {label}
            </div>
            <div className="text-xs text-white font-medium truncate">
              {track.title}
            </div>
          </div>
        )}

        <img
          src={track.image}
          className="w-10 h-10 rounded object-cover flex-shrink-0 shadow-md bg-neutral-800"
          alt=""
        />

        {align === "left" && (
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 mb-0.5">
              {label}
            </div>
            <div className="text-xs text-white font-medium truncate">
              {track.title}
            </div>
          </div>
        )}
      </div>

      {isActive && (
        <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
      )}
    </div>
  );
});
ActionPreview.displayName = "ActionPreview";

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
    close,
    seek,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
  } = usePlayer();

  const [dragX, setDragX] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const width = containerRef.current?.offsetWidth || 350;
  const MAX_DRAG = width * 0.45;

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const handleDragStart = useCallback(() => {
    setHasDragged(false);
  }, []);

  const handleDrag = useCallback(() => {
    const currentX = x.get();
    setDragX(currentX);
    if (Math.abs(currentX) > 5) {
      setHasDragged(true);
    }
  }, [x]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const offset = info.offset.x;

      if (offset < -SWIPE_THRESHOLD && nextTrack) {
        next();
      } else if (offset > SWIPE_THRESHOLD && previousTrack) {
        previous();
      }

      animate(x, 0, { type: "spring", damping: 25, stiffness: 300 });
      setDragX(0);
      setTimeout(() => setHasDragged(false), 100);
    },
    [next, previous, nextTrack, previousTrack, x]
  );

  const handleExpandClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (hasDragged || target.closest("button")) {
        return;
      }
      onExpand();
    },
    [hasDragged, onExpand]
  );

  if (!currentTrack) return null;

  return (
    <>
      {/* Mobile Collapsed Player */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed left-0 right-0 z-40 md:hidden"
        style={{ bottom: 70, willChange: "transform, opacity" }}
      >
        <div className="mx-2 sm:mx-4">
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

            <div className="relative h-[72px] w-full">
              <ActionPreview
                track={previousTrack}
                label="Prev Song"
                align="left"
                visibleRatio={
                  dragX > 0 ? Math.min(1, dragX / SWIPE_THRESHOLD) : 0
                }
                isActive={dragX > SWIPE_THRESHOLD}
              />

              <ActionPreview
                track={nextTrack}
                label="Next Song"
                align="right"
                visibleRatio={
                  dragX < 0 ? Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD) : 0
                }
                isActive={dragX < -SWIPE_THRESHOLD}
              />

              <motion.div
                drag="x"
                dragConstraints={{ left: -MAX_DRAG, right: MAX_DRAG }}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onClick={handleExpandClick}
                className="relative z-20 h-full w-full bg-neutral-900/95 backdrop-blur-md cursor-pointer active:cursor-grabbing shadow-xl border-x border-white/5"
                style={{
                  touchAction: "pan-y",
                  x,
                }}
              >
                <TrackSlide
                  track={currentTrack}
                  playing={isPlaying}
                  loading={isLoading}
                  current
                  onPlay={togglePlay}
                  onNext={next}
                  onClose={close}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Desktop/Tablet Player Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="hidden md:block fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-white/10"
        style={{ willChange: "transform, opacity" }}
        dir={isDesktop ? "ltr" : "rtl"}
      >
        <div className="h-[90px] px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-[30%] min-w-0">
            <div
              className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onExpand}
            >
              <img
                src={currentTrack.image}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium text-white truncate cursor-pointer hover:underline"
                onClick={onExpand}
              >
                {currentTrack.title}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {currentTrack.artist}
              </p>
            </div>
            <button className="p-2 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
              <Icon.Heart c="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 w-[40%] max-w-[722px]">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition-colors ${
                  isShuffle
                    ? "text-emerald-500"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon.Shuffle c="w-4 h-4" />
              </button>
              <button
                onClick={previous}
                disabled={!previousTrack}
                className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <Icon.Prev c="w-5 h-5" />
              </button>
              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform"
              >
                {isLoading ? (
                  <Spinner size="w-4 h-4" />
                ) : isPlaying ? (
                  <Icon.Pause c="w-5 h-5" />
                ) : (
                  <Icon.Play c="w-5 h-5" />
                )}
              </button>
              <button
                onClick={next}
                disabled={!nextTrack}
                className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <Icon.Next c="w-5 h-5" />
              </button>
              <button
                onClick={cycleRepeat}
                className={`p-2 transition-colors ${
                  repeatMode !== "off"
                    ? "text-emerald-500"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {repeatMode === "one" ? (
                  <Icon.RepeatOne c="w-4 h-4" />
                ) : (
                  <Icon.Repeat c="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-zinc-400 w-10 text-right tabular-nums">
                {formatTime(progress)}
              </span>
              <div
                className="flex-1 h-1 bg-zinc-700 rounded-full cursor-pointer group relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  seek(pct * duration);
                }}
              >
                <div
                  className="h-full bg-white group-hover:bg-emerald-500 rounded-full transition-colors relative"
                  style={{
                    left: 0,
                    transformOrigin: "left center",
                    width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
                  }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-xs text-zinc-400 w-10 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-[30%]">
            <button
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              onClick={onExpand}
            >
              <Icon.Queue c="w-4 h-4" />
            </button>
            <button
              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
              onClick={close}
              title="Close player"
            >
              <Icon.Close c="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
});
CollapsedPlayer.displayName = "CollapsedPlayer";

// ============================================================================
// DESKTOP EXPANDED PLAYER - REDESIGNED
// ============================================================================
const DesktopExpandedPlayer = memo<{ onCollapse: () => void }>(
  ({ onCollapse }) => {
    const { navigateTo } = useNavigation();
    const {
      currentTrack,
      isPlaying,
      isLoading,
      togglePlay,
      progress,
      duration,
      seek,
      isShuffle,
      repeatMode,
      toggleShuffle,
      cycleRepeat,
      next,
      previous,
      playTrack,
      queue,
      currentIndex,
    } = usePlayer();

    const [liked, setLiked] = useState(false);
    const [activeTab, setActiveTab] = useState<"queue" | "lyrics" | "related">(
      "queue"
    );

    const handleArtistClick = useCallback(() => {
      if (currentTrack) {
        const artist = MOCK_ARTISTS.find((a) => a.name === currentTrack.artist);
        if (artist) {
          onCollapse();
          navigateTo("artist-detail", { slug: artist.id });
        }
      }
    }, [currentTrack, navigateTo, onCollapse]);

    if (!currentTrack) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[60] bg-black"
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={currentTrack.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-[100px] opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-8 py-6">
            <button
              onClick={onCollapse}
              className="group flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Icon.Minimize c="w-5 h-5" />
              </div>
              <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Minimize
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/20 transition-all">
                <Icon.Share c="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/20 transition-all">
                <Icon.More c="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Main Layout */}
          <div className="flex-1 flex items-center px-8 pb-8 gap-12 min-h-0">
            {/* Left Section - Artwork & Info */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-10 max-w-3xl w-full">
                {/* Album Art */}
                <div className="relative flex-shrink-0">
                  <div className="w-72 h-72 xl:w-80 xl:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
                    <img
                      src={currentTrack.image}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                 
                </div>

                {/* Track Info & Controls */}
                <div className="flex-1 min-w-0 space-y-8">
                  {/* Track Meta */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 rounded-full">
                        Now Playing
                      </span>
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight">
                      {currentTrack.title}
                    </h1>
                    <button
                      onClick={handleArtistClick}
                      className="text-xl text-neutral-300 hover:text-white transition-colors hover:underline decoration-2 underline-offset-4"
                    >
                      {currentTrack.artist}
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="max-w-md">
                    <ProgressBar
                      progress={progress}
                      duration={duration}
                      onSeek={seek}
                      variant="desktop"
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-6">
                    <button
                      onClick={toggleShuffle}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isShuffle
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon.Shuffle c="w-5 h-5" />
                    </button>

                    <button
                      onClick={previous}
                      className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105"
                    >
                      <Icon.Prev c="w-7 h-7" />
                    </button>

                    <button
                      onClick={togglePlay}
                      disabled={isLoading}
                      className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-white/20 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Spinner size="w-8 h-8" />
                      ) : isPlaying ? (
                        <Icon.Pause c="w-9 h-9 text-black" />
                      ) : (
                        <Icon.Play c="w-9 h-9 text-black ml-1" />
                      )}
                    </button>

                    <button
                      onClick={next}
                      className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105"
                    >
                      <Icon.Next c="w-7 h-7" />
                    </button>

                    <button
                      onClick={cycleRepeat}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        repeatMode !== "off"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {repeatMode === "one" ? (
                        <Icon.RepeatOne c="w-5 h-5" />
                      ) : (
                        <Icon.Repeat c="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setLiked((l) => !l)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                        liked
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon.Heart c="w-5 h-5" filled={liked} />
                      <span className="text-sm font-medium">
                        {liked ? "Liked" : "Like"}
                      </span>
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                      <Icon.Add c="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Add to Playlist
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Queue/Lyrics Panel */}
            <div className="w-96 xl:w-[420px] h-full flex flex-col bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {(["queue", "lyrics", "related"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-sm font-medium transition-all relative ${
                      activeTab === tab
                        ? "text-white"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {tab === "queue"
                      ? "Up Next"
                      : tab === "lyrics"
                      ? "Lyrics"
                      : "Related"}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === "queue" && (
                  <div className="h-full overflow-y-auto p-4 space-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                        {queue.length} tracks in queue
                      </span>
                      <span className="text-xs text-neutral-500">
                        {currentIndex + 1} of {queue.length}
                      </span>
                    </div>
                    {queue.map((track, i) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => playTrack(track)}
                        className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          i === currentIndex
                            ? "bg-emerald-500/10 border border-emerald-500/20"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={track.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {i === currentIndex && isPlaying ? (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <PlayingBars />
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Icon.Play c="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium truncate ${
                              i === currentIndex
                                ? "text-emerald-400"
                                : "text-white"
                            }`}
                          >
                            {track.title}
                          </div>
                          <div className="text-xs text-neutral-500 truncate">
                            {track.artist}
                          </div>
                        </div>
                        <span className="text-xs text-neutral-500 tabular-nums">
                          {track.duration}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === "lyrics" && (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                        <Icon.Lyrics c="w-8 h-8 text-neutral-500" />
                      </div>
                      <div>
                        <p className="text-neutral-400 font-medium">
                          Lyrics not available
                        </p>
                        <p className="text-sm text-neutral-600 mt-1">
                          We couldn't find lyrics for this track
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "related" && (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                        <Icon.Queue c="w-8 h-8 text-neutral-500" />
                      </div>
                      <div>
                        <p className="text-neutral-400 font-medium">
                          Discover similar tracks
                        </p>
                        <p className="text-sm text-neutral-600 mt-1">
                          Coming soon
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);
DesktopExpandedPlayer.displayName = "DesktopExpandedPlayer";

// ============================================================================
// MOBILE EXPANDED PLAYER
// ============================================================================
const MobileExpandedPlayer = memo<{ onCollapse: () => void }>(
  ({ onCollapse }) => {
    const { navigateTo } = useNavigation();
    const {
      currentTrack,
      isPlaying,
      isLoading,
      togglePlay,
      progress,
      duration,
      seek,
      isShuffle,
      repeatMode,
      toggleShuffle,
      cycleRepeat,
      cycleQuality,
      next,
      previous,
    } = usePlayer();

    const [liked, setLiked] = useState(false);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleArtistClick = () => {
      if (currentTrack) {
        const artist = MOCK_ARTISTS.find((a) => a.name === currentTrack.artist);
        if (artist) {
          onCollapse();
          navigateTo("artist-detail", { slug: artist.id });
        }
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (isMenuOpen && !(event.target as Element).closest(".menu-button")) {
          setIsMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isMenuOpen]);

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
        className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-neutral-900 via-neutral-950 to-black overflow-auto"
        style={{ willChange: "transform" }}
      >
        <div className="relative flex flex-col min-h-0 h-full px-3 py-4 sm:px-6 sm:py-8 overflow-hidden">
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
              <button
                onClick={handleArtistClick}
                className="text-sm font-medium text-white hover:underline"
              >
                {currentTrack.artist}
              </button>
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="menu-button w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors relative"
            >
              <Icon.More c="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4">
            <div
              className="relative w-full aspect-square"
              style={{
                maxWidth: "min(60vh, 90vw)",
                maxHeight: "min(60vh, 90vw)",
              }}
            >
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

            <div
              className="mt-4 sm:mt-8 mb-4 sm:mb-6 w-full max-w-[900px]"
              dir="rtl"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => {
                      onCollapse();
                      if (currentTrack)
                        navigateTo("song-detail", { id: currentTrack.id });
                    }}
                    className="text-xl sm:text-2xl font-bold text-white truncate hover:underline text-right w-full"
                  >
                    {currentTrack.title}
                  </button>
                  <button
                    onClick={handleArtistClick}
                    className="text-base sm:text-lg text-neutral-400 truncate mt-1 hover:text-white hover:underline text-right w-full"
                  >
                    {currentTrack.artist}
                  </button>
                </div>
                <button
                  onClick={() => setLiked((l) => !l)}
                  className={`ml-4 transition-colors ${
                    liked
                      ? "text-emerald-500"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Icon.Heart c="w-7 h-7" filled={liked} />
                </button>
              </div>
            </div>

            <div className="mb-6 w-full max-w-[900px]">
              <ProgressBar
                progress={progress}
                duration={duration}
                onSeek={seek}
              />
            </div>

            <div className="flex items-center justify-between mb-4 sm:mb-8 w-full max-w-[900px]">
              <button
                onClick={toggleShuffle}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isShuffle
                    ? "text-emerald-500"
                    : "text-neutral-400 hover:text-white"
                }`}
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
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  repeatMode !== "off"
                    ? "text-emerald-500"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {repeatMode === "one" ? (
                  <Icon.RepeatOne c="w-5 h-5" />
                ) : (
                  <Icon.Repeat c="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 pb-safe w-full max-w-[900px]">
              <button className="text-neutral-400 hover:text-white transition-colors">
                <Icon.Share c="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsQueueOpen(true)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <Icon.Queue c="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <QueueSheet
          isOpen={isQueueOpen}
          onClose={() => setIsQueueOpen(false)}
        />

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-16 right-4 z-[60] bg-neutral-800 rounded-lg shadow-2xl border border-white/10 overflow-hidden min-w-[200px]"
            >
              <div className="py-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleArtistClick();
                  }}
                  className="w-full px-4 py-3 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  dir="rtl"
                >
                  <Icon.More c="w-5 h-5" />
                  مشاهده هنرمند
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCollapse();
                    if (currentTrack) {
                      navigateTo("song-detail", { id: currentTrack.id });
                    }
                  }}
                  className="w-full px-4 py-3 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  dir="rtl"
                >
                  <Icon.Queue c="w-5 h-5" />
                  جزئیات آهنگ
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  dir="rtl"
                >
                  <Icon.Share c="w-5 h-5" />
                  اشتراک‌گذاری
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsQueueOpen(true);
                  }}
                  className="w-full px-4 py-3 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  dir="rtl"
                >
                  <Icon.Queue c="w-5 h-5" />
                  نمایش صف پخش
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    cycleQuality();
                  }}
                  className="w-full px-4 py-3 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                  dir="rtl"
                >
                  <Icon.Volume c="w-5 h-5" />
                  تغییر کیفیت
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);
MobileExpandedPlayer.displayName = "MobileExpandedPlayer";

// ============================================================================
// EXPANDED PLAYER WRAPPER
// ============================================================================
const ExpandedPlayer = memo<{ onCollapse: () => void }>(({ onCollapse }) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  if (isDesktop) {
    return <DesktopExpandedPlayer onCollapse={onCollapse} />;
  }

  return <MobileExpandedPlayer onCollapse={onCollapse} />;
});
ExpandedPlayer.displayName = "ExpandedPlayer";

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MusicPlayer() {
  const { isLoggedIn } = useAuth();
  const { isVisible, isExpanded, expand, collapse, setVolume } = usePlayer();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.getElementById("music-player-root"));
  }, []);

  useEffect(() => {
    try {
      setVolume?.(1);
    } catch (e) {
      // ignore if setVolume is not available
    }
  }, [setVolume]);

  if (!isLoggedIn || !isVisible || !portalRoot) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isExpanded ? (
        <ExpandedPlayer key="expanded" onCollapse={collapse} />
      ) : (
        <CollapsedPlayer key="collapsed" onExpand={expand} />
      )}
    </AnimatePresence>,
    portalRoot
  );
}
