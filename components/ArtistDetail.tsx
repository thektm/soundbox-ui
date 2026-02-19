"use client";

import { usePlayer, Track } from "./PlayerContext";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { MOCK_ARTISTS, MOCK_SONGS, Song, createSlug } from "./mockData";
import { useNavigation } from "./NavigationContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { SongOptionsDrawer } from "./SongOptionsDrawer";
import { ArtistOptionsDrawer } from "./ArtistOptionsDrawer";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { getFullShareUrl } from "../utils/share";

const FALLBACK_SRC = "https://cdn.sedabox.com/music.mp3";

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

const BILLIE_BIO_FA = `بیلی آیلیش پایرت بیرد اوکانل (زادهٔ ۱۸ دسامبر ۲۰۰۱) خواننده و ترانه‌نویس آمریکایی است. او اولین بار در سال ۲۰۱۵ با تک‌آهنگ «چشم‌های اقیانوسی» توجه‌ها را به خود جلب کرد که پس از انتشار در ساوندکلاود، توسط شرکت‌های دارک‌روم و اینترسکوپ رکوردز منتشر شد. این ترانه توسط برادرش فینیس اوکانل نوشته و تهیه شده‌است که بیلی در موسیقی و برنامه‌های زنده با او همکاری می‌کند. اولین ئی‌پی او، به من لبخند نزن (۲۰۱۷) در میان ۱۵ رتبه برتر جدول‌های فروش ایالات متحده، بریتانیا، کانادا و استرالیا قرار گرفت. اولین آلبوم استودیویی او، وقتی همه می‌خوابیم، کجا می‌ریم؟ (۲۰۱۹) به رتبه اول بیلبورد ۲۰۰ ایالات متحده رسید و به بهترین عملکرد آلبوم در سال ۲۰۱۹ تبدیل شد. او جوان‌ترین فرد و دومین نفری است که موفق به کسب چهار جایزه اصلی گرمی (بهترین هنرمند جدید، ضبط سال، ترانه سال و آلبوم سال) در یک سال شده است. سبک موسیقی او پاپ، الکتروپاپ و ایندی پاپ توصیف شده است. او از هنرمندانی چون لانا دل ری، تایلر، د کریتور و چایلدیش گامبینو تأثیر گرفته است. صدای او سوپرانو است و اغلب با سبک آوازخوانی زمزمه‌وار شناخته می‌شود. او در لس آنجلس بزرگ شده و در خانه آموزش دیده است.`;

// Ensure any URL coming from the server uses HTTPS where possible.
function ensureHttps(u?: string | null): string | undefined {
  if (!u) return u ?? undefined;
  try {
    if (/^\/\//.test(u)) return "https:" + u;
    if (/^http:\/\//i.test(u)) return u.replace(/^http:\/\//i, "https://");
  } catch (e) {
    // ignore
  }
  return u;
}
type IconName =
  | "play"
  | "pause"
  | "heart"
  | "shuffle"
  | "more"
  | "verified"
  | "back";

const iconPaths: Record<
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
  verified: {
    d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    fill: true,
  },
  back: { d: "M15 18l-6-6 6-6", stroke: true },
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
    const { d, fill, stroke } = iconPaths[name];
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

// ============== HOOKS ==============

const useVisible = (margin = "50px") => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.1, rootMargin: margin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [margin]);

  return { ref, visible };
};

// ============== LAZY IMAGE ==============
const LazyImg = memo(
  ({
    src,
    alt,
    className,
    priority,
  }: {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
  }) => {
    const [load, setLoad] = useState(!!priority);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (priority || !ref.current) return;
      const obs = new IntersectionObserver(
        ([e]) => e.isIntersecting && (setLoad(true), obs.disconnect()),
        { rootMargin: "100px" },
      );
      obs.observe(ref.current);
      return () => obs.disconnect();
    }, [priority]);

    return (
      <div
        ref={ref}
        className={`${className} overflow-hidden bg-neutral-800 relative`}
      >
        {load && (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            priority={!!priority}
          />
        )}
      </div>
    );
  },
);
LazyImg.displayName = "LazyImg";

