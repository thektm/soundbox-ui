import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import gsap from "gsap";

// Minimal API interfaces used by HeroSection
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

export type HomeSectionData = any;

export type HeroStats = {
  totalTracks: number;
  totalArtists: number;
  totalPlaylists: number;
};

const formatDuration = (seconds?: number): string => {
  if (!seconds && seconds !== 0) return "0:00";
  const mins = Math.floor((seconds as number) / 60);
  const secs = (seconds as number) % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

type Props = {
  homeData: HomeSummaryResponse;
  sectionData: HomeSectionData;
  heroHighlights: HeroHighlight[];
  stats: HeroStats;
  onPrimaryPlay: () => void;
  onGoToDiscover: () => void;
  onCardPlay?: (item: HeroHighlight) => void;
};

function HeroSection({
  homeData,
  sectionData,
  heroHighlights,
  stats,
  onPrimaryPlay,
  onGoToDiscover,
  onCardPlay,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sliderShellRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedPlayCount, setDisplayedPlayCount] = useState(0);

  if (!heroHighlights || heroHighlights.length === 0) return null;

  const safeIndex =
    activeIndex >= 0 && activeIndex < heroHighlights.length ? activeIndex : 0;
  const active = heroHighlights[safeIndex];

  // Entrance animations removed: render immediately without GSAP mount effects

  useEffect(() => {
    if (active.type === "song" && active.item?.play_count !== undefined) {
      let current = 0;
      const target = active.item.play_count;
      const steps = 20;
      const increment = Math.max(1, Math.ceil(target / steps));
      let animationId: number;

      const animate = () => {
        current += increment;
        if (current >= target) {
          setDisplayedPlayCount(target);
        } else {
          setDisplayedPlayCount(current);
          animationId = requestAnimationFrame(animate);
        }
      };

      animationId = requestAnimationFrame(animate);

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    } else {
      setDisplayedPlayCount(0);
    }
  }, [active]);

  useEffect(() => {
    const sliderEl = sliderShellRef.current;
    if (!sliderEl || heroHighlights.length <= 1) return;

    let isPointerDown = false;
    let startX = 0;
    let deltaX = 0;
    let lastUpdate = 0;

    const handlePointerDown = (event: PointerEvent) => {
      isPointerDown = true;
      startX = event.clientX;
      deltaX = 0;
      sliderEl.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isPointerDown) return;
      const now = Date.now();
      if (now - lastUpdate < 16) return; // Throttle to ~60fps
      lastUpdate = now;
      deltaX = event.clientX - startX;

      gsap.set(sliderEl, {
        x: deltaX * 0.25,
        rotateY: deltaX * 0.04,
      });
    };

    const finishGesture = () => {
      if (!isPointerDown) return;
      isPointerDown = false;

      if (Math.abs(deltaX) > 40 && heroHighlights.length > 1) {
        const direction = deltaX < 0 ? 1 : -1;
        const nextIndex =
          (safeIndex + direction + heroHighlights.length) %
          heroHighlights.length;
        setActiveIndex(nextIndex);
      }

      gsap.to(sliderEl, { x: 0, rotateY: 0, duration: 0.6, ease: "expo.out" });
    };

    const handlePointerUp = () => finishGesture();
    const handlePointerLeave = () => finishGesture();

    sliderEl.addEventListener("pointerdown", handlePointerDown);
    sliderEl.addEventListener("pointermove", handlePointerMove);
    sliderEl.addEventListener("pointerup", handlePointerUp);
    sliderEl.addEventListener("pointerleave", handlePointerLeave);
    sliderEl.addEventListener("pointercancel", handlePointerLeave);

    return () => {
      sliderEl.removeEventListener("pointerdown", handlePointerDown);
      sliderEl.removeEventListener("pointermove", handlePointerMove);
      sliderEl.removeEventListener("pointerup", handlePointerUp);
      sliderEl.removeEventListener("pointerleave", handlePointerLeave);
      sliderEl.removeEventListener("pointercancel", handlePointerLeave);
    };
  }, [heroHighlights.length, safeIndex]);

  const personalMessage =
    homeData.songs_recommendations.message ||
    "ترک‌هایی بر اساس سلیقه و ریتم زندگی تو";
  const latestDiscovery = homeData.discoveries.results[0]?.title;
  const totalForYouTracks =
    homeData.songs_recommendations.songs.length +
    homeData.discoveries.results.length;

  const activeItem = active.item;
  const displayGenres = useMemo(
    () =>
      activeItem?.genre_names?.length && activeItem.genre_names.length > 0
        ? activeItem.genre_names.join("، ")
        : activeItem?.tag_names?.length && activeItem.tag_names.length > 0
          ? activeItem.tag_names.join("، ")
          : "—",
    [activeItem?.genre_names, activeItem?.tag_names],
  );
  const displayArtist = useMemo(
    () =>
      activeItem?.artist_name ||
      (activeItem?.artists && activeItem.artists.join("، ")) ||
      "—",
    [activeItem?.artist_name, activeItem?.artists],
  );
  const albumRaw = useMemo(
    () => activeItem?.album_title?.toString().trim(),
    [activeItem?.album_title],
  );
  const albumLower = useMemo(() => albumRaw?.toLowerCase(), [albumRaw]);
  const isSingleAlbum = useMemo(
    () => !albumRaw || albumLower === "single" || albumLower === "تک‌آهنگ",
    [albumRaw, albumLower],
  );
  const displayAlbum = useMemo(
    () => (isSingleAlbum ? "تک‌آهنگ" : albumRaw),
    [isSingleAlbum, albumRaw],
  );

  // Derived display fields for the active item (song / playlist /album)
  const displayTitle = useMemo(
    () => activeItem?.title || activeItem?.name || active.title || "—",
    [activeItem?.title, activeItem?.name, active.title],
  );
  const displayDescription = useMemo(
    () =>
      activeItem?.description || activeItem?.subtitle || active.subtitle || "",
    [activeItem?.description, activeItem?.subtitle, active.subtitle],
  );
  const displayYear = useMemo(
    () =>
      activeItem?.release_year ||
      activeItem?.year ||
      activeItem?.releaseYear ||
      "",
    [activeItem?.release_year, activeItem?.year, activeItem?.releaseYear],
  );

  const isPlaylist = active.type === "playlist";
  const isAlbum = active.type === "album";
  const playlistCount = useMemo(
    () =>
      activeItem?.track_count ||
      activeItem?.tracks?.length ||
      activeItem?.song_count,
    [
      activeItem?.track_count,
      activeItem?.tracks?.length,
      activeItem?.song_count,
    ],
  );
  const isPersian = useCallback(
    (text: string) => /[\u0600-\u06FF]/.test(text),
    [],
  );
  const shouldReverse = useMemo(
    () =>
      isPlaylist ||
      isAlbum ||
      (active.type === "song" && isPersian(displayArtist)),
    [isPlaylist, isAlbum, active.type, displayArtist, isPersian],
  );

  return (
    <section
      dir="ltr"
      ref={rootRef}
      className="px-4 md:px-6 lg:px-8 mt-1 md:mt-2"
      aria-label="ویترین اصلی"
    >
      <div className="hero-shell relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-950 via-zinc-900/95 to-black">
        <div className="pointer-events-none absolute -inset-x-16 -top-40 h-56 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-12 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 grid items-stretch gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:gap-8 md:p-8 lg:gap-10 lg:p-10">
          <div className="flex flex-col justify-start gap-2 md:gap-3 text-right md:order-2">
            <div className="space-y-4 md:space-y-6">
              <div className="hero-kicker inline-flex items-center justify-end gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1 text-[11px] font-medium tracking-tight text-emerald-200/90 md:text-xs">
                <span className="text-zinc-200/80">تجربه شنیداری نسل بعد</span>
                <span className="h-px w-5 bg-emerald-400/50" />
                <span className="font-semibold text-emerald-400">صداباکس</span>
              </div>

              <div className="hero-meta mt-2 flex flex-col gap-3 text-[11px] text-zinc-300/70 sm:text-xs">
                <div className="flex  items-center justify-end gap-4">
                  <div
                    className={`flex ${
                      shouldReverse ? "flex-row-reverse" : "flex-row"
                    } items-center w-full gap-2 text-right`}
                  >
                    <span className="w-fit max-w-[45%] text-sm font-semibold text-emerald-300/90">
                      {isPlaylist
                        ? playlistCount
                          ? `${playlistCount} ترک`
                          : "پلی‌لیست"
                        : displayArtist}
                    </span>
                    <span className="h-9 w-px bg-gradient-to-b from-emerald-400/80 via-zinc-700 to-transparent" />
                    <span
                      className={`flex-1 ${
                        shouldReverse ? "text-right" : "text-left"
                      }`}
                    >
                      {displayTitle}
                    </span>
                  </div>
                </div>

                <div
                  className={`mt-1 grid w-full ${
                    isSingleAlbum ? "grid-cols-1" : "grid-cols-2"
                  } gap-2 text-[11px] sm:text-xs`}
                >
                  <div className="rounded-2xl bg-white/5 px-3 py-2 text-right w-full">
                    <div className="flex flex-row-reverse items-center justify-between gap-3">
                      <div className="text-[10px] text-zinc-300/80 shrink-0">
                        ژانرها
                      </div>
                      <div className="font-semibold text-emerald-300/95 mt-0 min-w-0 truncate text-right">
                        {displayGenres}
                      </div>
                    </div>
                  </div>

                  {!isSingleAlbum && (
                    <div className="rounded-2xl bg-white/5 px-3 py-2 text-right w-full">
                      <div className="flex flex-row-reverse items-center justify-between gap-3">
                        <div className="text-[10px] text-zinc-300/80 shrink-0">
                          آلبوم
                        </div>
                        <div className="font-semibold text-emerald-300/95 mt-0 min-w-0 truncate text-right">
                          {displayAlbum}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {active.type === "song" &&
                activeItem?.play_count !== undefined && (
                  <div className="hidden md:flex items-center justify-end">
                    <div className="flex items-center gap-2 text-white">
                      <div className="text-center text-2xl md:text-3xl lg:text-4xl font-thin leading-tight bg-gradient-to-r from-emerald-700 via-emerald-400 to-emerald-200  text-transparent bg-clip-text">
                        پخش
                      </div>
                      <div className="text-right text-4xl md:text-5xl lg:text-6xl font-thin leading-tight text-white bg-clip-text">
                        {displayedPlayCount.toLocaleString("en-US")}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Mobile merged CTA: circular play on the left, label button emerging to the right */}

            <div className="hero-meta hidden md:flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onPrimaryPlay}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-black shadow-[0_18px_45px_rgba(16,185,129,0.45)] transition-all duration-200 hover:bg-emerald-400 hover:shadow-[0_24px_55px_rgba(16,185,129,0.65)] active:scale-95 md:text-sm"
              >
                شروع پخش شخصی
              </button>
              <button
                type="button"
                onClick={onGoToDiscover}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[12px] text-zinc-50/90 backdrop-blur-md transition-all duration-200 hover:bg-white/10 active:scale-95 md:text-[13px]"
              >
                رفتن به بخش اکتشاف
              </button>
            </div>
          </div>

          <div className="flex items-end justify-center md:justify-start md:order-1">
            <div
              ref={sliderShellRef}
              className="hero-slider-shell relative flex h-[260px] w-full max-w-xs select-none items-stretch sm:h-[280px] sm:max-w-sm md:h-[320px] md:max-w-md"
              style={{ willChange: "transform" }}
            >
              {heroHighlights.map((item, index) => {
                const offset = index - safeIndex;
                const distance = Math.abs(offset);
                const translateX = offset * 18;
                const translateY = distance * 4;
                const scale = index === safeIndex ? 1 : 0.92;
                const opacity =
                  distance === 0 ? 1 : distance === 1 ? 0.8 : 0.45;
                const blur = distance >= 2 ? 4 : 0;
                const rotate = offset * -4;

                return (
                  <article
                    key={item.key}
                    className="hero-card absolute inset-0 cursor-grab overflow-hidden rounded-[26px] border border-white/7 bg-zinc-900/70 backdrop-blur-xl active:cursor-grabbing"
                    style={{
                      transform: `translate3d(${translateX}%, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`,
                      opacity,
                      filter: blur ? `blur(${blur}px)` : "none",
                      zIndex: 20 - distance,
                      willChange: "transform, opacity",
                    }}
                    onClick={() => {
                      if (index === safeIndex) {
                        onCardPlay?.(item);
                      } else {
                        setActiveIndex(index);
                      }
                    }}
                  >
                    <div className="absolute inset-0">
                      <div
                        className="absolute inset-0 opacity-70"
                        style={{
                          backgroundImage: `url(${item.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div
                        className="absolute inset-0 mix-blend-soft-light"
                        style={{ background: item.meshGradient }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                    </div>

                    <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">
                      {item.type === "song" && index === safeIndex && (
                        <div className="flex md:hidden absolute top-1/2 right-3 -translate-y-1/2 items-center gap-3 text-white pointer-events-none">
                          <div className="flex items-center gap-2">
                            <div className="text-[11px] font-thin bg-gradient-to-r from-emerald-700 via-emerald-400 to-emerald-200 text-transparent bg-clip-text">
                              پخش
                            </div>
                            <div className="text-2xl font-thin leading-tight text-white">
                              {displayedPlayCount.toLocaleString("en-US")}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col gap-2 text-right">
                        <div className="inline-flex items-center justify-end gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-200/75">
                          <span className="rounded-full bg-black/40 px-2 py-0.5">
                            {item.pill}
                          </span>
                          <span className="h-px w-6 bg-white/40" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-sm font-bold text-white sm:text-base md:text-lg">
                            {item.title}
                          </h2>
                          <p className="text-[11px] text-zinc-200/85 sm:text-xs line-clamp-2">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-[11px] text-zinc-200/85 sm:text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="max-w-[60%] truncate text-emerald-200/95">
                            {item.highlight}
                          </span>
                          <span className="text-[10px] text-zinc-300/80">
                            {item.metaRight}
                          </span>
                        </div>
                        {/* Progress bar and personal message removed as requested */}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="w-full md:hidden mt-4 flex justify-center">
            <div className="relative min-w-[95%] inline-flex items-center">
              <button
                type="button"
                onClick={onPrimaryPlay}
                aria-label="شروع پخش"
                className="z-20 flex  h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-black shadow-[0_14px_36px_rgba(16,185,129,0.35)] transition-transform duration-150 active:scale-95"
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
                className="-ml-6 flex-1 z-10 rounded-full bg-gradient-to-r from-zinc-900/80 via-zinc-800/70 to-zinc-900/80 px-5 py-3 pl-10 pr-4 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(2,6,23,0.65)] backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_14px_50px_rgba(2,6,23,0.75)] border border-emerald-500/20 ring-1 ring-emerald-400/30 ring-offset-2 ring-offset-black/60"
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

export default React.memo(HeroSection);
