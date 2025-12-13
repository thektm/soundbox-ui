"use client";

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

const BILLIE_BIO_FA = `بیلی آیلیش پایرت بیرد اوکانل (زادهٔ ۱۸ دسامبر ۲۰۰۱) خواننده و ترانه‌نویس آمریکایی است. او اولین بار در سال ۲۰۱۵ با تک‌آهنگ «چشم‌های اقیانوسی» توجه‌ها را به خود جلب کرد که پس از انتشار در ساوندکلاود، توسط شرکت‌های دارک‌روم و اینترسکوپ رکوردز منتشر شد. این ترانه توسط برادرش فینیس اوکانل نوشته و تهیه شده‌است که بیلی در موسیقی و برنامه‌های زنده با او همکاری می‌کند. اولین ئی‌پی او، به من لبخند نزن (۲۰۱۷) در میان ۱۵ رتبه برتر جدول‌های فروش ایالات متحده، بریتانیا، کانادا و استرالیا قرار گرفت. اولین آلبوم استودیویی او، وقتی همه می‌خوابیم، کجا می‌ریم؟ (۲۰۱۹) به رتبه اول بیلبورد ۲۰۰ ایالات متحده رسید و به بهترین عملکرد آلبوم در سال ۲۰۱۹ تبدیل شد. او جوان‌ترین فرد و دومین نفری است که موفق به کسب چهار جایزه اصلی گرمی (بهترین هنرمند جدید، ضبط سال، ترانه سال و آلبوم سال) در یک سال شده است. سبک موسیقی او پاپ، الکتروپاپ و ایندی پاپ توصیف شده است. او از هنرمندانی چون لانا دل ری، تایلر، د کریتور و چایلدیش گامبینو تأثیر گرفته است. صدای او سوپرانو است و اغلب با سبک آوازخوانی زمزمه‌وار شناخته می‌شود. او در لس آنجلس بزرگ شده و در خانه آموزش دیده است.`;

// ============== SVG ICON COMPONENT ==============
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
    d: "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M20 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M4 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
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
  }
);
Icon.displayName = "Icon";

// ============== HOOKS ==============
const useScrollY = () => {
  const [y, setY] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        setY(window.scrollY);
        raf.current = undefined;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      raf.current && cancelAnimationFrame(raf.current);
    };
  }, []);
  return y;
};

const useVisible = (margin = "50px") => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.1, rootMargin: margin }
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
        { rootMargin: "100px" }
      );
      obs.observe(ref.current);
      return () => obs.disconnect();
    }, [priority]);

    return (
      <div ref={ref} className={`${className} overflow-hidden bg-neutral-800`}>
        {load && (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
        )}
      </div>
    );
  }
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
  }
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
    delay,
  }: {
    song: Song;
    idx: number;
    current: boolean;
    playing: boolean;
    onPlay: () => void;
    delay: number;
  }) => {
    const [liked, setLiked] = useState(false);
    const [hover, setHover] = useState(false);
    const { ref, visible } = useVisible();

    return (
      <div
        ref={ref}
        onClick={onPlay}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="flex items-center gap-4 p-2.5 rounded-md cursor-pointer transition-all duration-300 hover:bg-white/[0.08] active:bg-white/[0.12]"
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

        <LazyImg
          src={song.image}
          alt={song.title}
          className="w-11 h-11 rounded shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div
            className={`text-[15px] font-medium truncate ${
              current ? "text-green-500" : "text-white"
            }`}
          >
            {song.title}
          </div>
          <div className="text-[13px] text-white/60 truncate mt-0.5">
            {song.explicit && (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-white/15 text-white/80 text-[9px] font-bold rounded-sm ml-1.5 align-middle">
                E
              </span>
            )}
            {song.artist}
          </div>
        </div>

        <div className="hidden md:block text-[13px] text-white/50 whitespace-nowrap">
          {Math.floor(Math.random() * 50 + 5).toLocaleString("fa-IR")} میلیون
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLiked(!liked);
            }}
            className={`w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 ${
              liked
                ? "text-green-500 !opacity-100"
                : "text-white/40 hover:text-white"
            }`}
          >
            <Icon name="heart" size={18} filled={liked} />
          </button>
          <span className="text-[13px] text-white/50 tabular-nums min-w-[40px] text-left">
            {song.duration}
          </span>
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 flex items-center justify-center text-white/40 opacity-0 group-hover:opacity-100 transition hover:text-white"
          >
            <Icon name="more" size={18} />
          </button>
        </div>
      </div>
    );
  }
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
const AlbumCard = memo(
  ({
    album,
    idx,
  }: {
    album: {
      id: string;
      title: string;
      image: string;
      year: string;
      type: string;
    };
    idx: number;
  }) => {
    const { navigateTo } = useNavigation();
    const [hover, setHover] = useState(false);
    const { ref, visible } = useVisible();

    return (
      <div
        ref={ref}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => navigateTo("album-detail", { album: album })}
        className="cursor-pointer transition-all duration-400"
        style={{
          transform: visible ? "translateY(0)" : "translateY(30px)",
          opacity: visible ? 1 : 0,
          transitionDelay: `${idx * 80}ms`,
        }}
      >
        <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
          <LazyImg
            src={album.image}
            alt={album.title}
            className="w-full h-full"
          />
          <PlayBtn show={hover} className="bottom-2 left-2" />
        </div>
        <h3 className="text-[15px] font-semibold truncate px-1">
          {album.title}
        </h3>
        <p className="text-[13px] text-white/60 px-1">
          {album.year} • {album.type}
        </p>
      </div>
    );
  }
);
AlbumCard.displayName = "AlbumCard";

