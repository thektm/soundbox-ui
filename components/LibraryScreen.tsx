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
import { SongOptionsDrawer } from "./SongOptionsDrawer";
import { SEO } from "./SEO";

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
  meta,
  onClick,
  onOptionsClick,
  onTitleClick,
  onSubtitleClick,
  viewMode = "list",
}: {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  icon?: React.ReactNode;
  type?: string;
  meta?: any;
  onClick: () => void;
  onOptionsClick?: () => void;
  onTitleClick?: () => void;
  onSubtitleClick?: () => void;
  viewMode?: "list" | "grid";
}) => {
  const itemAriaLabel = `مشاهده ${title}${subtitle ? ` اثر ${subtitle}` : ""}`;

  if (viewMode === "grid") {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(min-width: 768px)").matches;

    return (
      <motion.button
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={onClick}
        className="flex flex-col items-start w-full gap-2 group focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg outline-none"
        dir="rtl"
        aria-label={itemAriaLabel}
        role="listitem"
      >
        <div
          className={`relative aspect-square w-full bg-[#181818] ${
            type === "artist" ? "rounded-full" : "rounded-md"
          } overflow-hidden group-hover:bg-[#282828] transition-all duration-300 shadow-lg`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              aria-hidden="true"
            >
              {icon || <User className="w-10 h-10 text-zinc-500" />}
              {/* plan badge moved to subtitle area for user cards (appended after unique_id) */}
            </div>
          )}
        </div>
        <div className="flex flex-col items-start overflow-hidden text-right w-full px-0.5">
          {typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(min-width: 768px)").matches ? (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onTitleClick && onTitleClick();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onTitleClick && onTitleClick();
                  }
                }}
                role={onTitleClick ? "link" : undefined}
                tabIndex={onTitleClick ? 0 : undefined}
                className="text-white text-xs font-semibold truncate w-full cursor-pointer hover:underline"
              >
                {title}
                {type === "user" && meta && meta.unique_id === "sedabox" && (
                  <span
                    className="inline-flex items-center mr-2 text-emerald-500"
                    aria-label="تأیید شده"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M12 2a2 2 0 012 2v.184a2 2 0 001.106 1.788l.796.447a2 2 0 01.94 2.457l-.244.79a2 2 0 00.485 1.86l.56.61a2 2 0 01.29 2.03l-.37.828a2 2 0 00.44 2.2l.59.59a2 2 0 01.02 2.83l-1.06 1.06a2 2 0 01-2.83.02l-.59-.59a2 2 0 00-2.2-.44l-.828.37a2 2 0 01-2.03-.29l-.61-.56a2 2 0 00-1.86-.485l-.79.244a2 2 0 01-2.457-.94l-.447-.796A2 2 0 014.184 16H4a2 2 0 01-2-2V12a2 2 0 012-2h.184a2 2 0 001.788-1.106l.447-.796A2 2 0 018.07 5.17L8.314 4.38A2 2 0 009.7 3.44L10.31 3a2 2 0 001.69-1.285A2 2 0 0112 2z" />
                      <path
                        d="M10 13l2 2 4-4"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </span>
              {subtitle && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubtitleClick && onSubtitleClick();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      onSubtitleClick && onSubtitleClick();
                    }
                  }}
                  role={onSubtitleClick ? "link" : undefined}
                  tabIndex={onSubtitleClick ? 0 : undefined}
                  className="text-zinc-400 text-[10px] truncate w-full mt-0.5 cursor-pointer hover:underline flex items-center gap-1"
                >
                  <span className="truncate">{subtitle}</span>
                  {type === "user" && meta && (
                    <span className="text-emerald-500 text-5xl">·</span>
                  )}
                  {type === "user" &&
                    meta &&
                    (meta.plan === "premium" ? (
                      <span className="flex items-center gap-1 text-white">
                        {/* کاربر */}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-white">
                        کاربر
                      </span>
                    ))}
                </span>
              )}
            </>
          ) : (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onTitleClick && onTitleClick();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onTitleClick && onTitleClick();
                  }
                }}
                role={onTitleClick ? "link" : undefined}
                tabIndex={onTitleClick ? 0 : undefined}
                className={`text-white text-xs font-semibold truncate w-full ${
                  onTitleClick ? "cursor-pointer hover:underline" : ""
                }`}
              >
                {title}
                {type === "user" && meta && meta.unique_id === "sedabox" && (
                  <span
                    className="inline-flex items-center mr-2 text-emerald-500"
                    aria-label="تأیید شده"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M12 2a2 2 0 012 2v.184a2 2 0 001.106 1.788l.796.447a2 2 0 01.94 2.457l-.244.79a2 2 0 00.485 1.86l.56.61a2 2 0 01.29 2.03l-.37.828a2 2 0 00.44 2.2l.59.59a2 2 0 01.02 2.83l-1.06 1.06a2 2 0 01-2.83.02l-.59-.59a2 2 0 00-2.2-.44l-.828.37a2 2 0 01-2.03-.29l-.61-.56a2 2 0 00-1.86-.485l-.79.244a2 2 0 01-2.457-.94l-.447-.796A2 2 0 014.184 16H4a2 2 0 01-2-2V12a2 2 0 012-2h.184a2 2 0 001.788-1.106l.447-.796A2 2 0 018.07 5.17L8.314 4.38A2 2 0 009.7 3.44L10.31 3a2 2 0 001.69-1.285A2 2 0 0112 2z" />
                      <path
                        d="M10 13l2 2 4-4"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </span>
              {subtitle && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubtitleClick && onSubtitleClick();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      onSubtitleClick && onSubtitleClick();
                    }
                  }}
                  role={onSubtitleClick ? "link" : undefined}
                  tabIndex={onSubtitleClick ? 0 : undefined}
                  className={`text-zinc-400 text-[10px] truncate w-full mt-0.5 flex items-center gap-1 ${
                    (type === "song" || type === "album") && onSubtitleClick
                      ? "cursor-pointer hover:underline"
                      : ""
                  }`}
                >
                  <span className="truncate">{subtitle}</span>
                  {type === "user" && meta && (
                    <span className="text-emerald-500 text-5xl">·</span>
                  )}
                  {type === "user" &&
                    meta &&
                    (meta.plan === "premium" ? (
                      <span className="flex items-center gap-1 text-white">
                        کاربر
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-white">
                        کاربر
                      </span>
                    ))}
                </span>
              )}
            </>
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div layout className="relative" role="listitem">
      <button
        onClick={onClick}
        className="flex items-center w-full py-2 gap-4 transition-colors rounded-lg group focus-visible:bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 px-2"
        dir="rtl"
        aria-label={itemAriaLabel}
      >
        <div
          className={`flex-shrink-0 flex items-center justify-center w-16 h-16 bg-[#181818] ${
            type === "artist" ? "rounded-full" : "rounded-md"
          } overflow-hidden group-hover:bg-[#282828] transition-colors`}
          aria-hidden="true"
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            icon || <User className="w-6 h-6 text-zinc-400" />
          )}
        </div>

        <div className="flex flex-col items-start overflow-hidden text-right flex-1">
          {typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(min-width: 768px)").matches ? (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onTitleClick && onTitleClick();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onTitleClick && onTitleClick();
                  }
                }}
                role={onTitleClick ? "link" : undefined}
                tabIndex={onTitleClick ? 0 : undefined}
                className="text-white text-lg font-medium truncate w-full cursor-pointer hover:underline"
              >
                {title}
                {type === "user" && meta && meta.unique_id === "sedabox" && (
                  <span
                    className="inline-flex items-center mr-2 text-emerald-500"
                    aria-label="تأیید شده"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M12 2a2 2 0 012 2v.184a2 2 0 001.106 1.788l.796.447a2 2 0 01.94 2.457l-.244.79a2 2 0 00.485 1.86l.56.61a2 2 0 01.29 2.03l-.37.828a2 2 0 00.44 2.2l.59.59a2 2 0 01.02 2.83l-1.06 1.06a2 2 0 01-2.83.02l-.59-.59a2 2 0 00-2.2-.44l-.828.37a2 2 0 01-2.03-.29l-.61-.56a2 2 0 00-1.86-.485l-.79.244a2 2 0 01-2.457-.94l-.447-.796A2 2 0 014.184 16H4a2 2 0 01-2-2V12a2 2 0 012-2h.184a2 2 0 001.788-1.106l.447-.796A2 2 0 018.07 5.17L8.314 4.38A2 2 0 009.7 3.44L10.31 3a2 2 0 001.69-1.285A2 2 0 0112 2z" />
                      <path
                        d="M10 13l2 2 4-4"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </span>
              {subtitle && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubtitleClick && onSubtitleClick();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      onSubtitleClick && onSubtitleClick();
                    }
                  }}
                  role={onSubtitleClick ? "link" : undefined}
                  tabIndex={onSubtitleClick ? 0 : undefined}
                  className="text-zinc-400 text-sm truncate w-full cursor-pointer hover:underline flex items-center gap-1"
                >
                  <span className="truncate">{subtitle}</span>
                  {type === "user" && meta && (
                    <span className="text-emerald-500 text-5xl">·</span>
                  )}
                  {type === "user" &&
                    meta &&
                    (meta.plan === "premium" ? (
                      <span className="flex items-center gap-1 text-white">
                        کاربر
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-white">
                        کاربر
                      </span>
                    ))}
                </span>
              )}
            </>
          ) : (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onTitleClick && onTitleClick();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onTitleClick && onTitleClick();
                  }
                }}
                role={onTitleClick ? "link" : undefined}
                tabIndex={onTitleClick ? 0 : undefined}
                className={`text-white text-lg font-medium truncate w-full ${
                  onTitleClick ? "cursor-pointer hover:underline" : ""
                }`}
              >
                {title}
                {type === "user" && meta && meta.unique_id === "sedabox" && (
                  <span
                    className="inline-flex items-center mr-2 text-emerald-500"
                    aria-label="تأیید شده"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M12 2a2 2 0 012 2v.184a2 2 0 001.106 1.788l.796.447a2 2 0 01.94 2.457l-.244.79a2 2 0 00.485 1.86l.56.61a2 2 0 01.29 2.03l-.37.828a2 2 0 00.44 2.2l.59.59a2 2 0 01.02 2.83l-1.06 1.06a2 2 0 01-2.83.02l-.59-.59a2 2 0 00-2.2-.44l-.828.37a2 2 0 01-2.03-.29l-.61-.56a2 2 0 00-1.86-.485l-.79.244a2 2 0 01-2.457-.94l-.447-.796A2 2 0 014.184 16H4a2 2 0 01-2-2V12a2 2 0 012-2h.184a2 2 0 001.788-1.106l.447-.796A2 2 0 08.07 5.17L8.314 4.38A2 2 0 009.7 3.44L10.31 3a2 2 0 001.69-1.285A2 2 0 0112 2z" />
                      <path
                        d="M10 13l2 2 4-4"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </span>
              {subtitle && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubtitleClick && onSubtitleClick();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      onSubtitleClick && onSubtitleClick();
                    }
                  }}
                  role={onSubtitleClick ? "link" : undefined}
                  tabIndex={onSubtitleClick ? 0 : undefined}
                  className={`text-zinc-400 text-sm truncate w-full flex items-center gap-1 ${
                    (type === "song" || type === "album") && onSubtitleClick
                      ? "cursor-pointer hover:underline"
                      : ""
                  }`}
                >
                  <span className="truncate">{subtitle}</span>
                  {type === "user" && meta && (
                    <span className="text-emerald-500 text-5xl">·</span>
                  )}
                  {type === "user" &&
                    meta &&
                    (meta.plan === "premium" ? (
                      <span className="flex items-center gap-1 text-white">
                        کاربر
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-white">
                        کاربر
                      </span>
                    ))}
                </span>
              )}
            </>
          )}
        </div>
      </button>
      {type === "song" && onOptionsClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOptionsClick();
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
          aria-label={`گزینه‌های بیشتر برای ${title}`}
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
      <div
        className="flex flex-col w-full gap-2 animate-pulse"
        dir="rtl"
        aria-hidden="true"
        role="status"
      >
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
      aria-hidden="true"
      role="status"
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
  const { user, accessToken, authenticatedFetch } = useAuth();
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
    { id: "user", label: "کاربران" },
    { id: "song", label: "آهنگ‌ها" },
    { id: "playlist", label: "پلی‌لیست‌ها" },
    { id: "album", label: "آلبوم‌ها" },
  ];

  const fetchLikedSongs = useCallback(async () => {
    try {
      const response = await authenticatedFetch(
        "https://api.sedabox.com/api/profile/liked-songs/",
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
  }, [authenticatedFetch]);

  const fetchHistory = useCallback(
    async (pageNum: number, type?: string) => {
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
        const response = await authenticatedFetch(url);

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
    [authenticatedFetch],
  );

  const fetchSearch = useCallback(
    async (pageNum: number, q: string, type?: string) => {
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
        const response = await authenticatedFetch(url, {
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
    [authenticatedFetch],
  );

  // Initial load: fetch history on mount
  useEffect(() => {
    setPage(1);
    fetchHistory(1, activeFilter || undefined);
    fetchLikedSongs();
  }, [fetchHistory, fetchLikedSongs]);

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
  }, [activeFilter, searchQuery, fetchHistory]);

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
      case "user":
        return "کاربر";
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
      case "user":
        return <User className="w-6 h-6 text-emerald-500" />;
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
      <SEO title="کتابخانه شما" />
      {/* Dynamic Background Cover with Fade */}
      <AnimatePresence>
        {latestLikedSongCover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none overflow-hidden z-0"
          >
            <img
              src={ensureHttps(latestLikedSongCover)}
              alt="Background"
              className="w-full h-full object-cover blur-3xl scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-[#121212]/60 backdrop-blur-2xl border-b border-white/5 px-4 pt-4 pb-3">
        <div className="max-w-full mx-auto lg:max-w-6xl">
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
                    <button
                      onClick={() => navigateTo("profile")}
                      className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 cursor-pointer transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      aria-label="مشاهده پروفایل"
                    >
                      {user?.image_profile && user.image_profile.image ? (
                        <img
                          src={ensureHttps(user.image_profile.image)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : user?.first_name ? (
                        <span className="text-white font-bold">
                          {user.first_name[0]}
                        </span>
                      ) : (
                        <User className="w-6 h-6 text-zinc-400" />
                      )}
                    </button>
                    <h1 className="text-xl font-bold text-white">
                      کتابخانه شما
                    </h1>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setViewMode(viewMode === "list" ? "grid" : "list")
                      }
                      className="p-2 rounded-full hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      aria-label={
                        viewMode === "list"
                          ? "تغییر به نمای شبکه‌ای"
                          : "تغییر به نمای لیستی"
                      }
                    >
                      {viewMode === "list" ? (
                        <LayoutGrid className="w-6 h-6 text-white" />
                      ) : (
                        <List className="w-6 h-6 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setIsSearchActive(true)}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      aria-label="جستجو در کتابخانه"
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
                    <Search
                      className="absolute right-3  top-1/2 -translate-y-1/2 w-5 h-5 text-white"
                      aria-hidden="true"
                    />
                    <label htmlFor="library-search-input" className="sr-only">
                      جستجو در کتابخانه
                    </label>
                    <input
                      autoFocus
                      id="library-search-input"
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
                      className="w-full h-full bg-zinc-800 text-white pr-10 pl-10 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all"
                    />
                    <button
                      onClick={() => {
                        setIsSearchActive(false);
                        setSearchQuery("");
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-700 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      aria-label="بستن جستجو"
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
            role="group"
            aria-label="فیلترهای کتابخانه"
          >
            <button
              onClick={() => setActiveFilter(null)}
              aria-pressed={activeFilter === null}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
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
                aria-pressed={activeFilter === filter.id}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
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
      <main className="overflow-y-auto pb-24" aria-live="polite">
        <div
          role="list"
          className={`max-w-full mx-auto lg:max-w-6xl px-4 mt-6 ${
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
                  let title = item.title || item.name || "";
                  let imageUrl = item.cover_image || item.profile_image || "";
                  let subtitle = getTranslatedType(type);

                  if (type === "user") {
                    const name =
                      `${item.first_name || ""} ${item.last_name || ""}`.trim();
                    title = name || item.unique_id || `کاربر ${item.id}`;
                    subtitle = item.unique_id || "";
                    imageUrl = item.image_profile?.image || imageUrl || "";
                  } else if (type === "artist") {
                    title = item.name || title;
                    imageUrl = item.profile_image || imageUrl || "";
                    subtitle = item.unique_id || getTranslatedType(type);
                  } else if (type === "song" || type === "album") {
                    title = item.title || item.name || title;
                    imageUrl =
                      item.cover_image || item.profile_image || imageUrl || "";
                    subtitle = item.artist_name || getTranslatedType(type);
                  } else if (type === "playlist") {
                    title = item.title || title;
                    imageUrl = item.cover_image || imageUrl || "";
                    subtitle = getTranslatedType(type);
                  }

                  return (
                    <LibraryItem
                      key={historyItem.id}
                      title={title}
                      subtitle={subtitle}
                      imageUrl={imageUrl}
                      icon={getIconForType(type)}
                      type={type}
                      meta={item}
                      viewMode={viewMode}
                      onClick={() => {
                        // Special-case users: prefer navigating using unique_id when available
                        if (type === "user") {
                          const uid = item.unique_id || item.id.toString();
                          navigateTo("user-detail", { id: uid });
                          return;
                        }

                        const pageMap: Record<string, string> = {
                          user: "user-detail",
                          artist: "artist-detail",
                          song: "song-detail",
                          playlist: "playlist-detail",
                          album: "album-detail",
                        };
                        const page = pageMap[type];
                        if (page) {
                          navigateTo(page, {
                            id: item.id,
                            uniqueId: item.unique_id || undefined,
                            slug: item.unique_id || item.id,
                          });
                        }
                      }}
                      onTitleClick={() => {
                        if (type === "user") {
                          const uid = item.unique_id || item.id.toString();
                          navigateTo("user-detail", { id: uid });
                          return;
                        }

                        const pageMap: Record<string, string> = {
                          user: "user-detail",
                          artist: "artist-detail",
                          song: "song-detail",
                          playlist: "playlist-detail",
                          album: "album-detail",
                        };
                        const page = pageMap[type];
                        if (page) {
                          navigateTo(page, {
                            id: item.id,
                            uniqueId: item.unique_id || undefined,
                            slug: item.unique_id || item.id,
                          });
                        }
                      }}
                      onSubtitleClick={() => {
                        // for songs/albums, subtitle is artist name -> go to artist detail
                        if (type === "song" || type === "album") {
                          if (item.artist_id) {
                            navigateTo("artist-detail", { id: item.artist_id });
                          }
                        } else if (type === "user") {
                          const uid = item.unique_id || item.id.toString();
                          navigateTo("user-detail", { id: uid });
                        }
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
      </main>
    </div>
  );
};

export default LibraryScreen;
