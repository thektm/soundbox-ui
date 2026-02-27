"use client";

import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useNavigation } from "./NavigationContext";
import { usePlayer } from "./PlayerContext";
import { useAuth } from "./AuthContext";
import { SEO } from "./SEO";

// ============ TYPES ============
interface GenreSong {
  id: number;
  title: string;
  artist_id: number;
  artist_name: string;
  artist_unique_id: string | null;
  album: number | null;
  album_id: number | null;
  album_title: string;
  cover_image: string;
  stream_url: string;
  duration_seconds: number;
  is_liked: boolean;
  genre_names: string[];
  tag_names: string[];
  mood_names: string[];
  sub_genre_names: string[];
  play_count: number;
}

export interface GenrePageProps {
  id: number | string;
  name: string;
  color?: string;
}

// ============ UTILS ============
const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// ============ ICONS ============
const PlayIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const ListIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3" cy="6" r="0.5" fill="currentColor" />
    <circle cx="3" cy="12" r="0.5" fill="currentColor" />
    <circle cx="3" cy="18" r="0.5" fill="currentColor" />
  </svg>
);

const GridIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const BackIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const MusicNoteIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
  </svg>
);

// ============ SONG LIST ITEM ============
const SongListItem = memo(
  ({
    song,
    index,
    isPlaying,
    onPlay,
    onArtistClick,
    onSongClick,
    onAlbumClick,
  }: {
    song: GenreSong;
    index: number;
    isPlaying: boolean;
    onPlay: () => void;
    onArtistClick: () => void;
    onSongClick: () => void;
    onAlbumClick: () => void;
  }) => (
    <div
      role="button"
      tabIndex={0}
      aria-label={`پخش ${song.title}`}
      onKeyDown={(e) => e.key === "Enter" && onPlay()}
      onClick={onPlay}
      className={`group flex items-center gap-3 md:gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isPlaying
          ? "bg-emerald-500/10 border border-emerald-500/30"
          : "hover:bg-white/5 border border-transparent"
      }`}
    >
      {/* Index / Play indicator */}
      <div className="w-7 flex-shrink-0 flex items-center justify-center">
        <span
          className={`text-sm font-medium group-hover:hidden select-none ${
            isPlaying ? "text-emerald-400" : "text-zinc-400"
          }`}
        >
          {isPlaying ? (
            <span className="flex gap-0.5 items-end h-4">
              <span
                className="w-0.5 bg-emerald-400 animate-[sound-bar_0.8s_ease_infinite_alternate]"
                style={{ height: "60%" }}
              />
              <span
                className="w-0.5 bg-emerald-400 animate-[sound-bar_0.8s_ease_0.2s_infinite_alternate]"
                style={{ height: "100%" }}
              />
              <span
                className="w-0.5 bg-emerald-400 animate-[sound-bar_0.8s_ease_0.4s_infinite_alternate]"
                style={{ height: "40%" }}
              />
            </span>
          ) : (
            index + 1
          )}
        </span>
        <PlayIcon className="w-4 h-4 text-white hidden group-hover:block" />
      </div>

      {/* Cover */}
      <div className="relative w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
        <ImageWithPlaceholder
          src={song.cover_image}
          alt={song.title}
          className="object-cover w-full h-full"
          type="song"
        />
        {isPlaying && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSongClick();
          }}
          className={`text-sm font-medium truncate block hover:underline text-right w-full outline-none ${
            isPlaying ? "text-emerald-400" : "text-white"
          }`}
        >
          {song.title}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArtistClick();
          }}
          className="text-zinc-400 text-xs hover:text-white hover:underline text-right block truncate outline-none"
        >
          {song.artist_name}
        </button>
      </div>

      {/* Album — hidden on small screens */}
      <div className="hidden lg:block text-zinc-400 text-sm truncate max-w-[180px] text-right flex-shrink-0">
        {song.album_title ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAlbumClick();
            }}
            className="hover:text-white hover:underline outline-none text-right w-full"
          >
            {song.album_title}
          </button>
        ) : (
          "-"
        )}
      </div>

      {/* Tags — hidden on small screens */}

      {/* Duration */}
      <div className="text-zinc-400 text-sm flex-shrink-0 w-10 text-left">
        {formatDuration(song.duration_seconds)}
      </div>
    </div>
  ),
);
SongListItem.displayName = "SongListItem";

