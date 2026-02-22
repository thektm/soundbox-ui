"use client";

import React, {
  memo,
  useCallback,
  useRef,
  useMemo,
  useLayoutEffect,
} from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronUp: ({ c = "w-4 h-4" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  ),
  ChevronDown: ({ c = "w-4 h-4" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
};

// ============================================================================
// PLAYING BARS ANIMATION
// ============================================================================
const PlayingBars = memo(() => (
  <div className="flex items-end gap-0.5 h-3">
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
  totalTracks: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isAdPlaying: boolean;
  onPlay: (track: Track) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
}

const QueueTrack = memo<QueueTrackProps>(
  ({
    track,
    index,
    totalTracks,
    isCurrentTrack,
    isPlaying,
    isAdPlaying,
    onPlay,
    onMoveUp,
    onMoveDown,
    onDelete,
  }) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.2,
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
          isCurrentTrack
            ? "bg-emerald-500/20 border border-emerald-500/30"
            : isAdPlaying
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-white/5 active:bg-white/10"
        }`}
      >
        {/* Track Number / Playing Indicator */}
        <div
          className="w-8 h-8 flex items-center justify-center flex-shrink-0 cursor-pointer"
          onClick={() => !isAdPlaying && onPlay(track)}
        >
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
          {!isCurrentTrack && !isAdPlaying && (
            <Icon.Play c="w-4 h-4 text-white hidden group-hover:block" />
          )}
        </div>

        {/* Album Art */}
        <div
          className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg cursor-pointer"
          onClick={() => !isAdPlaying && onPlay(track)}
        >
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
        <div
          className="flex-1 min-w-0 cursor-pointer"
          dir="rtl"
          onClick={() => !isAdPlaying && onPlay(track)}
        >
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

        {/* Duration & Movement Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-neutral-500 tabular-nums">
            {track.duration}
          </span>

          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(index);
              }}
              disabled={index === 0}
              className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
                index === 0
                  ? "opacity-20 cursor-not-allowed"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Icon.ChevronUp c="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(index);
              }}
              disabled={index === totalTracks - 1}
              className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
                index === totalTracks - 1
                  ? "opacity-20 cursor-not-allowed"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Icon.ChevronDown c="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isAdPlaying) onDelete(index);
            }}
            className=" -mx-1 rounded-md hover:bg-red-600/20 text-red-400 "
            aria-label="حذف از صف"
            title="حذف از صف"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </motion.div>
    );
  },
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
  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    playTrack,
    isAdPlaying,
    reorderQueue,
    shuffleQueue,
  } = usePlayer();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize queue sections for performance
  const nowPlaying = useMemo(() => currentTrack, [currentTrack]);
  const upNext = useMemo(
    () => queue.slice(currentIndex + 1),
    [queue, currentIndex],
  );
  const previousTracks = useMemo(
    () => queue.slice(0, currentIndex),
    [queue, currentIndex],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const newQueue = [...queue];
      const items = newQueue.splice(index, 1);
      newQueue.splice(index - 1, 0, items[0]);
      reorderQueue(newQueue);
    },
    [queue, reorderQueue],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= queue.length - 1) return;
      const newQueue = [...queue];
      const items = newQueue.splice(index, 1);
      newQueue.splice(index + 1, 0, items[0]);
      reorderQueue(newQueue);
    },
    [queue, reorderQueue],
  );

  // Scroll to current track when sheet opens
  useLayoutEffect(() => {
    if (isOpen && scrollRef.current && currentIndex >= 0) {
      const timer = setTimeout(() => {
        const currentElement = scrollRef.current?.querySelector(
          `[data-index="${currentIndex}"]`,
        );
        if (currentElement) {
          currentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentIndex]);

  const handleTrackPlay = useCallback(
    (track: Track) => {
      if (isAdPlaying) return;
      playTrack(track);
    },
    [playTrack, isAdPlaying],
  );

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose(); // only close when sliding down intentionally
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[96%] bg-[#121212] rounded-t-[32px] z-[110] flex flex-col outline-none shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
          {/* Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mt-3 mb-2" />

          {/* Header */}
          <div className="flex flex-row-reverse items-center justify-between px-5 py-3 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-3">
              
              <div dir="rtl">
                <Drawer.Title className="text-lg font-bold text-white">
                  صف پخش
                </Drawer.Title>
                <Drawer.Description className="text-xs text-neutral-400">
                  {queue.length} آهنگ
                </Drawer.Description>
                
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
            className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-24 space-y-6"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {queue.length === 0 ? (
                <div
                  key="empty-state"
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
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
              ) : (
                <div className="space-y-1">
                  {queue.map((track, idx) => (
                    <div key={track.id} data-index={idx}>
                      <QueueTrack
                        track={track}
                        index={idx}
                        totalTracks={queue.length}
                        isCurrentTrack={idx === currentIndex}
                        isPlaying={idx === currentIndex ? isPlaying : false}
                        isAdPlaying={isAdPlaying}
                        onPlay={handleTrackPlay}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onDelete={(i) => {
                          const newQueue = queue.filter((_, j) => j !== i);
                          reorderQueue(newQueue);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Bottom Safe Area */}
            <div className="h-safe-area-inset-bottom bg-neutral-950" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

QueueSheet.displayName = "QueueSheet";

export default QueueSheet;
