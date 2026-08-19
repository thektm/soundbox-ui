import type { ElementType } from "react";
import { Capacitor } from "@capacitor/core";
import { waitForSplashHidden } from "./splashRuntime";

type ScreenModule = { default: ElementType<any> };
type ScreenLoader = () => Promise<ScreenModule>;

type NativeWarmupOptions = {
  currentPage?: string | null;
  isLoggedIn: boolean;
};

type NavigatorWithDeviceMemory = Navigator & {
  deviceMemory?: number;
};

type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: (deadline: IdleDeadlineLike) => void,
    options?: { timeout: number },
  ) => number;
};

/**
 * Native route modules stay code-split so first launch remains lean. Unlike the
 * previous load-before-commit path, navigation never waits for these imports.
 * After the one-time splash leaves, an adaptive idle queue warms likely routes
 * one module at a time. This keeps splash/Home frames smooth while making later
 * screen changes hit the WebView module cache instead of parse/evaluate work.
 */
const screenLoaders: Record<string, ScreenLoader> = {
  home: () => import("../components/home"),
  search: () => import("../components/Search"),
  library: () => import("../components/LibraryScreen"),
  playlists: () => import("../components/Playlists"),
  profile: () =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
      ? import("../components/DesktopProfile")
      : import("../components/Profile"),
  "downloads-history": () => import("../components/DownloadsHistory"),
  settings: () => import("../components/Settings"),

  "song-detail": () => import("../components/SongDetail"),
  "playlist-detail": () => import("../components/PlaylistDetail"),
  "user-playlist-detail": () => import("../components/UserPlaylistDetail"),
  "artist-detail": () => import("../components/ArtistDetail"),
  "artist-sub-page": () => import("../components/ArtistSubPage"),
  "album-detail": () => import("../components/AlbumDetail"),
  "user-detail": () => import("../components/UserDetail"),
  "chart-detail": () => import("../components/ChartPage"),
  "genre-detail": () => import("../components/GenrePage"),

  "followers-following": () => import("../components/FollowersFollowing"),
  "followed-artists": () => import("../components/FollowingArtistsPage"),
  "liked-songs": () => import("../components/LikedSongs"),
  "liked-albums": () => import("../components/LikedAlbums"),
  "liked-playlists": () => import("../components/LikedPlaylists"),
  "my-playlists": () => import("../components/MyPlaylists"),

  "popular-artists": () => import("../components/PopularArtistsPage"),
  "latest-releases": () => import("../components/LatestReleasesPage"),
  "popular-albums": () => import("../components/PopularAlbumsPage"),
  "new-discoveries": () => import("../components/NewDiscoveriesPage"),
  "recommended-playlists": () => import("../components/RecommendedPlaylistsPage"),
  "for-you": () => import("../components/ForYouPage"),
  "other-user-playlists": () => import("../components/OtherUserPlaylists"),

  premium: () => import("../components/Premium"),
  "upgrade-plans": () => import("../components/UpgradePlans"),
  "payment-processing": () => import("../components/PaymentProcessing"),
  "payment-success": () => import("../components/PaymentSuccess"),

  login: () => import("../components/Login"),
  register: () => import("../components/Register"),
  verify: () => import("../components/Verify"),
  "forgot-password": () => import("../components/ForgotPassword"),
};

const MEMBER_ONLY = new Set([
  "library",
  "playlists",
  "profile",
  "downloads-history",
  "settings",
  "followers-following",
  "premium",
  "followed-artists",
  "liked-songs",
  "liked-albums",
  "liked-playlists",
  "my-playlists",
  "upgrade-plans",
  "payment-processing",
  "payment-success",
]);

const GUEST_ONLY = new Set(["login", "register", "verify", "forgot-password"]);

const ESSENTIAL_ORDER = [
  "home",
  "search",
  "song-detail",
  "artist-detail",
  "album-detail",
  "playlist-detail",
  "user-detail",
  "chart-detail",
  "genre-detail",
  "library",
  "profile",
];

const COMMON_ORDER = [
  "user-playlist-detail",
  "artist-sub-page",
  "popular-artists",
  "latest-releases",
  "popular-albums",
  "recommended-playlists",
  "new-discoveries",
  "for-you",
  "playlists",
  "liked-songs",
  "liked-albums",
  "liked-playlists",
  "my-playlists",
  "followed-artists",
  "downloads-history",
  "settings",
];

const componentCache = new Map<string, ElementType<any>>();
const pendingLoads = new Map<string, Promise<ElementType<any> | null>>();
const warmupRuns = new Map<"guest" | "member", Promise<void>>();
const completedWarmups = new Set<"guest" | "member">();

