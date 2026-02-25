"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { usePlayer, Track } from "./PlayerContext";
import Image from "next/image";
import { createPortal } from "react-dom";
import { createSlug } from "./mockData";

// Reuse types from ArtistDetail (redefined here for simplicity as they aren't exported)
interface ApiArtist {
  id: number;
  name: string;
  unique_id?: string;
  artistic_name: string;
  user_id: number | null;
  bio: string;
  profile_image: string;
  banner_image: string;
  verified: boolean;
  followers_count: number;
  followings_count: number;
  monthly_listeners_count: number;
  is_following: boolean;
  social_accounts: {
    id: number;
    platform_name: string;
    url: string;
    username: string;
  }[];
}

interface ApiSong {
  id: number;
  title: string;
  artist: number;
  artist_id?: number;
  artist_name: string;
  cover_image: string;
  duration_display: string;
  likes_count: number;
  is_liked: boolean;
  display_title: string;
  stream_url: string;
  plays?: number;
}

interface ApiAlbum {
  id: number;
  title: string;
  artist: number;
  artist_name: string;
  cover_image: string;
  release_date?: string;
}

interface ApiPlaylistSnippet {
  type: "playlist";
  id: number;
  title: string;
  image: string;
  source: string;
}

interface ArtistResponse {
  artist: ApiArtist;
  top_songs: { items: ApiSong[]; total: number };
  albums: { items: ApiAlbum[]; total: number };
  latest_songs: { items: ApiSong[]; total: number };
  similar_artists: ApiArtist[];
  discovered_on?: ApiPlaylistSnippet[];
}

const FALLBACK_SRC = "https://cdn.sedabox.com/music.mp3";

