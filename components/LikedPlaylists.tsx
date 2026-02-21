"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import Image from "next/image";

// ============================================================================
// Types
// ============================================================================

interface ApiPlaylist {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  top_three_song_covers: string[];
  songs_count: number;
  is_liked: boolean;
  genre_names: string[];
  mood_names: string[];
  type: "normal-playlist" | "recommended";
  liked_at: string;
  unique_id?: string;
}

interface LikedPlaylistsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiPlaylist[];
}

// ============================================================================
// Helpers
// ============================================================================

const ensureHttps = (u?: string | null) =>
  u?.startsWith("http://") ? u.replace("http://", "https://") : u;

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("fa-IR").format(num);
};

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
  ),
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
  share: "M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98",
  shareIcon:
    "M18 5c0 1.657-1.343 3-3 3-.332 0-.649-.054-.943-.153L8.537 11.168c.288.583.463 1.237.463 1.932s-.175 1.349-.463 1.932l5.52 3.321c.294-.099.611-.153.943-.153 1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3c0-.695.175-1.349.463-1.932l-5.52-3.321c-.294.099-.611.153-.943.153-1.657 0-3-1.343-3-3s1.343-3 3-3c.332 0 .649.054.943.153l5.52-3.321c-.288-.583-.463-1.237-.463-1.932 0-1.657 1.343-3 3-3s3 1.343 3 3z",
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
    playlist: ApiPlaylist;
    onPress: () => void;
    onLike: () => void;
  }) => {
    const [isLiked, setIsLiked] = useState(playlist.is_liked);

    const handleLike = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        onLike();
      },
      [isLiked, onLike],
    );

    const covers = useMemo(() => {
      const unique = [
        playlist.cover_image,
        ...(playlist.top_three_song_covers || []),
      ].filter(Boolean);
      return Array.from(new Set(unique)).slice(0, 3);
    }, [playlist.cover_image, playlist.top_three_song_covers]);

    return (
      <motion.div
        onClick={onPress}
        className="group relative cursor-pointer pt-10 pb-6"
        whileHover="hover"
      >
        {/* Stacked Images Container - 10% bigger overall scale */}
        <div className="relative aspect-square mb-5 px-3">
          {/* Layer 3 (Back) - Increased offsets for more spread */}
          <motion.div
            className="absolute inset-x-2 inset-y-0 rounded-2xl bg-zinc-800 shadow-xl overflow-hidden pointer-events-none"
            variants={{
              hover: { y: -24, x: -18, rotate: -10, opacity: 0.6, scale: 0.92 },
            }}
            initial={{ y: -10, x: -8, rotate: -6, opacity: 0.3, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Image
              src={covers[2] || covers[1] || covers[0]}
              alt=""
              fill
              className="object-cover blur-[0.5px]"
            />
          </motion.div>

          {/* Layer 2 (Middle) - Increased offsets for more spread */}
          <motion.div
            className="absolute inset-x-2 inset-y-0 rounded-2xl bg-zinc-800 shadow-2xl overflow-hidden pointer-events-none"
            variants={{
              hover: { y: -14, x: 16, rotate: 8, opacity: 0.9, scale: 0.96 },
            }}
            initial={{ y: -5, x: 6, rotate: 4, opacity: 0.6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Image
              src={covers[1] || covers[0]}
              alt=""
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Layer 1 (Top/Main) - 10% larger on hover */}
          <motion.div
            className="relative z-10 w-full h-full rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.7)] bg-zinc-900 border border-white/5"
            variants={{
              hover: { y: -6, scale: 1.1 },
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Image
              src={covers[0]}
              alt={playlist.title}
              fill
              className="object-cover"
            />

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  // Play logic here
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl text-black"
              >
                <Icon d={ICONS.play} className="w-6 h-6 ml-1" filled />
              </motion.button>
              <motion.button
                onClick={handleLike}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20"
              >
                <Icon
                  d={ICONS.heart}
                  className={`w-6 h-6 ${
                    isLiked ? "text-emerald-500" : "text-white"
                  }`}
                  filled={isLiked}
                />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Playlist Info */}
        <div className="px-1 text-center">
          <h3 className="text-sm font-bold text-white/90 truncate group-hover:text-white transition-colors duration-300">
            {playlist.title}
          </h3>
          <p className="text-[11px] text-zinc-500 font-medium mt-1">
            {playlist.songs_count} آهنگ
          </p>
        </div>

        {/* Product-Level Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.div>
    );
  },
);

PlaylistCardGrid.displayName = "PlaylistCardGrid";

const PlaylistCard = memo(
  ({
    playlist,
    onPress,
    onLike,
  }: {
    playlist: ApiPlaylist;
    onPress: () => void;
    onLike: () => void;
  }) => {
    const [isLiked, setIsLiked] = useState(playlist.is_liked);

    const handleLike = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLiked(!isLiked);
        onLike();
      },
      [isLiked, onLike],
    );

    const covers = useMemo(() => {
      const unique = [
        playlist.cover_image,
        ...(playlist.top_three_song_covers || []),
      ].filter(Boolean);
      return Array.from(new Set(unique)).slice(0, 3);
    }, [playlist.cover_image, playlist.top_three_song_covers]);

    return (
      <motion.div
        onClick={onPress}
        className="group relative flex items-center gap-5 py-5 px-6 bg-zinc-900/10 hover:bg-zinc-900/30 transition-all duration-300 cursor-pointer overflow-hidden"
        whileHover="hover"
      >
        {/* Animated Background Glow */}
        <motion.div
          className="absolute inset-x-0 inset-y-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 pointer-events-none"
          variants={{ hover: { opacity: 1 } }}
        />

        {/* Stacked Covers for List View - 10% Bigger Area */}
        <div className="relative w-[5.5rem] h-[5.5rem] shrink-0">
          {/* Layer 3 */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-zinc-800 shadow-md overflow-hidden pointer-events-none"
            initial={{ x: -12, y: -6, rotate: -5, opacity: 0.3, scale: 0.88 }}
            variants={{ hover: { x: -18, y: -8, rotate: -8, opacity: 0.5 } }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Image
              src={covers[2] || covers[1] || covers[0]}
              alt=""
              fill
              className="object-cover blur-[0.5px]"
            />
          </motion.div>

          {/* Layer 2 */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-zinc-800 shadow-lg overflow-hidden pointer-events-none"
            initial={{ x: -6, y: -3, rotate: -3, opacity: 0.6, scale: 0.94 }}
            variants={{ hover: { x: -10, y: -4, rotate: -4, opacity: 0.8 } }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Image
              src={covers[1] || covers[0]}
              alt=""
              fill
              className="object-cover"
            />
          </motion.div>

          {/* Main Layer */}
          <motion.div
            className="relative z-10 w-full h-full rounded-xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/10"
            variants={{ hover: { scale: 1.1, y: -4 } }}
          >
            <Image
              src={covers[0]}
              alt={playlist.title}
              fill
              className="object-cover"
            />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon d={ICONS.play} className="w-8 h-8 text-white ml-1" filled />
            </div>
          </motion.div>
        </div>

        {/* Playlist Info */}
        <div className="flex-1 min-w-0 relative z-10">
          <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate mb-1">
            {playlist.title}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-1 mb-2 font-medium">
            {playlist.description || "بدون توضیحات"}
          </p>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-500 font-bold tracking-wider">
              {playlist.songs_count} آهنگ
            </span>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          onClick={handleLike}
          whileHover={{
            scale: 1.1,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
          whileTap={{ scale: 0.9 }}
          className="p-3 rounded-full bg-white/5 border border-white/5 transition-colors relative z-10 shrink-0"
        >
          <Icon
            d={ICONS.heart}
            className={`w-5 h-5 transition-colors ${
              isLiked ? "text-emerald-500" : "text-zinc-400"
            }`}
            filled={isLiked}
          />
        </motion.button>

        {/* Product-Level Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.div>
    );
  },
);

PlaylistCard.displayName = "PlaylistCard";

const SkeletonPlaylistCard = memo(({ mode }: { mode: ViewMode }) => {
  if (mode === "grid") {
    return (
      <div className="pt-10 pb-6 px-3">
        <div className="aspect-square rounded-2xl bg-white/[0.03] animate-pulse mb-5" />
        <div className="space-y-2 px-1">
          <div className="h-4 w-3/4 bg-white/[0.03] rounded animate-pulse mx-auto" />
          <div className="h-3 w-1/2 bg-white/[0.03] rounded animate-pulse mx-auto" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-5 py-5 px-6">
      <div className="w-[5.5rem] h-[5.5rem] bg-white/[0.03] rounded-xl animate-pulse" />
      <div className="flex-1 space-y-3">
        <div className="h-5 w-2/3 bg-white/[0.03] rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-white/[0.03] rounded animate-pulse" />
      </div>
    </div>
  );
});

SkeletonPlaylistCard.displayName = "SkeletonPlaylistCard";

// ============================================================================
// Main Component
// ============================================================================
export default function LikedPlaylists() {
  const { navigateTo, goBack, scrollToTop } = useNavigation();
  const { accessToken, authenticatedFetch } = useAuth();

  const [viewState, setViewState] = useState({
    isLoading: true, // Initial full page load
    isSearching: false, // Is search mode active?
    isSearchLoading: false, // Is the specific search request flying?
    isFetchingMore: false, // Pagination
    showSearchBar: false,
    query: "",
  });

  const [mainData, setMainData] = useState<{
    playlists: ApiPlaylist[];
    next: string | null;
    count: number;
  }>({
    playlists: [],
    next: null,
    count: 0,
  });

  const [searchData, setSearchData] = useState<{
    playlists: ApiPlaylist[];
    next: string | null;
    count: number;
  }>({
    playlists: [],
    next: null,
    count: 0,
  });

  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Computed Properties
  const activeList = viewState.isSearching
    ? searchData.playlists
    : mainData.playlists;
  const activeTotal = viewState.isSearching ? searchData.count : mainData.count;
  const activeNext = viewState.isSearching ? searchData.next : mainData.next;

  // Unified Fetch Function
  const fetchPlaylists = useCallback(
    async (mode: "MAIN" | "SEARCH", url?: string, query?: string) => {
      const isPagination = !!url;

      // Set Loading States
      setViewState((prev) => ({
        ...prev,
        isLoading: !isPagination && mode === "MAIN",
        isSearchLoading: !isPagination && mode === "SEARCH",
        isFetchingMore: isPagination,
      }));

      try {
        let endpoint = url;
        if (!endpoint) {
          endpoint =
            mode === "SEARCH" && query
              ? `https://api.sedabox.com/api/profile/liked-playlists/search/?q=${encodeURIComponent(query)}`
              : "https://api.sedabox.com/api/profile/liked-playlists/";
        }

        const res = await authenticatedFetch(ensureHttps(endpoint)!);

        if (res.ok) {
          const data: LikedPlaylistsResponse = await res.json();

          const updateFn = (prev: any) => ({
            playlists: isPagination
              ? [...prev.playlists, ...data.results]
              : data.results,
            next: data.next,
            count: data.count,
          });

          if (mode === "SEARCH") setSearchData(updateFn);
          else setMainData(updateFn);
        } else {
          toast.error("خطا در دریافت اطلاعات");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("خطای شبکه");
      } finally {
        setViewState((prev) => ({
          ...prev,
          isLoading: false,
          isSearchLoading: false,
          isFetchingMore: false,
        }));
      }
    },
    [accessToken],
  );

  // Initial Load
  useEffect(() => {
    fetchPlaylists("MAIN");
  }, [fetchPlaylists]);

  // Search Logic - Optimized for UX (Debounced)
  useEffect(() => {
    const q = viewState.query.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q) {
      setViewState((prev) => ({
        ...prev,
        isSearching: false,
        isSearchLoading: false,
      }));
      return;
    }

    debounceRef.current = setTimeout(() => {
      setViewState((prev) => ({ ...prev, isSearching: true }));
      fetchPlaylists("SEARCH", undefined, q);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [viewState.query, fetchPlaylists]);

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          activeNext &&
          !viewState.isFetchingMore &&
          !viewState.isLoading &&
          !viewState.isSearchLoading
        ) {
          fetchPlaylists(viewState.isSearching ? "SEARCH" : "MAIN", activeNext);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [activeNext, viewState, fetchPlaylists]);

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handlePlaylistPress = useCallback(
    (playlist: ApiPlaylist) => {
      // Use unique_id for recommended, id for normal-playlist
      const identifier =
        playlist.type === "recommended" ? playlist.unique_id : playlist.id;
      navigateTo("playlist-detail", { id: identifier });
    },
    [navigateTo],
  );

  const handleLike = useCallback(
    async (playlist: ApiPlaylist) => {
      if (!accessToken) return;

      // Optimistic Update
      const removeFromList = (data: any) => ({
        ...data,
        playlists: data.playlists.filter(
          (p: ApiPlaylist) => p.id !== playlist.id,
        ),
        count: Math.max(0, data.count - 1),
      });

      setMainData(removeFromList);
      if (viewState.isSearching) setSearchData(removeFromList);

      try {
        const isRecommended = playlist.type === "recommended";
        const url = isRecommended
          ? `https://api.sedabox.com/api/home/playlist-recommendations/${playlist.unique_id}/like/`
          : `https://api.sedabox.com/api/playlists/${playlist.id}/like/`;

        const resp = await authenticatedFetch(url, {
          method: "POST",
        });
        if (resp.ok) {
          const data = await resp.json();
          toast.success(data.liked ? "پلی‌لیست لایک شد" : "لایک حذف شد");
        }
      } catch (err) {
        console.error("Like error:", err);
      }
    },
    [accessToken, viewState.isSearching],
  );

  const toggleSearch = useCallback(() => {
    scrollToTop();
    setViewState((p) => ({
      ...p,
      showSearchBar: !p.showSearchBar,
      query: !p.showSearchBar ? "" : p.query,
    }));
  }, [scrollToTop]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  }, []);

  const renderContent = () => {
    // 1. Initial Loading
    if (viewState.isLoading) {
      return (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 gap-0 px-3"
              : "flex flex-col"
          }
        >
          {[...Array(6)].map((_, i) => (
            <SkeletonPlaylistCard key={i} mode={viewMode} />
          ))}
        </div>
      );
    }

    // 2. Search Loading
    if (viewState.isSearching && viewState.isSearchLoading) {
      return (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 gap-0 px-3"
              : "flex flex-col"
          }
        >
          {[...Array(6)].map((_, i) => (
            <SkeletonPlaylistCard key={i} mode={viewMode} />
          ))}
        </div>
      );
    }

    // 3. Empty State
    if (activeList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <Icon d={ICONS.playlist} className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-sm font-medium">پلی‌لیستی یافت نشد</p>
        </div>
      );
    }

    // 4. Actual Content
    return (
      <>
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 gap-0 border-t border-white/[0.05]"
              : "flex flex-col border-t border-white/[0.05]"
          }
        >
          {activeList.map((playlist) =>
            viewMode === "grid" ? (
              <PlaylistCardGrid
                key={playlist.id}
                playlist={playlist}
                onPress={() => handlePlaylistPress(playlist)}
                onLike={() => handleLike(playlist)}
              />
            ) : (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onPress={() => handlePlaylistPress(playlist)}
                onLike={() => handleLike(playlist)}
              />
            ),
          )}
        </div>
        {viewState.isFetchingMore && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={loadMoreRef} className="h-10" />
      </>
    );
  };

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
            "linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.08) 40%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="relative z-60 pt-14 lg:pt-20">
        {/* Navigation Bar - Hidden on Desktop */}
        <div className="flex items-center flex-row-reverse justify-between px-4 p-2.5 fixed top-0 left-0 right-0 bg-[#030303]/80 z-60 lg:hidden">
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
                d={viewState.showSearchBar ? ICONS.close : ICONS.search}
                className="w-5 h-5 text-white"
              />
            </button>
            <button
              onClick={toggleViewMode}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all duration-200"
            >
              <Icon
                d={viewMode === "grid" ? ICONS.grid : ICONS.list}
                className="w-5 h-5 text-white"
              />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-6 pt-10 pb-10">
          {/* Playlist Icon with Glassmorphism */}
          <div className="relative w-32 h-32 mx-auto mb-8 group lg:w-48 lg:h-48">
            <div className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="relative w-full h-full rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-2xl flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            >
              <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-lg shadow-emerald-500/40 lg:p-10">
                <Icon
                  d={ICONS.playlist}
                  className="w-12 h-12 text-white lg:w-20 lg:h-20"
                />
              </div>
            </motion.div>
          </div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black text-white text-center mb-3 tracking-tight lg:text-5xl"
          >
            پلی‌لیست‌های لایک‌شده
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 text-sm text-center font-medium bg-white/5 w-fit mx-auto px-4 py-1.5 rounded-full border border-white/5 lg:text-base lg:px-6"
          >
            {formatNumber(activeTotal)} پلی‌لیست
          </motion.p>

          {/* Desktop Search & Controls */}
          <div className="hidden lg:flex flex-col items-center gap-6 mt-12 max-w-2xl mx-auto">
            <div className="relative w-full">
              <Icon
                d={ICONS.search}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              />
              <input
                type="text"
                value={viewState.query}
                onChange={(e) =>
                  setViewState((p) => ({ ...p, query: e.target.value }))
                }
                placeholder="جستجو در پلی‌لیست‌ها..."
                className="w-full pl-6 pr-12 py-4 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:bg-white/[0.1] transition-all"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleViewMode}
                className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-3"
              >
                <Icon
                  d={viewMode === "grid" ? ICONS.grid : ICONS.list}
                  className="w-5 h-5 text-emerald-400"
                />
                <span className="text-sm font-medium">تغییر نمایش</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar - Animated - Hidden on Desktop */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out lg:hidden ${
            viewState.showSearchBar
              ? "max-h-16 opacity-100"
              : "max-h-0 opacity-0"
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
                value={viewState.query}
                onChange={(e) =>
                  setViewState((p) => ({ ...p, query: e.target.value }))
                }
                placeholder="جستجو در پلی‌لیست‌ها..."
                className="w-full pl-4 pr-10 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      {/* Playlists Content */}
      <div className="relative z-10 pb-32 overflow-visible">
        {renderContent()}
      </div>
    </div>
  );
}