const ArtistCard = memo(
  ({ artist, idx }: { artist: (typeof MOCK_ARTISTS)[0]; idx: number }) => {
    const { navigateTo } = useNavigation();
    const [hover, setHover] = useState(false);
    const { ref, visible } = useVisible();

    return (
      <div
        ref={ref}
        onClick={() => navigateTo("artist-detail", { id: artist.id })}
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
          <LazyImg
            src={artist.image}
            alt={artist.name}
            className="absolute inset-0 w-full h-full rounded-full"
          />
          <PlayBtn show={hover} className="bottom-2 left-1/2 -ml-[22px]" />
        </div>
        <h3 className="text-[15px] font-semibold truncate">{artist.name}</h3>
        <p className="text-[13px] text-white/60">خواننده</p>
      </div>
    );
  }
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
  slug?: string;
}

export default function ArtistDetail({ slug }: ArtistDetailProps) {
  const { goBack } = useNavigation();

  const scrollY = useScrollY();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [artist, setArtist] = useState<(typeof MOCK_ARTISTS)[0] | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [following, setFollowing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [isBioOpen, setIsBioOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const found = MOCK_ARTISTS.find((a) => a.id === slug);
    if (found) {
      setArtist(found);
      const artistSongs = MOCK_SONGS.filter((s) => s.artist === found.name);
      const extended = [...artistSongs];
      while (extended.length < 10 && artistSongs[0]) {
        extended.push({
          ...artistSongs[0],
          id: `${artistSongs[0].id}-${extended.length}`,
          title: `آهنگ شماره ${extended.length + 1}`,
        });
      }
      setSongs(extended);
    }
  }, [slug]);

  const headerOpacity = useMemo(() => Math.min(scrollY / 300, 1), [scrollY]);
  const showHeader = scrollY > 340;

  const albums = useMemo(
    () =>
      artist
        ? [
            {
              id: "1",
              title: "آلبوم اول",
              image: artist.image,
              year: "۱۴۰۲",
              type: "آلبوم",
              description: "اولین آلبوم رسمی هنرمند",
            },
            {
              id: "2",
              title: "تک آهنگ جدید",
              image: artist.image,
              year: "۱۴۰۳",
              type: "سینگل",
              description: "تک آهنگ جدید و هیجان انگیز",
            },
            {
              id: "3",
              title: "بهترین‌ها",
              image: artist.image,
              year: "۱۴۰۱",
              type: "کامپایل",
              description: "مجموعه بهترین آهنگ‌ها",
            },
            {
              id: "4",
              title: "ریمیکس‌ها",
              image: artist.image,
              year: "۱۴۰۲",
              type: "EP",
              description: "ریمیکس‌های جذاب و مدرن",
            },
          ]
        : [],
    [artist]
  );

  const collaborations = useMemo(() => MOCK_SONGS.slice(0, 5), []);
  const popularSongs = useMemo(() => MOCK_SONGS.slice(5, 10), []);

  const related = useMemo(
    () => MOCK_ARTISTS.filter((a) => a.id !== slug).slice(0, 6),
    [slug]
  );
  const displayed = useMemo(
    () => (showAll ? songs : songs.slice(0, 5)),
    [showAll, songs]
  );

  const playSong = useCallback((song: Song) => {
    // Mock play
    console.log("Playing", song.title);
  }, []);

  const playAll = useCallback(
    () => songs[0] && playSong(songs[0]),
    [songs, playSong]
  );
  const shuffle = useCallback(
    () =>
      songs.length && playSong(songs[Math.floor(Math.random() * songs.length)]),
    [songs, playSong]
  );

  if (!artist)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
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
          </div>
        </header>

        {/* Mobile Sticky Header */}
        <header
          className="md:hidden fixed flex-row-reverse top-0 inset-x-0 h-16 bg-gradient-to-b from-neutral-900/98 to-neutral-950/95 flex items-center justify-between px-4 z-50 transition-all duration-250"
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
            <LazyImg
              src={artist.image}
              alt={artist.name}
              className="w-full h-full"
              priority
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
              <AnimNum
                value={parseInt(
                  artist.followers?.replace(/\D/g, "") || "5000000"
                )}
              />{" "}
              شنونده ماهانه
            </p>
          </div>

          {/* Circular profile overlay: 40% bigger than main play button (w-14 -> ~w-20) */}
          <div className="absolute z-40 bottom-5  left-5 pointer-events-auto">
            <div
              className="w-30 h-30 md:w-24 md:h-24 rounded-full overflow-hidden bg-neutral-900 shadow-[0_12px_30px_rgba(2,6,23,0.6)]"
              style={{
                border: "3px solid rgba(255,255,255,0.07)",
                boxShadow: "0 10px 30px rgba(16,24,40,0.6)",
              }}
            >
              <LazyImg
                src={(artist as any).profileImage || artist.image}
                alt={`${artist.name} avatar`}
                className="w-full h-full rounded-full"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFollowing(!following)}
              className={`px-5 py-2 rounded-full text-[13px] font-bold border transition hover:scale-[1.02] ${
                following
                  ? "border-green-500 text-green-500"
                  : "border-white/30 hover:border-white"
              }`}
            >
              {following ? "دنبال می‌کنید" : "دنبال کردن"}
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-white/70 rounded-full hover:text-white hover:bg-white/10 transition">
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
          <h2 className="text-[22px] font-bold mb-5">دیسکوگرافی</h2>

          {/* Songs */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">آهنگ‌ها</h3>
            <div className="flex flex-col group">
              {displayed.map((song, i) => (
                <SongRow
                  key={song.id}
                  song={song}
                  idx={i}
                  current={false}
                  playing={false}
                  onPlay={() => playSong(song)}
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

        {/* Collaborations */}
        <section className="px-6 py-4">
          <h2 className="text-[22px] font-bold mb-5">همکاریها</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {collaborations.map((song) => (
              <SongCard
                key={song.id}
                image={song.image}
                title={song.title}
                artist={song.artist}
                onClick={() => playSong(song)}
              />
            ))}
            <button className="flex-shrink-0 text-white/70 text-sm font-semibold hover:text-white transition px-4 py-2">
              مشاهده همه
            </button>
          </div>
        </section>

        {/* Popular Songs */}
        <section className="px-6 py-4">
          <h2 className="text-[22px] font-bold mb-5">آهنگ های محبوب</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {popularSongs.map((song) => (
              <SongCard
                key={song.id}
                image={song.image}
                title={song.title}
                artist={song.artist}
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
            <LazyImg
              src={artist.image}
              alt={artist.name}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-6">
              <p className="text-base text-white/90 leading-relaxed mb-4 line-clamp-3 font-medium drop-shadow-md">
                {artist.name.toLowerCase().includes("billie") || artist.name.includes("بیلی")
                  ? BILLIE_BIO_FA
                  : (artist as any).bio ||
                    `${artist.name} یکی از محبوب‌ترین خوانندگان است که با سبک منحصر به فرد خود توانسته میلیون‌ها شنونده را جذب کند.`}
              </p>
              <div className="flex flex-col">
                <span className="text-2xl font-bold">
                  <AnimNum value={5200000} />
                </span>
                <span className="text-xs text-white/60 mt-0.5">
                  شنونده ماهانه
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="px-6 py-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[22px] font-bold">هنرمندان مشابه</h2>
            <button className="text-white/70 text-[13px] font-semibold hover:text-white transition">
              مشاهده همه
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 sm:gap-5">
            {related.map((a, i) => (
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
    className="flex-shrink-0 w-48 bg-neutral-800 rounded-lg p-3 hover:bg-neutral-700 transition cursor-pointer"
  >
    <img
      src={image}
      alt={title}
      className="w-full aspect-square rounded mb-2"
    />
    <h3 className="font-semibold text-sm truncate">{title}</h3>
    <p className="text-xs text-neutral-400 truncate">{artist}</p>
  </div>
);

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
  artist: any;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !artist) return null;

  const slug =
    typeof createSlug === "function"
      ? createSlug(artist.name)
      : artist.name.replace(/\s+/g, "-").toLowerCase();

  const isBillie =
    artist.name.toLowerCase().includes("billie") ||
    artist.name.includes("بیلی");
  const bioText = isBillie
    ? BILLIE_BIO_FA
    : (artist as any).bio ||
      `${artist.name} یک هنرمند محبوب است که بیوگرافی او در اینجا نمایش داده می‌شود.`;

  const socials = {
    instagram: `https://instagram.com/${slug}`,
    facebook: `https://facebook.com/${slug}`,
    twitter: `https://twitter.com/${slug}`,
    telegram: `https://t.me/${slug}`,
  };

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
          <img
            src={artist.image}
            alt={`${artist.name} banner`}
            className="absolute inset-0 w-full h-full object-cover"
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
            <h2 className="text-3xl font-bold mb-4 drop-shadow-lg">
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
        <div className="bg-neutral-900 p-6 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 shadow-lg">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-white/50">دنبال کنید در</div>
              <div className="font-semibold">شبکه‌های اجتماعی</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {Object.entries(socials).map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition hover:scale-110 hover:text-green-400"
                title={key}
              >
                <SocialIcon type={key} className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});
ArtistBioModal.displayName = "ArtistBioModal";
