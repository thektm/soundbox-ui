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

  // UNIFIED RETURN: Merge mobile and desktop shell logic into a single DOM tree.
  // This uses CSS utility classes (like hidden md:block) instead of JS state swaps
  // to avoid Cumulative Layout Shift (CLS) when calculating device breakpoints.
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-emerald-500 focus:text-white focus:rounded-full focus:font-bold focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/50 transition-all"
      >
        پرش به محتوای اصلی
      </a>

      <div dir="rtl" className="flex min-h-screen">
        {/* Sidebar - internal CSS 'hidden md:flex' handles its own visibility */}
        {isLoggedIn && <Sidebar />}

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col min-h-screen md:max-h-screen md:overflow-hidden ${
            isLoggedIn
              ? "md:m-2 md:mr-0 md:bg-linear-to-b md:from-zinc-900 md:via-zinc-900/95 md:to-black md:rounded-lg"
              : ""
          }`}
          style={{
            contain: "layout style",
            overscrollBehavior: "contain",
            position: "relative",
          }}
        >
          <main
            id="main-content"
            className="flex-1 overflow-y-auto overflow-x-hidden md:min-h-0 md:max-h-none scroll-smooth min-h-[calc(var(--vh,1vh)*100)] max-h-[calc(var(--vh,1vh)*100)]"
            ref={registerScrollContainer}
            style={{
              overscrollBehavior: "contain",
            }}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Bottom Navbar - handles its own visibility via internal checks and CSS */}
      {isLoggedIn && <BottomNavbar />}

      {/* Portal root for modals and overlays */}
      <div id="music-player-root" />
    </>
  );
};

export default ResponsiveAppShell;
