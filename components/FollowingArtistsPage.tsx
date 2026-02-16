"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import {
  LayoutGrid,
  List,
  ChevronRight,
  Loader2,
  Music,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApiArtist {
  id: number;
  name: string;
  profile_image: string;
  is_following: boolean;
  verified: boolean;
  followers_count: number;
  followed_at?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const FollowingArtistsPage: React.FC = () => {
  const { accessToken } = useAuth();
  const { navigateTo, goBack, registerScrollContainer } = useNavigation();
  const [artists, setArtists] = useState<ApiArtist[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerScrollContainer(containerRef.current);
  }, [registerScrollContainer]);

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://api.sedabox.com/api/profile/my-artists/",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (response.ok) {
          const data: PaginatedResponse<ApiArtist> = await response.json();
          setArtists(data.results);
          setNextUrl(data.next);
        }
      } catch (error) {
        console.error("Error fetching followed artists:", error);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchArtists();
    }
  }, [accessToken]);

  const loadMore = useCallback(async () => {
    if (!nextUrl || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const response = await fetch(nextUrl.replace("http://", "https://"), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data: PaginatedResponse<ApiArtist> = await response.json();
        setArtists((prev) => [...prev, ...data.results]);
        setNextUrl(data.next);
      }
    } catch (error) {
      console.error("Error loading more artists:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [nextUrl, isFetchingMore, accessToken]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !nextUrl || isFetchingMore || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      loadMore();
    }
  }, [loadMore, nextUrl, isFetchingMore, loading]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative w-full h-[100dvh] lg:h-full overflow-y-auto bg-[#030303] text-white no-scrollbar pb-32"
      dir="rtl"
    >
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 group"
            title={viewMode === "grid" ? "نمای لیستی" : "نمای شبکه‌ای"}
          >
            {viewMode === "grid" ? (
              <List className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400" />
            ) : (
              <LayoutGrid className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400" />
            )}
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              هنرمندان دنبال شده
            </h1>
            {!loading && (
              <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-widest">
                {artists.length} هنرمند
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
        </div>
      </div>

      <div className="relative z-10">
        {/* Subtle Hero */}
        <div className="px-6 pt-8 pb-4 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-2">
              هنرمندان شما
            </h2>
            <div className="h-1 w-20 bg-emerald-500 rounded-full" />
          </motion.div>

          <AnimatePresence mode="popLayout">
            {loading && artists.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <Music className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 animate-pulse" />
                </div>
                <p className="mt-6 text-zinc-500 font-medium animate-pulse">
                  در حال فراخوانی هنرمندان...
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layout
                className={`
                  ${
                    viewMode === "grid"
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 sm:gap-8"
                      : "flex flex-col space-y-3 max-w-3xl mx-auto"
                  }
                `}
              >
                {artists.map((artist, index) => (
                  <ArtistItem
                    key={artist.id}
                    artist={artist}
                    viewMode={viewMode}
                    index={index}
                    onClick={() =>
                      navigateTo("artist-detail", { id: artist.id })
                    }
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {isFetchingMore && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                بارگذاری موارد بیشتر
              </p>
            </div>
          )}

          {!loading && artists.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                <User className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                هنوز کسی را دنبال نکرده‌اید
              </h3>
              <p className="text-zinc-500 max-w-xs mx-auto text-sm leading-relaxed">
                هنرمندان مورد علاقه خود را پیدا کنید و آن‌ها را دنبال کنید تا در
                اینجا نمایش داده شوند.
              </p>
              <button
                onClick={() => navigateTo("search")}
                className="mt-8 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-full transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                جستجوی هنرمندان
              </button>
            </motion.div>
          )}

          {/* End of list indicator */}
          {!nextUrl && artists.length > 0 && !loading && (
            <div className="py-16 flex flex-col items-center gap-4 opacity-30">
              <div className="flex items-center gap-4 w-full max-w-xs">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white" />
                <Music className="w-4 h-4" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em]">
                پایان لیست هنرمندان
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ArtistItemProps {
  artist: ApiArtist;
  viewMode: "grid" | "list";
  index: number;
  onClick: () => void;
}

const ArtistItem: React.FC<ArtistItemProps> = ({
  artist,
  viewMode,
  index,
  onClick,
}) => {
  if (viewMode === "grid") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.3) }}
        onClick={onClick}
        className="group cursor-pointer flex flex-col items-center text-center space-y-4"
      >
        <div className="relative w-full aspect-square">
          {/* Decorative Ring */}
          <div className="absolute inset-[-4px] rounded-full border-2 border-emerald-500/0 group-hover:border-emerald-500/30 transition-all duration-500 scale-95 group-hover:scale-105" />

          <div className="relative w-full h-full overflow-hidden rounded-full shadow-2xl bg-zinc-900 border-2 border-white/5 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:border-emerald-500/50">
            <ImageWithPlaceholder
              src={artist.profile_image}
              alt={artist.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              type="artist"
            />
          </div>

          {/* Verification Badge */}
          {artist.verified && (
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#030303] z-10 shadow-lg">
              <svg
                viewBox="0 0 24 24"
                className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-current"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
          )}
        </div>

        <div className="space-y-1 px-1">
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
            {artist.name}
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            هنرمند
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      onClick={onClick}
      className="group cursor-pointer flex items-center gap-4 p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all duration-300"
    >
      <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
        <div className="w-full h-full overflow-hidden rounded-full border-2 border-white/10 group-hover:border-emerald-500/50 transition-colors">
          <ImageWithPlaceholder
            src={artist.profile_image}
            alt={artist.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            type="artist"
          />
        </div>
        {artist.verified && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#030303] shadow-md">
            <svg
              viewBox="0 0 24 24"
              className="w-2.5 h-2.5 text-white fill-current"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
          {artist.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>هنرمند</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span>
            {artist.followers_count?.toLocaleString("fa-IR")} دنبال کننده
          </span>
        </div>
      </div>

      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/5 opacity-0 group-hover:opacity-100 transition-all group-hover:bg-emerald-500 group-hover:border-emerald-500">
        <ChevronRight className="w-5 h-5 text-white rotate-180" />
      </div>
    </motion.div>
  );
};

export default FollowingArtistsPage;
