"use client";

import React, { memo, useEffect, useState } from "react";
import { useRouter } from "next/router";

// ============================================================================
// HOOKS
// ============================================================================
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    // Set initial value correctly on mount if it changed
    if (media.matches !== matches) setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query, matches]);

  return matches;
};

// Consolidated responsive hook that handles all breakpoints in one hook
const useResponsiveBreakpoints = () => {
  const [breakpoints, setBreakpoints] = useState(() => {
    // Correctly initialize state for the first client-side render
    // to prevent layout shifts (CLS) on desktop/tablet.
    if (typeof window === "undefined") {
      return { isMobile: true, isTablet: false, isDesktop: false };
    }
    const width = window.innerWidth;
    const isMd = width >= 768;
    const isLg = width >= 1024;
    return {
      isMobile: !isMd,
      isTablet: isMd && !isLg,
      isDesktop: isLg,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mdQuery = window.matchMedia("(min-width: 768px)");
    const lgQuery = window.matchMedia("(min-width: 1024px)");

    const updateBreakpoints = () => {
      const isMd = mdQuery.matches;
      const isLg = lgQuery.matches;

      setBreakpoints({
        isMobile: !isMd,
        isTablet: isMd && !isLg,
        isDesktop: isLg,
      });
    };

    // Listen for changes
    mdQuery.addEventListener("change", updateBreakpoints);
    lgQuery.addEventListener("change", updateBreakpoints);

    return () => {
      mdQuery.removeEventListener("change", updateBreakpoints);
      lgQuery.removeEventListener("change", updateBreakpoints);
    };
  }, []);

  return breakpoints;
};

// ============================================================================
// ICONS
// ============================================================================
const Icons = {
  ChevronLeft: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  User: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  Bell: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  ),
  MoreHorizontal: () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    </svg>
  ),
};

// ============================================================================
// HEADER COMPONENT - Desktop/Tablet Navigation Header
// ============================================================================
interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
  transparent?: boolean;
  className?: string;
}

const Header = memo(
  ({
    showBackButton = true,
    title,
    transparent = true,
    className = "",
  }: HeaderProps) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
      const handleScroll = () => {
        setScrolled(window.scrollY > 64);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
      <header
        className={`
        hidden md:flex
        sticky top-0 z-40
        h-16 items-center justify-between
        px-6 
        transition-all duration-300
        ${
          transparent && !scrolled
            ? "bg-transparent"
            : "bg-zinc-900/95 backdrop-blur-xl border-b border-white/5"
        }
        ${className}
      `}
        style={{
          willChange: "background-color, backdrop-filter, border-color",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
      >
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Back/forward buttons removed for pages router compatibility */}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Profile button removed for pages router compatibility */}
        </div>
      </header>
    );
  },
);

Header.displayName = "Header";

// ============================================================================
// MAIN CONTENT WRAPPER
// ============================================================================
interface MainContentProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  headerTitle?: string;
  noPadding?: boolean;
}

const MainContent = memo(
  ({
    children,
    className = "",
    showHeader = true,
    headerTitle,
    noPadding = false,
  }: MainContentProps) => {
    const router = useRouter();
    const pathname = router.pathname;
    const isAuthPage = pathname === "/login" || pathname === "/verify";

    // Auth pages get full width, no sidebar padding
    if (isAuthPage) {
      return <>{children}</>;
    }

    return (
      <div
        className={`
        flex-1 flex flex-col
        min-h-screen
        bg-linear-to-b from-zinc-900 via-zinc-900 to-black
        md:rounded-lg md:m-2 md:mr-0
        overflow-hidden
        ${className}
      `}
      >
        {showHeader && <Header title={headerTitle} />}
        <main
          className={`
          flex-1
          ${noPadding ? "" : "pb-24 md:pb-4"}
        `}
        >
          {children}
        </main>
      </div>
    );
  },
);

MainContent.displayName = "MainContent";

// ============================================================================
// RESPONSIVE LAYOUT PROVIDER
// ============================================================================
interface ResponsiveLayoutContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const ResponsiveLayoutContext =
  React.createContext<ResponsiveLayoutContextType>({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  });

export const useResponsiveLayout = () =>
  React.useContext(ResponsiveLayoutContext);

interface ResponsiveLayoutProviderProps {
  children: React.ReactNode;
}

export const ResponsiveLayoutProvider = ({
  children,
}: ResponsiveLayoutProviderProps) => {
  const { isMobile, isTablet, isDesktop } = useResponsiveBreakpoints();

  return (
    <ResponsiveLayoutContext.Provider value={{ isMobile, isTablet, isDesktop }}>
      {children}
    </ResponsiveLayoutContext.Provider>
  );
};

// ============================================================================
// PAGE TRANSITION WRAPPER
// ============================================================================
interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  return <>{children}</>;
};

// ============================================================================
// EXPORTS
// ============================================================================
export { Header, MainContent };
