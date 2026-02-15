import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import gsap from "gsap";

// --- Interfaces ---
export interface ApiSong {
  id: number;
  title: string;
  artist_name: string;
  album_title?: string;
  cover_image?: string;
  stream_url?: string;
  duration_seconds?: number;
  is_liked?: boolean;
  genre_names?: string[];
  tag_names?: string[];
  mood_names?: string[];
  sub_genre_names?: string[];
  play_count?: number;
}

export interface HomeSummaryResponse {
  songs_recommendations: {
    songs: ApiSong[];
    message?: string;
    type?: string;
    next?: string | null;
  };
  latest_releases: { results: ApiSong[]; next?: string | null; count?: number };
  discoveries: { results: ApiSong[]; next?: string | null; count?: number };
  popular_artists?: any;
  popular_albums?: any;
  playlist_recommendations?: any;
}

export type HeroHighlight = {
  key: string;
  pill: string;
  title: string;
  subtitle: string;
  image: string;
  meshGradient: string;
  highlight: string;
  metaRight: string;
  type?: "song" | "playlist" | "album";
  item?: any;
};

export type HeroSectionData = any;

export type HeroStats = {
  totalTracks: number;
  totalArtists: number;
  totalPlaylists: number;
};

type Props = {
  homeData: HomeSummaryResponse;
  sectionData: HeroSectionData;
  heroHighlights: HeroHighlight[];
  stats: HeroStats;
  onPrimaryPlay: () => void;
  onGoToDiscover: () => void;
  onCardPlay?: (item: HeroHighlight) => void;
};

// --- Optimized Sub-Components ---

/**
 * AnimatedCounter
 * Updates the text directly via Ref to avoid triggering re-renders of the parent
 * component 60fps during the counting animation.
 */
const AnimatedCounter = memo(({ value }: { value: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const previousValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (value === 0) {
      el.innerText = "0";
      return;
    }

    const start = previousValue.current;
    const end = value;
    const duration = 1000; // 1 second animation
    const startTime = performance.now();

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);

      const current = Math.floor(start + (end - start) * ease);
      el.innerText = current.toLocaleString("en-US");

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        previousValue.current = end;
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return (
    <div
      ref={ref}
      className="text-right text-4xl md:text-5xl lg:text-6xl font-thin leading-tight text-white"
    >
      {0}
    </div>
  );
});

AnimatedCounter.displayName = "AnimatedCounter";

// --- Main Component ---

