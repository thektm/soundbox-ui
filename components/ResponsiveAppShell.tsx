"use client";

import React, { useEffect } from "react";
import BottomNavbar from "./BottomNavbar";
import Sidebar from "./Sidebar";
import { useResponsiveLayout } from "./ResponsiveLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";

interface Props {
  children: React.ReactNode;
}

const ResponsiveAppShell: React.FC<Props> = ({ children }) => {
  const { isMobile } = useResponsiveLayout();
  const { isLoggedIn } = useAuth();
  const { registerScrollContainer, restoreScroll, navigationKey } =
    useNavigation();

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
          className="w-full overflow-y-auto overflow-x-hidden"
          ref={registerScrollContainer}
          style={{
            minHeight: "calc(var(--vh, 1vh) * 100)",
            maxHeight: "calc(var(--vh, 1vh) * 100)",
            position: "relative",
            overscrollBehavior: "contain",
            willChange: "scroll-position",
          }}
        >
          {children}
        </div>

        {/* Bottom Navbar - only visible on mobile via its own classes */}
        {isLoggedIn && <BottomNavbar />}

        <div id="music-player-root" />
      </>
    );
  }

  // Tablet / Desktop: use the responsive layout shell (sidebar + rounded content)
  return (
    <>
      <div dir="rtl" className="flex min-h-screen">
        {/* Sidebar - Hidden on mobile, visible on tablet/desktop when logged in */}
        {isLoggedIn && <Sidebar />}

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-hidden ${
            isLoggedIn
              ? "md:m-2 md:mr-0 md:bg-linear-to-b md:from-zinc-900 md:via-zinc-900/95 md:to-black md:rounded-lg"
              : ""
          }`}
          style={{ contain: "layout style", overscrollBehavior: "contain" }}
        >
          <div
            className="flex-1 md:overflow-y-auto"
            ref={registerScrollContainer}
            style={{
              overscrollBehavior: "contain",
              willChange: "scroll-position",
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Navbar */}
      {isLoggedIn && <BottomNavbar />}

      {/* Music Player */}
      {/* <MusicPlayer /> - not implemented */}

      {/* Portal root for modals */}
      <div id="music-player-root" />
    </>
  );
};

export default ResponsiveAppShell;