// ============== ANIMATED NUMBER ==============
const AnimNum = memo(
  ({ value, dur = 1500 }: { value: number; dur?: number }) => {
    const [n, setN] = useState(0);
    const { ref, visible } = useVisible();

    useEffect(() => {
      if (!visible) return;
      let start: number, raf: number;
      const tick = (t: number) => {
        start ??= t;
        const p = Math.min((t - start) / dur, 1);
        setN(Math.floor((1 - (1 - p) ** 3) * value));
        p < 1 && (raf = requestAnimationFrame(tick));
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [visible, value, dur]);

    return (
      <span ref={ref as React.RefObject<HTMLSpanElement>}>
        {n.toLocaleString("fa-IR")}
      </span>
    );
  },
);
AnimNum.displayName = "AnimNum";

// ============== SONG ROW ==============
const SongRow = memo(
  ({
    song,
    idx,
    current,
    playing,
    onPlay,
    onMore,
    delay,
  }: {
    song: ApiSong;
    idx: number;
    current: boolean;
    playing: boolean;
    onPlay: () => void;
    onMore: (song: ApiSong) => void;
    delay: number;
  }) => {
    const [liked, setLiked] = useState(song.is_liked);
    const [hover, setHover] = useState(false);
    const { ref, visible } = useVisible();

    return (
      <div
        ref={ref}
        onClick={onPlay}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="flex items-center gap-4 py-2 pl-6 pr-2 sm:px-0 -mx-6 sm:mx-0 rounded-md cursor-pointer transition-all duration-300 hover:bg-white/[0.08] active:bg-white/[0.12] bg-black/5"
        style={{
          transform: visible ? "translateY(0)" : "translateY(20px)",
          opacity: visible ? 1 : 0,
          transitionDelay: `${delay}ms`,
        }}
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
            {song.plays}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMore(song);
            }}
            className="w-8 h-8 flex items-center justify-center text-white/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition hover:text-white"
          >
            <Icon name="more" size={18} />
          </button>
        </div>
      </div>
    );
  },
);
SongRow.displayName = "SongRow";

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

// ============== CARD COMPONENTS ==============
const AlbumCard = memo(({ album, idx }: { album: ApiAlbum; idx: number }) => {
  const { navigateTo } = useNavigation();
  const [hover, setHover] = useState(false);
  const { ref, visible } = useVisible();

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigateTo("album-detail", { id: album.id })}
      className="cursor-pointer transition-all duration-400"
      style={{
        transform: visible ? "translateY(0)" : "translateY(30px)",
        opacity: visible ? 1 : 0,
        transitionDelay: `${idx * 80}ms`,
      }}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
        <ImageWithPlaceholder
          src={album.cover_image}
          alt={album.title}
          className="w-full h-full object-cover"
        />
        <PlayBtn show={hover} className="bottom-2 left-2" />
      </div>
      <h3 className="text-[15px] font-semibold truncate px-1">{album.title}</h3>
      <p className="text-[13px] text-white/60 px-1">
        {album.release_date
          ? `${album.release_date.split("-")[0]} • آلبوم`
          : "آلبوم"}
      </p>
    </div>
  );
});
AlbumCard.displayName = "AlbumCard";

const ArtistCard = memo(
  ({ artist, idx }: { artist: ApiArtist; idx: number }) => {
    const { navigateTo } = useNavigation();
    const [hover, setHover] = useState(false);
    const { ref, visible } = useVisible();

    return (
      <div
        ref={ref}
        onClick={() =>
          navigateTo("artist-detail", {
            id: artist.id,
            slug: artist.unique_id || createSlug(artist.name),
          })
        }
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="text-center cursor-pointer transition-all duration-400"
        style={{
          transform: visible ? "translateY(0)" : "translateY(30px)",
          opacity: visible ? 1 : 0,
          transitionDelay: `${idx * 60}ms`,
        }}
      >
        <div className="relative w-full pb-[100%] rounded-full overflow-hidden mb-3">
          <div className="absolute inset-0">
            <ImageWithPlaceholder
              src={artist.profile_image}
              alt={artist.name}
              className="w-full h-full rounded-full object-cover"
              type="artist"
            />
          </div>
          <PlayBtn show={hover} className="bottom-2 left-1/2 -ml-[22px]" />
        </div>
        <h3 className="text-[15px] font-semibold truncate">{artist.name}</h3>
        <p className="text-[13px] text-white/60">خواننده</p>
      </div>
    );
  },
);
ArtistCard.displayName = "ArtistCard";

