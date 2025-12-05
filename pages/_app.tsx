import "@/styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import {
  NavigationProvider,
  useNavigation,
} from "../contexts/NavigationContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { PlayerProvider } from "../contexts/PlayerContext";
import BottomNavbar from "../components/BottomNavbar";
import { useRouter } from "next/router";
import { useEffect } from "react";

// Lazy load heavy components
const MusicPlayer = dynamic(() => import("../components/MusicPlayer"), {
  ssr: false,
});

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