// ============ SONG GRID CARD ============
const SongGridCard = memo(
  ({
    song,
    isPlaying,
    onPlay,
    onArtistClick,
    onSongClick,
    onAlbumClick,
  }: {
    song: GenreSong;
    isPlaying: boolean;
    onPlay: () => void;
    onArtistClick: () => void;
    onSongClick: () => void;
    onAlbumClick: () => void;
  }) => (
    <div
      role="button"
      tabIndex={0}
      aria-label={`پخش ${song.title}`}
      onKeyDown={(e) => e.key === "Enter" && onPlay()}
      onClick={onPlay}
      className={`group p-3 rounded-xl transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isPlaying
          ? "bg-emerald-500/10 border border-emerald-500/30"
          : "bg-zinc-900/60 hover:bg-zinc-800/80 border border-transparent hover:border-white/5"
      }`}
    >
      {/* Cover */}
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-lg">
        <ImageWithPlaceholder
          src={song.cover_image}
          alt={song.title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          type="song"
        />
        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            <PlayIcon className="w-6 h-6 text-black ml-0.5" />
          </div>
        </div>
        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="flex gap-0.5 items-end h-3">
              <span
                className="w-0.5 bg-black animate-[sound-bar_0.8s_ease_infinite_alternate]"
                style={{ height: "60%" }}
              />
              <span
                className="w-0.5 bg-black animate-[sound-bar_0.8s_ease_0.2s_infinite_alternate]"
                style={{ height: "100%" }}
              />
              <span
                className="w-0.5 bg-black animate-[sound-bar_0.8s_ease_0.4s_infinite_alternate]"
                style={{ height: "40%" }}
              />
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSongClick();
        }}
        className={`text-sm font-semibold truncate block hover:underline text-right w-full mb-1 outline-none ${
          isPlaying ? "text-emerald-400" : "text-white"
        }`}
      >
        {song.title}
      </button>

      {/* Artist */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onArtistClick();
        }}
        className="text-zinc-400 text-xs hover:text-white hover:underline text-right block truncate w-full outline-none"
      >
        {song.artist_name}
      </button>

      
    </div>
  ),
);
SongGridCard.displayName = "SongGridCard";

// ============ SKELETONS ============
const ListSkeleton = memo(() => (
  <div className="space-y-2 animate-pulse">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3">
        <div className="w-7 h-5 bg-zinc-800 rounded" />
        <div className="w-11 h-11 bg-zinc-800 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-zinc-800 rounded w-40 mb-2" />
          <div className="h-3 bg-zinc-800 rounded w-28" />
        </div>
        <div className="hidden lg:block h-3 bg-zinc-800 rounded w-32" />
        <div className="w-10 h-3 bg-zinc-800 rounded" />
      </div>
    ))}
  </div>
));
ListSkeleton.displayName = "ListSkeleton";

const GridSkeleton = memo(() => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="p-3 rounded-xl bg-zinc-900/60">
        <div className="aspect-square bg-zinc-800 rounded-lg mb-3" />
        <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
      </div>
    ))}
  </div>
));
GridSkeleton.displayName = "GridSkeleton";

