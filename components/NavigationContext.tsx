import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { decodeShare, slugify } from "../utils/share";
import { getCanonicalUserPath } from "../lib/userProfileRoute";
import { Capacitor } from "@capacitor/core";
import {
  isNativeScreenReady,
  prepareNativeScreen,
} from "../lib/nativeScreenLoader";

interface NavigationContextType {
  currentPage: string;
  currentParams: any;
  previousPage: string | null;
  setCurrentPage: (page: string) => void;
  setCurrentParams: (params: any) => void;
  navigateTo: (
    page: string,
    params?: any,
    pushHistory?: boolean | "replace",
  ) => void;
  goBack: () => void;
  visibilityMap: Record<string, boolean>;
  setComponentVisibility: (component: string, visible: boolean) => void;
  registerScrollContainer: (element: HTMLElement | null) => void;
  restoreScroll: () => void;
  scrollToTop: () => void;
  navigationKey: string;
  homeCache: any;
  setHomeCache: (data: any) => void;
  isResolving: boolean;
  setIsResolving: (v: boolean) => void;
  scrollContainer: HTMLElement | null;
}

// ─── URL ↔ Page mapping ────────────────────────────────────────────────────
const ROUTED_PAGES = [
  "home",
  "search",
  "library",
  "premium",
  "profile",
  "login",
  "register",
  "verify",
  "forgot-password",
  "playlists",
  "downloads-history",
  "settings",
  "upgrade-plans",
  "payment-processing",
  "payment-success",
  "popular-artists",
  "latest-releases",
  "popular-albums",
  "new-discoveries",
  "for-you",
  "my-playlists",
  "liked-songs",
  "liked-albums",
  "liked-playlists",
  "followers-following",
  "followed-artists",
  "chart-detail",
  "recommended-playlists",
  "other-user-playlists",
];

type SearchFilter =
  | "all"
  | "songs"
  | "artists"
  | "albums"
  | "playlists"
  | "users";

const SEARCH_FILTERS = new Set<SearchFilter>([
  "all",
  "songs",
  "artists",
  "albums",
  "playlists",
  "users",
]);

function parseSearchParams(search = ""): { q: string; filter: SearchFilter } {
  const params = new URLSearchParams(search);
  const rawFilter = params.get("type") as SearchFilter | null;
  return {
    q: params.get("q") || "",
    filter: rawFilter && SEARCH_FILTERS.has(rawFilter) ? rawFilter : "all",
  };
}

/**
 * Extracts the numeric ID from a "{id}-{slug}" URL segment.
 * e.g. "123-some-artist-name" → "123"
 */
function extractIdFromSegment(segment: string): string {
  const dashIdx = segment.indexOf("-");
  return dashIdx === -1 ? segment : segment.slice(0, dashIdx);
}

