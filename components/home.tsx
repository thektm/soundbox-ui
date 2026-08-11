import Image from "next/image";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import OverflowMarquee from "./OverflowMarquee";
import { SEO } from "./SEO";

import React, { useEffect, useRef, useState, useCallback } from "react";
import UserIcon from "./UserIcon";
import HeroSection from "./HeroSection";
import NotificationPopover from "./NotificationPopover";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { useDiscovery } from "./DiscoveryContext";
import { usePlayerActions } from "./PlayerContext";
import { useResponsiveLayout } from "./ResponsiveLayout";
import type { Track } from "./PlayerContext";
import { useI18n } from "./I18nContext";
import { useNotifications } from "./NotificationContext";
import { createSlug } from "../lib/slug";
import { getPlayerFeaturedArtists, getSongDisplayTitle, withSongDisplayTitle } from "../lib/songDisplay";
import SongTitleWithFeaturedArtists from "./SongTitleWithFeaturedArtists";
import PromotionBadge from "./PromotionBadge";
import {
  buildHomeSummaryRequestKey,
  HOME_SUMMARY_URL,
  invalidateHomeSummaryRequest,
  requestHomeSummary,
} from "../lib/homeSummaryPrefetch";
import { clientTrace } from "../lib/clientDebug";
import { getUserFacingErrorMessage } from "../lib/clientError";

// API Interfaces
interface ApiGenreLink {
  id: number;
  name: string;
}

interface ApiSong {
  id: number;
  title: string;
  display_title?: string;
  featured_artists?: any[];
  artist_name: string;
  album_title: string;
  cover_image: string;
  stream_url: string;
  duration_seconds: number;
  is_liked: boolean;
  genres?: ApiGenreLink[];
  genre_ids?: number[];
  genre_names: string[];
  tag_names: string[];
  mood_names: string[];
  sub_genre_names: string[];
  play_count?: number;
  is_promoted?: boolean;
}

interface ApiArtist {
  id: number;
  name: string;
  profile_image: string;
  is_following: boolean;
  verified: boolean;
  followers_count: number;
}

interface ApiAlbum {
  id: number;
  title: string;
  artist_name: string;
  cover_image: string;
  is_liked: boolean;
  genres?: ApiGenreLink[];
  genre_names: string[];
  mood_names: string[];
  sub_genre_names: string[];
}

interface ApiPlaylist {
  id: number;
  unique_id: string;
  title: string;
  description: string;
  cover_image: string;
  top_three_song_covers?: string[];
  covers?: string[];
  songs_count: number;
  is_liked: boolean;
  genres?: ApiGenreLink[];
  genre_ids?: number[];
  genre_names?: string[];
}

const HOME_GENRE_ACCENT_HEX: Record<number, string> = {
  1: "#E91E63",
  2: "#6A1B9A",
  3: "#F57F17",
  4: "#212121",
  5: "#E65100",
  6: "#1565C0",
  7: "#4E342E",
  8: "#37474F",
  9: "#2E7D32",
  10: "#006064",
  11: "#B71C1C",
  12: "#F9A825",
  13: "#33691E",
  14: "#880E4F",
};

interface HomeSummaryResponse {
  _audience?: string;
  songs_recommendations: {
    type: string;
    message: string;
    error?: string;
    count?: number;
    next?: string | null;
    songs: ApiSong[];
  };
  latest_releases: {
    count: number;
    next: string | null;
    results: ApiSong[];
  };
  popular_artists: {
    count: number;
    next: string | null;
    results: ApiArtist[];
  };
  popular_albums: {
    count: number;
    next: string | null;
    results: ApiAlbum[];
  };
  playlist_recommendations:
    | {
        count: number;
        next: string | null;
        results: ApiPlaylist[];
      }
    | ApiPlaylist[];
  discoveries: {
    count: number;
    next: string | null;
    results: ApiSong[];
  };
  trending?: {
    count: number;
    window_days: number | null;
    is_all_time: boolean;
    minimum_met: boolean;
    results: ApiSong[];
  };
  sections: number;
}

const normalizeGenreLinks = (item: any): ApiGenreLink[] => {
  const byId = new Map<number, ApiGenreLink>();
  const add = (idValue: unknown, nameValue: unknown) => {
    const id = Number(idValue);
    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    if (!Number.isFinite(id) || id <= 0 || !name || byId.has(id)) return;
    byId.set(id, { id, name });
  };

  if (Array.isArray(item?.genres)) {
    item.genres.forEach((genre: any) =>
      add(genre?.id, genre?.name ?? genre?.title),
    );
  }
  if (Array.isArray(item?.genre_ids)) {
    item.genre_ids.forEach((genre: any, index: number) => {
      if (genre && typeof genre === "object") {
        add(genre.id, genre.name ?? genre.title ?? item?.genre_names?.[index]);
      } else {
        add(genre, item?.genre_names?.[index]);
      }
    });
  }

  return Array.from(byId.values());
};

const normalizeSongPayload = (song: any): ApiSong => {
  const genres = normalizeGenreLinks(song);
  return {
    ...withSongDisplayTitle(song || {}),
    genres,
    genre_ids: genres.length
      ? genres.map((genre) => genre.id)
      : Array.isArray(song?.genre_ids)
        ? song.genre_ids
            .map((genre: any) => Number(genre?.id ?? genre))
            .filter((id: number) => Number.isFinite(id) && id > 0)
        : [],
    genre_names: genres.length
      ? genres.map((genre) => genre.name)
      : Array.isArray(song?.genre_names)
        ? song.genre_names.filter((name: unknown): name is string => typeof name === "string")
        : [],
    tag_names: Array.isArray(song?.tag_names) ? song.tag_names : [],
    mood_names: Array.isArray(song?.mood_names) ? song.mood_names : [],
    sub_genre_names: Array.isArray(song?.sub_genre_names)
      ? song.sub_genre_names
      : [],
  } as ApiSong;
};


const normalizePlaylistPayload = (playlist: any): ApiPlaylist => {
  const genres = normalizeGenreLinks(playlist);
  return {
    ...(playlist || {}),
    genres,
    genre_ids: genres.length
      ? genres.map((genre) => genre.id)
      : Array.isArray(playlist?.genre_ids)
        ? playlist.genre_ids
            .map((genre: any) => Number(genre?.id ?? genre))
            .filter((id: number) => Number.isFinite(id) && id > 0)
        : [],
    genre_names: genres.length
      ? genres.map((genre) => genre.name)
      : Array.isArray(playlist?.genre_names)
        ? playlist.genre_names.filter(
            (name: unknown): name is string =>
              typeof name === "string" && Boolean(name.trim()),
          )
        : [],
  } as ApiPlaylist;
};

const normalizeResultsSection = <T,>(section: any, mapItem: (item: any) => T) => {
  const rawResults = Array.isArray(section)
    ? section
    : Array.isArray(section?.results)
      ? section.results
      : [];
  return {
    ...(section && !Array.isArray(section) ? section : {}),
    count: Number.isFinite(Number(section?.count))
      ? Number(section.count)
      : rawResults.length,
    next: typeof section?.next === "string" ? section.next : null,
    results: rawResults.map(mapItem),
  };
};

const normalizeHomeSummaryPayload = (
  payload: any,
  audience: string,
): HomeSummaryResponse => {
  const source = payload && typeof payload === "object" ? payload : {};
  const recommendationSection = source.songs_recommendations || {};
  const recommendationSongs = Array.isArray(recommendationSection.songs)
    ? recommendationSection.songs
    : Array.isArray(recommendationSection.results)
      ? recommendationSection.results
      : [];

  return {
    ...source,
    _audience: audience,
    songs_recommendations: {
      ...recommendationSection,
      type: recommendationSection.type || "",
      message: recommendationSection.message || recommendationSection.error || "",
      count: Number.isFinite(Number(recommendationSection.count))
        ? Number(recommendationSection.count)
        : recommendationSongs.length,
      next:
        typeof recommendationSection.next === "string"
          ? recommendationSection.next
          : null,
      songs: recommendationSongs.map(normalizeSongPayload),
    },
    latest_releases: normalizeResultsSection(
      source.latest_releases,
      normalizeSongPayload,
    ),
    popular_artists: normalizeResultsSection(
      source.popular_artists,
      (artist) => artist as ApiArtist,
    ),
    popular_albums: normalizeResultsSection(source.popular_albums, (album) => {
      const genres = normalizeGenreLinks(album);
      return {
        ...album,
        genres,
        genre_names: genres.length
          ? genres.map((genre) => genre.name)
          : Array.isArray(album?.genre_names)
            ? album.genre_names
            : [],
        mood_names: Array.isArray(album?.mood_names) ? album.mood_names : [],
        sub_genre_names: Array.isArray(album?.sub_genre_names)
          ? album.sub_genre_names
          : [],
      } as ApiAlbum;
    }),
    playlist_recommendations: normalizeResultsSection(
      source.playlist_recommendations,
      normalizePlaylistPayload,
    ),
    discoveries: normalizeResultsSection(
      source.discoveries,
      normalizeSongPayload,
    ),
    trending: source.trending
      ? {
          ...normalizeResultsSection(source.trending, normalizeSongPayload),
          window_days: source.trending.window_days ?? null,
          is_all_time: Boolean(source.trending.is_all_time),
          minimum_met: Boolean(source.trending.minimum_met),
        }
      : undefined,
    sections: Number.isFinite(Number(source.sections))
      ? Number(source.sections)
      : 0,
  };
};

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface ApiTopAlbum {
  id: number;
  title: string;
  artist_name: string;
  cover_image: string;
  release_date: string;
  likes_count: string;
  is_liked: string;
  total_song_plays: number;
  score: number;
}

interface ApiTopArtist {
  id: number;
  name: string;
  artistic_name: string;
  profile_image: string;
  verified: boolean;
  followers_count: string;
  monthly_listeners_count: string;
  is_following: string;
}

interface ApiTopSong {
  id: number;
  title: string;
  artist_name: string;
  album_title: string;
  cover_image: string;
  stream_url: string;
  duration_seconds: number;
  plays: string;
  likes_count: string;
  is_liked: string;
}

// Utility function to format duration
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Utility function to convert ApiSong to Track
const apiSongToTrack = (song: any): Track => ({
  id: String(song.id),
  title: getSongDisplayTitle(song),
  artist: song.artist_name,
  featuredArtists: getPlayerFeaturedArtists(song),
  artistId: song.artist_id || song.artist,
  image: song.cover_image || "/default-cover.jpg",
  duration: formatDuration(song.duration_seconds),
  durationSeconds: song.duration_seconds,
  src: song.stream_url ? song.stream_url.replace("http://", "https://") : "",
  isLiked:
    String(song.is_liked) === "true" ||
    song.is_liked === true ||
    song.is_liked === "1",
  likesCount: parseInt(String(song.likes_count || "0")),
});

