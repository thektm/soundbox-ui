"use client";

import React, { useState, useEffect } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { usePlayer } from "./PlayerContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";

interface ApiSong {
  id: number;
  title: string;
  artist_name: string;
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

const NewDiscoveriesPage: React.FC = () => {
  const { accessToken } = useAuth();
  const { setQueue } = usePlayer();
  const [songs, setSongs] = useState<ApiSong[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscoveries = async () => {
      try {
        const response = await fetch(
          "https://api.sedabox.com/api/home/discoveries/",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (response.ok) {
          const data: PaginatedResponse<ApiSong> = await response.json();
          setSongs(data.results);
          setNextUrl(data.next);
        }
      } catch (error) {
        console.error("Error fetching discoveries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscoveries();
  }, [accessToken]);

  const loadMore = async () => {
    if (!nextUrl || loading) return;
    setLoading(true);
    try {
      const response = await fetch(nextUrl.replace("http://", "https://"), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data: PaginatedResponse<ApiSong> = await response.json();
        setSongs((prev) => [...prev, ...data.results]);
        setNextUrl(data.next);
      }
    } catch (error) {
      console.error("Error loading more discoveries:", error);
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
      title="اکتشافات جدید"
      subtitle="سلیقه جدید خود را پیدا کنید"
      onLoadMore={loadMore}
      hasMore={!!nextUrl}
      isLoading={loading}
      backgroundImage={songs[0]?.cover_image}
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        style={{ direction: "rtl" }}
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
                alt={song.title}
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
              <h3 className="font-black text-white text-lg truncate group-hover:text-emerald-400 transition-colors">
                {song.title}
              </h3>
              <p className="text-zinc-500 font-medium truncate">
                {song.artist_name}
              </p>
              <div className="mt-2 text-[10px] text-emerald-500 font-bold tracking-tighter uppercase px-2 py-0.5 bg-emerald-500/10 w-fit rounded">
                DISCOVERY
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionDetailLayout>
  );
};

export default NewDiscoveriesPage;