function parsePathname(pathname: string): { page: string; params: any } {
  const parts = pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
  const first = parts[0] || "home";

  // simple routed pages
  if (ROUTED_PAGES.includes(first)) {
    // map some simple literal paths to pages
    switch (first) {
      case "home":
        return { page: "home", params: null };
      case "liked-songs":
      case "liked-albums":
      case "liked-playlists":
      case "my-playlists":
      case "playlists":
      case "recommended-playlists":
      case "downloads-history":
      case "settings":
      case "upgrade-plans":
      case "payment-processing":
      case "payment-success":
      case "popular-artists":
      case "latest-releases":
      case "popular-albums":
      case "new-discoveries":
      case "for-you":
      case "followed-artists":
      case "profile":
      case "library":
      case "premium":
      case "search":
      case "login":
      case "register":
      case "verify":
      case "forgot-password":
        return { page: first, params: null };
    }
  }

  // short share URLs: /s/<code>
  if (first === "s" && parts[1]) {
    const decoded = decodeShare(parts[1]);
    if (decoded) {
      const { type, id } = decoded;
      switch (type) {
        case "song":
          return { page: "song-detail", params: { id } };
        case "artist":
          return { page: "artist-detail", params: { id } };
        case "album":
          return { page: "album-detail", params: { id } };
        case "playlist":
          return { page: "playlist-detail", params: { id } };
        case "user-playlist":
          return { page: "user-playlist-detail", params: { id } };
      }
    }
  }

  // artist: canonical /artist/{id}-{slug}; plural form remains accepted for old links
  if ((first === "artists" || first === "artist") && parts[1]) {
    const id = extractIdFromSegment(parts[1]);
    const slug = parts[1].includes("-")
      ? parts[1].split("-").slice(1).join("-")
      : null;

    if (parts[2]) {
      return {
        page: "artist-sub-page",
        params: { id, slug, subPage: parts[2] },
      };
    }
    return {
      page: "artist-detail",
      params: { id, slug },
    };
  }

  // track: /track/{id}-{slug}
  if (first === "track" && parts[1]) {
    return {
      page: "song-detail",
      params: { id: extractIdFromSegment(parts[1]) },
    };
  }

  // playlist: /playlist/{id}-{slug}
  if (first === "playlist" && parts[1]) {
    const id = extractIdFromSegment(parts[1]);
    // If the segment has no leading digits it's likely an old slug-only URL
    return {
      page: "playlist-detail",
      params: { id, slug: /^\d/.test(parts[1]) ? null : parts[1] },
    };
  }

  // user playlist explicit: /user-playlist/:id
  if (first === "user-playlist" && parts[1]) {
    return {
      page: "user-playlist-detail",
      params: { id: extractIdFromSegment(parts[1]) },
    };
  }

  // album: /album/{id}-{slug}
  if (first === "album" && parts[1]) {
    return {
      page: "album-detail",
      params: { id: extractIdFromSegment(parts[1]) },
    };
  }

  // genre: /genres/{id}-{slug} or /genre/{id}-{slug}
  if ((first === "genres" || first === "genre") && parts[1]) {
    const id = extractIdFromSegment(parts[1]);
    const remaining = parts[1].includes("-")
      ? parts[1].split("-").slice(1).join("-")
      : null;
    return {
      page: "genre-detail",
      params: {
        id,
        name: remaining ? decodeURIComponent(remaining).replace(/-/g, " ") : "",
      },
    };
  }

  // User details:
  // - official account: /user/sedabox
  // - canonical normal user: /user/{database-id}-{display-name-slug}
  // - legacy unique-id or numeric links remain accepted and are canonicalized
  //   by UserDetail after the profile resolves.
  if (first === "user" && parts[1]) {
    const segment = decodeURIComponent(parts[1]);
    if (segment.toLowerCase() === "sedabox") {
      if (parts[2]?.toLowerCase() === "playlists") {
        return {
          page: "other-user-playlists",
          params: { uniqueId: "sedabox" },
        };
      }
      return {
        page: "user-detail",
        params: { id: "sedabox", uniqueId: "sedabox", isOfficial: true },
      };
    }

    const canonicalMatch = segment.match(/^(\d+)-(.+)$/);
    if (canonicalMatch) {
      return {
        page: "user-detail",
        params: {
          id: canonicalMatch[1],
          dbId: canonicalMatch[1],
          slug: canonicalMatch[2],
        },
      };
    }

    return {
      page: "user-detail",
      params: /^\d+$/.test(segment)
        ? { id: segment, legacyNumeric: true }
        : { id: segment, uniqueId: segment },
    };
  }

  // followers/following page: /followers-following?tab=followers or /followers-following/following
  if (first === "followers-following") {
    return {
      page: "followers-following",
      params: { tab: parts[1] || "followers" },
    };
  }

  // liked shortcuts: /liked/songs, /liked/albums, /liked/playlists
  if (first === "liked" && parts[1]) {
    const key = `liked-${parts[1]}`;
    if (["songs", "albums", "playlists"].includes(parts[1])) {
      return { page: key, params: null };
    }
  }

  // chart detail: /chart/:chartType/:title?
  if (first === "chart" && parts[1]) {
    const chartType = parts[1];
    let type: "songs" | "albums" | "artists" = "songs";
    if (chartType.includes("album")) type = "albums";
    else if (chartType.includes("artist")) type = "artists";

    return {
      page: "chart-detail",
      params: {
        chartType: chartType,
        type: type,
        title: parts[2] ? decodeURIComponent(parts[2]) : undefined,
      },
    };
  }

  // Unrecognised path → home
  return { page: "home", params: null };
}

