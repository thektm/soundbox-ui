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
import { slugify } from "../utils/share";
import { ResponsiveSheet } from "./ResponsiveSheet";
import { ReportModal } from "./ReportModal";

interface UserPlaylist {
  id: number;
  unique_id?: string;
  title: string;
  songs_count: number;
  likes_count: number;
  is_liked: boolean;
  top_three_song_covers: string[];
  generated_by?: "system" | "admin" | "audience";
  creator_unique_id?: string | null;
}

interface UserProfile {
  id: number;
  unique_id: string;
  first_name: string;
  last_name: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_yours?: boolean;
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
    layout = "grid",
  }: {
    playlist: UserPlaylist;
    onClick: () => void;
    index: number;
    layout?: "grid" | "list";
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

    if (layout === "list") {
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
            className="relative rounded-2xl overflow-hidden cursor-pointer select-none flex items-center"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.12) 100%)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.06)",
              transform: isPressed ? "scale3d(0.98,0.98,1)" : "scale3d(1,1,1)",
              transition:
                "transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease",
              boxShadow: isPressed
                ? "0 3px 14px rgba(0,0,0,0.3)"
                : "0 6px 20px rgba(0,0,0,0.2)",
              padding: "10px",
              gap: "12px",
            }}
          >
            <div
              className="flex-shrink-0 rounded-lg overflow-hidden"
              style={{ width: 84, height: 84 }}
            >
              <ImageWithPlaceholder
                src={playlist.top_three_song_covers}
                alt={playlist.title}
                className="w-full h-full object-cover"
                type="song"
              />
            </div>

            <div className="flex-1">
              <div
                className="font-bold text-white truncate text-base leading-tight"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
              >
                {playlist.title}
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <div>{playlist.songs_count} آهنگ</div>
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
        </div>
      );
    }

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
   Show More Button
   ─────────────────────────────────────────── */
