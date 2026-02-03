"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useNavigation } from "./NavigationContext";
import { LIKED_ALBUMS, LikedAlbum } from "./mockData";

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
  disc: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 14a4 4 0 110-8 4 4 0 010 8z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close: "M6 18L18 6M6 6l12 12",
  grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  list: "M4 6h16M4 10h16M4 14h16M4 18h16",
};

// ============================================================================
// View Mode Type
// ============================================================================
type ViewMode = "grid" | "list";

// ============================================================================
// Album Card Component - Grid View
// ============================================================================
const AlbumCardGrid = memo(
  ({
    album,
    onPress,
    onLike,
  }: {
    album: LikedAlbum;
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
        {/* Album Art Container */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800/50 shadow-lg mb-3">
          <img
            src={album.image}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Hover Overlay with Play Button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Play album
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

          {/* Year Badge */}
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-medium text-white/80">
            {album.year}
          </div>
        </div>

        {/* Album Info */}
        <h3 className="text-sm font-medium text-white truncate">
          {album.title}
        </h3>
        <p className="text-xs text-gray-500 truncate mt-0.5">{album.artist}</p>
        <p className="text-[10px] text-gray-600 mt-1">
          {album.songsCount} آهنگ
        </p>
      </div>
    );
  }
);

AlbumCardGrid.displayName = "AlbumCardGrid";

// ============================================================================
// Album Card Component - List View
// ============================================================================
const AlbumCardList = memo(
  ({
    album,
    onPress,
    onLike,
  }: {
    album: LikedAlbum;
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
        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] active:scale-[0.99] cursor-pointer transition-all duration-150"
        style={{ willChange: "transform" }}
      >
        {/* Album Art */}
        <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-zinc-800/50 shadow-lg">
          <img
            src={album.image}
            alt={album.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <Icon d={ICONS.play} className="w-6 h-6 text-white" filled />
          </div>
        </div>

        {/* Album Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">
            {album.title}
          </h3>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {album.artist}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-600">
              {album.songsCount} آهنگ
            </span>
            <span className="text-[10px] text-gray-600">•</span>
            <span className="text-[10px] text-gray-600">{album.year}</span>
          </div>
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className="p-2 rounded-full hover:bg-white/[0.06] transition-colors shrink-0"
        >
          <Icon
            d={ICONS.heart}
            className={`w-5 h-5 ${
              isLiked ? "text-emerald-500" : "text-gray-500"
            }`}
            filled={isLiked}
          />
        </button>
      </div>
    );
  }
);

AlbumCardList.displayName = "AlbumCardList";

// ============================================================================
// Main Component
// ============================================================================
export default function LikedAlbums() {
  const { navigateTo, goBack, scrollToTop } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filter albums based on search
  const displayedAlbums = useMemo(() => {
    if (!searchQuery) return LIKED_ALBUMS;
    const q = searchQuery.toLowerCase();
    return LIKED_ALBUMS.filter(
      (a) =>
        a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleAlbumPress = useCallback(
    (album: LikedAlbum) => {
      navigateTo("album-detail", { id: album.id, album });
    },
    [navigateTo]
  );

  const handleLike = useCallback((albumId: string) => {
    console.log("Unlike album:", albumId);
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
            "linear-gradient(180deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.08) 40%, transparent 100%)",
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
          {/* Disc Icon with Gradient */}
          <div className="w-28 h-28 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
            <Icon d={ICONS.disc} className="w-14 h-14 text-white" filled />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            آلبوم‌های لایک‌شده
          </h1>
          <p className="text-gray-400 text-sm text-center">
            {LIKED_ALBUMS.length} آلبوم
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
                placeholder="جستجو در آلبوم‌های لایک‌شده..."
                className="w-full pl-4 pr-10 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/40 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Albums Content */}
      <div className="relative z-10 px-4 pb-32">
        {displayedAlbums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Icon d={ICONS.disc} className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">آلبومی یافت نشد</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {displayedAlbums.map((album) => (
              <AlbumCardGrid
                key={album.id}
                album={album}
                onPress={() => handleAlbumPress(album)}
                onLike={() => handleLike(album.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedAlbums.map((album) => (
              <AlbumCardList
                key={album.id}
                album={album}
                onPress={() => handleAlbumPress(album)}
                onLike={() => handleLike(album.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
