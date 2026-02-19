import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  User,
  Music,
  Disc,
  ListMusic,
  Loader2,
  MoreHorizontal,
  LayoutGrid,
  List,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { SongOptionsDrawer } from "./SongOptionsDrawer";

function ensureHttps(u?: string | null): string | undefined {
  if (!u) return undefined;
  if (u.startsWith("http://")) {
    return u.replace("http://", "https://");
  }
  return u;
}

const LibraryItem = ({
  title,
  subtitle,
  imageUrl,
  icon,
  type,
  onClick,
  onOptionsClick,
  viewMode = "list",
}: {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  icon?: React.ReactNode;
  type?: string;
  onClick: () => void;
  onOptionsClick?: () => void;
  viewMode?: "list" | "grid";
}) => {
  if (viewMode === "grid") {
    return (
      <motion.button
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onClick}
        className="flex flex-col items-start w-full gap-2 group"
        dir="rtl"
      >
        <div
          className={`relative aspect-square w-full bg-[#181818] ${
            type === "artist" ? "rounded-full" : "rounded-md"
          } overflow-hidden group-hover:bg-[#282828] transition-all duration-300 shadow-lg`}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {icon || <User className="w-10 h-10 text-zinc-500" />}
            </div>
          )}
        </div>
        <div className="flex flex-col items-start overflow-hidden text-right w-full px-0.5">
          <span className="text-white text-xs font-semibold truncate w-full">
            {title}
          </span>
          {subtitle && (
            <span className="text-zinc-500 text-[10px] truncate w-full mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div layout className="relative">
      <button
        onClick={onClick}
        className="flex items-center w-full py-2 gap-4 transition-colors rounded-lg group"
        dir="rtl"
      >
        <div
          className={`flex-shrink-0 flex items-center justify-center w-16 h-16 bg-[#181818] ${
            type === "artist" ? "rounded-full" : "rounded-md"
          } overflow-hidden group-hover:bg-[#282828] transition-colors`}
        >
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill className="object-cover" />
          ) : (
            icon || <User className="w-6 h-6 text-zinc-400" />
          )}
        </div>
        <div className="flex flex-col items-start overflow-hidden text-right flex-1">
          <span className="text-white text-lg font-medium truncate w-full">
            {title}
          </span>
          {subtitle && (
            <span className="text-zinc-400 text-sm truncate w-full">
              {subtitle}
            </span>
          )}
        </div>
      </button>
      {type === "song" && onOptionsClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOptionsClick();
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 text-white/70" />
        </button>
      )}
    </motion.div>
  );
};

