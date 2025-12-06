import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

// -----------------------------------------------------------------------------
// 0. MOCK DATA IMPORTS (Assumed from your existing structure)
// -----------------------------------------------------------------------------
import {
  Playlist,
  MoodChip,
  MOOD_CHIPS,
  FEATURED_PLAYLISTS,
  MADE_FOR_YOU,
  FOCUS_PLAYLISTS,
  WORKOUT_PLAYLISTS,
  CHILL_PLAYLISTS,
  PARTY_PLAYLISTS,
  DECADES_PLAYLISTS,
  SLEEP_PLAYLISTS,
  GENRE_CATEGORIES,
  MoodIconKey,
} from "../components/mockData";

// Import slug utility
import { createSlug } from "./playlists/[slug]";

import {
  Palette,
  Sparkle,
  Fire,
  Target,
  Barbell,
  Smiley,
  Moon,
  Confetti,
  SmileyXEyes,
  Lightning,
  Heart,
  CloudRain,
  Bird,
  SmileyBlank,
  Waveform,
} from "@phosphor-icons/react";

// ============================================================================
// 1. ICONS
// ============================================================================

const ICONS = {
  play: "M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z",
  heart:
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  sparkle:
    "M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z",
  clock:
    "M12 6v6l4 2 M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z",
  music:
    "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  fire: "M12 23c-3.866 0-7-3.134-7-7 0-2.485 1.394-4.766 3.5-6.326V8c0-3.866 3.134-7 7-7v2c-2.761 0-5 2.239-5 5v1.674C12.406 11.167 14 13.395 14 16c0 3.866-3.134 7-7 7h5c3.866 0 7-3.134 7-7 0-5.144-4.055-9.635-9-11.622V2.054C16.746 4.132 21 9.543 21 16c0 3.866-3.134 7-7 7h-2z",
  chevronRight: "M9 18l6-6-6-6",
  chevronLeft: "M15 6l-6 6 6 6",
  premium:
    "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-12V3m0 18v-2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
};

const moodIcons: Record<MoodIconKey, React.ComponentType<any>> = {
  happy: Smiley,
  relaxing: Waveform,
  energetic: Lightning,
  focus: Target,
  romantic: Heart,
  sad: CloudRain,
  party: Confetti,
  calm: Bird,
};

const Icon: React.FC<{
  name: keyof typeof ICONS;
  className?: string;
  fill?: boolean;
}> = ({ name, className, fill = true }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={fill ? "currentColor" : "none"}
    stroke={!fill ? "currentColor" : "none"}
    strokeWidth={!fill ? 2 : 0}
  >
    <path d={ICONS[name]} />
  </svg>
);

// ============================================================================
// 2. REFACTORED STICKY HEADER
// ============================================================================

/**
 * Enhanced Section Header
 * Uses position: sticky to create the smooth "push" effect.
 * Includes backdrop blur and glassmorphism styling.
 */
const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showSeeAll?: boolean;
}> = ({ title, subtitle, icon, showSeeAll = true }) => (
  <div className="sticky top-0 z-40 mb-6 -mx-4 px-4 pt-4 pb-3 transition-all duration-300 bg-neutral-950/85 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 group">
        {icon && (
          <span className="text-2xl flex transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            {icon}
          </span>
        )}
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none group-hover:text-green-400 transition-colors">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs md:text-sm text-neutral-400 mt-1 font-medium leading-none opacity-80">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {showSeeAll && (
        <button className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm group">
          مشاهده همه
          <Icon
            name="chevronLeft"
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
            fill={false}
          />
        </button>
      )}
    </div>
    {/* Decorative gradient line at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

// ============================================================================
// 3. UTILITY COMPONENTS
// ============================================================================

const FadeImage: React.FC<{ src: string; alt: string; className: string }> = ({
  src,
  alt,
  className,
}) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      onLoad={() => setLoaded(true)}
      className={`${className} transition-all duration-500 ${
        loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
      }`}
    />
  );
};

const HorizontalScroll: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState({ left: false, right: true });

  const checkScroll = useCallback(() => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    // Note: scrollLeft is negative in RTL or handled differently depending on browser
    // This logic handles standard RTL implementation
    const isRTL = true; // Hardcoded for this design
    const scrollVal = Math.abs(scrollLeft);

    setArrows({
      left: scrollVal > 10,
      right: scrollVal < scrollWidth - clientWidth - 10,
    });
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    // In RTL, negative scrollLeft moves left, positive moves right (conceptually)
    // Adjusting math for RTL context
    const amount = (dir === "left" ? -0.8 : 0.8) * ref.current.clientWidth;
    ref.current.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group/scroll">
      <div
        ref={ref}
        onScroll={checkScroll}
        className={`flex gap-4 overflow-x-auto scrollbar-hide pb-4 pt-2 px-1 scroll-smooth ${className}`}
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>

      {/* Navigation Buttons - Adjusted Z-index to sit below sticky header but above content */}
      {arrows.left && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-neutral-900/90 text-white flex items-center justify-center shadow-xl opacity-0 group-hover/scroll:opacity-100 transition-all hover:scale-110 border border-white/10"
        >
          <Icon
            name="chevronRight"
            className="w-5 h-5 rotate-180"
            fill={false}
          />
        </button>
      )}
      {arrows.right && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-neutral-900/90 text-white flex items-center justify-center shadow-xl opacity-0 group-hover/scroll:opacity-100 transition-all hover:scale-110 border border-white/10"
        >
          <Icon name="chevronRight" className="w-5 h-5" fill={false} />
        </button>
      )}

      {/* Fade Gradients */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-neutral-950 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none z-10" />
    </div>
  );
};

