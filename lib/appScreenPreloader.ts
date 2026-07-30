/**
 * Browser-lifetime screen chunk warmer for the custom in-app router.
 *
 * The application is implemented as one Next.js page with dynamically imported
 * screen components. A normal navigation therefore cannot issue its API request
 * until the target component chunk has downloaded and evaluated. This module
 * starts those imports while the splash is visible so subsequent navigation can
 * begin data loading immediately.
 *
 * Every loader catches its own failure. A missing chunk, offline browser, stale
 * deployment, or a low-memory tab must never prevent the application from
 * opening; the normal dynamic import will retry when that screen is visited.
 */

type ScreenLoader = () => Promise<unknown>;

type WarmupTask = {
  key: string;
  priority: "critical" | "normal" | "deferred";
  auth: "all" | "guest" | "member";
  load: ScreenLoader;
};

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type WarmupOptions = {
  currentPage?: string | null;
  isLoggedIn: boolean;
};

type WarmupProfile = {
  concurrency: number;
  gateAllScreens: boolean;
  gateBudgetMs: number;
  interTaskDelayMs: number;
};

const TASKS: WarmupTask[] = [
  // Current/most common public destinations.
  { key: "home", priority: "critical", auth: "all", load: () => import("../components/home") },
  { key: "search", priority: "critical", auth: "all", load: () => import("../components/Search") },
  { key: "song-detail", priority: "critical", auth: "all", load: () => import("../components/SongDetail") },
  { key: "artist-detail", priority: "critical", auth: "all", load: () => import("../components/ArtistDetail") },
  { key: "album-detail", priority: "critical", auth: "all", load: () => import("../components/AlbumDetail") },
  { key: "playlist-detail", priority: "critical", auth: "all", load: () => import("../components/PlaylistDetail") },
  { key: "user-playlist-detail", priority: "critical", auth: "all", load: () => import("../components/UserPlaylistDetail") },
  { key: "user-detail", priority: "critical", auth: "all", load: () => import("../components/UserDetail") },

  // Main authenticated and browse destinations.
  { key: "library", priority: "normal", auth: "member", load: () => import("../components/LibraryScreen") },
  { key: "profile-mobile", priority: "normal", auth: "member", load: () => import("../components/Profile") },
  { key: "profile-desktop", priority: "normal", auth: "member", load: () => import("../components/DesktopProfile") },
  { key: "settings", priority: "normal", auth: "member", load: () => import("../components/Settings") },
  { key: "liked-songs", priority: "normal", auth: "member", load: () => import("../components/LikedSongs") },
  { key: "liked-albums", priority: "normal", auth: "member", load: () => import("../components/LikedAlbums") },
  { key: "liked-playlists", priority: "normal", auth: "member", load: () => import("../components/LikedPlaylists") },
  { key: "my-playlists", priority: "normal", auth: "member", load: () => import("../components/MyPlaylists") },
  { key: "playlists", priority: "normal", auth: "member", load: () => import("../components/Playlists") },
  { key: "followers-following", priority: "normal", auth: "member", load: () => import("../components/FollowersFollowing") },
  { key: "followed-artists", priority: "normal", auth: "member", load: () => import("../components/FollowingArtistsPage") },
  { key: "downloads-history", priority: "normal", auth: "member", load: () => import("../components/DownloadsHistory") },

  { key: "popular-artists", priority: "normal", auth: "all", load: () => import("../components/PopularArtistsPage") },
  { key: "latest-releases", priority: "normal", auth: "all", load: () => import("../components/LatestReleasesPage") },
  { key: "popular-albums", priority: "normal", auth: "all", load: () => import("../components/PopularAlbumsPage") },
  { key: "new-discoveries", priority: "normal", auth: "all", load: () => import("../components/NewDiscoveriesPage") },
  { key: "recommended-playlists", priority: "normal", auth: "all", load: () => import("../components/RecommendedPlaylistsPage") },
  { key: "for-you", priority: "normal", auth: "all", load: () => import("../components/ForYouPage") },
  { key: "other-user-playlists", priority: "normal", auth: "all", load: () => import("../components/OtherUserPlaylists") },
  { key: "artist-sub-page", priority: "normal", auth: "all", load: () => import("../components/ArtistSubPage") },
  { key: "chart-detail", priority: "normal", auth: "all", load: () => import("../components/ChartPage") },
  { key: "genre-detail", priority: "normal", auth: "all", load: () => import("../components/GenrePage") },

  // Less common flows; still warmed during the splash/idle pass.
  { key: "premium", priority: "deferred", auth: "all", load: () => import("../components/Premium") },
  { key: "upgrade-plans", priority: "deferred", auth: "member", load: () => import("../components/UpgradePlans") },
  { key: "payment-processing", priority: "deferred", auth: "member", load: () => import("../components/PaymentProcessing") },
  { key: "payment-success", priority: "deferred", auth: "member", load: () => import("../components/PaymentSuccess") },
  { key: "login", priority: "deferred", auth: "guest", load: () => import("../components/Login") },
  { key: "register", priority: "deferred", auth: "guest", load: () => import("../components/Register") },
  { key: "verify", priority: "deferred", auth: "guest", load: () => import("../components/Verify") },
  { key: "forgot-password", priority: "deferred", auth: "guest", load: () => import("../components/ForgotPassword") },

  // Shell/interaction chunks. They are not allowed to block slow-network startup.
  { key: "sidebar", priority: "deferred", auth: "member", load: () => import("../components/Sidebar") },
  { key: "bottom-navbar", priority: "deferred", auth: "member", load: () => import("../components/BottomNavbar") },
  { key: "guest-navigation", priority: "deferred", auth: "guest", load: () => import("../components/GuestNavigation") },
  { key: "music-player", priority: "deferred", auth: "all", load: () => import("../components/MusicPlayer") },
  { key: "notification-panel", priority: "deferred", auth: "member", load: () => import("../components/NotificationPanel") },
  { key: "initial-modal", priority: "deferred", auth: "member", load: () => import("../components/InitialModal") },
];