const LibrarySkeletonItem: React.FC<{ viewMode?: "list" | "grid" }> = ({
  viewMode = "list",
}) => {
  if (viewMode === "grid") {
    return (
      <div className="flex flex-col w-full gap-2 animate-pulse" dir="rtl">
        <div className="aspect-square w-full bg-zinc-900 rounded-md" />
        <div className="space-y-2">
          <div className="h-3 bg-zinc-900 rounded w-3/4" />
          <div className="h-2 bg-zinc-900 rounded w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div
      className="flex items-center w-full py-2 gap-4 rounded-lg animate-pulse"
      dir="rtl"
      aria-hidden
    >
      <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-zinc-900 rounded-md" />
      <div className="flex flex-col items-start overflow-hidden text-right flex-1">
        <div className="h-4 bg-zinc-900 rounded w-3/4 mb-2" />
        <div className="h-3 bg-zinc-900 rounded w-1/2" />
      </div>
    </div>
  );
};

const LibraryScreen: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { user, accessToken } = useAuth();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasNextPage, setSearchHasNextPage] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [likedSongsCount, setLikedSongsCount] = useState<number>(0);
  const [latestLikedSongCover, setLatestLikedSongCover] = useState<
    string | null
  >(null);

  const filters = [
    { id: "artist", label: "هنرمندان" },
    { id: "song", label: "آهنگ‌ها" },
    { id: "playlist", label: "پلی‌لیست‌ها" },
    { id: "album", label: "آلبوم‌ها" },
  ];

  const fetchLikedSongs = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(
        "https://api.sedabox.com/api/profile/liked-songs/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setLikedSongsCount(data.count || 0);
        if (data.results && data.results.length > 0) {
          setLatestLikedSongCover(data.results[0].cover_image);
        }
      }
    } catch (error) {
      console.error("Error fetching liked songs count:", error);
    }
  }, [accessToken]);

  const fetchHistory = useCallback(
    async (pageNum: number, type?: string) => {
      if (!accessToken) return;

      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      try {
        const queryParams = new URLSearchParams();
        if (type) queryParams.append("type", type);
        queryParams.append("page", pageNum.toString());

        const url = `https://api.sedabox.com/api/profile/history/?${queryParams.toString()}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];
          setHistory((prev) =>
            pageNum === 1 ? results : [...prev, ...results],
          );
          setHasNextPage(!!data.next);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [accessToken],
  );

  const fetchSearch = useCallback(
    async (pageNum: number, q: string, type?: string) => {
      if (!accessToken) return;

      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      try {
        // Abort previous search request if any
        if (searchAbortRef.current) {
          searchAbortRef.current.abort();
        }
        const controller = new AbortController();
        searchAbortRef.current = controller;

        const queryParams = new URLSearchParams();
        queryParams.append("q", q);
        if (type) queryParams.append("type", type);
        queryParams.append("page", pageNum.toString());

        const url = `https://api.sedabox.com/api/profile/history/search/?${queryParams.toString()}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];
          setSearchResults((prev) =>
            pageNum === 1 ? results : [...prev, ...results],
          );
          setSearchHasNextPage(!!data.next);
        }
      } catch (error) {
        if ((error as any)?.name === "AbortError") return;
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [accessToken],
  );

  // Initial load: fetch history on mount
  useEffect(() => {
    setPage(1);
    fetchHistory(1, activeFilter || undefined);
    fetchLikedSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce filter changes (when not searching) to avoid rapid intermediate requests
  const filterDebounceRef = useRef<any>(null);
  useEffect(() => {
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);

    // when filter changes, clear current display and show skeleton
    setIsLoading(true);
    setSearchResults([]);
    setHistory([]);

    if (searchQuery.trim().length === 0) {
      setPage(1);
      filterDebounceRef.current = setTimeout(() => {
        fetchHistory(1, activeFilter || undefined);
      }, 200);
    } else {
      // when there's an active search, the debounced search effect will handle fetching
      setSearchPage(1);
    }

    return () => {
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          // decide between history pagination or search pagination based on searchQuery
          (searchQuery.trim().length > 0 ? searchHasNextPage : hasNextPage) &&
          !isFetchingMore &&
          !isLoading
        ) {
          if (searchQuery.trim().length > 0) {
            setSearchPage((prev) => {
              const nextPage = prev + 1;
              fetchSearch(nextPage, searchQuery, activeFilter || undefined);
              return nextPage;
            });
          } else {
            setPage((prev) => {
              const nextPage = prev + 1;
              fetchHistory(nextPage, activeFilter || undefined);
              return nextPage;
            });
          }
        }
      },
      { threshold: 0.1, rootMargin: "400px" },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [
    hasNextPage,
    isFetchingMore,
    isLoading,
    fetchHistory,
    activeFilter,
    fetchSearch,
    searchQuery,
    searchHasNextPage,
  ]);

  // Debounced search effect: only call API after user types something (non-empty)
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (searchQuery.trim().length === 0) {
      // User cleared search - cancel any ongoing search and reset results
      if (searchAbortRef.current) searchAbortRef.current.abort();
      setSearchResults([]);
      setSearchPage(1);
      setSearchHasNextPage(false);
      setIsLoading(false);
      return;
    }

    // Ensure loading state while waiting for debounce/response
    setIsLoading(true);

    // Debounce before firing search
    searchDebounceRef.current = setTimeout(() => {
      setSearchPage(1);
      fetchSearch(1, searchQuery, activeFilter || undefined);
    }, 400);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, activeFilter, fetchSearch]);

  const getTranslatedType = (type: string) => {
    switch (type) {
      case "artist":
        return "هنرمند";
      case "song":
        return "آهنگ";
      case "playlist":
        return "پلی‌لیست";
      case "album":
        return "آلبوم";
      default:
        return "";
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "artist":
        return <User className="w-6 h-6 text-zinc-400" />;
      case "song":
        return <Music className="w-6 h-6 text-emerald-500" />;
      case "playlist":
        return <ListMusic className="w-6 h-6 text-purple-500" />;
      case "album":
        return <Disc className="w-6 h-6 text-blue-500" />;
      default:
        return <Music className="w-6 h-6 text-zinc-400" />;
    }
  };

  const filteredHistory = history.filter((item) => {
    const title = item.item.title || item.item.name || "";
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const displayItems =
    searchQuery.trim().length > 0 ? searchResults : filteredHistory;
  const noMoreResults =
    searchQuery.trim().length > 0 ? !searchHasNextPage : !hasNextPage;

  return (
    <div className="min-h-screen bg-black relative">
      {/* Dynamic Background Cover with Fade */}
      <AnimatePresence>
        {latestLikedSongCover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none overflow-hidden z-0 relative"
          >
            <Image
              src={ensureHttps(latestLikedSongCover) || ""}
              alt="Background"
              fill
              className="object-cover blur-3xl scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-[#121212]/60 backdrop-blur-2xl border-b border-white/5 px-4 pt-4 pb-3">
        <div className="max-w-xl mx-auto">
          {/* Header First Row */}
          <div className="relative h-12 flex items-center justify-between overflow-hidden">
            <AnimatePresence mode="wait">
              {!isSearchActive ? (
                <motion.div
                  key="title-row"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full flex items-center justify-between"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => navigateTo("profile")}
                      className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 cursor-pointer transition-transform active:scale-95"
                    >
                      {user?.first_name ? (
                        <span className="text-white font-bold">
                          {user.first_name[0]}
                        </span>
                      ) : (
                        <User className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    <h1 className="text-xl font-bold text-white">
                      کتابخانه شما
                    </h1>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setViewMode(viewMode === "list" ? "grid" : "list")
                      }
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      {viewMode === "list" ? (
                        <LayoutGrid className="w-6 h-6 text-white" />
                      ) : (
                        <List className="w-6 h-6 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setIsSearchActive(true)}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <Search className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="search-row"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full h-full flex items-center gap-2"
                  dir="rtl"
                >
                  <div className="relative flex-1 h-10">
                    <Search className="absolute right-3  top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSearchQuery(v);
                        if (v.trim().length > 0) {
                          if (searchAbortRef.current)
                            searchAbortRef.current.abort();
                          setIsLoading(true);
                          setSearchResults([]);
                        }
                      }}
                      placeholder="جستجو در کتابخانه ..."
                      className="w-full h-full bg-zinc-800 text-white pr-10 pl-10 rounded-lg text-sm focus:outline-none transition-all"
                    />
                    <button
                      onClick={() => {
                        setIsSearchActive(false);
                        setSearchQuery("");
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-700 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Header Second Row: Chips */}
          <div
            className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar"
            dir="rtl"
          >
            <button
              onClick={() => setActiveFilter(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeFilter === null
                  ? "bg-emerald-500 text-black"
                  : "bg-zinc-800 text-white hover:bg-zinc-700"
              }`}
            >
              همه
            </button>
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter.id
                    ? "bg-emerald-500 text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="overflow-y-auto pb-24">
        <div
          className={`max-w-xl mx-auto px-4 mt-6 ${
            viewMode === "grid"
              ? "grid grid-cols-3 gap-x-4 gap-y-8"
              : "flex flex-col space-y-2"
          }`}
        >
          {/* Liked Songs Special Item */}
          {!searchQuery.trim() &&
            (activeFilter === null || activeFilter === "song") && (
              <LibraryItem
                title="آهنگ‌های لایک شده"
                subtitle={`${likedSongsCount} آهنگ`}
                viewMode={viewMode}
                type="playlist"
                icon={
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-800 flex items-center justify-center relative shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]">
                    <Heart className="w-8 h-8 text-white fill-white animate-pulse drop-shadow-[0_0_15px_rgba(16,185,129,0.9)]" />
                  </div>
                }
                onClick={() => navigateTo("liked-songs")}
              />
            )}

          {isLoading ? (
            <>
              {Array.from({ length: 9 }).map((_, i) => (
                <LibrarySkeletonItem key={i} viewMode={viewMode} />
              ))}
            </>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {displayItems.map((historyItem) => {
                  const { type, item } = historyItem;
                  const title = item.title || item.name || "";
                  const imageUrl = item.cover_image || item.profile_image || "";
                  const subtitle =
                    type === "song" || type === "album"
                      ? item.artist_name || getTranslatedType(type)
                      : getTranslatedType(type);

                  return (
                    <LibraryItem
                      key={historyItem.id}
                      title={title}
                      subtitle={subtitle}
                      imageUrl={imageUrl}
                      icon={getIconForType(type)}
                      type={type}
                      viewMode={viewMode}
                      onClick={() => {
                        const pageMap: Record<string, string> = {
                          artist: "artist-detail",
                          song: "song-detail",
                          playlist: "playlist-detail",
                          album: "album-detail",
                        };
                        navigateTo(pageMap[type], {
                          id: item.id,
                          slug: item.id, // Fallback slug to ID
                        });
                      }}
                    />
                  );
                })}
              </AnimatePresence>

              {displayItems.length > 0 && (
                <div
                  ref={loadMoreRef}
                  className={`pt-8 pb-12 flex flex-col items-center justify-center ${
                    viewMode === "grid" ? "col-span-3" : ""
                  }`}
                >
                  {isFetchingMore && (
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      <span className="text-xs">در حال بارگذاری ...</span>
                    </div>
                  )}
                  {noMoreResults && !isFetchingMore && (
                    <div className="flex flex-col items-center gap-2 opacity-60">
                      <div className="flex items-center gap-4 w-full min-w-[240px]">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-zinc-800" />
                        <Music className="w-4 h-4 text-zinc-700" />
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
                      </div>
                      <p className="text-zinc-500 text-[10px] font-medium tracking-widest uppercase">
                        پایان نتایج کتابخانه
                      </p>
                    </div>
                  )}
                </div>
              )}

              {displayItems.length === 0 && (
                <div
                  className={`text-center py-12 ${
                    viewMode === "grid" ? "col-span-3" : ""
                  }`}
                >
                  <p className="text-zinc-500">موردی یافت نشد</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryScreen;
