"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  memo,
} from "react";
import { useNavigation } from "./NavigationContext";
import { usePlayer } from "./PlayerContext";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { MOCK_SONGS as CENTRALIZED_SONGS } from "./mockData";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { SongOptionsDrawer } from "./SongOptionsDrawer";

interface ApiSong {
  id: number;
  title: string;
  artist: number;
  artist_id?: number;
  artist_name: string;
  cover_image: string;
  duration_display: string;
  is_liked: boolean;
  likes_count: number;
  plays: number;
  added_to_playlists_count: number;
  lyrics: string;
  credits: string;
  producers: string[];
  composers: string[];
  lyricists: string[];
  label?: string;
  similar_songs?: {
    items: {
      id: number;
      title: string;
      artist_name: string;
      artist_id?: number;
      artist?: number;
      cover_image: string;
      duration_display?: string;
      duration_seconds?: number;
      stream_url?: string;
      audio_file?: string;
    }[];
  };
  audio_file: string;
  stream_url: string;
  display_title?: string;
}

interface LyricLine {
  time: number;
  text: string;
}

interface Credit {
  role: string;
  name: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  artistId?: number | string;
  duration: string;
  image: string;
  src: string;
}

type IconName =
  | "play"
  | "pause"
  | "heart"
  | "shareNetwork"
  | "dotsThree"
  | "clock"
  | "arrowLeft"
  | "music"
  | "microphone"
  | "user"
  | "caretDown"
  | "caretUp"
  | "check"
  | "listPlus"
  | "queue"
  | "downloadSimple"
  | "copy"
  | "waveform";

const iconPaths: Record<
  IconName,
  { d: string; fill?: boolean; stroke?: boolean }
> = {
  play: { d: "M8 5v14l11-7z", fill: true },
  pause: { d: "M6 19h4V5H6v14zm8-14v14h4V5h-4z", fill: true },
  heart: {
    d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    stroke: true,
  },
  dotsThree: {
    d: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
    fill: true,
  },
  clock: {
    d: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
    fill: true,
  },
  arrowLeft: {
    d: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
    fill: true,
  },
  music: {
    d: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
    fill: true,
  },
  shareNetwork: {
    d: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z",
    fill: true,
  },
  microphone: {
    d: "M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z",
    fill: true,
  },
  user: {
    d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    fill: true,
  },
  caretDown: {
    d: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
    fill: true,
  },
  caretUp: {
    d: "M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z",
    fill: true,
  },
  check: {
    d: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
    fill: true,
  },
  listPlus: {
    d: "M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z",
    fill: true,
  },
  queue: {
    d: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
    fill: true,
  },
  downloadSimple: {
    d: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
    fill: true,
  },
  copy: {
    d: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
    fill: true,
  },
  waveform: {
    d: "M12 3v18M8 6v12M4 9v6M16 6v12M20 9v6",
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

// ============================================================================
// LOADING SPINNER
// ============================================================================
const Spinner = ({ size = "w-5 h-5" }: { size?: string }) => (
  <div
    className={`${size} border-2 border-neutral-800 border-t-transparent rounded-full animate-spin`}
  />
);

const useScrollY = () => {
  const [y, setY] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => setY(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return y;
};

const useImageColor = (imageUrl: string): string => {
  const [color, setColor] = useState("18, 18, 18");

  useEffect(() => {
    const colors = [
      "45, 85, 95",
      "95, 45, 65",
      "55, 65, 95",
      "85, 65, 45",
      "65, 55, 85",
    ];
    const hash = imageUrl
      .split("")
      .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    setColor(colors[Math.abs(hash) % colors.length]);
  }, [imageUrl]);

  return color;
};

const mockLyrics: LyricLine[] = [
  { time: 0, text: "در این شب‌های تنهایی" },
  { time: 4, text: "تو رو یادم میاد عزیزم" },
  { time: 8, text: "چقدر دلم برات تنگ شده" },
  { time: 12, text: "کاش می‌شد برگردی پیشم" },
  { time: 16, text: "هنوزم منتظرتم" },
  { time: 20, text: "توی خیابون‌های شهر" },
  { time: 24, text: "دنبال رد پاهاتم" },
  { time: 28, text: "هر جا که میرم" },
  { time: 32, text: "یاد تو میوفتم" },
  { time: 36, text: "این عشق تموم نمیشه" },
];

const mockCredits: Credit[] = [
  { role: "خواننده", name: "محسن یگانه" },
  { role: "آهنگساز", name: "محسن یگانه" },
  { role: "ترانه‌سرا", name: "امیر عباس گلاب" },
  { role: "تنظیم", name: "میلاد ترابی" },
  { role: "میکس و مستر", name: "استودیو آوا" },
];

const MOCK_SONGS: Song[] = CENTRALIZED_SONGS.map((s) => ({
  id: s.id,
  title: s.title,
  artist: s.artist,
  duration: s.duration,
  image: s.image,
  src: s.src,
}));

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

const IconButton: React.FC<{
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  active?: boolean;
  activeColor?: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  label?: string;
}> = ({
  onClick,
  active,
  activeColor = "text-emerald-400",
  size = "md",
  children,
  label,
}) => {
  const sizes = {
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-14 h-14",
  };

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-full flex items-center justify-center transition-all duration-200",
        "hover:bg-white/10 active:scale-95",
        sizes[size],
        active ? activeColor : "text-neutral-400 hover:text-white",
      )}
    >
      {children}
    </button>
  );
};

