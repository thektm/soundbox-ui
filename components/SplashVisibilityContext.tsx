import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import {
  getSplashRuntimeSnapshot,
  subscribeSplashRuntime,
} from "../lib/splashRuntime";

interface SplashVisibilityContextValue {
  splashVisible: boolean;
}

const SplashVisibilityContext = createContext<SplashVisibilityContextValue>({
  // The splash is visible during SSR and the first client render. The provider
  // then follows the browser-lifetime splash runtime as its single source of
  // truth, preventing navigation from being hidden by stale duplicated state.
  splashVisible: true,
});

const getSplashVisibilitySnapshot = (): boolean =>
  getSplashRuntimeSnapshot().visible;

const getSplashVisibilityServerSnapshot = (): boolean => true;

export const SplashVisibilityProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const splashVisible = useSyncExternalStore(
    subscribeSplashRuntime,
    getSplashVisibilitySnapshot,
    getSplashVisibilityServerSnapshot,
  );

  const value = useMemo(() => ({ splashVisible }), [splashVisible]);

  return (
    <SplashVisibilityContext.Provider value={value}>
      {children}
    </SplashVisibilityContext.Provider>
  );
};

export const useSplashVisibility = () => useContext(SplashVisibilityContext);