function parseLocation(
  pathname: string,
  search = "",
): { page: string; params: any } {
  const parsed = parsePathname(pathname);
  if (parsed.page === "search") {
    return { page: "search", params: parseSearchParams(search) };
  }
  return parsed;
}

function pageToPathname(page: string, params?: any): string | null {
  if (page === "search") {
    const searchParams = new URLSearchParams();
    const query = String(params?.q ?? params?.query ?? "").trim();
    const filter = params?.filter as SearchFilter | undefined;
    if (query) searchParams.set("q", query);
    if (filter && filter !== "all" && SEARCH_FILTERS.has(filter)) {
      searchParams.set("type", filter);
    }
    const queryString = searchParams.toString();
    return queryString ? `/search?${queryString}` : "/search";
  }
  if (page === "chart-detail") {
    // Chart titles are localized display text, not canonical URL slugs.
    // The stable chart key/type is sufficient for routing and keeps generated URLs language-neutral.
    if (params?.chartType) return `/chart/${params.chartType}`;
    if (params?.type) return `/chart/${params.type}`;
    return "/chart";
  }

  // SedaBox has a dedicated public playlists URL. This must be checked before
  // the generic ROUTED_PAGES fallback below because other-user-playlists is a
  // routed page name as well.
  if (
    page === "other-user-playlists" &&
    String(params?.uniqueId || "").toLowerCase() === "sedabox"
  ) {
    return "/user/sedabox/playlists";
  }

  // simple pages with direct path
  if (ROUTED_PAGES.includes(page)) {
    return `/${page}`;
  }

  // auth pages (aliases if ever used as page keys)
  if (page === "login") return "/login";
  if (page === "register") return "/register";
  if (page === "verify") return "/verify";
  if (page === "forgot-password") return "/forgot-password";

  if (page === "artist-detail") {
    if (params?.id) {
      // Artist URLs are built from English name/stage-name metadata only.
      // Legacy `slug`/unique-id params are intentionally not re-emitted.
      const slug = slugify(
        params?.urlSlug ||
          params?.url_slug ||
          params?.artisticNameEn ||
          params?.artistic_name_en ||
          params?.nameEn ||
          params?.name_en ||
          params?.name ||
          "",
      );
      return `/artist/${params.id}${slug ? `-${slug}` : ""}`;
    }
  }

  if (page === "artist-sub-page") {
    if (params?.id && params?.subPage) {
      const slug = slugify(
        params?.urlSlug ||
          params?.url_slug ||
          params?.artisticNameEn ||
          params?.artistic_name_en ||
          params?.nameEn ||
          params?.name_en ||
          params?.name ||
          "",
      );
      return `/artist/${params.id}${slug ? `-${slug}` : ""}/${params.subPage}`;
    }
  }

  if (page === "song-detail") {
    if (params?.id) {
      const slug = slugify(
        params?.urlSlug ||
          params?.url_slug ||
          params?.titleEn ||
          params?.title_en ||
          params?.songSlug ||
          params?.title ||
          "",
      );
      return `/track/${params.id}${slug ? `-${slug}` : ""}`;
    }
  }

  if (page === "playlist-detail") {
    if (params?.id) {
      const slug = slugify(
        params?.urlSlug ||
          params?.url_slug ||
          params?.titleEn ||
          params?.title_en ||
          params?.slug ||
          params?.title ||
          "",
      );
      return `/playlist/${params.id}${slug ? `-${slug}` : ""}`;
    }
    // Slug-only legacy links remain accepted by the parser, but new navigation
    // never emits Persian/Arabic slugs.
    if (params?.slug) {
      const slug = slugify(params.slug);
      if (slug) return `/playlist/${slug}`;
    }
  }

  if (page === "user-playlist-detail") {
    if (params?.id) return `/user-playlist/${params.id}`;
  }

  if (page === "album-detail") {
    if (params?.id) {
      const slug = slugify(
        params?.urlSlug ||
          params?.url_slug ||
          params?.titleEn ||
          params?.title_en ||
          params?.slug ||
          params?.title ||
          "",
      );
      return `/album/${params.id}${slug ? `-${slug}` : ""}`;
    }
    if (params?.slug) {
      const slug = slugify(params.slug);
      if (slug) return `/album/${slug}`;
    }
  }

  if (page === "genre-detail") {
    if (params?.id) {
      const slug = slugify(
        params?.urlSlug ||
          params?.url_slug ||
          params?.nameEn ||
          params?.name_en ||
          params?.slug ||
          params?.name ||
          "",
      );
      return `/genres/${params.id}${slug ? `-${slug}` : ""}`;
    }
  }

  if (page === "user-detail") {
    return getCanonicalUserPath(params);
  }

  if (page === "followers-following") {
    if (params?.tab) return `/followers-following/${params.tab}`;
    return "/followers-following";
  }

  if (page === "liked-songs") return "/liked/songs";
  if (page === "liked-albums") return "/liked/albums";
  if (page === "liked-playlists") return "/liked/playlists";

  return null; // other pages: don't change the URL
}

