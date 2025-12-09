"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useNavigation } from "./NavigationContext";
import { usePlayer } from "./PlayerContext";
import { LIKED_SONGS, Song } from "./mockData";

// ============================================================================
// Icon Component - Optimized with memo
// ============================================================================
const Icon = memo(
  ({
    d,
    className = "w-5 h-5",
    filled = false,
  }: {
    d: string;
    className?: string;
    filled?: boolean;
  }) => (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={filled ? 0 : 2}
        d={d}
      />
    </svg>
  )
);

Icon.displayName = "Icon";

// ============================================================================
// Icon Paths
// ============================================================================
const ICONS = {
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  heart:
    "M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.682l-7.682-8.999a4.5 4.5 0 010-6.365z",
  play: "M5 3l14 9-14 9V3z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
  shuffle: "M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  moreVertical:
    "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close: "M6 18L18 6M6 6l12 12",
  sort: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

// ============================================================================
// Song Row Component - Optimized for performance
// ============================================================================
const SongRow = memo(
  ({
    song,
    index,
    isPlaying,
    onPlay,
    onLike,
  }: {
    song: Song;
    index: number;
    isPlaying: boolean;
    onPlay: () => void;
    onLike: () => void;
  }) => {
    const [isLiked, setIsLiked] = useState(true);

    const handleLike = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        onLike();
      },
      [isLiked, onLike]
    );

    return (
      <div
        onClick={onPlay}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.99] ${
          isPlaying
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-white/[0.02] border border-transparent hover:bg-white/[0.04]"
        }`}
        style={{ willChange: "transform, opacity" }}
      >
        {/* Index/Play indicator */}
        <div className="w-8 flex items-center justify-center shrink-0">
          {isPlaying ? (
            <div className="flex items-center gap-0.5">
              <span className="w-0.5 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="w-0.5 h-4 bg-emerald-500 rounded-full animate-pulse delay-75" />
              <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
            </div>
          ) : (
            <span className="text-sm text-gray-500 font-medium">
              {index + 1}
            </span>
          )}
        </div>

        {/* Album Art */}
        <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-zinc-800/50 shadow-lg">
          <img
            src={song.image}
            alt={song.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Icon d={ICONS.pause} className="w-5 h-5 text-white" filled />
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium truncate ${
              isPlaying ? "text-emerald-400" : "text-white"
            }`}
          >
            {song.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            {song.explicit && (
              <span className="px-1 py-0.5 bg-white/10 text-[8px] font-bold text-gray-400 rounded">
                E
              </span>
            )}
            <p className="text-xs text-gray-500 truncate">{song.artist}</p>
          </div>
        </div>

        {/* Duration & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">{song.duration}</span>
          <button
            onClick={handleLike}
            className="p-2 rounded-full hover:bg-white/[0.06] transition-colors"
          >
            <Icon
              d={ICONS.heart}
              className={`w-4 h-4 transition-colors ${
                isLiked ? "text-emerald-500" : "text-gray-500"
              }`}
              filled={isLiked}
            />
          </button>
        </div>
      </div>
    );
  }
);

SongRow.displayName = "SongRow";

// ============================================================================
// Sort Options
// ============================================================================
type SortOption = "recent" | "title" | "artist";

// ============================================================================
// Main Component
// ============================================================================
export default function LikedSongs() {
  const { navigateTo, goBack, scrollToTop } = useNavigation();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Filter and sort songs
  const displayedSongs = useMemo(() => {
    let songs = [...LIKED_SONGS];

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      songs = songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "title":
        songs.sort((a, b) => a.title.localeCompare(b.title, "fa"));
        break;
      case "artist":
        songs.sort((a, b) => a.artist.localeCompare(b.artist, "fa"));
        break;
      default:
        // Keep original order for "recent"
        break;
    }

    return songs;
  }, [searchQuery, sortBy]);

  const totalDuration = useMemo(() => {
    const totalMinutes = LIKED_SONGS.reduce((acc, song) => {
      const [min, sec] = song.duration.split(":").map(Number);
      return acc + min + sec / 60;
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return hours > 0 ? `${hours} ساعت و ${mins} دقیقه` : `${mins} دقیقه`;
  }, []);

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handlePlay = useCallback(
    (song: Song) => {
      if (currentTrack?.id === song.id) {
        togglePlay();
      } else {
        // Convert Song to Track format for player
        playTrack({
          id: song.id,
          title: song.title,
          artist: song.artist,
          image: song.image,
          duration: song.duration,
          src: song.src,
        });
      }
    },
    [currentTrack, playTrack, togglePlay]
  );

  const handlePlayAll = useCallback(() => {
    if (displayedSongs.length > 0) {
      const song = displayedSongs[0];
      playTrack({
        id: song.id,
        title: song.title,
        artist: song.artist,
        image: song.image,
        duration: song.duration,
        src: song.src,
      });
    }
  }, [displayedSongs, playTrack]);

  const handleShuffle = useCallback(() => {
    if (displayedSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * displayedSongs.length);
      const song = displayedSongs[randomIndex];
      playTrack({
        id: song.id,
        title: song.title,
        artist: song.artist,
        image: song.image,
        duration: song.duration,
        src: song.src,
      });
    }
  }, [displayedSongs, playTrack]);

  const handleLike = useCallback((songId: string) => {
    console.log("Unlike song:", songId);
  }, []);

  const toggleSearch = useCallback(() => {
    scrollToTop();
    setShowSearch((prev) => !prev);
    if (showSearch) setSearchQuery("");
  }, [showSearch, scrollToTop]);

  return (
    <div
      className="relative w-full min-h-screen bg-[#030303] text-white font-sans"
      dir="rtl"
    >
      {/* Gradient Header Background */}
      <div
        className="absolute top-0 left-0 right-0 h-80 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.1) 40%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="relative z-60 pt-14">
        {/* Navigation Bar */}
        <div className="flex items-center flex-row-reverse   justify-between px-4 p-2.5 fixed top-0 left-0 right-0 bg-[#030303]/80 z-60">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all duration-200"
          >
            <Icon d={ICONS.back} className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearch}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all duration-200"
            >
              <Icon
                d={showSearch ? ICONS.close : ICONS.search}
                className="w-5 h-5 text-white"
              />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all duration-200"
              >
                <Icon d={ICONS.sort} className="w-5 h-5 text-white" />
              </button>
              {/* Sort Menu */}
              {showSortMenu && (
                <div className="absolute top-12 right-0 z-70 min-w-[140px] py-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  {[
                    { key: "recent", label: "اخیراً اضافه شده" },
                    { key: "title", label: "عنوان" },
                    { key: "artist", label: "هنرمند" },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setSortBy(option.key as SortOption);
                        setShowSortMenu(false);
                      }}
                      className={`w-full px-4 py-2.5 text-right text-sm transition-colors ${
                        sortBy === option.key
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-6 pt-8 pb-6">
          {/* Heart Icon with Gradient */}
          <div className="w-32 h-32 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Icon d={ICONS.heart} className="w-16 h-16 text-white" filled />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            آهنگ‌های لایک‌شده
          </h1>
          <p className="text-gray-400 text-sm text-center mb-1">
            {LIKED_SONGS.length} آهنگ • {totalDuration}
          </p>

          {/* Play & Shuffle Buttons */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={handleShuffle}
              className="flex items-center gap-2 px-6 py-3 bg-white/[0.06] border border-white/[0.1] rounded-full text-sm font-medium text-white hover:bg-white/[0.1] transition-all duration-200"
            >
              <Icon d={ICONS.shuffle} className="w-4 h-4" />
              <span>پخش تصادفی</span>
            </button>
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-500 rounded-full text-sm font-medium text-white hover:bg-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/30"
            >
              <Icon d={ICONS.play} className="w-4 h-4" filled />
              <span>پخش همه</span>
            </button>
          </div>
        </div>

        {/* Search Bar - Animated */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            showSearch ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-4">
            <div className="relative">
              <Icon
                d={ICONS.search}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در آهنگ‌های لایک‌شده..."
                className="w-full pl-4 pr-10 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="relative z-10 px-4 pb-32 space-y-1">
        {displayedSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Icon d={ICONS.heart} className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">آهنگی یافت نشد</p>
          </div>
        ) : (
          displayedSongs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              isPlaying={currentTrack?.id === song.id && isPlaying}
              onPlay={() => handlePlay(song)}
              onLike={() => handleLike(song.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
