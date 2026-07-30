import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import MusicPlayer from "./MusicPlayer";
import { NavigationProvider } from "./NavigationContext";
import { AuthProvider, useAuth } from "./AuthContext";
import { NotificationProvider } from "./NotificationContext";
import { DiscoveryProvider } from "./DiscoveryContext";
import { ResponsiveLayoutProvider } from "./ResponsiveLayout";
import { PlayerProvider } from "./PlayerContext";
import { GuestAccessProvider } from "./GuestAccessContext";
import NetworkStatusMonitor from "./NetworkStatusMonitor";
import SplashScreen from "./SplashScreen";
import { SplashVisibilityProvider } from "./SplashVisibilityContext";
import { clientTrace, installGlobalClientDiagnostics } from "../lib/clientDebug";

// The player is imported eagerly and mounted from application startup. AppContainer
// itself is client-only, so this prepares the complete player behind the splash
// without rendering a visible player until PlayerContext marks it visible.
const InitialModal = dynamic(
  () => import("./InitialModal").then((m) => ({ default: m.InitialModal })),
  { ssr: false },
);


const DeferredInitialModal: React.FC = () => {
  const { accessToken, isInitializing, needsInitialCheck } = useAuth();
  // The onboarding chunk (Framer Motion + artwork + all three steps) was being
  // downloaded for every returning user even when it could never render.
  if (isInitializing || !accessToken || !needsInitialCheck) return null;
  return <InitialModal />;
};

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
                    <DeferredInitialModal />
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