const getScreenCacheKey = (page: string): string => {
  if (page !== "profile" || typeof window === "undefined") return page;
  // Profile has two genuinely different responsive components. Warming one
  // must not pin that variant forever if a tablet later crosses the breakpoint.
  return window.matchMedia("(min-width: 1024px)").matches
    ? "profile:desktop"
    : "profile:mobile";
};

export const isNativeScreenReady = (page: string): boolean =>
  componentCache.has(getScreenCacheKey(page));

export const getNativeScreenComponent = (
  page: string,
): ElementType<any> | null => componentCache.get(getScreenCacheKey(page)) ?? null;

/** Load one native route module and retain its resolved component. */
export const prepareNativeScreen = (
  page: string,
): Promise<ElementType<any> | null> => {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return Promise.resolve(null);
  }

  const cacheKey = getScreenCacheKey(page);
  const cached = componentCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const pending = pendingLoads.get(cacheKey);
  if (pending) return pending;

  const loader = screenLoaders[page];
  if (!loader) return Promise.resolve(null);

  const promise = loader()
    .then((module) => {
      const component = module.default;
      componentCache.set(cacheKey, component);
      pendingLoads.delete(cacheKey);
      return component;
    })
    .catch((error) => {
      pendingLoads.delete(cacheKey);
      throw error;
    });

  pendingLoads.set(cacheKey, promise);
  return promise;
};

const isEligible = (page: string, isLoggedIn: boolean): boolean => {
  if (MEMBER_ONLY.has(page)) return isLoggedIn;
  if (GUEST_ONLY.has(page)) return !isLoggedIn;
  return true;
};

const unique = (values: string[]): string[] => Array.from(new Set(values));

const getWarmupLimit = (): number => {
  if (typeof navigator === "undefined") return ESSENTIAL_ORDER.length;
  const memory = (navigator as NavigatorWithDeviceMemory).deviceMemory;

  // Some WebViews do not expose deviceMemory. Treat unknown hardware as a
  // mid-tier device instead of eagerly evaluating every route in the app.
  if (typeof memory !== "number") return 22;

  // Keep low-memory WebViews lean; aggressive all-screen warming can increase
  // renderer eviction risk and would be slower overall on those devices.
  if (typeof memory === "number" && memory <= 2) return 10;
  if (typeof memory === "number" && memory <= 4) return 22;
  return Number.POSITIVE_INFINITY;
};

const buildWarmupQueue = ({
  currentPage,
  isLoggedIn,
}: NativeWarmupOptions): string[] => {
  const remaining = Object.keys(screenLoaders);
  const ordered = unique([
    ...(currentPage ? [currentPage] : []),
    ...ESSENTIAL_ORDER,
    ...COMMON_ORDER,
    ...remaining,
  ]).filter((page) => isEligible(page, isLoggedIn));

  return ordered.slice(0, getWarmupLimit());
};

const waitForCleanPaints = (): Promise<void> =>
  new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });

const waitForIdleSlice = (): Promise<void> =>
  new Promise((resolve) => {
    const nativeWindow = window as WindowWithIdleCallback;
    if (typeof nativeWindow.requestIdleCallback !== "function") {
      window.setTimeout(resolve, 48);
      return;
    }

    const requestIdle = () => {
      nativeWindow.requestIdleCallback!(
        (deadline) => {
          // A timeout callback can arrive while the WebView is actively
          // scrolling/painting. Do not force module parsing into that frame;
          // wait for a genuinely useful idle budget instead.
          if (!deadline.didTimeout && deadline.timeRemaining() >= 8) {
            resolve();
            return;
          }
          window.setTimeout(requestIdle, 64);
        },
        { timeout: 1_500 },
      );
    };

    requestIdle();
  });

const pauseBetweenModules = (): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, 16));

/**
 * Warm native route chunks only after the splash is fully gone. The queue is
 * deliberately serial and idle-scheduled: one module gets parsed/evaluated,
 * then the WebView gets another scheduling opportunity before the next one.
 */
export const continueNativeScreenWarmup = (
  options: NativeWarmupOptions,
): void => {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return;

  const scope: "guest" | "member" = options.isLoggedIn ? "member" : "guest";
  if (completedWarmups.has(scope) || warmupRuns.has(scope)) return;

  const run = (async () => {
    await waitForSplashHidden();
    await waitForCleanPaints();
    // Let Home/current route finish its first post-splash commit and image work.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 120));

    for (const page of buildWarmupQueue(options)) {
      if (isNativeScreenReady(page)) continue;
      await waitForIdleSlice();
      try {
        await prepareNativeScreen(page);
      } catch {
        // Best effort only. Real navigation still has Next dynamic() as the
        // fallback loader, so a failed warmup must never block the user.
      }
      await pauseBetweenModules();
    }
    completedWarmups.add(scope);
  })().finally(() => {
    warmupRuns.delete(scope);
  });

  warmupRuns.set(scope, run);
};
