import React from "react";
import { NavigationProvider } from "./components/NavigationContext";
import { AuthProvider } from "./components/AuthContext";
import { ResponsiveLayoutProvider } from "./components/ResponsiveLayout";
import { PlayerProvider } from "./components/PlayerContext";
import MusicPlayer from "./components/MusicPlayer";

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
        </PlayerProvider>
      </AuthProvider>
    </NavigationProvider>
  );
};

export default AppContainer;
