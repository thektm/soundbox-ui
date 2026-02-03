"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useRef,
  useEffect,
} from "react";
import { useNavigation } from "./NavigationContext";
import {
  MOCK_FOLLOWERS,
  MOCK_FOLLOWING,
  Follower,
  Following,
} from "./mockData";

// ============================================================================
// Icon Component - Optimized with memo
// ============================================================================
const Icon = memo(
  ({
    d,
    className = "w-5 h-5",
    filled = false,
  }: {
    d: string;
    className?: string;
    filled?: boolean;
  }) => (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={d}
      />
    </svg>
  ),
);

Icon.displayName = "Icon";

// ============================================================================
// Icon Paths
// ============================================================================
const ICONS = {
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  verified: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close: "M6 18L18 6M6 6l12 12",
  userPlus:
    "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  userCheck:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
};

// ============================================================================
// Tab Type
// ============================================================================
type TabType = "followers" | "following";

// ============================================================================
// Follower Card Component - Optimized
// ============================================================================
const FollowerCard = memo(
  ({ user, onFollow }: { user: Follower; onFollow: (id: string) => void }) => {
    const [isFollowing, setIsFollowing] = useState(user.isFollowedByYou);

    const handleFollow = useCallback(() => {
      setIsFollowing(!isFollowing);
      onFollow(user.id);
    }, [isFollowing, user.id, onFollow]);

    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] active:scale-[0.99] transition-all duration-150"
        style={{ willChange: "transform, opacity" }}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800/50 ring-2 ring-white/[0.06]">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">
              {user.name}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {user.username}
          </p>
          {user.mutualFollowers && (
            <p className="text-[10px] text-gray-600 mt-1">
              {user.mutualFollowers} دنبال‌کننده مشترک
            </p>
          )}
        </div>

        {/* Follow Button */}
        <button
          onClick={handleFollow}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 shrink-0 ${
            isFollowing
              ? "bg-white/[0.06] text-gray-300 border border-white/[0.1] hover:border-red-500/30 hover:text-red-400"
              : "bg-white text-black hover:bg-gray-200"
          }`}
        >
          {isFollowing ? "دنبال می‌کنید" : "دنبال کردن"}
        </button>
      </div>
    );
  },
);

FollowerCard.displayName = "FollowerCard";

// ============================================================================
// Following Card Component - Optimized (Artist style with verification)
// ============================================================================
const FollowingCard = memo(
  ({
    artist,
    onUnfollow,
  }: {
    artist: Following;
    onUnfollow: (id: string) => void;
  }) => {
    const { navigateTo } = useNavigation();
    const [isFollowing, setIsFollowing] = useState(true);

    const handleUnfollow = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFollowing(!isFollowing);
        onUnfollow(artist.id);
      },
      [isFollowing, artist.id, onUnfollow],
    );

    const handleCardClick = useCallback(() => {
      navigateTo("artist-detail", { id: artist.id });
    }, [navigateTo, artist.id]);

    return (
      <div
        onClick={handleCardClick}
        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] active:scale-[0.99] transition-all duration-150 cursor-pointer"
        style={{ willChange: "transform, opacity" }}
      >
        {/* Avatar with gradient ring for verified artists */}
        <div className="relative shrink-0">
          <div
            className={`w-14 h-14 rounded-full overflow-hidden bg-zinc-800/50 p-[2px] ${
              artist.verified
                ? "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500"
                : "ring-2 ring-white/[0.06]"
            }`}
          >
            <img
              src={artist.avatar}
              alt={artist.name}
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
            />
          </div>
          {/* Verified Badge */}
          {artist.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-[#030303]">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">
              {artist.name}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{artist.type}</p>
          <p className="text-[10px] text-emerald-500/80 mt-1">
            {artist.followers} دنبال‌کننده
          </p>
        </div>

        {/* Unfollow Button */}
        <button
          onClick={handleUnfollow}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 shrink-0 ${
            isFollowing
              ? "bg-white/[0.06] text-gray-300 border border-white/[0.1] hover:border-red-500/30 hover:text-red-400"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
        >
          {isFollowing ? "دنبال می‌کنید" : "دنبال کردن"}
        </button>
      </div>
    );
  },
);

FollowingCard.displayName = "FollowingCard";

// ============================================================================
// Main Component
// ============================================================================
export default function FollowersFollowing({
  initialTab = "followers",
}: {
  initialTab?: TabType;
}) {
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Refs and indicator state for accurate tab underline positioning
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const followersBtnRef = useRef<HTMLButtonElement | null>(null);
  const followingBtnRef = useRef<HTMLButtonElement | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const update = () => {
      const btn =
        activeTab === "followers"
          ? followersBtnRef.current
          : followingBtnRef.current;
      const container = tabsContainerRef.current;
      if (btn && container) {
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        setIndicator({
          left: btnRect.left - containerRect.left,
          width: btnRect.width,
        });
      }
    };

    // initial update and on resize
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab]);

  // Filter data based on search
  const filteredFollowers = useMemo(() => {
    if (!searchQuery) return MOCK_FOLLOWERS;
    const q = searchQuery.toLowerCase();
    return MOCK_FOLLOWERS.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const filteredFollowing = useMemo(() => {
    if (!searchQuery) return MOCK_FOLLOWING;
    const q = searchQuery.toLowerCase();
    return MOCK_FOLLOWING.filter((a) => a.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleFollow = useCallback((id: string) => {
    // Handle follow logic
    console.log("Follow/Unfollow:", id);
  }, []);

  const handleUnfollow = useCallback((id: string) => {
    // Handle unfollow logic
    console.log("Unfollow:", id);
  }, []);

  const handleBack = useCallback(() => {
    navigateTo("profile");
  }, [navigateTo]);

  const toggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
    if (showSearch) setSearchQuery("");
  }, [showSearch]);

  return (
    <div
      className="relative w-full min-h-screen bg-[#030303] text-white overflow-visible font-sans"
      dir="rtl"
    >
      {/* Subtle Gradient Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)",
        }}
      />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#030303]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex flex-row-reverse items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200"
            >
              <Icon d={ICONS.back} className="w-5 h-5 text-white" />
            </button>
          </div>
          <button
            onClick={toggleSearch}
            className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200"
          >
            <Icon
              d={showSearch ? ICONS.close : ICONS.search}
              className="w-5 h-5 text-gray-400"
            />
          </button>
        </div>

        {/* Search Bar - Animated */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            showSearch ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-3">
            <div className="relative">
              <Icon
                d={ICONS.search}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو..."
                className="w-full pl-4 pr-10 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Tabs - Instagram/Spotify style */}
        <div
          className="flex relative"
          ref={(el) => {
            tabsContainerRef.current = el;
          }}
        >
          <button
            ref={(el) => {
              followersBtnRef.current = el;
            }}
            onClick={() => setActiveTab("followers")}
            className={`flex-1 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === "followers" ? "text-white" : "text-gray-500"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              دنبال‌کنندگان
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px]">
                {MOCK_FOLLOWERS.length}
              </span>
            </span>
          </button>
          <button
            ref={(el) => {
              followingBtnRef.current = el;
            }}
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === "following" ? "text-white" : "text-gray-500"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              دنبال‌شده‌ها
              <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px]">
                {MOCK_FOLLOWING.length}
              </span>
            </span>
          </button>
          {/* Active Tab Indicator (measured so animation direction is natural in RTL/LTR) */}
          <div
            className="absolute bottom-0 h-0.5 bg-emerald-500 transition-all duration-300 ease-out"
            style={{
              left: indicator.left + "px",
              width: indicator.width + "px",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        {activeTab === "followers" ? (
          <div className="px-4 py-4 space-y-2">
            {filteredFollowers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Icon
                  d={ICONS.userPlus}
                  className="w-12 h-12 mb-3 opacity-40"
                />
                <p className="text-sm">دنبال‌کننده‌ای یافت نشد</p>
              </div>
            ) : (
              filteredFollowers.map((user) => (
                <FollowerCard
                  key={user.id}
                  user={user}
                  onFollow={handleFollow}
                />
              ))
            )}
          </div>
        ) : (
          <div className="px-4 py-4 space-y-2">
            {filteredFollowing.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Icon
                  d={ICONS.userCheck}
                  className="w-12 h-12 mb-3 opacity-40"
                />
                <p className="text-sm">هنرمندی یافت نشد</p>
              </div>
            ) : (
              filteredFollowing.map((artist) => (
                <FollowingCard
                  key={artist.id}
                  artist={artist}
                  onUnfollow={handleUnfollow}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
