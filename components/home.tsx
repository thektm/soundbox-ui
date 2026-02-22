import Image from "next/image";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { SEO } from "./SEO";

import React, { useEffect, useRef, useState, useCallback } from "react";
import UserIcon from "./UserIcon";
import HeroSection from "./HeroSection";
import NotificationPopover from "./NotificationPopover";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { useDiscovery } from "./DiscoveryContext";
import { usePlayer } from "./PlayerContext";
import { useResponsiveLayout } from "./ResponsiveLayout";
import type { Track } from "./PlayerContext";

// API Interfaces
interface ApiSong {
  id: number;
  title: string;
  artist_name: string;
  album_title: string;
  cover_image: string;
  stream_url: string;
  duration_seconds: number;
  is_liked: boolean;
  genre_names: string[];
  tag_names: string[];
  mood_names: string[];
  sub_genre_names: string[];
  play_count?: number;
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
}

interface ApiNotification {
  id: number;
  text: string;
  has_read: boolean;
  created_at: string;
  removing?: boolean;
}

interface HomeSummaryResponse {
  songs_recommendations: {
    type: string;
    message: string;
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
  sections: number;
}

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

const getTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "لحظاتی پیش";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days} روز پیش`;
};

// Utility function to convert ApiSong to Track
const apiSongToTrack = (song: any): Track => ({
  id: String(song.id),
  title: song.title,
  artist: song.artist_name,
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
};

export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

export default function Home() {
  const { logout, accessToken, user, authenticatedFetch } = useAuth();
  const { setCurrentPage, navigateTo, homeCache, setHomeCache } =
    useNavigation();
  const {
    recommendedPlaylists: playlistRecommendations,
    isLoading: loadingPlaylistRecommendations,
    setRecommendedData,
    nextUrl: recommendedNextUrl,
    loadMoreRecommended,
  } = useDiscovery();
  const { setQueue } = usePlayer();

  const isPremium = Boolean(
    user &&
    // explicit plan field (newer API responses)
    (user.plan === "premium" ||
      // legacy / alternate fields
      user.is_premium ||
      user.isPremium ||
      user.subscription?.is_active ||
      user.is_premium === "true" ||
      user.is_premium === 1),
  );

  const [homeData, setHomeData] = useState<HomeSummaryResponse | null>(
    (homeCache as HomeSummaryResponse) ?? null,
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
    homeCache ? false : true,
  );
  const [showBrandText, setShowBrandText] = useState(true);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [markingReadIds, setMarkingReadIds] = useState<Set<number>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const isInitialMount = useRef(true);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const lastFetchedToken = useRef<string | null>(null);
  const { isDesktop } = useResponsiveLayout();
  const isMobileView = !isDesktop;

  const sectionTitles = [
    "برای شما",
    "جدیدترین ریلیز ها ",
    "هنرمندان محبوب",
    "آلبوم‌های محبوب",
    "پلی لیست‌های جدید برای شما",
    "برترین آهنگ‌های روز",
    "برترین آلبوم‌های روز",
    "برترین هنرمندان روز",
    "برترین آهنگ‌های هفته",
    "برترین آلبوم‌های هفته",
    "برترین هنرمندان هفته",
  ];

  useEffect(() => {
    if (!accessToken || accessToken === lastFetchedToken.current) return;
    lastFetchedToken.current = accessToken;

    // If we have cached data, we show it immediately but still refresh in the background
    const isBackground = Boolean(homeCache);
    if (homeCache) {
      setHomeData(homeCache as HomeSummaryResponse);
      setIsLoading(false);
    }

    const fetchHomeData = async (background: boolean) => {
      try {
        const response = await authenticatedFetch(
          "https://api.sedabox.com/api/home/summary/",
        );
        if (response.ok) {
          const data = await response.json();

          // Ensure songs_recommendations always has a songs array
          if (!data.songs_recommendations) {
            data.songs_recommendations = { type: "", message: "", songs: [] };
          } else if (!Array.isArray(data.songs_recommendations.songs)) {
            // If API returns an error field instead, set empty songs and preserve error/message
            data.songs_recommendations.songs = [];
            if (
              !data.songs_recommendations.message &&
              data.songs_recommendations.error
            ) {
              data.songs_recommendations.message =
                data.songs_recommendations.error;
            }
          }

          // Only update if data is actually different to avoid unnecessary re-renders
          const hasChanged = JSON.stringify(data) !== JSON.stringify(homeCache);

          if (!background || hasChanged) {
            setHomeData(data);
            try {
              setHomeCache(data);
            } catch (e) {
              /* noop if context setter unavailable */
            }
          }
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        if (!background) {
          setIsLoading(false);
        }
      }
    };

    fetchHomeData(isBackground);
  }, [accessToken, homeCache, setHomeCache]);

  // Fetch extra sections
  useEffect(() => {
    if (!accessToken) return;

    const fetchExtra = async (
      endpoint: string,
      setter: (data: any) => void,
      key: string,
    ) => {
      try {
        const response = await authenticatedFetch(
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
  }, [accessToken]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await authenticatedFetch(
        "https://api.sedabox.com/api/notifications/",
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
    }
  }, [accessToken, fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    if (markingReadIds.has(id)) return;

    setMarkingReadIds((prev) => new Set(prev).add(id));
    try {
      const response = await authenticatedFetch(
        `https://api.sedabox.com/api/notifications/${id}/read/`,
        {
          method: "POST",
        },
      );

      if (response.ok) {
        // Trigger the animation sequence
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, has_read: true } : n)),
        );

        // Wait a bit for the checkmark animation
        await new Promise((resolve) => setTimeout(resolve, 300));

        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, removing: true } : n)),
        );

        // Wait for slide-out animation then remove from state
        await new Promise((resolve) => setTimeout(resolve, 500));
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingReadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    try {
      const response = await authenticatedFetch(
        "https://api.sedabox.com/api/notifications/read/",
        {
          method: "POST",
        },
      );

      if (response.ok) {
        // Mark all as removing and fade them out
        setNotifications((prev) => prev.map((n) => ({ ...n, removing: true })));
        await new Promise((resolve) => setTimeout(resolve, 500));
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

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
      const res = await authenticatedFetch(url);
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
          title: song.title,
          subtitle: song.artist_name,
          img: song.cover_image,
          duration: formatDuration(song.duration_seconds),
          isNew: false,
          type: "song" as const,
          artistId: (song as any).artist_id || (song as any).artist,
          artistSlug: (song as any).artist_slug,
        })),
        hottestDrops: homeData.latest_releases.results
          .slice(0, 5)
          .map((song) => ({
            id: song.id,
            title: song.title,
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
            title: song.title,
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
            title: song.title,
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
            title: song.title,
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
        })),
      }
    : null;

  useEffect(() => {
    const delay = isInitialMount.current ? 2700 : 700;
    const timer = setTimeout(() => {
      setShowBrandText(false);
      isInitialMount.current = false;
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
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
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
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
  }, [activeIndex]);

  if (isLoading || !sectionData || !homeData) {
    return (
      <>
        <SEO />
        <div
          dir="rtl"
          className="relative bg-transparent text-white font-sans pb-24 md:pb-4 md:min-h-screen selection:bg-green-500 selection:text-black"
          style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
        >
          <div className="pt-4">
            <div className="px-4 text-right">
              <div className="h-8 w-48 rounded bg-zinc-800 animate-pulse" />
            </div>
            <div className="flex flex-col gap-8 mt-4">
              {/* Four placeholder sections */}
              <div className="flex flex-col gap-3">
                <div className="px-4 text-right">
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
                <div className="px-4 text-right">
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
                <div className="px-4 text-right">
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
                <div className="px-4 text-right">
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

  if (homeData.songs_recommendations && homeData.songs_recommendations.songs) {
    availableSections.push({
      key: "songs_recommendations",
      title: "برای شما",
      subtitle:
        homeData.songs_recommendations.type === "trending" &&
        homeData.songs_recommendations.message ===
          "Start listening to get personalized recommendations!"
          ? "شروع کنید به کاوش .."
          : "بر اساس فعالیت های اخیر شما",
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
      showMore: true,
      onShowMore: () => navigateTo("for-you"),
    });
  }

  if (homeData.latest_releases && homeData.latest_releases.results) {
    availableSections.push({
      key: "latest_releases",
      title: "جدیدترین ریلیز ها",
      content: (
        <div
          className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4"
          style={{ direction: "rtl" }}
        >
          {sectionData.hottestDrops.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                handlePlaySong(item.id, homeData.latest_releases.results)
              }
              aria-label={`پخش ${item.title} از ${item.subtitle}`}
              className="snap-center shrink-0 w-[85vw] sm:w-80 relative group cursor-pointer text-right focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl outline-none"
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
                className="mt-2 font-bold text-lg truncate hover:underline decoration-zinc-500"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo("song-detail", { id: item.id });
                }}
              >
                {item.title}
              </h3>
              <p
                className="text-zinc-400 text-sm truncate hover:text-white transition-colors"
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
                {item.subtitle}
              </p>
            </button>
          ))}
        </div>
      ),
      showMore: !!homeData.latest_releases.next,
      onShowMore: () => navigateTo("latest-releases"),
    });
  }

  if (homeData.popular_artists && homeData.popular_artists.results) {
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
      showMore: !!homeData.popular_artists.next,
      onShowMore: () => navigateTo("popular-artists"),
    });
  }

  if (homeData.popular_albums && homeData.popular_albums.results) {
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
      showMore: !!homeData.popular_albums.next,
      onShowMore: () => navigateTo("popular-albums"),
    });
  }

  if (homeData.discoveries && homeData.discoveries.results) {
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
      showMore: !!homeData.discoveries.next,
      onShowMore: () => navigateTo("new-discoveries"),
    });
  }

  if (loadingPlaylistRecommendations) {
    availableSections.push({
      key: "playlist_recommendations_skeleton",
      title: "پلی لیست‌های جدید برای شما",
      content: (
        <SectionSkeleton
          title="پلی لیست‌های جدید برای شما"
          variant="horizontal"
        />
      ),
    });
  } else if (playlistRecommendations && playlistRecommendations.length > 0) {
    const playlists = playlistRecommendations;

    availableSections.push({
      key: "playlist_recommendations",
      title: "پلی لیست‌های جدید برای شما",
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
            title: s.title,
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
          title: "برترین آهنگ‌های روز",
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
              title: "برترین آلبوم‌های روز",
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
          title: "برترین آلبوم‌های روز",
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
          title: "برترین هنرمندان روز",
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
            title: s.title,
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
          title: "برترین آهنگ‌های هفته",
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
              title: "برترین آلبوم‌های هفته",
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
          title: "برترین آلبوم‌های هفته",
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
          title: "برترین هنرمندان هفته",
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
      pill: "پخش شخصی",
      title: firstRec.title,
      subtitle: `${firstRec.artist_name} • بر اساس فعالیت‌های اخیرت`,
      image: firstRec.cover_image || "/default-cover.jpg",
      meshGradient: meshGradients[idx],
      highlight:
        firstRec.genre_names?.slice(0, 2).join(" • ") || "چند ژانر منتخب",
      metaRight: formatDuration(firstRec.duration_seconds),
      type: "song",
      item: firstRec,
    });
  }

  const latest = homeData.latest_releases.results[0];
  if (latest && latest.id !== firstRec?.id) {
    const idx = heroHighlights.length % meshGradients.length;
    heroHighlights.push({
      key: `latest-${latest.id}`,
      pill: "آخرین ریلیز",
      title: latest.title,
      subtitle: `${latest.artist_name} • تازه روی صداباکس`,
      image: latest.cover_image || "/default-cover.jpg",
      meshGradient: meshGradients[idx],
      highlight: "انتشار تازه",
      metaRight: formatDuration(latest.duration_seconds),
      type: "song",
      item: latest,
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
      title: discovery.title,
      subtitle: `${discovery.artist_name} • پیشنهادی برای کشف جدید`,
      image: discovery.cover_image || "/default-cover.jpg",
      meshGradient: meshGradients[idx],
      highlight:
        discovery.mood_names?.slice(0, 2).join(" • ") || "حال‌وهوای خاص",
      metaRight: formatDuration(discovery.duration_seconds),
      type: "song",
      item: discovery,
    });
  }

  const playlistForHero = Array.isArray(playlistRecommendations)
    ? playlistRecommendations[0]
    : undefined;
  if (playlistForHero) {
    const idx = heroHighlights.length % meshGradients.length;
    heroHighlights.push({
      key: `playlist-${playlistForHero.unique_id || playlistForHero.id}`,
      pill: "لیست پخش منتخب",
      title: playlistForHero.title,
      subtitle: playlistForHero.description || "منتخب صداباکس برای حال تو",
      image: playlistForHero.cover_image || "/default-cover.jpg",
      meshGradient: meshGradients[idx],
      highlight: `${playlistForHero.songs_count} ترک`,
      metaRight: "لیست پخش آماده پخش",
      type: "playlist",
      item: playlistForHero,
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

  const handleHeroPrimaryPlay = () => {
    const sources: ApiSong[][] = [];
    if (homeData.songs_recommendations.songs.length) {
      sources.push(homeData.songs_recommendations.songs);
    }
    if (homeData.discoveries.results.length) {
      sources.push(homeData.discoveries.results);
    }
    if (homeData.latest_releases.results.length) {
      sources.push(homeData.latest_releases.results);
    }
    const list = sources[0];
    if (!list || !list.length) return;
    handlePlaySong(list[0].id, list);
  };

  const handleHeroCardPlay = (item: HeroHighlight) => {
    if (item.type === "song" && item.item) {
      if (item.key.startsWith("personal-")) {
        handlePlaySong(item.item.id, homeData.songs_recommendations.songs);
      } else if (item.key.startsWith("latest-")) {
        handlePlaySong(item.item.id, homeData.latest_releases.results);
      } else if (item.key.startsWith("discovery-")) {
        handlePlaySong(item.item.id, homeData.discoveries.results);
      }
    } else if (item.type === "playlist" && item.item) {
      navigateTo("playlist-detail", {
        id: item.item.unique_id || item.item.id,
        slug: createSlug(item.item.title),
      });
    }
  };

  return (
    <>
      <SEO />
      <div
        dir="rtl"
        className="relative bg-transparent text-white font-sans pb-24 md:pb-4 md:min-h-screen selection:bg-green-500 selection:text-black"
        style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
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
                <UserIcon className="w-6 h-6 text-zinc-400" />
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
              <NotificationPopover
                notifications={notifications}
                setNotifications={setNotifications}
                markingReadIds={markingReadIds}
                setMarkingReadIds={setMarkingReadIds}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                getTimeAgo={getTimeAgo}
                isMobile={true}
              />
              {!isPremium && (
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
            style={{ direction: "rtl" }}
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
                {s.title}
              </button>
            ))}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:block sticky top-0 z-50 px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.history.back()}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                aria-label="برگشت"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
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
                onClick={() => window.history.forward()}
                className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                aria-label="جلو"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
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

            {/* Center: Section navigation pills */}
            <div className="flex-1 flex justify-center">
              <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-3xl">
                {availableSections.map((s, i) => (
                  <button
                    key={s.key}
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
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-white hover:bg-zinc-700"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {!isPremium && (
                <button
                  onClick={() => navigateTo("premium")}
                  className="text-emerald-500 px-4 py-1.5 rounded-full font-semibold text-sm hover:text-emerald-400 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                >
                  ارتقا پلن +
                </button>
              )}
              <NotificationPopover
                notifications={notifications}
                setNotifications={setNotifications}
                markingReadIds={markingReadIds}
                setMarkingReadIds={setMarkingReadIds}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                getTimeAgo={getTimeAgo}
                isMobile={false}
              />
              <button
                onClick={() => navigateTo("profile")}
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                aria-label="مشاهده پروفایل"
              >
                <UserIcon className="w-6 h-6 text-zinc-400" />
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
            onPrimaryPlay={handleHeroPrimaryPlay}
            onGoToDiscover={() => scrollToSectionByKey("discoveries")}
            onCardPlay={handleHeroCardPlay}
          />
          {availableSections.map((s, i) => (
            <Section
              key={s.key}
              title={s.title}
              subtitle={s.subtitle}
              sectionRef={(el) => (sectionRefs.current[i] = el)}
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
            will-change: opacity, transform;
            backface-visibility: hidden;
            transform: translateZ(0);
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
    className="flex flex-col gap-3 fade-in scroll-mt-[135px] md:scroll-mt-24"
  >
    <div className="px-4 text-right relative">
      {showMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowMore?.();
          }}
          aria-label="نمایش بیشتر"
          className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium bg-transparent px-2 py-1 rounded transition focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
        >
          <span className="flex items-center gap-2">
            <span className="leading-none">نمایش بیشتر</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-zinc-400 transition-transform duration-150"
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
          <h2 className="text-2xl font-bold tracking-tight leading-none text-right w-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTitleClick();
              }}
              className="text-2xl font-bold tracking-tight leading-none text-right w-full text-left md:text-right focus-visible:ring-2 focus-visible:ring-emerald-500 rounded outline-none"
            >
              {title}
            </button>
          </h2>
        ) : (
          <h2 className="text-2xl font-bold tracking-tight leading-none text-right w-full">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-zinc-400 text-xs font-medium text-right w-full mt-1">
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
      style={{ direction: "rtl" }}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => (onPlay ? onPlay(item) : onItemClick?.(item))}
          aria-label={`${item.title} از ${item.subtitle}`}
          className={`snap-start shrink-0 flex flex-col gap-2 group cursor-pointer text-right focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl outline-none ${
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
              {variant === "layered" && (
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
                  <span>{Math.floor(Math.random() * 15) + 8}</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex flex-col ${
              variant === "circle" ? "items-center text-center" : "items-start"
            }`}
          >
            <h3
              className={`font-semibold text-white truncate w-full hover:underline decoration-zinc-500 ${
                variant === "circle" ? "text-sm" : "text-sm"
              }`}
              onClick={(e) => {
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
              {item.title}
            </h3>
            <p
              className="text-zinc-400 text-xs truncate w-full hover:text-white transition-colors"
              onClick={(e) => {
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
              {item.subtitle}
            </p>
          </div>
        </button>
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
            className="flex flex-row-reverse items-center gap-4 bg-zinc-900/50 p-2 pr-4 rounded-md group active:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-white transition-colors relative cursor-pointer hover:bg-zinc-800/70 text-right w-full"
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
            <div className="flex flex-col overflow-hidden flex-1 min-w-0 text-right">
              <span className="font-bold truncate text-white flex items-center gap-2">
                {item.title}
                {item.isNew && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg z-20 ml-2">
                    جدید
                  </span>
                )}
              </span>
              <span className="text-zinc-400 text-xs truncate">
                {item.subtitle}
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
      style={{ direction: "rtl" }}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => onPlay?.(item)}
          className="snap-start shrink-0 w-[75vw] sm:w-80 group cursor-pointer relative text-right"
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
                className="text-white font-bold truncate text-base hover:underline decoration-zinc-500"
                onClick={(e) => {
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
                {item.title}
              </h4>
              <p
                className="text-zinc-400 text-xs truncate mt-0.5 hover:text-white transition-colors"
                onClick={(e) => {
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
                {item.subtitle}
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
  overlayHeight = "50%",
}: {
  items: ItemType[];
  onItemClick?: (item: ItemType) => void;
  maxItems?: number;
  showMore?: boolean;
  onShowMore?: () => void;
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
            className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl p-1 text-right"
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
                e.stopPropagation();
                if (item.type === "album") {
                  navigateTo("album-detail", { id: item.id, slug: item.slug });
                }
              }}
            >
              {item.title}
            </h4>
            <p
              className="text-zinc-400 text-[11px] truncate px-1 mt-0.5 hover:text-white transition-colors"
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
              {item.subtitle}
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
      style={{ direction: "rtl" }}
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
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
              aria-hidden="true"
            >
              VERIFIED
            </div>
          </div>
          <h4
            className="text-white font-bold text-sm group-hover:text-emerald-400 transition-colors hover:underline decoration-zinc-500"
            onClick={(e) => {
              e.stopPropagation();
              navigateTo("artist-detail", { id: item.id, slug: item.slug });
            }}
          >
            {item.title}
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
