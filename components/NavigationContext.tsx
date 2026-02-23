import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { decodeShare, slugify } from "../utils/share";

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
  /**
   * Current Y scroll position of the registered scroll container (or window
   * when no container is registered). This is kept centrally so all pages
   * read the same value and subscription timing issues are avoided.
   */
  scrollY: number;
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
];

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

  // artist: /artists/{id}-{slug} (new) or /artist/{id} (legacy)
  if ((first === "artists" || first === "artist") && parts[1]) {
    return {
      page: "artist-detail",
      params: { id: extractIdFromSegment(parts[1]) },
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

  // user details: /user/{id}-{unique_id}
  if (first === "user" && parts[1]) {
    return {
      page: "user-detail",
      params: { id: extractIdFromSegment(parts[1]) },
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

  // chart detail: /chart/:type/:title?
  if (first === "chart" && parts[1]) {
    return {
      page: "chart-detail",
      params: {
        type: parts[1],
        title: parts[2] ? decodeURIComponent(parts[2]) : undefined,
      },
    };
  }

  // Unrecognised path → home
  return { page: "home", params: null };
}

function pageToPathname(page: string, params?: any): string | null {
  // simple pages with direct path
  if (ROUTED_PAGES.includes(page)) {
    // ensure we map chart-detail separately
    if (page === "chart-detail") return "/chart";
    return `/${page}`;
  }

  // auth pages (aliases if ever used as page keys)
  if (page === "login") return "/login";
  if (page === "register") return "/register";
  if (page === "verify") return "/verify";
  if (page === "forgot-password") return "/forgot-password";

  if (page === "artist-detail") {
    if (params?.id) {
      const namePart = params.name
        ? `-${slugify(params.name)}`
        : params.slug
          ? `-${slugify(params.slug)}`
          : "";
      return `/artists/${params.id}${namePart}`;
    }
  }

  if (page === "song-detail") {
    if (params?.id) {
      const titlePart = params.title
        ? `-${slugify(params.title)}`
        : params.songSlug
          ? `-${slugify(params.songSlug)}`
          : "";
      return `/track/${params.id}${titlePart}`;
    }
  }

  if (page === "playlist-detail") {
    if (params?.id) {
      const titlePart = params.title
        ? `-${slugify(params.title)}`
        : params.slug
          ? `-${slugify(params.slug)}`
          : "";
      return `/playlist/${params.id}${titlePart}`;
    }
    // slug-only (legacy)
    if (params?.slug) return `/playlist/${encodeURIComponent(params.slug)}`;
  }

  if (page === "user-playlist-detail") {
    if (params?.id) return `/user-playlist/${params.id}`;
  }

  if (page === "album-detail") {
    if (params?.id) {
      const titlePart = params.title
        ? `-${slugify(params.title)}`
        : params.slug
          ? `-${slugify(params.slug)}`
          : "";
      return `/album/${params.id}${titlePart}`;
    }
    if (params?.slug) return `/album/${encodeURIComponent(params.slug)}`;
  }

  if (page === "user-detail") {
    if (params?.id) {
      const uniquePart = params.uniqueId ? `-${params.uniqueId}` : "";
      return `/user/${params.id}${uniquePart}`;
    }
  }

  if (page === "followers-following") {
    if (params?.tab) return `/followers-following/${params.tab}`;
    return "/followers-following";
  }

  if (page === "liked-songs") return "/liked/songs";
  if (page === "liked-albums") return "/liked/albums";
  if (page === "liked-playlists") return "/liked/playlists";

  if (page === "chart-detail") {
    if (params?.type && params?.title)
      return `/chart/${params.type}/${encodeURIComponent(params.title)}`;
    if (params?.type) return `/chart/${params.type}`;
    return "/chart";
  }

  return null; // other pages: don't change the URL
}
// ─────────────────────────────────────────────────────────────────────────────

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    if (typeof window === "undefined") return "home";
    return parsePathname(window.location.pathname).page;
  });
  const [currentParams, setCurrentParams] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    return parsePathname(window.location.pathname).params;
  });
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [previousParams, setPreviousParams] = useState<any>(null);
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

  // Centralized scrollY so all pages/components can read the same value and
  // won't miss updates due to timing/order-of-mount issues.
  const [scrollY, setScrollY] = useState<number>(0);
  // Stable ref to always-current navigateTo – used inside the popstate handler
  // so the effect can be registered only once (empty dep array).
  const navigateToRef = useRef<
    (page: string, params?: any, pushHistory?: boolean) => void
  >(() => {});

  const getScrollKey = useCallback((page: string, params: any) => {
    if (!params) return page;

    // Prioritize unique identifiers to avoid JSON.stringify issues (circular refs, performance)
    // and ensure distinct keys for different items (e.g. albums, playlists)
    if (params.slug) return `${page}-slug-${params.slug}`;
    if (params.id) return `${page}-id-${params.id}`;
    if (params.query) return `${page}-query-${params.query}`;

    try {
      return `${page}-${JSON.stringify(params)}`;
    } catch (e) {
      // Fallback to page name if params cannot be serialized
      // This might cause scroll position collisions for complex params, but prevents crashes
      return page;
    }
  }, []);

  const navigationKey = useMemo(
    () => getScrollKey(currentPage, currentParams),
    [currentPage, currentParams, getScrollKey],
  );

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
      if (active) setScrollY(active.scrollTop);
      else if (typeof window !== "undefined") setScrollY(window.scrollY || 0);
    } catch (err) {
      /* ignore */
    }
  }, []);

  const navigateTo = useCallback(
    (page: string, params?: any, pushHistory: boolean | "replace" = true) => {
      if (scrollContainerRef.current) {
        const key = getScrollKey(currentPage, currentParams);
        scrollPositions.current[key] = scrollContainerRef.current.scrollTop;
      }

      if (pushHistory && typeof window !== "undefined") {
        const path = pageToPathname(page, params);
        if (pushHistory === "replace") {
          window.history.replaceState(
            { page, params: params || null },
            "",
            path || window.location.pathname,
          );
        } else {
          window.history.pushState(
            { page, params: params || null },
            "",
            path || window.location.pathname,
          );
        }
      }

      setPreviousPage(currentPage);
      setPreviousParams(currentParams || null);
      setCurrentPage(page);
      setCurrentParams(params || null);
    },
    [currentPage, currentParams, getScrollKey],
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
          setScrollY(y);
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
    const key = getScrollKey(currentPage, currentParams);
    const savedPosition = scrollPositions.current[key] || 0;

    // Immediately update scrollY context state so pages waiting for it
    // (like sticky headers) don't flicker or wait for a scroll event.
    setScrollY(savedPosition);

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
  }, [currentPage, currentParams, getScrollKey]);

  const scrollToTop = useCallback(() => {
    setScrollY(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const goBack = useCallback(() => {
    if (previousPage) {
      // Prefer internal navigation using stored params so we reliably
      // restore pages like `user-detail` with their identifiers.
      navigateTo(previousPage, previousParams, false);
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    }
  }, [previousPage, previousParams, navigateTo]);

  const handleSetCurrentPage = useCallback(
    (page: string) => navigateTo(page, currentParams),
    [navigateTo, currentParams],
  );

  const handleSetCurrentParams = useCallback(
    (params: any) => navigateTo(currentPage, params),
    [navigateTo, currentPage],
  );

  // Register the popstate listener exactly once (empty dep array).
  // The navigateToRef keeps it up-to-date on every render without re-running this effect.
  useEffect(() => {
    // Ensure the initial history entry contains structured state so that
    // going "back" to the entry works correctly.
    if (typeof window !== "undefined") {
      const { page, params } = parsePathname(window.location.pathname);
      const path = pageToPathname(page, params) || window.location.pathname;
      window.history.replaceState({ page, params: params || null }, "", path);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        navigateToRef.current(event.state.page, event.state.params, false);
      } else {
        navigateToRef.current("home", null, false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []); // ← empty array: never re-runs, no infinite loop

  const setComponentVisibility = (component: string, visible: boolean) => {
    setVisibilityMap((prev) => ({ ...prev, [component]: visible }));
  };

  return (
    <NavigationContext.Provider
      value={{
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
        scrollY,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

// useNavigation: access navigation helpers + the centralized `scrollY`.
// - Prefer `scrollY` from this context instead of local scroll listeners so
//   components always read the position of the registered app scroll
//   container (or `window` as fallback). To change which element is watched
//   call `registerScrollContainer(element)` from your layout/component.
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

export const useNavComponent = (componentName: string) => {
  const { visibilityMap } = useNavigation();
  return {
    visible: visibilityMap[componentName] ?? true,
  };
};
