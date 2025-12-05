import "@/styles/globals.css";
import type { AppProps } from "next/app";
import {
  NavigationProvider,
  useNavigation,
} from "../contexts/NavigationContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { PlayerProvider } from "../contexts/PlayerContext";
import BottomNavbar from "../components/BottomNavbar";
import MusicPlayer from "../components/MusicPlayer";
import { useRouter } from "next/router";
import { useEffect } from "react";

function RouterSync() {
  const router = useRouter();
  const nav = useNavigation();
  useEffect(() => {
    nav.setPage(router.pathname);
  }, [router.pathname, nav]);
  return null;
}

function AuthAwareNavbar() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <BottomNavbar />;
}

function AuthAwarePlayer() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <MusicPlayer />;
}

export default function App({ Component, pageProps }: AppProps) {
  const visibilityMap = {
    "/": ["player", "sidebar"],
    "/about": ["sidebar"],
  } as Record<string, string[]>;

  return (
    <AuthProvider>
      <PlayerProvider>
        <NavigationProvider initialVisibilityMap={visibilityMap}>
          <RouterSync />
          <Component {...pageProps} />
          <AuthAwarePlayer />
          <AuthAwareNavbar />
        </NavigationProvider>
      </PlayerProvider>
    </AuthProvider>
  );
}