const PlayButton: React.FC<{
  onClick: () => void;
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg";
}> = ({ onClick, isPlaying, size = "lg" }) => {
  const sizes = {
    sm: { button: "w-10 h-10", icon: "w-[18px] h-[18px]" },
    md: { button: "w-12 h-12", icon: "w-[22px] h-[22px]" },
    lg: { button: "w-14 h-14", icon: "w-[26px] h-[26px]" },
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25",
        "hover:bg-emerald-400 hover:scale-105 active:scale-100",
        "transition-all duration-200 ease-out",
        sizes[size].button,
      )}
    >
      {isPlaying ? (
        <Icon
          name="pause"
          size={parseInt(sizes[size].icon.match(/\d+/)?.[0] || "24")}
          className="text-black"
        />
      ) : (
        <Icon
          name="play"
          size={parseInt(sizes[size].icon.match(/\d+/)?.[0] || "24")}
          className="text-black ml-0.5"
        />
      )}
    </button>
  );
};

const TrackRow = memo(
  ({
    track,
    index,
    onPlay,
  }: {
    track: Song;
    index: number;
    onPlay: (track: Song) => void;
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onPlay(track)}
        className={cn(
          "group flex items-center gap-4 p-3 rounded-lg cursor-pointer",
          "transition-colors duration-150",
          "hover:bg-white/5",
        )}
      >
        <div className="w-10 h-10 shrink-0 relative overflow-hidden rounded">
          <ImageWithPlaceholder
            src={track.image}
            alt={track.title}
            className="w-full h-full object-cover"
            type="song"
          />
          <div
            className={cn(
              "absolute inset-0 bg-black/60 flex items-center justify-center",
              "transition-opacity duration-150",
              isHovered ? "opacity-100" : "opacity-0",
            )}
          >
            <Icon name="play" size={18} className="text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {track.title}
          </p>
          <p className="text-neutral-400 text-xs truncate">{track.artist}</p>
        </div>
        <span className="text-neutral-500 text-xs">{track.duration}</span>
      </div>
    );
  },
);

TrackRow.displayName = "TrackRow";

