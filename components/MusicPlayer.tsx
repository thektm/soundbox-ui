"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { usePlayer, Track } from "./PlayerContext";
import { useAuth } from "./AuthContext";
import { useGuestAccess } from "./GuestAccessContext";
import { useNavigation } from "./NavigationContext";
import { useResponsiveLayout } from "./ResponsiveLayout";
import { useI18n } from "./I18nContext";
import {
  motion,
  AnimatePresence,
  PanInfo,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import toast from "react-hot-toast";
import QueueSheet from "./QueueSheet";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { ResponsiveSheet } from "./ResponsiveSheet";
import { getFullShareUrl } from "../utils/share";
import { MOCK_ARTISTS, createSlug } from "./mockData";
import { Sparkles, User, UserRoundCog } from "lucide-react";
import { clientTrace } from "../lib/clientDebug";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface BannerAd {
  id: number;
  title: string;
  image: string;
  navigate_link: string | null;
  view_count: number;
}

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_ROOT || "https://api.sedabox.com/api"
).replace(/\/+$/, "");
const BANNER_REQUEST_TIMEOUT_MS = 12_000;

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
  Download: ({ c = "w-5 h-5" }: { c?: string }) => (
    <svg
      className={c}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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
const MINI_PLAYER_TAP_SLOP = 18;

// Normalize URLs
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

// ============================================================================
// DESKTOP COLLAPSED: PROFILE PILL BUTTON
// ============================================================================
const ProfilePillButton = memo<{ onClick: () => void }>(
  function ProfilePillButton({ onClick }) {
    return (
      <div className="relative w-10 h-10 overflow-visible">
        <button
          type="button"
          onClick={onClick}
          className="group absolute right-0 top-0 h-10 w-10 hover:w-[115px] will-change-auto transition-[width] duration-300 ease-out rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md text-zinc-300 hover:text-white shadow-[0_10px_30px_-15px_rgba(0,0,0,0.8)]"
          aria-label="پروفایل"
          title="پروفایل"
          style={{ willChange: "width" }}
        >
          <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-r from-emerald-500/10 via-white/5 to-white/0" />

          <span className="relative h-full w-full flex items-center justify-center group-hover:justify-end px-0 gap-0 group-hover:px-3 group-hover:gap-2">
            <span className="inline-flex items-center  overflow-hidden max-w-0 group-hover:max-w-[70px] transition-[max-width] duration-300 ease-out">
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
                پروفایل
              </span>
            </span>

            <span className="w-px h-4 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            <span className="w-7 h-7      flex items-center justify-center shrink-0">
              <User className="w-[18px] h-[18px]" />
            </span>
          </span>
        </button>
      </div>
    );
  },
);
ProfilePillButton.displayName = "ProfilePillButton";

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
        const pos = (e.clientX - rect.left) / rect.width;
        const t = pos * duration;
        onSeek(Math.max(0, Math.min(1, t / duration)) * duration);
        setTimeout(() => setIsSeeking(false), 50);
      },
      [duration, onSeek, mini, variant],
    );

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const t = pos * duration;
        setHoverPosition(t);
      },
      [duration, variant],
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
            dir="ltr" data-direction-fixed="ltr"
            ref={ref}
            className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group"
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverPosition(null)}
          >
            {hoverPosition !== null &&
              (() => {
                const pctHover = (hoverPosition / duration) * 100;
                return (
                  <div
                    className="absolute -top-8 px-2 py-1 bg-neutral-800 rounded text-xs text-white transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `${pctHover}%` }}
                  >
                    {formatTime(hoverPosition)}
                  </div>
                );
              })()}
            <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-0" />
            {(() => {
              const fillStyle = { width: `${pct}%`, left: 0, right: "auto" };
              const knobStyle = { left: `${pct}%` };
              return (
                <>
                  <div
                    className={`h-full bg-white group-hover:bg-emerald-500 rounded-full relative z-10 ${
                      isSeeking
                        ? ""
                        : "transition-[width] duration-100 ease-linear"
                    }`}
                    style={fillStyle}
                  />

                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    style={knobStyle}
                  />
                </>
              );
            })()}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[11px] text-neutral-400 tabular-nums font-medium">
              {formatTime(duration)}
            </span>
            <span className="text-[11px] text-neutral-400 tabular-nums font-medium">
              {formatTime(progress)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 w-full">
        <span className="text-xs text-neutral-400 w-10 text-start tabular-nums">
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
  },
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

function textDirection(value?: string | null): "rtl" | "ltr" {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(value || "")
    ? "rtl"
    : "ltr";
}

