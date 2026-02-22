"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  useRef,
  useMemo,
} from "react";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { usePlayer } from "./PlayerContext";
import { toast } from "react-hot-toast";

interface UserPlaylist {
  id: number;
  title: string;
  songs_count: number;
  likes_count: number;
  is_liked: boolean;
  top_three_song_covers: string[];
}

interface UserProfile {
  id: number;
  unique_id: string;
  first_name: string;
  last_name: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  plan?: string;
  user_playlists:
    | UserPlaylist[]
    | { count?: number; total?: number; next?: any; results?: UserPlaylist[] };
}

// Helpers: normalize user_playlists which may be an array or a paginated object
const getPlaylistsArray = (
  up: UserProfile["user_playlists"],
): UserPlaylist[] => {
  if (!up) return [];
  if (Array.isArray(up)) return up as UserPlaylist[];
  if ((up as any).results && Array.isArray((up as any).results))
    return (up as any).results as UserPlaylist[];
  return [];
};

const getPlaylistsCount = (up: UserProfile["user_playlists"]): number => {
  if (!up) return 0;
  if (Array.isArray(up)) return up.length;
  if (typeof (up as any).total === "number") return (up as any).total;
  if (typeof (up as any).count === "number") return (up as any).count;
  if ((up as any).results && Array.isArray((up as any).results))
    return (up as any).results.length;
  return 0;
};

/* ───────────────────────────────────────────
   CSS Keyframes injected once
   ─────────────────────────────────────────── */
