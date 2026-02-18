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
import { decodeShare, encodeShare } from "../utils/share";

interface NavigationContextType {
  currentPage: string;
  currentParams: any;
  previousPage: string | null;
  setCurrentPage: (page: string) => void;
  setCurrentParams: (params: any) => void;
  navigateTo: (page: string, params?: any) => void;
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
const ROUTED_PAGES = ["home", "search", "library", "premium", "profile"];

function parsePathname(pathname: string): { page: string; params: any } {
  const parts = pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
  const first = parts[0] || "home";

  if (ROUTED_PAGES.includes(first)) return { page: first, params: null };

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

  if (first === "artist" && parts[1]) {
    return { page: "artist-detail", params: { id: parts[1] } };
  }

  if (first === "track" && parts[1]) {
    return { page: "song-detail", params: { id: parts[1] } };
  }

  if (parts.length === 2) {
    return {
      page: "song-detail",
      params: {
        artistSlug: decodeURIComponent(parts[0]),
        songSlug: decodeURIComponent(parts[1]),
      },
    };
  }

  if (first) {
    return {
      page: "artist-detail",
      params: { slug: decodeURIComponent(first) },
    };
  }

  return { page: "home", params: null };
}

function pageToPathname(page: string, params?: any): string | null {
  if (ROUTED_PAGES.includes(page)) return `/${page}`;
  if (page === "artist-detail") {
    if (params?.slug) return `/${encodeURIComponent(params.slug)}`;
    if (params?.id) return `/artist/${params.id}`;
  }
  if (page === "song-detail") {
    if (params?.artistSlug && params?.songSlug) {
      return `/${encodeURIComponent(params.artistSlug)}/${encodeURIComponent(
        params.songSlug,
      )}`;
    }
    if (params?.id) return `/track/${params.id}`;
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
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({
    "bottom-navbar": true,
    sidebar: true,
  });
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [homeCache, setHomeCache] = useState<any>(null);

  const scrollPositions = useRef<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLElement | null>(null);
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
    scrollContainerRef.current = element;
  }, []);

  const navigateTo = useCallback(
    (page: string, params?: any, pushHistory = true) => {
      if (scrollContainerRef.current) {
        const key = getScrollKey(currentPage, currentParams);
        scrollPositions.current[key] = scrollContainerRef.current.scrollTop;
      }

      if (pushHistory && typeof window !== "undefined") {
        const path = pageToPathname(page, params);
        window.history.pushState(
          { page, params: params || null },
          "",
          path || window.location.pathname,
        );
      }

      setPreviousPage(currentPage);
      setCurrentPage(page);
      setCurrentParams(params || null);
    },
    [currentPage, currentParams, getScrollKey],
  );

  // Keep the ref pointing at the latest navigateTo so the popstate handler
  // never becomes stale without needing to be re-registered.
  navigateToRef.current = navigateTo;

  const restoreScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const key = getScrollKey(currentPage, currentParams);
      const savedPosition = scrollPositions.current[key] || 0;
      scrollContainerRef.current.scrollTop = savedPosition;
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedPosition;
        }
      });
    }
  }, [currentPage, currentParams, getScrollKey]);

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const goBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else if (previousPage) {
      navigateTo(previousPage, null, false);
    }
  }, [previousPage, navigateTo]);

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
        scrollContainer: scrollContainerRef.current,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

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
