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
  generated_by?: "system" | "admin" | "audience";
  creator_unique_id?: string | null;
  order?: any[];
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
  | "globe"
  | "arrowUp"
  | "arrowDown"
  | "order"
  | "check"
  | "close";

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
  arrowUp: {
    d: "M12 4l-8 8h16l-8-8z",
    fill: true,
  },
  arrowDown: {
    d: "M12 20l8-8H4l8 8z",
    fill: true,
  },
  order: {
    d: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
    fill: true,
  },
  check: {
    d: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
    fill: true,
  },
  close: {
    d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z",
    fill: true,
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
    onTitleClick,
    onArtistClick,
    isEditingOrder,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
  }: {
    song: ApiSong;
    idx: number;
    current: boolean;
    playing: boolean;
    onPlay: () => void;
    onMore: (song: ApiSong) => void;
    onTitleClick?: () => void;
    onArtistClick?: () => void;
    isEditingOrder?: boolean;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
  }) => {
    const [hover, setHover] = useState(false);

    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(min-width: 768px)").matches;

    return (
      <div
        onClick={isEditingOrder ? undefined : onPlay}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`flex items-center gap-4 py-2 pl-6 pr-2 sm:px-0 -mx-6 sm:mx-0 rounded-md transition-all duration-300 ${
          isEditingOrder
            ? "cursor-default"
            : "cursor-pointer hover:bg-white/[0.08] active:bg-white/[0.12]"
        } bg-black/5`}
      >
        <div className="w-5 text-center text-sm text-neutral-400 tabular-nums">
          {hover && !isEditingOrder ? (
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
          {isDesktop && (onTitleClick || onArtistClick) ? (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onTitleClick && onTitleClick();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onTitleClick && onTitleClick();
                  }
                }}
                role={onTitleClick ? "link" : undefined}
                tabIndex={onTitleClick ? 0 : undefined}
                className={`text-[15px] font-medium truncate ${
                  current ? "text-green-500" : "text-white"
                } ${onTitleClick ? "cursor-pointer hover:underline" : ""}`}
              >
                {song.title}
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onArtistClick && onArtistClick();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onArtistClick && onArtistClick();
                  }
                }}
                role={onArtistClick ? "link" : undefined}
                tabIndex={onArtistClick ? 0 : undefined}
                className="text-[13px] text-white/60 truncate mt-0.5 cursor-pointer hover:underline"
              >
                {song.artist_name}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isEditingOrder ? (
            <div className="flex items-center gap-1.5 px-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp?.();
                }}
                disabled={isFirst}
                className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all ${
                  isFirst
                    ? "opacity-10 cursor-not-allowed"
                    : "text-white/60 hover:text-green-500 hover:scale-110"
                }`}
                title="حرکت به بالا"
              >
                <Icon name="arrowUp" size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown?.();
                }}
                disabled={isLast}
                className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all ${
                  isLast
                    ? "opacity-10 cursor-not-allowed"
                    : "text-white/60 hover:text-green-500 hover:scale-110"
                }`}
                title="حرکت به پایین"
              >
                <Icon name="arrowDown" size={20} />
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    );
  },
);
SongRow.displayName = "SongRow";

// ============== USER PLAYLIST DETAIL ==============

interface UserPlaylistDetailProps {
  id: number | string;
  isOwner?: boolean;
}

