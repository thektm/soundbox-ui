import React from "react";
import dynamic from "next/dynamic";
import { NavigationProvider } from "./NavigationContext";
import { AuthProvider } from "./AuthContext";
import { DiscoveryProvider } from "./DiscoveryContext";
import { ResponsiveLayoutProvider } from "./ResponsiveLayout";
import { PlayerProvider } from "./PlayerContext";
import { GuestAccessProvider } from "./GuestAccessContext";

// Heavy components that are not needed for initial paint — lazy-load them.
// MusicPlayer (3 200+ lines) only matters once a track is played.
// SplashScreen is a simple overlay; InitialModal only shows for new users.
const MusicPlayer = dynamic(() => import("./MusicPlayer"), { ssr: false });
const SplashScreen = dynamic(() => import("./SplashScreen"), { ssr: false });
const InitialModal = dynamic(
  () => import("./InitialModal").then((m) => ({ default: m.InitialModal })),
  { ssr: false },
);

interface AppContainerProps {
  children: React.ReactNode;
}

const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <NavigationProvider>
      <AuthProvider>
        <GuestAccessProvider>
          <DiscoveryProvider>
            <PlayerProvider>
              <ResponsiveLayoutProvider>
                {children}
                <MusicPlayer />
                <SplashScreen />
                <InitialModal />
              </ResponsiveLayoutProvider>
            </PlayerProvider>
          </DiscoveryProvider>
        </GuestAccessProvider>
      </AuthProvider>
    </NavigationProvider>
  );
};

export default AppContainer;
