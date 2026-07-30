import OverflowMarquee from "./OverflowMarquee";
import React, { memo, useEffect, useRef, useState } from "react";
import { useI18n } from "./I18nContext";
import { clientTrace } from "../lib/clientDebug";

// --- Interfaces ---
export interface GenreLink {
  id: number;
  name: string;
}

export interface ApiSong {
  id: number;
  title: string;
  artist_name: string;
  album_title?: string;
  cover_image?: string;
  stream_url?: string;
  duration_seconds?: number;
  is_liked?: boolean;
  genres?: GenreLink[];
  genre_ids?: number[];
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
  sourceSectionKey: string;
  sourceLabel: string;
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
  isGuest: boolean;
  onPrimaryPlay: (item: HeroHighlight) => void;
  onGoToSource: (item: HeroHighlight) => void;
  onCardPlay?: (item: HeroHighlight) => void;
  onItemNavigate?: (
    item: HeroHighlight,
    target: "song" | "artist" | "album" | "playlist",
  ) => void;
  onGenreNavigate?: (genre: GenreLink) => void;
};

// --- Optimized Sub-Components ---

/**
 * AnimatedCounter
 * Updates the text directly via Ref to avoid triggering re-renders of the parent
 * component 60fps during the counting animation.
 */
const AnimatedCounter = memo(({ value }: { value: number }) => {
  const { locale } = useI18n();
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
      el.innerText = current.toLocaleString(locale);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        previousValue.current = end;
      }
    };

    requestAnimationFrame(update);
  }, [locale, value]);

  return (
    <div
      ref={ref}
      className="text-start text-4xl md:text-5xl lg:text-6xl font-thin leading-tight text-white"
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
  isGuest,
  onPrimaryPlay,
  onGoToSource,
  onCardPlay,
  onItemNavigate,
  onGenreNavigate,
}: Props) {
  const { locale, direction } = useI18n();
  const isRtl = direction === "rtl";
  const sliderShellRef = useRef<HTMLDivElement | null>(null);
  const draggedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const highlightCount = heroHighlights?.length ?? 0;

  useEffect(() => {
    clientTrace("HERO", "props:ready", {
      highlightCount,
      activeIndex,
      activeKey: heroHighlights?.[activeIndex]?.key ?? null,
      activeSource: heroHighlights?.[activeIndex]?.sourceSectionKey ?? null,
      recommendationSongs:
        homeData?.songs_recommendations?.songs?.length ?? null,
      latestSongs: homeData?.latest_releases?.results?.length ?? null,
      discoverySongs: homeData?.discoveries?.results?.length ?? null,
    });
  }, [activeIndex, heroHighlights, highlightCount, homeData]);

  const safeIndex =
    activeIndex >= 0 && activeIndex < highlightCount ? activeIndex : 0;

  // --- Optimized Gesture Logic ---
  useEffect(() => {
    const sliderEl = sliderShellRef.current;
    if (!sliderEl || highlightCount <= 1) return;

    let activePointerId: number | null = null;
    let activePointerType = "";
    let startX = 0;
    let lastX = 0;
    let dragStarted = false;

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(target.closest("button, a, input, select, textarea, [role='button']"));

    let settleAnimation: Animation | null = null;

    const cancelDeckAnimation = () => {
      settleAnimation?.cancel();
      settleAnimation = null;
    };

    const resetDeckTransform = (duration = 0.42) => {
      cancelDeckAnimation();
      const fromTransform = sliderEl.style.transform || "translate3d(0, 0, 0) rotateY(0deg)";
      settleAnimation = sliderEl.animate(
        [
          { transform: fromTransform },
          { transform: "translate3d(0, 0, 0) rotateY(0deg)" },
        ],
        {
          duration: Math.max(0, duration * 1000),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );
      settleAnimation.addEventListener(
        "finish",
        () => {
          sliderEl.style.transform = "";
          settleAnimation = null;
        },
        { once: true },
      );
    };

    const clearGesture = () => {
      activePointerId = null;
      activePointerType = "";
      dragStarted = false;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        !event.isPrimary ||
        isInteractiveTarget(event.target) ||
        (event.pointerType === "mouse" && event.button !== 0)
      ) {
        return;
      }

      activePointerId = event.pointerId;
      activePointerType = event.pointerType;
      startX = event.clientX;
      lastX = event.clientX;
      dragStarted = false;
      draggedRef.current = false;
      cancelDeckAnimation();

      try {
        sliderEl.setPointerCapture(event.pointerId);
      } catch {
        // Dragging still works when pointer capture is unavailable.
      }
    };

    const finishPointerGesture = (event: PointerEvent, cancelled = false) => {
      if (activePointerId !== event.pointerId) return;

      const pointerId = activePointerId;
      const deltaX = lastX - startX;
      const shouldChangeSlide =
        !cancelled && dragStarted && Math.abs(deltaX) > 50;

      clearGesture();

      try {
        if (sliderEl.hasPointerCapture(pointerId)) {
          sliderEl.releasePointerCapture(pointerId);
        }
      } catch {
        // Browsers may release capture automatically before this callback.
      }

      if (shouldChangeSlide) {
        const physicalStep = deltaX < 0 ? 1 : -1;
        const logicalStep = isRtl ? -physicalStep : physicalStep;
        setActiveIndex((currentIndex) => {
          const normalizedIndex =
            currentIndex >= 0 && currentIndex < highlightCount
              ? currentIndex
              : 0;
          return (
            normalizedIndex + logicalStep + highlightCount
          ) % highlightCount;
        });
      }

      // Always return the dragged deck shell to its neutral origin. This tween
      // must survive the active-card re-render so the outgoing/incoming card
      // transitions and the drag release animation finish together smoothly.
      resetDeckTransform(0.42);
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;

      // A normal mouse hover must never move the deck. If a mouse-up happened
      // outside the component/browser and was missed, buttons becomes 0; cancel
      // the stale gesture immediately instead of treating hover as dragging.
      if (activePointerType === "mouse" && (event.buttons & 1) === 0) {
        finishPointerGesture(event, true);
        return;
      }

      lastX = event.clientX;
      const deltaX = lastX - startX;

      if (!dragStarted) {
        if (Math.abs(deltaX) <= 8) return;
        dragStarted = true;
        draggedRef.current = true;
      }

      event.preventDefault();
      cancelDeckAnimation();
      sliderEl.style.transform = `translate3d(${deltaX * 0.25}px, 0, 0) rotateY(${deltaX * 0.05}deg)`;
    };

    const onPointerUp = (event: PointerEvent) =>
      finishPointerGesture(event, false);
    const onPointerCancel = (event: PointerEvent) =>
      finishPointerGesture(event, true);
    const onLostPointerCapture = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      clearGesture();
      resetDeckTransform(0.28);
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    };
    const onWindowBlur = () => {
      if (activePointerId === null) return;
      clearGesture();
      resetDeckTransform(0.28);
      draggedRef.current = false;
    };

    sliderEl.addEventListener("pointerdown", onPointerDown);
    sliderEl.addEventListener("pointermove", onPointerMove, { passive: false });
    sliderEl.addEventListener("pointerup", onPointerUp);
    sliderEl.addEventListener("pointercancel", onPointerCancel);
    sliderEl.addEventListener("lostpointercapture", onLostPointerCapture);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      cancelDeckAnimation();
      sliderEl.removeEventListener("pointerdown", onPointerDown);
      sliderEl.removeEventListener("pointermove", onPointerMove);
      sliderEl.removeEventListener("pointerup", onPointerUp);
      sliderEl.removeEventListener("pointercancel", onPointerCancel);
      sliderEl.removeEventListener("lostpointercapture", onLostPointerCapture);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [highlightCount, isRtl]);

  if (!highlightCount) return null;

  const active = heroHighlights[safeIndex]!;
  const activeItem = active.item;
  const sourceActionText =
    direction === "rtl"
      ? `رفتن به ${active.sourceLabel}`
      : `Go to ${active.sourceLabel}`;
  const navigateItem = (
    event: React.MouseEvent,
    item: HeroHighlight,
    target: "song" | "artist" | "album" | "playlist",
  ) => {
    event.stopPropagation();
    onItemNavigate?.(item, target);
  };

  const knownGenresByName = new Map<string, GenreLink>();
  const registerKnownGenres = (item: any) => {
    if (!Array.isArray(item?.genres)) return;
    item.genres.forEach((genre: any) => {
      const id = Number(genre?.id);
      const name = typeof (genre?.name ?? genre?.title) === "string"
        ? String(genre.name ?? genre.title).trim()
        : "";
      if (!Number.isFinite(id) || id <= 0 || !name) return;
      knownGenresByName.set(name.toLocaleLowerCase(locale), { id, name });
    });
  };

  homeData?.songs_recommendations?.songs?.forEach(registerKnownGenres);
  homeData?.latest_releases?.results?.forEach(registerKnownGenres);
  homeData?.discoveries?.results?.forEach(registerKnownGenres);
  homeData?.popular_albums?.results?.forEach(registerKnownGenres);
  const homePlaylists = Array.isArray(homeData?.playlist_recommendations)
    ? homeData.playlist_recommendations
    : homeData?.playlist_recommendations?.results;
  homePlaylists?.forEach(registerKnownGenres);

  const getGenreLinks = (item: any): GenreLink[] => {
    const genresById = new Map<number, GenreLink>();
    const addGenre = (idValue: unknown, nameValue: unknown) => {
      const id = Number(idValue);
      const name = typeof nameValue === "string" ? nameValue.trim() : "";
      if (!Number.isFinite(id) || id <= 0 || !name || genresById.has(id)) return;
      genresById.set(id, { id, name });
    };

    // Some recommendation payloads contain `genres: []` while the populated
    // relation is exposed through `genre_ids` + `genre_names`. Never return
    // early for an empty/partial `genres` array; merge every supported shape.
    if (Array.isArray(item?.genres)) {
      item.genres.forEach((genre: any) =>
        addGenre(genre?.id, genre?.name ?? genre?.title),
      );
    }

    if (Array.isArray(item?.genre_ids)) {
      item.genre_ids.forEach((genre: any, index: number) => {
        if (genre && typeof genre === "object") {
          addGenre(
            genre.id,
            genre.name ?? genre.title ?? item?.genre_names?.[index],
          );
          return;
        }
        addGenre(genre, item?.genre_names?.[index]);
      });
    }

    // Compatibility for an already-cached response created before the playlist
    // endpoint exposed `genres`. Resolve only exact names already paired with an
    // ID elsewhere in the same Home response; never fabricate an ID.
    if (Array.isArray(item?.genre_names)) {
      item.genre_names.forEach((nameValue: unknown) => {
        if (typeof nameValue !== "string") return;
        const match = knownGenresByName.get(
          nameValue.trim().toLocaleLowerCase(locale),
        );
        if (match) addGenre(match.id, match.name);
      });
    }

    return Array.from(genresById.values());
  };

  const activeGenres = getGenreLinks(activeItem);
  const displayGenres = activeGenres.length
    ? activeGenres.map((genre) => genre.name).join(direction === "rtl" ? "، " : ", ")
    : activeItem?.genre_names?.length
      ? activeItem.genre_names.join(direction === "rtl" ? "، " : ", ")
      : activeItem?.tag_names?.length
        ? activeItem.tag_names.join(direction === "rtl" ? "، " : ", ")
        : "—";

  const navigateGenre = (event: React.MouseEvent, genre: GenreLink) => {
    event.stopPropagation();
    onGenreNavigate?.(genre);
  };

  const displayArtist =
    activeItem?.artist_name || activeItem?.artists?.join("، ") || "—";

  const albumRaw = activeItem?.album_title?.toString().trim();
  const isSingleAlbum = !albumRaw || albumRaw.toLowerCase() === "single";
  const displayAlbum = isSingleAlbum ? "تک‌آهنگ" : albumRaw;

  const displayTitle =
    activeItem?.title || activeItem?.name || active.title || "—";

  const isPlaylist = active.type === "playlist";
  const playlistCount =
    activeItem?.songs_count ||
    activeItem?.track_count ||
    activeItem?.tracks?.length ||
    activeItem?.song_count;

  const getTextDirection = (text: string): "rtl" | "ltr" =>
    /[\u0600-\u06FF]/.test(text) ? "rtl" : "ltr";

  const playCountValue =
    active.type === "song" && activeItem?.play_count
      ? activeItem.play_count
      : 0;

  return (
    <section
      dir={direction}
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
          <div
            className={`absolute -top-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 opacity-60 blur-[80px] translate-z-0 ${isRtl ? "-left-10" : "-right-10"}`}
          />
          <div
            className={`absolute -bottom-40 h-[400px] w-[400px] rounded-full bg-cyan-500/10 opacity-60 blur-[80px] translate-z-0 ${isRtl ? "-right-10" : "-left-10"}`}
          />
        </div>

        <div
          dir="ltr"
          className={`relative z-10 grid items-stretch gap-6 p-4 sm:p-6 md:gap-8 md:p-8 lg:gap-10 lg:p-10 ${
            isRtl
              ? "md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]"
              : "md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]"
          }`}
        >
          {/* Direction-aware text content */}
          <div
            dir={direction}
            className={`min-w-0 flex flex-col justify-start gap-2 text-start md:gap-3 ${isRtl ? "md:order-2" : "md:order-1"}`}
          >
            <div className="space-y-4 md:space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center justify-start gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-[11px] font-medium tracking-tight md:text-xs">
                <span className="text-zinc-300">تجربه شنیداری نسل بعد</span>
                <span className="h-px w-5 bg-emerald-500/50" />
                <span className="font-semibold text-emerald-400">صداباکس</span>
              </div>

              {/* Meta Info */}
              <div className="flex flex-col gap-3 text-[11px] text-zinc-300/80 sm:text-xs">
                <div className="flex items-center justify-start gap-4">
                  <div
                    className="relative z-30 flex w-full items-center gap-2 text-start"
                  >
                    {isPlaylist ? (
                      <span className="w-fit max-w-[45%] text-sm font-semibold text-emerald-300">
                        {playlistCount ? `${playlistCount} ترک` : "پلی‌لیست"}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => navigateItem(event, active, "artist")}
                        dir={getTextDirection(displayArtist)}
                        className="min-w-0 w-full max-w-[45%] overflow-hidden text-start text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 hover:underline"
                      >
                        <OverflowMarquee text={displayArtist} />
                      </button>
                    )}
                    <span className="h-9 w-px bg-zinc-700" />
                    <button
                      type="button"
                      onClick={(event) =>
                        navigateItem(
                          event,
                          active,
                          active.type === "playlist"
                            ? "playlist"
                            : active.type === "album"
                              ? "album"
                              : "song",
                        )
                      }
                      dir={getTextDirection(displayTitle)}
                      className="min-w-0 flex-1 overflow-hidden text-start text-zinc-100 transition hover:text-white hover:underline"
                    >
                      {active.type === "song" ? (
                        <OverflowMarquee text={displayTitle} />
                      ) : (
                        <span className="block truncate">{displayTitle}</span>
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={`relative z-30 mt-1 grid w-full min-w-0 ${isSingleAlbum ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"} gap-2`}
                >
                  <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/5 bg-white/5 px-2.5 py-2">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <div className="text-[10px] text-zinc-400 shrink-0">
                        ژانرها
                      </div>
                      {activeGenres.length ? (
                        <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1 overflow-hidden font-semibold text-emerald-300">
                          {activeGenres.slice(0, 2).map((genre) => (
                            <button
                              key={genre.id}
                              type="button"
                              onClick={(event) => navigateGenre(event, genre)}
                              className="min-w-0 max-w-full truncate rounded-md px-1 py-0.5 text-start transition hover:bg-emerald-500/10 hover:text-emerald-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
                            >
                              {genre.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1 truncate text-start font-semibold text-emerald-300">
                          {displayGenres}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isSingleAlbum && (
                    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/5 bg-white/5 px-2.5 py-2">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <div className="text-[10px] text-zinc-400 shrink-0">
                          آلبوم
                        </div>
                        <button
                          type="button"
                          onClick={(event) => navigateItem(event, active, "album")}
                          className="min-w-0 flex-1 truncate text-start font-semibold text-emerald-300 transition hover:text-emerald-200 hover:underline"
                        >
                          {displayAlbum}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Play Count (Desktop) */}
              {active.type === "song" && playCountValue > 0 && (
                <div className="hidden items-center justify-start md:flex">
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
            <div className="hidden items-center justify-start gap-3 pt-1 md:flex">
              <button
                type="button"
                onClick={() => onPrimaryPlay(active)}
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-black shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 md:text-sm hover:bg-emerald-400"
              >
                {isGuest ? "شروع پخش منتخب" : "شروع پخش شخصی"}
              </button>
              <button
                type="button"
                onClick={() => onGoToSource(active)}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[12px] text-zinc-100 hover:bg-white/10 transition-colors active:scale-95 md:text-[13px]"
              >
                {sourceActionText}
              </button>
            </div>
          </div>

          {/* Direction-isolated card deck: always stays inside the hero viewport. */}
          <div
            dir="ltr"
            className={`min-w-0 flex items-end justify-center ${
              isRtl
                ? "md:order-1 md:justify-start"
                : "md:order-2 md:justify-end"
            }`}
          >
            <div
              ref={sliderShellRef}
              className="hero-slider-shell relative flex h-[260px] w-full max-w-xs touch-pan-y select-none items-stretch overflow-hidden px-2 sm:h-[280px] sm:max-w-sm sm:px-3 md:h-[320px] md:max-w-none md:px-4 lg:px-6"
              style={{ perspective: "1000px" }}
            >
              {heroHighlights.map((item, index) => {
                let logicalOffset = index - safeIndex;
                const halfCount = highlightCount / 2;
                if (logicalOffset > halfCount) logicalOffset -= highlightCount;
                if (logicalOffset < -halfCount) logicalOffset += highlightCount;

                const visualOffset = isRtl ? -logicalOffset : logicalOffset;
                const distance = Math.abs(logicalOffset);
                const isActive = index === safeIndex;
                const zIndex = 20 - distance;

                // Keep the 70/30 layout, but constrain each physical card inside
                // the deck. Percentage-based fan offsets scale with the card width,
                // preserving clear separation on every desktop/tablet width.
                const translateXPercent = visualOffset * 18;
                const translateY = distance * 6;
                const scale = isActive
                  ? 1
                  : Math.max(0.84, 0.93 - Math.max(0, distance - 1) * 0.04);
                const rotate = visualOffset * -4.25;
                const cardOpacity =
                  distance === 0 ? 1 : distance === 1 ? 0.9 : distance === 2 ? 0.56 : 0;
                const cardGenres = getGenreLinks(item.item).slice(0, 2);
                const genreHighlight =
                  cardGenres.length > 0 &&
                  Array.isArray(item.item?.genre_names) &&
                  item.highlight === item.item.genre_names.slice(0, 2).join(" • ");

                return (
                  <article
                    key={item.key}
                    onClick={() => {
                      if (draggedRef.current) return;
                      setActiveIndex(index);
                      onCardPlay?.(item);
                    }}
                    className={`
                        hero-deck-card absolute inset-y-0 left-1/2 w-[75%] max-w-[580px] cursor-pointer overflow-hidden rounded-[26px]
                        border border-white/10 bg-zinc-900
                        transition-[transform,opacity,filter] duration-500 ease-out
                        sm:w-[70%] md:w-[65%] lg:w-[61%] xl:w-[58%]
                        will-change-transform
                    `}
                    style={{
                      transform: `translate3d(calc(-50% + ${translateXPercent}%), ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`,
                      transformOrigin: "center bottom",
                      zIndex,
                      opacity: cardOpacity,
                      pointerEvents: distance > 2 ? "none" : "auto",
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
                        style={{
                          opacity: isActive ? 0 : distance === 1 ? 0.42 : 0.64,
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div
                      dir={direction}
                      className={`relative z-10 flex h-full flex-col justify-between p-4 transition-opacity duration-300 sm:p-5 ${isActive ? "opacity-100" : distance === 1 ? "opacity-45" : "opacity-20"}`}
                    >
                      {/* Mobile Play Count */}
                      {item.type === "song" && isActive && (
                        <div
                          className={`pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-3 text-white md:hidden ${isRtl ? "right-3" : "left-3"}`}
                        >
                          {/* Simplified mobile counter static or simpler */}
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-emerald-400">
                              پخش
                            </span>
                            <span className="text-xl font-light">
                              {playCountValue > 0
                                ? playCountValue.toLocaleString(locale)
                                : "-"}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 text-start">
                        <div className="inline-flex items-center justify-start gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-300">
                          <span className="rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-none">
                            {item.pill}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={(event) =>
                              navigateItem(
                                event,
                                item,
                                item.type === "playlist"
                                  ? "playlist"
                                  : item.type === "album"
                                    ? "album"
                                    : "song",
                              )
                            }
                            className="w-full min-w-0 overflow-hidden text-start text-sm font-bold text-white drop-shadow-md transition hover:underline sm:text-base md:text-lg"
                          >
                            {item.type === "song" ? (
                              <OverflowMarquee text={item.title} />
                            ) : (
                              <span className="block truncate">{item.title}</span>
                            )}
                          </button>
                          {(item.type === "song" || item.type === "album") &&
                          (item.item?.artist_name || item.subtitle) ? (
                            <p className="min-w-0 overflow-hidden text-[11px] text-zinc-300 sm:text-xs">
                              <button
                                type="button"
                                onClick={(event) => navigateItem(event, item, "artist")}
                                className="block w-full min-w-0 overflow-hidden font-semibold text-emerald-300 transition hover:text-emerald-200 hover:underline"
                              >
                                <OverflowMarquee
                                  text={item.item?.artist_name || item.subtitle}
                                />
                              </button>
                            </p>
                          ) : (
                            <p className="line-clamp-2 text-[11px] text-zinc-300 sm:text-xs">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 text-[11px] text-zinc-300 sm:text-xs">
                        <div className="flex items-center justify-between gap-2">
                          {genreHighlight ? (
                            <div className="flex max-w-[60%] min-w-0 items-center gap-1 overflow-hidden text-emerald-300">
                              {cardGenres.map((genre) => (
                                <button
                                  key={genre.id}
                                  type="button"
                                  onClick={(event) => navigateGenre(event, genre)}
                                  className="min-w-0 truncate rounded px-1 py-0.5 transition hover:bg-emerald-500/15 hover:text-emerald-200 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                                >
                                  {genre.name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="max-w-[60%] truncate text-emerald-300">
                              {item.highlight}
                            </span>
                          )}
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
                onClick={() => onPrimaryPlay(active)}
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
                onClick={() => onGoToSource(active)}
                className="-ml-6 flex-1 z-10 rounded-full bg-zinc-800 border border-white/5 px-5 py-3 pl-10 pr-4 text-sm font-semibold text-white shadow-lg active:scale-95 transition-transform"
              >
                {sourceActionText}
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
