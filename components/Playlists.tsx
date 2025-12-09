"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import Image from "next/image";

// -----------------------------------------------------------------------------
// 0. MOCK DATA IMPORTS (adjusted path for this project)
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
  createSlug,
} from "./mockData";
import { useNavigation } from "./NavigationContext";

// ============================================================================
// 1. ICONS (SVG Replacements)
// ============================================================================

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

const ICON_PATHS: Record<string, string> = {
  play: "M8 5v14l11-7z",
  heart:
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  sparkle:
    "M12 2L9.19 8.63L2 12L9.19 15.37L12 22L14.81 15.37L22 12L14.81 8.63L12 2Z",
  clock:
    "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  music:
    "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  fire: "M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z",
  chevronRight: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  chevronLeft: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  premium:
    "M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5 9.5 9.75 12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z",
  sun: "M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z",
  moon: "M9 2c-1.05 0-2.05.16-3 .46 2.89 1.86 4.8 5.05 4.8 8.74 0 4.6-3.08 8.55-7.44 9.95.95.53 2.04.85 3.2.85 3.87 0 7-3.13 7-7s-3.13-7-7-7z",
  palette:
    "M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  target:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z",
  barbell:
    "M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 2 7.71l1.43 1.43L2 10.57 5.57 14.14 7 12.71 15.57 21.29 12 24.86 13.43 26.29 14.86 24.86 16.29 26.29 18.43 24.14 22 20.57l-1.43-1.43z",
  smiley:
    "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z",
  confetti:
    "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z",
  lightning: "M7 2v11h3v9l7-12h-4l4-8z",
  cloudRain:
    "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-2 3h-2l2-3h2zm5 0l-2 3h-2l2-3h2z",
  bird: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z",
  waveform: "M12 3v18M8 6v12M4 9v6M16 6v12M20 9v6",
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

const MoodIcons: Record<MoodIconKey, React.FC<{ className?: string }>> = {
  happy: ({ className }) => <Icon name="smiley" className={className} />,
  relaxing: ({ className }) => (
    <Icon name="waveform" className={className} fill={false} />
  ),
  energetic: ({ className }) => <Icon name="lightning" className={className} />,
  focus: ({ className }) => <Icon name="target" className={className} />,
  romantic: ({ className }) => <Icon name="heart" className={className} />,
  sad: ({ className }) => <Icon name="cloudRain" className={className} />,
  party: ({ className }) => <Icon name="confetti" className={className} />,
  calm: ({ className }) => <Icon name="bird" className={className} />,
};

// ============================================================================
// 2. STICKY HEADER + UTILS
// ============================================================================

const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  showSeeAll?: boolean;
}> = ({ title, subtitle, icon, showSeeAll = true }) => (
  <div className="sticky top-0 z-40 mb-6 -mx-4 px-4 pt-4 pb-3 transition-all duration-300 bg-neutral-950/95 border-b border-white/5 shadow-lg shadow-black/20">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 group">
        {icon && (
          <span className="text-2xl flex transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 will-change-transform">
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
        <button className="flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-white transition-all bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-full group">
          مشاهده همه
          <Icon
            name="chevronLeft"
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform will-change-transform"
            fill={false}
          />
        </button>
      )}
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

const FadeImage: React.FC<{
  src: string;
  alt: string;
  className: string;
  sizes?: string;
  priority?: boolean;
}> = ({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onLoad={() => setLoaded(true)}
      className={`${className} transition-all duration-500 will-change-[opacity,transform] ${
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

      <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-neutral-950 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-neutral-950 to-transparent pointer-events-none z-10" />
    </div>
  );
};

// ============================================================================
// 3. CARD COMPONENTS
// ============================================================================

const PlaylistCard: React.FC<{
  playlist: Playlist;
  size?: "small" | "medium" | "large";
  showMeta?: boolean;
}> = memo(({ playlist, size = "medium", showMeta = true }) => {
  const [isHovered, setIsHovered] = useState(false);
  const dims = {
    small: { w: "w-32", h: "h-32" },
    medium: { w: "w-40 md:w-44", h: "h-40 md:h-44" },
    large: { w: "w-56", h: "h-56" },
  }[size];

  const playlistSlug = createSlug(playlist.title);
  const { navigateTo } = useNavigation();

  return (
    <div
      role="link"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigateTo("playlist-detail", { slug: playlistSlug })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          navigateTo("playlist-detail", { slug: playlistSlug });
      }}
      className={`group relative flex flex-col ${dims.w} rounded-xl bg-neutral-900 hover:bg-neutral-800 p-3 transition-all duration-300 text-left border border-white/5 hover:border-white/10 shadow-lg will-change-transform`}
    >
      <div
        className={`relative ${dims.h} w-full rounded-lg overflow-hidden mb-3 shadow-2xl bg-neutral-800`}
      >
        <div
          className={`absolute inset-0 bg-linear-to-br ${playlist.gradient}`}
        />
        <FadeImage
          src={playlist.image}
          alt={playlist.title}
          sizes={
            size === "small"
              ? "128px"
              : size === "large"
              ? "224px"
              : "(max-width: 768px) 160px, 176px"
          }
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out will-change-transform ${
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
    </div>
  );
});

const FeaturedPlaylistCard: React.FC<{ playlist: Playlist }> = memo(
  ({ playlist }) => {
    const [isHovered, setIsHovered] = useState(false);
    const playlistSlug = createSlug(playlist.title);
    const { navigateTo } = useNavigation();

    return (
      <div
        role="link"
        tabIndex={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => navigateTo("playlist-detail", { slug: playlistSlug })}
        className="group relative h-72 md:h-96 rounded-2xl overflow-hidden text-left w-full block shadow-2xl ring-1 ring-white/10 cursor-pointer"
      >
        <div
          className={`absolute inset-0 bg-linear-to-br ${playlist.gradient}`}
        />
        <FadeImage
          src={playlist.image}
          alt={playlist.title}
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out ${
            isHovered ? "scale-105" : "scale-100"
          }`}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent opacity-90" />

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
              <span className="opacity-70">
                {playlist.songsCount} آهنگ منتخب
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const QuickPickCard: React.FC<{ playlist: Playlist }> = memo(({ playlist }) => {
  const [isHovered, setIsHovered] = useState(false);
  const playlistSlug = createSlug(playlist.title);
  const { navigateTo } = useNavigation();

  return (
    <div
      role="link"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigateTo("playlist-detail", { slug: playlistSlug })}
      className="group flex items-center bg-neutral-800/50 hover:bg-neutral-800 rounded-md overflow-hidden transition-all duration-300 h-12 md:h-14 border border-white/5 hover:border-white/10 will-change-transform cursor-pointer"
    >
      <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0">
        <div
          className={`absolute inset-0 bg-linear-to-br ${playlist.gradient}`}
        />
        <FadeImage
          src={playlist.image}
          alt=""
          sizes="(max-width: 768px) 48px, 56px"
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
    </div>
  );
});

const GenreCard: React.FC<{ genre: any }> = memo(({ genre }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative h-28 md:h-32 rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg group will-change-transform"
      style={{ backgroundColor: genre.color }}
    >
      <div
        className={`absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 transition-transform duration-1000 ease-in-out ${
          isHovered ? "translate-x-full" : "-translate-x-full"
        }`}
      />
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        <span className="font-bold text-white text-lg md:text-xl drop-shadow-md">
          {genre.name}
        </span>
        <div className="w-8 h-1 bg-white/30 rounded-full" />
      </div>
      <span className="absolute -bottom-2 -right-3 text-5xl md:text-6xl transform rotate-25 opacity-90 transition-transform duration-300 group-hover:rotate-15 group-hover:scale-110 drop-shadow-xl">
        {genre.icon}
      </span>
    </button>
  );
});

// ============================================================================
// 4. MAIN PAGE
// ============================================================================

const Playlists: React.FC = () => {
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

  const SECTIONS_CONFIG = [
    {
      title: "مرور بر اساس ژانر",
      subtitle: "موسیقی را بر اساس دسته‌بندی کشف کن",
      icon: <Icon name="palette" className="text-pink-400" />,
      data: GENRE_CATEGORIES,
      type: "grid",
      component: "Genre",
      gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
    },
    {
      title: "برای شما",
      subtitle: "پیشنهادهای اختصاصی بر اساس سلیقه شما",
      icon: <Icon name="sparkle" className="text-green-500" />,
      data: MADE_FOR_YOU,
      cardSize: "medium",
    },
    {
      title: "محبوب‌ترین‌های امروز",
      icon: <Icon name="fire" className="text-orange-500" />,
      data: [...FEATURED_PLAYLISTS, ...PARTY_PLAYLISTS],
      cardSize: "large",
    },
    {
      title: "تمرکز و بهره‌وری",
      subtitle: "موسیقی بدون کلام برای تمرکز بیشتر",
      icon: <Icon name="target" className="text-purple-500" fill={false} />,
      data: FOCUS_PLAYLISTS,
      cardSize: "medium",
    },
    {
      title: "ورزش",
      subtitle: "با این پلی‌لیست‌ها انرژی بگیر",
      icon: <Icon name="barbell" className="text-red-500" />,
      data: WORKOUT_PLAYLISTS,
      cardSize: "medium",
    },
    {
      title: "آرامش",
      subtitle: "ریلکس کن و استراحت کن",
      icon: <Icon name="smiley" className="text-yellow-400" />,
      data: CHILL_PLAYLISTS,
      cardSize: "medium",
    },
    {
      title: "خواب",
      subtitle: "با صداهای آرامش‌بخش بخواب",
      icon: <Icon name="moon" className="text-indigo-400" />,
      data: [...SLEEP_PLAYLISTS, ...CHILL_PLAYLISTS.slice(0, 2)],
      cardSize: "medium",
    },
    {
      title: "مهمانی",
      subtitle: "صدا رو زیاد کن!",
      icon: <Icon name="confetti" className="text-pink-500" />,
      data: PARTY_PLAYLISTS,
      cardSize: "medium",
    },
  ];

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
      className="min-h-screen bg-transparent text-white selection:bg-green-500/30 pb-24 md:pb-4"
      dir="rtl"
    >
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-neutral-800/20 via-neutral-950 to-neutral-950 pointer-events-none md:rounded-lg" />

      <header
        className={`relative z-10 bg-linear-to-b ${timeOfDay.gradient} pt-12 md:pt-6 pb-4`}
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
        <section className="relative pb-8">
          <SectionHeader
            title="حالت چطوره؟"
            subtitle="یک حال انتخاب کن تا پلی‌لیست مناسب رو پیدا کنیم"
            icon="🎭"
            showSeeAll={false}
          />
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
            {MOOD_CHIPS.map((m: MoodChip) => (
              <button
                key={m.id}
                onClick={() =>
                  setSelectedMood(selectedMood === m.id ? null : m.id)
                }
                className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all duration-300 whitespace-nowrap border will-change-transform ${
                  selectedMood === m.id
                    ? `bg-linear-to-r ${m.gradient} text-white border-transparent shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105`
                    : "bg-neutral-900 text-neutral-300 border-white/5 hover:border-white/20 hover:bg-neutral-800 hover:scale-105"
                }`}
              >
                <span className="text-xl">
                  {React.createElement(MoodIcons[m.iconKey], {
                    className: "w-5 h-5",
                  })}
                </span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="relative pb-8">
          <SectionHeader
            title="ویژه‌ها"
            icon={<Icon name="fire" className="w-6 h-6 text-orange-500" />}
          />
          <FeaturedPlaylistCard playlist={FEATURED_PLAYLISTS[0]} />
        </section>

        {SECTIONS_CONFIG.map((section, idx) => (
          <SectionBuilder key={idx} config={section} />
        ))}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-32 bg-linear-to-t from-neutral-950 via-neutral-950/90 to-transparent pointer-events-none z-30" />
    </div>
  );
};

export default Playlists;
