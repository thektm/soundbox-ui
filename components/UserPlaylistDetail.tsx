"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  memo,
  useCallback,
  useRef,
} from "react";
import { SongOptionsDrawer } from "./SongOptionsDrawer";
import PlaylistOptionsDrawer from "./PlaylistOptionsDrawer";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { usePlayer, Track } from "./PlayerContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { toast } from "react-hot-toast";
import { getFullShareUrl } from "../utils/share";

// ============== API INTERFACES ==============

interface ApiSong {
  id: number;
  title: string;
  artist_id?: number;
  artist_name: string;
  album_title?: string;
  cover_image: string;
  stream_url: string;
  duration_seconds: number;
  is_liked: boolean;
  genre_names?: string[];
  tag_names?: string[];
  mood_names?: string[];
  sub_genre_names?: string[];
  play_count?: number;
}

interface UserPlaylistResponse {
  id: number;
  title: string;
  public: boolean;
  songs_count: number;
  likes_count: number;
  is_liked: boolean;
  songs: ApiSong[];
  top_three_song_covers: string[];
  created_at: string;
  updated_at: string;
}

// ============== HELPERS ==============

const formatDuration = (seconds: number): string => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const apiSongToTrack = (song: ApiSong): Track => ({
  id: String(song.id),
  title: song.title,
  artist: song.artist_name,
  artistId: song.artist_id,
  image: song.cover_image || "/default-cover.jpg",
  duration: formatDuration(song.duration_seconds),
  durationSeconds: song.duration_seconds,
  src: song.stream_url ? song.stream_url.replace("http://", "https://") : "",
  isLiked: song.is_liked,
});

// ============== SVG ICON COMPONENT ==============

type IconName =
  | "play"
  | "pause"
  | "heart"
  | "shuffle"
  | "more"
  | "arrowLeft"
  | "clock"
  | "music"
  | "shareNetwork"
  | "lock"
  | "globe";

const ICON_PATHS: Record<
  IconName,
  { d: string; fill?: boolean; stroke?: boolean }
> = {
  play: { d: "M8 5.14v14l11-7-11-7z", fill: true },
  pause: { d: "M6 4h4v16H6V4zm8 0h4v16h-4V4z", fill: true },
  heart: {
    d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    stroke: true,
  },
  shuffle: {
    d: "M16 3l5 0 0 5M4 20L21 3M21 16l0 5-5 0M15 15l6 6M4 4l5 5",
    stroke: true,
  },
  more: {
    d: "M12 6m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 18m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
    fill: true,
  },
  arrowLeft: {
    d: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
    stroke: true,
  },
  clock: {
    d: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
    stroke: true,
  },
  music: {
    d: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
    fill: true,
  },
  shareNetwork: {
    d: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z",
    fill: true,
  },
  lock: {
    d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    stroke: true,
  },
  globe: {
    d: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
    stroke: true,
  },
};

const Icon = memo(
  ({
    name,
    size = 24,
    filled,
    className = "",
  }: {
    name: IconName;
    size?: number;
    filled?: boolean;
    className?: string;
  }) => {
    const pathInfo = ICON_PATHS[name];
    if (!pathInfo) return null;
    const { d, fill, stroke } = pathInfo;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
        fill={fill || (name === "heart" && filled) ? "currentColor" : "none"}
        stroke={stroke ? "currentColor" : undefined}
        strokeWidth={stroke ? 2 : undefined}
        strokeLinecap={stroke ? "round" : undefined}
        strokeLinejoin={stroke ? "round" : undefined}
      >
        <path d={d} />
      </svg>
    );
  },
);
Icon.displayName = "Icon";

// ============== EQUALIZER ==============

const Equalizer = () => (
  <div className="flex items-end gap-0.5 h-3.5">
    {[0, 0.2, 0.4, 0.6].map((d, i) => (
      <span
        key={i}
        className="w-[3px] bg-green-500 rounded-sm animate-equalizer"
        style={{ animationDelay: `${d}s` }}
      />
    ))}
  </div>
);

// ============== SONG ROW ==============

const SongRow = memo(
  ({
    song,
    idx,
    current,
    playing,
    onPlay,
    onMore,
  }: {
    song: ApiSong;
    idx: number;
    current: boolean;
    playing: boolean;
    onPlay: () => void;
    onMore: (song: ApiSong) => void;
  }) => {
    const [hover, setHover] = useState(false);

    return (
      <div
        onClick={onPlay}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="flex items-center gap-4 py-2 pl-6 pr-2 sm:px-0 -mx-6 sm:mx-0 rounded-md cursor-pointer transition-all duration-300 hover:bg-white/[0.08] active:bg-white/[0.12] bg-black/5"
      >
        <div className="w-5 text-center text-sm text-neutral-400 tabular-nums">
          {hover ? (
            <Icon name={current && playing ? "pause" : "play"} size={14} />
          ) : current && playing ? (
            <Equalizer />
          ) : (
            <span className={current ? "text-green-500" : ""}>{idx + 1}</span>
          )}
        </div>

        <div className="w-11 h-11 shrink-0 overflow-hidden rounded relative">
          <ImageWithPlaceholder
            src={song.cover_image}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`text-[15px] font-medium truncate ${
              current ? "text-green-500" : "text-white"
            }`}
          >
            {song.title}
          </div>
          <div className="text-[13px] text-white/60 truncate mt-0.5">
            {song.artist_name}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-[13px] text-neutral-400">
            {formatDuration(song.duration_seconds)}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMore(song);
            }}
            className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white"
          >
            <Icon name="more" size={18} />
          </button>
        </div>
      </div>
    );
  },
);
SongRow.displayName = "SongRow";

