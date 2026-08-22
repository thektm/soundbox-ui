"use client";

import React, { useState, useEffect } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { usePlayerActions } from "./PlayerContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useI18n } from "./I18nContext";
import { getPlayerFeaturedArtists, getSongDisplayTitle, normalizeSongCollection } from "../lib/songDisplay";
import SongTitleWithFeaturedArtists from "./SongTitleWithFeaturedArtists";
import { SongOptionsDrawer } from "./SongOptionsDrawer";
import { getCanonicalSlug } from "../lib/slug";

interface ChartPageProps {
  title?: string;
  type: "songs" | "albums" | "artists";
  chartType?:
    | "daily-songs"
    | "daily-albums"
    | "daily-artists"
    | "weekly-songs"
    | "weekly-albums"
    | "weekly-artists";
  initialData?: any;
}

const ChartPage: React.FC<ChartPageProps> = ({
  title: initialTitle,
  type,
  chartType,
  initialData,
}) => {
  const { locale } = useI18n();
  const { authenticatedFetch } = useAuth();
  const { navigateTo } = useNavigation();
  const { setQueue } = usePlayerActions();
  const [items, setItems] = useState<any[]>(
    type === "songs"
      ? normalizeSongCollection(initialData?.results)
      : initialData?.results || [],
  );
  const [nextUrl, setNextUrl] = useState<string | null>(
    initialData?.next || null,
  );
  const [loading, setLoading] = useState(!initialData);
  const [title, setTitle] = useState(initialTitle || "");
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isSongOptionsOpen, setIsSongOptionsOpen] = useState(false);

  const endpointMap: Record<string, string> = {
    "daily-songs": "daily-top-songs-global",
    "daily-albums": "daily-top-albums-global",
    "daily-artists": "daily-top-artists-global",
    "weekly-songs": "weekly-top-songs-global",
    "weekly-albums": "weekly-top-albums-global",
    "weekly-artists": "weekly-top-artists-global",
  };

  const titleMap: Record<string, string> = {
    "daily-songs": "برترین آهنگ‌های روز",
    "daily-albums": "برترین آلبوم‌های روز",
    "daily-artists": "برترین هنرمندان روز",
    "weekly-songs": "برترین آهنگ‌های هفته",
    "weekly-albums": "برترین آلبوم‌های هفته",
    "weekly-artists": "برترین هنرمندان هفته",
  };

  useEffect(() => {
    if (chartType && !title) {
      setTitle(titleMap[chartType] || "");
    }
  }, [chartType, title]);

  useEffect(() => {
    if (items.length > 0) return;

    const endpoint = chartType ? endpointMap[chartType] : null;
    if (!endpoint) {
      // Fallback for when chartType is not provided (legacy or direct navigation)
      const getEndpointFromTitle = () => {
        if (!title) return "";
        if (title.includes("آهنگ") && title.includes("روز"))
          return "daily-top-songs-global";
        if (title.includes("آلبوم") && title.includes("روز"))
          return "daily-top-albums-global";
        if (title.includes("هنرمند") && title.includes("روز"))
          return "daily-top-artists-global";
        if (title.includes("آهنگ") && title.includes("هفته"))
          return "weekly-top-songs-global";
        if (title.includes("آلبوم") && title.includes("هفته"))
          return "weekly-top-albums-global";
        if (title.includes("هنرمند") && title.includes("هفته"))
          return "weekly-top-artists-global";
        return "";
      };
      const fallbackEndpoint = getEndpointFromTitle();
      if (!fallbackEndpoint) return;
      fetchChart(fallbackEndpoint);
    } else {
      fetchChart(endpoint);
    }
  }, [authenticatedFetch, title, chartType, items.length]);

  const fetchChart = async (endpoint: string) => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `https://api.sedabox.com/api/home/${endpoint}/`,
      );
      if (response.ok) {
        const data = await response.json();
        setItems(type === "songs" ? normalizeSongCollection(data.results) : data.results);
        setNextUrl(data.next);
      }
    } catch (error) {
      console.error("Error fetching chart:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextUrl || loading) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        nextUrl.replace("http://", "https://"),
      );
      if (response.ok) {
        const data = await response.json();
        setItems((prev) => [
          ...prev,
          ...(type === "songs" ? normalizeSongCollection(data.results) : data.results),
        ]);
        setNextUrl(data.next);
      }
    } catch (error) {
      console.error("Error loading more from chart:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (startIndex: number) => {
    if (type !== "songs") return;
    const queue = items.map((song) => ({
      id: String(song.id),
      title: getSongDisplayTitle(song),
      artist: song.artist_name,
      featuredArtists: getPlayerFeaturedArtists(song),
      image: song.cover_image,
      src: (song.stream_url || "").replace("http://", "https://"),
      duration: song.duration_seconds
        ? `${Math.floor(song.duration_seconds / 60)}:${(song.duration_seconds % 60).toString().padStart(2, "0")}`
        : "0:00",
    }));
    setQueue(queue, startIndex);
  };



  return (
    <SectionDetailLayout
      title={title}
      subtitle="جدول رده‌بندی جهانی"
      onLoadMore={loadMore}
      hasMore={!!nextUrl}
      isLoading={loading}
      backgroundImage={items[0]?.cover_image || items[0]?.profile_image}
    >
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={() => {
              if (type === "songs") handlePlay(index);
              if (type === "albums")
                navigateTo("album-detail", {
                  id: item.id,
                  urlSlug: getCanonicalSlug(item, item.title),
                });
              if (type === "artists")
                navigateTo("artist-detail", {
                  id: item.id,
                  urlSlug: getCanonicalSlug(item, item.name || item.title),
                });
            }}
            className="group relative flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5 shadow-lg shadow-black/20"
          >
            {type === "songs" && (
              <button
                type="button"
                aria-label="song options"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSong(item);
                  setIsSongOptionsOpen(true);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-300 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-400/40 transition-all flex items-center justify-center backdrop-blur-sm"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="5" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
            )}

            {/* Rank */}
            <div className="w-10 text-center flex flex-col items-center">
              <span
                className={`text-2xl font-black ${index < 3 ? "text-emerald-500" : "text-zinc-600"}`}
              >
                {index + 1}
              </span>
              {index < 3 && (
                <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1" />
              )}
            </div>

            {/* Image */}
            <div
              className={`relative ${type === "artists" ? "w-16 h-16 rounded-full" : "w-16 h-16 rounded-xl"} overflow-hidden shadow-2xl`}
            >
              <ImageWithPlaceholder
                src={item.cover_image || item.profile_image}
                alt={type === "songs" ? getSongDisplayTitle(item) : item.title || item.name}
                className="w-full h-full object-cover"
                type={type === "artists" ? "artist" : "song"}
              />
              {type === "songs" && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pr-2">
              <h3
                className="w-fit max-w-full text-white font-black text-lg group-hover:text-emerald-400 transition-colors truncate hover:underline decoration-zinc-500"
                onClick={(e) => {
                  const isDesktop =
                    typeof window !== "undefined" &&
                    window.matchMedia("(min-width: 768px)").matches;
                  if (!isDesktop) return;

                  e.stopPropagation();
                  if (type === "songs") {
                    navigateTo("song-detail", { id: item.id });
                  } else if (type === "albums") {
                    navigateTo("album-detail", {
                      id: item.id,
                      urlSlug: getCanonicalSlug(item, item.title),
                    });
                  } else if (type === "artists") {
                    navigateTo("artist-detail", {
                      id: item.id,
                      urlSlug: getCanonicalSlug(item, item.name || item.title),
                    });
                  }
                }}
              >
                {type === "songs" ? (
                  <SongTitleWithFeaturedArtists song={item} />
                ) : (
                  item.title || item.name || item.artistic_name
                )}
              </h3>
              <p
                className="w-fit max-w-full text-zinc-500 font-medium truncate hover:text-white transition-all hover:underline decoration-zinc-500"
                onClick={(e) => {
                  const isDesktop =
                    typeof window !== "undefined" &&
                    window.matchMedia("(min-width: 768px)").matches;
                  if (!isDesktop) return;

                  e.stopPropagation();
                  if (item.artist_id) {
                    navigateTo("artist-detail", { id: item.artist_id });
                  }
                }}
              >
                {item.artist_name || (type === "artists" ? "هنرمند" : "")}
              </p>
            </div>

            {/* Play/Stats info */}
            <div className="text-zinc-500 text-sm font-mono hidden sm:block">
              {item.duration_seconds && (
                <span>
                  {Math.floor(item.duration_seconds / 60)}:
                  {(item.duration_seconds % 60).toString().padStart(2, "0")}
                </span>
              )}
              {item.followers_count && (
                <span>
                  {Number(item.followers_count).toLocaleString(locale)} فالوور
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <SongOptionsDrawer
        isOpen={isSongOptionsOpen}
        onClose={() => {
          setIsSongOptionsOpen(false);
          setSelectedSong(null);
        }}
        song={selectedSong}
      />
    </SectionDetailLayout>
  );
};

export default ChartPage;
