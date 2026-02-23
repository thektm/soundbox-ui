"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  memo,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { useNavigation } from "./NavigationContext";
import { useAuth, UserFollowItem } from "./AuthContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { createSlug } from "./mockData";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================================
// Utils
// ============================================================================
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Icon Component
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

type TabType = "followers" | "following";

// ============================================================================
// Follower Card
// ============================================================================
const FollowerCard = memo(
  ({
    user,
    onFollow,
  }: {
    user: UserFollowItem;
    onFollow: (id: number) => void;
  }) => {
    const { navigateTo } = useNavigation();
    const [isFollowing, setIsFollowing] = useState(user.is_following);

    const handleFollow = useCallback(
      (e?: React.MouseEvent) => {
        // prevent outer click navigation when pressing follow button
        if (e && typeof e.stopPropagation === "function") e.stopPropagation();
        setIsFollowing((prev) => !prev);
        onFollow(user.id);
      },
      [user.id, onFollow],
    );

    return (
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => {
          // navigate depending on item type
          if (user.type === "artist") {
            navigateTo("artist-detail", {
              id: user.id.toString(),
              slug: (user as any).unique_id || createSlug(user.name),
            });
          } else {
            // use unique_id for fetching user details (fallback to numeric id)
            const uid = (user as any).unique_id || user.id.toString();
            navigateTo("user-detail", { id: uid });
          }
        }}
        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] active:bg-white/[0.04] transition-colors"
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800/50">
            <ImageWithPlaceholder
              src={user.image}
              alt={user.name}
              className="w-full h-full object-cover"
              type={user.type === "artist" ? "artist" : "song"}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0" dir="rtl">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-white truncate">
              {user.name}
            </span>
            <span className="text-[11px] bg-white/[0.03] text-gray-400 px-2 py-0.5 rounded-full shrink-0">
              {user.type === "artist" ? "هنرمند" : "کاربر"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">
            {user.type === "artist" ? "هنرمند" : "کاربر"} •{" "}
            {user.followers_count.toLocaleString("fa-IR")} دنبال‌کننده
          </p>
        </div>

        <button
          onClick={(e) => handleFollow(e)}
          className={cn(
            "px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 shrink-0",
            isFollowing
              ? "bg-white/[0.06] text-gray-400 border border-white/[0.1]"
              : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
          )}
        >
          {isFollowing ? "دنبال می‌کنید" : "دنبال کردن"}
        </button>
      </motion.div>
    );
  },
);
FollowerCard.displayName = "FollowerCard";

// ============================================================================
// Following Card
// ============================================================================
const FollowingCard = memo(
  ({
    artist,
    onUnfollow,
  }: {
    artist: UserFollowItem;
    onUnfollow: (id: number) => void;
  }) => {
    const { navigateTo } = useNavigation();
    const [isFollowing, setIsFollowing] = useState(artist.is_following);

    const handleUnfollow = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFollowing(!isFollowing);
        onUnfollow(artist.id);
      },
      [isFollowing, artist.id, onUnfollow],
    );

    return (
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => {
          if (artist.type === "artist") {
            navigateTo("artist-detail", {
              id: artist.id.toString(),
              slug: (artist as any).unique_id || createSlug(artist.name),
            });
          } else {
            const uid = (artist as any).unique_id || artist.id.toString();
            navigateTo("user-detail", { id: uid });
          }
        }}
        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] active:bg-white/[0.04] transition-colors cursor-pointer"
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800/50">
            <ImageWithPlaceholder
              src={artist.image}
              alt={artist.name}
              className="w-full h-full object-cover rounded-full bg-black"
              type={artist.type === "artist" ? "artist" : "song"}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0" dir="rtl">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-white truncate block">
              {artist.name}
            </span>
            <span className="text-[11px] bg-white/[0.03] text-gray-400 px-2 py-0.5 rounded-full shrink-0">
              {artist.type === "artist" ? "هنرمند" : "کاربر"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {artist.followers_count.toLocaleString("fa-IR")} دنبال‌کننده
          </p>
        </div>

        <button
          onClick={handleUnfollow}
          className={cn(
            "px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 shrink-0",
            isFollowing
              ? "bg-white/[0.06] text-gray-400 border border-white/[0.1]"
              : "bg-emerald-500 text-white",
          )}
        >
          {isFollowing ? "دنبال می‌کنید" : "دنبال کردن"}
        </button>
      </motion.div>
    );
  },
);
FollowingCard.displayName = "FollowingCard";