// ============== USER PLAYLIST DETAIL ==============

interface UserPlaylistDetailProps {
  id: number | string;
}

const UserPlaylistDetail: React.FC<UserPlaylistDetailProps> = ({ id }) => {
  const { goBack, scrollY } = useNavigation();
  const { accessToken, authenticatedFetch } = useAuth();
  const { setQueue, currentTrack, isPlaying } = usePlayer();

  const [playlist, setPlaylist] = useState<UserPlaylistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPlaylistDrawerOpen, setIsPlaylistDrawerOpen] = useState(false);

  const headerOpacity = useMemo(() => Math.min(scrollY / 300, 1), [scrollY]);
  const showHeader = scrollY > 50;

  const fetchPlaylist = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const resp = await authenticatedFetch(
        `https://api.sedabox.com/api/profile/user-playlists/${id}/`,
      );
      if (resp.ok) {
        const data = await resp.json();
        setPlaylist(data);
        setIsLiked(!!data.is_liked);
      } else {
        toast.error("خطا در بارگذاری پلی‌لیست");
      }
    } catch (err) {
      console.error("Fetch user playlist error:", err);
      toast.error("خطای شبکه");
    } finally {
      setLoading(false);
    }
  }, [id, authenticatedFetch]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const handleToggleLike = async () => {
    if (!playlist || !accessToken) {
      toast.error("لطفا ابتدا وارد حساب خود شوید");
      return;
    }
    setIsLiking(true);
    try {
      const resp = await authenticatedFetch(
        `https://api.sedabox.com/api/profile/user-playlists/${playlist.id}/like/`,
        {
          method: "POST",
        },
      );
      if (resp.ok) {
        const data = await resp.json();
        setIsLiked(!!data.liked);
        if (playlist) {
          setPlaylist({
            ...playlist,
            likes_count: data.likes_count ?? playlist.likes_count,
            is_liked: !!data.liked,
          });
        }
        toast.success(data.liked ? "پلی‌لیست لایک شد" : "لایک حذف شد");
      } else {
        toast.error("خطا در انجام عملیات");
      }
    } catch (err) {
      console.error("Like error:", err);
      toast.error("خطای شبکه");
    } finally {
      setIsLiking(false);
    }
  };

  const handleMore = useCallback((song: ApiSong) => {
    setSelectedSong({ ...song, cover_image: song.cover_image });
    setIsDrawerOpen(true);
  }, []);

  const handleShare = async () => {
    if (!playlist) return;
    try {
      const url = getFullShareUrl("user-playlist", playlist.id);
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: playlist.title,
          text: `G گوش دادن به این لیست پخش در سداباکس`,
          url: url,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("لینک کپی شد");
      }
    } catch (err) {
      console.error("User playlist share failed:", err);
    }
  };

  const handleAction = useCallback(async (action: string, song: any) => {
    if (action === "share" && song) {
      try {
        const url = getFullShareUrl("song", song.id);
        const text = `گوش دادن به آهنگ ${song.title} از ${song.artist_name} در سداباکس`;
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: song.title, text, url });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("لینک کپی شد");
        }
      } catch (err) {
        console.error("Song share failed:", err);
      }
    }
  }, []);

  const handlePlaySong = (idx: number) => {
    if (!playlist) return;
    const tracks = playlist.songs.map(apiSongToTrack);
    setQueue(tracks, idx);
  };

  const handlePlayAll = () => {
    if (!playlist || playlist.songs.length === 0) return;
    const tracks = playlist.songs.map(apiSongToTrack);
    setQueue(tracks, 0);
  };

  const totalDuration = useMemo(() => {
    if (!playlist) return "0:00";
    const totalSecs = playlist.songs.reduce(
      (sum, s) => sum + (s.duration_seconds || 0),
      0,
    );
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) return `${hours} ساعت و ${mins} دقیقه`;
    return `${mins} دقیقه`;
  }, [playlist]);

  if (loading)
    return (
      <div
        className="min-h-screen bg-[#0a0a0a] text-white animate-pulse"
        dir="rtl"
      >
        <div className="relative w-full h-96 md:h-[500px] bg-zinc-900 mb-6" />
        <div className="px-6 md:px-12 pb-12">
          <div className="h-10 bg-zinc-800 rounded w-1/3 mb-4" />
          <div className="h-4 bg-zinc-800 rounded w-2/3 mb-12" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-zinc-800 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-1/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  if (!playlist) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <Icon name="music" size={64} className="text-neutral-700 mb-4" />
        <h2 className="text-2xl font-bold mb-2">پلی‌لیست یافت نشد</h2>
        <button
          type="button"
          onClick={goBack}
          className="mt-4 px-6 py-2 bg-green-500 text-black rounded-full font-bold"
        >
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-linear-to-b from-neutral-900 via-neutral-950 to-black text-white pb-24"
      dir="rtl"
    >
      {/* Desktop glass header */}
      <header
        className="hidden md:flex sticky top-0 z-50 h-16 items-center justify-between px-6 bg-zinc-900/80 backdrop-blur-xl"
        style={{ backgroundColor: `rgba(17,17,17,${headerOpacity})` }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-all"
          >
            <Icon name="arrowLeft" className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex-1 text-center">
          <div className="text-sm text-white font-semibold truncate max-w-lg mx-auto">
            {playlist.title}
          </div>
        </div>
        <div className="flex items-center gap-3" />
      </header>

      {/* Mobile condensed header */}
      <header
        className="md:hidden fixed flex-row-reverse top-0 inset-x-0 h-16 bg-black/20 backdrop-blur-xl flex items-center justify-between px-4 z-50 transition-all duration-250"
        style={{
          transform: showHeader ? "translateY(0)" : "translateY(-100%)",
          opacity: showHeader ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-all"
          >
            <Icon name="arrowLeft" className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex-1 text-center">
          <div className="text-sm text-white font-semibold truncate max-w-xs mx-auto">
            {playlist.title}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayAll}
            className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-md"
          >
            <Icon name="play" className="w-4 h-4 text-black ml-0.5" />
          </button>
        </div>
      </header>

      <header
        className="relative w-full h-96 md:h-[500px] bg-cover bg-center bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,1) 100%), url(${
            playlist.top_three_song_covers?.[0] || "/default-cover.jpg"
          })`,
        }}
      >
        <div className="absolute top-4 left-4 z-20">
          <button
            type="button"
            onClick={goBack}
            className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-300 hover:scale-105"
          >
            <Icon name="arrowLeft" className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="absolute inset-0 flex items-end justify-end px-6 md:px-12 pb-8">
          <div className="text-right max-w-lg w-full">
            <div className="flex items-center justify-end gap-2 mb-2">
              <Icon
                name={playlist.public ? "globe" : "lock"}
                size={14}
                className="text-green-400"
              />
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                {playlist.public ? "پلی‌لیست عمومی" : "پلی‌لیست شخصی"}
              </p>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 text-white drop-shadow-xl">
              {playlist.title}
            </h1>
            <div className="flex items-center justify-end gap-3 text-sm text-neutral-300">
              {playlist.likes_count > 0 && (
                <>
                  <span className="text-white font-bold">
                    {playlist.likes_count}
                  </span>
                  <span>لایک</span>
                  <span>•</span>
                </>
              )}
              <span>{playlist.songs.length} آهنگ</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="clock" className="w-4 h-4" />
                {totalDuration}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 bg-neutral-950/95 px-6 md:px-12 py-6 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handlePlayAll}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 hover:scale-110 flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95"
          >
            <Icon name="play" className="w-7 h-7 text-black ml-1" />
          </button>

          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-all duration-200 ${
              isLiked ? "text-green-500" : "text-neutral-400 hover:text-white"
            }`}
          >
            {isLiking ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="heart" className="w-7 h-7" filled={isLiked} />
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-200"
          >
            <Icon name="shareNetwork" className="w-7 h-7" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaylistDrawerOpen(true)}
            className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-200"
          >
            <Icon name="more" className="w-7 h-7" />
          </button>
        </div>
      </div>

      <main className="px-6 md:px-12 mt-6 space-y-2">
        {playlist.songs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500">
            <Icon name="music" size={48} className="mb-4 opacity-20" />
            <p>این پلی‌لیست هنوز خالی است</p>
          </div>
        ) : (
          playlist.songs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              idx={index}
              current={String(song.id) === currentTrack?.id}
              playing={isPlaying}
              onPlay={() => handlePlaySong(index)}
              onMore={handleMore}
            />
          ))
        )}
      </main>

      <SongOptionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        song={selectedSong}
        onAction={handleAction}
      />

      <PlaylistOptionsDrawer
        isOpen={isPlaylistDrawerOpen}
        onClose={() => setIsPlaylistDrawerOpen(false)}
        playlist={playlist}
        onAction={(action) => {
          if (action === "toggle-like") return handleToggleLike();
          if (action === "share") return handleShare();
          return undefined;
        }}
      />

      <style jsx global>{`
        @keyframes equalizer {
          0% {
            height: 4px;
          }
          50% {
            height: 14px;
          }
          100% {
            height: 4px;
          }
        }
        .animate-equalizer {
          animation: equalizer 0.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default UserPlaylistDetail;
