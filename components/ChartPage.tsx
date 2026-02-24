"use client";

import React, { useState, useEffect } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { usePlayer } from "./PlayerContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";

interface ChartPageProps {
  title: string;
  type: "songs" | "albums" | "artists";
  initialData?: any;
}

const ChartPage: React.FC<ChartPageProps> = ({ title, type, initialData }) => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { navigateTo } = useNavigation();
  const { setQueue } = usePlayer();
  const [items, setItems] = useState<any[]>(initialData?.results || []);
  const [nextUrl, setNextUrl] = useState<string | null>(
    initialData?.next || null,
  );
  const [loading, setLoading] = useState(!initialData);

  const endpointMap = {
    "daily-top-songs-global": "daily-top-songs-global",
    "daily-top-albums-global": "daily-top-albums-global",
    "daily-top-artists-global": "daily-top-artists-global",
    "weekly-top-songs-global": "weekly-top-songs-global",
    "weekly-top-albums-global": "weekly-top-albums-global",
    "weekly-top-artists-global": "weekly-top-artists-global",
  };

  useEffect(() => {
    if (items.length > 0) return;

    // We need to infer the endpoint from the title or pass it explicitly.
    // Let's assume the calling navigateTo passes a 'slug' or 'endpoint' in params.
    // For now I'll use a hacky search in title to find the endpoint context.
    const getEndpoint = () => {
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

    const endpoint = getEndpoint();
    if (!endpoint) return;

    const fetchChart = async () => {
      try {
        const response = await authenticatedFetch(
          `https://api.sedabox.com/api/home/${endpoint}/`,
        );
        if (response.ok) {
          const data = await response.json();
          setItems(data.results);
          setNextUrl(data.next);
        }
      } catch (error) {
        console.error("Error fetching chart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChart();
  }, [accessToken, title, items.length]);

  const loadMore = async () => {
    if (!nextUrl || loading) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        nextUrl.replace("http://", "https://"),
      );
      if (response.ok) {
        const data = await response.json();
        setItems((prev) => [...prev, ...data.results]);
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
      title: song.title,
      artist: song.artist_name,
      image: song.cover_image,
      src: (song.stream_url || "").replace("http://", "https://"),
      duration: song.duration_seconds
        ? `${Math.floor(song.duration_seconds / 60)}:${(song.duration_seconds % 60).toString().padStart(2, "0")}`
        : "0:00",
    }));
    setQueue(queue, startIndex);
  };

  const createSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
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
      <div className="space-y-2" style={{ direction: "rtl" }}>
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={() => {
              if (type === "songs") handlePlay(index);
              if (type === "albums")
                navigateTo("album-detail", {
                  id: item.id,
                  slug: createSlug(item.title),
                });
              if (type === "artists")
                navigateTo("artist-detail", {
                  id: item.id,
                  slug: item.unique_id || createSlug(item.name || item.title),
                });
            }}
            className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5 shadow-lg shadow-black/20"
          >
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
                alt={item.title || item.name}
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
                className="text-white font-black text-lg group-hover:text-emerald-400 transition-colors truncate hover:underline decoration-zinc-500"
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
                      slug: createSlug(item.title),
                    });
                  } else if (type === "artists") {
                    navigateTo("artist-detail", {
                      id: item.id,
                      slug:
                        item.unique_id || createSlug(item.name || item.title),
                    });
                  }
                }}
              >
                {item.title || item.name || item.artistic_name}
              </h3>
              <p
                className="text-zinc-500 font-medium truncate hover:text-white transition-all hover:underline decoration-zinc-500"
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
                  {Number(item.followers_count).toLocaleString()} فالوور
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionDetailLayout>
  );
};

export default ChartPage;
