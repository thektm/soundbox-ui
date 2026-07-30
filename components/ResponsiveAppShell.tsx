"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useResponsiveLayout } from "./ResponsiveLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { useI18n } from "./I18nContext";
import { useSplashVisibility } from "./SplashVisibilityContext";
import { usePlayerLayoutState } from "./PlayerContext";


const BottomNavbar = dynamic(() => import("./BottomNavbar"), { ssr: false });
const Sidebar = dynamic(() => import("./Sidebar"), { ssr: false });
const GuestBottomNav = dynamic(
  () => import("./GuestNavigation").then((module) => module.GuestBottomNav),
  { ssr: false },
);
const GuestSidebar = dynamic(
  () => import("./GuestNavigation").then((module) => module.GuestSidebar),
  { ssr: false },
);
const GuestTopActions = dynamic(
  () => import("./GuestNavigation").then((module) => module.GuestTopActions),
  { ssr: false },
);

interface Props {
  children: React.ReactNode;
}

const ResponsiveAppShell: React.FC<Props> = ({ children }) => {
  const { isMobile } = useResponsiveLayout();
  const { direction } = useI18n();
  const { isLoggedIn } = useAuth();
  const { splashVisible } = useSplashVisibility();
  const { hasCollapsedPlayer } = usePlayerLayoutState();
  const { registerScrollContainer, restoreScroll, navigationKey } =
    useNavigation();

  // Screens already reserve their normal navbar gutter. Add only the
  // collapsed player's own footprint, with a small breathing gap, so the last
  // item remains scrollable above the player without a large empty tail.
  const playerContentInset = hasCollapsedPlayer
    ? isMobile
      ? "calc(88px + env(safe-area-inset-bottom, 0px))"
      : "106px"
    : "0px";

  // Restore scroll when page or params change
  useEffect(() => {
    restoreScroll();
  }, [navigationKey, restoreScroll]);

  // Fix mobile viewport height for dynamic browser UI (address bar)
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Set on mount
    setVH();

    // Update on resize and orientation change
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  // Mobile: render a simplified shell to avoid desktop-only layout transforms
  if (isMobile) {
    return (
      <>
        <div
          dir={direction}
          className="w-full overflow-y-auto overflow-x-hidden"
          ref={registerScrollContainer}
          style={{
            minHeight: "calc(var(--vh, 1vh) * 100)",
            maxHeight: "calc(var(--vh, 1vh) * 100)",
            position: "relative",
            overscrollBehavior: "contain",
          }}
        >
          <div
            className="min-h-full transition-[padding-bottom] duration-300 ease-out"
            style={{ paddingBottom: playerContentInset }}
            data-player-content-inset={hasCollapsedPlayer ? "active" : "idle"}
          >
            {children}
          </div>
        </div>

        {/* Bottom Navbar - only visible on mobile via its own classes */}
        {!splashVisible && (isLoggedIn ? <BottomNavbar /> : <GuestBottomNav />)}
        {!splashVisible && !isLoggedIn && <GuestTopActions />}

        <div id="music-player-root" />
      </>
    );
  }

  // Tablet / Desktop: use the responsive layout shell (sidebar + rounded content)
  return (
    <>
      <div dir={direction} className="sb-app-shell flex min-h-screen">
        {/* Sidebar - Hidden on mobile, visible on tablet/desktop when logged in */}
        {isLoggedIn ? <Sidebar /> : <GuestSidebar />}

        {/* Main Content Area */}
        <div
          className={`sb-content-adjacent-sidebar flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-hidden ${
            "md:m-2 md:mr-0 md:bg-linear-to-b md:from-zinc-900 md:via-zinc-900/95 md:to-black md:rounded-lg"
          }`}
          style={{ contain: "layout style", overscrollBehavior: "contain" }}
        >
          <div
            className="flex-1 md:overflow-y-auto"
            ref={registerScrollContainer}
            style={{
              overscrollBehavior: "contain",
              }}
          >
            <div
              className="min-h-full transition-[padding-bottom] duration-300 ease-out"
              style={{ paddingBottom: playerContentInset }}
              data-player-content-inset={hasCollapsedPlayer ? "active" : "idle"}
            >
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navbar */}
      {!splashVisible && (isLoggedIn ? <BottomNavbar /> : <GuestBottomNav />)}
      {!splashVisible && !isLoggedIn && <GuestTopActions />}

      {/* Music Player */}
      {/* <MusicPlayer /> - not implemented */}

      {/* Portal root for modals */}
      <div id="music-player-root" />
    </>
  );
};

export default ResponsiveAppShell;
