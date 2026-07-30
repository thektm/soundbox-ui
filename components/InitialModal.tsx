"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./AuthContext";
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
import { useI18n } from "./I18nContext";
import { readFollowingState, readLikedState } from "../lib/apiActionState";

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
  const { language } = useI18n();
  const {
    needsInitialCheck,
    markInitialCheckCompleted,
    authenticatedFetch,
    accessToken,
    isLoggedIn,
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
  const [pendingArtists, setPendingArtists] = useState<Set<number>>(new Set());
  const [pendingPlaylists, setPendingPlaylists] = useState<Set<string>>(
    new Set(),
  );
  const [stepError, setStepError] = useState<string | null>(null);

  const canProceed =
    step === 0
      ? followedArtists.size >= 3
      : step === 1
        ? selectedGenres.length >= 1
        : true;

  const operationError =
    language === "fa"
      ? "عملیات انجام نشد. دوباره تلاش کنید."
      : "The action could not be completed. Please try again.";

  const syncArtistFollowState = (artists: Artist[]) => {
    setFollowedArtists((previous) => {
      const next = new Set(previous);
      artists.forEach((artist) => {
        if (artist.is_following) next.add(artist.id);
        else next.delete(artist.id);
      });
      return next;
    });
  };

  useEffect(() => {
    if (needsInitialCheck && isLoggedIn) {
      if (step === 0 && popularArtists.length === 0) fetchArtists();
      if (step === 1 && genres.length === 0) fetchGenres();
      if (step === 2 && recommendedPlaylists.length === 0) fetchPlaylists();
    }
  }, [needsInitialCheck, step, isLoggedIn]);

  const fetchArtists = async () => {
    setLoading(true);
    setStepError(null);
    try {
      const resp = await authenticatedFetch(
        "https://api.sedabox.com/api/home/popular-artists/",
      );
      if (!resp.ok) throw new Error(`Artists request failed: ${resp.status}`);

      const data = await resp.json();
      const rawResults = Array.isArray(data) ? data : data?.results;
      const results: Artist[] = Array.isArray(rawResults)
        ? rawResults
            .filter((artist: unknown): artist is Record<string, unknown> =>
              Boolean(artist && typeof artist === "object"),
            )
            .map((artist) => ({
              id: Number(artist.id),
              name: String(artist.name ?? ""),
              profile_image: String(artist.profile_image ?? ""),
              is_following: Boolean(artist.is_following),
            }))
            .filter((artist) => Number.isFinite(artist.id) && artist.id > 0)
        : [];

      setPopularArtists(results);
      setNextArtistsUrl(
        !Array.isArray(data) && typeof data?.next === "string"
          ? data.next
          : null,
      );
      syncArtistFollowState(results);
    } catch (err) {
      console.error("Initial artist load failed", err);
      setStepError(
        language === "fa"
          ? "هنرمندان بارگذاری نشدند. دوباره تلاش کنید."
          : "Artists could not be loaded. Please try again.",
      );
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
      if (!resp.ok) throw new Error(`Artists request failed: ${resp.status}`);

      const data = await resp.json();
      const rawResults = Array.isArray(data) ? data : data?.results;
      const results: Artist[] = Array.isArray(rawResults)
        ? rawResults
            .filter((artist: unknown): artist is Record<string, unknown> =>
              Boolean(artist && typeof artist === "object"),
            )
            .map((artist) => ({
              id: Number(artist.id),
              name: String(artist.name ?? ""),
              profile_image: String(artist.profile_image ?? ""),
              is_following: Boolean(artist.is_following),
            }))
            .filter((artist) => Number.isFinite(artist.id) && artist.id > 0)
        : [];

      setPopularArtists((previous) => {
        const byId = new Map(previous.map((artist) => [artist.id, artist]));
        results.forEach((artist) => byId.set(artist.id, artist));
        return Array.from(byId.values());
      });
      setNextArtistsUrl(
        !Array.isArray(data) && typeof data?.next === "string"
          ? data.next
          : null,
      );
      syncArtistFollowState(results);
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
    setStepError(null);
    try {
      const resp = await authenticatedFetch(
        "https://api.sedabox.com/api/genres/",
      );
      if (!resp.ok) throw new Error(`Genres request failed: ${resp.status}`);
      const data = await resp.json();
      const rawGenres = Array.isArray(data) ? data : data?.results;
      setGenres(Array.isArray(rawGenres) ? rawGenres : []);
    } catch (err) {
      console.error("Initial genre load failed", err);
      setStepError(
        language === "fa"
          ? "سبک‌ها بارگذاری نشدند. دوباره تلاش کنید."
          : "Genres could not be loaded. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    setLoading(true);
    setStepError(null);
    try {
      const resp = await authenticatedFetch(
        "https://api.sedabox.com/api/home/playlist-recommendations/",
      );
      if (!resp.ok) throw new Error(`Playlists request failed: ${resp.status}`);
      const data = await resp.json();
      const rawPlaylists = Array.isArray(data) ? data : data?.results;
      const playlists: Playlist[] = Array.isArray(rawPlaylists)
        ? rawPlaylists.filter(
            (playlist: unknown): playlist is Playlist =>
              Boolean(
                playlist &&
                  typeof playlist === "object" &&
                  "unique_id" in playlist,
              ),
          )
        : [];
      setRecommendedPlaylists(playlists);
      setLikedPlaylists(
        new Set(
          playlists
            .filter((playlist) => playlist.is_liked)
            .map((playlist) => playlist.unique_id),
        ),
      );
    } catch (err) {
      console.error("Initial playlist load failed", err);
      setStepError(
        language === "fa"
          ? "پلی‌لیست‌ها بارگذاری نشدند. دوباره تلاش کنید."
          : "Playlists could not be loaded. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (artistId: number, artistName: string) => {
    if (pendingArtists.has(artistId)) return;

    const wasFollowing = followedArtists.has(artistId);
    const shouldFollow = !wasFollowing;

    setPendingArtists((previous) => new Set(previous).add(artistId));
    setFollowedArtists((previous) => {
      const next = new Set(previous);
      if (shouldFollow) next.add(artistId);
      else next.delete(artistId);
      return next;
    });
    setPopularArtists((previous) =>
      previous.map((artist) =>
        artist.id === artistId
          ? { ...artist, is_following: shouldFollow }
          : artist,
      ),
    );

    try {
      const res = await authenticatedFetch(
        "https://api.sedabox.com/api/follow/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artist_id: artistId, follow: shouldFollow }),
        },
      );
      if (!res.ok) throw new Error(`Follow request failed: ${res.status}`);

      const result = (await res.json()) as Record<string, unknown>;
      const isFollowing = readFollowingState(result, shouldFollow);

      setFollowedArtists((previous) => {
        const next = new Set(previous);
        if (isFollowing) next.add(artistId);
        else next.delete(artistId);
        return next;
      });
      setPopularArtists((previous) =>
        previous.map((artist) =>
          artist.id === artistId
            ? { ...artist, is_following: isFollowing }
            : artist,
        ),
      );

      toast.success(
        isFollowing
          ? language === "fa"
            ? `${artistName} دنبال شد`
            : `${artistName} followed`
          : language === "fa"
            ? `دنبال‌کردن ${artistName} لغو شد`
            : `${artistName} unfollowed`,
      );
    } catch (err) {
      console.error("Initial artist follow failed", err);
      setFollowedArtists((previous) => {
        const next = new Set(previous);
        if (wasFollowing) next.add(artistId);
        else next.delete(artistId);
        return next;
      });
      setPopularArtists((previous) =>
        previous.map((artist) =>
          artist.id === artistId
            ? { ...artist, is_following: wasFollowing }
            : artist,
        ),
      );
      toast.error(operationError);
    } finally {
      setPendingArtists((previous) => {
        const next = new Set(previous);
        next.delete(artistId);
        return next;
      });
    }
  };

  const handleLikePlaylist = async (uniqueId: string, title: string) => {
    if (pendingPlaylists.has(uniqueId)) return;

    const wasLiked = likedPlaylists.has(uniqueId);
    const shouldLike = !wasLiked;
    setPendingPlaylists((previous) => new Set(previous).add(uniqueId));
    setLikedPlaylists((previous) => {
      const next = new Set(previous);
      if (shouldLike) next.add(uniqueId);
      else next.delete(uniqueId);
      return next;
    });

    try {
      const res = await authenticatedFetch(
        `https://api.sedabox.com/api/home/playlist-recommendations/${uniqueId}/like/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ liked: shouldLike }),
        },
      );
      if (!res.ok) throw new Error(`Playlist like failed: ${res.status}`);

      const result = (await res.json()) as Record<string, unknown>;
      const isLiked = readLikedState(result, shouldLike);
      const replacementId =
        typeof result.new_unique_id === "string" && result.new_unique_id
          ? result.new_unique_id
          : uniqueId;

      setLikedPlaylists((previous) => {
        const next = new Set(previous);
        next.delete(uniqueId);
        if (isLiked) next.add(replacementId);
        return next;
      });

      if (replacementId !== uniqueId) {
        setRecommendedPlaylists((previous) =>
          previous.map((playlist) =>
            playlist.unique_id === uniqueId
              ? {
                  ...playlist,
                  unique_id: replacementId,
                  is_liked: isLiked,
                }
              : playlist,
          ),
        );
      } else {
        setRecommendedPlaylists((previous) =>
          previous.map((playlist) =>
            playlist.unique_id === uniqueId
              ? { ...playlist, is_liked: isLiked }
              : playlist,
          ),
        );
      }

      toast.success(
        isLiked
          ? language === "fa"
            ? `${title} پسندیده شد`
            : `${title} liked`
          : language === "fa"
            ? `پسند ${title} لغو شد`
            : `${title} unliked`,
      );
    } catch (err) {
      console.error("Initial playlist like failed", err);
      setLikedPlaylists((previous) => {
        const next = new Set(previous);
        if (wasLiked) next.add(uniqueId);
        else next.delete(uniqueId);
        return next;
      });
      toast.error(operationError);
    } finally {
      setPendingPlaylists((previous) => {
        const next = new Set(previous);
        next.delete(uniqueId);
        return next;
      });
    }
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    if (!canProceed || loading) return;
    if (step < 2) {
      setStepError(null);
      setStep(step + 1);
    }
    else handleFinish();
  };

  const handleBack = () => {
    if (step > 0) {
      setStepError(null);
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await markInitialCheckCompleted(selectedGenres);
      toast.success(
        language === "fa" ? "تنظیمات ذخیره شد" : "Preferences saved",
      );
    } catch (error) {
      console.error("Initial preferences save failed", error);
      toast.error(operationError);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await markInitialCheckCompleted([]);
    } catch (error) {
      console.error("Initial preferences skip failed", error);
      toast.error(operationError);
    } finally {
      setLoading(false);
    }
  };

  if (!needsInitialCheck) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-hidden"
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
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="بستن"
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
          {stepError && (
            <div className="mb-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-6 text-center">
              <p className="text-sm font-medium text-rose-100">{stepError}</p>
              <button
                type="button"
                onClick={() => {
                  if (step === 0) void fetchArtists();
                  else if (step === 1) void fetchGenres();
                  else void fetchPlaylists();
                }}
                disabled={loading}
                className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition hover:scale-105 disabled:opacity-50"
              >
                {language === "fa" ? "تلاش مجدد" : "Try again"}
              </button>
            </div>
          )}

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
                    const isPending = pendingArtists.has(artist.id);
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
                          disabled={isPending}
                          aria-busy={isPending}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            isFollowed
                              ? "bg-zinc-800 text-emerald-500 border border-emerald-500/30"
                              : "bg-white text-black hover:scale-105 active:scale-95"
                          } disabled:cursor-wait disabled:opacity-70`}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isFollowed ? (
                            language === "fa" ? "دنبال شده" : "Following"
                          ) : language === "fa" ? (
                            "دنبال کردن"
                          ) : (
                            "Follow"
                          )}
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
                      className={`relative h-28 md:h-32 rounded-xl overflow-hidden p-4 text-start transition-all group shadow-lg ${
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
                  const isPending = pendingPlaylists.has(playlist.unique_id);
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
                          disabled={isPending}
                          aria-busy={isPending}
                          aria-label={
                            isLiked
                              ? language === "fa"
                                ? `لغو پسند ${playlist.title}`
                                : `Unlike ${playlist.title}`
                              : language === "fa"
                                ? `پسندیدن ${playlist.title}`
                                : `Like ${playlist.title}`
                          }
                          className={`absolute bottom-3 left-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                            isLiked
                              ? "bg-rose-500 text-white"
                              : "bg-black/40 text-white hover:scale-110 hover:bg-black/60"
                          } disabled:cursor-wait disabled:opacity-70`}
                        >
                          {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Heart
                              size={20}
                              fill={isLiked ? "currentColor" : "none"}
                            />
                          )}
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
                  <ArrowRight size={20} className="sb-back-icon-right" />
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
                    <ArrowLeft size={20} className="sb-forward-icon-left" />
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
