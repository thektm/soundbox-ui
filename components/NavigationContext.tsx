import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from "react";

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
  homeCache: any;
  setHomeCache: (data: any) => void;
  isResolving: boolean;
  setIsResolving: (v: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({
    "bottom-navbar": true,
    sidebar: true,
  });
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [homeCache, setHomeCache] = useState<any>(null);

  const scrollPositions = useRef<Record<string, number>>({});
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const getScrollKey = (page: string, params: any) => {
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
  };

  const registerScrollContainer = useCallback((element: HTMLElement | null) => {
    scrollContainerRef.current = element;
  }, []);

  const navigateTo = (page: string, params?: any) => {
    if (scrollContainerRef.current) {
      const key = getScrollKey(currentPage, currentParams);
      scrollPositions.current[key] = scrollContainerRef.current.scrollTop;
    }
    setPreviousPage(currentPage);
    setCurrentPage(page);
    setCurrentParams(params || null);
  };

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
  }, [currentPage, currentParams]);

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  const goBack = useCallback(() => {
    if (previousPage) {
      navigateTo(previousPage);
    }
  }, [previousPage, navigateTo]);

  const setComponentVisibility = (component: string, visible: boolean) => {
    setVisibilityMap((prev) => ({ ...prev, [component]: visible }));
  };

  return (
    <NavigationContext.Provider
      value={{
        currentPage,
        currentParams,
        previousPage,
        setCurrentPage,
        setCurrentParams,
        navigateTo,
        goBack,
        visibilityMap,
        setComponentVisibility,
        registerScrollContainer,
        restoreScroll,
        scrollToTop,
        homeCache,
        setHomeCache,
        isResolving,
        setIsResolving,
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
