"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useNavigation } from "./NavigationContext";
import { LIKED_PLAYLISTS, LikedPlaylist, createSlug } from "./mockData";

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
  playlist:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close: "M6 18L18 6M6 6l12 12",
  users:
    "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  premium:
    "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  list: "M4 6h16M4 10h16M4 14h16M4 18h16",
};

// ============================================================================
// View Mode Type
// ============================================================================
type ViewMode = "grid" | "list";

// ============================================================================
// Playlist Card Component - Grid View
// ============================================================================
const PlaylistCardGrid = memo(
  ({
    playlist,
    onPress,
    onLike,
  }: {
    playlist: LikedPlaylist;
    onPress: () => void;
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
        onClick={onPress}
        className="group cursor-pointer active:scale-[0.97] transition-transform duration-150"
        style={{ willChange: "transform" }}
      >
        {/* Playlist Cover Container */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800/50 shadow-lg mb-3">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient}`}
          />
          <img
            src={playlist.image}
            alt={playlist.title}
            className="relative w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Hover Overlay with Play Button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Play playlist
              }}
              className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 hover:scale-105 hover:bg-emerald-400 transition-all duration-200"
            >
              <Icon
                d={ICONS.play}
                className="w-5 h-5 text-white mr-[-2px]"
                filled
              />
            </button>
            <button
              onClick={handleLike}
              className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-200"
            >
              <Icon
                d={ICONS.heart}
                className={`w-5 h-5 ${
                  isLiked ? "text-emerald-500" : "text-white"
                }`}
                filled={isLiked}
              />
            </button>
          </div>

          {/* Premium Badge */}
          {playlist.isPremium && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Icon d={ICONS.premium} className="w-3 h-3 text-white" filled />
            </div>
          )}

          {/* New Badge */}
          {playlist.isNew && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-emerald-500 rounded text-[8px] font-bold text-white shadow">
              جدید
            </div>
          )}
        </div>

        {/* Playlist Info */}
        <h3 className="text-sm font-medium text-white truncate">
          {playlist.title}
        </h3>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {playlist.songsCount} آهنگ
        </p>
      </div>
    );
  }
);

PlaylistCardGrid.displayName = "PlaylistCardGrid";

const PlaylistCard = memo(
  ({
    playlist,
    onPress,
    onLike,
  }: {
    playlist: LikedPlaylist;
    onPress: () => void;
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
        onClick={onPress}
        className="group relative flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] active:scale-[0.99] cursor-pointer transition-all duration-200 overflow-hidden"
        style={{ willChange: "transform" }}
      >
        {/* Background Gradient Glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${playlist.gradient
              .split(" ")[1]
              ?.replace("from-", "")}20 0%, transparent 70%)`,
          }}
        />

        {/* Playlist Cover */}
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-zinc-800/50 shadow-lg">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient}`}
          />
          <img
            src={playlist.image}
            alt={playlist.title}
            className="relative w-full h-full object-cover mix-blend-overlay opacity-80"
            loading="lazy"
          />

          {/* Play Button on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Play playlist
              }}
              className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-110 transition-transform duration-200"
            >
              <Icon
                d={ICONS.play}
                className="w-4 h-4 text-white mr-[-1px]"
                filled
              />
            </button>
          </div>

          {/* Premium Badge */}
          {playlist.isPremium && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Icon d={ICONS.premium} className="w-3 h-3 text-white" filled />
            </div>
          )}

          {/* New Badge */}
          {playlist.isNew && (
            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-500 rounded text-[8px] font-bold text-white shadow">
              جدید
            </div>
          )}
        </div>

        {/* Playlist Info */}
        <div className="flex-1 min-w-0 relative z-10">
          <h3 className="text-sm font-semibold text-white truncate mb-0.5">
            {playlist.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
            {playlist.description}
          </p>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-600 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13"
                />
              </svg>
              {playlist.songsCount} آهنگ
            </span>
            {playlist.followers && (
              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                <Icon d={ICONS.users} className="w-3 h-3" />
                {playlist.followers}
              </span>
            )}
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors shrink-0 relative z-10"
        >
          <Icon
            d={ICONS.heart}
            className={`w-5 h-5 transition-colors ${
              isLiked ? "text-emerald-500" : "text-gray-500"
            }`}
            filled={isLiked}
          />
        </button>
      </div>
    );
  }
);

PlaylistCard.displayName = "PlaylistCard";

// ============================================================================
// Main Component
// ============================================================================
export default function LikedPlaylists() {
  const { navigateTo, goBack, scrollToTop } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Filter playlists based on search
  const displayedPlaylists = useMemo(() => {
    if (!searchQuery) return LIKED_PLAYLISTS;
    const q = searchQuery.toLowerCase();
    return LIKED_PLAYLISTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handlePlaylistPress = useCallback(
    (playlist: LikedPlaylist) => {
      navigateTo("playlist-detail", { slug: createSlug(playlist.title) });
    },
    [navigateTo]
  );

  const handleLike = useCallback((playlistId: string) => {
    console.log("Unlike playlist:", playlistId);
  }, []);

  const toggleSearch = useCallback(() => {
    scrollToTop();
    setShowSearch((prev) => !prev);
    if (showSearch) setSearchQuery("");
  }, [showSearch, scrollToTop]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  }, []);

  return (
    <div
      className="relative w-full min-h-screen bg-[#030303] text-white overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Gradient Header Background */}
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0.08) 40%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="relative z-60 pt-14">
        {/* Navigation Bar */}
        <div className="flex items-center flex-row-reverse justify-between px-4 p-2.5 fixed top-0 left-0 right-0 bg-[#030303]/80 z-60">
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
            <button
              onClick={toggleViewMode}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all duration-200"
            >
              <Icon
                d={viewMode === "grid" ? ICONS.list : ICONS.grid}
                className="w-5 h-5 text-white"
              />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-6 pt-8 pb-6">
          {/* Playlist Icon with Gradient */}
          <div className="w-28 h-28 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 flex items-center justify-center shadow-2xl shadow-pink-500/30">
            <Icon d={ICONS.playlist} className="w-14 h-14 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            پلی‌لیست‌های لایک‌شده
          </h1>
          <p className="text-gray-400 text-sm text-center">
            {LIKED_PLAYLISTS.length} پلی‌لیست
          </p>
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
                placeholder="جستجو در پلی‌لیست‌ها..."
                className="w-full pl-4 pr-10 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/40 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Playlists Content */}
      <div className="relative z-10 px-4 pb-32">
        {displayedPlaylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Icon d={ICONS.playlist} className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">پلی‌لیستی یافت نشد</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {displayedPlaylists.map((playlist) => (
              <PlaylistCardGrid
                key={playlist.id}
                playlist={playlist}
                onPress={() => handlePlaylistPress(playlist)}
                onLike={() => handleLike(playlist.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onPress={() => handlePlaylistPress(playlist)}
                onLike={() => handleLike(playlist.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
