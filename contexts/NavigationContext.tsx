import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type VisibilityMap = Record<string, string[]>;

interface NavigationContextType {
  currentPage: string;
  setPage: (page: string) => void;
  register: (id: string) => void;
  unregister: (id: string) => void;
  isVisible: (id: string) => boolean;
  visibilityMap: VisibilityMap;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider: React.FC<{
  initialVisibilityMap?: VisibilityMap;
  initialPage?: string;
  children: React.ReactNode;
}> = ({ initialVisibilityMap = {}, initialPage = "/", children }) => {
  const [currentPage, setCurrentPage] = useState<string>(initialPage);
  const [registered, setRegistered] = useState<Record<string, boolean>>({});

  const register = useCallback((id: string) => {
    setRegistered((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }, []);

  const unregister = useCallback((id: string) => {
    setRegistered((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev } as Record<string, boolean>;
      delete copy[id];
      return copy;
    });
  }, []);

  // Compute visibility for registered components based on the current page and the visibility map
  const visibilityForRegistered = useMemo(() => {
    const allowed = new Set(initialVisibilityMap[currentPage] ?? []);
    const result: Record<string, boolean> = {};
    Object.keys(registered).forEach((id) => {
      result[id] = allowed.has(id);
    });
    return result;
  }, [initialVisibilityMap, currentPage, registered]);

  const isVisible = useCallback(
    (id: string) => !!visibilityForRegistered[id],
    [visibilityForRegistered]
  );

  const value = useMemo(
    () => ({
      currentPage,
      setPage: setCurrentPage,
      register,
      unregister,
      isVisible,
      visibilityMap: initialVisibilityMap,
    }),
    [currentPage, register, unregister, isVisible, initialVisibilityMap]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx)
    throw new Error("useNavigation must be used within a NavigationProvider");
  return ctx;
}

// Hook for components that should be mounted once and show/hide depending on the current page.
export function useNavComponent(id: string) {
  const ctx = useNavigation();
  useEffect(() => {
    ctx.register(id);
    return () => ctx.unregister(id);
  }, [ctx, id]);

  const visible = ctx.isVisible(id);
  return { visible };
}

export default NavigationContext;