// ============================================================================
// 4. CARD COMPONENTS
// ============================================================================

const PlaylistCard: React.FC<{
  playlist: Playlist;
  size?: "small" | "medium" | "large";
  showMeta?: boolean;
}> = ({ playlist, size = "medium", showMeta = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  const dims = {
    small: { w: "w-32", h: "h-32" },
    medium: { w: "w-40 md:w-44", h: "h-40 md:h-44" },
    large: { w: "w-56", h: "h-56" },
  }[size];

  const playlistSlug = createSlug(playlist.title);

  return (
    <Link
      href={`/playlists/${playlistSlug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col ${dims.w} rounded-xl bg-neutral-900/40 hover:bg-neutral-800/60 p-3 transition-all duration-300 text-left backdrop-blur-sm border border-white/5 hover:border-white/10 shadow-lg`}
    >
      <div
        className={`relative ${dims.h} w-full rounded-lg overflow-hidden mb-3 shadow-2xl bg-neutral-800`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient}`}
        />
        <FadeImage
          src={playlist.image}
          alt={playlist.title}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out ${
            isHovered ? "scale-105" : "scale-100"
          }`}
        />
        <div
          className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
            isHovered ? "opacity-0" : "opacity-20"
          }`}
        />

        <div
          className={`absolute bottom-3 right-3 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-2xl transform transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) hover:bg-green-400 hover:scale-110 ${
            isHovered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Icon name="play" className="w-5 h-5 text-black ml-0.5" />
        </div>

        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {playlist.isNew && (
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-500 text-white rounded-sm shadow-lg">
              جدید
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <h3 className="font-bold text-white truncate text-sm md:text-[15px] mb-1 leading-tight group-hover:text-green-400 transition-colors">
          {playlist.title}
        </h3>
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
          {playlist.description}
        </p>
      </div>
    </Link>
  );
};

const FeaturedPlaylistCard: React.FC<{ playlist: Playlist }> = ({
  playlist,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const playlistSlug = createSlug(playlist.title);

  return (
    <Link
      href={`/playlists/${playlistSlug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-72 md:h-96 rounded-2xl overflow-hidden text-left w-full block shadow-2xl ring-1 ring-white/10"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient}`}
      />
      <FadeImage
        src={playlist.image}
        alt={playlist.title}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out ${
          isHovered ? "scale-105" : "scale-100"
        }`}
      />
      {/* Cinematic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col items-start">
        {playlist.isNew && (
          <div className="mb-3 transform translate-y-0 opacity-100 transition-all">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-green-500 text-black rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              پیشنهاد ویژه
            </span>
          </div>
        )}
        <h2 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
          {playlist.title}
        </h2>
        <p className="text-sm md:text-lg text-neutral-200 mb-6 max-w-xl line-clamp-2 drop-shadow-md">
          {playlist.description}
        </p>
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-900/50 transform transition-all duration-300 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
          >
            <Icon name="play" className="w-6 h-6 text-black ml-1" />
          </div>
          <div className="flex flex-col text-xs md:text-sm font-medium text-neutral-300">
            <span className="text-white font-bold text-base">
              {playlist.followers} پسند
            </span>
            <span className="opacity-70">{playlist.songsCount} آهنگ منتخب</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const QuickPickCard: React.FC<{ playlist: Playlist }> = ({ playlist }) => {
  const [isHovered, setIsHovered] = useState(false);
  const playlistSlug = createSlug(playlist.title);

  return (
    <Link
      href={`/playlists/${playlistSlug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex items-center bg-white/5 hover:bg-white/10 rounded-md overflow-hidden transition-all duration-300 h-12 md:h-14 border border-white/5 hover:border-white/10"
    >
      <div className="relative w-12 h-12 md:w-14 md:h-14 flex-shrink-0">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient}`}
        />
        <FadeImage
          src={playlist.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover shadow-lg"
        />
      </div>
      <div className="flex-1 min-w-0 px-3 md:px-4">
        <span className="font-bold text-white text-xs md:text-sm truncate block group-hover:text-green-400 transition-colors">
          {playlist.title}
        </span>
      </div>
      <div
        className={`w-8 h-8 mr-3 rounded-full bg-green-500 flex items-center justify-center shadow-xl transform transition-all duration-300 ${
          isHovered
            ? "opacity-100 scale-100 translate-x-0"
            : "opacity-0 scale-75 translate-x-2"
        }`}
      >
        <Icon name="play" className="w-3 h-3 text-black ml-0.5" />
      </div>
    </Link>
  );
};

const GenreCard: React.FC<{ genre: any }> = ({ genre }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative h-28 md:h-32 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg group"
      style={{ backgroundColor: genre.color }}
    >
      {/* Shine effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 transition-transform duration-1000 ease-in-out ${
          isHovered ? "translate-x-full" : "-translate-x-full"
        }`}
      />
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <span className="font-bold text-white text-lg md:text-xl drop-shadow-md">
          {genre.name}
        </span>
        <div className="w-8 h-1 bg-white/30 rounded-full" />
      </div>
      <span className="absolute -bottom-2 -right-3 text-5xl md:text-6xl transform rotate-[25deg] opacity-90 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110 drop-shadow-xl">
        {genre.icon}
      </span>
    </button>
  );
};

// ============================================================================
// 5. MAIN PAGE
// ============================================================================

const PlaylistsPage: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12)
      return {
        greeting: "صبح بخیر",
        icon: "🌅",
        gradient: "from-amber-600/30 via-orange-900/10 to-transparent",
        picks: [...FOCUS_PLAYLISTS.slice(0, 3), ...CHILL_PLAYLISTS.slice(0, 3)],
      };
    if (h >= 12 && h < 17)
      return {
        greeting: "ظهر بخیر",
        icon: "☀️",
        gradient: "from-blue-600/30 via-cyan-900/10 to-transparent",
        picks: [...MADE_FOR_YOU.slice(0, 3), ...WORKOUT_PLAYLISTS.slice(0, 3)],
      };
    if (h >= 17 && h < 21)
      return {
        greeting: "عصر بخیر",
        icon: "🌆",
        gradient: "from-purple-600/30 via-pink-900/10 to-transparent",
        picks: [...PARTY_PLAYLISTS.slice(0, 3), ...CHILL_PLAYLISTS.slice(0, 3)],
      };
    return {
      greeting: "شب بخیر",
      icon: "🌙",
      gradient: "from-indigo-800/30 via-slate-900/10 to-transparent",
      picks: [...SLEEP_PLAYLISTS, ...CHILL_PLAYLISTS.slice(0, 4)],
    };
  }, []);

  // Updated SectionBuilder to support native sticky stacking behavior
  // The 'relative' class on the section is key: the header sticks relative to this container.
  const SectionBuilder = ({
    config,
  }: {
    config: (typeof SECTIONS_CONFIG)[0];
  }) => (
    <section className="relative group/section pb-8">
      <SectionHeader
        title={config.title}
        subtitle={config.subtitle}
        icon={config.icon}
      />

      <div className="px-1">
        {config.type === "grid" ? (
          <div
            className={`grid ${
              config.gridCols || "grid-cols-2 md:grid-cols-4"
            } gap-4 md:gap-6`}
          >
            {config.data.map((item: any) =>
              config.component === "Genre" ? (
                <GenreCard key={item.id} genre={item} />
              ) : (
                <PlaylistCard
                  key={item.id}
                  playlist={item}
                  size="small"
                  showMeta={false}
                />
              )
            )}
          </div>
        ) : (
          <HorizontalScroll>
            {config.data.map((p: any) => (
              <PlaylistCard
                key={p.id}
                playlist={p}
                size={config.cardSize as any}
              />
            ))}
          </HorizontalScroll>
        )}
      </div>
    </section>
  );

  return (
    <div
      className="min-h-screen bg-neutral-950 text-white selection:bg-green-500/30"
      dir="rtl"
    >
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-neutral-800/20 via-neutral-950 to-neutral-950 pointer-events-none" />

      {/* Hero Header */}
      <header
        className={`relative z-10 bg-gradient-to-b ${timeOfDay.gradient} pt-12 pb-4`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex sticky items-center gap-4 mb-8 animate-fade-in-up">
            <span className="text-4xl md:text-5xl drop-shadow-lg filter">
              {timeOfDay.icon}
            </span>
            <h1 className="text-2xl md:text-6xl font-black tracking-tight">
              {timeOfDay.greeting}
            </h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4">
            {timeOfDay.picks.map((p) => (
              <QuickPickCard key={p.id} playlist={p} />
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-32 space-y-4">
        {/* Moods Section - Wrapped in Relative for Sticky Header */}
        <section className="relative pb-8">
          <SectionHeader
            title="حالت چطوره؟"
            subtitle="یک حال انتخاب کن تا پلی‌لیست مناسب رو پیدا کنیم"
            icon="🎭"
            showSeeAll={false}
          />
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
            {MOOD_CHIPS.map((m) => (
              <button
                key={m.id}
                onClick={() =>
                  setSelectedMood(selectedMood === m.id ? null : m.id)
                }
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 whitespace-nowrap border ${
                  selectedMood === m.id
                    ? `bg-gradient-to-r ${m.gradient} text-white border-transparent shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105`
                    : "bg-neutral-900/50 text-neutral-300 border-white/5 hover:border-white/20 hover:bg-neutral-800 hover:scale-105"
                }`}
              >
                <span className="text-xl">
                  {React.createElement(moodIcons[m.iconKey], {
                    size: 20,
                    weight: "fill",
                  })}
                </span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured Section - Wrapped */}
        <section className="relative pb-8">
          <SectionHeader
            title="ویژه‌ها"
            icon={<Icon name="fire" className="w-6 h-6 text-orange-500" />}
          />
          <FeaturedPlaylistCard playlist={FEATURED_PLAYLISTS[0]} />
        </section>

        {/* Dynamic Configured Sections */}
        {SECTIONS_CONFIG.map((section, idx) => (
          <SectionBuilder key={idx} config={section} />
        ))}
      </main>

      {/* Bottom Gradient Fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent pointer-events-none z-50" />
    </div>
  );
};

export default PlaylistsPage;

// ============================================================================
// 6. DATA CONFIG
// ============================================================================

const SECTIONS_CONFIG = [
  {
    title: "مرور بر اساس ژانر",
    subtitle: "موسیقی را بر اساس دسته‌بندی کشف کن",
    icon: <Palette size={24} className="text-pink-400" weight="duotone" />,
    data: GENRE_CATEGORIES,
    type: "grid",
    component: "Genre",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  },
  {
    title: "برای شما",
    subtitle: "پیشنهادهای اختصاصی بر اساس سلیقه شما",
    icon: <Sparkle size={24} className="text-green-500" weight="fill" />,
    data: MADE_FOR_YOU,
    cardSize: "medium",
  },
  {
    title: "محبوب‌ترین‌های امروز",
    icon: <Fire size={24} className="text-orange-500" weight="fill" />,
    data: [...FEATURED_PLAYLISTS, ...PARTY_PLAYLISTS],
    cardSize: "large",
  },
  {
    title: "تمرکز و بهره‌وری",
    subtitle: "موسیقی بدون کلام برای تمرکز بیشتر",
    icon: <Target size={24} className="text-purple-500" weight="duotone" />,
    data: FOCUS_PLAYLISTS,
    cardSize: "medium",
  },
  {
    title: "ورزش",
    subtitle: "با این پلی‌لیست‌ها انرژی بگیر",
    icon: <Barbell size={24} className="text-red-500" weight="fill" />,
    data: WORKOUT_PLAYLISTS,
    cardSize: "medium",
  },
  {
    title: "آرامش",
    subtitle: "ریلکس کن و استراحت کن",
    icon: <Smiley size={24} className="text-yellow-400" weight="duotone" />,
    data: CHILL_PLAYLISTS,
    cardSize: "medium",
  },
  {
    title: "خواب",
    subtitle: "با صداهای آرامش‌بخش بخواب",
    icon: <Moon size={24} className="text-indigo-400" weight="fill" />,
    data: [...SLEEP_PLAYLISTS, ...CHILL_PLAYLISTS.slice(0, 2)],
    cardSize: "medium",
  },
  {
    title: "مهمانی",
    subtitle: "صدا رو زیاد کن!",
    icon: <Confetti size={24} className="text-pink-500" weight="fill" />,
    data: PARTY_PLAYLISTS,
    cardSize: "medium",
  },
];
