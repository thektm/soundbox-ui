"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, User } from "./AuthContext";
import {
  X,
  Check,
  Heart,
  ArrowRight,
  ArrowLeft,
  Music,
  Users,
  Hash,
  Loader2,
} from "lucide-react";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { toast } from "react-hot-toast";

interface Genre {
  id: number;
  name: string;
  title: string;
  slug: string;
}

interface Artist {
  id: number;
  name: string;
  profile_image: string;
  is_following: boolean;
}

interface Playlist {
  id: number;
  unique_id: string;
  title: string;
  cover_image: string;
  is_liked: boolean;
}

export const InitialModal: React.FC = () => {
  const {
    needsInitialCheck,
    setNeedsInitialCheck,
    markInitialCheckCompleted,
    authenticatedFetch,
    accessToken,
  } = useAuth();
  const [step, setStep] = useState(0); // 0: Artists, 1: Genres, 2: Playlists
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Data states
  const [popularArtists, setPopularArtists] = useState<Artist[]>([]);
  const [nextArtistsUrl, setNextArtistsUrl] = useState<string | null>(null);
  const [isArtistLoadingMore, setIsArtistLoadingMore] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<Playlist[]>(
    [],
  );

  // Selection states
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Set<number>>(
    new Set(),
  );
  const [likedPlaylists, setLikedPlaylists] = useState<Set<string>>(new Set());

  const canProceed = step !== 0 || followedArtists.size >= 3;

  useEffect(() => {
    if (needsInitialCheck && accessToken) {
      if (step === 0 && popularArtists.length === 0) fetchArtists();
      if (step === 1 && genres.length === 0) fetchGenres();
      if (step === 2 && recommendedPlaylists.length === 0) fetchPlaylists();
    }
  }, [needsInitialCheck, step, accessToken]);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const resp = await authenticatedFetch(
        "https://api.sedabox.com/api/home/popular-artists/",
      );
      if (resp.ok) {
        const data = await resp.json();
        const results = data.results || [];
        setPopularArtists(results);
        setNextArtistsUrl(data.next);
        // Initialize followedArtists from server-provided is_following
        try {
          const serverFollowing = new Set<number>();
          results.forEach((a: any) => {
            if (a.is_following) serverFollowing.add(a.id);
          });
          if (serverFollowing.size > 0) {
            setFollowedArtists(
              (prev) =>
                new Set([...Array.from(prev), ...Array.from(serverFollowing)]),
            );
          }
        } catch (e) {
          /* noop */
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreArtists = async () => {
    if (!nextArtistsUrl || isArtistLoadingMore) return;
    setIsArtistLoadingMore(true);
    try {
      const resp = await authenticatedFetch(
        nextArtistsUrl.replace("http://", "https://"),
      );
      if (resp.ok) {
        const data = await resp.json();
        const results = data.results || [];
        setPopularArtists((prev) => [...prev, ...results]);
        setNextArtistsUrl(data.next);
        // Merge server-provided following flags
        try {
          const serverFollowing = new Set<number>();
          results.forEach((a: any) => {
            if (a.is_following) serverFollowing.add(a.id);
          });
          if (serverFollowing.size > 0) {
            setFollowedArtists(
              (prev) =>
                new Set([...Array.from(prev), ...Array.from(serverFollowing)]),
            );
          }
        } catch (e) {
          /* noop */
        }
      }
    } catch (err) {
      console.error("Load more artists Error:", err);
    } finally {
      setIsArtistLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (step !== 0 || !nextArtistsUrl || isArtistLoadingMore) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      loadMoreArtists();
    }
  };

  const fetchGenres = async () => {
    setLoading(true);
    try {
      const resp = await authenticatedFetch(
        "https://api.sedabox.com/api/genres/",
      );
      if (resp.ok) {
        const data = await resp.json();
        setGenres(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const resp = await authenticatedFetch(
        "https://api.sedabox.com/api/home/playlist-recommendations/",
      );
      if (resp.ok) {
        const data = await resp.json();
        setRecommendedPlaylists(
          Array.isArray(data) ? data : data.results || [],
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (artistId: number, artistName: string) => {
    try {
      const res = await authenticatedFetch(
        "https://api.sedabox.com/api/follow/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artist_id: artistId }),
        },
      );
      if (res.ok) {
        const result = await res.json();
        const isFollowing = result.message === "followed";

        if (isFollowing) {
          setFollowedArtists((prev) => new Set(prev).add(artistId));
          toast.success(`دنبال شد: ${artistName}`);
        } else {
          setFollowedArtists((prev) => {
            const next = new Set(prev);
            next.delete(artistId);
            return next;
          });
          toast.success(`لغو دنبال کردن: ${artistName}`);
        }
      } else {
        toast.error("خطا در انجام عملیات");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const handleLikePlaylist = async (uniqueId: string, title: string) => {
    try {
      const res = await authenticatedFetch(
        `https://api.sedabox.com/api/home/playlist-recommendations/${uniqueId}/like/`,
        {
          method: "POST",
        },
      );
      if (res.ok) {
        const result = await res.json();
        const isLiked = result.status === "liked";

        if (isLiked) {
          const effectiveId = result.new_unique_id || uniqueId;
          setLikedPlaylists((prev) => new Set(prev).add(effectiveId));

          // If identity changed, update the list to avoid stale references
          if (result.new_unique_id && result.new_unique_id !== uniqueId) {
            setRecommendedPlaylists((prev) =>
              prev.map((p) =>
                p.unique_id === uniqueId
                  ? { ...p, unique_id: result.new_unique_id }
                  : p,
              ),
            );
          }

          toast.success(`به لایک‌ها اضافه شد: ${title}`);
        } else {
          setLikedPlaylists((prev) => {
            const next = new Set(prev);
            next.delete(uniqueId);
            return next;
          });
          toast.success(`از لایک‌ها حذف شد: ${title}`);
        }
      } else {
        toast.error("خطا در بروزرسانی لایک");
      }
    } catch (err) {
      console.error(err);
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else handleFinish();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    await markInitialCheckCompleted(selectedGenres);
    setLoading(false);
    toast.success("تنظیمات ذخیره شد");
  };

  const handleCancel = async () => {
    setLoading(true);
    await markInitialCheckCompleted([]); // Send empty list as requested
    setLoading(false);
  };

  if (!needsInitialCheck) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-hidden"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col border border-white/5 shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              {step === 0 && <Users size={24} />}
              {step === 1 && <Hash size={24} />}
              {step === 2 && <Music size={24} />}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                {step === 0 &&
                  (followedArtists.size >= 3
                    ? "هنرمندان مورد علاقه خود را دنبال کنید"
                    : "هنرمندان مورد علاقه خود را دنبال کنید")}
                {step === 1 && "سبک‌های موسیقی مورد علاقه"}
                {step === 2 && "پلی‌لیست‌های پیشنهادی برای شما"}
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                {step === 0 &&
                  `حداقل ۳ هنرمند را دنبال کنید (${followedArtists.size}/۳)`}
                {step === 1 && "حداقل یک سبک را انتخاب کنید"}
                {step === 2 &&
                  "این پلی‌لیست‌ها بر اساس سلیقه شما انتخاب شده‌اند"}
              </p>
            </div>
          </div>
          {canProceed && (
            <button
              onClick={handleCancel}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar"
        >
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {popularArtists.map((artist) => {
                    const isFollowed = followedArtists.has(artist.id);
                    return (
                      <div
                        key={artist.id}
                        className="group flex flex-col items-center gap-3"
                      >
                        <div className="relative w-full aspect-square rounded-full overflow-hidden border-2 border-transparent transition-all group-hover:border-emerald-500/50">
                          <ImageWithPlaceholder
                            src={artist.profile_image}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                          {isFollowed && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                                <Check size={20} />
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-white font-medium text-sm text-center truncate w-full">
                          {artist.name}
                        </span>
                        <button
                          onClick={() => handleFollow(artist.id, artist.name)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            isFollowed
                              ? "bg-zinc-800 text-emerald-500 border border-emerald-500/30"
                              : "bg-white text-black hover:scale-105 active:scale-95"
                          }`}
                        >
                          {isFollowed ? "دنبال شده" : "دنبال کردن"}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {isArtistLoadingMore && (
                  <div className="py-6 flex justify-center w-full">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
              >
                {genres.map((genre, idx) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  const colors = [
                    "bg-orange-600",
                    "bg-purple-600",
                    "bg-pink-600",
                    "bg-blue-600",
                    "bg-teal-600",
                    "bg-indigo-600",
                    "bg-rose-600",
                    "bg-amber-600",
                  ];
                  const colorClass = colors[idx % colors.length];

                  return (
                    <button
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`relative h-28 md:h-32 rounded-xl overflow-hidden p-4 text-right transition-all group shadow-lg ${
                        isSelected
                          ? "ring-4 ring-white scale-[0.98]"
                          : "hover:scale-105"
                      } ${colorClass}`}
                    >
                      <span className="text-white font-extrabold text-xl md:text-2xl relative z-10 leading-tight">
                        {genre.title}
                      </span>
                      <div className="absolute -bottom-2 -left-2 rotate-12 opacity-30 group-hover:opacity-50 transition-all duration-500 scale-110 group-hover:rotate-0">
                        <Hash size={80} className="text-white" />
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-2xl z-20">
                          <Check size={20} className="stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
              >
                {recommendedPlaylists.map((playlist) => {
                  const isLiked = likedPlaylists.has(playlist.unique_id);
                  const p = playlist as any;
                  const imageUrl =
                    p.cover_image ||
                    (Array.isArray(p.covers) && p.covers.length > 0
                      ? p.covers[0]
                      : null);

                  return (
                    <div
                      key={playlist.unique_id}
                      className="group flex flex-col gap-3"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg">
                        <ImageWithPlaceholder
                          src={imageUrl}
                          alt={playlist.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <button
                          onClick={() =>
                            handleLikePlaylist(
                              playlist.unique_id,
                              playlist.title,
                            )
                          }
                          className={`absolute bottom-3 left-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                            isLiked
                              ? "bg-rose-500 text-white"
                              : "bg-black/40 text-white hover:scale-110 hover:bg-black/60"
                          }`}
                        >
                          <Heart
                            size={20}
                            fill={isLiked ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                      <span className="text-white font-bold text-sm truncate">
                        {playlist.title}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 md:px-8 md:py-6 bg-zinc-950/50 flex items-center justify-between border-t border-white/5">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i ? "w-8 bg-emerald-500" : "w-2 bg-zinc-700"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            {canProceed && (
              <button
                onClick={handleCancel}
                className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
              >
                رد کردن
              </button>
            )}

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={handleBack}
                  className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/5 transition-colors"
                >
                  <ArrowRight size={20} />
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={loading || !canProceed}
                className="px-8 h-12 rounded-full bg-emerald-500 text-black font-bold flex items-center gap-2 hover:bg-emerald-400 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    {step === 0 && !canProceed
                      ? `${followedArtists.size}/۳ دنبال شده`
                      : step === 2
                        ? "اتمام"
                        : "مرحله بعد"}
                    <ArrowLeft size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