// Inline SVG icons
const Bell = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth={2}
    aria-hidden="true"
  >
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Play = ({ className, fill }: { className?: string; fill?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={fill || "white"}
    stroke="white"
    strokeWidth={2}
    aria-hidden="true"
  >
    <polygon
      points="5 3 19 12 5 21 5 3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MoreHorizontal = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="white"
    stroke="white"
    strokeWidth={2}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

type ItemType = {
  id: number | string;
  title: string;
  subtitle: string;
  img: string | string[];
  duration?: string;
  isNew: boolean;
  type?: "song" | "album" | "artist" | "playlist";
  artistId?: number | string;
  artistSlug?: string;
  slug?: string;
  songsCount?: number;
  isPromoted?: boolean;
  featuredArtists?: Array<{
    id: string | number;
    name: string;
    uniqueId?: string;
  }>;
};

type HeroHighlight = {
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

export default function Home() {
  const { direction, language } = useI18n();
  const { logout, accessToken, user, authenticatedFetch, isInitializing } = useAuth();
  const {
    notifications,
    hasUnread,
    markingReadIds,
    isMarkingAll,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    formatTimeAgo,
  } = useNotifications();
  const { setCurrentPage, navigateTo, homeCache, setHomeCache } =
    useNavigation();
  const {
    recommendedPlaylists: playlistRecommendations,
    isLoading: loadingPlaylistRecommendations,
    setRecommendedData,
    nextUrl: recommendedNextUrl,
    loadMoreRecommended,
  } = useDiscovery();
  const { setQueue } = usePlayerActions();
  const isGuest = !accessToken;
  const audienceKey = isGuest
    ? `guest:${language}`
    : `member:${user?.id ?? "loading"}:${language}`;
  const cachedHomeData =
    homeCache?._audience === audienceKey
      ? normalizeHomeSummaryPayload(homeCache, audienceKey)
      : null;

  const isPremium = user?.plan === "premium";

  const [homeData, setHomeData] = useState<HomeSummaryResponse | null>(
    cachedHomeData,
  );

  // Extra sections state
  const [dailyTopAlbums, setDailyTopAlbums] =
    useState<PaginatedResponse<ApiTopAlbum> | null>(null);
  const [dailyTopArtists, setDailyTopArtists] =
    useState<PaginatedResponse<ApiTopArtist> | null>(null);
  const [dailyTopSongs, setDailyTopSongs] =
    useState<PaginatedResponse<ApiTopSong> | null>(null);
  const [weeklyTopAlbums, setWeeklyTopAlbums] =
    useState<PaginatedResponse<ApiTopAlbum> | null>(null);
  const [weeklyTopArtists, setWeeklyTopArtists] =
    useState<PaginatedResponse<ApiTopArtist> | null>(null);
  const [weeklyTopSongs, setWeeklyTopSongs] =
    useState<PaginatedResponse<ApiTopSong> | null>(null);

  const [loadingExtra, setLoadingExtra] = useState({
    dailyTopAlbums: true,
    dailyTopArtists: true,
    dailyTopSongs: true,
    weeklyTopAlbums: true,
    weeklyTopArtists: true,
    weeklyTopSongs: true,
  });

  // if we already have cached home data, don't show skeleton on mount
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    cachedHomeData ? false : true,
  );
  const [homeError, setHomeError] = useState<string | null>(null);
  const [homeReloadKey, setHomeReloadKey] = useState(0);
  const [showBrandText, setShowBrandText] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const isInitialMount = useRef(true);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLDivElement>(null);
  const homeRequestSequenceRef = useRef(0);
  const homeCacheRef = useRef(homeCache);
  homeCacheRef.current = homeCache;
  const { isDesktop } = useResponsiveLayout();
  const isMobileView = !isDesktop;

  const authenticatedFetchRef = useRef(authenticatedFetch);
  authenticatedFetchRef.current = authenticatedFetch;
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  const fetchPublicHome = useCallback(
    async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === "string" ? input : String(input);
      const authenticated = Boolean(accessTokenRef.current);
      clientTrace("HOME", "fetch:dispatch", { url, authenticated });

      const startedAt = performance.now();
      const response = authenticated
        ? await authenticatedFetchRef.current(input)
        : await fetch(input);

      clientTrace("HOME", "fetch:response", {
        url,
        authenticated,
        status: response.status,
        ok: response.ok,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      return response;
    },
    [],
  );

  const sectionTitles = [
    isGuest ? "منتخب‌های امروز" : "برای شما",
    "جدیدترین ریلیز ها ",
    "هنرمندان محبوب",
    "آلبوم‌های محبوب",
    "در حال رشد",
    "پلی لیست‌های جدید برای شما",
    "برترین آهنگ‌های روز",
    "برترین آلبوم‌های روز",
    "برترین هنرمندان روز",
    "برترین آهنگ‌های هفته",
    "برترین آلبوم‌های هفته",
    "برترین هنرمندان هفته",
  ];

  useEffect(() => {
    clientTrace("HOME", "component:mounted", {
      audienceKey,
      isGuest,
      isInitializing,
      hasCachedHomeData: Boolean(cachedHomeData),
      language,
    });
    return () => {
      clientTrace("HOME", "component:unmounted", { audienceKey }, "warn");
    };
    // Mount/unmount only. Audience changes are logged separately below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clientTrace("HOME", "auth-and-audience-state", {
      audienceKey,
      isGuest,
      isInitializing,
      hasAccessToken: Boolean(accessToken),
      userId: user?.id ?? null,
      language,
    });
  }, [accessToken, audienceKey, isGuest, isInitializing, language, user?.id]);

  useEffect(() => {
    // Authentication determines the Home audience. Waiting here avoids a
    // transient guest request while an existing member session is restored.
    if (isInitializing) {
      clientTrace("HOME", "summary-effect:skipped-auth-initializing", {
        audienceKey,
      });
      return;
    }

    // Every mounted effect instance subscribes to requestHomeSummary(). The
    // request helper performs network-level deduplication, while this local
    // sequence only prevents an obsolete/unmounted consumer from committing.
    // This is intentionally StrictMode-safe: the development remount attaches
    // a fresh consumer to the same in-flight promise instead of skipping it.
    const requestId = ++homeRequestSequenceRef.current;
    let active = true;
    const requestedAudience = audienceKey;
    const cachedForAudience =
      homeCacheRef.current?._audience === requestedAudience
        ? normalizeHomeSummaryPayload(homeCacheRef.current, requestedAudience)
        : null;
    const isBackground = Boolean(cachedForAudience);
    const requestKey = buildHomeSummaryRequestKey(
      accessTokenRef.current,
      language,
    );
    const isCurrentRequest = () =>
      active && homeRequestSequenceRef.current === requestId;

    clientTrace("HOME", "summary-effect:start", {
      requestId,
      requestedAudience,
      isBackground,
      reloadKey: homeReloadKey,
      cacheAudience: homeCacheRef.current?._audience ?? null,
    });

    setHomeError(null);
    if (cachedForAudience) {
      clientTrace("HOME", "state:using-audience-cache", {
        requestId,
        requestedAudience,
      });
      setHomeData(cachedForAudience);
      setIsLoading(false);
    } else {
      clientTrace("HOME", "state:reset-for-request", {
        requestId,
        requestedAudience,
      });
      setHomeData(null);
      setIsLoading(true);
    }

    const fetchHomeData = async (): Promise<void> => {
      const startedAt = performance.now();
      clientTrace("HOME", "summary-request:start", {
        requestId,
        requestedAudience,
        background: isBackground,
      });

      try {
        const data = await requestHomeSummary(requestKey, () =>
          fetchPublicHome(HOME_SUMMARY_URL),
        );
        const current = isCurrentRequest();

        clientTrace("HOME", "summary-request:promise-resolved", {
          requestId,
          requestedAudience,
          background: isBackground,
          hasData: Boolean(data),
          current,
          elapsedMs: Math.round(performance.now() - startedAt),
        });

        if (!current) {
          clientTrace(
            "HOME",
            "summary-request:ignored-obsolete-consumer",
            { requestId, requestedAudience, hasData: Boolean(data) },
            "warn",
          );
          return;
        }
        if (!data) {
          throw new Error("Home summary returned an empty response body.");
        }

        const nextData = normalizeHomeSummaryPayload(data, requestedAudience);
        clientTrace("HOME", "summary:normalized", {
          requestId,
          requestedAudience,
          recommendations: nextData.songs_recommendations.songs.length,
          latest: nextData.latest_releases.results.length,
          artists: nextData.popular_artists.results.length,
          albums: nextData.popular_albums.results.length,
          playlists: Array.isArray(nextData.playlist_recommendations)
            ? nextData.playlist_recommendations.length
            : nextData.playlist_recommendations.results.length,
          discoveries: nextData.discoveries.results.length,
          trending: nextData.trending?.results.length ?? 0,
        });

        const hasChanged =
          !cachedForAudience ||
          JSON.stringify(nextData) !== JSON.stringify(cachedForAudience);

        // The active consumer always receives the successful result. Cache
        // writes are deduplicated separately and must never gate rendering.
        setHomeData(nextData);
        setHomeError(null);
        clientTrace("HOME", "state:set-home-data", {
          requestId,
          requestedAudience,
          background: isBackground,
          hasChanged,
        });

        if (hasChanged) {
          try {
            setHomeCache(nextData);
            clientTrace("HOME", "cache:set-home-cache", {
              requestId,
              requestedAudience,
            });
          } catch (error) {
            clientTrace("HOME", "cache:set-home-cache-failed", error, "warn");
          }
        }
      } catch (error) {
        const current = isCurrentRequest();
        const message = getUserFacingErrorMessage(error, language, {
          fa: "بارگذاری صفحه خانه انجام نشد. لطفاً دوباره تلاش کنید.",
          en: "Home could not be loaded. Please try again.",
        });

        clientTrace(
          "HOME",
          "summary-request:failed",
          {
            requestId,
            requestedAudience,
            background: isBackground,
            current,
            elapsedMs: Math.round(performance.now() - startedAt),
            error,
          },
          "error",
        );

        if (current) {
          console.error("Error fetching home data:", error);
          invalidateHomeSummaryRequest(requestKey);
          setHomeError(message);
          // Preserve a valid audience cache during a failed background refresh.
          if (!cachedForAudience) setHomeData(null);
        }
      } finally {
        const current = isCurrentRequest();
        clientTrace("HOME", "summary-request:finally", {
          requestId,
          requestedAudience,
          background: isBackground,
          current,
          willReleaseLoading: current,
          elapsedMs: Math.round(performance.now() - startedAt),
        });

        // Never leave the active Home consumer behind the skeleton, regardless
        // of whether the request succeeded or failed.
        if (current) setIsLoading(false);
      }
    };

    void fetchHomeData();
    return () => {
      active = false;
      clientTrace("HOME", "summary-effect:cancelled", {
        requestId,
        requestedAudience,
      });
    };
  }, [
    audienceKey,
    fetchPublicHome,
    homeReloadKey,
    isInitializing,
    language,
    setHomeCache,
  ]);

  // Fetch extra sections
  useEffect(() => {
    const fetchExtra = async (
      endpoint: string,
      setter: (data: any) => void,
      key: string,
    ) => {
      try {
        const response = await fetchPublicHome(
          `https://api.sedabox.com/api/home/${endpoint}/`,
        );
        if (response.ok) {
          const data = await response.json();
          setter(data);
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
      } finally {
        setLoadingExtra((prev) => ({ ...prev, [key]: false }));
      }
    };

    fetchExtra("daily-top-albums-global", setDailyTopAlbums, "dailyTopAlbums");
    fetchExtra(
      "daily-top-artists-global",
      setDailyTopArtists,
      "dailyTopArtists",
    );
    fetchExtra("daily-top-songs-global", setDailyTopSongs, "dailyTopSongs");
    fetchExtra(
      "weekly-top-albums-global",
      setWeeklyTopAlbums,
      "weeklyTopAlbums",
    );
    fetchExtra(
      "weekly-top-artists-global",
      setWeeklyTopArtists,
      "weeklyTopArtists",
    );
    fetchExtra("weekly-top-songs-global", setWeeklyTopSongs, "weeklyTopSongs");
  }, [fetchPublicHome]);

  useEffect(() => {
    // The global provider keeps the socket alive on every route. Landing on
    // Home still performs an authoritative HTTP reconciliation so missed or
    // delayed socket events can never leave the badge stale.
    if (!isInitializing && !isGuest) {
      void refreshNotifications();
    }
  }, [isGuest, isInitializing, refreshNotifications]);

  const fetchNextPlaylists = async () => {
    // Use DiscoveryContext's loader for pagination
    if (!loadMoreRecommended) return;
    try {
      await loadMoreRecommended();
    } catch (error) {
      console.error("Error fetching next playlists:", error);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentPage("login");
  };

  const handlePlaySong = (songId: number | string, allSongs: ApiSong[]) => {
    const tracks = allSongs.map(apiSongToTrack);
    const startIndex = allSongs.findIndex(
      (s) => String(s.id) === String(songId),
    );
    setQueue(tracks, startIndex >= 0 ? startIndex : 0);
  };

  // Fetch the next page for a given paginated section and append results
  const fetchNextFor = async (
    sectionKey:
      | "latest_releases"
      | "popular_artists"
      | "popular_albums"
      | "playlist_recommendations"
      | "songs_recommendations"
      | "discoveries",
  ) => {
    if (!homeData) return;
    const section = (homeData as any)[sectionKey];
    if (!section || !section.next) return;
    try {
      const url = section.next.replace(/^http:/, "https:");
      const res = await fetchPublicHome(url);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const page = await res.json();

      // compute updated value from current homeData and the fetched page, then update both local state and the shared cache
      const updated = { ...(homeData as any) } as any;
      if (sectionKey === "songs_recommendations") {
        const newSongs = Array.isArray(page)
          ? page
          : page.songs || page.results || [];
        const existing = updated.songs_recommendations || { songs: [] };
        updated.songs_recommendations = {
          ...existing,
          songs: [...(existing.songs || []), ...newSongs],
          next: page.next || null,
        };
      } else {
        const newResults = Array.isArray(page) ? page : page.results || [];
        const existing = updated[sectionKey] || { results: [] };
        updated[sectionKey] = {
          ...existing,
          results: [...(existing.results || []), ...newResults],
          next: page.next || null,
        };
      }

      setHomeData(updated);
      try {
        setHomeCache(updated);
      } catch (e) {
        // ignore if cache setter not available
      }
    } catch (error) {
      console.error("Error fetching next page for", sectionKey, error);
    }
  };

  // Derived data for sections
  const sectionData = homeData
    ? {
        forYou: homeData.songs_recommendations.songs.map((song) => ({
          id: song.id,
          title: getSongDisplayTitle(song),
          featuredArtists: getPlayerFeaturedArtists(song),
          subtitle: song.artist_name,
          img: song.cover_image,
          duration: formatDuration(song.duration_seconds),
          isNew: false,
          type: "song" as const,
          artistId: (song as any).artist_id || (song as any).artist,
          artistSlug: (song as any).artist_slug,
          isPromoted: Boolean(song.is_promoted),
        })),
        hottestDrops: homeData.latest_releases.results
          .slice(0, 5)
          .map((song) => ({
            id: song.id,
            title: getSongDisplayTitle(song),
            featuredArtists: getPlayerFeaturedArtists(song),
            subtitle: song.artist_name,
            img: song.cover_image,
            duration: formatDuration(song.duration_seconds),
            isNew: true,
            type: "song" as const,
            artistId: (song as any).artist_id || (song as any).artist,
            artistSlug: (song as any).artist_slug,
          })),
        popularArtists: homeData.popular_artists.results.map((artist) => ({
          id: artist.id,
          title: artist.name,
          subtitle: "Artist",
          img: artist.profile_image || "",
          isNew: false,
          type: "artist" as const,
          slug: (artist as any).unique_id || createSlug(artist.name),
        })),
        popularAlbums: homeData.popular_albums.results.map((album) => ({
          id: album.id,
          title: album.title,
          subtitle: album.artist_name,
          img: album.cover_image || "",
          isNew: false,
          type: "album" as const,
          artistId: (album as any).artist_id || (album as any).artist,
          artistSlug: (album as any).artist_slug,
          slug: createSlug(album.title),
        })),
        top10Week: homeData.latest_releases.results
          .slice(0, 10)
          .map((song, index) => ({
            id: song.id,
            title: getSongDisplayTitle(song),
            featuredArtists: getPlayerFeaturedArtists(song),
            subtitle: song.artist_name,
            img: song.cover_image,
            duration: formatDuration(song.duration_seconds),
            isNew: index < 3,
            type: "song" as const,
            artistId: (song as any).artist_id || (song as any).artist,
            artistSlug: (song as any).artist_slug,
          })),
        newDiscoveries: homeData.discoveries.results
          .slice(0, 6)
          .map((song) => ({
            id: song.id,
            title: getSongDisplayTitle(song),
            featuredArtists: getPlayerFeaturedArtists(song),
            subtitle: song.artist_name,
            img: song.cover_image,
            duration: formatDuration(song.duration_seconds),
            isNew: false,
            type: "song" as const,
            artistId: (song as any).artist_id || (song as any).artist,
            artistSlug: (song as any).artist_slug,
          })),
        trending: (homeData.trending?.results || []).map((song) => ({
          id: song.id,
          title: getSongDisplayTitle(song),
          featuredArtists: getPlayerFeaturedArtists(song),
          subtitle: song.artist_name,
          img: song.cover_image,
          duration: formatDuration(song.duration_seconds),
          isNew: false,
          type: "song" as const,
          artistId: (song as any).artist_id || (song as any).artist,
          artistSlug: (song as any).artist_slug,
        })),
        top10HipHop: homeData.latest_releases.results
          .slice(10, 20)
          .map((song, index) => ({
            id: song.id,
            title: getSongDisplayTitle(song),
            featuredArtists: getPlayerFeaturedArtists(song),
            subtitle: song.artist_name,
            img: song.cover_image,
            duration: formatDuration(song.duration_seconds),
            isNew: index < 3,
            type: "song" as const,
            artistId: (song as any).artist_id || (song as any).artist,
            artistSlug: (song as any).artist_slug,
          })),
        newPlaylists: (playlistRecommendations || []).map((playlist: any) => ({
          id: playlist.unique_id,
          title: playlist.title,
          subtitle: playlist.description,
          img: playlist.top_three_song_covers || playlist.covers || [],
          isNew: false,
          type: "playlist" as const,
          slug: createSlug(playlist.title),
          songsCount: playlist.songs_count ?? playlist.songsCount ?? 0,
        })),
      }
    : null;

  useEffect(() => {
    const hasTerminalError = !isLoading && Boolean(homeError) && !homeData;
    // Once any valid summary payload exists, render it immediately. The chart
    // and playlist requests remain independent and keep their own per-section
    // skeletons, so a slow chart endpoint can never hold the Hero or summary
    // sections behind the full-page loader.
    const isRenderBlocked =
      (!homeData && !hasTerminalError) ||
      (Boolean(homeData) && !sectionData);
    const snapshot = {
      isLoading,
      hasHomeData: Boolean(homeData),
      hasSectionData: Boolean(sectionData),
      audienceKey,
      homeError,
      recommendations: homeData?.songs_recommendations?.songs?.length ?? null,
      latest: homeData?.latest_releases?.results?.length ?? null,
      discoveries: homeData?.discoveries?.results?.length ?? null,
    };

    clientTrace(
      "HOME",
      hasTerminalError
        ? "render:error-state"
        : isRenderBlocked
          ? "render:skeleton"
          : "render:data-ready",
      snapshot,
      hasTerminalError || isRenderBlocked ? "warn" : "info",
    );

    if (!isRenderBlocked) return;
    const watchdog = window.setTimeout(() => {
      clientTrace("HOME", "render:still-blocked-after-8s", snapshot, "error");
    }, 8000);
    return () => window.clearTimeout(watchdog);
  }, [audienceKey, homeData, homeError, isLoading, sectionData]);

  useEffect(() => {
    const delay = isInitialMount.current ? 2700 : 700;
    const timer = setTimeout(() => {
      setShowBrandText(false);
      isInitialMount.current = false;
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  // Recompute whenever the list of rendered sections changes:
  // – homeData becomes available (first real render)
  // – a skeleton section resolves to real content (loadingExtra / playlist loading)
  const observerKey = `${homeData !== null}|${loadingPlaylistRecommendations}|${JSON.stringify(loadingExtra)}`;

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    // Defer one tick so React has committed all sectionRef callback assignments
    const tid = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = Number(entry.target.getAttribute("data-index"));
              setActiveIndex(idx);
            }
          });
        },
        { rootMargin: "-100px 0px -40% 0px", threshold: 0.4 },
      );
      sectionRefs.current.forEach((el) => el && observer!.observe(el));
    }, 50);
    return () => {
      clearTimeout(tid);
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observerKey]);

  useEffect(() => {
    // Mobile nav – scrollIntoView
    const nav = navRef.current;
    if (nav) {
      const activeBtn = nav.querySelector(
        `[data-index="${activeIndex}"]`,
      ) as HTMLElement;
      activeBtn?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
    // Desktop nav – manual center calculation so the active pill lands in the middle
    const desktopNav = desktopNavRef.current;
    if (desktopNav) {
      const activeBtn = desktopNav.querySelector(
        `[data-index="${activeIndex}"]`,
      ) as HTMLElement;
      if (activeBtn) {
        const navWidth = desktopNav.offsetWidth;
        const btnLeft = activeBtn.offsetLeft;
        const btnWidth = activeBtn.offsetWidth;
        const scrollTarget = btnLeft - navWidth / 2 + btnWidth / 2;
        desktopNav.scrollTo({ left: scrollTarget, behavior: "smooth" });
      }
    }
  }, [activeIndex]);

  if (!isLoading && homeError && !homeData) {
    return (
      <>
        <SEO />
        <main
          className="flex min-h-[70vh] items-center justify-center px-6 text-white"
          role="alert"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-center shadow-2xl">
            <h1 className="text-xl font-bold">
              {language === "fa"
                ? "صفحه اصلی بارگذاری نشد"
                : "Home could not load"}
            </h1>
            <p className="mt-3 break-words text-sm leading-6 text-zinc-400">
              {homeError}
            </p>
            <button
              type="button"
              className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
              onClick={() => setHomeReloadKey((value) => value + 1)}
            >
              {language === "fa" ? "تلاش دوباره" : "Try again"}
            </button>
          </div>
        </main>
      </>
    );
  }

  // Do not gate already-available summary content on the request's final
  // bookkeeping state. This matters for cached/partial summary delivery and
  // guarantees progressive rendering while independent sections are loading.
  if (!sectionData || !homeData) {
    return (
      <>
        <SEO />
        <div
          className="relative bg-transparent text-white font-sans pb-24 md:pb-4 md:min-h-screen selection:bg-green-500 selection:text-black"
          style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
        >
          <div className="pt-4">
            <div className="px-4 text-start">
              <div className="h-8 w-48 rounded bg-zinc-800 animate-pulse" />
            </div>
            <div className="flex flex-col gap-8 mt-4">
              {/* Four placeholder sections */}
              <div className="flex flex-col gap-3">
                <div className="px-4 text-start">
                  <div className="h-6 w-40 rounded bg-zinc-800 animate-pulse" />
                </div>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="snap-start shrink-0 w-36 flex flex-col gap-2"
                    >
                      <div className="aspect-square rounded-lg bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
                      <div className="h-2 w-20 rounded bg-zinc-800 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="px-4 text-start">
                  <div className="h-6 w-40 rounded bg-zinc-800 animate-pulse" />
                </div>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="snap-start shrink-0 w-40 flex flex-col gap-2"
                    >
                      <div className="aspect-square rounded-lg bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
                      <div className="h-2 w-20 rounded bg-zinc-800 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="px-4 text-start">
                  <div className="h-6 w-40 rounded bg-zinc-800 animate-pulse" />
                </div>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="snap-start shrink-0 w-28 flex flex-col gap-2"
                    >
                      <div className="aspect-square rounded-full bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-24 rounded bg-zinc-800 animate-pulse" />
                      <div className="h-2 w-16 rounded bg-zinc-800 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="px-4 text-start">
                  <div className="h-6 w-40 rounded bg-zinc-800 animate-pulse" />
                </div>
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="snap-start shrink-0 w-40 flex flex-col gap-2"
                    >
                      <div className="aspect-square rounded-lg bg-zinc-800 animate-pulse" />
                      <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
                      <div className="h-2 w-20 rounded bg-zinc-800 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Build the list of sections to show based on the server response
  const availableSections: Array<{
    key: string;
    title: string;
    subtitle?: string;
    content: React.ReactNode;
    showMore?: boolean;
    onShowMore?: () => void;
    onTitleClick?: () => void;
  }> = [];

  if (
    homeData.songs_recommendations &&
    homeData.songs_recommendations.songs &&
    homeData.songs_recommendations.songs.length > 0
  ) {
    availableSections.push({
      key: "songs_recommendations",
      title: isGuest ? "منتخب‌های امروز" : "برای شما",
      subtitle: isGuest
        ? "بر اساس پخش‌های ۲۴ ساعت گذشته؛ با محبوب‌ها به‌عنوان جایگزین"
        : homeData.songs_recommendations.type === "personalized"
          ? "بر اساس شنیده‌ها و انتخاب‌های اخیر شما"
          : "پیشنهادهایی برای شروع یک کشف تازه",
      content: (
        <HorizontalList
          items={sectionData.forYou}
          onPlay={(item: ItemType) =>
            handlePlaySong(item.id, homeData.songs_recommendations.songs)
          }
        />
      ),
      // Always show the "نمایش بیشتر" button on the home screen for the
      // personalized section so users can open the dedicated "for-you" page
      // regardless of whether the server returned a `next` page here.
      showMore: sectionData.forYou.length > 0,
      onShowMore: () => navigateTo("for-you"),
      onTitleClick: () => navigateTo("for-you"),
    });
  }

  if (
    homeData.latest_releases &&
    homeData.latest_releases.results &&
    homeData.latest_releases.results.length > 0
  ) {
    availableSections.push({
      key: "latest_releases",
      title: "جدیدترین ریلیز ها",
      content: (
        <div
          className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4"
        >
          {sectionData.hottestDrops.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                handlePlaySong(item.id, homeData.latest_releases.results)
              }
              aria-label={`پخش ${item.title} از ${item.subtitle}`}
              className="snap-center shrink-0 w-[85vw] sm:w-80 relative group cursor-pointer text-start focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl outline-none"
            >
              <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden shadow-lg">
                <ImageWithPlaceholder
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  type="song"
                />
                <div className="absolute bottom-2 right-2 bg-black/60  px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  انتشار جدید
                </div>
              </div>
              <h3
                className="mt-2 w-fit max-w-full min-w-0 overflow-hidden text-lg font-bold hover:underline decoration-zinc-500"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo("song-detail", { id: item.id });
                }}
              >
                <OverflowMarquee text={item.title}>
                  <SongTitleWithFeaturedArtists song={item} />
                </OverflowMarquee>
              </h3>
              <p
                className="w-fit max-w-full min-w-0 overflow-hidden text-sm text-zinc-400 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.artistId) {
                    navigateTo("artist-detail", {
                      id: item.artistId,
                      slug: item.artistSlug,
                    });
                  }
                }}
              >
                <OverflowMarquee text={item.subtitle} />
              </p>
            </button>
          ))}
        </div>
      ),
      showMore: sectionData.hottestDrops.length > 0,
      onShowMore: () => navigateTo("latest-releases"),
      onTitleClick: () => navigateTo("latest-releases"),
    });
  }

  if (
    homeData.popular_artists &&
    homeData.popular_artists.results &&
    homeData.popular_artists.results.length > 0
  ) {
    availableSections.push({
      key: "popular_artists",
      title: "هنرمندان محبوب",
      content: (
        <HorizontalList
          items={sectionData.popularArtists}
          variant="circle"
          onItemClick={(item) =>
            navigateTo("artist-detail", {
              id: item.id,
              slug: (item as any).slug,
            })
          }
        />
      ),
      showMore: sectionData.popularArtists.length > 0,
      onShowMore: () => navigateTo("popular-artists"),
      onTitleClick: () => navigateTo("popular-artists"),
    });
  }

  if (
    homeData.popular_albums &&
    homeData.popular_albums.results &&
    homeData.popular_albums.results.length > 0
  ) {
    availableSections.push({
      key: "popular_albums",
      title: "آلبوم‌های محبوب",
      content: (
        <GlassAlbumGrid
          items={sectionData.popularAlbums}
          onItemClick={(item) =>
            navigateTo("album-detail", {
              id: item.id,
              slug: createSlug(item.title),
            })
          }
          maxItems={4}
          showMore={true}
          onShowMore={() => navigateTo("popular-albums")}
          overlayHeight="75%"
        />
      ),
      showMore: sectionData.popularAlbums.length > 0,
      onShowMore: () => navigateTo("popular-albums"),
      onTitleClick: () => navigateTo("popular-albums"),
    });
  }

  if (
    homeData.discoveries &&
    homeData.discoveries.results &&
    homeData.discoveries.results.length > 0
  ) {
    availableSections.push({
      key: "discoveries",
      title: "اکتشافات جدید",
      content: (
        <HorizontalList
          items={sectionData.newDiscoveries}
          onPlay={(item: ItemType) =>
            handlePlaySong(item.id, homeData.discoveries.results)
          }
        />
      ),
      showMore: sectionData.newDiscoveries.length > 0,
      onShowMore: () => navigateTo("new-discoveries"),
      onTitleClick: () => navigateTo("new-discoveries"),
    });
  }

  if (
    homeData.trending &&
    Array.isArray(homeData.trending.results) &&
    homeData.trending.results.length > 0
  ) {
    availableSections.push({
      key: "trending",
      title: "در حال رشد",
      content: (
        <HorizontalList
          items={sectionData.trending}
          onPlay={(item: ItemType) =>
            handlePlaySong(item.id, homeData.trending?.results || [])
          }
        />
      ),
    });
  }

  if (loadingPlaylistRecommendations) {
    const playlistSectionTitle = isGuest
      ? "پلی‌لیست‌های منتخب"
      : "پلی‌لیست‌های جدید برای شما";
    availableSections.push({
      key: "playlist_recommendations_skeleton",
      title: playlistSectionTitle,
      content: (
        <SectionSkeleton title={playlistSectionTitle} variant="horizontal" />
      ),
    });
  } else if (playlistRecommendations && playlistRecommendations.length > 0) {
    const playlists = playlistRecommendations;

    availableSections.push({
      key: "playlist_recommendations",
      title: isGuest
        ? "پلی‌لیست‌های منتخب"
        : "پلی‌لیست‌های جدید برای شما",
      subtitle: isGuest
        ? "انتخاب‌هایی آماده برای هر حال‌وهوا"
        : "هماهنگ با سلیقه و شنیده‌های شما",
      content: (
        <HorizontalList
          items={playlists.map((p: any) => ({
            id: p.unique_id,
            title: p.title,
            subtitle: p.description,
            img: p.covers || p.top_three_song_covers || p.cover_image,
            isNew: false,
            type: "playlist",
            slug: createSlug(p.title),
            songsCount: p.songs_count ?? p.songsCount ?? 0,
          }))}
          variant="layered"
          onItemClick={(item) =>
            navigateTo("playlist-detail", {
              id: item.id,
              slug: createSlug(item.title),
            })
          }
        />
      ),
      showMore: true,
      onShowMore: () => navigateTo("recommended-playlists"),
      onTitleClick: () => navigateTo("recommended-playlists"),
    });
  }

  // Daily Top Songs
  if (loadingExtra.dailyTopSongs) {
    availableSections.push({
      key: "daily_top_songs_skeleton",
      title: "برترین آهنگ‌های روز",
      content: (
        <SectionSkeleton title="برترین آهنگ‌های روز" variant="horizontal" />
      ),
    });
  } else if (dailyTopSongs && dailyTopSongs.results.length > 0) {
    availableSections.push({
      key: "daily_top_songs",
      title: "برترین آهنگ‌های روز",
      subtitle: "پرشنونده‌ترین‌های امروز در سراسر جهان",
      content: (
        <PremiumChartList
          items={dailyTopSongs.results.map((s) => ({
            id: s.id,
            title: getSongDisplayTitle(s),
            featuredArtists: getPlayerFeaturedArtists(s),
            subtitle: s.artist_name,
            img: s.cover_image,
            isNew: false,
            type: "song",
            artistId: (s as any).artist_id || (s as any).artist,
            artistSlug: (s as any).artist_slug,
          }))}
          onPlay={(item) =>
            handlePlaySong(item.id, dailyTopSongs.results as any)
          }
        />
      ),
      showMore: true,
      onShowMore: () =>
        navigateTo("chart-detail", {
          chartType: "daily-songs",
          type: "songs",
          initialData: dailyTopSongs,
        }),
      onTitleClick: () =>
        navigateTo("chart-detail", {
          chartType: "daily-songs",
          type: "songs",
          initialData: dailyTopSongs,
        }),
    });
  }

  // Daily Top Albums
  if (loadingExtra.dailyTopAlbums) {
    availableSections.push({
      key: "daily_top_albums_skeleton",
      title: "برترین آلبوم‌های روز",
      content: <SectionSkeleton title="برترین آلبوم‌های روز" variant="grid" />,
    });
  } else if (dailyTopAlbums && dailyTopAlbums.results.length > 0) {
    availableSections.push({
      key: "daily_top_albums",
      title: "برترین آلبوم‌های روز",
      subtitle: "آلبوم‌های ترند شده امروز",
      content: (
        <GlassAlbumGrid
          items={dailyTopAlbums.results.map((a) => ({
            id: a.id,
            title: a.title,
            subtitle: a.artist_name,
            img: a.cover_image,
            isNew: false,
            type: "album",
            artistId: (a as any).artist_id || (a as any).artist,
            artistSlug: (a as any).artist_slug,
            slug: createSlug(a.title),
          }))}
          onItemClick={(item) =>
            navigateTo("album-detail", {
              id: item.id,
              slug: createSlug(item.title),
            })
          }
          maxItems={4}
          showMore={true}
          onShowMore={() =>
            navigateTo("chart-detail", {
              chartType: "daily-albums",
              type: "albums",
              initialData: dailyTopAlbums,
            })
          }
          onTitleClick={() =>
            navigateTo("chart-detail", {
              chartType: "daily-albums",
              type: "albums",
              initialData: dailyTopAlbums,
            })
          }
          overlayHeight="50%"
        />
      ),
      showMore: true,
      onShowMore: () =>
        navigateTo("chart-detail", {
          chartType: "daily-albums",
          type: "albums",
          initialData: dailyTopAlbums,
        }),
      onTitleClick: () =>
        navigateTo("chart-detail", {
          chartType: "daily-albums",
          type: "albums",
          initialData: dailyTopAlbums,
        }),
    });
  }

  // Daily Top Artists
  if (loadingExtra.dailyTopArtists) {
    availableSections.push({
      key: "daily_top_artists_skeleton",
      title: "برترین هنرمندان روز",
      content: <SectionSkeleton title="برترین هنرمندان روز" variant="artist" />,
    });
  } else if (dailyTopArtists && dailyTopArtists.results.length > 0) {
    availableSections.push({
      key: "daily_top_artists",
      title: "برترین هنرمندان روز",
      subtitle: "هنرمندانی که امروز بیشترین مخاطب را داشتند",
      content: (
        <SpotlightArtistList
          items={dailyTopArtists.results.map((a) => ({
            id: a.id,
            title: a.name,
            subtitle: "Artist",
            img: a.profile_image,
            isNew: false,
            type: "artist",
            slug: (a as any).unique_id || createSlug(a.name),
          }))}
          onItemClick={(item) =>
            navigateTo("artist-detail", {
              id: item.id,
              slug: (item as any).slug,
            })
          }
        />
      ),
      showMore: true,
      onShowMore: () =>
        navigateTo("chart-detail", {
          chartType: "daily-artists",
          type: "artists",
          initialData: dailyTopArtists,
        }),
      onTitleClick: () =>
        navigateTo("chart-detail", {
          chartType: "daily-artists",
          type: "artists",
          initialData: dailyTopArtists,
        }),
    });
  }

  // Weekly Top Songs
  if (loadingExtra.weeklyTopSongs) {
    availableSections.push({
      key: "weekly_top_songs_skeleton",
      title: "برترین آهنگ‌های هفته",
      content: (
        <SectionSkeleton title="برترین آهنگ‌های هفته" variant="horizontal" />
      ),
    });
  } else if (weeklyTopSongs && weeklyTopSongs.results.length > 0) {
    availableSections.push({
      key: "weekly_top_songs",
      title: "برترین آهنگ‌های هفته",
      subtitle: "محبوب‌ترین‌های ۷ روز گذشته",
      content: (
        <PremiumChartList
          items={weeklyTopSongs.results.map((s) => ({
            id: s.id,
            title: getSongDisplayTitle(s),
            featuredArtists: getPlayerFeaturedArtists(s),
            subtitle: s.artist_name,
            img: s.cover_image,
            isNew: false,
            type: "song",
            artistId: (s as any).artist_id || (s as any).artist,
            artistSlug: (s as any).artist_slug,
          }))}
          onPlay={(item) =>
            handlePlaySong(item.id, weeklyTopSongs.results as any)
          }
        />
      ),
      showMore: true,
      onShowMore: () =>
        navigateTo("chart-detail", {
          chartType: "weekly-songs",
          type: "songs",
          initialData: weeklyTopSongs,
        }),
      onTitleClick: () =>
        navigateTo("chart-detail", {
          chartType: "weekly-songs",
          type: "songs",
          initialData: weeklyTopSongs,
        }),
    });
  }

  // Weekly Top Albums
  if (loadingExtra.weeklyTopAlbums) {
    availableSections.push({
      key: "weekly_top_albums_skeleton",
      title: "برترین آلبوم‌های هفته",
      content: <SectionSkeleton title="برترین آلبوم‌های هفته" variant="grid" />,
    });
  } else if (weeklyTopAlbums && weeklyTopAlbums.results.length > 0) {
    availableSections.push({
      key: "weekly_top_albums",
      title: "برترین آلبوم‌های هفته",
      subtitle: "آلبوم‌های برتر هفته اخیر",
      content: (
        <GlassAlbumGrid
          items={weeklyTopAlbums.results.map((a) => ({
            id: a.id,
            title: a.title,
            subtitle: a.artist_name,
            img: a.cover_image,
            isNew: false,
            type: "album",
            artistId: (a as any).artist_id || (a as any).artist,
            artistSlug: (a as any).artist_slug,
            slug: createSlug(a.title),
          }))}
          onItemClick={(item) =>
            navigateTo("album-detail", {
              id: item.id,
              slug: createSlug(item.title),
            })
          }
          maxItems={4}
          showMore={true}
          onShowMore={() =>
            navigateTo("chart-detail", {
              chartType: "weekly-albums",
              type: "albums",
              initialData: weeklyTopAlbums,
            })
          }
          onTitleClick={() =>
            navigateTo("chart-detail", {
              chartType: "weekly-albums",
              type: "albums",
              initialData: weeklyTopAlbums,
            })
          }
          overlayHeight="50%"
        />
      ),
      showMore: true,
      onShowMore: () =>
        navigateTo("chart-detail", {
          chartType: "weekly-albums",
          type: "albums",
          initialData: weeklyTopAlbums,
        }),
      onTitleClick: () =>
        navigateTo("chart-detail", {
          chartType: "weekly-albums",
          type: "albums",
          initialData: weeklyTopAlbums,
        }),
    });
  }

  // Weekly Top Artists
  if (loadingExtra.weeklyTopArtists) {
    availableSections.push({
      key: "weekly_top_artists_skeleton",
      title: "برترین هنرمندان هفته",
      content: (
        <SectionSkeleton title="برترین هنرمندان هفته" variant="artist" />
      ),
    });
  } else if (weeklyTopArtists && weeklyTopArtists.results.length > 0) {
    availableSections.push({
      key: "weekly_top_artists",
      title: "برترین هنرمندان هفته",
      subtitle: "ستارگان هفته صداباکس",
      content: (
        <SpotlightArtistList
          items={weeklyTopArtists.results.map((a) => ({
            id: a.id,
            title: a.name,
            subtitle: "Artist",
            img: a.profile_image,
            isNew: false,
            slug: (a as any).unique_id || createSlug(a.name),
          }))}
          onItemClick={(item) =>
            navigateTo("artist-detail", {
              id: item.id,
              slug: (item as any).slug,
            })
          }
        />
      ),
      showMore: true,
      onShowMore: () =>
        navigateTo("chart-detail", {
          chartType: "weekly-artists",
          type: "artists",
          initialData: weeklyTopArtists,
        }),
      onTitleClick: () =>
        navigateTo("chart-detail", {
          chartType: "weekly-artists",
          type: "artists",
          initialData: weeklyTopArtists,
        }),
    });
  }

  // Hero highlights built from all home sections
  const heroHighlights: HeroHighlight[] = [];
  const meshGradients = [
    "radial-gradient(circle at 0% 0%, rgba(16,185,129,0.55), transparent 55%), radial-gradient(circle at 100% 0%, rgba(45,212,191,0.4), transparent 55%), radial-gradient(circle at 50% 100%, rgba(22,163,74,0.65), transparent 55%)",
    "radial-gradient(circle at 0% 0%, rgba(129,140,248,0.55), transparent 55%), radial-gradient(circle at 100% 0%, rgba(236,72,153,0.35), transparent 55%), radial-gradient(circle at 50% 100%, rgba(56,189,248,0.5), transparent 55%)",
    "radial-gradient(circle at 0% 0%, rgba(245,158,11,0.6), transparent 55%), radial-gradient(circle at 100% 0%, rgba(239,68,68,0.4), transparent 55%), radial-gradient(circle at 50% 100%, rgba(244,63,94,0.5), transparent 55%)",
    "radial-gradient(circle at 0% 0%, rgba(56,189,248,0.55), transparent 55%), radial-gradient(circle at 100% 0%, rgba(59,130,246,0.45), transparent 55%), radial-gradient(circle at 50% 100%, rgba(45,212,191,0.55), transparent 55%)",
  ];

  const firstRec = homeData.songs_recommendations.songs[0];
  if (firstRec) {
    const idx = heroHighlights.length % meshGradients.length;
    heroHighlights.push({
      key: `personal-${firstRec.id}`,
      pill: isGuest ? "پیشنهاد امروز" : "پخش شخصی",
      title: getSongDisplayTitle(firstRec),
      subtitle: isGuest
        ? `${firstRec.artist_name} • انتخابی تازه برای این لحظه`
        : `${firstRec.artist_name} • بر اساس شنیده‌های اخیرت`,
      image: firstRec.cover_image || "/default-cover.jpg",
      meshGradient: meshGradients[idx],
      highlight:
        firstRec.genre_names?.slice(0, 2).join(" • ") ||
        (isGuest ? "منتخب صداباکس" : "چند ژانر منتخب"),
      metaRight: formatDuration(firstRec.duration_seconds),
      type: "song",
      item: firstRec,
      sourceSectionKey: "songs_recommendations",
      sourceLabel: language === "fa" ? "برای تو" : "For You",
    });
  }

  const latest = homeData.latest_releases.results[0];
  if (latest && latest.id !== firstRec?.id) {
    const idx = heroHighlights.length % meshGradients.length;
    heroHighlights.push({
      key: `latest-${latest.id}`,
      pill: "آخرین ریلیز",
      title: getSongDisplayTitle(latest),
      subtitle: `${latest.artist_name} • تازه روی صداباکس`,
      image: latest.cover_image || "/default-cover.jpg",
      meshGradient: meshGradients[idx],
      highlight: "انتشار تازه",
      metaRight: formatDuration(latest.duration_seconds),
      type: "song",
      item: latest,
      sourceSectionKey: "latest_releases",
      sourceLabel: language === "fa" ? "تازه‌ترین انتشارها" : "New Releases",
    });
  }

  const discovery = homeData.discoveries.results[0];
  if (
    discovery &&
    discovery.id !== firstRec?.id &&
    discovery.id !== latest?.id
  ) {
    const idx = heroHighlights.length % meshGradients.length;
    heroHighlights.push({
      key: `discovery-${discovery.id}`,
      pill: "کشف تازه",
      title: getSongDisplayTitle(discovery),
      subtitle: `${discovery.artist_name} • پیشنهادی برای کشف جدید`,
      image: discovery.cover_image || "/default-cover.jpg",
      meshGradient: meshGradients[idx],
      highlight:
        discovery.mood_names?.slice(0, 2).join(" • ") || "حال‌وهوای خاص",
      metaRight: formatDuration(discovery.duration_seconds),
      type: "song",
      item: discovery,
      sourceSectionKey: "discoveries",
      sourceLabel: language === "fa" ? "کشف‌های تازه" : "New Discoveries",
    });
  }

  const homePlaylistResults = Array.isArray(homeData.playlist_recommendations)
    ? homeData.playlist_recommendations
    : homeData.playlist_recommendations.results;
  const discoveryPlaylistForHero = Array.isArray(playlistRecommendations)
    ? playlistRecommendations[0]
    : undefined;
  const matchingHomePlaylist = discoveryPlaylistForHero
    ? homePlaylistResults.find(
        (playlist) =>
          String(playlist.unique_id || playlist.id) ===
          String(discoveryPlaylistForHero.unique_id || discoveryPlaylistForHero.id),
      )
    : homePlaylistResults[0];
  const playlistForHero = discoveryPlaylistForHero
    ? normalizePlaylistPayload({
        ...(matchingHomePlaylist || {}),
        ...discoveryPlaylistForHero,
        genres:
          discoveryPlaylistForHero.genres?.length
            ? discoveryPlaylistForHero.genres
            : matchingHomePlaylist?.genres,
        genre_ids:
          discoveryPlaylistForHero.genre_ids?.length
            ? discoveryPlaylistForHero.genre_ids
            : matchingHomePlaylist?.genre_ids,
        genre_names:
          discoveryPlaylistForHero.genre_names?.length
            ? discoveryPlaylistForHero.genre_names
            : matchingHomePlaylist?.genre_names,
      })
    : matchingHomePlaylist
      ? normalizePlaylistPayload(matchingHomePlaylist)
      : undefined;
  if (playlistForHero) {
    const idx = heroHighlights.length % meshGradients.length;
    heroHighlights.push({
      key: `playlist-${playlistForHero.unique_id || playlistForHero.id}`,
      pill: "لیست پخش منتخب",
      title: playlistForHero.title,
      subtitle:
        playlistForHero.description ||
        (isGuest
          ? "منتخب صداباکس برای این لحظه"
          : "منتخب صداباکس برای حال تو"),
      image: playlistForHero.cover_image || "/default-cover.jpg",
      meshGradient: meshGradients[idx],
      highlight:
        playlistForHero.genre_names?.slice(0, 2).join(" • ") ||
        `${playlistForHero.songs_count} ترک`,
      metaRight: `${playlistForHero.songs_count} ترک`,
      type: "playlist",
      item: playlistForHero,
      sourceSectionKey: "playlist_recommendations",
      sourceLabel:
        language === "fa" ? "پلی‌لیست‌های پیشنهادی" : "Recommended Playlists",
    });
  }

  type HeroStats = {
    totalTracks: number;
    totalArtists: number;
    totalPlaylists: number;
  };

  const heroStats: HeroStats = {
    totalTracks:
      (homeData.songs_recommendations.songs?.length || 0) +
      (homeData.latest_releases?.count ||
        homeData.latest_releases?.results?.length ||
        0) +
      (homeData.discoveries?.count ||
        homeData.discoveries?.results?.length ||
        0),
    totalArtists:
      homeData.popular_artists?.count ||
      homeData.popular_artists?.results?.length ||
      0,
    totalPlaylists:
      (Array.isArray(playlistRecommendations)
        ? playlistRecommendations.length
        : 0) || 0,
  };

  const scrollToSectionByKey = (key: string) => {
    const index = availableSections.findIndex((s) => s.key === key);
    if (index === -1) return;
    const el = sectionRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "start" });
      setActiveIndex(index);
    }
  };

  const getHeroSongSource = (item: HeroHighlight): ApiSong[] => {
    switch (item.sourceSectionKey) {
      case "songs_recommendations":
        return homeData.songs_recommendations.songs;
      case "latest_releases":
        return homeData.latest_releases.results;
      case "discoveries":
        return homeData.discoveries.results;
      default:
        return [];
    }
  };

  const handleHeroPrimaryPlay = (item: HeroHighlight) => {
    if (item.type !== "song") {
      void handleHeroCardPlay(item);
      return;
    }
    const source = getHeroSongSource(item);
    if (!source.length || !item.item?.id) return;
    handlePlaySong(item.item.id, source);
  };

  const handleHeroCardPlay = async (item: HeroHighlight) => {
    if (!item.item) return;

    if (item.type === "song") {
      const source = getHeroSongSource(item);
      if (source.length) handlePlaySong(item.item.id, source);
      return;
    }

    const isPlaylist = item.type === "playlist";
    const detailId = item.item.unique_id || item.item.id;
    const endpoint = isPlaylist
      ? `https://api.sedabox.com/api/home/playlist-recommendations/${detailId}/`
      : `https://api.sedabox.com/api/albums/${detailId}/`;

    try {
      const embedded = Array.isArray(item.item.songs) ? item.item.songs : [];
      const songs = embedded.some((song: any) => song?.stream_url || song?.preview_url)
        ? embedded
        : await authenticatedFetch(endpoint).then(async (response) => {
            if (!response.ok) throw new Error("Unable to load collection");
            const detail = await response.json();
            return Array.isArray(detail.songs) ? detail.songs : [];
          });

      const tracks = songs.map(apiSongToTrack).filter((track: Track) => track.src);
      if (tracks.length) setQueue(tracks, 0);
    } catch (error) {
      console.error("Failed to start hero collection:", error);
    }
  };

  const handleHeroItemNavigate = (
    item: HeroHighlight,
    target: "song" | "artist" | "album" | "playlist",
  ) => {
    const data = item.item || {};
    if (target === "artist") {
      const id = data.artist_id || data.artist?.id || data.artist;
      if (id) navigateTo("artist-detail", { id, slug: data.artist_slug || createSlug(data.artist_name || "") });
      return;
    }
    if (target === "album") {
      const id = data.album_id || data.album?.id || data.album;
      if (id) navigateTo("album-detail", { id, slug: createSlug(data.album_title || data.title || "") });
      return;
    }
    if (target === "playlist") {
      navigateTo("playlist-detail", { id: data.unique_id || data.id, slug: createSlug(data.title || "") });
      return;
    }
    navigateTo("song-detail", {
      id: data.id,
      artistSlug: data.artist_slug || createSlug(data.artist_name || ""),
      songSlug: createSlug(getSongDisplayTitle(data)),
    });
  };

  const handleHeroSourceNavigate = (item: HeroHighlight) => {
    const sourcePages: Record<string, string> = {
      songs_recommendations: "for-you",
      latest_releases: "latest-releases",
      discoveries: "new-discoveries",
      playlist_recommendations: "recommended-playlists",
    };
    const page = sourcePages[item.sourceSectionKey];
    if (page) {
      navigateTo(page);
      return;
    }
    scrollToSectionByKey(item.sourceSectionKey);
  };

  const handleHeroGenreNavigate = (genre: ApiGenreLink) => {
    if (!Number.isFinite(Number(genre.id))) return;
    navigateTo("genre-detail", {
      id: Number(genre.id),
      name: genre.name,
      color: HOME_GENRE_ACCENT_HEX[Number(genre.id)] ?? "#1a1a2e",
    });
  };

  return (
    <>
      <SEO />
      <div
        dir={direction}
        className="relative bg-transparent text-white font-sans pb-24 md:pb-4 md:min-h-screen selection:bg-green-500 selection:text-black"
        style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
        aria-busy={isLoading}
        data-home-loading={isLoading ? "summary-refresh" : "ready"}
      >
        {/* Background gradients - adjusted for responsive */}
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/40 to-transparent pointer-events-none z-0 md:rounded-t-lg" />
        <div className="absolute top-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

        {/* Mobile Header - only visible on mobile */}
        <header className="md:hidden sticky top-0 z-50 px-4 pt-4 pb-2 bg-black/90  transition-all duration-300">
          <div className="flex flex-row-reverse items-center justify-between mb-4">
            <div className="flex flex-row-reverse items-center gap-2 fade-in">
              <div
                onClick={() => navigateTo("profile")}
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 cursor-pointer transition-transform active:scale-95"
              >
                {user?.image_profile && user.image_profile.image ? (
                  <ImageWithPlaceholder
                    src={user.image_profile.image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    type="user"
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-zinc-400" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center shrink-0">
                <div className="h-10 w-10">
                  <Image
                    src="/logo.png"
                    width={40}
                    height={40}
                    alt="SedaBox Logo"
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
                <div
                  className={`brand-text ${
                    showBrandText ? "brand-text-visible" : "brand-text-hidden"
                  }`}
                  aria-hidden={!showBrandText}
                >
                  صداباکس
                </div>
              </div>
              {!isGuest && (
                <NotificationPopover
                  notifications={notifications}
                  hasUnread={hasUnread}
                  markingReadIds={markingReadIds}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  isMarkingAll={isMarkingAll || markingReadIds.size > 0}
                  onOpen={() => void refreshNotifications()}
                  getTimeAgo={formatTimeAgo}
                  isMobile={true}
                />
              )}
              {!isGuest && !isPremium && (
                <button
                  onClick={() => navigateTo("premium")}
                  className="text-emerald-500 px-4 py-1.5 rounded-full font-semibold shadow-md hover:brightness-95 transition-transform transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                >
                  ارتقا پلن +
                </button>
              )}
            </div>
          </div>

          <div
            ref={navRef}
            className="flex gap-3 overflow-x-auto no-scrollbar pb-2 items-center will-change-transform"
            aria-label="بخش‌های خانه"
          >
            {availableSections.map((s, i) => (
              <button
                key={s.key}
                data-index={i}
                onClick={() => {
                  const el = sectionRefs.current[i];
                  if (el) {
                    el.scrollIntoView({ behavior: "auto", block: "start" });
                    setActiveIndex(i);
                  }
                }}
                aria-pressed={i === activeIndex}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
                  i === activeIndex
                    ? "bg-green-500 text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {getSongDisplayTitle(s)}
              </button>
            ))}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:block sticky top-0 z-50 px-4 pt-3 pb-2 bg-black/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Prev / Next section arrows */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  const newIndex = Math.max(0, activeIndex - 1);
                  const el = sectionRefs.current[newIndex];
                  if (el) {
                    el.scrollIntoView({ behavior: "auto", block: "start" });
                    setActiveIndex(newIndex);
                  }
                }}
                disabled={activeIndex === 0}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                aria-label="بخش قبلی"
              >
                <svg
                  className="w-4 h-4 sb-back-icon-right"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  const newIndex = Math.min(
                    availableSections.length - 1,
                    activeIndex + 1,
                  );
                  const el = sectionRefs.current[newIndex];
                  if (el) {
                    el.scrollIntoView({ behavior: "auto", block: "start" });
                    setActiveIndex(newIndex);
                  }
                }}
                disabled={activeIndex >= availableSections.length - 1}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                aria-label="بخش بعدی"
              >
                <svg
                  className="w-4 h-4 sb-forward-icon-left"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Center: Section navigation pills – scrollable, centered on active */}
            <div
              ref={desktopNavRef}
              className="flex-1 flex gap-2 overflow-x-auto no-scrollbar items-center py-1"
              aria-label="بخش‌های خانه"
            >
              {availableSections.map((s, i) => {
                const isSkeleton = s.key.endsWith("_skeleton");
                return (
                  <button
                    key={s.key}
                    data-index={i}
                    onClick={() => {
                      if (isSkeleton) return;
                      const el = sectionRefs.current[i];
                      if (el) {
                        el.scrollIntoView({ behavior: "auto", block: "start" });
                        setActiveIndex(i);
                      }
                    }}
                    aria-pressed={!isSkeleton && i === activeIndex}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
                      isSkeleton
                        ? "bg-zinc-800/40 text-zinc-600 cursor-default"
                        : i === activeIndex
                          ? "bg-white text-black shadow-md"
                          : "bg-zinc-800 text-white hover:bg-zinc-700"
                    }`}
                  >
                    {getSongDisplayTitle(s)}
                  </button>
                );
              })}
            </div>

            {/* Right side controls – fixed max width so they don't crowd the nav */}
            <div className="flex items-center gap-3 shrink-0 max-w-xs">
              {!isGuest && !isPremium && (
                <button
                  onClick={() => navigateTo("premium")}
                  className="text-emerald-500 px-3 py-1.5 rounded-full font-semibold text-sm whitespace-nowrap hover:text-emerald-400 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                >
                  ارتقا پلن +
                </button>
              )}
              {!isGuest && (
                <NotificationPopover
                  notifications={notifications}
                  hasUnread={hasUnread}
                  markingReadIds={markingReadIds}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  isMarkingAll={isMarkingAll || markingReadIds.size > 0}
                  onOpen={() => void refreshNotifications()}
                  getTimeAgo={formatTimeAgo}
                  isMobile={false}
                />
              )}
              <button
                onClick={() => navigateTo("profile")}
                className="shrink-0 w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                aria-label="مشاهده پروفایل"
              >
                {user?.image_profile && user.image_profile.image ? (
                  <ImageWithPlaceholder
                    src={user.image_profile.image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    type="user"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-zinc-400" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 flex flex-col gap-8 pt-2 md:gap-10 md:pt-4">
          <HeroSection
            homeData={homeData}
            sectionData={sectionData}
            heroHighlights={heroHighlights}
            stats={heroStats}
            isGuest={isGuest}
            onPrimaryPlay={handleHeroPrimaryPlay}
            onGoToSource={handleHeroSourceNavigate}
            onCardPlay={handleHeroCardPlay}
            onItemNavigate={handleHeroItemNavigate}
            onGenreNavigate={handleHeroGenreNavigate}
          />
          {availableSections.map((s, i) => (
            <Section
              key={s.key}
              title={getSongDisplayTitle(s)}
              subtitle={s.subtitle}
              sectionRef={(el) => {
                sectionRefs.current[i] = el;
              }}
              dataIndex={i}
              showMore={s.showMore}
              onShowMore={s.onShowMore}
              onTitleClick={s.onTitleClick}
            >
              {s.content}
            </Section>
          ))}
        </main>

        <style jsx global>{`
          /* styles preserved from reference */
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .pb-safe {
            padding-bottom: env(safe-area-inset-bottom, 20px);
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .fade-in {
            animation: fadeIn 0.5s ease-out forwards;
            backface-visibility: hidden;
          }
          @supports (content-visibility: auto) {
            .sb-home-section {
              content-visibility: auto;
              contain-intrinsic-size: auto 420px;
            }
          }
          .notif-checkbox {
            transition: all 180ms ease-in-out;
            will-change: background-color, border-color, transform, opacity;
            backface-visibility: hidden;
            transform: translateZ(0);
          }
          .notif-checkbox svg {
            transition:
              transform 200ms ease,
              opacity 200ms ease;
            will-change: transform, opacity;
            backface-visibility: hidden;
            transform: translateZ(0);
          }
          @keyframes notifCheck {
            0% {
              transform: scale(0.8) rotate(-8deg);
              opacity: 0;
            }
            50% {
              transform: scale(1.12) rotate(8deg);
              opacity: 1;
            }
            100% {
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
          }
          .notif-checkbox.notif-checked svg {
            animation: notifCheck 240ms ease forwards;
          }
          .notif-item {
            transform: translateX(0);
            opacity: 1;
            transition:
              transform 320ms ease,
              opacity 280ms ease;
            will-change: transform, opacity;
            backface-visibility: hidden;
            transform: translateZ(0);
          }
          .notif-item.removing {
            transform: translateX(140%);
            opacity: 0;
          }
          .brand-text {
            display: inline-block;
            overflow: hidden;
            white-space: nowrap;
            max-width: 220px;
            padding-inline-start: 0.5rem;
            padding-inline-end: 0.5rem;
            opacity: 1;
            transform: translateX(0);
            font-weight: 700;
            font-size: 1rem;
            color: #10b981;
            transition:
              max-width 480ms cubic-bezier(0.22, 0.9, 0.3, 1),
              padding 480ms cubic-bezier(0.22, 0.9, 0.3, 1),
              opacity 360ms ease,
              transform 360ms ease;
            will-change: max-width, padding, transform, opacity;
            backface-visibility: hidden;
            transform: translateZ(0);
          }
          .brand-text-hidden {
            max-width: 0;
            padding-inline-start: 0;
            padding-inline-end: 0;
            opacity: 0;
            transform: translateX(-8px);
          }

          /* Premium layered stack animations */
          .layered-stack {
            perspective: 1000px;
          }
          .layered-stack .layer {
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform-style: preserve-3d;
          }
          .layered-stack:hover .layer-1 {
            transform: translateY(-8px) translateX(4px) rotateZ(-2deg)
              scale(0.92);
          }
          .layered-stack:hover .layer-2 {
            transform: translateY(-4px) translateX(2px) rotateZ(-1deg)
              scale(0.96);
          }
          .layered-stack:hover .layer-main {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5);
          }

          /* Hero section */
          .hero-shell {
            isolation: isolate;
            backdrop-filter: blur(22px);
            -webkit-backdrop-filter: blur(22px);
          }
          .hero-bg-img {
            background-size: cover;
            background-position: center;
            filter: saturate(1.3);
            will-change: opacity, transform;
          }
          .hero-slider-shell {
            touch-action: pan-y;
            -webkit-tap-highlight-color: transparent;
            will-change: transform;
          }
          .hero-card {
            will-change: transform, opacity, filter;
            transition:
              transform 420ms cubic-bezier(0.22, 0.9, 0.3, 1),
              opacity 260ms ease-out,
              filter 260ms ease-out;
          }
          .hero-card:hover {
            transform: translateY(-4px) scale(1.01) !important;
          }
          @media (max-width: 768px) {
            .hero-shell {
              border-radius: 1.5rem;
            }
          }
        `}</style>
      </div>
    </>
  );
}

/* HeroSection extracted to components/HeroSection.tsx */

/* Reusable components */

type SectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  sectionRef?: (el: HTMLElement | null) => void;
  dataIndex?: number;
  showMore?: boolean;
  onShowMore?: () => void;
  onTitleClick?: () => void;
};
const Section = ({
  title,
  subtitle,
  children,
  sectionRef,
  dataIndex,
  showMore,
  onShowMore,
  onTitleClick,
}: SectionProps) => (
  <section
    ref={sectionRef}
    data-index={dataIndex}
    className="sb-home-section flex flex-col gap-3 fade-in scroll-mt-[135px] md:scroll-mt-24"
  >
    {/* Mobile only: title on row one, subtitle and action on one compact row below. */}
    <div className="px-4 text-start md:hidden">
      {onTitleClick ? (
        <h2 className="w-full text-start text-2xl font-bold leading-none tracking-tight">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTitleClick();
            }}
            className="w-fit max-w-full rounded text-start text-2xl font-bold leading-none tracking-tight transition-colors hover:text-white hover:underline decoration-zinc-500 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {title}
          </button>
        </h2>
      ) : (
        <h2 className="w-full text-start text-2xl font-bold leading-none tracking-tight">
          {title}
        </h2>
      )}

      {(subtitle || showMore) && (
        <div className="mt-1.5 flex min-h-5 w-full items-center justify-between gap-3">
          {subtitle ? (
            <p className="min-w-0 flex-1 truncate text-start text-xs font-medium leading-5 text-zinc-400">
              {subtitle}
            </p>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden="true" />
          )}

          {showMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowMore?.();
              }}
              aria-label="نمایش بیشتر"
              className="inline-flex shrink-0 items-center gap-1.5 rounded bg-transparent px-1 py-1 text-xs font-medium leading-none text-zinc-400 transition hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span className="leading-none">نمایش بیشتر</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-150 sb-forward-icon-left"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 18l-6-6 6-6"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>

    {/* Desktop/tablet markup intentionally preserved exactly. */}
    <div className="px-4 text-start relative hidden md:block">
      {showMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowMore?.();
          }}
          aria-label="نمایش بیشتر"
          className="absolute left-4 sb-inline-end-position top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium bg-transparent px-2 py-1 rounded transition focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
        >
          <span className="flex items-center gap-2">
            <span className="leading-none">نمایش بیشتر</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-zinc-400 transition-transform duration-150 sb-forward-icon-left"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 18l-6-6 6-6"
              />
            </svg>
          </span>
        </button>
      )}
      <div className="w-full flex flex-col items-end">
        {onTitleClick ? (
          <h2 className="text-2xl font-bold tracking-tight leading-none text-start w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTitleClick();
              }}
              className="w-fit max-w-full text-2xl font-bold tracking-tight leading-none text-start text-left md:text-start hover:text-white transition-colors hover:underline decoration-zinc-500 focus-visible:ring-2 focus-visible:ring-emerald-500 rounded outline-none"
            >
              {title}
            </button>
          </h2>
        ) : (
          <h2 className="text-2xl font-bold tracking-tight leading-none text-start w-full">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-zinc-400 text-xs font-medium text-start w-full mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {children}
  </section>
);

type HorizontalListProps = {
  items: ItemType[];
  variant?: "square" | "circle" | "layered";
  onItemClick?: (item: ItemType) => void;
  onPlay?: (item: ItemType) => void;
};
const HorizontalList = ({
  items,
  variant = "square",
  onItemClick,
  onPlay,
}: HorizontalListProps) => {
  const { navigateTo } = useNavigation();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: any) => {
    if (!scrollerRef.current) return;
    isDown.current = true;
    scrollerRef.current.style.cursor = "grabbing";
    startX.current = e.pageX - scrollerRef.current.offsetLeft;
    scrollLeft.current = scrollerRef.current.scrollLeft;
  };
  const handleMouseMove = (e: any) => {
    if (!isDown.current || !scrollerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollerRef.current.offsetLeft;
    const walk = x - startX.current;
    scrollerRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const handleMouseUp = () => {
    if (!scrollerRef.current) return;
    isDown.current = false;
    scrollerRef.current.style.cursor = "grab";
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    const onDragStart = (ev: any) => ev.preventDefault();
    el.addEventListener("dragstart", onDragStart);
    return () => el.removeEventListener("dragstart", onDragStart);
  }, []);

  return (
    <div
      ref={scrollerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4 will-change-transform"
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          role="button"
          tabIndex={0}
          onClick={() => (onPlay ? onPlay(item) : onItemClick?.(item))}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onPlay ? onPlay(item) : onItemClick?.(item);
            }
          }}
          aria-label={`${item.title} از ${item.subtitle}`}
          className={`snap-start shrink-0 flex flex-col gap-2 group cursor-pointer text-start focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl outline-none ${
            variant === "circle"
              ? "w-28"
              : variant === "layered"
                ? "w-40"
                : "w-36"
          }`}
        >
          <div
            className={`relative ${
              variant === "layered" ? "layered-stack pt-3 px-1" : ""
            }`}
          >
            {variant === "layered" && (
              <>
                {/* Third layer (deepest) */}
                <div
                  className="layer layer-1 absolute top-0 left-1/2 -translate-x-1/2 w-[75%] h-[calc(100%-12px)] rounded-lg overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, rgba(39, 39, 42, 0.9) 0%, rgba(24, 24, 27, 0.9) 100%)`,
                    boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <ImageWithPlaceholder
                    src={
                      Array.isArray(item.img)
                        ? item.img[0]
                        : items[(index + 2) % items.length]?.img || item.img
                    }
                    alt=""
                    className="w-full h-full object-cover opacity-40"
                    type="song"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                </div>

                {/* Second layer */}
                <div
                  className="layer layer-2 absolute top-[6px] left-1/2 -translate-x-1/2 w-[87%] h-[calc(100%-12px)] rounded-lg overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, rgba(52, 52, 56, 0.95) 0%, rgba(39, 39, 42, 0.95) 100%)`,
                    boxShadow: "0 6px 16px -4px rgba(0, 0, 0, 0.35)",
                  }}
                >
                  <ImageWithPlaceholder
                    src={
                      Array.isArray(item.img)
                        ? item.img[1]
                        : items[(index + 1) % items.length]?.img || item.img
                    }
                    alt=""
                    className="w-full h-full object-cover opacity-50"
                    type="song"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-800/70 to-transparent" />
                </div>
              </>
            )}

            {/* Main image */}
            <div
              className={`layer layer-main relative overflow-hidden shadow-lg bg-zinc-800 ${
                variant === "circle"
                  ? "rounded-full aspect-square"
                  : "rounded-lg aspect-square"
              } ${variant === "layered" ? "z-10" : ""}`}
              style={
                variant === "layered"
                  ? {
                      boxShadow:
                        "0 8px 24px -6px rgba(0, 0, 0, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.2)",
                    }
                  : {}
              }
            >
              <ImageWithPlaceholder
                src={Array.isArray(item.img) ? item.img[2] : item.img}
                alt={item.title}
                className="w-full h-full object-cover group-active:scale-95 transition-transform duration-200 ease-out"
                type={variant === "circle" ? "artist" : "song"}
              />

              {item.type === "song" && item.isPromoted && (
                <PromotionBadge className="absolute left-2 top-2 z-20" />
              )}

              {/* Hover overlay with gradient */}
              {variant === "layered" && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}

              {/* Play button */}
              {variant !== "circle" && (onPlay || variant === "layered") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay?.(item);
                  }}
                  className="absolute bottom-2 left-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-green-400"
                >
                  <Play fill="black" className="mr-1 w-5 h-5 text-black" />
                </button>
              )}

              {/* New badge */}
              {item.isNew && (
                <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg z-20">
                  جدید
                </span>
              )}

              {/* Item count indicator for layered variant */}
              {variant === "layered" &&
                (item.songsCount != null ? (
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{item.songsCount} ترک</span>
                  </div>
                ) : (
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>—</span>
                  </div>
                ))}
            </div>
          </div>

          <div
            className={`flex flex-col ${
              variant === "circle" ? "items-center text-center" : "items-start"
            }`}
          >
            <h3
              className={`w-fit max-w-full min-w-0 overflow-hidden font-semibold text-white hover:underline decoration-zinc-500 ${
                variant === "circle" ? "text-sm" : "text-sm"
              }`}
              onClick={(e) => {
                const isDesktop =
                  typeof window !== "undefined" &&
                  window.matchMedia("(min-width: 768px)").matches;
                if (!isDesktop) return;

                e.stopPropagation();
                if (item.type === "artist") {
                  navigateTo("artist-detail", { id: item.id, slug: item.slug });
                } else if (item.type === "song") {
                  navigateTo("song-detail", { id: item.id });
                } else if (item.type === "album") {
                  navigateTo("album-detail", { id: item.id, slug: item.slug });
                } else if (item.type === "playlist") {
                  navigateTo("playlist-detail", {
                    id: item.id,
                    slug: item.slug,
                  });
                }
              }}
            >
              {item.type === "song" || item.type === "artist" ? (
                <OverflowMarquee
                  text={item.title}
                  align={item.type === "artist" ? "center" : "start"}
                >
                  {item.type === "song" ? (
                    <SongTitleWithFeaturedArtists song={item} />
                  ) : (
                    item.title
                  )}
                </OverflowMarquee>
              ) : (
                <span className="block truncate">{item.title}</span>
              )}
            </h3>
            <p
              className="w-fit max-w-full min-w-0 overflow-hidden text-xs text-zinc-400 hover:text-white transition-colors"
              onClick={(e) => {
                const isDesktop =
                  typeof window !== "undefined" &&
                  window.matchMedia("(min-width: 768px)").matches;
                if (!isDesktop) return;

                e.stopPropagation();
                if (
                  (item.type === "song" || item.type === "album") &&
                  item.artistId
                ) {
                  navigateTo("artist-detail", {
                    id: item.artistId,
                    slug: item.artistSlug,
                  });
                }
              }}
            >
              {item.type === "song" || item.type === "album" ? (
                <OverflowMarquee
                  text={item.subtitle}
                  align={variant === "circle" ? "center" : "start"}
                />
              ) : (
                <span className="block truncate">{item.subtitle}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

type ChartListProps = {
  items: ItemType[];
  color?: string;
  onPlay?: (item: ItemType) => void;
};
const ChartList = ({ items, color = "text-white", onPlay }: ChartListProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: any) => {
    if (!scrollerRef.current) return;
    isDown.current = true;
    scrollerRef.current.style.cursor = "grabbing";
    startX.current = e.pageX - scrollerRef.current.offsetLeft;
    scrollLeft.current = scrollerRef.current.scrollLeft;
  };
  const handleMouseMove = (e: any) => {
    if (!isDown.current || !scrollerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollerRef.current.offsetLeft;
    const walk = x - startX.current;
    scrollerRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const handleMouseUp = () => {
    if (!scrollerRef.current) return;
    isDown.current = false;
    scrollerRef.current.style.cursor = "grab";
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    const onDragStart = (ev: any) => ev.preventDefault();
    el.addEventListener("dragstart", onDragStart);
    return () => el.removeEventListener("dragstart", onDragStart);
  }, []);

  return (
    <div
      ref={scrollerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4 will-change-transform"
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className="snap-start shrink-0 w-[85vw] sm:w-96 flex flex-col gap-2"
        >
          <button
            onClick={() => onPlay?.(item)}
            className="flex flex-row-reverse items-center gap-4 bg-zinc-900/50 p-2 pr-4 rounded-md group active:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-white transition-colors relative cursor-pointer hover:bg-zinc-800/70 text-start w-full"
            aria-label={`پخش ${item.title} از ${item.subtitle}`}
          >
            <span
              className={`text-4xl font-bold w-12 text-center ${
                index < 3 ? color : "text-zinc-600"
              }`}
            >
              {index + 1}
            </span>
            <div className="h-16 w-16 shrink-0 relative rounded shadow-md overflow-hidden">
              <ImageWithPlaceholder
                src={item.img}
                className="h-full w-full object-cover"
                alt={item.title}
                type="song"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-start">
              <span className="flex min-w-0 items-center gap-2 font-bold text-white">
                <OverflowMarquee text={item.title} className="min-w-0 flex-1">
                  <SongTitleWithFeaturedArtists song={item} />
                </OverflowMarquee>
                {item.isNew && (
                  <span className="z-20 shrink-0 rounded bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                    جدید
                  </span>
                )}
              </span>
              <span className="min-w-0 overflow-hidden text-xs text-zinc-400">
                <OverflowMarquee text={item.subtitle} />
              </span>
            </div>
            <MoreHorizontal className="w-5 h-5 text-zinc-400 shrink-0" />
          </button>
        </div>
      ))}
    </div>
  );
};