const NAV_HISTORY_MARKER = "__sedaboxNavigation";
const NAV_HISTORY_VERSION = 1;

interface NavigationHistoryState {
  page: string;
  params: any;
  [NAV_HISTORY_MARKER]: number;
  __sbNavIndex: number;
  __sbNavKey: string;
}

function createNavigationEntryKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `sb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function isNavigationHistoryState(
  value: unknown,
): value is NavigationHistoryState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return (
    state[NAV_HISTORY_MARKER] === NAV_HISTORY_VERSION &&
    typeof state.page === "string" &&
    typeof state.__sbNavIndex === "number" &&
    typeof state.__sbNavKey === "string"
  );
}

function writeBrowserHistory(
  mode: "push" | "replace",
  state: NavigationHistoryState,
  path: string,
): void {
  try {
    if (mode === "push") window.history.pushState(state, "", path);
    else window.history.replaceState(state, "", path);
  } catch (error) {
    // API payloads passed as initial page data should normally be structured-
    // cloneable. If a future caller passes a non-cloneable value, keep the
    // route functional with the stable identifiers needed to reload the page.
    const raw =
      state.params && typeof state.params === "object" ? state.params : {};
    const safeParams = [
      "id",
      "dbId",
      "uniqueId",
      "slug",
      "urlSlug",
      "url_slug",
      "songSlug",
      "artistSlug",
      "name",
      "title",
      "query",
      "q",
      "filter",
      "tab",
      "type",
      "chartType",
      "subPage",
      "generatedBy",
      "creatorUniqueId",
      "isOwner",
    ].reduce<Record<string, unknown>>((result, key) => {
      const value = raw[key];
      if (
        ["string", "number", "boolean"].includes(typeof value) ||
        value === null
      ) {
        result[key] = value;
      }
      return result;
    }, {});
    const fallback = { ...state, params: safeParams };
    if (mode === "push") window.history.pushState(fallback, "", path);
    else window.history.replaceState(fallback, "", path);
    console.warn(
      "Navigation state contained a non-cloneable value; stored safe route params instead.",
      error,
    );
  }
}

/**
 * Updates the URL/state for the current app entry without changing its
 * identity or in-app history position. Canonical URL and search-param writers
 * use this so Back/Forward can always restore the exact prior entry.
 */
export function replaceCurrentNavigationEntry(
  page: string,
  params: any,
  path: string,
): void {
  if (typeof window === "undefined") return;
  const existing = window.history.state;
  const state: NavigationHistoryState = {
    ...(existing && typeof existing === "object" ? existing : {}),
    [NAV_HISTORY_MARKER]: NAV_HISTORY_VERSION,
    __sbNavIndex: isNavigationHistoryState(existing)
      ? existing.__sbNavIndex
      : 0,
    __sbNavKey: isNavigationHistoryState(existing)
      ? existing.__sbNavKey
      : createNavigationEntryKey(),
    page,
    params: params || null,
  };
  writeBrowserHistory("replace", state, path);
}

/** Used only as a defensive fallback when a component cannot call navigateTo. */
export function pushNavigationEntry(
  page: string,
  params: any,
  path: string,
): NavigationHistoryState | null {
  if (typeof window === "undefined") return null;
  const existing = window.history.state;
  const state: NavigationHistoryState = {
    [NAV_HISTORY_MARKER]: NAV_HISTORY_VERSION,
    __sbNavIndex: isNavigationHistoryState(existing)
      ? existing.__sbNavIndex + 1
      : 1,
    __sbNavKey: createNavigationEntryKey(),
    page,
    params: params || null,
  };
  writeBrowserHistory("push", state, path);
  return state;
}
// ─────────────────────────────────────────────────────────────────────────────

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

// Scroll position changes on every animation frame while the user scrolls.
// Keeping it in the main navigation context forced AppRouter and every screen
// using navigation helpers to rerender continuously. Only sticky detail headers
// subscribe to this small dedicated context now.
interface NavigationScrollStore {
  getSnapshot: () => number;
  subscribe: (listener: () => void) => () => void;
  set: (value: number) => void;
}

const createNavigationScrollStore = (): NavigationScrollStore => {
  let value = 0;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => value,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set: (nextValue) => {
      if (Object.is(value, nextValue)) return;
      value = nextValue;
      listeners.forEach((listener) => listener());
    },
  };
};

const NavigationScrollContext = createContext<NavigationScrollStore | null>(
  null,
);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    if (typeof window === "undefined") return "home";
    return parseLocation(window.location.pathname, window.location.search).page;
  });
  const [currentParams, setCurrentParams] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    return parseLocation(window.location.pathname, window.location.search)
      .params;
  });
  const currentPageRef = useRef(currentPage);
  const currentParamsRef = useRef(currentParams);
  currentPageRef.current = currentPage;
  currentParamsRef.current = currentParams;
  const initialBrowserState =
    typeof window !== "undefined" &&
    isNavigationHistoryState(window.history.state)
      ? window.history.state
      : null;
  const initialEntryKeyRef = useRef<string>(
    initialBrowserState?.__sbNavKey || createNavigationEntryKey(),
  );
  const currentHistoryIndexRef = useRef<number>(
    initialBrowserState?.__sbNavIndex ?? 0,
  );
  const currentHistoryKeyRef = useRef<string>(initialEntryKeyRef.current);
  const [historyEntryKey, setHistoryEntryKey] = useState<string>(
    initialEntryKeyRef.current,
  );
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({
    "bottom-navbar": true,
    sidebar: true,
  });
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [homeCache, setHomeCache] = useState<any>(null);

  const scrollPositions = useRef<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const containerStack = useRef<HTMLElement[]>([]);
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(
    null,
  );

  // Scroll is an external store so animation-frame updates never rerender the
  // navigation provider, router, or unrelated screens. Only components calling
  // `useNavigationScroll()` subscribe to these updates.
  const scrollStoreRef = useRef<NavigationScrollStore | null>(null);
  if (!scrollStoreRef.current) {
    scrollStoreRef.current = createNavigationScrollStore();
  }
  const scrollStore = scrollStoreRef.current;
  // Stable ref to always-current navigateTo – used inside the popstate handler
  // so the effect can be registered only once (empty dep array).
  const navigateToRef = useRef<
    (page: string, params?: any, pushHistory?: boolean | "replace") => void
  >(() => {});

  // A unique key per browser-history entry keeps repeated visits to the same
  // page from overwriting one another's scroll/component restoration state.
  const navigationKey = historyEntryKey;

  const registerScrollContainer = useCallback((element: HTMLElement | null) => {
    if (element) {
      if (!containerStack.current.includes(element)) {
        containerStack.current.push(element);
      }
    } else {
      containerStack.current.pop();
    }

    const active =
      containerStack.current[containerStack.current.length - 1] || null;

    if (scrollContainerRef.current === active) return;

    scrollContainerRef.current = active;
    setScrollContainer(active);

    // Initialize scrollY immediately so consumers get correct value as soon
    // as a container is registered (avoids a brief "no-scroll" state).
    try {
      if (active) scrollStore.set(active.scrollTop);
      else if (typeof window !== "undefined")
        scrollStore.set(window.scrollY || 0);
    } catch (err) {
      /* ignore */
    }
  }, []);

  const commitNavigation = useCallback(
    (page: string, params?: any, pushHistory: boolean | "replace" = true) => {
      // A popstate handler saves the outgoing entry before calling us. For
      // normal in-app navigation, capture it here while its DOM is still live.
      if (pushHistory !== false) {
        const currentPosition = scrollContainerRef.current
          ? scrollContainerRef.current.scrollTop
          : typeof window !== "undefined"
            ? window.scrollY || 0
            : 0;
        scrollPositions.current[currentHistoryKeyRef.current] = currentPosition;
      }

      if (pushHistory && typeof window !== "undefined") {
        const path = pageToPathname(page, params) || window.location.pathname;
        const existing = window.history.state;
        const replacing = pushHistory === "replace";
        const nextIndex = replacing
          ? currentHistoryIndexRef.current
          : currentHistoryIndexRef.current + 1;
        const nextKey = replacing
          ? currentHistoryKeyRef.current
          : createNavigationEntryKey();
        const state: NavigationHistoryState = {
          ...(replacing && existing && typeof existing === "object"
            ? existing
            : {}),
          [NAV_HISTORY_MARKER]: NAV_HISTORY_VERSION,
          __sbNavIndex: nextIndex,
          __sbNavKey: nextKey,
          page,
          params: params || null,
        };
        writeBrowserHistory(replacing ? "replace" : "push", state, path);
        currentHistoryIndexRef.current = nextIndex;
        currentHistoryKeyRef.current = nextKey;
        setHistoryEntryKey(nextKey);
      }

      setPreviousPage(currentPageRef.current);
      setCurrentPage(page);
      setCurrentParams(params || null);
    },
    [],
  );

  const navigateTo = useCallback(
    (page: string, params?: any, pushHistory: boolean | "replace" = true) => {
      const isNative =
        typeof window !== "undefined" && Capacitor.isNativePlatform();

      if (
        isNative &&
        page !== currentPageRef.current &&
        !isNativeScreenReady(page)
      ) {
        // Start resolving the local chunk on the same input event, but never
        // serialize the route transition behind it. AppRouter's existing
        // dynamic() fallback remains the correctness path if this module was
        // not already warmed. The visible route therefore changes immediately.
        void prepareNativeScreen(page).catch(() => undefined);
      }

      commitNavigation(page, params, pushHistory);
    },
    [commitNavigation],
  );

  // Keep the ref pointing at the latest navigateTo so the popstate handler
  // never becomes stale without needing to be re-registered.
  navigateToRef.current = navigateTo;

  // Keep a single scroll listener attached to the currently-registered
  // scroll container (or `window` as a fallback). This guarantees that
  // `scrollY` in context always reflects the element that's actually
  // scrolling, and rebinding happens automatically when `registerScrollContainer`
  // is called.
  useEffect(() => {
    let rafId: number | null = null;
    const target: any =
      scrollContainerRef.current ||
      (typeof window !== "undefined" ? window : null);
    if (!target) return;

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        try {
          const y = scrollContainerRef.current
            ? scrollContainerRef.current.scrollTop
            : typeof window !== "undefined"
              ? window.scrollY
              : 0;
          scrollStore.set(y);
        } catch (err) {
          // ignore
        } finally {
          rafId = null;
        }
      });
    };

    // attach
    target.addEventListener("scroll", onScroll, { passive: true });

    // seed initial value
    onScroll();

    return () => {
      target.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [scrollContainer]);

  const restoreScroll = useCallback(() => {
    const savedPosition = scrollPositions.current[historyEntryKey] || 0;

    // Immediately update scrollY context state so pages waiting for it
    // (like sticky headers) don't flicker or wait for a scroll event.
    scrollStore.set(savedPosition);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = savedPosition;

      // Robust multi-stage restoration for cases where content is still reflowing
      // especially for lazy-loading pages like New Discoveries
      const frames = [1, 2, 4, 8, 16];
      frames.forEach((f) => {
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = savedPosition;
          }
        }, f * 16.6); // roughly every few frames
      });
    } else if (typeof window !== "undefined") {
      window.scrollTo(0, savedPosition);
    }
  }, [historyEntryKey]);

  const scrollToTop = useCallback(() => {
    scrollStore.set(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const goBack = useCallback(() => {
    // `history.length` includes pages visited before SedaBox, so it cannot tell
    // us whether a real previous app screen exists. Use our own entry index to
    // avoid leaving the app or landing on an unrelated/stale browser entry.
    if (typeof window !== "undefined" && currentHistoryIndexRef.current > 0) {
      window.history.back();
      return;
    }

    // A cold-started detail/protected page has no prior in-app entry. Keep the
    // user inside the SPA and replace it with Home rather than guessing.
    if (currentPageRef.current !== "home") {
      navigateTo("home", null, "replace");
    }
  }, [navigateTo]);

  // Android hardware/gesture Back must follow the exact same navigation stack
  // as browser Back. @capacitor/app intercepts the native Back dispatch; once
  // this listener is installed its default behavior is disabled, so we route
  // the press through our existing safe goBack() implementation instead. At
  // the root Home entry goBack() intentionally does nothing, which prevents a
  // Back press from closing the native app.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let disposed = false;
    let removeListener: (() => Promise<void>) | null = null;

    void Promise.all([import("@capacitor/core"), import("@capacitor/app")])
      .then(async ([{ Capacitor }, { App }]) => {
        if (disposed || !Capacitor.isNativePlatform()) return;

        const handle = await App.addListener("backButton", () => {
          goBack();
        });

        if (disposed) {
          await handle.remove();
          return;
        }
        removeListener = handle.remove;
      })
      .catch((error) => {
        // Web builds never need the native listener. A native registration
        // failure should not interfere with the browser navigation fallback.
        console.warn("Unable to register native Android Back handler", error);
      });

    return () => {
      disposed = true;
      if (removeListener) void removeListener();
    };
  }, [goBack]);

  const handleSetCurrentPage = useCallback(
    (page: string) => navigateTo(page, currentParamsRef.current),
    [navigateTo],
  );

  const handleSetCurrentParams = useCallback(
    (params: any) => navigateTo(currentPageRef.current, params),
    [navigateTo],
  );

  // Register the popstate listener exactly once. URL parsing stays unchanged;
  // the extra metadata only makes browser Back/Forward deterministic.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const parsedInitial = parseLocation(
      window.location.pathname,
      window.location.search,
    );
    const existing = window.history.state;
    const initialState: NavigationHistoryState = isNavigationHistoryState(
      existing,
    )
      ? {
          ...existing,
          page: parsedInitial.page,
          params: existing.params ?? parsedInitial.params ?? null,
        }
      : {
          ...(existing && typeof existing === "object" ? existing : {}),
          [NAV_HISTORY_MARKER]: NAV_HISTORY_VERSION,
          __sbNavIndex: 0,
          __sbNavKey: initialEntryKeyRef.current,
          page: parsedInitial.page,
          params: parsedInitial.params || null,
        };

    writeBrowserHistory(
      "replace",
      initialState,
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
    currentHistoryIndexRef.current = initialState.__sbNavIndex;
    currentHistoryKeyRef.current = initialState.__sbNavKey;
    setHistoryEntryKey(initialState.__sbNavKey);

    const handlePopState = (event: PopStateEvent) => {
      // The old page is still rendered while popstate is dispatched, so this
      // captures its exact scroll position before React swaps components.
      const outgoingPosition = scrollContainerRef.current
        ? scrollContainerRef.current.scrollTop
        : window.scrollY || 0;
      scrollPositions.current[currentHistoryKeyRef.current] = outgoingPosition;

      const parsed = parseLocation(
        window.location.pathname,
        window.location.search,
      );
      let state: NavigationHistoryState;
      if (isNavigationHistoryState(event.state)) {
        state = event.state;
      } else {
        // This can happen for an old same-origin entry created before the
        // navigation provider initialized. Normalize it without changing URL.
        state = {
          ...(event.state && typeof event.state === "object"
            ? event.state
            : {}),
          [NAV_HISTORY_MARKER]: NAV_HISTORY_VERSION,
          __sbNavIndex: Math.max(0, currentHistoryIndexRef.current - 1),
          __sbNavKey: createNavigationEntryKey(),
          page: parsed.page,
          params: parsed.params || null,
        };
        writeBrowserHistory(
          "replace",
          state,
          `${window.location.pathname}${window.location.search}${window.location.hash}`,
        );
      }

      currentHistoryIndexRef.current = state.__sbNavIndex;
      currentHistoryKeyRef.current = state.__sbNavKey;
      setHistoryEntryKey(state.__sbNavKey);
      navigateToRef.current(
        state.page || parsed.page,
        state.params ?? parsed.params,
        false,
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  const setComponentVisibility = useCallback(
    (component: string, visible: boolean) => {
      setVisibilityMap((prev) =>
        prev[component] === visible ? prev : { ...prev, [component]: visible },
      );
    },
    [],
  );

  const navigationValue = useMemo<NavigationContextType>(
    () => ({
      currentPage,
      currentParams,
      previousPage,
      setCurrentPage: handleSetCurrentPage,
      setCurrentParams: handleSetCurrentParams,
      navigateTo,
      goBack,
      visibilityMap,
      setComponentVisibility,
      registerScrollContainer,
      restoreScroll,
      scrollToTop,
      navigationKey,
      homeCache,
      setHomeCache,
      isResolving,
      setIsResolving,
      scrollContainer,
    }),
    [
      currentPage,
      currentParams,
      previousPage,
      handleSetCurrentPage,
      handleSetCurrentParams,
      navigateTo,
      goBack,
      visibilityMap,
      setComponentVisibility,
      registerScrollContainer,
      restoreScroll,
      scrollToTop,
      navigationKey,
      homeCache,
      isResolving,
      scrollContainer,
    ],
  );

  return (
    <NavigationContext.Provider value={navigationValue}>
      <NavigationScrollContext.Provider value={scrollStore}>
        {children}
      </NavigationScrollContext.Provider>
    </NavigationContext.Provider>
  );
};

// Navigation helpers and route state. Scroll updates live in a separate
// subscription so ordinary screens do not rerender on every scroll frame.
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

export const useNavigationScroll = () => {
  const store = useContext(NavigationScrollContext);
  if (!store) {
    throw new Error(
      "useNavigationScroll must be used within a NavigationProvider",
    );
  }
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => 0);
};

export const useNavComponent = (componentName: string) => {
  const { visibilityMap } = useNavigation();
  return {
    visible: visibilityMap[componentName] ?? true,
  };
};