// ============================================================================
// Main Component
// ============================================================================
export default function FollowersFollowing({
  initialTab = "followers",
  uniqueId,
}: {
  initialTab?: TabType;
  uniqueId?: string;
}) {
  const { navigateTo } = useNavigation();
  const { user, accessToken, authenticatedFetch } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(!!uniqueId);

  // Data State
  const [followers, setFollowers] = useState<UserFollowItem[]>(
    !uniqueId ? user?.followers?.items || [] : [],
  );
  const [following, setFollowing] = useState<UserFollowItem[]>(
    !uniqueId ? user?.following?.items || [] : [],
  );
  const [followersMeta, setFollowersMeta] = useState({
    hasNext: !uniqueId ? user?.followers?.has_next || false : false,
    next: !uniqueId ? user?.followers?.next || null : null,
    total: !uniqueId ? user?.followers?.total || 0 : 0,
  });
  const [followingMeta, setFollowingMeta] = useState({
    hasNext: !uniqueId ? user?.following?.has_next || false : false,
    next: !uniqueId ? user?.following?.next || null : null,
    total: !uniqueId ? user?.following?.total || 0 : 0,
  });

  // --- Initial Fetch for Guest Profile ---
  useEffect(() => {
    if (!uniqueId) return;

    const fetchInitialData = async () => {
      setIsInitialLoading(true);
      try {
        const res = await authenticatedFetch(
          `https://api.sedabox.com/api/profile/u/${uniqueId}/?followers=1&following=1`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.followers) {
            setFollowers(data.followers.items || []);
            setFollowersMeta({
              hasNext: data.followers.has_next,
              next: data.followers.next,
              total: data.followers.total,
            });
          }
          if (data.following) {
            setFollowing(data.following.items || []);
            setFollowingMeta({
              hasNext: data.following.has_next,
              next: data.following.next,
              total: data.following.total,
            });
          }
        }
      } catch (err) {
        console.error("Initial fetch for guest profile failed", err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [uniqueId, authenticatedFetch]);

  // --- Follow / Unfollow Handler ---
  const handleToggleFollow = useCallback(
    async (id: number) => {
      if (!accessToken) {
        toast.error("ابتدا وارد شوید");
        return;
      }

      // store previous follower snapshot to allow revert on failure
      let prevFollower: UserFollowItem | undefined;

      // optimistic update: toggle is_following and adjust followers_count if present
      setFollowers((prev) => {
        prevFollower = prev.find((u) => u.id === id);
        return prev.map((u) =>
          u.id === id
            ? {
                ...u,
                is_following: !u.is_following,
                followers_count: !u.is_following
                  ? u.followers_count + 1
                  : Math.max(0, u.followers_count - 1),
              }
            : u,
        );
      });

      setFollowing((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, is_following: !u.is_following } : u,
        ),
      );

      try {
        const res = await authenticatedFetch(
          "https://api.sedabox.com/api/follow/",
          {
            method: "POST",
            body: JSON.stringify({ user_id: id }),
          },
        );

        if (!res.ok) throw new Error("Network response was not ok");

        const data = await res.json();
        const isNowFollowing = data.message === "followed";

        // reconcile state with server response
        setFollowers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  is_following: isNowFollowing,
                  followers_count:
                    (prevFollower
                      ? prevFollower.followers_count
                      : u.followers_count) + (isNowFollowing ? 1 : -1),
                }
              : u,
          ),
        );

        setFollowing((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, is_following: isNowFollowing } : u,
          ),
        );

        toast.success(isNowFollowing ? "دنبال شد" : "لغو دنبال کردن");
      } catch (err) {
        console.error("Follow toggle failed", err);
        toast.error("خطا در عملیات");

        // revert optimistic changes
        if (prevFollower) {
          setFollowers((prev) =>
            prev.map((u) => (u.id === id ? prevFollower! : u)),
          );
          setFollowing((prev) =>
            prev.map((u) =>
              u.id === id
                ? { ...u, is_following: prevFollower!.is_following }
                : u,
            ),
          );
        } else {
          setFollowers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, is_following: false } : u)),
          );
          setFollowing((prev) =>
            prev.map((u) => (u.id === id ? { ...u, is_following: false } : u)),
          );
        }
      }
    },
    [accessToken],
  );

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Ensure initial tab selection matches scroll position on mount
  useLayoutEffect(() => {
    if (!scrollContainerRef.current) return;
    const children = scrollContainerRef.current.children;
    if (children.length < 2) return;

    const targetIndex = initialTab === "following" ? 1 : 0;
    const target = children[targetIndex] as HTMLElement | undefined;
    if (!target) return;

    // mark programmatic scroll to avoid onScroll toggling active tab
    isProgrammaticScroll.current = true;
    target.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "start",
    });
    setActiveTab(initialTab);

    const t = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 120);

    return () => clearTimeout(t);
  }, [initialTab]);

  // --- Sync Data from Context ---
  useEffect(() => {
    if (uniqueId) return;
    if (user) {
      if (followers.length === 0 && user.followers?.items?.length) {
        setFollowers(user.followers.items);
        setFollowersMeta({
          hasNext: user.followers.has_next,
          next: user.followers.next,
          total: user.followers.total,
        });
      }
      if (following.length === 0 && user.following?.items?.length) {
        setFollowing(user.following.items);
        setFollowingMeta({
          hasNext: user.following.has_next,
          next: user.following.next,
          total: user.following.total,
        });
      }
    }
  }, [user, uniqueId, followers.length, following.length]);

  // --- Scroll & Swipe Handlers ---

  // Handle Tab Click (Programmatic Scroll)
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    if (scrollContainerRef.current) {
      isProgrammaticScroll.current = true;
      const width = scrollContainerRef.current.clientWidth;

      // In RTL:
      // Index 0 (Right side) -> Followers
      // Index 1 (Left side) -> Following
      // ScrollLeft goes negative or positive depending on browser in RTL.
      // We assume standard behavior: 0 is start (right), -width or width is end (left).

      const targetScroll = tab === "followers" ? 0 : -width; // Try negative for RTL

      // Check browser RTL scroll behavior (some use positive for left, some negative)
      // Safest approach: Element.scrollTo with behavior smooth
      // But we need to know direction.
      // Let's use logic: followers is 1st child, following is 2nd.
      // In RTL, 1st child is on right.
      // Scrolling to 0 usually reveals the right-most element in RTL.

      // Simpler approach for React Refs:
      const children = scrollContainerRef.current.children;
      if (children.length >= 2) {
        const targetElement = tab === "followers" ? children[0] : children[1];
        (targetElement as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
      }

      // Reset flag after animation
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 500);
    }
  };

  // Handle User Swipe (Scroll Event)
  const onScroll = useCallback(() => {
    if (isProgrammaticScroll.current || !scrollContainerRef.current) return;

    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const width = scrollContainerRef.current.clientWidth;

    // In RTL, scrollLeft is usually 0 at rightmost, and goes negative/positive towards left
    // We use Math.abs to handle cross-browser RTL differences
    const scrollRatio = Math.abs(scrollLeft) / width;

    // Threshold to switch tab highlight: 0.5
    const newTab = scrollRatio > 0.5 ? "following" : "followers";

    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [activeTab]);

  // --- Infinite Scroll Logic ---
  const loadMore = async () => {
    const nextUrl =
      activeTab === "followers" ? followersMeta.next : followingMeta.next;
    if (!nextUrl || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const cleanUrl = nextUrl.replace("http://", "https://");
      const res = await authenticatedFetch(cleanUrl);
      const data = await res.json();

      if (activeTab === "followers") {
        setFollowers((prev) => [...prev, ...data.followers.items]);
        setFollowersMeta({
          hasNext: data.followers.has_next,
          next: data.followers.next,
          total: data.followers.total,
        });
      } else {
        setFollowing((prev) => [...prev, ...data.following.items]);
        setFollowingMeta({
          hasNext: data.following.has_next,
          next: data.following.next,
          total: data.following.total,
        });
      }
    } catch (error) {
      console.error("Load more failed", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          const hasMore =
            activeTab === "followers"
              ? followersMeta.hasNext
              : followingMeta.hasNext;
          if (hasMore) loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [activeTab, followersMeta.hasNext, followingMeta.hasNext, isLoadingMore]);

  // --- Derived State ---
  const filteredFollowers = followers;

  const filteredFollowing = following;

  return (
    <div
      className="flex flex-col h-screen bg-[#030303] text-white font-sans overflow-hidden"
      dir="rtl"
    >
      {/* ================= HEADER ================= */}
      <div className="shrink-0 z-30 bg-[#030303]/95 backdrop-blur-xl border-b border-white/[0.04]">
        {/* Top Bar */}
        <div className="flex flex-row-reverse items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("profile")}
              className="active:scale-90 transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center">
                <Icon d={ICONS.back} className="w-5 h-5" />
              </div>
            </button>
          </div>
          <div className="w-10 h-10" />
        </div>

        {/* Tabs */}
        <div className="flex relative px-2">
          {["followers", "following"].map((tab) => {
            const isActive = activeTab === tab;
            const count =
              tab === "followers" ? followersMeta.total : followingMeta.total;
            const label =
              tab === "followers" ? "دنبال‌کنندگان" : "دنبال‌شده‌ها";

            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab as TabType)}
                className={cn(
                  "flex-1 py-3.5 relative text-sm font-medium transition-colors duration-300",
                  isActive ? "text-white" : "text-gray-500 hover:text-gray-300",
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{label}</span>
                  <span className="bg-white/[0.08] px-1.5 py-0.5 rounded text-[10px] text-gray-400">
                    {count.toLocaleString("fa-IR")}
                  </span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= SCROLLABLE CONTENT AREA ================= */}
      {/* 
         This container uses CSS Scroll Snap to act like a progressive swipe view.
         It has overflow-x: auto (horizontal scroll) and contains two full-width sections.
      */}
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        className="flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: "smooth" }} // Smooth scroll for clicks
      >
        {/* === PAGE 1: FOLLOWERS === */}
        <section className="w-full h-full shrink-0 snap-center overflow-y-auto pb-24">
          <div className="px-4 py-4 space-y-2 min-h-full">
            <AnimatePresence mode="popLayout">
              {filteredFollowers.length > 0
                ? filteredFollowers.map((user) => (
                    <FollowerCard
                      key={`follower-${user.id}`}
                      user={user}
                      onFollow={() => handleToggleFollow(user.id)}
                    />
                  ))
                : !isLoadingMore && <EmptyState type="followers" />}
            </AnimatePresence>

            {/* Observer Target for Infinite Scroll (Only if this tab is active) */}
            {activeTab === "followers" && (
              <div
                ref={observerRef}
                className="h-16 flex justify-center items-center"
              >
                {isLoadingMore && <LoadingSpinner />}
              </div>
            )}
          </div>
        </section>

        {/* === PAGE 2: FOLLOWING === */}
        <section className="w-full h-full shrink-0 snap-center overflow-y-auto pb-24">
          <div className="px-4 py-4 space-y-2 min-h-full">
            <AnimatePresence mode="popLayout">
              {filteredFollowing.length > 0
                ? filteredFollowing.map((artist) => (
                    <FollowingCard
                      key={`following-${artist.id}`}
                      artist={artist}
                      onUnfollow={() => handleToggleFollow(artist.id)}
                    />
                  ))
                : !isLoadingMore && <EmptyState type="following" />}
            </AnimatePresence>

            {/* Observer Target for Infinite Scroll (Only if this tab is active) */}
            {activeTab === "following" && (
              <div
                ref={observerRef}
                className="h-16 flex justify-center items-center"
              >
                {isLoadingMore && <LoadingSpinner />}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

const LoadingSpinner = () => (
  <div className="flex gap-1.5">
    <motion.div
      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1 }}
      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
    />
    <motion.div
      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
    />
    <motion.div
      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
    />
  </div>
);

const EmptyState = ({ type }: { type: "followers" | "following" }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-20 text-gray-500"
  >
    <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
      <Icon
        d={type === "followers" ? ICONS.userPlus : ICONS.userCheck}
        className="w-8 h-8 opacity-40"
      />
    </div>
    <p className="text-sm font-medium">
      {type === "followers"
        ? "هنوز کسی شما را دنبال نمی‌کند"
        : "هنوز کسی را دنبال نکرده‌اید"}
    </p>
  </motion.div>
);