const TrackIdentity = memo<{
  track: Track;
  isAdPlaying?: boolean;
  align?: "start" | "center";
  compact?: boolean;
  onBeforeNavigate?: () => void;
  titleClassName?: string;
  artistsClassName?: string;
}>(({
  track,
  isAdPlaying,
  align = "start",
  compact = false,
  onBeforeNavigate,
  titleClassName = "",
  artistsClassName = "",
}) => {
  const { navigateTo } = useNavigation();
  const artists = useMemo(() => {
    const items = [
      {
        id: track.artistId || (track as any).artist_id,
        name: track.artist,
        uniqueId:
          track.artistUniqueId ||
          (track as any).artist_unique_id ||
          undefined,
      },
      ...(track.featuredArtists || []),
    ].filter((artist) => artist?.name);
    const seen = new Set<string>();
    return items.filter((artist) => {
      const key = String(artist.id || artist.name).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [track]);

  const openSong = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isAdPlaying) return;
    onBeforeNavigate?.();
    navigateTo("song-detail", {
      id: track.id,
      artistSlug:
        track.artistUniqueId ||
        (track as any).artist_unique_id ||
        createSlug(track.artist),
      songSlug: createSlug(track.title),
    });
  };

  const openArtist = (
    event: React.MouseEvent,
    artist: { id?: string | number; name: string; uniqueId?: string },
  ) => {
    event.stopPropagation();
    if (isAdPlaying || (!artist.id && !artist.uniqueId)) return;
    onBeforeNavigate?.();
    navigateTo("artist-detail", {
      id: artist.id || artist.uniqueId,
      slug: artist.uniqueId || createSlug(artist.name),
    });
  };

  const titleAlignment =
    align === "center" ? "mx-auto text-center" : "text-start";
  const artistsDirection = textDirection(artists.map((artist) => artist.name).join(" "));

  return (
    <div className={`min-w-0 ${align === "center" ? "w-full" : "flex-1"}`}>
      <button
        type="button"
        onClick={openSong}
        disabled={Boolean(isAdPlaying)}
        dir={textDirection(track.title)}
        data-player-no-expand="true"
        className={`block w-fit max-w-full truncate font-bold text-white ${titleAlignment} ${
          compact ? "text-sm" : ""
        } ${isAdPlaying ? "cursor-default" : "hover:underline"} ${titleClassName}`}
      >
        {track.title}
      </button>
      <div
        dir={artistsDirection}
        className={`mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1 overflow-hidden ${
          align === "center"
            ? "justify-center text-center"
            : artistsDirection === "rtl"
              ? "justify-end text-right"
              : "justify-start text-left"
        } ${artistsClassName}`}
      >
        {isAdPlaying ? (
          <span className="truncate text-xs text-neutral-400">Ad</span>
        ) : (
          artists.map((artist, index) => (
            <React.Fragment key={`${artist.id || artist.name}-${index}`}>
              {index > 0 && <span className="text-neutral-600">،</span>}
              {artist.id || artist.uniqueId ? (
                <button
                  type="button"
                  onClick={(event) => openArtist(event, artist)}
                  dir={textDirection(artist.name)}
                  data-player-no-expand="true"
                  className={`inline-block w-fit max-w-full flex-none truncate text-xs text-neutral-400 transition hover:text-white hover:underline ${
                    textDirection(artist.name) === "rtl"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {artist.name}
                </button>
              ) : (
                <span
                  dir={textDirection(artist.name)}
                  className="min-w-0 truncate text-xs text-neutral-400"
                >
                  {artist.name}
                </span>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
});
TrackIdentity.displayName = "TrackIdentity";

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
  isAdPlaying?: boolean;
  flipNext?: boolean;
}>(
  ({
    track,
    playing,
    loading,
    current,
    onPlay,
    onNext,
    onClose,
    isAdPlaying,
    flipNext,
  }) => {
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
          <ImageWithPlaceholder
            src={ensureHttps(track.image) || track.image}
            alt={track.title}
            className="w-full h-full object-cover"
            type="song"
          />
          {current && playing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <PlayingBars />
            </div>
          )}
        </div>
        <TrackIdentity
          track={track}
          isAdPlaying={isAdPlaying}
          compact
          titleClassName="text-sm font-semibold"
        />
        {current && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isAdPlaying) return;
                onPlay();
              }}
              disabled={loading || Boolean(isAdPlaying)}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
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
                if (isAdPlaying) return;
                onNext();
              }}
              disabled={Boolean(isAdPlaying)}
              className="w-9 h-9 rounded-full transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-disabled={isAdPlaying}
            >
              {flipNext ? (
                <span
                  style={{ display: "inline-block", transform: "scaleX(-1)" }}
                >
                  <Icon.Next c="w-5 h-5 text-neutral-400" />
                </span>
              ) : (
                <Icon.Next c="w-5 h-5 text-neutral-400" />
              )}
            </button>
          </div>
        )}
      </div>
    );
  },
);
TrackSlide.displayName = "TrackSlide";

// ============================================================================
// QUALITY SELECTOR SHEET
// ============================================================================
const QualitySelectorSheet = memo<{
  isOpen: boolean;
  onClose: () => void;
  currentQuality: string;
  onSelect: (q: "medium" | "high") => void;
  isPremium: boolean;
}>(({ isOpen, onClose, currentQuality, onSelect, isPremium }) => {
  const { direction } = useI18n();
  const qualities = [
    { value: "medium", label: "متوسط", description: "160 kbps - توصیه شده" },
    {
      value: "high",
      label: "بالا",
      description: "320 kbps - کیفیت عالی (مخصوص پریمیوم)",
    },
  ];

  return (
    <ResponsiveSheet
      keyboardDismiss={true}
      isOpen={isOpen}
      onClose={onClose}
      desktopWidth="w-[450px]"
    >
      <div className="p-6 h-full flex flex-col" dir={direction}>
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-xl font-bold text-white">کیفیت پخش</h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hidden md:block"
          >
            <Icon.Close c="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-6 flex-1 overflow-y-auto">
          {qualities.map((q) => {
            const locked = q.value === "high" && !isPremium;
            return (
              <div key={q.value} className="relative">
                <button
                  onClick={() => {
                    if (locked) return;
                    onSelect(q.value as "medium" | "high");
                    onClose();
                  }}
                  aria-disabled={locked}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${
                    currentQuality === q.value
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-inner shadow-emerald-500/5"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  } ${locked ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="text-start flex-1">
                    <div
                      className={`font-medium transition-colors ${
                        currentQuality === q.value
                          ? "text-emerald-400"
                          : "text-white"
                      }`}
                    >
                      {q.label}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      {q.description}
                    </div>
                  </div>
                  {currentQuality === q.value && (
                    <div className="w-5 h-5 flex items-center justify-center text-emerald-400">
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-md border border-yellow-500/30 font-medium">
                      Premium
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ResponsiveSheet>
  );
});
QualitySelectorSheet.displayName = "QualitySelectorSheet";

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
          <div className="flex-1 min-w-0 text-start">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 mb-0.5">
              {label}
            </div>
            <div className="text-xs text-white font-medium truncate">
              {track.title}
            </div>
          </div>
        )}

        <ImageWithPlaceholder
          src={ensureHttps(track.image) || track.image}
          className="w-10 h-10 rounded object-cover flex-shrink-0 shadow-md bg-neutral-800"
          alt={track.title}
          type="song"
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
// ALBUM ART SWIPE CAROUSEL (Spotify-style)
// ============================================================================
const COVER_SWIPE_THRESHOLD = 60; // px distance threshold
const COVER_VELOCITY_THRESHOLD = 400; // px/s velocity threshold

const AlbumArtCarousel = memo<{
  currentTrack: Track;
  previousTrack: Track | null;
  nextTrack: Track | null;
  isPlaying: boolean;
  isAdPlaying: boolean;
  showLyricsOverlay: boolean;
  setShowLyricsOverlay: (v: boolean) => void;
  lyrics: string | null;
  onNext: () => void;
  onPrevious: () => void;
}>(
  ({
    currentTrack,
    previousTrack,
    nextTrack,
    isPlaying,
    isAdPlaying,
    showLyricsOverlay,
    setShowLyricsOverlay,
    lyrics,
    onNext,
    onPrevious,
  }) => {
    const { direction } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const lyricsRef = useRef<HTMLDivElement>(null);
    const dragX = useMotionValue(0);
    const [containerWidth, setContainerWidth] = useState(300);
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<
      "none" | "left" | "right"
    >("none");
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const animatingRef = useRef(false);

    // Measure container
    useEffect(() => {
      const measure = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };
      measure();
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }, []);

    // Reset scroll on lyrics open
    useEffect(() => {
      if (showLyricsOverlay && lyricsRef.current) {
        lyricsRef.current.scrollTop = 0;
      }
    }, [showLyricsOverlay, lyrics]);

    // Derived transforms for neighboring covers
    const GAP = 16;
    const SIDE_SCALE = 0.85;

    // Current cover: scale down slightly as you drag
    const currentScale = useTransform(dragX, (v) => {
      const ratio = Math.min(Math.abs(v) / containerWidth, 1);
      return 1 - ratio * 0.08;
    });

    // Current cover: opacity reduces slightly
    const currentOpacity = useTransform(dragX, (v) => {
      const ratio = Math.min(Math.abs(v) / containerWidth, 1);
      return 1 - ratio * 0.15;
    });

    // Previous cover: starts off to the left, slides in
    const prevX = useTransform(dragX, (v) => {
      if (v <= 0) return -(containerWidth + GAP); // fully hidden
      const progress = Math.min(v / containerWidth, 1);
      return -(containerWidth + GAP) + progress * (containerWidth + GAP);
    });
    const prevScale = useTransform(dragX, (v) => {
      if (v <= 0) return SIDE_SCALE;
      const progress = Math.min(v / containerWidth, 1);
      return SIDE_SCALE + progress * (1 - SIDE_SCALE);
    });
    const prevOpacity = useTransform(dragX, (v) => {
      if (v <= 0) return 0;
      const progress = Math.min(v / containerWidth, 1);
      return Math.min(1, progress * 2);
    });

    // Next cover: starts off to the right, slides in
    const nextX = useTransform(dragX, (v) => {
      if (v >= 0) return containerWidth + GAP; // fully hidden
      const progress = Math.min(Math.abs(v) / containerWidth, 1);
      return containerWidth + GAP - progress * (containerWidth + GAP);
    });
    const nextScale = useTransform(dragX, (v) => {
      if (v >= 0) return SIDE_SCALE;
      const progress = Math.min(Math.abs(v) / containerWidth, 1);
      return SIDE_SCALE + progress * (1 - SIDE_SCALE);
    });
    const nextOpacity = useTransform(dragX, (v) => {
      if (v >= 0) return 0;
      const progress = Math.min(Math.abs(v) / containerWidth, 1);
      return Math.min(1, progress * 2);
    });

    // Border radius for current cover reduces on drag for smoother transition feel
    const currentBorderRadius = useTransform(dragX, (v) => {
      const ratio = Math.min(Math.abs(v) / containerWidth, 1);
      const base = 16; // 1rem
      return base - ratio * 4;
    });

    const handleDragStart = useCallback(() => {
      if (isAdPlaying || showLyricsOverlay || animatingRef.current) return;
      setIsSwiping(true);
      setSwipeDirection("none");
    }, [isAdPlaying, showLyricsOverlay]);

    const handleDrag = useCallback(() => {
      if (animatingRef.current) return;
      const v = dragX.get();
      if (v > 10 && previousTrack) {
        setSwipeDirection("right");
      } else if (v < -10 && nextTrack) {
        setSwipeDirection("left");
      } else {
        setSwipeDirection("none");
      }
    }, [dragX, previousTrack, nextTrack]);

    const handleDragEnd = useCallback(
      (_: unknown, info: PanInfo) => {
        if (animatingRef.current) return;

        const offset = info.offset.x;
        const velocity = info.velocity.x;

        // Determine if we should change track
        const swipeRight =
          (offset > COVER_SWIPE_THRESHOLD ||
            velocity > COVER_VELOCITY_THRESHOLD) &&
          previousTrack &&
          !isAdPlaying;
        const swipeLeft =
          (offset < -COVER_SWIPE_THRESHOLD ||
            velocity < -COVER_VELOCITY_THRESHOLD) &&
          nextTrack &&
          !isAdPlaying;

        if (swipeRight) {
          // Animate current out to the right, then trigger previous
          animatingRef.current = true;
          setIsAnimatingOut(true);
          animate(dragX, containerWidth + GAP, {
            type: "spring",
            damping: 28,
            stiffness: 280,
            velocity: velocity,
            onComplete: () => {
              onPrevious();
              // Reset immediately after track changes
              dragX.set(0);
              animatingRef.current = false;
              setIsAnimatingOut(false);
              setIsSwiping(false);
              setSwipeDirection("none");
            },
          });
        } else if (swipeLeft) {
          // Animate current out to the left, then trigger next
          animatingRef.current = true;
          setIsAnimatingOut(true);
          animate(dragX, -(containerWidth + GAP), {
            type: "spring",
            damping: 28,
            stiffness: 280,
            velocity: velocity,
            onComplete: () => {
              onNext();
              // Reset immediately after track changes
              dragX.set(0);
              animatingRef.current = false;
              setIsAnimatingOut(false);
              setIsSwiping(false);
              setSwipeDirection("none");
            },
          });
        } else {
          // Snap back
          animate(dragX, 0, {
            type: "spring",
            damping: 25,
            stiffness: 300,
          });
          setIsSwiping(false);
          setSwipeDirection("none");
        }
      },
      [
        containerWidth,
        dragX,
        isAdPlaying,
        nextTrack,
        onNext,
        onPrevious,
        previousTrack,
      ],
    );

    // Compute drag constraints: only allow dragging towards available tracks
    const dragConstraints = useMemo(() => {
      const left = nextTrack && !isAdPlaying ? -(containerWidth * 0.6) : 0;
      const right = previousTrack && !isAdPlaying ? containerWidth * 0.6 : 0;
      return { left, right };
    }, [nextTrack, previousTrack, isAdPlaying, containerWidth]);

    const canDrag = !isAdPlaying && !showLyricsOverlay && !isAnimatingOut;

    // Reduce cover image size by 10% for mobile expanded mode
    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-square overflow-hidden"
        style={{
          maxWidth: "min(54vh, 81vw)", // 10% smaller than before
          maxHeight: "min(54vh, 81vw)",
        }}
      >
        {/* Previous track cover */}
        {previousTrack && !isAdPlaying && (
          <motion.div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl pointer-events-none"
            style={{
              x: prevX,
              scale: prevScale,
              opacity: prevOpacity,
              zIndex: 5,
            }}
          >
            <ImageWithPlaceholder
              src={ensureHttps(previousTrack.image) || previousTrack.image}
              alt={previousTrack.title}
              className="w-full h-full object-cover"
              type="song"
            />
            {/* Slight dark overlay on side covers */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          </motion.div>
        )}

        {/* Next track cover */}
        {nextTrack && !isAdPlaying && (
          <motion.div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl pointer-events-none"
            style={{
              x: nextX,
              scale: nextScale,
              opacity: nextOpacity,
              zIndex: 5,
            }}
          >
            <ImageWithPlaceholder
              src={ensureHttps(nextTrack.image) || nextTrack.image}
              alt={nextTrack.title}
              className="w-full h-full object-cover"
              type="song"
            />
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          </motion.div>
        )}

        {/* Current track cover (draggable) */}
        <motion.div
          drag={canDrag ? "x" : false}
          dragConstraints={dragConstraints}
          dragElastic={0.15}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl group"
          style={{
            x: dragX,
            scale: currentScale,
            opacity: currentOpacity,
            zIndex: 15,
            touchAction: "pan-y",
            cursor: canDrag ? "grab" : "default",
          }}
          whileTap={canDrag ? { cursor: "grabbing" } : undefined}
        >
          <ImageWithPlaceholder
            src={ensureHttps(currentTrack.image) || currentTrack.image}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
            type="song"
          />

          {/* Swipe direction indicators */}
          <AnimatePresence>
            {isSwiping && swipeDirection === "right" && previousTrack && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-emerald-500/30 to-transparent pointer-events-none z-20"
              />
            )}
            {isSwiping && swipeDirection === "left" && nextTrack && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-emerald-500/30 to-transparent pointer-events-none z-20"
              />
            )}
          </AnimatePresence>

          {/* Lyrics button */}
          <AnimatePresence>
            {!showLyricsOverlay && !isAdPlaying && !isSwiping && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLyricsOverlay(true);
                }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium flex items-center gap-2 hover:bg-black/80 transition-all z-20"
              >
                <Icon.Lyrics c="w-4 h-4" />
                نمایش اشعار
              </motion.button>
            )}

            {showLyricsOverlay && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col p-6 z-30"
              >
                <div className="flex justify-end mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLyricsOverlay(false);
                    }}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <Icon.Close c="w-6 h-6" />
                  </button>
                </div>
                <div
                  ref={lyricsRef}
                  className="overflow-y-auto flex-1 space-y-4 py-4 w-full text-start"
                  dir={direction}
                >
                  {lyrics ? (
                    lyrics.split("\n").map((line, i) => (
                      <p
                        key={i}
                        className="text-white text-lg font-bold leading-relaxed whitespace-pre-wrap"
                      >
                        {line}
                      </p>
                    ))
                  ) : (
                    <div className="space-y-2">
                      <p className="text-white text-xl font-bold">
                        متن آهنگ یافت نشد
                      </p>
                      <p className="text-neutral-400 text-sm">
                        هنوز متنی برای این آهنگ ثبت نشده است
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isPlaying && !showLyricsOverlay && !isSwiping && (
            <div className="absolute bottom-3 right-3 z-20">
              <PlayingBars />
            </div>
          )}
        </motion.div>
      </div>
    );
  },
);
AlbumArtCarousel.displayName = "AlbumArtCarousel";

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
    isLiked,
    isLiking,
    toggleLike,
    isAdPlaying,
    currentAd,
    shuffleQueue,
  } = usePlayer();

  const { isDesktop } = useResponsiveLayout();
  const [dragX, setDragX] = useState(0);
  const { navigateTo } = useNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    blocked: boolean;
  } | null>(null);
  const x = useMotionValue(0);
  const width = containerRef.current?.offsetWidth || 350;
  const MAX_DRAG = width * 0.45;

  const displayTrack = useMemo(() => {
    if (isAdPlaying && currentAd) {
      return {
        id: `ad-${currentAd.id}`,
        title: currentAd.title,
        artist: "Advertisement",
        image: currentAd.image_cover || (currentTrack?.image as string),
        duration: formatTime(currentAd.duration),
        src: currentAd.audio_url,
      } as Track;
    }
    return currentTrack;
  }, [isAdPlaying, currentAd, currentTrack]);

  const handleDrag = useCallback(() => {
    const currentX = x.get();
    setDragX(currentX);
  }, [x]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (isAdPlaying) {
        animate(x, 0, { type: "spring", damping: 25, stiffness: 300 });
        setDragX(0);
        return;
      }

      const offset = info.offset.x;

      if (offset < -SWIPE_THRESHOLD && nextTrack) {
        next();
      } else if (offset > SWIPE_THRESHOLD && previousTrack) {
        previous();
      }

      animate(x, 0, { type: "spring", damping: 25, stiffness: 300 });
      setDragX(0);
    },
    [next, previous, nextTrack, previousTrack, x, isAdPlaying],
  );

  const handleMiniPointerDown = useCallback((event: React.PointerEvent) => {
    const target = event.target as HTMLElement | null;
    pointerStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      blocked: Boolean(
        target?.closest(
          "button, a, [role='link'], [data-player-no-expand='true']",
        ),
      ),
    };
  }, []);

  const clearMiniPointer = useCallback(() => {
    pointerStartRef.current = null;
  }, []);

  const handleMiniPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;

      const target = event.target as HTMLElement | null;
      if (
        !start ||
        start.pointerId !== event.pointerId ||
        start.blocked ||
        target?.closest(
          "button, a, [role='link'], [data-player-no-expand='true']",
        )
      ) {
        return;
      }

      const distance = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y,
      );
      if (distance <= MINI_PLAYER_TAP_SLOP) {
        onExpand();
      }
    },
    [onExpand],
  );

  if (!displayTrack) return null;

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
            dir="ltr" data-direction-fixed="ltr"
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
              {!isAdPlaying && (
                <>
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
                      dragX < 0
                        ? Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD)
                        : 0
                    }
                    isActive={dragX < -SWIPE_THRESHOLD}
                  />
                </>
              )}

              <motion.div
                drag={isAdPlaying ? false : "x"}
                dragConstraints={{ left: -MAX_DRAG, right: MAX_DRAG }}
                dragElastic={0.1}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onPointerDown={handleMiniPointerDown}
                onPointerUp={handleMiniPointerUp}
                onPointerCancel={clearMiniPointer}
                className="relative z-20 h-full w-full bg-neutral-900/95 backdrop-blur-md cursor-pointer active:cursor-grabbing shadow-xl border-x border-white/5"
                style={{
                  touchAction: "pan-y",
                  x,
                }}
              >
                <TrackSlide
                  key={displayTrack.id}
                  track={displayTrack}
                  playing={isPlaying}
                  loading={isLoading}
                  current
                  onPlay={togglePlay}
                  onNext={next}
                  onClose={isAdPlaying ? undefined : close}
                  isAdPlaying={isAdPlaying}
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
        dir="ltr"
        data-direction-fixed="ltr"
      >
        <div className="h-[90px] px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-[30%] min-w-0">
            <div
              className={`w-14 h-14 rounded-md overflow-hidden flex-shrink-0 ${
                isAdPlaying
                  ? ""
                  : "cursor-pointer hover:opacity-80 transition-opacity"
              }`}
              onClick={() => {
                if (isAdPlaying) return;
                if (isDesktop) {
                  navigateTo("song-detail", {
                    id: displayTrack.id,
                    artistSlug: createSlug(displayTrack.artist),
                    songSlug: createSlug(displayTrack.title),
                  });
                } else {
                  onExpand();
                }
              }}
            >
              <ImageWithPlaceholder
                src={displayTrack.image}
                alt={displayTrack.title}
                className="w-full h-full object-cover"
                type="song"
              />
            </div>
            <TrackIdentity
              track={displayTrack}
              isAdPlaying={isAdPlaying}
              compact
              titleClassName="text-sm font-medium"
              artistsClassName="text-zinc-400"
            />
            {!isAdPlaying && (
              <button
                onClick={toggleLike}
                disabled={isLiking}
                className={`p-2 transition-all flex-shrink-0 relative ${
                  isLiked
                    ? "text-emerald-500"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <div className={isLiking ? "opacity-30" : "opacity-100"}>
                    <Icon.Heart c="w-5 h-5" filled={isLiked} />
                  </div>
                  {isLiking && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Spinner size="w-3 h-3" />
                    </div>
                  )}
                </div>
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 w-[40%] max-w-[722px]">
            <div className="flex items-center gap-4">
              <button
                onClick={
                  (() => {
                    if (isAdPlaying) return;
                    setTimeout(() => {
                      if (isShuffle) {
                        toggleShuffle();
                        cycleRepeat();
                      } else if (repeatMode === "one") {
                        cycleRepeat();
                        cycleRepeat();
                      } else {
                        toggleShuffle();
                      }
                    }, 0);
                  }) as unknown as React.MouseEventHandler
                }
                disabled={isAdPlaying}
                className={`p-2 transition-colors relative ${
                  isShuffle || repeatMode === "one" || repeatMode === "all"
                    ? "text-emerald-500"
                    : "text-zinc-400 hover:text-white"
                } disabled:opacity-30`}
              >
                {isShuffle ? (
                  <Icon.Shuffle c="w-4 h-4" />
                ) : repeatMode === "one" ? (
                  <>
                    <Icon.Repeat c="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 text-[10px] font-semibold text-emerald-500">
                      1
                    </span>
                  </>
                ) : (
                  <Icon.Repeat c="w-4 h-4" />
                )}
              </button>
              <button
                onClick={previous}
                disabled={!previousTrack || isAdPlaying}
                className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
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
                disabled={!nextTrack || isAdPlaying}
                className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
              >
                <Icon.Next c="w-5 h-5" />
              </button>
              {/* Single dynamic button above handles shuffle/repeat display and actions; duplicate repeat button removed */}
            </div>
            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-zinc-400 w-10 text-start tabular-nums">
                {formatTime(progress)}
              </span>
              <div
                className={`flex-1 h-1 bg-zinc-700 rounded-full group relative ${
                  isAdPlaying ? "" : "cursor-pointer"
                }`}
                onClick={(e) => {
                  if (isAdPlaying) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  seek(pct * duration);
                }}
              >
                <div
                  className={`h-full bg-white ${
                    isAdPlaying ? "" : "group-hover:bg-emerald-500"
                  } rounded-full transition-colors relative`}
                  style={{
                    left: 0,
                    transformOrigin: "left center",
                    width: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
                  }}
                />
                {!isAdPlaying && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      left: `${duration > 0 ? (progress / duration) * 100 : 0}%`,
                    }}
                  />
                )}
              </div>
              <span className="text-xs text-zinc-400 w-10 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-[30%]">
            <ProfilePillButton onClick={() => navigateTo("profile")} />
            <button
              className="p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
              onClick={onExpand}
              disabled={isAdPlaying}
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
const DesktopExpandedPlayer = memo<{
  onCollapse: () => void;
  userPlan?: string | null;
  banner?: BannerAd | null;
  onBannerLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onBannerError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}>(({ onCollapse, userPlan, banner, onBannerLoad, onBannerError }) => {
  const { direction } = useI18n();
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
    reorderQueue,
    isLiked,
    likesCount,
    isLiking,
    toggleLike,
    lyrics,
    download,
    isAdPlaying,
    currentAd,
    shuffleQueue,
    quality,
    setQuality,
  } = usePlayer();

  const { updateStreamQuality, formatErrorMessage } = useAuth();

  const isPremium = userPlan === "premium";
  const isFree = userPlan !== "premium";

  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [isQualitySheetOpen, setIsQualitySheetOpen] = useState(false);
  const [addSongId, setAddSongId] = useState<string | number | null>(null);

  const [activeTab, setActiveTab] = useState<"queue" | "lyrics" | "related">(
    "queue",
  );

  const { accessToken, authenticatedFetch } = useAuth();
  const [relatedSongs, setRelatedSongs] = useState<Track[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  useEffect(() => {
    const fetchRelatedSongs = async () => {
      if (!currentTrack || isAdPlaying) return;

      setIsLoadingRelated(true);
      try {
        const resp = await authenticatedFetch(
          `https://api.sedabox.com/api/songs/${currentTrack.id}/`,
        );

        if (resp.ok) {
          const data = await resp.json();
          if (data.similar_songs?.items) {
            const mapped: Track[] = data.similar_songs.items.map((s: any) => ({
              id: s.id.toString(),
              title: s.title,
              artist: s.artist_name,
              artistId: s.artist_id || s.artist,
              image: s.cover_image,
              duration:
                s.duration_display ||
                (s.duration_seconds ? formatTime(s.duration_seconds) : "0:00"),
              src: s.stream_url || s.audio_file || "",
            }));
            setRelatedSongs(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch related songs:", err);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    fetchRelatedSongs();
  }, [currentTrack?.id, accessToken, isAdPlaying]);

  const displayTrack = useMemo(() => {
    if (isAdPlaying && currentAd) {
      return {
        id: `ad-${currentAd.id}`,
        title: currentAd.title,
        artist: "Advertisement",
        image: currentAd.image_cover || (currentTrack?.image as string),
        duration: formatTime(currentAd.duration),
        src: currentAd.audio_url,
      } as Track;
    }
    return currentTrack;
  }, [isAdPlaying, currentAd, currentTrack]);

  const handleArtistClick = useCallback(() => {
    if (isAdPlaying) return;
    if (currentTrack) {
      const artistId = currentTrack.artistId || (currentTrack as any).artist_id;
      if (artistId) {
        onCollapse();
        navigateTo("artist-detail", {
          id: artistId,
          slug:
            (currentTrack as any).artist_unique_id ||
            createSlug(currentTrack.artist),
        });
        return;
      }
    }
  }, [currentTrack, navigateTo, onCollapse, isAdPlaying]);

  // Desktop menu / share positioning
  const [isMenuOpenDesktop, setIsMenuOpenDesktop] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [sharePos, setSharePos] = useState({ x: 0, y: 0 });
  const [isQueueOpenDesktop, setIsQueueOpenDesktop] = useState(false);

  const openMenuAt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const x = e.clientX;
    const y = e.clientY;
    const offsetX = 12;
    const offsetY = 8;
    const width = 220; // approx menu width
    const left = Math.min(
      Math.max(8, x + offsetX),
      window.innerWidth - width - 8,
    );
    const top = Math.min(Math.max(8, y + offsetY), window.innerHeight - 40 - 8);
    setMenuPos({ x: left, y: top });
    setIsMenuOpenDesktop(true);
    setIsShareMenuOpen(false);
  };

  const openShareAt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const x = e.clientX;
    const y = e.clientY;
    const offsetX = 12;
    const offsetY = 8;
    const width = 200;
    const left = Math.min(
      Math.max(8, x + offsetX),
      window.innerWidth - width - 8,
    );
    const top = Math.min(Math.max(8, y + offsetY), window.innerHeight - 40 - 8);
    setSharePos({ x: left, y: top });
    setIsShareMenuOpen(true);
    setIsMenuOpenDesktop(false);
  };

  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      const tgt = ev.target as Element | null;
      if (tgt && tgt.closest && tgt.closest(".desktop-menu") === null) {
        setIsMenuOpenDesktop(false);
      }
      if (tgt && tgt.closest && tgt.closest(".desktop-share-menu") === null) {
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const generateAndCopyLink = async (type: "song" | "artist") => {
    try {
      if (!displayTrack) return;
      const id = (displayTrack.id as any) ?? "";
      const name = type === "song" ? displayTrack.title : displayTrack.artist;
      const url = getFullShareUrl(
        type === "song" ? "song" : "artist",
        id,
        name,
      );

      const shareText = `گوش دادن به ${displayTrack.title || "آهنگ"} از ${displayTrack.artist || "هنرمند"} در سداباکس`;
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        try {
          await (navigator as any).share({
            title: displayTrack.title || displayTrack.artist || "SedaBox",
            text: shareText,
            url,
          });
          setIsShareMenuOpen(false);
          return;
        } catch (e) {
          console.error("Web Share failed:", e);
        }
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("لینک کپی شد");
        setIsShareMenuOpen(false);
        return;
      }

      if (typeof window !== "undefined") {
        window.open(url, "_blank");
        setIsShareMenuOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("خطا در تولید لینک");
    }
  };

  const handleTitleClick = useCallback(() => {
    if (isAdPlaying) return;
    if (currentTrack) {
      onCollapse();
      navigateTo("song-detail", {
        id: currentTrack.id,
        artistSlug:
          (currentTrack as any).artist_unique_id ||
          createSlug(currentTrack.artist),
        songSlug: createSlug(currentTrack.title),
      });
    }
  }, [currentTrack, navigateTo, onCollapse, isAdPlaying]);

  if (!displayTrack) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] bg-black"
      dir={direction}
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={ensureHttps(displayTrack.image) || displayTrack.image}
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
              بازگشت
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => openShareAt(e)}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/20 transition-all"
            >
              <Icon.Share c="w-5 h-5" />
            </button>
            {!isAdPlaying && (
              <button
                onClick={(e) => openMenuAt(e)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/20 transition-all"
              >
                <Icon.More c="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex items-center px-8 pb-8 gap-12 min-h-0 flex-row-reverse">
          {/* Left Section - Artwork & Info */}
          <div className="flex-1 flex flex-col items-center justify-start pt-[2vh]">
            <AnimatePresence>
              {isFree && banner && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="w-full flex justify-center overflow-hidden px-8"
                  style={{ willChange: "height, opacity, margin" }}
                >
                  <div className="w-full max-w-[40vw] aspect-25/8">
                    <a
                      href={banner.navigate_link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-full block group"
                    >
                      <img
                        src={ensureHttps(banner.image) || banner.image}
                        alt={banner.title}
                        onLoad={onBannerLoad}
                        onError={onBannerError}
                        className="w-full h-full object-cover rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group-hover:border-white/20 transition-all duration-300"
                      />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
              <div className="flex items-center gap-10 max-w-3xl w-full">
                {/* Album Art */}
                <div className="relative flex-shrink-0" key={displayTrack.id}>
                  <div className="w-72 h-72 xl:w-80 xl:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
                    <ImageWithPlaceholder
                      src={
                        ensureHttps(displayTrack.image) || displayTrack.image
                      }
                      alt={displayTrack.title}
                      className="w-full h-full object-cover"
                      type="song"
                    />
                  </div>
                </div>

                {/* Track Info & Controls */}
                <div className="flex-1 min-w-0 space-y-8 text-start">
                  {/* Track Meta */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 justify-start">
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 rounded-full">
                        {isAdPlaying ? "تبلیغ" : "در حال پخش"}
                      </span>
                    </div>
                    <TrackIdentity
                      track={displayTrack}
                      isAdPlaying={isAdPlaying}
                      onBeforeNavigate={onCollapse}
                      titleClassName="text-4xl xl:text-3xl font-bold tracking-tight leading-tight"
                      artistsClassName="[&_button]:text-xl [&_span]:text-xl [&_button]:text-neutral-300"
                    />
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
                      onClick={
                        (() => {
                          if (isAdPlaying) return;
                          setTimeout(() => {
                            if (isShuffle) {
                              toggleShuffle();
                              cycleRepeat();
                            } else if (repeatMode === "one") {
                              cycleRepeat();
                              cycleRepeat();
                            } else {
                              toggleShuffle();
                            }
                          }, 0);
                        }) as unknown as React.MouseEventHandler
                      }
                      disabled={isAdPlaying}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative ${
                        isShuffle ||
                        repeatMode === "one" ||
                        repeatMode === "all"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                      } disabled:opacity-30`}
                    >
                      {isShuffle ? (
                        <Icon.Shuffle c="w-5 h-5" />
                      ) : repeatMode === "one" ? (
                        <>
                          <Icon.Repeat c="w-5 h-5" />
                          <span className="absolute -top-1 -right-1 text-[10px] font-semibold text-emerald-500">
                            1
                          </span>
                        </>
                      ) : (
                        <Icon.Repeat c="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={next}
                      disabled={isAdPlaying}
                      className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105 disabled:opacity-30"
                    >
                      <Icon.Next c="w-7 h-7" />
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
                      onClick={previous}
                      disabled={isAdPlaying}
                      className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-105 disabled:opacity-30"
                    >
                      <Icon.Prev c="w-7 h-7" />
                    </button>

                    {!isAdPlaying ? (
                      <button
                        onClick={toggleLike}
                        disabled={isLiking}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isLiked
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                        } ${isLiking ? "cursor-wait" : ""}`}
                      >
                        <div className="relative flex items-center justify-center">
                          <div
                            className={isLiking ? "opacity-30" : "opacity-100"}
                          >
                            <Icon.Heart c="w-7 h-7" filled={isLiked} />
                          </div>
                          {isLiking && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Spinner size="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </button>
                    ) : (
                      <div className="w-12" />
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!isAdPlaying && (
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setAddSongId(displayTrack.id);
                          setIsAddToPlaylistOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Icon.Add c="w-5 h-5" />
                        <span className="text-sm font-medium">
                          افزودن به پلی‌لیست
                        </span>
                      </button>
                      <button
                        onClick={() => isPremium && download(currentTrack!)}
                        disabled={!isPremium}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all relative ${
                          !isPremium
                            ? "opacity-60 cursor-not-allowed bg-white/3 text-white/60"
                            : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon.Download c="w-5 h-5" />
                        <span className="text-sm font-medium">دانلود آهنگ</span>

                        {!isPremium && (
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-[10px] px-3 py-0.5 rounded-full font-semibold shadow-md">
                            پریمیوم
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Queue/Lyrics Panel */}
          <div
            className="w-96 xl:w-[420px] h-full flex flex-col bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {(["queue", "lyrics", "related"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  disabled={isAdPlaying && tab !== "queue"}
                  className={`flex-1 py-4 text-sm font-medium transition-all relative ${
                    activeTab === tab
                      ? "text-white"
                      : "text-neutral-500 hover:text-neutral-300"
                  } disabled:opacity-30`}
                >
                  {tab === "queue"
                    ? "پخش بعدی"
                    : tab === "lyrics"
                      ? "متن"
                      : "مرتبط"}
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
                      {queue.length} آهنگ در صف
                    </span>
                    <span className="text-xs text-neutral-500">
                      {currentIndex + 1} از {queue.length}
                    </span>
                  </div>
                  {queue.map((track, i) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => !isAdPlaying && playTrack(track)}
                      className={`group flex items-center gap-3 p-3 rounded-xl transition-all ${
                        i === currentIndex
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : isAdPlaying
                            ? "opacity-50"
                            : "hover:bg-white/5 cursor-pointer"
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithPlaceholder
                          src={ensureHttps(track.image) || track.image}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          type="song"
                        />
                        {i === currentIndex && isPlaying && !isAdPlaying ? (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <PlayingBars />
                          </div>
                        ) : !isAdPlaying ? (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Icon.Play c="w-5 h-5 text-white" />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium truncate ${
                            i === currentIndex && !isAdPlaying
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

                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAdPlaying || i === 0) return;
                            const newQueue = [...queue];
                            const items = newQueue.splice(i, 1);
                            newQueue.splice(i - 1, 0, items[0]);
                            reorderQueue(newQueue);
                          }}
                          disabled={i === 0}
                          aria-label="move up"
                          title="move up"
                          className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
                            i === 0
                              ? "opacity-30 cursor-not-allowed"
                              : "text-neutral-400"
                          }`}
                        >
                          <Icon.ChevronUp c="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAdPlaying || i === queue.length - 1) return;
                            const newQueue = [...queue];
                            const items = newQueue.splice(i, 1);
                            newQueue.splice(i + 1, 0, items[0]);
                            reorderQueue(newQueue);
                          }}
                          disabled={i === queue.length - 1}
                          aria-label="move down"
                          title="move down"
                          className={`p-1 rounded-md hover:bg-white/10 transition-colors ${
                            i === queue.length - 1
                              ? "opacity-30 cursor-not-allowed"
                              : "text-neutral-400"
                          }`}
                        >
                          <Icon.ChevronDown c="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAdPlaying) return;
                            const newQueue = queue.filter((_, j) => j !== i);
                            reorderQueue(newQueue);
                          }}
                          aria-label="delete"
                          title="حذف از صف"
                          className="p-1 rounded-md hover:bg-red-600/10 text-red-400"
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
                  ))}
                </div>
              )}

              {activeTab === "lyrics" && (
                <div className="h-full overflow-y-auto p-8">
                  {lyrics ? (
                    <div className="space-y-6 text-start">
                      {lyrics.split("\n").map((line, i) => (
                        <p
                          key={i}
                          className="text-xl md:text-2xl font-bold text-white/90 hover:text-white transition-colors cursor-default whitespace-pre-wrap"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                          <Icon.Lyrics c="w-8 h-8 text-neutral-500" />
                        </div>
                        <div>
                          <p className="text-neutral-400 font-medium">
                            متن آهنگ یافت نشد
                          </p>
                          <p className="text-sm text-neutral-600 mt-1">
                            هنوز متنی برای این آهنگ ثبت نشده است
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "related" && (
                <div className="h-full overflow-y-auto p-4 space-y-1">
                  {isLoadingRelated ? (
                    <div className="h-full flex items-center justify-center">
                      <Spinner size="w-8 h-8" />
                    </div>
                  ) : relatedSongs.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium">
                          آهنگ‌های پیشنهادی مشابه
                        </span>
                      </div>
                      {relatedSongs.map((track, i) => (
                        <motion.div
                          key={track.id}
                          initial={false}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => !isAdPlaying && playTrack(track)}
                          className="group flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 cursor-pointer"
                        >
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <ImageWithPlaceholder
                              src={ensureHttps(track.image) || track.image}
                              alt={track.title}
                              className="w-full h-full object-cover"
                              type="song"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Icon.Play c="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-white">
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
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                          <Icon.Queue c="w-8 h-8 text-neutral-500" />
                        </div>
                        <div>
                          <p className="text-neutral-400 font-medium">
                            آهنگ مشابهی پیدا نشد
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
        songId={addSongId ?? (displayTrack ? (displayTrack.id as any) : "")}
      />
      <QualitySelectorSheet
        isOpen={isQualitySheetOpen}
        onClose={() => setIsQualitySheetOpen(false)}
        currentQuality={quality}
        isPremium={isPremium}
        onSelect={async (q) => {
          if (q === "high" && !isPremium) {
            toast.error("کیفیت ۳۲۰ فقط برای کاربران ویژه فعال است.");
            return;
          }

          const tid = toast.loading("در حال تغییر کیفیت پخش...");
          try {
            await updateStreamQuality(q);
            await setQuality(q);
            toast.success("کیفیت پخش تغییر یافت", { id: tid });
          } catch (err: any) {
            toast.error(formatErrorMessage(err) || "خطا در تغییر کیفیت پخش", {
              id: tid,
            });
          }
        }}
      />
      {/* Desktop fixed menus (positioned at mouse click) */}
      <AnimatePresence>
        {isMenuOpenDesktop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed desktop-menu z-[80] bg-neutral-800 rounded-lg shadow-2xl border border-white/10 overflow-hidden min-w-[200px]"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <div className="py-2" dir={direction}>
              <button
                onClick={() => {
                  setIsMenuOpenDesktop(false);
                  handleArtistClick();
                }}
                className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Icon.More c="w-5 h-5" />
                مشاهده هنرمند
              </button>

              <button
                onClick={() => {
                  setIsMenuOpenDesktop(false);
                  setAddSongId(displayTrack.id);
                  setIsAddToPlaylistOpen(true);
                }}
                className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Icon.Add c="w-5 h-5" />
                افزودن به پلی‌لیست
              </button>

              <button
                onClick={() => {
                  setIsMenuOpenDesktop(false);
                  if (isPremium && currentTrack) download(currentTrack);
                }}
                disabled={!isPremium}
                className={`w-full px-4 py-3 text-start text-white transition-colors flex items-center gap-3 relative ${
                  !isPremium
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-white/10"
                }`}
              >
                <Icon.Download c="w-5 h-5" />
                دانلود آهنگ
                {!isPremium && (
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-[10px] px-3 py-0.5 rounded-full font-semibold shadow-md">
                    پریمیوم
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setIsMenuOpenDesktop(false);
                  setIsQueueOpenDesktop(true);
                }}
                className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Icon.Queue c="w-5 h-5" />
                نمایش صف پخش
              </button>

              <button
                onClick={() => {
                  setIsMenuOpenDesktop(false);
                  shuffleQueue();
                }}
                className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3 font-medium"
              >
                <Icon.Shuffle c="w-5 h-5 text-emerald-400" />
                مخلوط کردن صف پخش (shuffle)
              </button>

              <button
                onClick={() => {
                  setIsMenuOpenDesktop(false);
                  setIsQualitySheetOpen(true);
                }}
                className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Icon.Volume c="w-5 h-5" />
                تغییر کیفیت پخش
              </button>

              <button
                onClick={(e) => {
                  // open share sub-menu at same position
                  setIsMenuOpenDesktop(false);
                  openShareAt(e as unknown as React.MouseEvent);
                }}
                className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Icon.Share c="w-5 h-5" />
                اشتراک‌گذاری
              </button>

              <button
                onClick={() => {
                  setIsMenuOpenDesktop(false);
                  generateAndCopyLink("song");
                }}
                className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Icon.Share c="w-5 h-5" />
                کپی لینک آهنگ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShareMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed desktop-share-menu z-[81] bg-neutral-800 rounded-lg shadow-2xl border border-white/10 overflow-hidden min-w-[180px]"
            style={{ left: sharePos.x, top: sharePos.y }}
          >
            <div className="py-2" dir={direction}>
              <button
                onClick={() => generateAndCopyLink("song")}
                className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Icon.Share c="w-5 h-5" />
                اشتراک‌گذاری آهنگ
              </button>
              <button
                onClick={() => generateAndCopyLink("artist")}
                className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <User className="w-5 h-5" />
                اشتراک‌گذاری هنرمند
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <QueueSheet
        isOpen={isQueueOpenDesktop}
        onClose={() => setIsQueueOpenDesktop(false)}
      />
    </motion.div>
  );
});
DesktopExpandedPlayer.displayName = "DesktopExpandedPlayer";

// ============================================================================
// MOBILE EXPANDED PLAYER
// ============================================================================
const MobileExpandedPlayer = memo<{
  onCollapse: () => void;
  userPlan: string | null;
  banner: BannerAd | null;
  onBannerLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onBannerError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}>(({ onCollapse, userPlan, banner, onBannerLoad, onBannerError }) => {
  const { direction } = useI18n();
  const { navigateTo } = useNavigation();
  const {
    currentTrack,
    previousTrack,
    nextTrack,
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
    isLiked,
    isLiking,
    toggleLike,
    lyrics,
    download,
    isAdPlaying,
    currentAd,
    shuffleQueue,
    quality,
    setQuality,
  } = usePlayer();
  const { updateStreamQuality, formatErrorMessage } = useAuth();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQualitySheetOpen, setIsQualitySheetOpen] = useState(false);
  const [showLyricsOverlay, setShowLyricsOverlay] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [addSongId, setAddSongId] = useState<string | number | null>(null);

  const isPremium = userPlan === "premium";

  const displayTrack = useMemo(() => {
    if (isAdPlaying && currentAd) {
      return {
        id: `ad-${currentAd.id}`,
        title: currentAd.title,
        artist: "Advertisement",
        image: currentAd.image_cover || (currentTrack?.image as string),
        duration: formatTime(currentAd.duration),
        src: currentAd.audio_url,
      } as Track;
    }
    return currentTrack;
  }, [isAdPlaying, currentAd, currentTrack]);

  const handleArtistClick = () => {
    if (isAdPlaying) return;
    if (currentTrack) {
      const artistId = currentTrack.artistId || (currentTrack as any).artist_id;
      if (artistId) {
        onCollapse();
        navigateTo("artist-detail", {
          id: artistId,
          slug:
            (currentTrack as any).artist_unique_id ||
            createSlug(currentTrack.artist),
        });
        return;
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.velocity.y > 500 || info.offset.y > 100) onCollapse();
    },
    [onCollapse],
  );

  if (!displayTrack) return null;

  const isFree = userPlan !== "premium";

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: 0.5 } },
      }}
      className="fixed inset-0 z-60 flex flex-col bg-transparent overflow-hidden"
    >
      <AnimatePresence>
        {isFree && banner && (
          <motion.div
            variants={{
              initial: { height: 0, opacity: 0 },
              animate: { height: "auto", opacity: 1 },
              exit: { height: 0, opacity: 0 },
            }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full border-b border-white/10 flex items-center justify-center shrink-0 overflow-hidden"
            style={{ willChange: "height, opacity" }}
          >
            <div className="w-full aspect-25/8 p-2.5">
              <a
                href={banner.navigate_link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-full block"
              >
                <img
                  src={ensureHttps(banner.image) || banner.image}
                  alt={banner.title}
                  onLoad={onBannerLoad}
                  onError={onBannerError}
                  className="w-full h-full object-cover rounded-lg"
                />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        variants={{
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={handleDragEnd}
        className="relative flex-1 flex flex-col bg-linear-to-b from-neutral-900 via-neutral-950 to-black overflow-y-auto overflow-x-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
        style={{ willChange: "transform, opacity" }}
      >
        <div
          dir="ltr" data-direction-fixed="ltr"
          className="relative flex flex-col min-h-0 h-full px-3 py-4 sm:px-6 sm:py-8 overflow-hidden"
        >
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-start gap-2 mb-4">
            <button
              onClick={onCollapse}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
            >
              <Icon.Down c="w-6 h-6 text-white" />
            </button>
            <div className="min-w-0 px-1 pt-0.5 text-center">
              <TrackIdentity
                track={displayTrack}
                isAdPlaying={isAdPlaying}
                align="center"
                onBeforeNavigate={onCollapse}
                titleClassName="text-lg font-bold text-white"
                artistsClassName="[&_button]:text-sm [&_span]:text-sm"
              />
            </div>
            {!isAdPlaying ? (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="menu-button w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors relative"
              >
                <Icon.More c="w-5 h-5 text-white" />
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          <div className="flex-1 flex flex-col items-center px-2 sm:px-4">
            {/* Album Art Carousel with swipe gesture */}
            <AlbumArtCarousel
              key={`carousel-${displayTrack.id}`}
              currentTrack={displayTrack}
              previousTrack={isAdPlaying ? null : previousTrack}
              nextTrack={isAdPlaying ? null : nextTrack}
              isPlaying={isPlaying}
              isAdPlaying={isAdPlaying}
              showLyricsOverlay={showLyricsOverlay}
              setShowLyricsOverlay={setShowLyricsOverlay}
              lyrics={lyrics}
              onNext={next}
              onPrevious={previous}
            />

            <div
              className="mt-4 sm:mt-8 mb-4 sm:mb-6 w-full max-w-[900px]"
            ></div>

            <div className="w-full max-w-[900px] flex flex-col items-center flex-grow justify-center">
              <div className="w-full mb-6">
                <ProgressBar
                  progress={progress}
                  duration={duration}
                  onSeek={isAdPlaying ? () => {} : seek}
                />
              </div>

              <div className="flex items-center justify-between w-full mb-4 sm:mb-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={
                      (() => {
                        if (isAdPlaying) return;
                        setTimeout(() => {
                          if (isShuffle) {
                            toggleShuffle();
                            cycleRepeat();
                          } else if (repeatMode === "one") {
                            cycleRepeat();
                            cycleRepeat();
                          } else {
                            toggleShuffle();
                          }
                        }, 0);
                      }) as unknown as React.MouseEventHandler
                    }
                    disabled={isAdPlaying}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${
                      isShuffle || repeatMode === "one" || repeatMode === "all"
                        ? "text-emerald-500"
                        : "text-neutral-400 hover:text-white"
                    } disabled:opacity-30`}
                  >
                    {isShuffle ? (
                      <Icon.Shuffle c="w-5 h-5" />
                    ) : repeatMode === "one" ? (
                      <>
                        <Icon.Repeat c="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 text-[10px] font-semibold text-emerald-500">
                          1
                        </span>
                      </>
                    ) : (
                      <Icon.Repeat c="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={previous}
                    disabled={isAdPlaying}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white hover:bg-neutral-800 flex items-center justify-center transition-colors disabled:opacity-30"
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
                    disabled={isAdPlaying}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full text-white hover:bg-neutral-800 flex items-center justify-center transition-colors disabled:opacity-30"
                  >
                    <Icon.Next c="w-10 h-10 sm:w-8 sm:h-8" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!isAdPlaying ? (
                    <button
                      onClick={toggleLike}
                      disabled={isLiking}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${
                        isLiked
                          ? "text-emerald-500"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        <div
                          className={isLiking ? "opacity-30" : "opacity-100"}
                        >
                          <Icon.Heart c="w-7 h-7" filled={isLiked} />
                        </div>
                        {isLiking && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Spinner size="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className="w-10" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fixed: Share and Queue buttons placed at lowest position with m-2 */}
        <div className="fixed left-0 right-0 bottom-0 z-[70] pointer-events-auto">
          <div className="max-w-[900px] mx-auto m-2 px-2 pb-safe flex items-center justify-between">
            <button className="m-2 text-neutral-400 hover:text-white transition-colors">
              <Icon.Share c="w-5 h-5" />
            </button>

            <button
              onClick={() => !isAdPlaying && setIsQueueOpen(true)}
              disabled={isAdPlaying}
              className="m-2 text-neutral-400 hover:text-white transition-colors disabled:opacity-30"
            >
              <Icon.Queue c="w-5 h-5" />
            </button>
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
              dir={direction}
            >
              <div className="py-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleArtistClick();
                  }}
                  className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <Icon.More c="w-5 h-5" />
                  مشاهده هنرمند
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setAddSongId(displayTrack.id);
                    setIsAddToPlaylistOpen(true);
                  }}
                  className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <Icon.Add c="w-5 h-5" />
                  افزودن به پلی‌لیست
                </button>
                <button
                  onClick={() => {
                    if (!isPremium) return;
                    setIsMenuOpen(false);
                    if (currentTrack) download(currentTrack);
                  }}
                  disabled={!isPremium}
                  className={`w-full px-4 py-3 text-start text-white transition-colors flex items-center gap-3 relative ${
                    !isPremium
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-white/10"
                  }`}
                >
                  <Icon.Download c="w-5 h-5" />
                  دانلود آهنگ
                  {!isPremium && (
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-[10px] px-3 py-0.5 rounded-full font-semibold shadow-md">
                      پریمیوم
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCollapse();
                    if (currentTrack) {
                      navigateTo("song-detail", {
                        id: currentTrack.id,
                        artistSlug:
                          (currentTrack as any).artist_unique_id ||
                          createSlug(currentTrack.artist),
                        songSlug: createSlug(currentTrack.title),
                      });
                    }
                  }}
                  className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <Icon.Queue c="w-5 h-5" />
                  جزئیات آهنگ
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <Icon.Share c="w-5 h-5" />
                  اشتراک‌گذاری
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsQueueOpen(true);
                  }}
                  className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <Icon.Queue c="w-5 h-5" />
                  نمایش صف پخش
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    shuffleQueue();
                  }}
                  className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3 font-medium text-emerald-400"
                >
                  <Icon.Shuffle c="w-5 h-5" />
                  مخلوط کردن صف پخش (shuffle)
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsQualitySheetOpen(true);
                  }}
                  className="w-full px-4 py-3 text-start text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                >
                  <Icon.Volume c="w-5 h-5" />
                  تغییر کیفیت
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <QualitySelectorSheet
          isOpen={isQualitySheetOpen}
          onClose={() => setIsQualitySheetOpen(false)}
          currentQuality={quality}
          isPremium={isPremium}
          onSelect={async (q) => {
            if (q === "high" && !isPremium) {
              toast.error("کیفیت ۳۲۰ فقط برای کاربران ویژه فعال است.");
              return;
            }

            const tid = toast.loading("در حال تغییر کیفیت پخش...");
            try {
              await updateStreamQuality(q);
              await setQuality(q);
              toast.success("کیفیت پخش تغییر یافت", { id: tid });
            } catch (err: any) {
              toast.error(formatErrorMessage(err) || "خطا در تغییر کیفیت پخش", {
                id: tid,
              });
            }
          }}
        />

        <AddToPlaylistModal
          isOpen={isAddToPlaylistOpen}
          onClose={() => setIsAddToPlaylistOpen(false)}
          songId={addSongId ?? (displayTrack ? (displayTrack.id as any) : "")}
        />
      </motion.div>
    </motion.div>
  );
});
MobileExpandedPlayer.displayName = "MobileExpandedPlayer";

// ============================================================================
// EXPANDED PLAYER WRAPPER
// ============================================================================
const ExpandedPlayer = memo<{
  onCollapse: () => void;
  userPlan: string | null;
  banner: BannerAd | null;
  onBannerLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onBannerError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}>(({ onCollapse, userPlan, banner, onBannerLoad, onBannerError }) => {
  const { isDesktop } = useResponsiveLayout();

  if (isDesktop) {
    return (
      <DesktopExpandedPlayer
        onCollapse={onCollapse}
        userPlan={userPlan}
        banner={banner}
        onBannerLoad={onBannerLoad}
        onBannerError={onBannerError}
      />
    );
  }

  return (
    <MobileExpandedPlayer
      onCollapse={onCollapse}
      userPlan={userPlan}
      banner={banner}
      onBannerLoad={onBannerLoad}
      onBannerError={onBannerError}
    />
  );
});
ExpandedPlayer.displayName = "ExpandedPlayer";

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function MusicPlayer() {
  const { isLoggedIn, user, authenticatedFetch } = useAuth();
  const { requestAuth } = useGuestAccess();
  const { language } = useI18n();
  const userPlan = user?.plan || null;
  const { isVisible, isExpanded, expand, collapse, setVolume } = usePlayer();
  const authenticatedFetchRef = useRef(authenticatedFetch);
  authenticatedFetchRef.current = authenticatedFetch;
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [banner, setBanner] = useState<BannerAd | null>(null);
  const bannerRequestIdRef = useRef(0);

  useEffect(() => {
    setPortalRoot(document.getElementById("music-player-root"));
  }, []);

  useEffect(() => {
    const requestId = ++bannerRequestIdRef.current;
    const controller = new AbortController();
    const eligible = isVisible && isExpanded && userPlan !== "premium";

    clientTrace("PLAYER_AD", "eligibility:evaluated", {
      requestId,
      isVisible,
      isExpanded,
      isLoggedIn,
      userPlan,
      language,
      eligible,
    });

    if (!eligible) {
      setBanner(null);
      clientTrace("PLAYER_AD", "request:skipped", {
        requestId,
        reason: !isVisible
          ? "player-hidden"
          : !isExpanded
            ? "player-collapsed"
            : "premium-plan",
      });
      return () => controller.abort();
    }

    const url = `${API_ROOT}/ads/banner/`;
    const startedAt = performance.now();
    const timeoutId = window.setTimeout(() => {
      clientTrace(
        "PLAYER_AD",
        "request:timeout",
        { requestId, url, timeoutMs: BANNER_REQUEST_TIMEOUT_MS },
        "error",
      );
      controller.abort("banner-request-timeout");
    }, BANNER_REQUEST_TIMEOUT_MS);

    setBanner(null);
    clientTrace("PLAYER_AD", "request:start", {
      requestId,
      url,
      authenticated: isLoggedIn,
      language,
    });

    void (async () => {
      try {
        const requestInit: RequestInit = {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Accept-Language": language,
          },
        };
        const response = isLoggedIn
          ? await authenticatedFetchRef.current(url, requestInit)
          : await fetch(url, requestInit);

        const contentType = response.headers.get("content-type") || "";
        clientTrace("PLAYER_AD", "response:received", {
          requestId,
          status: response.status,
          ok: response.ok,
          type: response.type,
          redirected: response.redirected,
          responseUrl: response.url,
          contentType,
          elapsedMs: Math.round(performance.now() - startedAt),
        });

        if (response.status === 204) {
          setBanner(null);
          clientTrace("PLAYER_AD", "response:no-active-banner", { requestId });
          return;
        }

        const bodyText = await response.text();
        clientTrace("PLAYER_AD", "response:body-read", {
          requestId,
          bytes: new Blob([bodyText]).size,
          preview: bodyText.slice(0, 240),
        });

        if (!response.ok) {
          throw new Error(
            `Banner request failed with ${response.status}: ${bodyText.slice(0, 180)}`,
          );
        }

        let rawData: any;
        try {
          rawData = bodyText ? JSON.parse(bodyText) : null;
        } catch (parseError) {
          throw new Error(
            `Banner endpoint returned invalid JSON (${contentType || "unknown content-type"})`,
            { cause: parseError },
          );
        }

        const data =
          rawData?.data ??
          rawData?.result ??
          (Array.isArray(rawData?.results) ? rawData.results[0] : rawData);
        if (controller.signal.aborted || requestId !== bannerRequestIdRef.current) {
          clientTrace("PLAYER_AD", "response:ignored-stale", { requestId });
          return;
        }

        const image =
          data?.image || data?.image_url || data?.banner_image || null;
        if (typeof image !== "string" || !image.trim()) {
          throw new Error("Banner response did not contain a usable image URL");
        }

        const normalizedBanner: BannerAd = {
          id: Number(data?.id || 0),
          title: String(data?.title || data?.title_en || "Advertisement"),
          image: ensureHttps(image.trim()) || image.trim(),
          navigate_link:
            typeof data?.navigate_link === "string" && data.navigate_link.trim()
              ? data.navigate_link.trim()
              : null,
          view_count: Number(data?.view_count || 0),
        };

        setBanner(normalizedBanner);
        clientTrace("PLAYER_AD", "state:banner-ready", {
          requestId,
          bannerId: normalizedBanner.id,
          title: normalizedBanner.title,
          image: normalizedBanner.image,
          hasNavigateLink: Boolean(normalizedBanner.navigate_link),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          clientTrace("PLAYER_AD", "request:aborted", {
            requestId,
            reason: controller.signal.reason || "effect-cleanup",
          });
          return;
        }
        clientTrace("PLAYER_AD", "request:failed", error, "error");
        setBanner(null);
      } finally {
        window.clearTimeout(timeoutId);
        clientTrace("PLAYER_AD", "request:settled", {
          requestId,
          current: requestId === bannerRequestIdRef.current,
          elapsedMs: Math.round(performance.now() - startedAt),
        });
      }
    })();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort("effect-cleanup");
    };
  }, [isVisible, isExpanded, isLoggedIn, language, userPlan]);

  const handleBannerLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      clientTrace("PLAYER_AD", "image:loaded", {
        bannerId: banner?.id ?? null,
        src: image.currentSrc || image.src,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: image.clientWidth,
        renderedHeight: image.clientHeight,
      });
    },
    [banner?.id],
  );

  const handleBannerError = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      clientTrace(
        "PLAYER_AD",
        "image:failed",
        {
          bannerId: banner?.id ?? null,
          src: image.currentSrc || image.src,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        },
        "error",
      );
      setBanner(null);
    },
    [banner?.id],
  );

  useEffect(() => {
    try {
      setVolume?.(1);
    } catch (e) {
      // ignore if setVolume is not available
    }
  }, [setVolume]);

  if (!isVisible || !portalRoot) return null;

  return createPortal(
    <>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <ExpandedPlayer
            key="expanded"
            onCollapse={collapse}
            userPlan={userPlan}
            banner={banner}
            onBannerLoad={handleBannerLoad}
            onBannerError={handleBannerError}
          />
        ) : (
          <CollapsedPlayer key="collapsed" onExpand={expand} />
        )}
      </AnimatePresence>
      {!isLoggedIn && !isExpanded && (
        <button
          type="button"
          onClick={() =>
            requestAuth({
              title: "در حال شنیدن پیش‌نمایش",
              description:
                "مهمان‌ها ۳۰ ثانیه از هر آهنگ را می‌شنوند. برای پخش کامل، لایک و ساخت پلی‌لیست وارد شوید.",
            })
          }
          className="fixed bottom-[132px] left-1/2 z-[100001] -translate-x-1/2 rounded-full border border-emerald-400/30 bg-black/90 px-4 py-2 text-xs font-bold text-emerald-300 shadow-xl backdrop-blur-xl md:bottom-[86px]"
        >
          پیش‌نمایش ۳۰ ثانیه‌ای · ورود برای پخش کامل
        </button>
      )}
    </>,
    portalRoot,
  );
}