const SectionHeader: React.FC<{
  title: string;
  action?: { label: string; onClick: () => void };
}> = ({ title, action }) => (
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-xl font-bold text-white">{title}</h2>
    {action && (
      <button
        onClick={action.onClick}
        className="text-sm text-neutral-400 hover:text-white transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);

const LyricsSection: React.FC<{
  lyrics: LyricLine[];
  currentTime?: number;
}> = ({ lyrics, currentTime = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedLyrics = isExpanded ? lyrics : lyrics.slice(0, 5);

  return (
    <section className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5">
      <div className="flex items-center gap-3 mb-5">
        <Icon name="microphone" size={22} className="text-emerald-400" />
        <h2 className="text-xl font-bold text-white">متن آهنگ</h2>
      </div>
      <div className="space-y-3">
        {lyrics.length > 0 ? (
          displayedLyrics.map((line, idx) => (
            <p
              key={idx}
              className={cn(
                "text-lg leading-relaxed transition-colors duration-300",
                currentTime >= line.time
                  ? "text-white font-medium"
                  : "text-neutral-400",
              )}
            >
              {line.text}
            </p>
          ))
        ) : (
          <div className="py-4">
            <p className="text-lg text-neutral-400 font-medium">
              هنوز متنی برای این آهنگ ثبت نشده است
            </p>
          </div>
        )}
      </div>
      {lyrics.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "mt-5 flex items-center gap-2 text-sm font-medium",
            "text-neutral-400 hover:text-white transition-colors",
          )}
        >
          {isExpanded ? (
            <>
              <Icon name="caretUp" size={16} />
              نمایش کمتر
            </>
          ) : (
            <>
              <Icon name="caretDown" size={16} />
              نمایش بیشتر
            </>
          )}
        </button>
      )}
    </section>
  );
};

const CreditsSection: React.FC<{ credits: Credit[] }> = ({ credits }) => (
  <section className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5">
    <div className="flex items-center gap-3 mb-5">
      <Icon name="user" size={22} className="text-emerald-400" />
      <h2 className="text-xl font-bold text-white">عوامل</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {credits.map((credit, idx) => (
        <div key={idx} className="flex items-center justify-between py-2">
          <span className="text-neutral-400 text-sm">{credit.role}</span>
          <span className="text-white text-sm font-medium">{credit.name}</span>
        </div>
      ))}
    </div>
  </section>
);

const ContextMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onArtistClick?: () => void;
}> = ({ isOpen, onClose, position, onArtistClick }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScrollStart = () => {
      if (isOpen) onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScrollStart, { passive: true });
      window.addEventListener("wheel", handleScrollStart, { passive: true });
      window.addEventListener("touchmove", handleScrollStart, {
        passive: true,
      });
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollStart);
      window.removeEventListener("wheel", handleScrollStart);
      window.removeEventListener("touchmove", handleScrollStart);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    ...(onArtistClick
      ? [
          {
            icon: <Icon name="user" size={20} />,
            label: "مشاهده هنرمند",
            onClick: onArtistClick,
          },
        ]
      : []),
    {
      icon: <Icon name="listPlus" size={20} />,
      label: "افزودن به پلی‌لیست",
      onClick: onClose,
    },
    {
      icon: <Icon name="queue" size={20} />,
      label: "افزودن به صف پخش",
      onClick: onClose,
    },
    {
      icon: <Icon name="shareNetwork" size={20} />,
      label: "اشتراک‌گذاری",
      onClick: onClose,
    },
    {
      icon: <Icon name="copy" size={20} />,
      label: "کپی لینک",
      onClick: onClose,
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{ top: position.y, left: position.x }}
      className={cn(
        "fixed z-50 min-w-[200px] py-2 bg-neutral-800 rounded-lg shadow-xl",
        "border border-white/10 animate-in fade-in zoom-in-95 duration-150",
      )}
    >
      {menuItems.map((item, idx) => (
        <button
          key={idx}
          onClick={item.onClick}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-right",
            "text-neutral-200 hover:bg-white/10 transition-colors",
          )}
        >
          <span className="text-neutral-400">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
};

const Toast: React.FC<{
  message: string;
  isVisible: boolean;
  type?: "success" | "info";
}> = ({ message, isVisible, type = "success" }) => (
  <div
    className={cn(
      "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
      "px-4 py-3 rounded-lg shadow-lg",
      "flex items-center gap-2",
      "transition-all duration-300 ease-out",
      type === "success" ? "bg-emerald-500" : "bg-neutral-700",
      isVisible
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-4 pointer-events-none",
    )}
  >
    {type === "success" && (
      <Icon name="check" size={18} className="text-white" />
    )}
    <span className="text-white text-sm font-medium">{message}</span>
  </div>
);

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-white/10 rounded", className)} />
);

