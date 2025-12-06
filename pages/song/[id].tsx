import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { usePlayer, Track } from "../../contexts/PlayerContext";
import {
  Play,
  Pause,
  Heart,
  DotsThree,
  Clock,
  ArrowLeft,
  MusicNote,
  ShareNetwork,
  Plus,
  ListPlus,
  User,
  Microphone,
  Waveform,
  CaretDown,
  CaretUp,
  Check,
  X,
  Queue,
  DownloadSimple,
  Copy,
} from "@phosphor-icons/react";

// ============================================================================
// Types
// ============================================================================

interface LyricLine {
  time: number;
  text: string;
}

interface Credit {
  role: string;
  name: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function findTrackById(
  id: string,
  allTracks: Track[]
): Track | undefined {
  return allTracks.find((track) => track.id === id);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ============================================================================
// Mock Data
// ============================================================================

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

const mockSimilarTracks: Track[] = [
  {
    id: "sim-1",
    title: "بازم برگرد",
    artist: "محسن یگانه",
    duration: "4:15",
    image: "https://picsum.photos/seed/track1/300/300",
    src: "/music.mp3",
  },
  {
    id: "sim-2",
    title: "خواب",
    artist: "رضا بهرام",
    duration: "3:52",
    image: "https://picsum.photos/seed/track2/300/300",
    src: "/music.mp3",
  },
  {
    id: "sim-3",
    title: "دوست دارم",
    artist: "علیرضا طلیسچی",
    duration: "4:30",
    image: "https://picsum.photos/seed/track3/300/300",
    src: "/music.mp3",
  },
  {
    id: "sim-4",
    title: "عشق یعنی تو",
    artist: "ماکان بند",
    duration: "3:45",
    image: "https://picsum.photos/seed/track4/300/300",
    src: "/music.mp3",
  },
];

// ============================================================================
// Hooks
// ============================================================================

function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return scrollY;
}

function useImageColor(imageUrl: string): string {
  const [color, setColor] = useState("18, 18, 18");

  useEffect(() => {
    // Simulating color extraction - in production use a library like color-thief
    const colors = [
      "45, 85, 95", // teal
      "95, 45, 65", // burgundy
      "55, 65, 95", // navy
      "85, 65, 45", // brown
      "65, 55, 85", // purple
    ];
    const hash = imageUrl
      .split("")
      .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    setColor(colors[Math.abs(hash) % colors.length]);
  }, [imageUrl]);

  return color;
}

// ============================================================================
// Components
// ============================================================================

// Skeleton Loader
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-white/10 rounded", className)} />
);

// Icon Button
const IconButton: React.FC<{
  onClick?: () => void;
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
        active ? activeColor : "text-neutral-400 hover:text-white"
      )}
    >
      {children}
    </button>
  );
};

// Play Button
const PlayButton: React.FC<{
  onClick: () => void;
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg";
}> = ({ onClick, isPlaying, size = "lg" }) => {
  const sizes = {
    sm: { button: "w-10 h-10", icon: 18 },
    md: { button: "w-12 h-12", icon: 22 },
    lg: { button: "w-14 h-14", icon: 26 },
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25",
        "hover:bg-emerald-400 hover:scale-105 active:scale-100",
        "transition-all duration-200 ease-out",
        sizes[size].button
      )}
    >
      {isPlaying ? (
        <Pause size={sizes[size].icon} weight="fill" className="text-black" />
      ) : (
        <Play
          size={sizes[size].icon}
          weight="fill"
          className="text-black mr-[-2px]"
        />
      )}
    </button>
  );
};

// Track Row
const TrackRow: React.FC<{
  track: Track;
  index: number;
  onPlay: (track: Track) => void;
}> = ({ track, index, onPlay }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay(track)}
      className={cn(
        "group flex items-center gap-4 p-3 rounded-lg cursor-pointer",
        "transition-colors duration-150",
        "hover:bg-white/5"
      )}
    >
      <div className="w-10 h-10 flex-shrink-0 relative overflow-hidden rounded">
        <img
          src={track.image}
          alt={track.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div
          className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center",
            "transition-opacity duration-150",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Play size={18} weight="fill" className="text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{track.title}</p>
        <p className="text-neutral-400 text-xs truncate">{track.artist}</p>
      </div>
      <span className="text-neutral-500 text-xs">{track.duration}</span>
    </div>
  );
};

// Section Header
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