const STYLE_ID = "user-detail-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes ud-fade-up {
      from { opacity: 0; transform: translate3d(0, 30px, 0); }
      to   { opacity: 1; transform: translate3d(0, 0, 0); }
    }
    @keyframes ud-scale-in {
      from { opacity: 0; transform: scale3d(0.85, 0.85, 1); }
      to   { opacity: 1; transform: scale3d(1, 1, 1); }
    }
    @keyframes ud-slide-right {
      from { opacity: 0; transform: translate3d(-40px, 0, 0); }
      to   { opacity: 1; transform: translate3d(0, 0, 0); }
    }
    @keyframes ud-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0;  }
    }
    @keyframes ud-ring-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(29,185,84,0.5); }
      50%      { box-shadow: 0 0 0 14px rgba(29,185,84,0); }
    }
    @keyframes ud-glow {
      0%, 100% { opacity: 0.4; }
      50%      { opacity: 0.7; }
    }
    @keyframes ud-float {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50%      { transform: translate3d(0, -6px, 0); }
    }
    @keyframes ud-counter {
      from { opacity: 0; transform: translate3d(0, 12px, 0) scale3d(0.8,0.8,1); }
      to   { opacity: 1; transform: translate3d(0, 0, 0) scale3d(1,1,1); }
    }
    @keyframes ud-btn-shine {
      from { left: -75%; }
      to   { left: 125%; }
    }
    .ud-card-enter {
      animation: ud-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .ud-avatar-enter {
      animation: ud-scale-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
    }
    .ud-info-enter {
      animation: ud-slide-right 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
    }
    .ud-stat-enter {
      animation: ud-counter 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
  `;
  document.head.appendChild(style);
}

/* ───────────────────────────────────────────
   Playlist Card
   ─────────────────────────────────────────── */
const UserPlaylistCard = memo(
  ({
    playlist,
    onClick,
    index,
  }: {
    playlist: UserPlaylist;
    onClick: () => void;
    index: number;
  }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
      const el = cardRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.15, rootMargin: "40px" },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div
        ref={cardRef}
        onClick={onClick}
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        className="ud-card-enter"
        style={{
          animationDelay: `${index * 70}ms`,
          opacity: isVisible ? undefined : 0,
          animationPlayState: isVisible ? "running" : "paused",
          willChange: "transform, opacity",
          contain: "layout style paint",
        }}
      >
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer select-none"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.15) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.07)",
            transform: isPressed ? "scale3d(0.96,0.96,1)" : "scale3d(1,1,1)",
            transition:
              "transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease",
            boxShadow: isPressed
              ? "0 4px 20px rgba(0,0,0,0.4)"
              : "0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {/* Cover art */}
          <div className="relative aspect-square overflow-hidden">
            <ImageWithPlaceholder
              src={playlist.top_three_song_covers}
              alt={playlist.title}
              className="w-full h-full object-cover"
              type="song"
            />
            {/* Overlay gradient */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)",
              }}
            />
            {/* Play button */}
            <button
              className="absolute bottom-3 right-3 w-11 h-11 rounded-full flex items-center justify-center shadow-xl"
              style={{
                background: "linear-gradient(135deg, #1db954 0%, #1ed760 100%)",
                opacity: 0,
                transform: "translate3d(0, 8px, 0)",
                transition:
                  "opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)",
              }}
              onMouseEnter={(e) => {
                const t = e.currentTarget;
                t.style.transform = "translate3d(0,0,0) scale3d(1.1,1.1,1)";
              }}
              onMouseLeave={(e) => {
                const t = e.currentTarget;
                t.style.transform = "translate3d(0, 8px, 0)";
              }}
            >
              <svg
                className="w-5 h-5 text-black ml-0.5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </button>
            {/* Song count badge */}
            <div
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide"
              style={{
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {playlist.songs_count} آهنگ
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <div
              className="font-bold text-white truncate text-[15px] leading-tight mb-1.5"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            >
              {playlist.title}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {typeof playlist.likes_count === "number" && (
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{
                      color: playlist.is_liked ? "#1db954" : "currentColor",
                    }}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{playlist.likes_count.toLocaleString("fa-IR")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover reveal play button with CSS parent hover */}
        <style jsx>{`
          div:hover button {
            opacity: 1 !important;
            transform: translate3d(0, 0, 0) !important;
          }
        `}</style>
      </div>
    );
  },
);

UserPlaylistCard.displayName = "UserPlaylistCard";

/* ───────────────────────────────────────────
   Stat Box
   ─────────────────────────────────────────── */
const StatBox = memo(
  ({
    label,
    value,
    delay,
  }: {
    label: string;
    value: string;
    delay: number;
  }) => {
    return (
      <div
        className="ud-stat-enter flex flex-col items-center justify-center py-4 px-6 rounded-2xl cursor-default select-none"
        style={{
          animationDelay: `${delay}ms`,
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.06)",
          willChange: "transform",
        }}
      >
        <span
          className="text-2xl md:text-3xl font-black tabular-nums"
          style={{
            background: "linear-gradient(135deg, #fff, #b3b3b3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {value}
        </span>
        <span className="text-xs md:text-sm text-zinc-400 mt-1 font-medium">
          {label}
        </span>
      </div>
    );
  },
);

StatBox.displayName = "StatBox";

/* ───────────────────────────────────────────
   Skeleton
   ─────────────────────────────────────────── */
const ProfileSkeleton = () => {
  const shimmerBg = useMemo(
    () =>
      "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)",
    [],
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #0d0d0d 40%)" }}
    >
      {/* Header skeleton */}
      <div className="relative px-6 md:px-10 pt-16 pb-8">
        <div className="flex flex-col items-center gap-6">
          <div
            className="w-36 h-36 md:w-48 md:h-48 rounded-full"
            style={{
              background: shimmerBg,
              backgroundSize: "800px 100%",
              animation: "ud-shimmer 1.5s ease-in-out infinite",
            }}
          />
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            <div
              className="h-5 w-24 rounded-full"
              style={{
                background: shimmerBg,
                backgroundSize: "800px 100%",
                animation: "ud-shimmer 1.5s ease-in-out infinite 0.1s",
              }}
            />
            <div
              className="h-10 md:h-14 w-3/4 rounded-xl"
              style={{
                background: shimmerBg,
                backgroundSize: "800px 100%",
                animation: "ud-shimmer 1.5s ease-in-out infinite 0.2s",
              }}
            />
            <div
              className="h-4 w-48 rounded-full"
              style={{
                background: shimmerBg,
                backgroundSize: "800px 100%",
                animation: "ud-shimmer 1.5s ease-in-out infinite 0.3s",
              }}
            />
          </div>
          {/* Stat skeletons */}
          <div className="flex gap-4 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-24 h-20 rounded-2xl"
                style={{
                  background: shimmerBg,
                  backgroundSize: "800px 100%",
                  animation: `ud-shimmer 1.5s ease-in-out infinite ${0.4 + i * 0.1}s`,
                }}
              />
            ))}
          </div>
          {/* Button skeleton */}
          <div
            className="h-12 w-40 rounded-full mt-2"
            style={{
              background: shimmerBg,
              backgroundSize: "800px 100%",
              animation: "ud-shimmer 1.5s ease-in-out infinite 0.7s",
            }}
          />
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="px-6 md:px-10 mt-8">
        <div
          className="h-8 w-48 rounded-lg mb-6"
          style={{
            background: shimmerBg,
            backgroundSize: "800px 100%",
            animation: "ud-shimmer 1.5s ease-in-out infinite 0.8s",
          }}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-2xl"
              style={{
                background: shimmerBg,
                backgroundSize: "800px 100%",
                animation: `ud-shimmer 1.5s ease-in-out infinite ${0.9 + i * 0.08}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────────────────────────
   Floating Particle (decorative)
   ─────────────────────────────────────────── */
const FloatingParticle = memo(
  ({
    size,
    x,
    y,
    delay,
  }: {
    size: number;
    x: number;
    y: number;
    delay: number;
  }) => (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background:
          "radial-gradient(circle, rgba(29,185,84,0.3), transparent 70%)",
        animation: `ud-float ${3 + Math.random() * 2}s ease-in-out infinite, ud-glow ${2 + Math.random() * 3}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: "transform, opacity",
        contain: "strict",
      }}
    />
  ),
);

FloatingParticle.displayName = "FloatingParticle";

/* ───────────────────────────────────────────
   Main Component
   ─────────────────────────────────────────── */
export default function UserDetail({ uniqueId }: { uniqueId?: string }) {
  const { navigateTo, goBack } = useNavigation();
  const { accessToken, authenticatedFetch } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [followAnimating, setFollowAnimating] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Particles data (memoized so they don't re-create)
  const particles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        size: 4 + Math.random() * 8,
        x: 10 + Math.random() * 80,
        y: 5 + Math.random() * 50,
        delay: Math.random() * 3,
      })),
    [],
  );

  // Scroll handler for parallax header
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setHeaderScrolled(container.scrollTop > 120);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!uniqueId) return;

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileUrl =
          uniqueId === "sedabox"
            ? `https://api.sedabox.com/api/profile/sedabox`
            : `https://api.sedabox.com/api/profile/u/${uniqueId}/`;
        const response = await authenticatedFetch(profileUrl);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else {
          toast.error("خطا در دریافت پروفایل");
        }
      } catch (error) {
        console.error("Fetch profile error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [uniqueId, accessToken]);

  const handleFollow = useCallback(async () => {
    if (!accessToken) {
      toast.error("ابتدا وارد شوید");
      return;
    }
    if (!profile) return;

    setIsFollowLoading(true);
    setFollowAnimating(true);
    try {
      const response = await authenticatedFetch(
        `https://api.sedabox.com/api/follow/`,
        {
          method: "POST",
          body: JSON.stringify({ user_id: profile.id }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const isNowFollowing = data.message === "followed";
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                is_following: isNowFollowing,
                followers_count: isNowFollowing
                  ? prev.followers_count + 1
                  : prev.followers_count - 1,
              }
            : null,
        );
        toast.success(isNowFollowing ? "دنبال شد ✨" : "لغو دنبال کردن");
      }
    } catch (error) {
      toast.error("خطا در عملیات");
    } finally {
      setIsFollowLoading(false);
      setTimeout(() => setFollowAnimating(false), 400);
    }
  }, [accessToken, profile]);

  if (isLoading) return <ProfileSkeleton />;
  if (!profile)
    return (
      <div
        className="min-h-screen flex items-center justify-center text-zinc-400 text-lg"
        style={{ background: "#0d0d0d" }}
      >
        پروفایل یافت نشد
      </div>
    );

  const fullName =
    `${profile.first_name} ${profile.last_name}`.trim() || profile.unique_id;

  const headerOpacity = headerScrolled ? 1 : 0;

  return (
    <div
      ref={scrollContainerRef}
      className="relative min-h-screen text-white overflow-y-auto overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)",
        WebkitOverflowScrolling: "touch",
      }}
      dir="rtl"
    >
      {/* Desktop Header */}
      <header className="hidden md:flex sticky relative top-0 z-50 h-16 items-center justify-center px-6 bg-zinc-900/80 backdrop-blur-xl">
        <span className="absolute left-1/2 transform -translate-x-1/2 text-lg font-bold text-white pointer-events-none">
          {fullName}
        </span>

        {/* Back button positioned absolutely to ensure it's at the far left */}
        <button
          onClick={goBack}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 5l-7 7 7 7"
            />
          </svg>
        </button>

        {/* placeholder to keep header balanced */}
        <div className="w-8" aria-hidden />
      </header>

      {/* Mobile Sticky Header */}
      <header
        className="md:hidden fixed flex-row-reverse top-0 inset-x-0 h-16 bg-black/20 backdrop-blur-xl flex items-center justify-between px-4 z-50 transition-all duration-250"
        style={{
          transform: headerScrolled ? "translateY(0)" : "translateY(-100%)",
          opacity: headerOpacity,
        }}
      >
        <button
          onClick={goBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
        >
          <svg
            className="w-6 h-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 18l-6-6 6-6"
            />
          </svg>
        </button>
        <span
          className="flex-1 px-4 text-base font-bold truncate"
          style={{ opacity: headerOpacity }}
        >
          {fullName}
        </span>
        <button
          onClick={handleFollow}
          className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-black transition hover:scale-105 hover:bg-green-400 active:scale-95"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 10v-3H4v3H1v2h3v3h2v-3h3v-2H6z" />
          </svg>
        </button>
      </header>

      {/* Mobile Back (shows when header hidden) */}
      <button
        onClick={goBack}
        className="fixed top-4 left-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center z-40 transition hover:bg-black/70"
        style={{
          opacity: headerScrolled ? 0 : 1,
          pointerEvents: headerScrolled ? "none" : "auto",
        }}
      >
        <svg
          className="w-6 h-6 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 18l-6-6 6-6"
          />
        </svg>
      </button>
      {/* ──── Ambient Background ──── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(29,185,84,0.08) 0%, transparent 70%)",
          willChange: "auto",
          contain: "strict",
        }}
      />

      {/* ──── Hero Section ──── */}
      <div
        className="relative pt-12 md:pt-20 pb-8 px-6 md:px-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(29,185,84,0.06) 0%, rgba(29,185,84,0.02) 30%, transparent 60%)",
        }}
      >
        {/* Floating particles */}
        {particles.map((p) => (
          <FloatingParticle key={p.id} {...p} />
        ))}

        {/* Center layout */}
        <div className="relative flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-6">
            {/* Glow ring */}
            <div
              className="absolute -inset-2 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, #1db954, #1ed760, #17a34a, #1db954)",
                opacity: 0.4,
                filter: "blur(8px)",
                animation: "ud-glow 3s ease-in-out infinite",
                willChange: "opacity",
              }}
            />
            {/* Avatar ring */}
            <div
              className="relative w-36 h-36 md:w-48 md:h-48 rounded-full p-[3px]"
              style={{
                background:
                  "conic-gradient(from 0deg, #1db954, #1ed760, #17a34a, #1db954)",
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900">
                <ImageWithPlaceholder
                  src=""
                  alt={fullName}
                  type="user"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* (verified badge removed) */}

            {/* Premium star badge (only for premium plan users) */}
            {profile.plan === "premium" && (
              <div
                aria-hidden
                className="absolute -top-2 -right-2 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #ffd54a, #ffb347)",
                  boxShadow: "0 6px 18px rgba(255,165,0,0.18)",
                  animation: "ud-glow 3s ease-in-out infinite",
                }}
              >
                <svg
                  className="w-4 h-4 text-black"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 .587l3.668 7.431L24 9.75l-6 5.848L19.336 24 12 19.897 4.664 24 6 15.598 0 9.75l8.332-1.732z" />
                </svg>
              </div>
            )}
          </div>

          {/* Profile badge */}
          <div
            className="ud-info-enter inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <span className="text-[11px] md:text-xs font-bold tracking-widest uppercase text-zinc-300">
              پروفایل
            </span>
            <span className="w-1 h-1 rounded-full bg-[#1db954]" />
            <span
              className="text-[11px] md:text-xs text-zinc-400 font-medium"
              dir="ltr"
            >
              @{profile.unique_id}
            </span>
          </div>

          {/* Name */}
          <h1
            className="ud-info-enter text-4xl md:text-6xl lg:text-7xl font-black mb-5 leading-tight"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #b3b3b3 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animationDelay: "0.35s",
            }}
          >
            {fullName}
          </h1>

          {/* Stats row */}
          <div className="flex items-center gap-3 md:gap-4 mb-8">
            <StatBox
              label="دنبال‌کننده"
              value={profile.followers_count.toLocaleString("fa-IR")}
              delay={500}
            />
            <StatBox
              label="دنبال‌شونده"
              value={profile.following_count.toLocaleString("fa-IR")}
              delay={600}
            />
            <StatBox
              label="پلی‌لیست"
              value={getPlaylistsCount(profile.user_playlists).toLocaleString(
                "fa-IR",
              )}
              delay={700}
            />
          </div>

          {/* Action buttons */}
          <div
            className="flex items-center gap-4"
            style={{ animationDelay: "800ms" }}
          >
            {/* Follow button */}
            <button
              onClick={handleFollow}
              disabled={isFollowLoading}
              className="relative overflow-hidden px-10 py-3.5 rounded-full text-sm font-bold tracking-wide transition-all select-none"
              style={{
                background: profile.is_following
                  ? "linear-gradient(135deg, #1db954 0%, #1ed760 100%)"
                  : "transparent",
                color: profile.is_following ? "#000" : "#fff",
                border: profile.is_following
                  ? "2px solid transparent"
                  : "2px solid rgba(255,255,255,0.3)",
                boxShadow: profile.is_following
                  ? "0 4px 24px rgba(29,185,84,0.4), 0 2px 8px rgba(29,185,84,0.2)"
                  : "none",
                transition:
                  "background 0.3s, border 0.3s, box-shadow 0.3s, opacity 0.2s",
                opacity: isFollowLoading ? 0.6 : 1,
              }}
            >
              {/* Shine effect on hover */}
              <span
                className="absolute top-0 h-full w-3/4 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                  left: "-75%",
                  animation: profile.is_following
                    ? "none"
                    : "ud-btn-shine 3s ease-in-out infinite",
                }}
              />
              <span className="relative z-10 flex items-center gap-2">
                {profile.is_following ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    دنبال شده
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    دنبال کردن
                  </>
                )}
              </span>
            </button>

            {/* Share button */}
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.transform = "scale3d(1.1,1.1,1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "scale3d(1,1,1)";
              }}
            >
              <svg
                className="w-5 h-5 text-zinc-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
              </svg>
            </button>

            {/* More button */}
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.transform = "scale3d(1.1,1.1,1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "scale3d(1,1,1)";
              }}
            >
              <svg
                className="w-5 h-5 text-zinc-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ──── Divider ──── */}
      <div className="px-6 md:px-10">
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* ──── Playlists Section ──── */}
      {getPlaylistsArray(profile.user_playlists).length > 0 && (
        <section className="px-6 md:px-10 pt-10 pb-32 md:pb-12">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-1 h-8 rounded-full"
              style={{
                background: "linear-gradient(180deg, #1db954, #1ed760)",
              }}
            />
            <h2
              className="text-2xl md:text-3xl font-black"
              style={{
                background: "linear-gradient(135deg, #fff 0%, #a3a3a3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              لیست‌های پخش عمومی
            </h2>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: "rgba(29,185,84,0.15)",
                color: "#1db954",
                border: "1px solid rgba(29,185,84,0.2)",
              }}
            >
              {getPlaylistsCount(profile.user_playlists).toLocaleString(
                "fa-IR",
              )}
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {getPlaylistsArray(profile.user_playlists).map(
              (playlist, index) => (
                <UserPlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  index={index}
                  onClick={() =>
                    navigateTo("user-playlist-detail", {
                      id: String(playlist.id),
                    })
                  }
                />
              ),
            )}
          </div>
        </section>
      )}

      {/* Empty state */}
      {getPlaylistsArray(profile.user_playlists).length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <svg
              className="w-10 h-10 text-zinc-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
            </svg>
          </div>
          <p className="text-zinc-400 text-base font-medium">
            هنوز پلی‌لیستی ایجاد نشده
          </p>
        </div>
      )}
    </div>
  );
}