export default function SongDetail({ id: propId }: { id?: string }) {
  const { navigateTo, goBack, currentPage, currentParams } = useNavigation();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    download,
  } = usePlayer();
  const { accessToken } = useAuth();

  const id = useMemo(() => {
    if (propId) return propId;
    if (currentParams?.id) return currentParams.id;
    const match =
      typeof currentPage === "string" ? currentPage.match(/song\/(.+)/) : null;
    return match ? decodeURIComponent(match[1]) : null;
  }, [propId, currentParams, currentPage]);

  const scrollY = useScrollY();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [fullSongData, setFullSongData] = useState<ApiSong | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0 });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAction = (action: string, song: any) => {
    console.log(`Action ${action} on song ${song.title}`);
  };

  useEffect(() => {
    const fetchSongDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const resp = await fetch(`https://api.sedabox.com/api/songs/${id}/`, {
          headers,
        });

        if (resp.ok) {
          const data: ApiSong = await resp.json();
          setFullSongData(data);
          setSong({
            id: data.id.toString(),
            title: data.title,
            artist: data.artist_name,
            artistId: data.artist_id || data.artist,
            duration: data.duration_display,
            image: data.cover_image,
            src: data.stream_url
              ? data.stream_url.replace("http://", "https://")
              : "",
          });
          setIsLiked(data.is_liked);
          setLikesCount(data.likes_count);
        } else {
          // Fallback to mock if needed or show error
          const foundSong = MOCK_SONGS.find((s) => s.id === id);
          setSong(foundSong || null);
        }
      } catch (err) {
        console.error("Failed to fetch song detail:", err);
        const foundSong = MOCK_SONGS.find((s) => s.id === id);
        setSong(foundSong || null);
      } finally {
        setLoading(false);
      }
    };

    fetchSongDetail();
  }, [id, accessToken]);

  const dominantColor = useImageColor(song?.image || "");
  const isCurrentTrack = currentTrack?.id === song?.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const headerOpacity = useMemo(() => Math.min(scrollY / 300, 1), [scrollY]);

  const similarTracks = useMemo(() => {
    if (fullSongData?.similar_songs?.items) {
      return fullSongData.similar_songs.items.map((item) => ({
        id: item.id.toString(),
        title: item.title,
        artist: item.artist_name,
        artistId: item.artist_id || item.artist,
        duration:
          item.duration_display ||
          (item.duration_seconds ? formatDuration(item.duration_seconds) : ""),
        image: item.cover_image,
        src: item.stream_url
          ? item.stream_url.replace("http://", "https://")
          : "",
      }));
    }
    return MOCK_SONGS.filter((s) => s.id !== id).slice(0, 4);
  }, [id, fullSongData]);

  const apiLyrics = useMemo((): LyricLine[] => {
    if (!fullSongData?.lyrics) return [];
    // If API provides a string, we might need to parse it if it's lrc format
    // For now assuming it's a plain text or we show it as one line if no timing
    return [{ time: 0, text: fullSongData.lyrics }];
  }, [fullSongData]);

  const apiCredits = useMemo((): Credit[] => {
    if (!fullSongData) return mockCredits;
    const credits: Credit[] = [];
    if (fullSongData.producers?.length)
      credits.push({
        role: "تهیه‌کننده",
        name: fullSongData.producers.join("، "),
      });
    if (fullSongData.composers?.length)
      credits.push({
        role: "آهنگساز",
        name: fullSongData.composers.join("، "),
      });
    if (fullSongData.lyricists?.length)
      credits.push({
        role: "ترانه‌سرا",
        name: fullSongData.lyricists.join("، "),
      });
    if (fullSongData.label)
      credits.push({ role: "ناشر", name: fullSongData.label });
    return credits.length ? credits : mockCredits;
  }, [fullSongData]);

  const showNotification = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      try {
        if (type === "success") toast.success(message);
        else toast.error(message);
      } catch (e) {
        // fall back to local toast state
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      }
    },
    [],
  );

  const handlePlay = useCallback(() => {
    if (!song) return;
    if (currentTrack?.id === song.id) {
      togglePlay();
      return;
    }
    playTrack(song);
  }, [song, playTrack, currentTrack, togglePlay]);

  const handleLike = useCallback(async () => {
    if (!song || !accessToken || isLiking) return;

    setIsLiking(true);
    try {
      const url = `https://api.sedabox.com/api/songs/${song.id}/like/`;
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const resp = await fetch(url, {
        method: "POST",
        headers,
      });

      if (resp.ok) {
        const data = await resp.json();
        setIsLiked(data.liked);
        setLikesCount(data.likes_count);
        showNotification(
          data.liked ? "به لایک‌ها اضافه شد" : "از لایک‌ها حذف شد",
        );
      } else {
        showNotification("خطا در بروزرسانی لایک");
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      showNotification("خطا در بروزرسانی لایک");
    } finally {
      setIsLiking(false);
    }
  }, [song, accessToken, isLiking, showNotification]);

  const handleDownload = useCallback(() => {
    if (song) {
      download(song);
    }
  }, [song, download]);

  const handleShare = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showNotification("لینک کپی شد");
  }, [showNotification]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  }, []);

  // Sync like state when other components (drawer/player) update a song
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent)?.detail;
        if (!detail) return;
        const sid = String(detail.id);
        if (song && String(song.id) === sid) {
          if (detail.liked !== undefined) setIsLiked(Boolean(detail.liked));
          if (detail.likes_count !== undefined)
            setLikesCount(Number(detail.likes_count));
        }
        if (fullSongData && String(fullSongData.id) === sid) {
          setFullSongData((prev) =>
            prev
              ? {
                  ...prev,
                  is_liked: detail.liked ?? prev.is_liked,
                  likes_count: detail.likes_count ?? prev.likes_count,
                }
              : prev,
          );
        }
      } catch (err) {
        console.error("Error handling song-like-changed in SongDetail:", err);
      }
    };

    window.addEventListener("song-like-changed", handler as EventListener);
    return () =>
      window.removeEventListener("song-like-changed", handler as EventListener);
  }, [song, fullSongData]);

  useEffect(() => {
    if (containerRef.current) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white pb-28" dir="rtl">
        <header className="fixed top-0 left-0 right-0 z-40 h-16 flex flex-row-reverse items-center justify-between px-4 md:px-6">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-32 h-6" />
          <div className="w-10" />
        </header>

        <section className="relative pt-20 pb-8 px-6 md:px-12">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
            <Skeleton className="w-52 h-52 md:w-64 md:h-64 rounded-lg" />
            <div className="flex-1 space-y-4 text-center md:text-right w-full">
              <Skeleton className="h-4 w-20 mx-auto md:mr-0" />
              <Skeleton className="h-12 w-3/4 mx-auto md:mr-0" />
              <Skeleton className="h-6 w-1/2 mx-auto md:mr-0" />
            </div>
          </div>
        </section>

        <section className="relative px-6 md:px-12 py-6">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </section>

        <main className="relative px-6 md:px-12 py-8 space-y-10">
          <div className="max-w-5xl mx-auto space-y-10">
            <Skeleton className="w-full h-48 rounded-2xl" />
            <Skeleton className="w-full h-32 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!song) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 text-white flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <Icon name="music" size={40} className="text-neutral-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">آهنگ پیدا نشد</h1>
          <p className="text-neutral-400 mb-8 max-w-sm">
            متاسفانه آهنگ مورد نظر یافت نشد. شاید حذف شده یا لینک اشتباه است.
          </p>
          <button
            onClick={goBack}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3",
              "bg-white text-black font-semibold rounded-full",
              "hover:scale-105 active:scale-100 transition-transform",
            )}
          >
            <Icon name="arrowLeft" size={20} />
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-neutral-950 text-white pb-28"
      dir="rtl"
      onContextMenu={handleContextMenu}
    >
      <div
        className="absolute inset-0 transition-colors duration-700 -z-10"
        style={{
          background: `linear-gradient(to bottom, rgb(${dominantColor}) 0%, rgb(18, 18, 18) 50%)`,
        }}
      />

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 h-16",
          "flex flex-row-reverse items-center justify-between px-4 md:px-6",
          "transition-all duration-300",
        )}
        style={{
          backgroundColor: `rgba(18, 18, 18, ${headerOpacity})`,
        }}
      >
        <button
          onClick={goBack}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-black/40 hover:bg-black/60 transition-colors",
          )}
        >
          <Icon name="arrowLeft" size={22} className="text-white" />
        </button>

        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 transition-opacity duration-200",
            headerOpacity > 0.7 ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="font-semibold text-white">{song.title}</span>
        </div>

        <div className="w-10" />
      </header>

      <section className="relative pt-20 pb-8 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          <div
            className={cn(
              "w-52 h-52 md:w-64 md:h-64 shrink-0",
              "rounded-lg overflow-hidden shadow-2xl shadow-black/50",
              "transition-transform duration-500",
              isCurrentlyPlaying && "scale-[1.02]",
            )}
          >
            <ImageWithPlaceholder
              src={song.image}
              alt={song.title}
              className="w-full h-full object-cover"
              type="song"
            />
          </div>

          <div className="flex-1 text-center md:text-right">
            <span className="text-xs font-medium text-white/80 uppercase tracking-widest">
              آهنگ
            </span>
            <h1 className="mt-3 text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
              {song.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-neutral-300">
              <button
                onClick={() => {
                  const artistId = song?.artistId || (song as any)?.artist_id;
                  if (artistId) {
                    navigateTo("artist-detail", { id: artistId });
                  }
                }}
                className="font-semibold text-white hover:underline cursor-pointer"
              >
                {song.artist}
              </button>
              <span className="text-neutral-500">•</span>
              <span className="flex items-center gap-1">
                <Icon name="clock" size={14} className="text-neutral-500" />
                {song.duration}
              </span>
              <span className="text-neutral-500">•</span>
              <span>
                {fullSongData
                  ? formatNumber(fullSongData.plays)
                  : formatNumber(1240000)}{" "}
                پخش
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 md:px-12 py-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <PlayButton
            onClick={handlePlay}
            isPlaying={isCurrentlyPlaying}
            size="lg"
          />

          <IconButton
            onClick={handleLike}
            active={isLiked}
            activeColor="text-emerald-400"
            label={isLiked ? "حذف از لایک‌ها" : "افزودن به لایک‌ها"}
          >
            {isLiking ? (
              <Spinner size="w-7 h-7" />
            ) : (
              <Icon name="heart" size={28} filled={isLiked} />
            )}
          </IconButton>

          <IconButton onClick={handleShare} label="اشتراک‌گذاری">
            <Icon name="shareNetwork" size={26} />
          </IconButton>

          <IconButton onClick={handleDownload} label="دانلود آهنگ">
            <Icon name="downloadSimple" size={28} />
          </IconButton>

          <IconButton
            onClick={() => setIsDrawerOpen(true)}
            label="گزینه‌های بیشتر"
          >
            <Icon name="dotsThree" size={28} />
          </IconButton>

          {isCurrentlyPlaying && (
            <div className="mr-auto flex items-center gap-2 text-emerald-400">
              <Icon name="waveform" size={20} className="animate-pulse" />
              <span className="text-sm font-medium">در حال پخش</span>
            </div>
          )}
        </div>
      </section>

      <main className="relative px-6 md:px-12 py-8 space-y-10">
        <div className="max-w-5xl mx-auto space-y-10">
          <LyricsSection lyrics={apiLyrics} currentTime={0} />
          <CreditsSection credits={apiCredits} />

          <section className="bg-neutral-900/50 rounded-2xl p-6 border border-white/5">
            <SectionHeader
              title="آهنگ‌های مشابه"
              action={{ label: "نمایش همه", onClick: () => {} }}
            />
            <div className="space-y-1">
              {similarTracks.map((t, idx) => (
                <TrackRow key={t.id} track={t} index={idx} onPlay={playTrack} />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "پخش‌ها",
                value: fullSongData ? formatNumber(fullSongData.plays) : "۱.۲M",
              },
              {
                label: "لایک‌ها",
                value: formatNumber(likesCount),
              },
              { label: "اشتراک‌ها", value: "۱۲K" },
              {
                label: "اضافه به پلی‌لیست",
                value: fullSongData
                  ? formatNumber(fullSongData.added_to_playlists_count)
                  : "۴۵K",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-xl p-5 text-center hover:bg-white/10 transition-colors"
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-neutral-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent pointer-events-none z-10" />

      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onArtistClick={
          song?.artistId || (song as any)?.artist_id
            ? () => {
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
                navigateTo("artist-detail", {
                  id: song.artistId || (song as any).artist_id,
                });
              }
            : undefined
        }
      />

      <SongOptionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        song={
          song
            ? { ...song, cover_image: song.image, artist_name: song.artist }
            : null
        }
        onAction={handleAction}
      />

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes zoom-in-95 {
          from {
            transform: scale(0.95);
          }
          to {
            transform: scale(1);
          }
        }
        .animate-in {
          animation:
            fade-in 150ms ease-out,
            zoom-in-95 150ms ease-out;
        }
      `}</style>
    </div>
  );
}