function HeroSection({
  homeData,
  heroHighlights,
  onPrimaryPlay,
  onGoToDiscover,
  onCardPlay,
}: Props) {
  const sliderShellRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!heroHighlights || heroHighlights.length === 0) return null;

  const safeIndex =
    activeIndex >= 0 && activeIndex < heroHighlights.length ? activeIndex : 0;
  const active = heroHighlights[safeIndex];
  const activeItem = active.item;

  // --- Optimized Gesture Logic ---
  useEffect(() => {
    const sliderEl = sliderShellRef.current;
    if (!sliderEl || heroHighlights.length <= 1) return;

    let isPointerDown = false;
    let startX = 0;
    let currentX = 0;

    // We use a simplified drag handler that doesn't rely on React state during the move
    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      startX = e.clientX;
      currentX = e.clientX;
      sliderEl.setPointerCapture(e.pointerId);
      // Remove transition during drag for 1:1 feel
      gsap.set(sliderEl, { transition: "none" });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;

      const deltaX = e.clientX - startX;
      // Use transforms directly on the container.
      // 0.25 damping factor for "resistance" feel
      const xOffset = deltaX * 0.25;
      const rotateY = deltaX * 0.05;

      // Use GSAP set for performant inline style updates
      gsap.set(sliderEl, {
        x: xOffset,
        rotateY: rotateY,
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      const deltaX = e.clientX - startX;

      // Threshold to switch slide
      if (Math.abs(deltaX) > 50) {
        const direction = deltaX < 0 ? 1 : -1;
        const nextIndex =
          (safeIndex + direction + heroHighlights.length) %
          heroHighlights.length;
        setActiveIndex(nextIndex);
      }

      // Snap back animation
      gsap.to(sliderEl, {
        x: 0,
        rotateY: 0,
        duration: 0.5,
        ease: "power2.out",
        clearProps: "transition", // Clean up to allow CSS transitions if needed later
      });
    };

    sliderEl.addEventListener("pointerdown", onPointerDown);
    sliderEl.addEventListener("pointermove", onPointerMove);
    sliderEl.addEventListener("pointerup", onPointerUp);
    sliderEl.addEventListener("pointercancel", onPointerUp);

    return () => {
      sliderEl.removeEventListener("pointerdown", onPointerDown);
      sliderEl.removeEventListener("pointermove", onPointerMove);
      sliderEl.removeEventListener("pointerup", onPointerUp);
      sliderEl.removeEventListener("pointercancel", onPointerUp);
    };
  }, [heroHighlights.length, safeIndex]);

  // --- Derived Data (Memoized) ---
  const displayGenres = useMemo(
    () =>
      activeItem?.genre_names?.length
        ? activeItem.genre_names.join("، ")
        : activeItem?.tag_names?.length
          ? activeItem.tag_names.join("، ")
          : "—",
    [activeItem],
  );

  const displayArtist = useMemo(
    () => activeItem?.artist_name || activeItem?.artists?.join("، ") || "—",
    [activeItem],
  );

  const albumRaw = activeItem?.album_title?.toString().trim();
  const isSingleAlbum = !albumRaw || albumRaw.toLowerCase() === "single";
  const displayAlbum = isSingleAlbum ? "تک‌آهنگ" : albumRaw;

  const displayTitle =
    activeItem?.title || activeItem?.name || active.title || "—";

  const isPlaylist = active.type === "playlist";
  const playlistCount =
    activeItem?.track_count ||
    activeItem?.tracks?.length ||
    activeItem?.song_count;

  const shouldReverse = useMemo(() => {
    const isPersian = (text: string) => /[\u0600-\u06FF]/.test(text);
    return (
      isPlaylist ||
      active.type === "album" ||
      (active.type === "song" && isPersian(displayArtist))
    );
  }, [isPlaylist, active.type, displayArtist]);

  const playCountValue =
    active.type === "song" && activeItem?.play_count
      ? activeItem.play_count
      : 0;

  return (
    <section
      dir="ltr"
      className="px-4 md:px-6 lg:px-8 mt-1 md:mt-2 transform-gpu"
      aria-label="ویترین اصلی"
    >
      {/* 
        Optimization: 
        1. bg-zinc-950/95 instead of blur.
        2. Static gradients instead of animated JS gradients.
      */}
      <div className="hero-shell relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 shadow-2xl">
        {/* Static Background Gradients (Hardware Accelerated) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-10 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[80px] opacity-60 translate-z-0" />
          <div className="absolute -bottom-40 -right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[80px] opacity-60 translate-z-0" />
        </div>

        <div className="relative z-10 grid items-stretch gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:gap-8 md:p-8 lg:gap-10 lg:p-10">
          {/* Left Side (Text Content) */}
          <div className="flex flex-col justify-start gap-2 md:gap-3 text-right md:order-2">
            <div className="space-y-4 md:space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center justify-end gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-[11px] font-medium tracking-tight md:text-xs">
                <span className="text-zinc-300">تجربه شنیداری نسل بعد</span>
                <span className="h-px w-5 bg-emerald-500/50" />
                <span className="font-semibold text-emerald-400">صداباکس</span>
              </div>

              {/* Meta Info */}
              <div className="flex flex-col gap-3 text-[11px] text-zinc-300/80 sm:text-xs">
                <div className="flex items-center justify-end gap-4">
                  <div
                    className={`flex ${shouldReverse ? "flex-row-reverse" : "flex-row"} items-center w-full gap-2 text-right`}
                  >
                    <span className="w-fit max-w-[45%] text-sm font-semibold text-emerald-300">
                      {isPlaylist
                        ? playlistCount
                          ? `${playlistCount} ترک`
                          : "پلی‌لیست"
                        : displayArtist}
                    </span>
                    <span className="h-9 w-px bg-zinc-700" />
                    <span
                      className={`flex-1 truncate ${shouldReverse ? "text-right" : "text-left"} text-zinc-100`}
                    >
                      {displayTitle}
                    </span>
                  </div>
                </div>

                <div
                  className={`mt-1 grid w-full ${isSingleAlbum ? "grid-cols-1" : "grid-cols-2"} gap-2`}
                >
                  <div className="rounded-2xl bg-white/5 px-3 py-2 w-full border border-white/5">
                    <div className="flex flex-row-reverse items-center justify-between gap-3">
                      <div className="text-[10px] text-zinc-400 shrink-0">
                        ژانرها
                      </div>
                      <div className="font-semibold text-emerald-300 truncate text-right">
                        {displayGenres}
                      </div>
                    </div>
                  </div>

                  {!isSingleAlbum && (
                    <div className="rounded-2xl bg-white/5 px-3 py-2 w-full border border-white/5">
                      <div className="flex flex-row-reverse items-center justify-between gap-3">
                        <div className="text-[10px] text-zinc-400 shrink-0">
                          آلبوم
                        </div>
                        <div className="font-semibold text-emerald-300 truncate text-right">
                          {displayAlbum}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Play Count (Desktop) */}
              {active.type === "song" && playCountValue > 0 && (
                <div className="hidden md:flex items-center justify-end">
                  <div className="flex items-center gap-2 text-white">
                    <div className="text-center text-2xl md:text-3xl lg:text-4xl font-thin leading-tight text-emerald-400">
                      پخش
                    </div>
                    <AnimatedCounter value={playCountValue} />
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onPrimaryPlay}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-black shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 md:text-sm hover:bg-emerald-400"
              >
                شروع پخش شخصی
              </button>
              <button
                type="button"
                onClick={onGoToDiscover}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[12px] text-zinc-100 hover:bg-white/10 transition-colors active:scale-95 md:text-[13px]"
              >
                رفتن به بخش اکتشاف
              </button>
            </div>
          </div>

          {/* Right Side (Slider) */}
          <div className="flex items-end justify-center md:justify-start md:order-1">
            <div
              ref={sliderShellRef}
              className="hero-slider-shell relative flex h-[260px] w-full max-w-xs select-none items-stretch sm:h-[280px] sm:max-w-sm md:h-[320px] md:max-w-md touch-pan-y"
              style={{ perspective: "1000px" }} // Added perspective for 3D feel without heavy cost
            >
              {heroHighlights.map((item, index) => {
                const offset = index - safeIndex;
                const distance = Math.abs(offset);

                // --- Pre-calculated Styles ---
                const isActive = index === safeIndex;
                const zIndex = 20 - distance;

                // We use CSS transitions for smooth movement when state changes,
                // but direct style injection for positions to avoid layout thrashing.
                // Replaced 'filter: blur' with simple opacity/scale logic.
                const translateX = offset * 18;
                const translateY = distance * 4;
                const scale = isActive ? 1 : 0.92;
                const rotate = offset * -4;

                return (
                  <article
                    key={item.key}
                    onClick={() =>
                      isActive ? onCardPlay?.(item) : setActiveIndex(index)
                    }
                    className={`
                        hero-card absolute inset-0 cursor-grab overflow-hidden rounded-[26px] 
                        border border-white/10 bg-zinc-900 
                        transition-all duration-500 ease-out
                        will-change-transform
                    `}
                    style={{
                      transform: `translate3d(${translateX}%, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`,
                      zIndex: zIndex,
                      opacity: 1, // We control visibility via overlay now
                    }}
                  >
                    {/* Background Image - Optimized: No blur filter */}
                    <div className="absolute inset-0">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
                        style={{
                          backgroundImage: `url(${item.image})`,
                          opacity: 0.8,
                        }}
                      />
                      {/* Gradient Overlay for Text Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                      {/* Mesh Gradient Fallback (Simple CSS) */}
                      <div
                        className="absolute inset-0 mix-blend-overlay opacity-30"
                        style={{ background: item.meshGradient }}
                      />

                      {/* Performance Optimization: Darken inactive slides instead of Blurring them */}
                      <div
                        className="absolute inset-0 bg-black transition-opacity duration-500"
                        style={{ opacity: isActive ? 0 : 0.6 }}
                      />
                    </div>

                    {/* Content */}
                    <div
                      className={`relative z-10 flex h-full flex-col justify-between p-4 sm:p-5 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-40"}`}
                    >
                      {/* Mobile Play Count */}
                      {item.type === "song" && isActive && (
                        <div className="flex md:hidden absolute top-1/2 right-3 -translate-y-1/2 items-center gap-3 text-white pointer-events-none">
                          {/* Simplified mobile counter static or simpler */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-emerald-400">
                              پخش
                            </span>
                            <span className="text-xl font-light">
                              {playCountValue > 0
                                ? playCountValue.toLocaleString()
                                : "-"}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 text-right">
                        <div className="inline-flex items-center justify-end gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-300">
                          <span className="rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-none">
                            {item.pill}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-sm font-bold text-white sm:text-base md:text-lg drop-shadow-md">
                            {item.title}
                          </h2>
                          <p className="text-[11px] text-zinc-300 sm:text-xs line-clamp-2">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-[11px] text-zinc-300 sm:text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="max-w-[60%] truncate text-emerald-300">
                            {item.highlight}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {item.metaRight}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Mobile Buttons */}
          <div className="w-full md:hidden mt-4 flex justify-center">
            <div className="relative min-w-[95%] inline-flex items-center">
              <button
                type="button"
                onClick={onPrimaryPlay}
                aria-label="شروع پخش"
                className="z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 fill-current text-black"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={onGoToDiscover}
                className="-ml-6 flex-1 z-10 rounded-full bg-zinc-800 border border-white/5 px-5 py-3 pl-10 pr-4 text-sm font-semibold text-white shadow-lg active:scale-95 transition-transform"
              >
                {`رفتن به ${active.pill || "بخش"}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// React.memo ensures the whole section doesn't re-render if parent props haven't changed
export default React.memo(HeroSection);
