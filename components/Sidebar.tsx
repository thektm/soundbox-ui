"use client";

import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useNavigation } from "./NavigationContext";
import { createSlug, decodeSlug, getAllPlaylists } from "./mockData";

// ============================================================================
// ICONS - Spotify-style icons
// ============================================================================
const Icons = {
  Home: ({ active }: { active: boolean }) => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.5}
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
      strokeWidth={active ? 2.5 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  ),
  Library: ({ active }: { active: boolean }) => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke={active ? "none" : "currentColor"}
      strokeWidth={1.5}
    >
      {active ? (
        <path d="M3 22V2h6v20H3zm7 0V7h6v15h-6zm7 0V11h4v11h-4z" />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        />
      )}
    </svg>
  ),
  Playlists: ({ active }: { active: boolean }) => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke={active ? "none" : "currentColor"}
      strokeWidth={1.5}
    >
      {active ? (
        <path d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.458.122z" />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      )}
    </svg>
  ),
  Profile: ({ active }: { active: boolean }) => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke={active ? "none" : "currentColor"}
      strokeWidth={1.5}
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
  Plus: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Heart: ({ filled = false }: { filled?: boolean }) => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  ),
  ChevronLeft: () => (
    <svg
      className="w-4 h-4"
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
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  Menu: () => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  ),
  Close: () => (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  Grid: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  ),
  List: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  ),
  ArrowRight: () => (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  ),
};

// ============================================================================
// TYPES
// ============================================================================
interface NavItem {
  id: string;
  label: string;
  labelFa: string;
  icon: React.FC<{ active: boolean }>;
  path: string;
}

interface PlaylistItem {
  id: string;
  name: string;
  type: "playlist" | "artist" | "album" | "podcast";
  image?: string;
  owner?: string;
  pinned?: boolean;
}

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================
const mainNavItems: NavItem[] = [
  { id: "home", label: "Home", labelFa: "خانه", icon: Icons.Home, path: "/" },
  {
    id: "search",
    label: "Search",
    labelFa: "جستجو",
    icon: Icons.Search,
    path: "/search",
  },
];

const mockLibraryItems: PlaylistItem[] = [
  {
    id: "liked",
    name: "آهنگ‌های موردعلاقه",
    type: "playlist",
    image: "/liked-songs.png",
    owner: "شما",
    pinned: true,
  },
  {
    id: "pl1",
    name: "پلی‌لیست تمرینی",
    type: "playlist",
    image: "https://picsum.photos/seed/pl1/100/100",
    owner: "شما",
    pinned: true,
  },
  {
    id: "pl2",
    name: "آرامش‌بخش",
    type: "playlist",
    image: "https://picsum.photos/seed/pl2/100/100",
    owner: "شما",
  },
  {
    id: "ar1",
    name: "The Weeknd",
    type: "artist",
    image: "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb",
  },
  {
    id: "ar2",
    name: "Ed Sheeran",
    type: "artist",
    image: "https://i.scdn.co/image/ab6761610000e5eb3bcef85e105dfc42399ef0ba",
  },
  {
    id: "al1",
    name: "After Hours",
    type: "album",
    image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    owner: "The Weeknd",
  },
  {
    id: "pl3",
    name: "پاپ فارسی",
    type: "playlist",
    image: "https://picsum.photos/seed/pl3/100/100",
    owner: "صدا باکس",
  },
  {
    id: "pl4",
    name: "هیپ‌هاپ",
    type: "playlist",
    image: "https://picsum.photos/seed/pl4/100/100",
    owner: "شما",
  },
];

// ============================================================================
// SIDEBAR CONTEXT FOR COLLAPSE STATE
// ============================================================================
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
}

export const SidebarContext = React.createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {},
});

export const useSidebar = () => React.useContext(SidebarContext);

// ============================================================================
// COMPONENTS
// ============================================================================