const PlayBtn = ({
  show,
  className = "",
}: {
  show: boolean;
  className?: string;
}) => (
  <button
    className={`absolute w-11 h-11 bg-green-500 rounded-full flex items-center justify-center text-black shadow-lg transition-all duration-200 hover:bg-green-400 hover:scale-110 ${className}`}
    style={{
      transform: show ? "translateY(0)" : "translateY(8px)",
      opacity: show ? 1 : 0,
    }}
  >
    <Icon name="play" size={24} className="ml-0.5" />
  </button>
);

// ============== MAIN PAGE ==============
interface ArtistDetailProps {
  id?: string | number; // Changed from slug to id
}

const ArtistSkeleton = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white animate-pulse" dir="rtl">
    {/* Hero Skeleton */}
    <div className="relative h-[45vh] min-h-[340px] bg-zinc-900" />

    {/* Actions Skeleton */}
    <div className="flex items-center justify-between px-6 py-6">
      <div className="flex gap-4">
        <div className="w-28 h-10 bg-zinc-800 rounded-full" />
        <div className="w-10 h-10 bg-zinc-800 rounded-full" />
      </div>
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-zinc-800 rounded-full" />
        <div className="w-14 h-14 bg-zinc-800 rounded-full" />
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="px-6 space-y-8">
      <div>
        <div className="w-32 h-6 bg-zinc-800 rounded mb-6" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 mb-4">
            <div className="w-5 h-4 bg-zinc-800 rounded" />
            <div className="w-11 h-11 bg-zinc-800 rounded" />
            <div className="flex-1 space-y-2">
              <div className="w-1/3 h-4 bg-zinc-800 rounded" />
              <div className="w-1/4 h-3 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Playlists Skeleton */}
      <div>
        <div className="w-40 h-6 bg-zinc-800 rounded mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-36 sm:w-44 space-y-3">
              <div className="aspect-square bg-zinc-800 rounded-lg" />
              <div className="w-2/3 h-4 bg-zinc-800 rounded" />
              <div className="w-1/2 h-3 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function ArtistDetail({ id }: ArtistDetailProps) {
  const { goBack, currentParams, scrollY } = useNavigation();
  const { playTrack, setQueue } = usePlayer();
  const { accessToken } = useAuth();

  // Support navigation by numeric id OR by unique_id slug (from URL)
  const artistIdOrSlug = id || currentParams?.id || currentParams?.slug;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const headerRef = React.useRef<HTMLElement | null>(null);
  const [data, setData] = useState<ArtistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);

  const [selectedSong, setSelectedSong] = useState<ApiSong | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isArtistDrawerOpen, setIsArtistDrawerOpen] = useState(false);

  useEffect(() => {
    if (!artistIdOrSlug) return;

    const fetchArtist = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

        const res = await fetch(
          `https://api.sedabox.com/api/artists/${artistIdOrSlug}/`,
          { headers },
        );

        // Guard against HTML error pages (404, 500, etc.)
        const contentType = res.headers.get("content-type") || "";
        if (!res.ok || !contentType.includes("application/json")) {
          throw new Error(`Unexpected response ${res.status}`);
        }

        const json = await res.json();
        setData(json);
        setFollowing(json.artist?.is_following ?? false);

        // Update browser URL to canonical artist slug after data loads
        if (typeof window !== "undefined" && json.artist) {
          const artistSlug =
            json.artist.unique_id ||
            createSlug(json.artist.artistic_name || json.artist.name || "");
          if (artistSlug) {
            const targetPath = `/${artistSlug}`;
            if (window.location.pathname !== targetPath) {
              window.history.replaceState(
                {
                  page: "artist-detail",
                  params: { id: json.artist.id, slug: artistSlug },
                },
                "",
                targetPath,
              );
            }
          }
        }
      } catch (err) {
        console.error("Error fetching artist:", err);
        setFollowing(false);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [artistIdOrSlug, accessToken]);

  const headerOpacity = useMemo(() => Math.min(scrollY / 300, 1), [scrollY]);
  const showHeader = scrollY > 50;

  const artist = data?.artist;
  const songs = data?.top_songs.items || [];
  const albums = data?.albums.items || [];
  const similarArtists = data?.similar_artists || [];
  const discoveredOn = data?.discovered_on || [];

  const displayed = useMemo(
    () => (showAll ? songs : songs.slice(0, 5)),
    [showAll, songs],
  );

  const playSong = useCallback(
    (song: ApiSong) => {
      const track: Track = {
        id: String(song.id),
        title: song.title,
        artist: song.artist_name,
        artistId: song.artist_id || song.artist,
        image: song.cover_image,
        duration: song.duration_display,
        src: (ensureHttps(song.stream_url) as string) || FALLBACK_SRC,
        isLiked: song.is_liked,
        likesCount: song.likes_count,
      };
      playTrack(track);
    },
    [playTrack],
  );

  const playAll = useCallback(() => {
    if (!songs.length) return;
    const tracks: Track[] = songs.map((song) => ({
      id: String(song.id),
      title: song.title,
      artist: song.artist_name,
      artistId: song.artist_id || song.artist,
      image: song.cover_image,
      duration: song.duration_display,
      src: (ensureHttps(song.stream_url) as string) || FALLBACK_SRC,
      isLiked: song.is_liked,
      likesCount: song.likes_count,
    }));
    setQueue(tracks, 0);
  }, [songs, setQueue]);

  const shuffle = useCallback(() => {
    if (!songs.length) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    const tracks: Track[] = shuffled.map((song) => ({
      id: String(song.id),
      title: song.title,
      artist: song.artist_name,
      artistId: song.artist_id || song.artist,
      image: song.cover_image,
      duration: song.duration_display,
      src: (ensureHttps(song.stream_url) as string) || FALLBACK_SRC,
      isLiked: song.is_liked,
      likesCount: song.likes_count,
    }));
    setQueue(tracks, 0);
  }, [songs, setQueue]);

  const handleMore = useCallback((song: ApiSong) => {
    setSelectedSong(song);
    setIsDrawerOpen(true);
  }, []);

  const handleFollow = useCallback(async () => {
    if (!accessToken) {
      toast.error("برای دنبال کردن ابتدا وارد شوید");
      return;
    }
    const followId = data?.artist?.id || artistIdOrSlug;
    if (!followId) return;

    setIsFollowLoading(true);
    try {
      const res = await fetch(`https://api.sedabox.com/api/follow/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ artist_id: followId }),
      });

      if (!res.ok) throw new Error("Follow failed");

      const result = await res.json();
      const isFollowing = result.message === "followed";
      setFollowing(isFollowing);
      setData((prev) =>
        prev
          ? { ...prev, artist: { ...prev.artist, is_following: isFollowing } }
          : null,
      );
      toast.success(isFollowing ? "دنبال شد" : "لغو دنبال کردن");
    } catch (err) {
      console.error("Follow error:", err);
      toast.error("خطا در انجام عملیات");
    } finally {
      setIsFollowLoading(false);
    }
  }, [accessToken, artistIdOrSlug, data?.artist?.id]);

  const handleAction = async (action: string, song: any) => {
    console.log(`Action ${action} on song ${song.title}`);
    if (action === "toggle-like") {
      if (!song) return;
      if (!accessToken) {
        toast.error("برای لایک کردن لطفا وارد شوید");
        return Promise.reject(new Error("not-authenticated"));
      }
      try {
        const url = `https://api.sedabox.com/api/songs/${song.id}/like/`;
        const headers: Record<string, string> = {};
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

        const resp = await fetch(url, { method: "POST", headers });
        if (!resp.ok) {
          toast.error("خطا در بروزرسانی لایک");
          const errText = await resp.text().catch(() => "");
          throw new Error(`like-failed ${resp.status} ${errText}`);
        }
        const data = await resp.json();

        // Update local data state (top_songs list)
        setData((prev) => {
          if (!prev) return prev;
          const items = prev.top_songs.items.map((it) =>
            it.id === song.id
              ? { ...it, is_liked: data.liked, likes_count: data.likes_count }
              : it,
          );
          return { ...prev, top_songs: { ...prev.top_songs, items } };
        });

        // Update selectedSong if it's the same one shown in drawer
        setSelectedSong((prev) =>
          prev && prev.id === song.id
            ? { ...prev, is_liked: data.liked, likes_count: data.likes_count }
            : prev,
        );

        // Notify player and other listeners
        window.dispatchEvent(
          new CustomEvent("song-like-changed", {
            detail: {
              id: String(song.id),
              liked: data.liked,
              likes_count: data.likes_count,
            },
          }),
        );

        toast.success(data.liked ? "به لایک‌ها اضافه شد" : "از لایک‌ها حذف شد");
        return data;
      } catch (err) {
        console.error("Failed to toggle like (ArtistDetail):", err);
        toast.error("خطا در بروزرسانی لایک");
        throw err;
      }
    }

    if (action === "share") {
      try {
        // If a specific song is provided, share the song
        const isSong = song && (song.id || song.title);
        const url = isSong
          ? getFullShareUrl("song", song.id)
          : getFullShareUrl("artist", artist!.id);

        const title = isSong ? song.title : artist?.name;
        const text = isSong
          ? `گوش دادن به آهنگ ${song.title} از ${artist?.name} در سداباکس`
          : `گوش دادن به آثار ${artist?.name} در سداباکس`;

        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title, text, url });
        } else if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          toast.success("لینک کپی شد");
        }
      } catch (err) {
        console.error("Share failed:", err);
      }
      return;
    }

    // other actions: no-op for now
    return;
  };

  if (loading) return <ArtistSkeleton />;
  if (!artist)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        هنرمند یافت نشد
      </div>
    );

  return (
    <>
      <div
        ref={containerRef}
        className="min-h-screen bg-transparent text-white overflow-x-hidden pb-24 md:pb-4"
        dir="rtl"
      >
        {/* Desktop Header */}
        <header className="hidden md:flex sticky top-0 z-50 h-16 items-center justify-between px-6 bg-zinc-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={goBack}
              className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <span className="text-lg font-bold text-white mr-4">
              {artist.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={playAll}
              className="px-6 py-2 bg-emerald-500 rounded-full flex items-center gap-2 text-black font-semibold hover:scale-105 hover:bg-emerald-400 transition-all"
            >
              <Icon name="play" size={18} />
              پخش
            </button>
            <button
              onClick={() => setIsArtistDrawerOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-white/70 rounded-full hover:text-white hover:bg-white/10 transition"
            >
              <Icon name="more" size={24} />
            </button>
          </div>
        </header>

        {/* Mobile Sticky Header */}
        <header
          ref={headerRef}
          className="md:hidden  fixed flex-row-reverse top-0 inset-x-0 h-16 bg-black/20 backdrop-blur-xl flex items-center justify-between px-4 z-50 transition-all duration-250"
          style={{
            transform: showHeader ? "translateY(0)" : "translateY(-100%)",
            opacity: showHeader ? 1 : 0,
          }}
        >
          <button
            onClick={goBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          >
            <Icon name="back" size={24} className="text-white" />
          </button>
          <span
            className="flex-1 px-4 text-base font-bold transition-opacity"
            style={{ opacity: headerOpacity }}
          >
            {artist.name}
          </span>
          <button
            onClick={playAll}
            className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-black transition hover:scale-105 hover:bg-green-400 active:scale-95"
          >
            <Icon name="play" size={20} />
          </button>
          <button
            onClick={() => setIsArtistDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-white/70 rounded-full hover:text-white active:bg-white/10 transition"
          >
            <Icon name="more" size={24} />
          </button>
        </header>

        {/* Mobile Back */}
        <button
          onClick={goBack}
          className="fixed top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center z-40 transition hover:bg-black/70"
          style={{
            opacity: showHeader ? 0 : 1,
            pointerEvents: showHeader ? "none" : "auto",
          }}
        >
          <Icon name="back" size={24} className="text-white" />
        </button>

        {/* Hero */}
        <section className="relative h-[45vh] min-h-[340px] max-h-[500px] overflow-visible">
          <div
            className="absolute inset-0 origin-bottom"
            style={{
              transform: `scale(${1 + scrollY * 0.0003})`,
              opacity: Math.max(1 - scrollY / 400, 0),
            }}
          >
            <ImageWithPlaceholder
              src={artist.banner_image}
              alt={artist.name}
              className="w-full h-full object-cover"
              type="artist"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/30 via-50% to-[#0a0a0a]" />
          <div className="absolute bottom-0 inset-x-0 p-6">
            {artist.verified && (
              <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium mb-3">
                <Icon name="verified" size={18} className="text-blue-400" />
                <span>هنرمند تایید شده</span>
              </div>
            )}
            <h1 className="text-2xl font-black tracking-tight leading-tight mb-2">
              {artist.name}
            </h1>
            <p className="text-white/70 text-sm">
              {artist.monthly_listeners_count.toLocaleString("fa-IR")} شنونده
              ماهانه
            </p>
          </div>

          {/* Circular profile overlay: 40% bigger than main play button (w-14 -> ~w-20) */}
          <div className="absolute z-40 bottom-5 left-5 pointer-events-auto">
            <div
              className="w-30 h-30 md:w-24 md:h-24 rounded-full overflow-hidden bg-neutral-900 shadow-[0_12px_30px_rgba(2,6,23,0.6)]"
              style={{
                border: "3px solid rgba(255,255,255,0.07)",
                boxShadow: "0 10px 30px rgba(16,24,40,0.6)",
              }}
            >
              <ImageWithPlaceholder
                src={artist.profile_image}
                alt={`${artist.name} avatar`}
                className="w-full h-full rounded-full object-cover"
                type="artist"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            {following === null ? (
              <div className="px-5 py-2 rounded-full text-[13px] font-bold border border-white/30 bg-zinc-800 animate-pulse">
                در حال بارگذاری...
              </div>
            ) : (
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`px-5 py-2 rounded-full text-[13px] font-bold border transition hover:scale-[1.02] flex items-center justify-center min-w-[100px] min-h-[38px] ${
                  following
                    ? "border-green-500 text-green-500"
                    : "border-white/30 hover:border-white"
                } ${isFollowLoading ? "opacity-75 cursor-not-allowed" : ""}`}
              >
                {isFollowLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : following ? (
                  "دنبال می‌کنید"
                ) : (
                  "دنبال کردن"
                )}
              </button>
            )}
            <button
              onClick={() => setIsArtistDrawerOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-white/70 rounded-full hover:text-white hover:bg-white/10 transition"
            >
              <Icon name="more" size={24} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={shuffle}
              className="w-12 h-12 flex items-center justify-center text-white/70 rounded-full hover:text-white hover:scale-110 active:scale-95 transition"
            >
              <Icon name="shuffle" size={22} />
            </button>
            <button
              onClick={playAll}
              className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-black shadow-[0_8px_24px_rgba(29,185,84,0.3)] transition hover:scale-[1.06] hover:bg-green-400 hover:shadow-[0_10px_30px_rgba(29,185,84,0.4)] active:scale-[0.98]"
            >
              <Icon name="play" size={28} />
            </button>
          </div>
        </section>

        {/* Discography */}
        <section className="px-6 py-4">
          {/* Songs */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">اهنگ های برتر</h3>
            <div className="flex flex-col group">
              {displayed.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  idx={i}
                  current={false}
                  playing={false}
                  onPlay={() => playSong(song)}
                  onMore={() => handleMore(song)}
                  delay={i * 50}
                />
              ))}
            </div>
            {songs.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="text-white/70 text-sm font-semibold px-4 py-3 mt-2 hover:text-white transition"
              >
                {showAll ? "نمایش کمتر" : "نمایش همه"}
              </button>
            )}
          </div>

          {/* Albums */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">آلبوم‌ها</h3>
              <button className="text-white/70 text-[13px] font-semibold hover:text-white transition">
                مشاهده همه
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 sm:gap-5">
              {albums.map((a, i) => (
                <AlbumCard key={a.id} album={a} idx={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Latest Songs */}
        <section className="px-6 py-4">
          <h2 className="text-[22px] font-bold mb-5">آخرین آهنگ‌ها</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {(data?.latest_songs.items || []).map((song) => (
              <SongCard
                key={song.id}
                image={song.cover_image}
                title={song.title}
                artist={song.artist_name}
                onClick={() => playSong(song)}
              />
            ))}
            <button className="flex-shrink-0 text-white/70 text-sm font-semibold hover:text-white transition px-4 py-2">
              مشاهده همه
            </button>
          </div>
        </section>

        {/* About */}
        <section className="px-6 py-8">
          <h2 className="text-[22px] font-bold mb-5">درباره</h2>
          <div
            className="relative rounded-xl overflow-hidden h-[300px] cursor-pointer"
            role="button"
            aria-label={`Open ${artist.name} bio`}
            tabIndex={0}
            onClick={() => setIsBioOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsBioOpen(true);
            }}
          >
            <ImageWithPlaceholder
              src={artist.profile_image}
              alt={artist.name}
              className="w-full h-full object-cover -z-10 opacity-55"
              type="artist"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-6">
              <p className="text-base text-white/90 leading-relaxed mb-4 line-clamp-3 font-medium drop-shadow-md">
                {artist.bio ||
                  `${artist.name} یکی از هنرمندان برجسته‌ای است که با آثار خود شناخته می‌شود.`}
              </p>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  {artist.monthly_listeners_count > 1000 ? (
                    <AnimNum value={artist.monthly_listeners_count} />
                  ) : (
                    artist.monthly_listeners_count.toLocaleString("fa-IR")
                  )}
                </span>
                <span className="text-xs text-white/60 mt-0.5">
                  شنونده ماهانه
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* Discovered On (Playlists) */}
        {discoveredOn.length > 0 && (
          <section className="px-6 py-4">
            <h2 className="text-[22px] font-bold mb-5"> کشف‌شده در </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {discoveredOn.map((playlist) => (
                <PlaylistSnippetCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          </section>
        )}
        {/* Related */}
        <section className="px-6 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[22px] font-bold">هنرمندان مشابه</h2>
            <button className="text-white/70 text-[13px] font-semibold hover:text-white transition">
              مشاهده همه
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 sm:gap-5">
            {similarArtists.map((a, i) => (
              <ArtistCard key={a.id} artist={a} idx={i} />
            ))}
          </div>
        </section>

        <div className="h-[100px]" />
      </div>

      {/* Artist Bio Modal */}
      <ArtistBioModal
        artist={artist}
        open={isBioOpen}
        onClose={() => setIsBioOpen(false)}
      />

      <SongOptionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        song={selectedSong}
        onAction={handleAction}
      />

      <ArtistOptionsDrawer
        isOpen={isArtistDrawerOpen}
        onClose={() => setIsArtistDrawerOpen(false)}
        artist={artist}
        onFollowToggle={handleFollow}
        onPlayArtist={playAll}
      />

      <style jsx global>{`
        @keyframes equalizer {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 14px;
          }
        }
        .animate-equalizer {
          animation: equalizer 0.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
        ::-webkit-scrollbar {
          width: 10px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}

// Missing SongCard component
const SongCard = ({
  image,
  title,
  artist,
  onClick,
}: {
  image: string;
  title: string;
  artist: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex-shrink-0 w-56 bg-neutral-800 rounded-lg p-3 hover:bg-neutral-700 transition cursor-pointer"
  >
    <div className="w-full aspect-square rounded mb-2 overflow-hidden relative">
      <ImageWithPlaceholder
        src={image}
        alt={title}
        className="w-full h-full object-cover"
      />
    </div>
    <h3 className="font-semibold text-sm truncate">{title}</h3>
    <p className="text-xs text-neutral-400 truncate">{artist}</p>
  </div>
);

const PlaylistSnippetCard = ({
  playlist,
}: {
  playlist: ApiPlaylistSnippet;
}) => {
  const { navigateTo } = useNavigation();
  return (
    <div
      onClick={() =>
        navigateTo("playlist-detail", { slug: String(playlist.id) })
      }
      className="flex-shrink-0 w-36 sm:w-44 bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 hover:bg-white/[0.06] transition-all cursor-pointer group"
    >
      <div className="w-full aspect-square rounded-lg mb-3 overflow-hidden relative shadow-lg">
        <ImageWithPlaceholder
          src={playlist.image}
          alt={playlist.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
      </div>
      <h3 className="font-bold text-[13px] sm:text-sm truncate mb-1 text-right">
        {playlist.title}
      </h3>
      <p className="text-[11px] text-white/50 truncate uppercase tracking-wider text-right">
        {playlist.source === "admin" ? "پلی‌لیست رسمی" : "پلی‌لیست"}
      </p>
    </div>
  );
};

// ============================================================================
// ARTIST BIO MODAL
// ============================================================================
const SocialIcon = ({
  type,
  className = "w-9 h-9",
}: {
  type: string;
  className?: string;
}) => {
  const common = { className } as any;
  switch (type) {
    case "instagram":
      return (
        <svg
          {...common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <path d="M17.5 6.5h.01" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.2v-2.9h2.2V9.1c0-2.2 1.3-3.4 3.3-3.4.96 0 1.97.17 1.97.17v2.2h-1.12c-1.1 0-1.44.68-1.44 1.37v1.66h2.45l-.39 2.9h-2.06v7A10 10 0 0022 12z" />
        </svg>
      );
    case "twitter":
      return (
        <svg
          {...common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
        </svg>
      );
    case "telegram":
      return (
        <svg
          {...common}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M22 2L11 13" />
          <path d="M22 2l-7 20-4-8-6-3 17-9z" />
        </svg>
      );
    default:
      return null;
  }
};

const ArtistBioModal = memo(function ArtistBioModal({
  artist,
  open,
  onClose,
}: {
  artist: ApiArtist;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !artist) return null;

  const bioText =
    artist.bio ||
    `${artist.name} یک هنرمند محبوب است که بیوگرافی او در اینجا نمایش داده می‌شود.`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[85vh]">
        {/* Banner Section with Text Overlay */}
        <div className="relative h-[400px] flex-shrink-0">
          <ImageWithPlaceholder
            src={artist.banner_image || artist.profile_image}
            alt={`${artist.name} banner`}
            className="absolute inset-0 w-full h-full object-cover"
            type="artist"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-black/60 to-black/30" />

          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition z-20"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable Bio Text Overlay */}
          <div className="absolute inset-x-0 bottom-0 top-16 px-8 pb-8 overflow-y-auto custom-scrollbar z-10">
            <h2 className="text-3xl font-bold mb-4 drop-shadow-lg text-right">
              {artist.name}
            </h2>
            <p
              className="text-lg leading-relaxed text-white/90 font-medium drop-shadow-md text-justify"
              dir="rtl"
            >
              {bioText}
            </p>
          </div>
        </div>

        {/* Footer Section: Avatar & Socials */}
        <div
          className="bg-neutral-900 p-6 flex items-center justify-between border-t border-white/5"
          dir="rtl"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 shadow-lg">
              <ImageWithPlaceholder
                src={artist.profile_image}
                alt={artist.name}
                className="w-full h-full object-cover"
                type="artist"
              />
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-white/50">دنبال کنید در</div>
              <div className="font-semibold">شبکه‌های اجتماعی</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {artist.social_accounts?.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition hover:scale-110 hover:text-green-400"
                title={social.platform_name}
              >
                <SocialIcon
                  type={social.platform_name.toLowerCase()}
                  className="w-6 h-6"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});
ArtistBioModal.displayName = "ArtistBioModal";