const ShowMoreButton = memo(({ onClick }: { onClick: () => void }) => {
  return (
    <div
      className="flex justify-center w-full mt-12 mb-8 ud-card-enter"
      style={{ animationDelay: "0.5s" }}
    >
      <button
        onClick={onClick}
        className="group relative flex items-center gap-6 px-10 py-5 rounded-full transition-all duration-500 hover:scale-[1.03] active:scale-95 overflow-hidden backdrop-blur-3xl border border-white/10 shadow-2xl"
        style={{
          background:
            "linear-gradient(145deg, rgba(29,185,84,0.1) 0%, rgba(10,10,10,0.6) 100%)",
          boxShadow:
            "0 15px 35px -10px rgba(0,0,0,0.8), 0 0 20px -5px rgba(29,185,84,0.1)",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900/80 text-emerald-500 transition-all duration-700 group-hover:bg-emerald-500 group-hover:text-black group-hover:rotate-12">
          <svg
            className="w-6 h-6 transition-transform duration-500 group-hover:-translate-x-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </div>

        <div className="relative text-right">
          <div className="font-black text-white text-lg md:text-xl tracking-tight leading-tight">
            مشاهده همه پلی‌لیست‌ها
          </div>
          <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.3em] opacity-50 mt-1">
            Browse All Public Playlists
          </div>
        </div>
      </button>
    </div>
  );
});
ShowMoreButton.displayName = "ShowMoreButton";

/* ───────────────────────────────────────────
   Stat Box
   ─────────────────────────────────────────── */
const StatBox = memo(
  ({
    label,
    value,
    delay,
    onClick,
  }: {
    label: string;
    value: string;
    delay: number;
    onClick?: () => void;
  }) => {
    const Wrapper: any = onClick ? "button" : "div";
    return (
      <Wrapper
        onClick={onClick}
        type={onClick ? "button" : undefined}
        className={
          "ud-stat-enter flex flex-col items-center justify-center py-4 px-6 rounded-2xl select-none" +
          (onClick ? " cursor-pointer" : " cursor-default")
        }
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
      </Wrapper>
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
  const [optionsOpen, setOptionsOpen] = useState(false);
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
    if (!profile || profile.is_yours) return;

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

  const [reportOpen, setReportOpen] = useState(false);

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
          {profile && (profile as any).unique_id === "sedabox" && (
            <span
              title="تأیید شده"
              className="text-emerald-400 inline-block mr-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          )}
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
          {profile && (profile as any).unique_id === "sedabox" && (
            <span
              title="تأیید شده"
              className="text-emerald-400 inline-block mr-2 align-middle"
            >
              <svg
                className="w-4 h-4 inline-block"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          )}
        </span>
        <button
          onClick={handleFollow}
          disabled={profile.is_yours}
          className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-black transition hover:scale-105 hover:bg-green-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ filter: profile.is_yours ? "grayscale(1)" : "none" }}
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
        className="relative pt-12 md:pt-28 pb-8 px-6 md:px-10"
        style={{
          background:
            uniqueId === "sedabox"
              ? "linear-gradient(180deg, #1db95444 0%, #1db95422 40%, transparent 100%)"
              : "linear-gradient(180deg, rgba(29,185,84,0.06) 0%, rgba(29,185,84,0.02) 30%, transparent 60%)",
          minHeight: uniqueId === "sedabox" ? "360px" : "auto",
        }}
      >
        {/* Floating particles (hidden on sedabox desktop to look more official) */}
        {uniqueId !== "sedabox" &&
          particles.map((p) => <FloatingParticle key={p.id} {...p} />)}

        {/* Layout: centered on mobile, Spotify style on desktop */}
        <div className="relative flex flex-col items-center text-center md:grid md:grid-cols-[auto_1fr] md:items-end md:text-right md:gap-8">
          {/* Avatar Section */}
          <div className="relative mb-6 md:mb-0 shrink-0 md:justify-self-end md:mr-8">
            {/* Glow ring (mobile & non-sedabox) */}
            {uniqueId !== "sedabox" && (
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
            )}
            {/* Avatar ring */}
            <div
              className="relative w-36 h-36 md:w-56 md:h-56 rounded-full p-[3px] shadow-2xl"
              style={{
                background:
                  uniqueId === "sedabox"
                    ? "rgba(255,255,255,0.1)"
                    : "conic-gradient(from 0deg, #1db954, #1ed760, #17a34a, #1db954)",
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 shadow-inner">
                <ImageWithPlaceholder
                  src={
                    (profile &&
                      (profile as any).image_profile &&
                      (profile as any).image_profile.image) ||
                    ""
                  }
                  alt={fullName}
                  type="user"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col items-center md:items-start flex-1 overflow-hidden">
            {/* Profile label: visible on desktop, or mobile badge */}
            <div
              className="ud-info-enter hidden md:flex items-center gap-2 mb-1"
              style={{ animationDelay: "0.2s" }}
            >
              <span className="text-[11px] md:text-sm font-bold tracking-widest uppercase text-zinc-300">
                پروفایل
              </span>
            </div>

            {/* Mobile Badge (current design) */}
            <div
              className="ud-info-enter flex md:hidden items-center gap-2 px-4 py-1.5 rounded-full mb-3"
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
              className="ud-info-enter text-2xl md:text-3xl lg:text-4xl font-black mb-5 md:mb-6 leading-tight truncate w-full"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #b3b3b3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animationDelay: "0.35s",
              }}
            >
              {fullName}
              {profile && (profile as any).unique_id === "sedabox" && (
                <span
                  title="تأیید شده"
                  className="text-emerald-400 inline-block mr-2 align-middle"
                >
                  <svg
                    className="w-5 h-5 inline-block"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              )}
            </h1>

            {/* Desktop Stats & Actions row */}
            <div className="flex  flex-col md:flex-row items-center md:items-center gap-6 md:gap-4 w-full">
              {/* Stats group */}
              <div className="hidden md:flex items-center gap-3 md:gap-2 text-zinc-400 text-sm md:text-base font-medium">
                <button
                  onClick={() =>
                    navigateTo("followers-following", {
                      tab: "followers",
                      uniqueId: profile.unique_id,
                    })
                  }
                  className="flex items-center gap-1.5 bg-transparent border-0 p-0"
                >
                  <span className="text-white font-bold">
                    {profile.followers_count.toLocaleString("fa-IR")}
                  </span>
                  <span>دنبال‌کننده</span>
                </button>
                <span className="hidden md:inline text-zinc-600">•</span>
                <button
                  onClick={() =>
                    navigateTo("followers-following", {
                      tab: "following",
                      uniqueId: profile.unique_id,
                    })
                  }
                  className="flex items-center gap-1.5 bg-transparent border-0 p-0"
                >
                  <span className="text-white font-bold">
                    {profile.following_count.toLocaleString("fa-IR")}
                  </span>
                  <span>دنبال‌شونده</span>
                </button>
                <span className="hidden md:inline text-zinc-600">•</span>
                <button
                  onClick={() =>
                    navigateTo("other-user-playlists", {
                      uniqueId: profile.unique_id,
                      fullName: fullName,
                    })
                  }
                  className="flex items-center gap-1.5 bg-transparent border-0 p-0 hover:opacity-80 transition-opacity"
                >
                  <span className="text-white font-bold">
                    {getPlaylistsCount(profile.user_playlists).toLocaleString(
                      "fa-IR",
                    )}
                  </span>
                  <span>پلی‌لیست</span>
                </button>
              </div>

              {/* Action buttons (inline on desktop) */}
              <div className="hidden md:flex items-center gap-4 mr-auto">
                {/* Follow button */}
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading || profile.is_yours}
                  className="px-8 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all select-none whitespace-nowrap"
                  style={{
                    background: profile.is_yours
                      ? "rgba(255,255,255,0.1)"
                      : profile.is_following
                        ? "transparent"
                        : "linear-gradient(135deg, #1db954 0%, #1ed760 100%)",
                    color: profile.is_yours
                      ? "rgba(255,255,255,0.4)"
                      : profile.is_following
                        ? "#fff"
                        : "#000",
                    border: profile.is_yours
                      ? "1px solid rgba(255,255,255,0.1)"
                      : profile.is_following
                        ? "1px solid rgba(255,255,255,0.3)"
                        : "1px solid transparent",
                    opacity: isFollowLoading ? 0.6 : 1,
                    cursor: profile.is_yours ? "not-allowed" : "pointer",
                  }}
                >
                  {profile.is_yours
                    ? "پروفایل شما"
                    : profile.is_following
                      ? "دنبال شده"
                      : "دنبال کردن"}
                </button>

                {/* Report button (red) */}
                <button
                  onClick={() => setReportOpen(true)}
                  disabled={profile.is_yours}
                  aria-label="گزارش کاربر"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: profile.is_yours
                      ? "rgba(255,255,255,0.04)"
                      : "#ff4d4f",
                    opacity: profile.is_yours ? 0.6 : 1,
                    cursor: profile.is_yours ? "not-allowed" : "pointer",
                  }}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3 3v18l9-4 9 4V3H3zm13 9h-6V8h6v4z" />
                  </svg>
                </button>

                {/* Share button (desktop) - same icon/behavior as mobile */}
                <button
                  aria-label="اشتراک‌گذاری پروفایل"
                  onClick={async () => {
                    const shareUrl =
                      typeof window !== "undefined" && window.location
                        ? window.location.href
                        : `${typeof window !== "undefined" ? window.location.origin : "https://sedabox.com"}/u/${profile.unique_id}/${slugify(fullName)}`;
                    try {
                      if (
                        typeof navigator !== "undefined" &&
                        (navigator as any).clipboard
                      ) {
                        await (navigator as any).clipboard.writeText(shareUrl);
                        toast.success("لینک کپی شد");
                      } else if (typeof document !== "undefined") {
                        const ta = document.createElement("textarea");
                        ta.value = shareUrl;
                        ta.style.position = "fixed";
                        ta.style.left = "-9999px";
                        document.body.appendChild(ta);
                        ta.select();
                        try {
                          document.execCommand("copy");
                          toast.success("لینک کپی شد");
                        } catch (e) {
                          toast.error("اشتراک‌گذاری ممکن نیست");
                        }
                        document.body.removeChild(ta);
                      } else {
                        toast.error("اشتراک‌گذاری ممکن نیست");
                      }
                    } catch (e) {
                      toast.error("اشتراک‌گذاری ممکن نیست");
                    }
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <svg
                    className="w-4 h-4 text-zinc-300"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                  </svg>
                </button>

                {/* More button */}
                <button
                  onClick={() => setOptionsOpen(true)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700/50"
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

            {/* Mobile-only Stats Boxes & Actions - we remove them from main flow but keep them for mobile */}
            <div className="flex md:hidden flex-col items-center">
              {/* Stats row */}
              <div className="flex items-center gap-3 md:gap-4 mb-8">
                <StatBox
                  label="دنبال‌کننده"
                  value={profile.followers_count.toLocaleString("fa-IR")}
                  delay={500}
                  onClick={() =>
                    navigateTo("followers-following", {
                      tab: "followers",
                      uniqueId: profile.unique_id,
                    })
                  }
                />
                <StatBox
                  label="دنبال‌شونده"
                  value={profile.following_count.toLocaleString("fa-IR")}
                  delay={600}
                  onClick={() =>
                    navigateTo("followers-following", {
                      tab: "following",
                      uniqueId: profile.unique_id,
                    })
                  }
                />
                <StatBox
                  label="پلی‌لیست"
                  value={getPlaylistsCount(
                    profile.user_playlists,
                  ).toLocaleString("fa-IR")}
                  delay={700}
                  onClick={() =>
                    navigateTo("other-user-playlists", {
                      uniqueId: profile.unique_id,
                      fullName: fullName,
                    })
                  }
                />
              </div>

              {/* Mobile Action buttons */}
              <div
                className="flex items-center gap-4"
                style={{ animationDelay: "800ms" }}
              >
                {/* Follow button */}
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading || profile.is_yours}
                  className="relative overflow-hidden px-10 py-3.5 rounded-full text-sm font-bold tracking-wide transition-all select-none whitespace-nowrap"
                  style={{
                    background: profile.is_yours
                      ? "rgba(255,255,255,0.06)"
                      : profile.is_following
                        ? "linear-gradient(135deg, #1db954 0%, #1ed760 100%)"
                        : "transparent",
                    color: profile.is_yours
                      ? "rgba(255,255,255,0.4)"
                      : profile.is_following
                        ? "#000"
                        : "#fff",
                    border: profile.is_yours
                      ? "2px solid rgba(255,255,255,0.08)"
                      : profile.is_following
                        ? "2px solid transparent"
                        : "2px solid rgba(255,255,255,0.3)",
                    boxShadow: profile.is_yours
                      ? "none"
                      : profile.is_following
                        ? "0 4px 24px rgba(29,185,84,0.4), 0 2px 8px rgba(29,185,84,0.2)"
                        : "none",
                    transition:
                      "background 0.3s, border 0.3s, box-shadow 0.3s, opacity 0.2s",
                    opacity: isFollowLoading ? 0.6 : 1,
                    cursor: profile.is_yours ? "not-allowed" : "pointer",
                  }}
                >
                  {/* Shine effect on hover */}
                  <span
                    className="absolute top-0 h-full w-3/4 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                      left: "-75%",
                      animation:
                        profile.is_following || profile.is_yours
                          ? "none"
                          : "ud-btn-shine 3s ease-in-out infinite",
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    {profile.is_yours ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08s5.97 1.09 6 3.08c-1.29 1.94-3.5 3.22-6 3.22z" />
                        </svg>
                        پروفایل شما
                      </>
                    ) : profile.is_following ? (
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
                  aria-label="اشتراک‌گذاری پروفایل"
                  onClick={async () => {
                    const shareUrl =
                      typeof window !== "undefined" && window.location
                        ? window.location.href
                        : `${window.location.origin}/u/${profile.unique_id}/${slugify(fullName)}`;
                    try {
                      if (
                        typeof navigator !== "undefined" &&
                        (navigator as any).clipboard
                      ) {
                        await (navigator as any).clipboard.writeText(shareUrl);
                        toast.success("لینک کپی شد");
                      } else if (typeof document !== "undefined") {
                        const ta = document.createElement("textarea");
                        ta.value = shareUrl;
                        ta.style.position = "fixed";
                        ta.style.left = "-9999px";
                        document.body.appendChild(ta);
                        ta.select();
                        try {
                          document.execCommand("copy");
                          toast.success("لینک کپی شد");
                        } catch (e) {
                          toast.error("اشتراک‌گذاری ممکن نیست");
                        }
                        document.body.removeChild(ta);
                      } else {
                        toast.error("اشتراک‌گذاری ممکن نیست");
                      }
                    } catch (e) {
                      toast.error("اشتراک‌گذاری ممکن نیست");
                    }
                  }}
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
                {/* Report button (mobile) */}
                <button
                  onClick={() => setReportOpen(true)}
                  disabled={profile.is_yours}
                  aria-label="گزارش کاربر"
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: profile.is_yours
                      ? "rgba(255,255,255,0.06)"
                      : "#ff4d4f",
                    border: "1px solid rgba(0,0,0,0.08)",
                    opacity: profile.is_yours ? 0.6 : 1,
                    cursor: profile.is_yours ? "not-allowed" : "pointer",
                  }}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3 3v18l9-4 9 4V3H3zm13 9h-6V8h6v4z" />
                  </svg>
                </button>

                {/* More button */}
                <button
                  onClick={() => setOptionsOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={optionsOpen}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
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
          <div
            className="flex items-center gap-3 mb-8 cursor-pointer group"
            onClick={() =>
              navigateTo("other-user-playlists", {
                uniqueId: profile.unique_id,
                fullName: fullName,
              })
            }
          >
            <div
              className="w-1 h-8 rounded-full"
              style={{
                background: "linear-gradient(180deg, #1db954, #1ed760)",
              }}
            />
            <h2
              className="text-2xl md:text-3xl font-black group-hover:text-emerald-400 transition-colors"
              style={{
                background: "linear-gradient(135deg, #fff 0%, #a3a3a3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
            پلی لیست های عمومی
            </h2>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold transition-all group-hover:scale-110"
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

          {/* Mobile: vertical list (wide, low-height product-style cards) */}
          <div className="flex flex-col md:hidden gap-4">
            {getPlaylistsArray(profile.user_playlists)
              .slice(0, 6)
              .map((playlist, index) => (
                <UserPlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  index={index}
                  layout="list"
                  onClick={() => {
                    if (uniqueId === "sedabox") {
                      const isSystemGenerated =
                        playlist.generated_by === "system";
                      const idToUse = isSystemGenerated
                        ? playlist.unique_id || String(playlist.id)
                        : String(playlist.id);

                      navigateTo("playlist-detail", {
                        id: idToUse,
                        generatedBy: playlist.generated_by,
                        creatorUniqueId: playlist.creator_unique_id,
                        slug: slugify(playlist.title),
                      });
                    } else {
                      navigateTo("user-playlist-detail", {
                        id: String(playlist.id),
                      });
                    }
                  }}
                />
              ))}
          </div>

          {/* Desktop & tablet: keep existing grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:md:grid-cols-3 md:gap-5">
            {getPlaylistsArray(profile.user_playlists)
              .slice(0, 6)
              .map((playlist, index) => (
                <UserPlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  index={index}
                  onClick={() => {
                    if (uniqueId === "sedabox") {
                      const isSystemGenerated =
                        playlist.generated_by === "system";
                      const idToUse = isSystemGenerated
                        ? playlist.unique_id || String(playlist.id)
                        : String(playlist.id);

                      navigateTo("playlist-detail", {
                        id: idToUse,
                        generatedBy: playlist.generated_by,
                        creatorUniqueId: playlist.creator_unique_id,
                        slug: slugify(playlist.title),
                      });
                    } else {
                      navigateTo("user-playlist-detail", {
                        id: String(playlist.id),
                      });
                    }
                  }}
                />
              ))}
          </div>

          {getPlaylistsArray(profile.user_playlists).length > 6 && (
            <ShowMoreButton
              onClick={() =>
                navigateTo("other-user-playlists", {
                  uniqueId: profile.unique_id,
                  fullName: fullName,
                })
              }
            />
          )}
        </section>
      )}

      {/* Options: responsive sheet on mobile, modal on desktop */}
      {optionsOpen && (
        <>
          {/* Desktop modal */}
          <div className="hidden md:flex fixed inset-0 items-center justify-center z-60">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setOptionsOpen(false)}
            />
            <div
              className="relative w-full max-w-sm rounded-2xl p-4 bg-zinc-900 border border-zinc-800"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    if (profile.is_yours) return;
                    await handleFollow();
                    setOptionsOpen(false);
                  }}
                  disabled={isFollowLoading || profile.is_yours}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed truncate"
                >
                  {profile.is_yours
                    ? "این پروفایل خودتان است"
                    : profile.is_following
                      ? "لغو دنبال کردن"
                      : "دنبال کردن"}
                </button>

                <button
                  onClick={async () => {
                    const shareUrl =
                      typeof window !== "undefined" && window.location
                        ? window.location.href
                        : `${window.location.origin}/u/${profile.unique_id}/${slugify(fullName)}`;
                    try {
                      if (
                        typeof navigator !== "undefined" &&
                        (navigator as any).clipboard
                      ) {
                        await (navigator as any).clipboard.writeText(shareUrl);
                        toast.success("لینک کپی شد");
                      } else if (typeof document !== "undefined") {
                        const ta = document.createElement("textarea");
                        ta.value = shareUrl;
                        ta.style.position = "fixed";
                        ta.style.left = "-9999px";
                        document.body.appendChild(ta);
                        ta.select();
                        try {
                          document.execCommand("copy");
                          toast.success("لینک کپی شد");
                        } catch (e) {
                          toast.error("اشتراک‌گذاری ممکن نیست");
                        }
                        document.body.removeChild(ta);
                      } else {
                        toast.error("اشتراک‌گذاری ممکن نیست");
                      }
                    } catch (e) {
                      toast.error("اشتراک‌گذاری ممکن نیست");
                    }
                    setOptionsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition truncate"
                >
                  اشتراک گذاری پروفایل
                </button>
                <button
                  onClick={async () => {
                    if (profile.is_yours) return;
                    setReportOpen(true);
                    setOptionsOpen(false);
                  }}
                  disabled={profile.is_yours}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  گزارش کاربر
                </button>
              </div>
            </div>
          </div>

          {/* Mobile sheet using ResponsiveSheet component */}
          <ResponsiveSheet
            isOpen={optionsOpen}
            onClose={() => setOptionsOpen(false)}
          >
            <div className="p-4">
              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    if (profile.is_yours) return;
                    await handleFollow();
                    setOptionsOpen(false);
                  }}
                  disabled={isFollowLoading || profile.is_yours}
                  className="w-full text-right px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed truncate"
                >
                  {profile.is_yours
                    ? "این پروفایل خودتان است"
                    : profile.is_following
                      ? "لغو دنبال کردن"
                      : "دنبال کردن"}
                </button>

                <button
                  onClick={async () => {
                    const shareUrl =
                      typeof window !== "undefined" && window.location
                        ? window.location.href
                        : `${window.location.origin}/u/${profile.unique_id}/${slugify(fullName)}`;
                    try {
                      if (
                        typeof navigator !== "undefined" &&
                        (navigator as any).clipboard
                      ) {
                        await (navigator as any).clipboard.writeText(shareUrl);
                        toast.success("لینک کپی شد");
                      } else if (typeof document !== "undefined") {
                        const ta = document.createElement("textarea");
                        ta.value = shareUrl;
                        ta.style.position = "fixed";
                        ta.style.left = "-9999px";
                        document.body.appendChild(ta);
                        ta.select();
                        try {
                          document.execCommand("copy");
                          toast.success("لینک کپی شد");
                        } catch (e) {
                          toast.error("اشتراک‌گذاری ممکن نیست");
                        }
                        document.body.removeChild(ta);
                      } else {
                        toast.error("اشتراک‌گذاری ممکن نیست");
                      }
                    } catch (e) {
                      toast.error("اشتراک‌گذاری ممکن نیست");
                    }
                    setOptionsOpen(false);
                  }}
                  className="w-full text-right px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 truncate"
                >
                  اشتراک گذاری پروفایل
                </button>
                <button
                  onClick={async () => {
                    if (profile.is_yours) return;
                    setReportOpen(true);
                    setOptionsOpen(false);
                  }}
                  disabled={profile.is_yours}
                  className="w-full text-right px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  گزارش کاربر
                </button>
              </div>
            </div>
          </ResponsiveSheet>
        </>
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetId={profile.id}
        targetType="user"
        targetTitle={fullName}
      />

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

      {/* Bottom info for own profile */}
      {profile.is_yours && (
        <div
          className="fixed bottom-24 inset-x-6 z-[60] animate-ud-fade-up"
          style={{ animationDuration: "0.8s" }}
        >
          <div
            className="mx-auto max-w-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-3 shadow-2xl"
            style={{
              background: "rgba(24, 24, 27, 0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#1db954]" />
            <span className="text-sm font-bold text-zinc-100">
              این ظاهر پروفایل شما برای دیگران است
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