const loadPromises = new Map<string, Promise<void>>();
const warmupRuns = new Map<"guest" | "member", Promise<void>>();

const loadOnce = (task: WarmupTask): Promise<void> => {
  const existing = loadPromises.get(task.key);
  if (existing) return existing;

  const promise = task
    .load()
    .then(() => undefined)
    .catch((error) => {
      // Remove failed entries so real navigation can retry after reconnect or a
      // rolling deployment. Logging remains diagnostic-only and never blocks UI.
      loadPromises.delete(task.key);
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[SEDABOX:PRELOAD] ${task.key} was not warmed`, error);
      }
    });
  loadPromises.set(task.key, promise);
  return promise;
};

const getConnection = (): NetworkInformationLike | null => {
  if (typeof navigator === "undefined") return null;
  const candidate = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return candidate.connection || candidate.mozConnection || candidate.webkitConnection || null;
};

const getWarmupProfile = (): WarmupProfile => {
  const connection = getConnection();
  const effectiveType = connection?.effectiveType || "";

  if (connection?.saveData || effectiveType === "slow-2g" || effectiveType === "2g") {
    return { concurrency: 1, gateAllScreens: false, gateBudgetMs: 2_000, interTaskDelayMs: 300 };
  }
  if (effectiveType === "3g") {
    return { concurrency: 2, gateAllScreens: false, gateBudgetMs: 3_000, interTaskDelayMs: 100 };
  }
  return { concurrency: 4, gateAllScreens: true, gateBudgetMs: 4_500, interTaskDelayMs: 0 };
};

const isEligible = (task: WarmupTask, isLoggedIn: boolean): boolean =>
  task.auth === "all" ||
  (task.auth === "member" && isLoggedIn) ||
  (task.auth === "guest" && !isLoggedIn);

const runPool = async (
  tasks: WarmupTask[],
  concurrency: number,
  interTaskDelayMs: number,
): Promise<void> => {
  let cursor = 0;
  const worker = async () => {
    while (cursor < tasks.length) {
      const task = tasks[cursor++];
      await loadOnce(task);
      if (interTaskDelayMs > 0 && cursor < tasks.length) {
        await waitForBudget(interTaskDelayMs);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, tasks.length || 1)) }, worker),
  );
};

const waitForBudget = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * Starts warming every eligible screen. On normal/fast networks the splash can
 * wait for the full set (up to a safety budget). On Save-Data/2G/3G, all tasks
 * still start, but only critical screens gate splash dismissal; the rest keep
 * filling the browser's immutable Next chunk cache in the background.
 */
export const warmAppScreensDuringSplash = async ({
  currentPage,
  isLoggedIn,
}: WarmupOptions): Promise<void> => {
  if (typeof window === "undefined") return;

  const profile = getWarmupProfile();
  const eligible = TASKS.filter((task) => isEligible(task, isLoggedIn)).sort((a, b) => {
    if (a.key === currentPage) return -1;
    if (b.key === currentPage) return 1;
    const rank = { critical: 0, normal: 1, deferred: 2 } as const;
    return rank[a.priority] - rank[b.priority];
  });

  const scope: "guest" | "member" = isLoggedIn ? "member" : "guest";
  let fullWarmup = warmupRuns.get(scope);
  if (!fullWarmup) {
    fullWarmup = runPool(eligible, profile.concurrency, profile.interTaskDelayMs).finally(() => {
      // A later reconnect/idle pass may retry individual imports that failed
      // during this run. Successfully evaluated modules remain deduplicated by
      // loadPromises and the browser module registry.
      warmupRuns.delete(scope);
    });
    warmupRuns.set(scope, fullWarmup);
  }

  const criticalTasks = eligible.filter(
    (task) => task.priority === "critical" || task.key === currentPage,
  );
  const gatePromise = profile.gateAllScreens
    ? fullWarmup
    : Promise.all(criticalTasks.map(loadOnce)).then(() => undefined);

  // Never create an endless splash because of a stale deployment, offline tab,
  // browser memory pressure, or a module evaluation error.
  await Promise.race([gatePromise, waitForBudget(profile.gateBudgetMs)]);
};

/** Start a non-blocking warmup after startup or when authentication changes. */
export const continueAppScreenWarmup = (options: WarmupOptions): void => {
  if (typeof window === "undefined") return;
  const start = () => void warmAppScreensDuringSplash(options);
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback(start, { timeout: 2_000 });
  } else {
    window.setTimeout(start, 250);
  }
};
