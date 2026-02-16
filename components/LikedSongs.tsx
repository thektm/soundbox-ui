"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useEffect,
  useRef,
} from "react";
import { useNavigation } from "./NavigationContext";
import { usePlayer } from "./PlayerContext";
import { useAuth } from "./AuthContext";
import { Song } from "./mockData";
import { SongOptionsDrawer } from "./SongOptionsDrawer";

// ============================================================================
// Utilities & Constants
// ============================================================================
const ensureHttps = (u?: string | null) =>
  u?.startsWith("http://") ? u.replace("http://", "https://") : u;

const ICONS = {
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  heart:
    "M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.682l-7.682-8.999a4.5 4.5 0 010-6.365z",
  play: "M5 3l14 9-14 9V3z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
  shuffle: "M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
  moreVertical:
    "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close: "M6 18L18 6M6 6l12 12",
};

const Icon = memo(
  ({
    d,
    className = "w-5 h-5",
    filled,
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
// Sub-Components
// ============================================================================
const SongRow = memo(
  ({ song, index, isPlaying, onPlay, onLike, onOptions }: any) => {
    return (
      <div
        onClick={onPlay}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.99] ${
          isPlaying
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-white/[0.02] border border-transparent hover:bg-white/[0.04]"
        }`}
      >
        <div className="w-8 flex items-center justify-center shrink-0 text-sm text-gray-500 font-medium">
          {isPlaying ? (
            <div className="flex gap-0.5">
              {[3, 4, 2].map((h, i) => (
                <span
                  key={i}
                  className={`w-0.5 h-${h} bg-emerald-500 rounded-full animate-pulse`}
                  style={{ animationDelay: `${i * 75}ms` }}
                />
              ))}
            </div>
          ) : (
            index + 1
          )}
        </div>

        <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-zinc-800">
          <img
            src={song.image}
            alt={song.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium truncate ${isPlaying ? "text-emerald-400" : "text-white"}`}
          >
            {song.title}
          </h3>
          <p className="text-xs text-gray-500 truncate">{song.artist}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500 hidden sm:block">
            {song.duration}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike();
            }}
            className="p-2 hover:bg-white/[0.06] rounded-full"
          >
            <Icon d={ICONS.heart} className="w-4 h-4 text-emerald-500" filled />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOptions();
            }}
            className="p-2 hover:bg-white/[0.06] rounded-full"
          >
            <Icon d={ICONS.moreVertical} className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    );
  },
);
SongRow.displayName = "SongRow";

const SkeletonSongRow = memo(() => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
    <div className="w-8 flex justify-center">
      <div className="w-4 h-4 bg-gray-700/50 rounded animate-pulse" />
    </div>
    <div className="w-12 h-12 bg-gray-700/50 rounded-lg animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-3/5 bg-gray-700/50 rounded animate-pulse" />
      <div className="h-3 w-2/5 bg-gray-700/50 rounded animate-pulse" />
    </div>
  </div>
));
SkeletonSongRow.displayName = "SkeletonSongRow";

