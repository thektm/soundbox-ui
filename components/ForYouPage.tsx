"use client";

import React, { useState, useEffect } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { usePlayerActions } from "./PlayerContext";
import { useNavigation } from "./NavigationContext";
import { createSlug } from "../lib/slug";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { getSongDisplayTitle, getPlayerFeaturedArtists, normalizeSongCollection } from "../lib/songDisplay";

interface ApiSong {
  id: number;
  title: string;
  display_title?: string;
  featured_artists?: unknown[];
  artist_id?: number;
  artist_name: string;
  cover_image: string;
  stream_url: string;
  duration_seconds: number;
}

interface SongsRecommendationsContainer {
  type: string;
  message: string;
  count?: number;
  next?: string | null;
  songs: ApiSong[];
}

interface SummaryResponse {
  songs_recommendations: SongsRecommendationsContainer;
}

const ForYouPage: React.FC = () => {
  const { isLoggedIn, authenticatedFetch } = useAuth();
  const isGuest = !isLoggedIn;
  const { setQueue } = usePlayerActions();
  const { navigateTo } = useNavigation();
  const [songs, setSongs] = useState<ApiSong[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subtitle, setSubtitle] = useState(
    isGuest
      ? "پرشنونده‌ترین‌های ۲۴ ساعت گذشته؛ با تکمیل از محبوب‌ترین‌ها"
      : "بر اساس شنیده‌ها و انتخاب‌های اخیر شما",
  );

  useEffect(() => {
    setSubtitle(
      isGuest
        ? "پرشنونده‌ترین‌های ۲۴ ساعت گذشته؛ با تکمیل از محبوب‌ترین‌ها"
        : "بر اساس شنیده‌ها و انتخاب‌های اخیر شما",
    );

    const fetchRecommendations = async () => {
      try {
        const response = await authenticatedFetch(
          "https://api.sedabox.com/api/home/summary/",
        );
        if (response.ok) {
          const data: SummaryResponse = await response.json();
          if (data.songs_recommendations) {
            setSongs(normalizeSongCollection<ApiSong>(data.songs_recommendations.songs));
            setNextUrl(data.songs_recommendations.next || null);
            if (data.songs_recommendations.type === "daily_trending") {
              setSubtitle(
                data.songs_recommendations.message ||
                  "پرشنونده‌ترین‌های ۲۴ ساعت گذشته؛ با تکمیل از محبوب‌ترین‌ها",
              );
            } else if (data.songs_recommendations.type !== "personalized") {
              setSubtitle("پیشنهادهایی برای شروع یک کشف تازه");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching for-you recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [authenticatedFetch, isGuest]);

  const loadMore = async () => {
    if (!nextUrl || loading) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        nextUrl.replace("http://", "https://"),
      );
      if (response.ok) {
        const data = await response.json();
        const section = data.songs_recommendations || data;
        const newSongs = section.songs || section.results || [];
        setSongs((prev) => {
          const seen = new Set(prev.map((song) => song.id));
          return [...prev, ...normalizeSongCollection<ApiSong>(newSongs).filter((song) => !seen.has(song.id))];
        });
        setNextUrl(section.next || null);
      }
    } catch (error) {
      console.error("Error loading more recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (startIndex: number) => {
    const queue = songs.map((song) => ({
      id: String(song.id),
      title: getSongDisplayTitle(song),
      artist: song.artist_name,
      featuredArtists: getPlayerFeaturedArtists(song),
      image: song.cover_image,
      src: song.stream_url
        ? song.stream_url.replace("http://", "https://")
        : "",
      duration: `${Math.floor(song.duration_seconds / 60)}:${(song.duration_seconds % 60).toString().padStart(2, "0")}`,
    }));
    setQueue(queue, startIndex);
  };

  return (
    <SectionDetailLayout
      title={isGuest ? "منتخب‌های امروز" : "برای شما"}
      subtitle={subtitle}
      onLoadMore={loadMore}
      hasMore={!!nextUrl}
      isLoading={loading}
      backgroundImage={songs[0]?.cover_image}
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {songs.map((song, index) => (
          <div
            key={song.id}
            onClick={() => handlePlay(index)}
            className="group flex gap-4 p-3 items-center bg-zinc-900/30 rounded-2xl hover:bg-zinc-800/50 transition-all border border-white/5 cursor-pointer"
          >
            <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-xl shadow-lg">
              <ImageWithPlaceholder
                src={song.cover_image}
                alt={getSongDisplayTitle(song)}
                className="w-full h-full object-cover"
                type="song"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h3
                className="font-black text-white text-lg truncate group-hover:text-emerald-400 transition-colors hover:underline decoration-zinc-500"
                onClick={(e) => {
                  const isDesktop =
                    typeof window !== "undefined" &&
                    window.matchMedia("(min-width: 768px)").matches;
                  if (!isDesktop) return;

                  e.stopPropagation();
                  navigateTo("song-detail", {
                    id: song.id,
                    title: createSlug(getSongDisplayTitle(song)),
                  });
                }}
              >
                {getSongDisplayTitle(song)}
              </h3>
              <p
                className="text-zinc-500 font-medium truncate hover:text-white transition-all hover:underline decoration-zinc-500"
                onClick={(e) => {
                  const isDesktop =
                    typeof window !== "undefined" &&
                    window.matchMedia("(min-width: 768px)").matches;
                  if (!isDesktop || !song.artist_id) return;

                  e.stopPropagation();
                  navigateTo("artist-detail", { id: song.artist_id });
                }}
              >
                {song.artist_name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionDetailLayout>
  );
};

export default ForYouPage;
