import React from "react";
import { NavigationProvider } from "./NavigationContext";
import { AuthProvider } from "./AuthContext";
import { DiscoveryProvider } from "./DiscoveryContext";
import { ResponsiveLayoutProvider } from "./ResponsiveLayout";
import { PlayerProvider } from "./PlayerContext";
import MusicPlayer from "./MusicPlayer";
import SplashScreen from "./SplashScreen";
import { InitialModal } from "./InitialModal";

interface AppContainerProps {
  children: React.ReactNode;
}

const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <NavigationProvider>
      <AuthProvider>
        <DiscoveryProvider>
          <PlayerProvider>
            <ResponsiveLayoutProvider>{children}</ResponsiveLayoutProvider>
            <MusicPlayer />
            <SplashScreen />
            <InitialModal />
          </PlayerProvider>
        </DiscoveryProvider>
      </AuthProvider>
    </NavigationProvider>
  );
};

export default AppContainer;