const PremiumChartList = ({
  items,
  onPlay,
}: {
  items: ItemType[];
  onPlay?: (item: ItemType) => void;
}) => {
  const { navigateTo } = useNavigation();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: any) => {
    if (!scrollerRef.current) return;
    isDown.current = true;
    scrollerRef.current.style.cursor = "grabbing";
    startX.current = e.pageX - scrollerRef.current.offsetLeft;
    scrollLeft.current = scrollerRef.current.scrollLeft;
  };
  const handleMouseMove = (e: any) => {
    if (!isDown.current || !scrollerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollerRef.current.offsetLeft;
    const walk = x - startX.current;
    scrollerRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const handleMouseUp = () => {
    if (!scrollerRef.current) return;
    isDown.current = false;
    scrollerRef.current.style.cursor = "grab";
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    const onDragStart = (ev: any) => ev.preventDefault();
    el.addEventListener("dragstart", onDragStart);
    return () => el.removeEventListener("dragstart", onDragStart);
  }, []);

  return (
    <div
      ref={scrollerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex overflow-x-auto gap-6 px-4 snap-x snap-mandatory no-scrollbar pb-6"
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => onPlay?.(item)}
          className="snap-start shrink-0 w-[75vw] sm:w-80 group cursor-pointer relative text-start"
          aria-label={`پخش ${item.title} از ${item.subtitle}`}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
          <div className="relative flex items-center gap-4 bg-zinc-900/40 backdrop-blur-md border border-white/5 p-3 rounded-2xl hover:bg-zinc-800/60 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all duration-300">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-2xl">
                <ImageWithPlaceholder
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  type="song"
                />
              </div>
              <div
                className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 text-black rounded-full flex items-center justify-center font-black text-sm shadow-lg border-2 border-zinc-900"
                aria-hidden="true"
              >
                {index + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="min-w-0 overflow-hidden text-base font-bold text-white hover:underline decoration-zinc-500"
                onClick={(e) => {
                  const isDesktop =
                    typeof window !== "undefined" &&
                    window.matchMedia("(min-width: 768px)").matches;
                  if (!isDesktop) return;

                  e.stopPropagation();
                  if (item.type === "song") {
                    navigateTo("song-detail", { id: item.id });
                  } else if (item.type === "album") {
                    navigateTo("album-detail", {
                      id: item.id,
                      slug: item.slug,
                    });
                  }
                }}
              >
                {item.type === "song" ? (
                  <OverflowMarquee text={item.title}>
                    <SongTitleWithFeaturedArtists song={item} />
                  </OverflowMarquee>
                ) : (
                  <span className="block truncate">{item.title}</span>
                )}
              </h4>
              <p
                className="mt-0.5 w-fit max-w-full min-w-0 overflow-hidden text-xs text-zinc-400 hover:text-white transition-colors"
                onClick={(e) => {
                  const isDesktop =
                    typeof window !== "undefined" &&
                    window.matchMedia("(min-width: 768px)").matches;
                  if (!isDesktop) return;

                  e.stopPropagation();
                  if (
                    (item.type === "song" || item.type === "album") &&
                    item.artistId
                  ) {
                    navigateTo("artist-detail", {
                      id: item.artistId,
                      slug: item.artistSlug,
                    });
                  }
                }}
              >
                {item.type === "song" || item.type === "album" ? (
                  <OverflowMarquee text={item.subtitle} />
                ) : (
                  <span className="block truncate">{item.subtitle}</span>
                )}
              </p>
              <div className="flex items-center justify-end gap-2 mt-2">
                <span className="text-[10px] text-emerald-500 font-medium px-2 py-0.5 bg-emerald-500/10 rounded-full">
                  TOP CHART
                </span>
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-colors duration-300"
              aria-hidden="true"
            >
              <Play
                fill="currentColor"
                className="w-4 h-4 text-emerald-500 group-hover:text-black translate-x-0.5"
              />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
const GlassAlbumGrid = ({
  items,
  onItemClick,
  maxItems = 10,
  showMore = false,
  onShowMore,
  onTitleClick,
  overlayHeight = "50%",
}: {
  items: ItemType[];
  onItemClick?: (item: ItemType) => void;
  maxItems?: number;
  showMore?: boolean;
  onShowMore?: () => void;
  onTitleClick?: () => void;
  overlayHeight?: string;
}) => {
  const { navigateTo } = useNavigation();
  return (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4">
        {items.slice(0, maxItems).map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl p-1 text-start"
            aria-label={`آلبوم ${item.title} از ${item.subtitle}`}
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 shadow-xl">
              <ImageWithPlaceholder
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                type="song"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="absolute bottom-3 right-3 left-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-[10px] font-bold truncate text-center ">
                    مشاهده آلبوم
                  </p>
                </div>
              </div>
            </div>
            <h4
              className="text-white font-bold text-sm truncate px-1 hover:underline decoration-zinc-500"
              onClick={(e) => {
                const isDesktop =
                  typeof window !== "undefined" &&
                  window.matchMedia("(min-width: 768px)").matches;
                if (!isDesktop) return;

                e.stopPropagation();
                if (item.type === "album") {
                  navigateTo("album-detail", { id: item.id, slug: item.slug });
                }
              }}
            >
              {item.title}
            </h4>
            <p
              className="mt-0.5 w-fit max-w-full min-w-0 overflow-hidden px-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
              onClick={(e) => {
                const isDesktop =
                  typeof window !== "undefined" &&
                  window.matchMedia("(min-width: 768px)").matches;
                if (!isDesktop) return;

                e.stopPropagation();
                if (item.artistId) {
                  navigateTo("artist-detail", {
                    id: item.artistId,
                    slug: item.artistSlug,
                  });
                }
              }}
            >
              <OverflowMarquee text={item.subtitle} />
            </p>
          </button>
        ))}
      </div>
      {showMore && (
        <>
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"
            style={{ height: overlayHeight }}
          />
          <button
            onClick={onShowMore}
            className="absolute bottom-[20%] left-1/2 transform -translate-x-1/2 bg-emerald-500 text-black px-4 py-2 rounded-full font-semibold hover:bg-emerald-400 transition-colors z-10"
          >
            مشاهده بیشتر
          </button>
        </>
      )}
    </div>
  );
};

const SpotlightArtistList = ({
  items,
  onItemClick,
}: {
  items: ItemType[];
  onItemClick?: (item: ItemType) => void;
}) => {
  const { navigateTo } = useNavigation();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: any) => {
    if (!scrollerRef.current) return;
    isDown.current = true;
    scrollerRef.current.style.cursor = "grabbing";
    startX.current = e.pageX - scrollerRef.current.offsetLeft;
    scrollLeft.current = scrollerRef.current.scrollLeft;
  };
  const handleMouseMove = (e: any) => {
    if (!isDown.current || !scrollerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollerRef.current.offsetLeft;
    const walk = x - startX.current;
    scrollerRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const handleMouseUp = () => {
    if (!scrollerRef.current) return;
    isDown.current = false;
    scrollerRef.current.style.cursor = "grab";
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    const onDragStart = (ev: any) => ev.preventDefault();
    el.addEventListener("dragstart", onDragStart);
    return () => el.removeEventListener("dragstart", onDragStart);
  }, []);

  return (
    <div
      ref={scrollerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="flex overflow-x-auto gap-8 px-6 no-scrollbar pb-4"
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className="shrink-0 group cursor-pointer flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl px-2 py-1"
          aria-label={`هنرمند ${item.title}`}
        >
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-zinc-800 group-hover:ring-emerald-500 transition-all duration-500 shadow-2xl">
              <ImageWithPlaceholder
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                type="artist"
              />
            </div>
          </div>
          <h4
            className="w-32 min-w-0 overflow-hidden text-sm font-bold text-white transition-colors group-hover:text-emerald-400 hover:underline decoration-zinc-500 sm:w-40"
            onClick={(e) => {
              const isDesktop =
                typeof window !== "undefined" &&
                window.matchMedia("(min-width: 768px)").matches;
              if (!isDesktop) return;

              e.stopPropagation();
              navigateTo("artist-detail", { id: item.id, slug: item.slug });
            }}
          >
            <OverflowMarquee text={item.title} align="center" />
          </h4>
          <p className="text-zinc-400 text-[10px] mt-1 uppercase tracking-widest font-medium">
            Artist
          </p>
        </button>
      ))}
    </div>
  );
};
const SectionSkeleton = ({
  title,
  variant = "horizontal",
}: {
  title: string;
  variant?: "horizontal" | "grid" | "artist";
}) => (
  <div className="flex flex-col gap-4 px-4 animate-pulse">
    <div className="flex flex-row-reverse items-center justify-between">
      <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
      <div className="h-4 w-20 bg-zinc-800/50 rounded-full" />
    </div>
    {variant === "horizontal" && (
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="shrink-0 w-72 h-24 bg-zinc-800/30 rounded-2xl"
          />
        ))}
      </div>
    )}
    {variant === "grid" && (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-zinc-800/30 rounded-2xl" />
        ))}
      </div>
    )}
    {variant === "artist" && (
      <div className="flex gap-8 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="shrink-0 w-32 h-32 rounded-full bg-zinc-800/30"
          />
        ))}
      </div>
    )}
  </div>
);
