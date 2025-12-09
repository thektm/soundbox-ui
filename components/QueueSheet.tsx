"use client";

import React, {
  memo,
  useCallback,
  useRef,
  useMemo,
  useLayoutEffect,
} from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { usePlayer, Track } from "./PlayerContext";

// ============================================================================
// ICONS
// ============================================================================
const Icon = {
  Close: ({ c = "w-6 h-6" }: { c?: string }) => (
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
  Play: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  ),
  Pause: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg className={c} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  ),
  MusicNote: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Drag: ({ c = "w-4 h-4" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" />
    </svg>
  ),
};

// ============================================================================
// PLAYING BARS ANIMATION
// ============================================================================
const PlayingBars = memo(() => (
  <div className="flex items-end gap-[2px] h-3">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-[3px] bg-emerald-400 rounded-full playing-bar h-full"
        style={{ animationDelay: `${i * 0.15}s`, willChange: "height" }}
      />
    ))}
  </div>
));
PlayingBars.displayName = "PlayingBars";

// ============================================================================
// QUEUE TRACK ITEM
// ============================================================================
interface QueueTrackProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onPlay: (track: Track) => void;
}

const QueueTrack = memo<QueueTrackProps>(
  ({ track, index, isCurrentTrack, isPlaying, onPlay }) => {
    return (
      <div
        onClick={() => onPlay(track)}
        className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
          isCurrentTrack
            ? "bg-emerald-500/20 border border-emerald-500/30"
            : "hover:bg-white/5 active:bg-white/10"
        }`}
      >
        {/* Track Number / Playing Indicator */}
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          {isCurrentTrack && isPlaying ? (
            <PlayingBars />
          ) : isCurrentTrack ? (
            <Icon.Pause c="w-4 h-4 text-emerald-400" />
          ) : (
            <span
              className={`text-sm font-medium tabular-nums ${
                isCurrentTrack ? "text-emerald-400" : "text-neutral-500"
              } group-hover:hidden`}
            >
              {index + 1}
            </span>
          )}
          {!isCurrentTrack && (
            <Icon.Play c="w-4 h-4 text-white hidden group-hover:block" />
          )}
        </div>

        {/* Album Art */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
          <img
            src={track.image}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {isCurrentTrack && (
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/30 to-transparent" />
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0" dir="rtl">
          <h4
            className={`text-sm font-semibold truncate ${
              isCurrentTrack ? "text-emerald-400" : "text-white"
            }`}
          >
            {track.title}
          </h4>
          <p className="text-xs text-neutral-400 truncate mt-0.5">
            {track.artist}
          </p>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-neutral-500 tabular-nums">
            {track.duration}
          </span>
        </div>
      </div>
    );
  }
);
QueueTrack.displayName = "QueueTrack";

// ============================================================================
// QUEUE SHEET COMPONENT
// ============================================================================
interface QueueSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const QueueSheet = memo<QueueSheetProps>(({ isOpen, onClose }) => {
  const { queue, currentIndex, currentTrack, isPlaying, playTrack } =
    usePlayer();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize queue sections for performance
  const nowPlaying = useMemo(() => currentTrack, [currentTrack]);
  const upNext = useMemo(
    () => queue.slice(currentIndex + 1),
    [queue, currentIndex]
  );
  const previousTracks = useMemo(
    () => queue.slice(0, currentIndex),
    [queue, currentIndex]
  );

  // Scroll to current track when sheet opens
  useLayoutEffect(() => {
    if (isOpen && scrollRef.current && currentIndex >= 0) {
      const scrollToCurrent = () => {
        const currentElement = scrollRef.current?.querySelector(
          `[data-index="${currentIndex}"]`
        );
        if (currentElement) {
          currentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      };
      const timer = setTimeout(scrollToCurrent, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentIndex]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.velocity.y > 500 || info.offset.y > 150) {
        onClose();
      }
    },
    [onClose]
  );

  const handleTrackPlay = useCallback(
    (track: Track) => {
      playTrack(track);
    },
    [playTrack]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ willChange: "opacity" }}
            className="fixed inset-0 bg-black/60 z-[70]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            style={{ willChange: "transform" }}
            className="fixed inset-x-0 bottom-0 z-[70] flex flex-col bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-neutral-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Icon.MusicNote c="w-5 h-5 text-emerald-400" />
                </div>
                <div dir="rtl">
                  <h2 className="text-lg font-bold text-white">صف پخش</h2>
                  <p className="text-xs text-neutral-400">
                    {queue.length} آهنگ
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Icon.Close c="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Queue Content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-6"
            >
              {/* Now Playing Section */}
              {nowPlaying && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-3" dir="rtl">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                      در حال پخش
                    </h3>
                  </div>
                  <div data-index={currentIndex}>
                    <QueueTrack
                      track={nowPlaying}
                      index={currentIndex}
                      isCurrentTrack={true}
                      isPlaying={isPlaying}
                      onPlay={handleTrackPlay}
                    />
                  </div>
                </div>
              )}

              {/* Up Next Section */}
              {upNext.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-3" dir="rtl">
                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                      بعدی در صف
                    </h3>
                    <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
                      {upNext.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {upNext.map((track, idx) => {
                      const actualIndex = currentIndex + 1 + idx;
                      return (
                        <div key={track.id} data-index={actualIndex}>
                          <QueueTrack
                            track={track}
                            index={actualIndex}
                            isCurrentTrack={false}
                            isPlaying={false}
                            onPlay={handleTrackPlay}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Previously Played Section */}
              {previousTracks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-3" dir="rtl">
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                      موارد قبلی لیست
                    </h3>
                    <span className="text-xs text-neutral-600 bg-neutral-800/50 px-2 py-0.5 rounded-full">
                      {previousTracks.length}
                    </span>
                  </div>
                  <div className="space-y-1 opacity-60">
                    {previousTracks.map((track, idx) => (
                      <div key={track.id} data-index={idx}>
                        <QueueTrack
                          track={track}
                          index={idx}
                          isCurrentTrack={false}
                          isPlaying={false}
                          onPlay={handleTrackPlay}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {queue.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                    <Icon.MusicNote c="w-10 h-10 text-neutral-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-400 mb-2">
                    صف پخش خالی است
                  </h3>
                  <p className="text-sm text-neutral-500">
                    آهنگی برای پخش انتخاب کنید
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Safe Area */}
            <div className="h-safe-area-inset-bottom bg-neutral-950" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

QueueSheet.displayName = "QueueSheet";

export default QueueSheet;
