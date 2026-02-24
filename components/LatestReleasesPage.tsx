"use client";

import React, { useState, useEffect } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { usePlayer } from "./PlayerContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";

interface ApiSong {
  id: number;
  title: string;
  artist_name: string;
  album_title: string;
  cover_image: string;
  stream_url: string;
  duration_seconds: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const LatestReleasesPage: React.FC = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { setQueue } = usePlayer();
  const { navigateTo } = useNavigation();
  const [songs, setSongs] = useState<ApiSong[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const response = await authenticatedFetch(
          "https://api.sedabox.com/api/home/latest-releases/",
        );
        if (response.ok) {
          const data: PaginatedResponse<ApiSong> = await response.json();
          setSongs(data.results);
          setNextUrl(data.next);
        }
      } catch (error) {
        console.error("Error fetching latest releases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
  }, [accessToken]);

  const loadMore = async () => {
    if (!nextUrl || loading) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        nextUrl.replace("http://", "https://"),
      );
      if (response.ok) {
        const data: PaginatedResponse<ApiSong> = await response.json();
        setSongs((prev) => [...prev, ...data.results]);
        setNextUrl(data.next);
      }
    } catch (error) {
      console.error("Error loading more songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (startIndex: number) => {
    const queue = songs.map((song) => ({
      id: String(song.id),
      title: song.title,
      artist: song.artist_name,
      image: song.cover_image,
      src: song.stream_url.replace("http://", "https://"),
      duration: `${Math.floor(song.duration_seconds / 60)}:${(song.duration_seconds % 60).toString().padStart(2, "0")}`,
    }));
    setQueue(queue, startIndex);
  };

  return (
    <SectionDetailLayout
      title="جدیدترین ریلیز ها"
      subtitle="به روز بمانید"
      onLoadMore={loadMore}
      hasMore={!!nextUrl}
      isLoading={loading}
      backgroundImage={songs[0]?.cover_image}
    >
      <div className="flex flex-col gap-6" style={{ direction: "rtl" }}>
        {songs.map((song, index) => (
          <div
            key={song.id}
            onClick={() => handlePlay(index)}
            className="group relative flex flex-col sm:flex-row items-center bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:bg-zinc-800/60 hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/10"
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

            {/* Album Art */}
            <div className="relative w-full sm:w-48 aspect-square overflow-hidden">
              <ImageWithPlaceholder
                src={song.cover_image}
                alt={song.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                type="song"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <svg
                    className="w-6 h-6 text-black fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-6 sm:p-8 space-y-3 w-full">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3
                    className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors hover:underline decoration-zinc-500"
                    onClick={(e) => {
                      const isDesktop =
                        typeof window !== "undefined" &&
                        window.matchMedia("(min-width: 768px)").matches;
                      if (!isDesktop) return;

                      e.stopPropagation();
                      navigateTo("song-detail", { id: song.id });
                    }}
                  >
                    {song.title}
                  </h3>
                  <p
                    className="text-zinc-400 font-medium text-lg hover:text-white transition-colors hover:underline decoration-zinc-500"
                    onClick={(e) => {
                      const isDesktop =
                        typeof window !== "undefined" &&
                        window.matchMedia("(min-width: 768px)").matches;
                      if (!isDesktop) return;

                      e.stopPropagation();
                      if ((song as any).artist_id) {
                        navigateTo("artist-detail", {
                          id: (song as any).artist_id,
                        });
                      }
                    }}
                  >
                    {song.artist_name}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-300">
                    SedaBox Fresh
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-zinc-500 text-sm">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>
                    {Math.floor(song.duration_seconds / 60)}:
                    {(song.duration_seconds % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                {song.album_title && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    <span className="line-clamp-1">{song.album_title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Accent Line */}
            <div className="absolute bottom-0 right-0 h-1 w-full bg-gradient-to-l from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </SectionDetailLayout>
  );
};

export default LatestReleasesPage;
