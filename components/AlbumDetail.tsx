"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { usePlayer, Track } from "./PlayerContext";
import { SongOptionsDrawer } from "./SongOptionsDrawer";
import { getFullShareUrl } from "../utils/share";
import toast from "react-hot-toast";

// API Interfaces based on the provided format
interface ApiSong {
  id: number;
  title: string;
  artist_id: number;
  artist_name: string;
  featured_artists: any[];
  album: number;
  album_title: string;
  is_single: boolean;
  stream_url: string;
  cover_image: string;
  duration_seconds: number;
  duration_display: string;
  plays: number;
  likes_count: number;
  is_liked: boolean;
  status: string;
  release_date: string | null;
  language: string;
  description: string;
  created_at: string;
  display_title: string;
}

interface ApiAlbumResponse {
  id: number;
  title: string;
  artist_id: number;
  artist_name: string;
  artist_unique_id?: string;
  cover_image: string;
  release_date: string | null;
  description: string;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
  genre_ids: number[];
  sub_genre_ids: number[];
  mood_ids: number[];
  songs: ApiSong[];
  song_genre_names: string[];
  song_mood_names: string[];
}

// Reuse the same icons and helpers from the page version
const SvgIcon = ({
  d,
  className,
  fill = "currentColor",
  strokeWidth = 0,
}: {
  d: string;
  className?: string;
  fill?: string;
  strokeWidth?: number;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={fill === "none" ? "none" : fill}
    stroke={fill === "none" ? "currentColor" : "none"}
    strokeWidth={strokeWidth}
  >
    <path d={d} />
  </svg>
);

const ICON_PATHS = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  heart:
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  clock:
    "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  music:
    "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  shuffle:
    "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  arrowLeft: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  shareNetwork:
    "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z",
  dotsThree:
    "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
};

const Icon = ({
  name,
  className,
  fill = true,
}: {
  name: keyof typeof ICON_PATHS;
  className?: string;
  fill?: boolean;
}) => (
  <SvgIcon
    d={ICON_PATHS[name]}
    className={className}
    fill={fill ? "currentColor" : "none"}
    strokeWidth={fill ? 0 : 2}
  />
);

// Album slug lookup removed — AlbumDetail fetches by numeric ID from the API.

interface SongRowProps {
  song: ApiSong;
  index: number;
  isPlaying?: boolean;
  onPlay?: () => void;
  onMore: (song: ApiSong) => void;
}

const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  isPlaying = false,
  onPlay,
  onMore,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(song.is_liked);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
      className={`group grid grid-cols-[16px_4fr_minmax(80px,1fr)] md:grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-1 py-2 rounded-md transition-colors cursor-pointer ${
        isPlaying
          ? "bg-white/10"
          : isHovered
            ? "bg-white/5"
            : "hover:bg-white/5"
      }`}
    >
      <div className="flex items-center justify-center w-4">
        {isHovered ? (
          <button className="text-white">
            {isPlaying ? (
              <Icon name="pause" className="w-3.5 h-3.5" />
            ) : (
              <Icon name="play" className="w-3.5 h-3.5" />
            )}
          </button>
        ) : isPlaying ? (
          <Icon name="music" className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <span className="text-sm text-neutral-400">{index + 1}</span>
        )}
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-neutral-800">
          <Image
            src={song.cover_image || "/default-cover.jpg"}
            alt={song.title}
            fill
            sizes="40px"
            quality={75}
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium truncate ${
              isPlaying ? "text-green-500" : "text-white"
            }`}
          >
            {song.title}
          </p>
          <p className="text-xs text-neutral-400 truncate flex items-center gap-1">
            {song.artist_name}
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center">
        <p className="text-sm text-neutral-400">۱ هفته پیش</p>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
            isLiked ? "opacity-100" : ""
          }`}
        >
          <Icon
            name="heart"
            className={`w-4 h-4 ${
              isLiked ? "text-green-500" : "text-neutral-400 hover:text-white"
            }`}
            fill={isLiked}
          />
        </button>
        <span className="text-sm text-neutral-400">
          {song.duration_display}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMore(song);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-white"
        >
          <Icon name="dotsThree" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const AlbumSkeleton = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white animate-pulse" dir="rtl">
    {/* Hero Skeleton */}
    <div className="relative h-96 md:h-[500px] bg-zinc-900" />

    {/* Actions Skeleton */}
    <div className="flex items-center gap-6 px-6 md:px-12 py-6">
      <div className="w-16 h-16 bg-zinc-800 rounded-full" />
      <div className="w-12 h-12 bg-zinc-800 rounded-full" />
      <div className="w-12 h-12 bg-zinc-800 rounded-full" />
      <div className="w-12 h-12 bg-zinc-800 rounded-full" />
    </div>

    {/* Content Skeleton */}
    <div className="px-6 md:px-12 space-y-4">
      <div className="h-10 border-b border-white/10 flex items-center gap-4 px-4">
        <div className="w-4 h-4 bg-zinc-800 rounded" />
        <div className="w-1/4 h-4 bg-zinc-800 rounded" />
        <div className="w-1/4 h-4 bg-zinc-800 rounded ml-auto" />
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-2">
          <div className="w-4 h-4 bg-zinc-800 rounded" />
          <div className="w-10 h-10 bg-zinc-800 rounded" />
          <div className="flex-1 space-y-2">
            <div className="w-1/3 h-4 bg-zinc-800 rounded" />
            <div className="w-1/4 h-3 bg-zinc-800 rounded" />
          </div>
          <div className="w-12 h-4 bg-zinc-800 rounded" />
        </div>
      ))}
    </div>
  </div>
);