// ============== EMPTY STATE COMPONENT ==============
const NoItemsState = ({
  title,
  subtitle,
  iconType = "music",
}: {
  title: string;
  subtitle: string;
  iconType?: "music" | "album" | "playlist";
}) => {
  const iconPaths = {
    music:
      "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    album:
      "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    playlist: "M12 2v20m-8-6h16M4 12h16M4 6h16",
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
        <svg
          className="w-10 h-10 text-zinc-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={iconPaths[iconType]} />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};

// Map subPage keys to titles
const SUB_PAGE_TITLES: Record<string, string> = {
  "top-songs": "برترین آهنگ‌ها",
  albums: "آلبوم‌ها",
  "latest-songs": "آخرین آهنگ‌ها",
  "discovered-on": "کشف در",
};

// Simplified SongRow for sub-page list
const SongItem = memo(
  ({
    song,
    idx,
    onPlay,
  }: {
    song: ApiSong;
    idx: number;
    onPlay: () => void;
  }) => {
    return (
      <div
        onClick={onPlay}
        className="group flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-all duration-200"
        dir="rtl"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="text-zinc-500 w-8 text-right font-medium group-hover:text-white transition-colors">
            {idx + 1}
          </span>
          <div className="relative w-12 h-12 flex-shrink-0 rounded shadow-lg overflow-hidden">
            <Image
              src={song.cover_image}
              alt={song.title}
              fill
              className="object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <svg
                className="w-6 h-6 text-white fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold truncate group-hover:text-emerald-400 transition-colors">
              {song.title}
            </span>
            <span className="text-zinc-400 text-sm truncate">
              {song.artist_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6 pr-4">
          <span className="text-zinc-500 text-sm hidden sm:block font-medium">
            {song.plays}
          </span>
          <span className="text-zinc-500 text-sm font-medium">
            {song.duration_display}
          </span>
        </div>
      </div>
    );
  },
);
SongItem.displayName = "SongItem";

export default function ArtistSubPage({
  id,
  subPage,
}: {
  id: string | number;
  subPage: string;
}) {
  const { authenticatedFetch } = useAuth();
  const { navigateTo } = useNavigation();
  const { playTrack } = usePlayer();
  const [artistData, setArtistData] = useState<ArtistResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await authenticatedFetch(
          `https://api.sedabox.com/api/artists/${id}/`,
        );
        if (response.ok) {
          const data = await response.json();
          setArtistData(data);
        }
      } catch (err) {
        console.error("Failed to fetch artist details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtist();
  }, [id, authenticatedFetch]);

  const artist = artistData?.artist;
  const title = SUB_PAGE_TITLES[subPage] || "مشاهده همه";

  const handlePlaySong = (song: ApiSong) => {
    const track: Track = {
      id: String(song.id),
      title: song.title,
      artist: song.artist_name,
      artistId: song.artist_id || song.artist,
      image: song.cover_image,
      duration: song.duration_display,
      src: song.stream_url || FALLBACK_SRC,
      isLiked: song.is_liked,
      likesCount: song.likes_count,
    };
    playTrack(track);
  };

  const renderContent = () => {
    if (!artistData) return null;

    switch (subPage) {
      case "top-songs":
        if (!artistData.top_songs.items.length) {
          return (
            <NoItemsState
              title="هنوز آهنگی منتشر نشده است"
              subtitle={`به زودی آهنگ‌های برتر ${artist?.name || ""} در این قسمت نمایش داده خواهد شد.`}
              iconType="music"
            />
          );
        }
        return (
          <div className="space-y-1">
            {artistData.top_songs.items.map((song, idx) => (
              <SongItem
                key={song.id}
                song={song}
                idx={idx}
                onPlay={() => handlePlaySong(song)}
              />
            ))}
          </div>
        );
      case "latest-songs":
        if (!artistData.latest_songs.items.length) {
          return (
            <NoItemsState
              title="آهنگ جدیدی پیدا نشد"
              subtitle="در حال حاضر این هنرمند آهنگ جدیدی برای نمایش ندارد."
              iconType="music"
            />
          );
        }
        return (
          <div className="space-y-1">
            {artistData.latest_songs.items.map((song, idx) => (
              <SongItem
                key={song.id}
                song={song}
                idx={idx}
                onPlay={() => handlePlaySong(song)}
              />
            ))}
          </div>
        );
      case "albums":
        if (!artistData.albums.items.length) {
          return (
            <NoItemsState
              title="آلبومی ثبت نشده است"
              subtitle="این هنرمند در حال حاضر هیچ آلبوم استودیویی یا تک‌آهنگی اختصاصی ندارد."
              iconType="album"
            />
          );
        }
        return (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            dir="rtl"
          >
            {artistData.albums.items.map((album) => (
              <div
                key={album.id}
                className="group p-4 bg-zinc-900/40 hover:bg-zinc-800/60 rounded-xl transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
                onClick={() =>
                  navigateTo("album-detail", {
                    id: album.id,
                    slug: createSlug(album.title),
                  })
                }
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-xl">
                  <Image
                    src={album.cover_image}
                    alt={album.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
                    <button className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 hover:bg-emerald-400 active:scale-95 mx-auto">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <h3 className="text-white font-bold truncate text-base mb-1">
                  {album.title}
                </h3>
                <p className="text-zinc-400 text-sm truncate">
                  {album.artist_name}
                </p>
              </div>
            ))}
          </div>
        );
      case "discovered-on":
        if (!artistData.discovered_on?.length) {
          return (
            <NoItemsState
              title="هنوز در پلی‌لیستی نیست"
              subtitle="این هنرمند در حال حاضر در هیچ پلی‌لیست عمومی کشف و اضافه نشده است."
              iconType="playlist"
            />
          );
        }
        return (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            dir="rtl"
          >
            {artistData.discovered_on?.map((playlist) => (
              <div
                key={playlist.id}
                className="group p-4 bg-zinc-900/40 hover:bg-zinc-800/60 rounded-xl transition-all duration-300 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1"
                onClick={() =>
                  navigateTo("playlist-detail", {
                    id: playlist.id,
                    title: playlist.title,
                  })
                }
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-xl">
                  <Image
                    src={playlist.image}
                    alt={playlist.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="text-white font-bold truncate text-base">
                  {playlist.title}
                </h3>
                <p className="text-zinc-400 text-sm">از صداباکس</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-white">در حال بارگزاری...</div>
    );
  }

  return (
    <SectionDetailLayout
      title={title}
      subtitle={artist?.name}
      backgroundImage={artist?.banner_image || artist?.profile_image}
    >
      <div className=" px-4 sm:px-6">{renderContent()}</div>
    </SectionDetailLayout>
  );
}
