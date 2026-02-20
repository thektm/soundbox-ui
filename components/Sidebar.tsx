"use client";

import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { createSlug } from "./mockData";
import { CreatePlaylistModal } from "./CreatePlaylistModal";

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
  Premium: ({ active }: { active: boolean }) => (
    <div className="relative w-6 h-6">
      <img
        src="/premium.svg"
        alt="premium"
        className={`absolute inset-0 w-6 h-6 transition-opacity duration-150 ${
          active ? "opacity-0" : "opacity-100"
        }`}
        style={{ filter: "invert(1)" }}
      />
      <img
        src="/premium-selected.svg"
        alt="premium-selected"
        className={`absolute inset-0 w-6 h-6 transition-opacity duration-150 ${
          active ? "opacity-100" : "opacity-0"
        }`}
        style={{ filter: "invert(1)" }}
      />
    </div>
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
  type: "playlist" | "artist" | "album" | "podcast" | "song";
  image?: string | string[];
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
  {
    id: "premium",
    label: "Premium",
    labelFa: "پریمیوم",
    icon: Icons.Premium,
    path: "/premium",
  },
];

// Playlist mock data removed. Sidebar will fetch recommended playlists from API.

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
  ),
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
      song: "آهنگ",
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
              Array.isArray(item.image) ? (
                <img
                  src={(item.image as string[])[0]}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  style={{
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)",
                  }}
                />
              ) : (
                <img
                  src={String(item.image)}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  style={{
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    transform: "translateZ(0)",
                  }}
                />
              )
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
            Array.isArray(item.image) ? (
              // layered cover stack (up to 3 covers) similar to home
              <div className="relative w-full h-full">
                {item.image.slice(0, 3).map((src, idx) => {
                  const offset = idx * 8; // px offset between stacked covers
                  const z = 30 - idx;
                  const sizeClass =
                    viewMode === "grid" && !isCollapsed
                      ? "w-20 h-20"
                      : "w-12 h-12";
                  return (
                    <img
                      key={idx}
                      src={src}
                      alt={`${item.name} cover ${idx}`}
                      className={`object-cover rounded-md border border-black bg-zinc-900 absolute shadow-md`}
                      style={{
                        right: `${offset}px`,
                        top: `50%`,
                        transform: `translateY(-50%)`,
                        width: viewMode === "grid" && !isCollapsed ? 76 : 48,
                        height: viewMode === "grid" && !isCollapsed ? 76 : 48,
                        zIndex: z,
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <img
                src={String(item.image)}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                }}
              />
            )
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
  },
);

LibraryItemComponent.displayName = "LibraryItemComponent";

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================
function Sidebar() {
  const { currentPage, navigateTo, homeCache } = useNavigation();

  // State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const { accessToken } = useAuth();
  const [libraryTab, setLibraryTab] = useState<"playlists" | "library">(
    "playlists",
  );
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<
    PlaylistItem[]
  >([]);
  const [loadingRecommended, setLoadingRecommended] = useState<boolean>(true);
  const [libraryItems, setLibraryItems] = useState<PlaylistItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Helper for normalizing covers
  const ensureHttps = (u: any) => {
    if (!u) return undefined;
    try {
      if (typeof u === "string") return u.replace(/^http:\/\//i, "https://");
      return undefined;
    } catch (e) {
      return undefined;
    }
  };

  const normalizeCover = (src: any) => {
    if (!src) return undefined;
    if (typeof src === "string") return ensureHttps(src);
    if (Array.isArray(src))
      return src
        .map((s) => {
          if (!s) return undefined;
          if (typeof s === "string") return ensureHttps(s);
          if (typeof s === "object")
            return (
              ensureHttps(s.cover_image || s.cover || s.url || s.image) ||
              undefined
            );
          return undefined;
        })
        .filter(Boolean);
    if (typeof src === "object")
      return ensureHttps(src.cover_image || src.cover || src.url || src.image);
    return undefined;
  };

  // Fetch library items (history) similar to LibraryScreen
  const fetchLibraryItems = useCallback(async () => {
    if (!accessToken) return;
    setLoadingLibrary(true);
    try {
      const resp = await fetch("https://api.sedabox.com/api/profile/history/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        const list = data.results || [];
        const mapped = list.map((h: any) => {
          const item = h.item;
          return {
            id: item.unique_id || item.id,
            name: item.title || item.name,
            type: h.type as any,
            image: normalizeCover(
              item.cover_image || item.image || item.covers,
            ),
            owner: item.owner || undefined,
            pinned: false,
          } as PlaylistItem;
        });
        setLibraryItems(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch library history:", err);
    } finally {
      setLoadingLibrary(false);
    }
  }, [accessToken]);

  // Handle playlist creation
  const handleCreatePlaylist = useCallback(
    async (name: string, isPublic: boolean) => {
      if (!accessToken) return;
      try {
        const resp = await fetch(
          "https://api.sedabox.com/api/profile/playlists/create/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ title: name, public: isPublic }),
          },
        );
        if (resp.ok) {
          // Refresh playlists if we are in that mode or it was just created
          // For simplicity, we could re-fetch or just navigate to the new playlist
          const data = await resp.json();
          if (data.id) {
            navigateTo("playlist-detail", { id: data.id });
          }
        }
      } catch (err) {
        console.error("Failed to create playlist:", err);
      }
    },
    [accessToken, navigateTo],
  );

  // Fetch recommended playlists once on mount
  useEffect(() => {
    let mounted = true;
    const fetchRecommended = async () => {
      setLoadingRecommended(true);
      // If we already have home cache with playlist_recommendations, use it immediately
      try {
        if (homeCache?.playlist_recommendations) {
          const cached = homeCache.playlist_recommendations;
          const list = Array.isArray(cached) ? cached : cached.results || [];
          const normalizeCached = (p: any) => {
            const covers = p.top_three_song_covers || p.covers || [];
            const mappedCovers = Array.isArray(covers)
              ? covers
                  .map((c: any) =>
                    typeof c === "string"
                      ? c.replace(/^http:\/\//i, "https://")
                      : c?.cover_image || c?.url || c?.image,
                  )
                  .filter(Boolean)
              : [];
            return {
              id: p.unique_id || p.id,
              name: p.title || p.name,
              type: "playlist",
              image: mappedCovers.length > 0 ? mappedCovers : p.cover_image,
              owner: p.owner || undefined,
              pinned: false,
            } as PlaylistItem;
          };

          const pre = list.map((p: any) => normalizeCached(p));
          if (mounted && pre.length > 0) {
            setRecommendedPlaylists(pre);
            // keep loadingRecommended true while we refresh in background
          }
        }
      } catch (e) {
        /* ignore cache transform errors */
      }
      try {
        const resp = await fetch(
          "https://api.sedabox.com/api/home/playlist-recommendations/",
          {
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {},
          },
        );
        if (!mounted) return;
        if (resp.ok) {
          const data = await resp.json();
          const list = Array.isArray(data) ? data : data?.results || [];

          const mapped: PlaylistItem[] = list.map((p: any) => {
            const covers = normalizeCover(p.top_three_song_covers || p.covers);
            const single = normalizeCover(p.cover_image) as string | undefined;
            return {
              id: p.unique_id || p.id,
              name: p.title || p.name,
              type: "playlist",
              image: (covers && covers.length > 0 ? covers : single) as
                | string
                | string[]
                | undefined,
              owner: p.owner || undefined,
              pinned: false,
            } as PlaylistItem;
          });
          setRecommendedPlaylists(mapped);
        } else {
          setRecommendedPlaylists([]);
        }
      } catch (err) {
        console.error("Failed to fetch recommended playlists:", err);
        setRecommendedPlaylists([]);
      } finally {
        if (mounted) setLoadingRecommended(false);
      }
    };

    fetchRecommended();
    return () => {
      mounted = false;
    };
  }, [accessToken]);

  // Check active state
  const isActivePath = useCallback(
    (path: string) => {
      if (path === "/") return currentPage === "home";
      return currentPage === path.slice(1);
    },
    [currentPage],
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
          <div className="p-3 pb-2 flex items-center justify-between sticky top-0 bg-zinc-900 z-10 transition-colors duration-200">
            <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
              <button
                onClick={() => {
                  setLibraryTab("playlists");
                  // No re-fetch needed if we have them, usually
                }}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
                  ${
                    libraryTab === "playlists"
                      ? "bg-white/15 text-white shadow-xl shadow-black/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }
                  ${isCollapsed ? "hidden" : "block shrink-0"}
                `}
              >
                <Icons.Library active={libraryTab === "playlists"} />
                <span className="font-bold text-xs whitespace-nowrap">
                  پلی‌لیست‌ها
                </span>
              </button>
              {!isCollapsed && (
                <button
                  onClick={() => {
                    setLibraryTab("library");
                    // Always fetch library items when switching to the Library tab
                    fetchLibraryItems();
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
                    ${
                      libraryTab === "library"
                        ? "bg-white/15 text-white shadow-xl shadow-black/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }
                    ${isCollapsed ? "hidden" : "block shrink-0"}
                  `}
                >
                  <Icons.Search active={libraryTab === "library"} />
                  <span className="font-bold text-xs whitespace-nowrap">
                    کتابخانه شما
                  </span>
                </button>
              )}

              {isCollapsed && (
                <button
                  onClick={() => {
                    const next =
                      libraryTab === "playlists" ? "library" : "playlists";
                    setLibraryTab(next);
                    // When toggling in collapsed mode, fetch every time we switch to library
                    if (next === "library") fetchLibraryItems();
                  }}
                  className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors flex items-center justify-center w-full"
                >
                  {libraryTab === "playlists" ? (
                    <Icons.Library active={true} />
                  ) : (
                    <Icons.Search active={true} />
                  )}
                </button>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0 mr-1.5">
                {libraryTab === "playlists" ? (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all transform active:scale-95 duration-200"
                    title="ایجاد پلی‌لیست جدید"
                  >
                    <Icons.Plus />
                  </button>
                ) : (
                  <button
                    onClick={() => navigateTo("liked-songs")}
                    className="p-2 rounded-full hover:bg-white/10 text-emerald-500 hover:text-emerald-400 transition-all transform active:scale-95 animate-in fade-in zoom-in duration-300"
                    title="آهنگ‌های لایک شده"
                  >
                    <Icons.Heart filled={true} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Library Items */}
          <div
            className={`
            flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 scroll-smooth
            ${
              viewMode === "grid" && !isCollapsed
                ? "grid grid-cols-2 gap-2 content-start"
                : "flex flex-col gap-0.5"
            }
            ${isCollapsed ? "grid grid-cols-1 gap-2 px-2" : ""}
          `}
          >
            {(libraryTab === "playlists" ? loadingRecommended : loadingLibrary)
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={"skeleton-" + i}
                    className={
                      viewMode === "grid" && !isCollapsed
                        ? "w-full h-24 bg-zinc-800/50 rounded-md animate-pulse"
                        : "w-full h-12 bg-zinc-800/50 rounded-md animate-pulse mb-2"
                    }
                  />
                ))
              : (libraryTab === "playlists"
                  ? recommendedPlaylists
                  : libraryItems
                ).map((item) => (
                  <LibraryItemComponent
                    key={`${item.type}-${item.id}`}
                    item={item}
                    isCollapsed={isCollapsed}
                    viewMode={viewMode}
                    onClick={() => {
                      if (item.type === "artist") {
                        navigateTo("artist-detail", {
                          id: item.id,
                          slug: createSlug(item.name || ""),
                        });
                        return;
                      }

                      if (item.type === "album") {
                        navigateTo("album-detail", {
                          id: item.id,
                          slug: createSlug(item.name),
                          album: item,
                        });
                        return;
                      }

                      if (item.type === "playlist") {
                        navigateTo("playlist-detail", { id: item.id });
                        return;
                      }

                      if (item.type === "song") {
                        // maybe navigate to song detail?
                        navigateTo("song-detail", { id: item.id });
                        return;
                      }
                    }}
                  />
                ))}
          </div>
        </div>
      </div>

      {/* Profile quick access removed for brevity or kept if needed */}
      {/* Portals and Modals */}
      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(name, isPub) => {
          handleCreatePlaylist(name, isPub);
          setShowCreateModal(false);
        }}
      />

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