interface AlbumDetailProps {
  id?: string | number;
  slug?: string;
  album?: any;
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({
  id: idProp,
  slug,
  album: albumProp,
}) => {
  const { goBack, currentParams, navigateTo } = useNavigation();
  const { accessToken, authenticatedFetch } = useAuth();
  const { setQueue, currentTrack, isPlaying: isPlayerPlaying } = usePlayer();

  const albumId = idProp || currentParams?.id;

  const [albumData, setAlbumData] = useState<ApiAlbumResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await authenticatedFetch(
          `https://api.sedabox.com/api/albums/${albumId}/`,
        );
        if (response.ok) {
          const data: ApiAlbumResponse = await response.json();
          setAlbumData(data);
          setIsLiked(data.is_liked);
        }
      } catch (error) {
        console.error("Error fetching album:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId, accessToken]);

  const handleMore = useCallback((song: ApiSong) => {
    setSelectedSong(song);
    setIsDrawerOpen(true);
  }, []);

  const handleAction = async (action: string, s: any) => {
    if (action === "share" && s) {
      try {
        const url = getFullShareUrl("song", s.id);
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: s.title,
            text: `گوش دادن به آهنگ ${s.title} از ${s.artist_name || albumData?.artist_name} در سداباکس`,
            url: url,
          });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("لینک کپی شد");
        }
      } catch (err) {
        console.error("Song share failed:", err);
      }
    }
  };

  const handleShare = async () => {
    if (!albumData) return;
    try {
      const url = getFullShareUrl("album", albumData.id);
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: albumData.title,
          text: `G گوش دادن به آلبوم ${albumData.title} از ${albumData.artist_name} در سداباکس`,
          url: url,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("لینک کپی شد");
      }
    } catch (err) {
      console.error("Album share failed:", err);
    }
  };

  const handleLike = async () => {
    if (!albumData) return;

    setLiking(true);
    try {
      const response = await authenticatedFetch(
        `https://api.sedabox.com/api/albums/${albumData.id}/like/`,
        {
          method: "POST",
        },
      );
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        toast.success(data.liked ? "آلبوم لایک شد" : "لایک آلبوم لغو شد");
      } else {
        toast.error("خطا در لایک آلبوم");
      }
    } catch (error) {
      toast.error("خطا در اتصال");
    } finally {
      setLiking(false);
    }
  };

  const handlePlayAll = () => {
    if (!albumData || albumData.songs.length === 0) return;

    const tracks: Track[] = albumData.songs.map((song) => ({
      id: String(song.id),
      title: song.title,
      artist: song.artist_name,
      artistId: song.artist_id,
      image: song.cover_image,
      duration: song.duration_display,
      durationSeconds: song.duration_seconds,
      src: song.stream_url.replace("http://", "https://"),
      isLiked: song.is_liked,
    }));

    setQueue(tracks, 0);
  };

  const handlePlaySong = (index: number) => {
    if (!albumData) return;

    const tracks: Track[] = albumData.songs.map((song) => ({
      id: String(song.id),
      title: song.title,
      artist: song.artist_name,
      artistId: song.artist_id,
      image: song.cover_image,
      duration: song.duration_display,
      durationSeconds: song.duration_seconds,
      src: song.stream_url.replace("http://", "https://"),
      isLiked: song.is_liked,
    }));

    setQueue(tracks, index);
  };

  if (loading) {
    return <AlbumSkeleton />;
  }

  if (!albumData) {
    return (
      <div
        className="min-h-screen bg-linear-to-b from-neutral-900 to-neutral-950 text-white"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <Icon
              name="music"
              className="w-16 h-16 mx-auto text-neutral-600 mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">آلبوم پیدا نشد</h1>
            <p className="text-neutral-400 mb-6">
              متاسفانه آلبوم مورد نظر شما یافت نشد.
            </p>
            <button
              onClick={goBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors"
            >
              <Icon name="arrowLeft" className="w-5 h-5" />
              بازگشت به خانه
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-linear-to-b from-neutral-900 via-neutral-950 to-black text-white pb-24"
      dir="rtl"
    >
      <header
        className="relative w-full h-96 md:h-[500px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%), url(${albumData.cover_image})`,
        }}
      >
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={goBack}
            className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-300 hover:scale-105"
          >
            <Icon name="arrowLeft" className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="absolute inset-0 flex items-end justify-end px-6 md:px-12 pb-8">
          <div className="text-right max-w-lg w-full">
            <p className="text-sm font-semibold text-green-400 mb-2 uppercase tracking-wide">
              آلبوم
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-4 text-white drop-shadow-lg">
              {albumData.title}
            </h1>
            {albumData.description && (
              <p className="text-neutral-200 text-base md:text-lg mb-6 leading-relaxed">
                {albumData.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <button
                onClick={() =>
                  navigateTo("artist-detail", {
                    id: albumData.artist_id,
                    slug: albumData.artist_unique_id || undefined,
                  })
                }
                className="font-medium hover:underline cursor-pointer"
              >
                {albumData.artist_name}
              </button>
              {albumData.release_date && (
                <>
                  <span>•</span>
                  <span>{new Date(albumData.release_date).getFullYear()}</span>
                </>
              )}
              <span>•</span>
              <span>{albumData.songs.length} آهنگ</span>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <div className="px-3 py-1 text-xs font-bold bg-green-500 text-black rounded-full shadow-lg">
            آلبوم
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 bg-linear-to-b from-neutral-950/95 to-neutral-950 px-6 md:px-12 py-6 border-b border-white/10">
        <div className="flex items-center gap-6">
          <button
            onClick={handlePlayAll}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 hover:scale-110 flex items-center justify-center shadow-2xl transition-all duration-300"
          >
            {isPlayerPlaying &&
            albumData.songs.some((s) => String(s.id) === currentTrack?.id) ? (
              <Icon name="pause" className="w-7 h-7 text-black" />
            ) : (
              <Icon name="play" className="w-7 h-7 text-black ml-1" />
            )}
          </button>

          <button className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-green-500 transition-colors duration-200">
            <Icon name="shuffle" className="w-7 h-7" />
          </button>

          <button
            onClick={handleLike}
            disabled={liking}
            className={`w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors duration-200 ${
              isLiked ? "text-green-500" : "text-neutral-400 hover:text-white"
            } ${liking ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {liking ? (
              <div className="w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Icon name="heart" className="w-7 h-7" fill={isLiked} />
            )}
          </button>

          <button
            onClick={handleShare}
            className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-200"
          >
            <Icon name="shareNetwork" className="w-7 h-7" />
          </button>

          <button className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-200">
            <Icon name="dotsThree" className="w-7 h-7" />
          </button>
        </div>
      </div>

      <main className="px-6 md:px-12">
        <div className="grid grid-cols-[16px_4fr_minmax(80px,1fr)] md:grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-3 border-b border-white/10 text-neutral-400 text-sm font-medium">
          <div className="flex items-center justify-center">#</div>
          <div>Title</div>
          <div className="hidden md:block">Date Added</div>
          <div className="flex items-center justify-end">
            <Icon name="clock" className="w-[18px] h-[18px]" />
          </div>
        </div>

        <div className="mt-4 space-y-1">
          {albumData.songs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              isPlaying={
                String(song.id) === currentTrack?.id && isPlayerPlaying
              }
              onPlay={() => handlePlaySong(index)}
              onMore={handleMore}
            />
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-linear-to-t from-black via-black/95 to-transparent pointer-events-none" />

      <SongOptionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        song={selectedSong}
        onAction={handleAction}
      />
    </div>
  );
};

export default AlbumDetail;
