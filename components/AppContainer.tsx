import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { NavigationProvider } from "./NavigationContext";
import { AuthProvider } from "./AuthContext";
import { NotificationProvider } from "./NotificationContext";
import { DiscoveryProvider } from "./DiscoveryContext";
import { ResponsiveLayoutProvider } from "./ResponsiveLayout";
import { PlayerProvider } from "./PlayerContext";
import { GuestAccessProvider } from "./GuestAccessContext";
import NetworkStatusMonitor from "./NetworkStatusMonitor";
import SplashScreen from "./SplashScreen";
import { SplashVisibilityProvider } from "./SplashVisibilityContext";
import { clientTrace, installGlobalClientDiagnostics } from "../lib/clientDebug";

// Heavy components that are not needed for initial paint — lazy-load them.
// MusicPlayer (3 200+ lines) only matters once a track is played.
// The splash is imported eagerly so its asset preloading and startup orchestration begin immediately.
// InitialModal remains lazy because it is not required for the first paint.
const MusicPlayer = dynamic(() => import("./MusicPlayer"), { ssr: false });
const InitialModal = dynamic(
  () => import("./InitialModal").then((m) => ({ default: m.InitialModal })),
  { ssr: false },
);

interface AppContainerProps {
  children: React.ReactNode;
}

const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  useEffect(() => {
    const cleanup = installGlobalClientDiagnostics();
    clientTrace("APP", "container:mounted");
    return () => {
      clientTrace("APP", "container:unmounted", undefined, "warn");
      cleanup();
    };
  }, []);

  return (
    <SplashVisibilityProvider>
      <NavigationProvider>
        <AuthProvider>
          <NotificationProvider>
            <GuestAccessProvider>
              <DiscoveryProvider>
                <PlayerProvider>
                  <ResponsiveLayoutProvider>
                    {children}
                    <NetworkStatusMonitor />
                    <MusicPlayer />
                    <SplashScreen />
                    <InitialModal />
                  </ResponsiveLayoutProvider>
                </PlayerProvider>
              </DiscoveryProvider>
            </GuestAccessProvider>
          </NotificationProvider>
        </AuthProvider>
      </NavigationProvider>
    </SplashVisibilityProvider>
  );
};

export default AppContainer;