// ============================================================================
// Main Component
// ============================================================================
export default function LikedSongs() {
  const { goBack, scrollToTop } = useNavigation();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { accessToken } = useAuth();

  // Combined State Objects to reduce renders
  const [viewState, setViewState] = useState({
    isLoading: true, // Initial full page load
    isSearching: false, // Is search mode active?
    isSearchLoading: false, // Is the specific search request flying?
    isFetchingMore: false, // Pagination
    showSearchBar: false,
    query: "",
  });

  const [mainData, setMainData] = useState<{
    songs: Song[];
    next: string | null;
    count: number;
  }>({
    songs: [],
    next: null,
    count: 0,
  });

  const [searchData, setSearchData] = useState<{
    songs: Song[];
    next: string | null;
    count: number;
  }>({
    songs: [],
    next: null,
    count: 0,
  });

  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Computed Properties
  const activeList = viewState.isSearching ? searchData.songs : mainData.songs;
  const activeTotal = viewState.isSearching ? searchData.count : mainData.count;
  const activeNext = viewState.isSearching ? searchData.next : mainData.next;

  // Unified Fetch Function
  const fetchTracks = useCallback(
    async (mode: "MAIN" | "SEARCH", url?: string, query?: string) => {
      if (!accessToken) return;

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
              ? `https://api.sedabox.com/api/profile/liked-songs/search/?q=${encodeURIComponent(query)}`
              : "https://api.sedabox.com/api/profile/liked-songs/";
        }

        const res = await fetch(ensureHttps(endpoint)!, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          const mappedSongs = data.results.map((item: any) => ({
            id: item.id.toString(),
            title: item.title,
            artist: item.artist_name,
            image: ensureHttps(item.cover_image) || "",
            duration: item.duration_display,
            src: item.stream_url,
            album: item.album_title || "Single",
          }));

          const updateFn = (prev: any) => ({
            songs: isPagination ? [...prev.songs, ...mappedSongs] : mappedSongs,
            next: data.next,
            count: data.count,
          });

          if (mode === "SEARCH") setSearchData(updateFn);
          else setMainData(updateFn);
        }
      } catch (err) {
        console.error("Fetch error:", err);
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
    fetchTracks("MAIN");
  }, [fetchTracks]);

  // Search Logic - Optimized for UX
  useEffect(() => {
    const q = viewState.query.trim();

    // 1. Clear timeout on every keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // 2. If empty, revert to Main immediately
    if (!q) {
      setViewState((prev) => ({
        ...prev,
        isSearching: false,
        isSearchLoading: false,
      }));
      return;
    }

    // 3. Set debounce
    debounceRef.current = setTimeout(() => {
      // ONLY NOW do we switch to "Search Mode" visually and show skeletons
      setViewState((prev) => ({ ...prev, isSearching: true }));
      fetchTracks("SEARCH", undefined, q);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [viewState.query, fetchTracks]);

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
          fetchTracks(viewState.isSearching ? "SEARCH" : "MAIN", activeNext);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [activeNext, viewState, fetchTracks]);

  // Handlers
  const handlePlay = useCallback(
    (song: Song) => {
      if (currentTrack?.id === song.id) togglePlay();
      else playTrack(song);
    },
    [currentTrack, togglePlay, playTrack],
  );

  const handleBatchPlay = useCallback(
    (shuffle: boolean) => {
      if (activeList.length === 0) return;
      const song = shuffle
        ? activeList[Math.floor(Math.random() * activeList.length)]
        : activeList[0];
      playTrack(song);
    },
    [activeList, playTrack],
  );

  const handleLike = useCallback(
    async (songId: string) => {
      if (!accessToken) return;
      // Optimistic Update
      const removeFromList = (list: any) => ({
        ...list,
        songs: list.songs.filter((s: Song) => s.id !== songId),
        count: Math.max(0, list.count - 1),
      });

      setMainData(removeFromList);
      if (viewState.isSearching) setSearchData(removeFromList);

      try {
        await fetch(`https://api.sedabox.com/api/songs/${songId}/like/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (e) {
        console.error(e);
      }
    },
    [accessToken, viewState.isSearching],
  );

  // Total Duration Calculation
  const totalDuration = useMemo(() => {
    const mins = activeList.reduce((acc, song) => {
      const [m, s] = song.duration.split(":").map(Number);
      return acc + m + (s || 0) / 60;
    }, 0);
    return `${Math.floor(mins)} دقیقه`;
  }, [activeList]);

  // Render Helpers
  const renderList = () => {
    // 1. Initial Loading
    if (viewState.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs">در حال دریافت لیست...</p>
        </div>
      );
    }

    // 2. Search Loading (Show Skeletons immediately when request starts)
    if (viewState.isSearching && viewState.isSearchLoading) {
      return Array.from({ length: 6 }).map((_, i) => (
        <SkeletonSongRow key={i} />
      ));
    }

    // 3. Empty State
    if (activeList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Icon d={ICONS.heart} className="w-12 h-12 mb-2" />
          <p className="text-sm">موردی یافت نشد</p>
        </div>
      );
    }

    // 4. Actual List
    return (
      <>
        {activeList.map((song, idx) => (
          <SongRow
            key={song.id}
            song={song}
            index={idx}
            isPlaying={currentTrack?.id === song.id && isPlaying}
            onPlay={() => handlePlay(song)}
            onLike={() => handleLike(song.id)}
            onOptions={() => {
              setSelectedSong({
                ...song,
                cover_image: song.image,
                artist_name: song.artist,
                is_liked: true,
              });
              setIsDrawerOpen(true);
            }}
          />
        ))}
        {viewState.isFetchingMore && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={loadMoreRef} className="h-4" />
      </>
    );
  };

  return (
    <div
      className="relative w-full min-h-screen bg-[#030303] text-white font-sans"
      dir="rtl"
    >
      {/* Background Gradient */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-emerald-900/20 via-emerald-900/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#030303]/80 backdrop-blur-md px-4 py-3 flex items-center justify-between flex-row-reverse">
        <button
          onClick={goBack}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
        >
          <Icon d={ICONS.back} />
        </button>
        <button
          onClick={() => {
            scrollToTop();
            setViewState((p) => ({
              ...p,
              showSearchBar: !p.showSearchBar,
              query: !p.showSearchBar ? "" : p.query,
            }));
          }}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
        >
          <Icon d={viewState.showSearchBar ? ICONS.close : ICONS.search} />
        </button>
      </div>

      {/* Hero & Controls */}
      <div className="px-6 pb-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6">
            <Icon d={ICONS.heart} className="w-16 h-16 text-white" filled />
          </div>
          <h1 className="text-2xl font-bold mb-1">آهنگ‌های لایک‌شده</h1>
          <p className="text-gray-400 text-xs mb-6">
            {activeTotal} آهنگ • {totalDuration}
          </p>

          <div className="flex gap-4 w-full justify-center">
            <button
              onClick={() => handleBatchPlay(true)}
              className="flex-1 max-w-[140px] py-2.5 bg-white/10 rounded-full text-sm font-medium hover:bg-white/15 transition flex justify-center gap-2 items-center"
            >
              <Icon d={ICONS.shuffle} className="w-4 h-4" /> تصادفی
            </button>
            <button
              onClick={() => handleBatchPlay(false)}
              className="flex-1 max-w-[140px] py-2.5 bg-emerald-500 rounded-full text-sm font-medium hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/30 flex justify-center gap-2 items-center"
            >
              <Icon d={ICONS.play} className="w-4 h-4" filled /> پخش همه
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar Animation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] ${viewState.showSearchBar ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 pb-4">
          <input
            value={viewState.query}
            onChange={(e) =>
              setViewState((p) => ({ ...p, query: e.target.value }))
            }
            placeholder="جستجو در آهنگ‌ها..."
            className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/5 focus:border-emerald-500/50 outline-none text-sm placeholder-gray-500 transition-colors"
            autoFocus
          />
        </div>
      </div>

      {/* List Container */}
      <div className="px-4 pb-32 space-y-1 relative z-10 min-h-[300px]">
        {renderList()}
      </div>

      <SongOptionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        song={selectedSong}
        onAction={async (action, song) => {
          if (action === "toggle-like") await handleLike(song.id);
        }}
      />
    </div>
  );
}