const UserPlaylistDetail: React.FC<UserPlaylistDetailProps> = ({
  id,
  isOwner,
}) => {
  const { goBack, scrollY, navigateTo } = useNavigation();
  const { accessToken, authenticatedFetch } = useAuth();
  const { setQueue, currentTrack, isPlaying } = usePlayer();

  const [playlist, setPlaylist] = useState<UserPlaylistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Reordering states
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [displaySongs, setDisplaySongs] = useState<ApiSong[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

        // Handle custom sorting based on 'order' JSON field
        let sortedSongs = [...data.songs];
        let orderData = data.order;

        if (typeof orderData === "string") {
          try {
            orderData = JSON.parse(orderData);
          } catch (e) {
            orderData = undefined;
          }
        }

        if (orderData && Array.isArray(orderData) && orderData.length > 0) {
          const orderList = orderData;
          // Helper to get ID from ordered item (item might be {id: number} or just number)
          const getId = (item: any) =>
            typeof item === "object" && item !== null ? item.id : item;

          const orderIds = orderList.map(getId);

          sortedSongs.sort((a, b) => {
            const indexA = orderIds.findIndex(
              (id) => String(id) === String(a.id),
            );
            const indexB = orderIds.findIndex(
              (id) => String(id) === String(b.id),
            );
            // If ID not in order, put it at the end
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
        }

        setPlaylist({ ...data, songs: sortedSongs, order: orderData });
        setDisplaySongs(sortedSongs);
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

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setDisplaySongs((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setDisplaySongs((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next;
    });
  }, []);

  const handleSaveOrder = useCallback(async () => {
    if (!playlist) return;
    setIsSaving(true);
    try {
      // Create new order as array of objects [{id: 123, cover: 'url'}, ...]
      const newOrder = displaySongs.map((s) => ({
        id: s.id,
        cover: s.cover_image,
      }));

      const resp = await authenticatedFetch(
        `https://api.sedabox.com/api/profile/user-playlists/${id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: playlist.title,
            public: playlist.public,
            order: newOrder,
          }),
        },
      );

      if (resp.ok) {
        setPlaylist({ ...playlist, songs: [...displaySongs], order: newOrder });
        setIsEditingOrder(false);
        toast.success("ترتیب آهنگ‌ها ذخیره شد");
      } else {
        toast.error("خطا در ذخیره‌سازی ترتیب");
      }
    } catch (err) {
      console.error("Save order error:", err);
      toast.error("خطای شبکه");
    } finally {
      setIsSaving(false);
    }
  }, [id, displaySongs, playlist, authenticatedFetch]);

  const handleCancelOrder = useCallback(() => {
    if (playlist) {
      setDisplaySongs([...playlist.songs]);
      setIsEditingOrder(false);
    }
  }, [playlist]);

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
    if (displaySongs.length === 0) return;
    const tracks = displaySongs.map(apiSongToTrack);
    setQueue(tracks, idx);
  };

  const handlePlayAll = () => {
    if (displaySongs.length === 0) return;
    const tracks = displaySongs.map(apiSongToTrack);
    setQueue(tracks, 0);
  };

  const totalDuration = useMemo(() => {
    if (displaySongs.length === 0) return "0:00";
    const totalSecs = displaySongs.reduce(
      (sum, s) => sum + (s.duration_seconds || 0),
      0,
    );
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) return `${hours} ساعت و ${mins} دقیقه`;
    return `${mins} دقیقه`;
  }, [displaySongs]);

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
            displaySongs?.[0]?.cover_image ||
            playlist.top_three_song_covers?.[0] ||
            "/default-cover.jpg"
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

        <div className="absolute inset-y-0 right-0 flex items-end pr-6 md:pr-12 pl-6 pb-8">
          <div className="text-right max-w-lg">
            <div className="flex items-center justify-end gap-2 mb-2 flex-row-reverse">
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
              <span>{displaySongs.length} آهنگ</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon name="clock" className="w-4 h-4" />
                {totalDuration}
              </span>
            </div>
            {(playlist.generated_by === "system" ||
              playlist.generated_by === "admin") && (
              <button
                type="button"
                onClick={() => navigateTo("user-detail", { id: "sedabox" })}
                className="mt-3 text-sm text-green-400 transition-colors text-right flex items-center gap-2"
              >
                ایجاد شده توسط صداباکس
              </button>
            )}
            {playlist.generated_by === "audience" &&
              playlist.creator_unique_id && (
                <button
                  type="button"
                  onClick={() =>
                    navigateTo("user-detail", {
                      id: playlist.creator_unique_id!,
                    })
                  }
                  className="mt-3 text-sm text-blue-400 hover:underline transition-colors text-right"
                >
                  ایجاد شده توسط {playlist.creator_unique_id}
                </button>
              )}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 bg-neutral-950/95 px-6 md:px-12 py-6 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {isEditingOrder ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-black rounded-full font-bold hover:bg-green-400 hover:scale-105 transition-all shadow-lg shadow-green-500/20 active:scale-95 disabled:bg-neutral-600 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin text-black" />
                ) : (
                  <Icon name="check" size={20} />
                )}
                <span>ذخیره تغییرات</span>
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                className="flex items-center gap-2 px-6 py-3 bg-neutral-800 text-white rounded-full font-bold hover:bg-neutral-700 hover:scale-105 transition-all active:scale-95"
              >
                <Icon name="close" size={20} />
                <span>لغو</span>
              </button>
            </div>
          ) : (
            <>
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
                  isLiked
                    ? "text-green-500"
                    : "text-neutral-400 hover:text-white"
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

              {isOwner && displaySongs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsEditingOrder(true)}
                  className="mr-auto text-sm bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all"
                >
                  <Icon name="order" size={18} />
                  <span>تغییر ترتیب</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <main className="px-6 md:px-12 mt-6 space-y-2">
        {displaySongs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500">
            <Icon name="music" size={48} className="mb-4 opacity-20" />
            <p>این پلی‌لیست هنوز خالی است</p>
          </div>
        ) : (
          displaySongs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              idx={index}
              current={String(song.id) === currentTrack?.id}
              playing={isPlaying}
              onPlay={() => handlePlaySong(index)}
              onMore={handleMore}
              onTitleClick={() =>
                navigateTo("song-detail", { id: song.id, title: song.title })
              }
              onArtistClick={() =>
                song.artist_id &&
                navigateTo("artist-detail", { id: song.artist_id })
              }
              isEditingOrder={isEditingOrder}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === displaySongs.length - 1}
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
