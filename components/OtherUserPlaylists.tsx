"use client";

import React, { useState, useEffect, useCallback } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { slugify } from "../utils/share";
import { toast } from "react-hot-toast";

interface UserPlaylist {
  id: number;
  unique_id?: string;
  title: string;
  songs_count: number;
  likes_count: number;
  is_liked: boolean;
  top_three_song_covers: string[];
  generated_by?: "system" | "admin" | "audience";
  creator_unique_id?: string | null;
}

interface UserProfile {
  id: number;
  unique_id: string;
  first_name: string;
  last_name: string;
  user_playlists:
    | UserPlaylist[]
    | { count?: number; total?: number; next?: any; results?: UserPlaylist[] };
}

interface OtherUserPlaylistsProps {
  uniqueId: string;
  fullName?: string;
}

const OtherUserPlaylists: React.FC<OtherUserPlaylistsProps> = ({
  uniqueId,
  fullName: initialFullName,
}) => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { navigateTo } = useNavigation();
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [fullName, setFullName] = useState(initialFullName || "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uniqueId) return;

    const fetchAllPlaylists = async () => {
      setIsLoading(true);
      try {
        const profileUrl =
          uniqueId === "sedabox"
            ? `https://api.sedabox.com/api/profile/sedabox`
            : `https://api.sedabox.com/api/profile/u/${uniqueId}/`;
        const response = await authenticatedFetch(profileUrl);
        if (response.ok) {
          const data = await response.json();
          const up = data.user_playlists;
          let playlistsArray: UserPlaylist[] = [];
          if (Array.isArray(up)) {
            playlistsArray = up;
          } else if (up && up.results && Array.isArray(up.results)) {
            playlistsArray = up.results;
          }
          setPlaylists(playlistsArray);
          if (!initialFullName) {
            setFullName(
              `${data.first_name} ${data.last_name}`.trim() || data.unique_id,
            );
          }
        } else {
          toast.error("خطا در دریافت پلی‌لیست‌ها");
        }
      } catch (error) {
        console.error("Fetch playlists error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllPlaylists();
  }, [uniqueId, accessToken, authenticatedFetch, initialFullName]);

  const handlePlaylistClick = (playlist: UserPlaylist) => {
    if (uniqueId === "sedabox") {
      const isSystemGenerated =
        playlist.generated_by === "system" || playlist.generated_by === "admin";
      const idToUse = isSystemGenerated
        ? playlist.unique_id || String(playlist.id)
        : String(playlist.id);

      navigateTo("playlist-detail", {
        id: idToUse,
        generatedBy: playlist.generated_by,
        creatorUniqueId: playlist.creator_unique_id,
        slug: slugify(playlist.title),
      });
    } else {
      navigateTo("user-playlist-detail", {
        id: String(playlist.id),
      });
    }
  };

  return (
    <SectionDetailLayout
      title={`پلی‌لیست‌های ${fullName}`}
      subtitle={`${playlists.length} لیست پخش عمومی`}
      isLoading={isLoading}
      onLoadMore={undefined}
      hasMore={false}
      hideScrollbar={false}
    >
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        style={{ direction: "rtl" }}
      >
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            onClick={() => handlePlaylistClick(playlist)}
            className="group cursor-pointer space-y-3"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl">
              <ImageWithPlaceholder
                src={playlist.top_three_song_covers}
                alt={playlist.title}
                className="w-full h-full object-cover"
                type="song"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />

              {/* Play button overlay */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-black ml-0.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                </div>
              </div>

              {/* Songs count badge */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/50 backdrop-blur-md border border-white/10 text-white/90">
                {playlist.songs_count} آهنگ
              </div>
            </div>

            <div className="space-y-1 px-1">
              <h3 className="text-white font-bold text-sm md:text-base truncate group-hover:text-green-500 transition-colors">
                {playlist.title}
              </h3>
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                {typeof playlist.likes_count === "number" && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      style={{ opacity: 0.7 }}
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>{playlist.likes_count.toLocaleString("fa-IR")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionDetailLayout>
  );
};

export default OtherUserPlaylists;
