import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
// 2. ICONS (Centralized)
// ============================================================================

const ICONS = {
  play: "M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z",
  heart:
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  sparkle:
    "M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z",
  clock:
    "M12 6v6l4 2 M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z", // Combined circle + path
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
    setArrows({
      left: scrollLeft > 0,
      right: scrollLeft < scrollWidth - clientWidth - 10,
    });
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") =>
    ref.current?.scrollBy({
      left: (dir === "left" ? -0.8 : 0.8) * ref.current.clientWidth,
      behavior: "smooth",
    });

  return (
    <div className="relative group">
      {arrows.left && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-neutral-900/90 text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 -translate-x-2 group-hover:translate-x-0"
        >
          <Icon
            name="chevronRight"
            className="w-6 h-6 rotate-180"
            fill={false}
          />
        </button>
      )}
      <div
        ref={ref}
        onScroll={checkScroll}
        className={`flex gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth ${className}`}
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>
      {arrows.right && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-neutral-900/90 text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 translate-x-2 group-hover:translate-x-0"
        >
          <Icon name="chevronRight" className="w-6 h-6" fill={false} />
        </button>
      )}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-950 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showSeeAll?: boolean;
}> = ({ title, subtitle, icon, showSeeAll = true }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      {icon && <span className="text-2xl flex">{icon}</span>}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white hover:underline cursor-pointer">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-neutral-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    {showSeeAll && (
      <button className="flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-white transition-colors group">
        مشاهده همه
        <Icon
          name="chevronLeft"
          className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
          fill={false}
        />
      </button>
    )}
  </div>
);

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
    medium: { w: "w-44", h: "h-44" },
    large: { w: "w-56", h: "h-56" },
  }[size];

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col ${dims.w} rounded-lg bg-neutral-900/50 hover:bg-neutral-800/80 p-3 transition-all duration-300 text-left backdrop-blur-sm border border-white/5 hover:border-white/10`}
    >
      <div
        className={`relative ${dims.h} w-full rounded-md overflow-hidden mb-4 shadow-xl`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient}`}
        />
        <FadeImage
          src={playlist.image}
          alt={playlist.title}
          className={`absolute inset-0 w-full h-full object-cover ${
            isHovered ? "scale-105" : "scale-100"
          }`}
        />
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute bottom-2 right-2 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 hover:bg-green-400 ${
            isHovered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <Icon name="play" className="w-5 h-5 text-black ml-0.5" />
        </div>

        <div className="absolute top-2 left-2 flex gap-2">
          {playlist.isNew && (
            <span className="px-2 py-1 text-[10px] font-bold  bg-blue-500 text-white rounded-sm shadow-lg">
              جدید
            </span>
          )}
          {playlist.isPremium && (
            <span className="px-2 py-1 text-[10px] font-bold  bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-sm shadow-lg flex items-center gap-1">
              <Icon name="premium" className="w-3 h-3" />
              ویژه
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-white truncate text-sm md:text-base mb-1">
          {playlist.title}
        </h3>
        <p className="text-xs md:text-sm text-neutral-400 line-clamp-2 leading-relaxed">
          {playlist.description}
        </p>
        {showMeta && (
          <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <Icon name="music" className="w-3 h-3" />
              {playlist.songsCount}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="clock" className="w-3 h-3" fill={false} />
              {playlist.duration}
            </span>
            {playlist.followers && (
              <span className="flex items-center gap-1">
                <Icon name="heart" className="w-3 h-3" fill={false} />
                {playlist.followers}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

const FeaturedPlaylistCard: React.FC<{ playlist: Playlist }> = ({
  playlist,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-64 md:h-80 rounded-xl overflow-hidden text-left w-full"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient}`}
      />
      <FadeImage
        src={playlist.image}
        alt={playlist.title}
        className={`absolute inset-0 w-full h-full object-cover ${
          isHovered ? "scale-110" : "scale-100"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6">
        {playlist.isNew && (
          <div className="mb-2">
            <span className="px-2 py-0.5 text-[10px] font-bold  bg-green-500 text-black rounded-full">
              به‌روزرسانی
            </span>
          </div>
        )}
        <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
          {playlist.title}
        </h2>
        <p className="text-sm md:text-base text-neutral-300 mb-4 max-w-md">
          {playlist.description}
        </p>
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-2xl transform transition-all hover:scale-110 ${
              isHovered ? "scale-100" : "scale-90"
            }`}
          >
            <Icon name="play" className="w-6 h-6 text-black ml-0.5" />
          </div>
          <div className="text-sm text-neutral-400">
            <span className="text-white font">{playlist.followers}</span> پسند •{" "}
            {playlist.songsCount} آهنگ
          </div>
        </div>
      </div>
    </button>
  );
};

const QuickPickCard: React.FC<{ playlist: Playlist }> = ({ playlist }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex items-center bg-white/10 hover:bg-white/20 rounded-md overflow-hidden transition-all h-14 md:h-16"
    >
      <div className="relative w-14 h-14 md:w-16 md:h-16 flex-shrink-0">
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
        <span className="font-bold text-white text-sm md:text-base truncate block">
          {playlist.title}
        </span>
      </div>
      <div
        className={`w-10 h-10 mr-2 rounded-full bg-green-500 flex items-center justify-center shadow-xl transform transition-all ${
          isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
      >
        <Icon name="play" className="w-4 h-4 text-black ml-0.5" />
      </div>
    </button>
  );
};

// ============================================================================
// 5. MAIN PAGE & LOGIC
// ============================================================================

const PlaylistsPage: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12)
      return {
        greeting: "صبح بخیر",
        icon: "🌅",
        gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
        picks: [...FOCUS_PLAYLISTS.slice(0, 3), ...CHILL_PLAYLISTS.slice(0, 3)],
      };
    if (h >= 12 && h < 17)
      return {
        greeting: "ظهر بخیر",
        icon: "☀️",
        gradient: "from-yellow-500/20 via-amber-500/10 to-transparent",
        picks: [...MADE_FOR_YOU.slice(0, 3), ...WORKOUT_PLAYLISTS.slice(0, 3)],
      };
    if (h >= 17 && h < 21)
      return {
        greeting: "عصر بخیر",
        icon: "🌆",
        gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
        picks: [...PARTY_PLAYLISTS.slice(0, 3), ...CHILL_PLAYLISTS.slice(0, 3)],
      };
    return {
      greeting: "شب بخیر",
      icon: "🌙",
      gradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
      picks: [...SLEEP_PLAYLISTS, ...CHILL_PLAYLISTS.slice(0, 4)],
    };
  }, []);

  // Helper for rendering different section types
  const SectionBuilder = ({
    config,
  }: {
    config: (typeof SECTIONS_CONFIG)[0];
  }) => (
    <section>
      <SectionHeader
        title={config.title}
        subtitle={config.subtitle}
        icon={config.icon}
      />
      {config.type === "grid" ? (
        <div
          className={`grid ${
            config.gridCols || "grid-cols-2 md:grid-cols-4"
          } gap-4`}
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
    </section>
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white"
      dir="rtl"
    >
      {/* Hero */}
      <header
        className={`relative bg-gradient-to-b ${timeOfDay.gradient} to-transparent pt-8 pb-12`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-4xl">{timeOfDay.icon}</span>
            <h1 className="text-3xl md:text-4xl ">{timeOfDay.greeting}</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {timeOfDay.picks.map((p) => (
              <QuickPickCard key={p.id} playlist={p} />
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pb-24 space-y-12">
        {/* Moods */}
        <section className="pt-4">
          <SectionHeader
            title="حالت چطوره؟"
            subtitle="یک حال انتخاب کن تا پلی‌لیست مناسب رو پیدا کنیم"
            icon="🎭"
            showSeeAll={false}
          />
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
            {MOOD_CHIPS.map((m) => (
              <button
                key={m.id}
                onClick={() =>
                  setSelectedMood(selectedMood === m.id ? null : m.id)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full font text-sm transition-all whitespace-nowrap ${
                  selectedMood === m.id
                    ? `bg-gradient-to-r ${m.gradient} text-white shadow-lg scale-105`
                    : "bg-neutral-800/80 hover:bg-neutral-700/80 hover:scale-105"
                }`}
              >
                <span className="text-lg">
                  {React.createElement(moodIcons[m.iconKey], { size: 24 })}
                </span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured */}
        <section>
          <SectionHeader
            title="ویژه‌ها"
            icon={<Icon name="fire" className="w-6 h-6 text-orange-500" />}
          />
          <FeaturedPlaylistCard playlist={FEATURED_PLAYLISTS[0]} />
        </section>

        {/* Render Configured Sections */}
        {SECTIONS_CONFIG.map((section, idx) => (
          <SectionBuilder key={idx} config={section} />
        ))}

        {/* Footer */}
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none" />
    </div>
  );
};

const GenreCard: React.FC<{ genre: any }> = ({ genre }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative h-28 rounded-lg overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.98]"
      style={{ backgroundColor: genre.color }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 transition-transform duration-700 ${
          isHovered ? "translate-x-full" : "-translate-x-full"
        }`}
      />
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <span className="font-bold text-white text-lg">{genre.name}</span>
        <span className="text-white/70 text-xs">
          {genre.count ? genre.count.replace("+", "+") : ""}
        </span>
      </div>
      <span className="absolute bottom-2 right-2 text-4xl transform rotate-12 opacity-80">
        {genre.icon}
      </span>
    </button>
  );
};

export default PlaylistsPage;

// ============================================================================
// 6. DATA (Compact)
// ============================================================================

// Config for main page sections to avoid repetitive JSX
const SECTIONS_CONFIG = [
  {
    title: "مرور بر اساس ژانر",
    subtitle: "موسیقی را بر اساس دسته‌بندی کشف کن",
    icon: <Palette size={24} className="text-pink-400" />,
    data: GENRE_CATEGORIES,
    type: "grid",
    component: "Genre",
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  },
  {
    title: "برای شما",
    subtitle: "پیشنهادهای بهتر دریافت کن",
    icon: <Sparkle size={24} className="text-green-500" />,
    data: MADE_FOR_YOU,
    cardSize: "medium",
  },
  {
    title: "محبوب‌ترین‌های امروز",
    icon: <Fire size={24} className="text-orange-500" />,
    data: [...FEATURED_PLAYLISTS, ...PARTY_PLAYLISTS],
    cardSize: "large",
  },
  {
    title: "تمرکز و بهره‌وری",
    subtitle: "موسیقی برای تمرکز بیشتر",
    icon: <Target size={24} className="text-purple-500" />,
    data: FOCUS_PLAYLISTS,
    cardSize: "medium",
  },
  {
    title: "ورزش",
    subtitle: "با این پلی‌لیست‌ها انرژی بگیر",
    icon: <Barbell size={24} className="text-red-500" />,
    data: WORKOUT_PLAYLISTS,
    cardSize: "medium",
  },
  {
    title: "آرامش",
    subtitle: "ریلکس کن و استراحت کن",
    icon: <Smiley size={24} className="text-yellow-400" />,
    data: CHILL_PLAYLISTS,
    cardSize: "medium",
  },

  {
    title: "خواب",
    subtitle: "با صداهای آرامش‌بخش بخواب",
    icon: <Moon size={24} className="text-indigo-400" />,
    data: [...SLEEP_PLAYLISTS, ...CHILL_PLAYLISTS.slice(0, 2)],
    cardSize: "medium",
  },
  {
    title: "مهمانی",
    subtitle: "صدا رو زیاد کن!",
    icon: <Confetti size={24} className="text-pink-500" />,
    data: PARTY_PLAYLISTS,
    cardSize: "medium",
  },
];