// ============ MAIN PAGE ============
export default function GenrePage({
  id,
  name: initialName,
  color = "#1a1a2e",
}: GenrePageProps) {
  const { navigateTo } = useNavigation();
  const { playTrack, currentTrack } = usePlayer();
  const { authenticatedFetch } = useAuth();

  const [songs, setSongs] = useState<GenreSong[]>([]);
  const [name, setName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setSongs([]);
    setNextPage(null);

    authenticatedFetch(`https://api.sedabox.com/api/search/genres/${id}/`)
      .then((r) => r.json())
      .then((data) => {
        setSongs(data.results || []);
        if (data.genre_name) {
          setName(data.genre_name);
        }
        setNextPage(data.next || null);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id, authenticatedFetch]);

  const loadMore = useCallback(async () => {
    if (!nextPage || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const r = await authenticatedFetch(
        nextPage.startsWith("http://")
          ? nextPage.replace("http://", "https://")
          : nextPage,
      );
      const data = await r.json();
      setSongs((prev) => [...prev, ...(data.results || [])]);
      setNextPage(data.next || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPage, isLoadingMore, authenticatedFetch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPage && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [nextPage, isLoadingMore, loadMore]);

  const handlePlay = useCallback(
    (song: GenreSong) => {
      playTrack({
        id: String(song.id),
        title: song.title,
        artist: song.artist_name,
        artistId: song.artist_id,
        album: song.album_title,
        image: song.cover_image,
        src: song.stream_url,
        duration: formatDuration(song.duration_seconds),
      } as any);
    },
    [playTrack],
  );

  const handlePlayAll = useCallback(() => {
    if (songs.length > 0) handlePlay(songs[0]);
  }, [songs, handlePlay]);

  const handleArtistClick = useCallback(
    (song: GenreSong) => {
      navigateTo("artist-detail", { id: song.artist_id });
    },
    [navigateTo],
  );

  const handleSongClick = useCallback(
    (song: GenreSong) => {
      navigateTo("song-detail", { id: String(song.id), title: song.title });
    },
    [navigateTo],
  );

  const handleAlbumClick = useCallback(
    (song: GenreSong) => {
      const albumId = song.album_id || song.album;
      if (albumId) {
        navigateTo("album-detail", { id: String(albumId) });
      }
    },
    [navigateTo],
  );

  const isCurrentlyPlaying = (song: GenreSong) =>
    currentTrack && String((currentTrack as any).id) === String(song.id);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#121212] text-white pb-32" dir="rtl">
      <SEO title={`ژانر ${name}`} />

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}aa 50%, #121212 100%)`,
          minHeight: "260px",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-[#121212]" />
        {/* Decorative blur circles */}
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: color }}
        />
        <div
          className="absolute -bottom-10 right-10 w-60 h-60 rounded-full opacity-10 blur-2xl"
          style={{ background: color }}
        />

        <div className="relative z-10 px-4 md:px-8 pt-4 pb-8 flex flex-col h-full">
          {/* Back button */}
          <button
            onClick={() => navigateTo("search")}
            className="mb-6 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 active:scale-95 transition-all self-end focus-visible:ring-2 focus-visible:ring-white outline-none"
            aria-label="بازگشت به جستجو"
          >
            <BackIcon />
          </button>

          {/* Genre info */}
          <div className="flex items-end gap-5">
            {/* Icon box */}
            <div
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl"
              style={{
                background: `${color}55`,
                backdropFilter: "blur(12px)",
                border: `1px solid ${color}88`,
              }}
            >
              <MusicNoteIcon className="w-10 h-10 md:w-12 md:h-12 text-white/90" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-white/60 mb-1.5 font-medium">
                ژانر
              </p>
              <h1 className="text-3xl md:text-5xl lg:text-4xl font-black tracking-tight leading-normal overflow-hidden text-ellipsis whitespace-nowrap max-w-[90vw]">
                {name}
              </h1>
              {!isLoading && songs.length > 0 && (
                <p className="text-white/50 mt-2 text-sm">
                  {songs.length}
                  {nextPage ? "+" : ""} آهنگ
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Controls Bar ────────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-5 flex items-center justify-between bg-gradient-to-b from-[#121212]/90 to-transparent sticky top-0 z-30 backdrop-blur-sm">
        {/* Play all button */}
        <button
          onClick={handlePlayAll}
          disabled={isLoading || songs.length === 0}
          className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center hover:scale-105 hover:bg-emerald-400 active:scale-95 transition-all shadow-xl shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-300 outline-none"
          aria-label="پخش همه"
        >
          <PlayIcon className="w-7 h-7 text-black ml-0.5" />
        </button>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-zinc-800/70 rounded-xl p-1 backdrop-blur-sm border border-white/5">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              viewMode === "list"
                ? "bg-zinc-600/80 text-white shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
            }`}
            aria-label="نمایش لیستی"
            title="نمایش لیستی"
          >
            <ListIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              viewMode === "grid"
                ? "bg-zinc-600/80 text-white shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
            }`}
            aria-label="نمایش شبکه‌ای"
            title="نمایش شبکه‌ای"
          >
            <GridIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-8">
        {isLoading ? (
          viewMode === "list" ? (
            <ListSkeleton />
          ) : (
            <GridSkeleton />
          )
        ) : songs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-zinc-800/80 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <MusicNoteIcon className="w-10 h-10 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">آهنگی یافت نشد</h3>
            <p className="text-zinc-500 text-sm max-w-xs">
              در حال حاضر آهنگی برای ژانر «{name}» وجود ندارد.
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* ── List View ─────────────────────────────────────────────────── */
          <div>
            {/* Table header — desktop only */}
            <div className="hidden md:grid grid-cols-[28px_44px_1fr_180px_auto_40px] gap-3 lg:gap-4 px-3 pb-2 mb-1 border-b border-white/10 text-zinc-500 text-xs uppercase tracking-wider select-none">
              <div className="text-center">#</div>
              <div />
              <div>عنوان</div>
              
              <div />
              <div className="text-center">مدت</div>
            </div>
            <div className="space-y-0.5">
              {songs.map((song, i) => (
                <SongListItem
                  key={song.id}
                  song={song}
                  index={i}
                  isPlaying={Boolean(isCurrentlyPlaying(song))}
                  onPlay={() => handlePlay(song)}
                  onArtistClick={() => handleArtistClick(song)}
                  onSongClick={() => handleSongClick(song)}
                  onAlbumClick={() => handleAlbumClick(song)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* ── Grid View ─────────────────────────────────────────────────── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {songs.map((song) => (
              <SongGridCard
                key={song.id}
                song={song}
                isPlaying={Boolean(isCurrentlyPlaying(song))}
                onPlay={() => handlePlay(song)}
                onArtistClick={() => handleArtistClick(song)}
                onSongClick={() => handleSongClick(song)}
                onAlbumClick={() => handleAlbumClick(song)}
              />
            ))}
          </div>
        )}

        {/* Load more observer target */}
        <div ref={observerTarget} className="h-1" />

        {/* Loading more state indicator (optional, keeps button for manually clicking if needed) */}
        {nextPage && !isLoading && (
          <div className="flex justify-center mt-10 mb-4">
            <div className="px-8 py-3 text-zinc-500 text-sm font-medium">
              {isLoadingMore ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  در حال بارگذاری...
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sound-bar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
