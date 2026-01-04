"use client";

import React, { useEffect, useState } from "react";
import { useNavigation, useNavComponent } from "./NavigationContext";

// Custom hook for media queries
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

// Preload important library icons so toggling doesn't trigger fetch latency
if (typeof window !== "undefined") {
  ["/library.svg", "/library-selected.svg", "/premium.svg", "/premium-selected.svg"].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

// --- Clean, Professional Icons ---
const Icons = {
  Home: ({ active }: { active: boolean }) => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 2}
    >
      {active ? (
        <path d="M12.71 2.29a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42A1 1 0 003 13h1v7a2 2 0 002 2h12a2 2 0 002-2v-7h1a1 1 0 00.71-1.71l-9-9zM9 20v-5a1 1 0 011-1h4a1 1 0 011 1v5H9z" />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      )}
    </svg>
  ),
  Search: ({ active }: { active: boolean }) => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  ),
  Library: ({ active }: { active: boolean }) => (
    <div className="relative w-6 h-6">
      <img
        src="/library.svg"
        alt="library"
        className={`absolute inset-0 w-6 h-6 transition-opacity duration-150 ${
          active ? "opacity-0" : "opacity-70"
        }`}
        style={{ filter: "invert(1)" }}
      />
      <img
        src="/library-selected.svg"
        alt="library-selected"
        className={`absolute inset-0 w-6 h-6 transition-opacity duration-150 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ filter: "invert(1)" }}
      />
    </div>
  ),
  Premium: ({ active }: { active: boolean }) => (
    <div className="relative w-6 h-6">
      <img
        src="/premium.svg"
        alt="premium"
        className={`absolute inset-0 w-6 h-6 transition-opacity duration-150 ${active ? "opacity-0" : "opacity-100"}`}
        style={{ filter: "invert(1)" }}
      />
      <img
        src="/premium-selected.svg"
        alt="premium-selected"
        className={`absolute inset-0 w-6 h-6 transition-opacity duration-150 ${active ? "opacity-100" : "opacity-0"}`}
        style={{ filter: "invert(1)" }}
      />
    </div>
  ),
  Profile: ({ active }: { active: boolean }) => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke={active ? "none" : "currentColor"}
      strokeWidth={2}
    >
      {active ? (
        <path
          fillRule="evenodd"
          d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          clipRule="evenodd"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
        />
      )}
    </svg>
  ),
};

// Tab configuration
const tabs = [
  { id: "home", label: "خانه", icon: Icons.Home, path: "/" },
  { id: "search", label: "جستجو", icon: Icons.Search, path: "/search" },
  { id: "library", label: "کتابخانه", icon: Icons.Library, path: "/library" },
  { id: "premium", label: "پریمیوم", icon: Icons.Premium, path: "/premium" },
  { id: "profile", label: "پروفایل", icon: Icons.Profile, path: "/profile" },
];

export default function BottomNavbar() {
  const { navigateTo } = useNavigation();
  const { currentPage } = useNavigation();
  const [activeTab, setActiveTab] = useState("home");
  const [isPressed, setIsPressed] = useState<string | null>(null);

  const { visible } = useNavComponent("bottom-navbar");

  // Hide on tablet and desktop (md breakpoint = 768px)
  const isDesktopOrTablet = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const tab = tabs.find((t) => t.path === currentPage);
    if (tab) setActiveTab(tab.id);
  }, [currentPage]);

  // Visibility now controlled by NavigationProvider's visibilityMap via useNavComponent
  // Also hide on desktop/tablet where sidebar is shown
  if (!visible || isDesktopOrTablet) return null;

  const handleNav = (id: string, path: string) => {
    setActiveTab(id);
    const screen = path === "/" ? "home" : (path.slice(1) as any);
    navigateTo(screen);
  };

  return (
    <>
      {/* Gradient fade for content above navbar */}
      <div
        className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-40 md:hidden"
        style={{
          background:
            "linear-gradient(to top, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 50%, transparent 100%)",
        }}
      />

      {/* Main Navbar - Only visible on mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212] border-t border-white/8 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        dir="ltr"
      >
        {/* Safe area spacer for iOS */}
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleNav(tab.id, tab.path)}
                onMouseDown={() => setIsPressed(tab.id)}
                onMouseUp={() => setIsPressed(null)}
                onMouseLeave={() => setIsPressed(null)}
                onTouchStart={() => setIsPressed(tab.id)}
                onTouchEnd={() => setIsPressed(null)}
                className={`
                  relative flex flex-col items-center justify-center
                  flex-1 h-full py-2 
                  transition-all duration-150 ease-out
                  outline-none select-none
                  ${
                    isPressed === tab.id
                      ? "scale-95 opacity-70"
                      : "scale-100 opacity-100"
                  }
                `}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Icon Container */}
                <div
                  className={`
                    relative flex items-center justify-center
                    transition-colors duration-200
                    ${isActive ? "text-white" : "text-[#b3b3b3]"}
                  `}
                >
                  <Icon active={isActive} />
                </div>

                {/* Label */}
                <span
                  className={`
                    mt-1 text-[10px] font-medium tracking-wide
                    transition-colors duration-200
                    ${isActive ? "text-white" : "text-[#b3b3b3]"}
                  `}
                >
                  {tab.label}
                </span>

                {/* Active Indicator Dot */}
                <div
                  className={`
                    absolute -top-0.5 left-1/2 -translate-x-1/2
                    w-1 h-1 rounded-full bg-emerald-500
                    transition-all duration-300 ease-out
                    ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"}
                  `}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
