import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useNavigation } from "../contexts/NavigationContext";

// --- 1. High-Fidelity Icons (Optimized SVGs) ---
const Icons = {
  Home: ({ active }: { active: boolean }) => (
    <svg
      className={`w-6 h-6 transition-all duration-500 ${
        active ? "scale-110" : "scale-100"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  Search: ({ active }: { active: boolean }) => (
    <svg
      className={`w-6 h-6 transition-all duration-500 ${
        active ? "scale-110" : "scale-100"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  ),
  Playlists: ({ active }: { active: boolean }) => (
    <svg
      className={`w-6 h-6 transition-all duration-500 ${
        active ? "scale-110" : "scale-100"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  ),
  Profile: ({ active }: { active: boolean }) => (
    <svg
      className={`w-6 h-6 transition-all duration-500 ${
        active ? "scale-110" : "scale-100"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
};

export default function BottomNavbar() {
  const router = useRouter();
  const { currentPage } = useNavigation();
  const [activeTab, setActiveTab] = useState("home");

  // Visual polish: Detect if we scrolled to hide/show (optional dynamic visual)
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const tab = tabs.find((t) => t.path === currentPage);
    if (tab) setActiveTab(tab.id);
  }, [currentPage]);

  const tabs = [
    { id: "home", label: "خانه", icon: Icons.Home, path: "/" },
    { id: "search", label: "جستجو", icon: Icons.Search, path: "/search" },
    {
      id: "playlists",
      label: "پلی‌لیست‌ها",
      icon: Icons.Playlists,
      path: "/playlists",
    },
    { id: "profile", label: "پروفایل", icon: Icons.Profile, path: "/profile" },
  ];

  const handleNav = (id: string, path: string) => {
    setActiveTab(id);
    router.push(path);
  };

  return (
    <div className="fixed -bottom-2 left-0 w-full z-50 flex justify-center pb-6 pointer-events-none">
      {/* --- The Island Container --- */}
      <nav
        className="
          pointer-events-auto
          relative flex items-center justify-between
          w-[92%] max-w-[400px] h-[61px]
          bg-[#0a0a0a]/80 backdrop-blur-xl
          rounded-[2rem]
          border border-white/10
          shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]
          overflow-hidden
        "
        dir="ltr"
      >
        {/* --- Ambient Noise Texture (Matches Login Page) --- */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* --- Tab Items --- */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleNav(tab.id, tab.path)}
              className="relative z-10 flex-1 flex flex-col items-center justify-center h-full cursor-pointer group select-none outline-none -space-y-1"
            >
              {/* Visual Icon Container */}
              <div
                className={`
                relative p-2 rounded-full transition-all duration-300
                ${
                  isActive
                    ? "text-emerald-400"
                    : "text-gray-500 group-hover:text-gray-300"
                }
              `}
              >
                <Icon active={isActive} />
              </div>

              {/* Label (Animated: only show when selected) */}
              <span
                className={`text-xs text-emerald-400 transition-all duration-500 ${
                  isActive
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* --- Top Highlight Border (Simulates 3D Glass Edge) --- */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      </nav>
    </div>
  );
}
