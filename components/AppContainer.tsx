import React from "react";
import { NavigationProvider } from "./NavigationContext";
import { AuthProvider } from "./AuthContext";
import { ResponsiveLayoutProvider } from "./ResponsiveLayout";
import { PlayerProvider } from "./PlayerContext";
import MusicPlayer from "./MusicPlayer";
import SplashScreen from "./SplashScreen";

interface AppContainerProps {
  children: React.ReactNode;
}

const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <NavigationProvider>
      <AuthProvider>
        <PlayerProvider>
          <ResponsiveLayoutProvider>{children}</ResponsiveLayoutProvider>
          <MusicPlayer />
          <SplashScreen />
        </PlayerProvider>
      </AuthProvider>
    </NavigationProvider>
  );
};

export default AppContainer;