// Lyrics Section
const LyricsSection: React.FC<{
  lyrics: LyricLine[];
  currentTime?: number;
}> = ({ lyrics, currentTime = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedLyrics = isExpanded ? lyrics : lyrics.slice(0, 5);

  return (
    <section className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-5">
        <Microphone size={22} className="text-emerald-400" />
        <h2 className="text-xl font-bold text-white">متن آهنگ</h2>
      </div>
      <div className="space-y-3">
        {displayedLyrics.map((line, idx) => (
          <p
            key={idx}
            className={cn(
              "text-lg leading-relaxed transition-colors duration-300",
              currentTime >= line.time
                ? "text-white font-medium"
                : "text-neutral-400"
            )}
          >
            {line.text}
          </p>
        ))}
      </div>
      {lyrics.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "mt-5 flex items-center gap-2 text-sm font-medium",
            "text-neutral-400 hover:text-white transition-colors"
          )}
        >
          {isExpanded ? (
            <>
              <CaretUp size={16} />
              نمایش کمتر
            </>
          ) : (
            <>
              <CaretDown size={16} />
              نمایش بیشتر
            </>
          )}
        </button>
      )}
    </section>
  );
};

// Credits Section
const CreditsSection: React.FC<{ credits: Credit[] }> = ({ credits }) => (
  <section className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl p-6 backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-5">
      <User size={22} className="text-emerald-400" />
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

// Context Menu
const ContextMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}> = ({ isOpen, onClose, position }) => {
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
    { icon: <ListPlus size={20} />, label: "افزودن به پلی‌لیست" },
    { icon: <Queue size={20} />, label: "افزودن به صف پخش" },
    { icon: <DownloadSimple size={20} />, label: "دانلود" },
    { icon: <ShareNetwork size={20} />, label: "اشتراک‌گذاری" },
    { icon: <Copy size={20} />, label: "کپی لینک" },
  ];

  return (
    <div
      ref={menuRef}
      style={{ top: position.y, left: position.x }}
      className={cn(
        "fixed z-50 min-w-[200px] py-2 bg-neutral-800 rounded-lg shadow-xl",
        "border border-white/10 animate-in fade-in zoom-in-95 duration-150"
      )}
    >
      {menuItems.map((item, idx) => (
        <button
          key={idx}
          onClick={onClose}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-right",
            "text-neutral-200 hover:bg-white/10 transition-colors"
          )}
        >
          <span className="text-neutral-400">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
};

// Toast Notification
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
        : "opacity-0 translate-y-4 pointer-events-none"
    )}
  >
    {type === "success" && <Check size={18} className="text-white" />}
    <span className="text-white text-sm font-medium">{message}</span>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const SongDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { playTrack, currentTrack, isPlaying, queue, togglePlay } = usePlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0 });

  const scrollY = useScrollPosition();
  const allTracks = useMemo(() => queue, [queue]);

  const track = useMemo(() => {
    if (!id || typeof id !== "string") return null;
    return findTrackById(id, allTracks);
  }, [id, allTracks]);

  const dominantColor = useImageColor(track?.image || "");
  const isCurrentTrack = currentTrack?.id === track?.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const showNotification = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, []);

  const handlePlay = useCallback(() => {
    if (!track) return;

    // If this track is already the current track, toggle playback (pause/resume)
    // This avoids re-initializing the Howl and restarting the song.
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    // Otherwise, play the requested track
    playTrack(track);
  }, [track, playTrack, currentTrack, togglePlay]);

  const handleLike = useCallback(() => {
    setIsLiked((prev) => !prev);
    showNotification(isLiked ? "از لایک‌ها حذف شد" : "به لایک‌ها اضافه شد");
  }, [isLiked, showNotification]);

  const handleShare = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href);
    showNotification("لینک کپی شد");
  }, [showNotification]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY });
  }, []);

  // Header opacity based on scroll
  const headerOpacity = Math.min(scrollY / 300, 1);

  // Loading state
  if (!router.isReady) {
    return (
      <div className="min-h-screen bg-neutral-950" dir="rtl">
        <div className="relative h-[45vh] md:h-[55vh]">
          <Skeleton className="absolute inset-0" />
        </div>
        <div className="px-6 md:px-12 py-8 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="w-11 h-11 rounded-full" />
            <Skeleton className="w-11 h-11 rounded-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-1/2 h-4" />
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!track) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 text-white flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <MusicNote size={40} className="text-neutral-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">آهنگ پیدا نشد</h1>
          <p className="text-neutral-400 mb-8 max-w-sm">
            متاسفانه آهنگ مورد نظر یافت نشد. شاید حذف شده یا لینک اشتباه است.
          </p>
          <Link
            href="/"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3",
              "bg-white text-black font-semibold rounded-full",
              "hover:scale-105 active:scale-100 transition-transform"
            )}
          >
            <ArrowLeft size={20} />
            بازگشت به خانه
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-neutral-950 text-white pb-28"
      dir="rtl"
      onContextMenu={handleContextMenu}
    >
      {/* Dynamic Background */}
      <div
        className="fixed inset-0 transition-colors duration-700"
        style={{
          background: `linear-gradient(to bottom, rgb(${dominantColor}) 0%, rgb(18, 18, 18) 50%)`,
        }}
      />

      {/* Sticky Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 h-16",
          "flex flex-row-reverse items-center justify-between px-4 md:px-6",
          "transition-all duration-300"
        )}
        style={{
          backgroundColor: `rgba(18, 18, 18, ${headerOpacity})`,
          backdropFilter: headerOpacity > 0.5 ? "blur(12px)" : "none",
        }}
      >
        <button
          onClick={() => router.back()}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-black/40 hover:bg-black/60 transition-colors"
          )}
        >
          <ArrowLeft size={22} className="text-white" />
        </button>

        {/* Header Title (visible on scroll) */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 transition-opacity duration-200",
            headerOpacity > 0.7 ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="font-semibold text-white">{track.title}</span>
        </div>

        {/* Header Play Button (visible on scroll) */}
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-8 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          {/* Album Art */}
          <div
            className={cn(
              "w-52 h-52 md:w-64 md:h-64 flex-shrink-0",
              "rounded-lg overflow-hidden shadow-2xl shadow-black/50",
              "transition-transform duration-500",
              isCurrentlyPlaying && "scale-[1.02]"
            )}
          >
            <img
              src={track.image}
              alt={track.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Track Info */}
          <div className="flex-1 text-center md:text-right">
            <span className="text-xs font-medium text-white/80 uppercase tracking-widest">
              آهنگ
            </span>
            <h1 className="mt-3 text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight">
              {track.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-neutral-300">
              <Link
                href={`/artist/${encodeURIComponent(track.artist)}`}
                className="font-semibold text-white hover:underline"
              >
                {track.artist}
              </Link>
              <span className="text-neutral-500">•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-neutral-500" />
                {track.duration}
              </span>
              <span className="text-neutral-500">•</span>
              <span>{formatNumber(1240000)} پخش</span>
            </div>
          </div>
        </div>
      </section>

      {/* Actions Bar */}
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
            <Heart size={28} weight={isLiked ? "fill" : "regular"} />
          </IconButton>

          <IconButton onClick={handleShare} label="اشتراک‌گذاری">
            <ShareNetwork size={26} />
          </IconButton>

          <IconButton
            onClick={() => setContextMenu({ isOpen: true, x: 200, y: 300 })}
            label="گزینه‌های بیشتر"
          >
            <DotsThree size={28} weight="bold" />
          </IconButton>

          {/* Now Playing Indicator */}
          {isCurrentlyPlaying && (
            <div className="mr-auto flex items-center gap-2 text-emerald-400">
              <Waveform size={20} className="animate-pulse" />
              <span className="text-sm font-medium">در حال پخش</span>
            </div>
          )}
        </div>
      </section>

      {/* Content Sections */}
      <main className="relative px-6 md:px-12 py-8 space-y-10">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Lyrics */}
          <LyricsSection lyrics={mockLyrics} currentTime={8} />

          {/* Credits */}
          <CreditsSection credits={mockCredits} />

          {/* Similar Tracks */}
          <section className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-2xl p-6 backdrop-blur-sm">
            <SectionHeader
              title="آهنگ‌های مشابه"
              action={{ label: "نمایش همه", onClick: () => {} }}
            />
            <div className="space-y-1">
              {mockSimilarTracks.map((t, idx) => (
                <TrackRow key={t.id} track={t} index={idx} onPlay={playTrack} />
              ))}
            </div>
          </section>

          {/* Track Stats */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "پخش‌ها", value: "۱.۲M" },
              { label: "لایک‌ها", value: "۸۵K" },
              { label: "اشتراک‌ها", value: "۱۲K" },
              { label: "اضافه به پلی‌لیست", value: "۴۵K" },
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

      {/* Bottom Gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent pointer-events-none z-10" />

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        position={{ x: contextMenu.x, y: contextMenu.y }}
      />

      {/* Toast */}
      <Toast message={toastMessage} isVisible={showToast} />

      {/* Tailwind Animation */}
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
          animation: fade-in 150ms ease-out, zoom-in-95 150ms ease-out;
        }
      `}</style>
    </div>
  );
};

export default SongDetailPage;