// Navigation Item Component
const NavItemComponent = memo(
  ({
    item,
    isActive,
    isCollapsed,
    onClick,
  }: {
    item: NavItem;
    isActive: boolean;
    isCollapsed: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 px-3 py-2.5 rounded-md
        transition-all duration-200 group
        ${
          isActive
            ? "bg-white/10 text-white"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }
        ${isCollapsed ? "justify-center" : ""}
      `}
      style={{
        willChange: "background-color, color",
        backfaceVisibility: "hidden",
        transform: "translateZ(0)",
      }}
      title={isCollapsed ? item.labelFa : undefined}
    >
      <span className="shrink-0">
        <item.icon active={isActive} />
      </span>
      {!isCollapsed && (
        <span className="font-semibold text-sm tracking-tight truncate">
          {item.labelFa}
        </span>
      )}
    </button>
  )
);

NavItemComponent.displayName = "NavItemComponent";

// Library Item Component
const LibraryItemComponent = memo(
  ({
    item,
    isCollapsed,
    viewMode,
    onClick,
  }: {
    item: PlaylistItem;
    isCollapsed: boolean;
    viewMode: "list" | "grid";
    onClick: () => void;
  }) => {
    const typeLabels = {
      playlist: "پلی‌لیست",
      artist: "هنرمند",
      album: "آلبوم",
      podcast: "پادکست",
    };

    if (isCollapsed) {
      return (
        <button
          onClick={onClick}
          className="w-full aspect-square relative group"
          title={item.name}
        >
          <div className="w-full h-full rounded-md overflow-hidden bg-zinc-800">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                }}
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                <Icons.Playlists active={false} />
              </div>
            )}
          </div>
          {item.pinned && (
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      );
    }

    return (
      <button
        onClick={onClick}
        className={`
          w-full flex items-center gap-3 p-2 rounded-md
          transition-all duration-200 group hover:bg-white/5
          ${viewMode === "grid" ? "flex-col text-center" : ""}
        `}
        style={{
          willChange: "background-color",
          backfaceVisibility: "hidden",
          transform: "translateZ(0)",
        }}
      >
        <div
          className={`
          relative shrink-0 overflow-hidden bg-zinc-800
          ${
            viewMode === "grid"
              ? "w-full aspect-square rounded-md"
              : "w-12 h-12 rounded"
          }
          ${item.type === "artist" ? "rounded-full" : ""}
        `}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{
                willChange: "transform",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
              <Icons.Playlists active={false} />
            </div>
          )}
          {item.pinned && viewMode === "list" && (
            <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </div>
        <div
          className={`flex-1 min-w-0 ${
            viewMode === "grid" ? "w-full" : "text-right"
          }`}
        >
          <p className="text-sm font-medium text-white truncate">{item.name}</p>
          <p className="text-xs text-zinc-400 truncate">
            {typeLabels[item.type]}
            {item.owner && ` • ${item.owner}`}
          </p>
        </div>
      </button>
    );
  }
);

LibraryItemComponent.displayName = "LibraryItemComponent";

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================
function Sidebar() {
  const { currentPage, navigateTo } = useNavigation();

  // State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [libraryFilter, setLibraryFilter] = useState<
    "all" | "playlists" | "artists" | "albums"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter library items
  const filteredLibraryItems = useMemo(() => {
    // Build canonical playlist items from mockData so sidebar uses the same source
    const canonicalPlaylists: PlaylistItem[] = getAllPlaylists().map((p) => ({
      id: p.id,
      name: p.title,
      type: "playlist",
      image: p.image,
      owner: p.followers || undefined,
      pinned: p.isNew || false,
    }));

    // Keep non-playlist demo items from mockLibraryItems (artists/albums)
    const otherItems = mockLibraryItems.filter((it) => it.type !== "playlist");

    let items: PlaylistItem[] = [...canonicalPlaylists, ...otherItems];

    // Apply type filter
    if (libraryFilter !== "all") {
      const typeMap = {
        playlists: "playlist",
        artists: "artist",
        albums: "album",
      } as const;
      items = items.filter((item) => item.type === typeMap[libraryFilter]);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.owner?.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first
    return items.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
  }, [libraryFilter, searchQuery]);

  // Check active state
  const isActivePath = useCallback(
    (path: string) => {
      if (path === "/") return currentPage === "home";
      return currentPage === path.slice(1);
    },
    [currentPage]
  );

  // Hide on login/verify pages
  if (
    currentPage === "login" ||
    currentPage === "verify" ||
    currentPage === "register" ||
    currentPage === "forgot-password"
  ) {
    return null;
  }

  return (
    <aside
      className={`
        hidden md:flex flex-col
        h-screen sticky top-0
        bg-black
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-[72px]" : "w-[280px] lg:w-[320px]"}
      `}
      style={{
        willChange: "width",
        backfaceVisibility: "hidden",
        transform: "translateZ(0)",
      }}
      dir="rtl"
    >
      {/* Top Navigation Section */}
      <div className="p-2">
        <div className="bg-zinc-900 rounded-lg p-3">
          {/* Logo */}
          <div className="flex items-center justify-between mb-4">
            {!isCollapsed && (
              <div className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="صدا باکس"
                    className="w-6 h-6 object-cover"
                  />
                </div>
                <span className="text-lg font-bold text-white">صدا باکس</span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title={isCollapsed ? "باز کردن" : "بستن"}
            >
              {isCollapsed ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => (
              <NavItemComponent
                key={item.id}
                item={item}
                isActive={isActivePath(item.path)}
                isCollapsed={isCollapsed}
                onClick={() => navigateTo(item.id)}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Library Section */}
      <div className="flex-1 p-2 overflow-hidden flex flex-col">
        <div className="bg-zinc-900 rounded-lg flex-1 flex flex-col overflow-hidden">
          {/* Library Header */}
          <div className="p-3 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
            <button
              onClick={() => navigateTo("playlists")}
              className={`
                flex items-center gap-3 text-zinc-400 hover:text-white transition-colors
                ${isCollapsed ? "justify-center w-full" : ""}
              `}
            >
              <Icons.Library active={isActivePath("/playlists")} />
              {!isCollapsed && (
                <span className="font-bold text-base"> پلی‌لیست‌ها</span>
              )}
            </button>
            {!isCollapsed && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {}}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  title="ایجاد پلی‌لیست جدید"
                >
                  <Icons.Plus />
                </button>
                <button
                  onClick={() => navigateTo("playlists")}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  title="مشاهده همه"
                >
                  <Icons.ArrowRight />
                </button>
              </div>
            )}
          </div>

          {/* Filter Chips */}
          {!isCollapsed && (
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: "all", label: "همه" },
                  { id: "playlists", label: "پلی‌لیست" },
                  { id: "artists", label: "هنرمندان" },
                  { id: "albums", label: "آلبوم‌ها" },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setLibraryFilter(filter.id)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                    transition-all duration-200
                    ${
                      libraryFilter === filter.id
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-white hover:bg-zinc-700"
                    }
                  `}
                  style={{
                    willChange: "background-color, color",
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)",
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}

          {/* Search & View Toggle */}
          {!isCollapsed && (
            <div className="px-3 pb-2 flex items-center justify-between">
              <button
                onClick={() => {}}
                className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <Icons.Search active={false} />
              </button>
              <div className="flex items-center gap-1 text-zinc-400">
                <span className="text-xs">اخیر</span>
                <button
                  onClick={() =>
                    setViewMode(viewMode === "list" ? "grid" : "list")
                  }
                  className="p-1.5 rounded-md hover:bg-white/10 hover:text-white transition-colors"
                >
                  {viewMode === "list" ? <Icons.Grid /> : <Icons.List />}
                </button>
              </div>
            </div>
          )}

          {/* Library Items */}
          <div
            className={`
            flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2
            ${
              viewMode === "grid" && !isCollapsed
                ? "grid grid-cols-2 gap-2 content-start"
                : "flex flex-col gap-0.5"
            }
            ${isCollapsed ? "grid grid-cols-1 gap-2 px-2" : ""}
          `}
          >
            {filteredLibraryItems.map((item) => (
              <LibraryItemComponent
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                viewMode={viewMode}
                onClick={() => {
                  // Navigate to the correct detail page based on item type.
                  if (item.type === "artist") {
                    navigateTo("artist-detail", {
                      slug: createSlug(item.name),
                    });
                    return;
                  }

                  if (item.type === "album") {
                    navigateTo("album-detail", {
                      slug: createSlug(item.name),
                      album: item,
                    });
                    return;
                  }

                  if (item.type === "playlist") {
                    // Try to find a matching playlist from the canonical mock data
                    const all = getAllPlaylists();
                    const targetSlug = createSlug(item.name);
                    const found = all.find((p) => {
                      try {
                        const s1 = decodeSlug(
                          createSlug(p.title)
                        ).toLowerCase();
                        const s2 = decodeSlug(targetSlug).toLowerCase();
                        if (s1 === s2) return true;
                        // fallback: compare normalized titles
                        const normP = p.title
                          .toLowerCase()
                          .replace(/\s+/g, " ")
                          .trim();
                        const normItem = item.name
                          .toLowerCase()
                          .replace(/\s+/g, " ")
                          .trim();
                        return normP === normItem;
                      } catch (e) {
                        return false;
                      }
                    });

                    if (found) {
                      navigateTo("playlist-detail", {
                        slug: createSlug(found.title),
                      });
                    } else {
                      // Last resort: navigate using the item name slug (may show not-found)
                      navigateTo("playlist-detail", { slug: targetSlug });
                    }

                    return;
                  }

                  // Fallback to the playlists list view
                  navigateTo("playlists");
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Profile Quick Access */}
      <div className="p-2">
        <div className="bg-zinc-900 rounded-lg">
          <button
            onClick={() => navigateTo("profile")}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg
              transition-all duration-200 hover:bg-white/5
              ${isCollapsed ? "justify-center" : ""}
            `}
            style={{
              willChange: "background-color",
              backfaceVisibility: "hidden",
              transform: "translateZ(0)",
            }}
          >
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-zinc-600 to-zinc-700 flex items-center justify-center shrink-0">
              <Icons.Profile active={isActivePath("/profile")} />
            </div>
            {!isCollapsed && (
              <span className="text-sm font-medium text-white truncate">
                پروفایل
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
