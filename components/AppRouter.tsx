import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { useResponsiveLayout } from "./ResponsiveLayout";
import { GuestProtectedPage } from "./GuestAccessContext";
import { clientTrace } from "../lib/clientDebug";
import {
  getRuntimeClientLanguage,
  getUserFacingErrorMessage,
} from "../lib/clientError";

// ── Generic page skeleton for dynamic loading ─────────────────────────────
const PageSkeleton = () => (
  <div className="w-full min-h-screen bg-[#0a0a0a] animate-pulse p-4">
    <div className="w-1/3 h-10 bg-zinc-800 rounded-lg mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64 bg-zinc-800/50 rounded-2xl" />
      <div className="h-64 bg-zinc-800/50 rounded-2xl" />
    </div>
  </div>
);

// ── Auth pages (small, loaded only when logged-out) ─────────────────────────
const Login = dynamic(() => import("./Login"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#0a0a0a]" />,
});
const Register = dynamic(() => import("./Register"), {
  ssr: false,
  loading: PageSkeleton,
});
const Verify = dynamic(() => import("./Verify"), {
  ssr: false,
  loading: PageSkeleton,
});
const ForgotPassword = dynamic(() => import("./ForgotPassword"), {
  ssr: false,
  loading: PageSkeleton,
});

// ── Core pages (most likely to be visited first) ────────────────────────────
const Home = dynamic(
  () => {
    const startedAt = performance.now();
    clientTrace("ROUTER", "home-chunk:load-start");
    return import("./home")
      .then((module) => {
        clientTrace("ROUTER", "home-chunk:load-success", {
          elapsedMs: Math.round(performance.now() - startedAt),
        });
        return module;
      })
      .catch((error) => {
        clientTrace("ROUTER", "home-chunk:load-failed", error, "error");
        throw error;
      });
  },
  {
    ssr: false,
    loading: () => {
      clientTrace("ROUTER", "home-chunk:loading-ui");
      return <PageSkeleton />;
    },
  },
);
const Search = dynamic(() => import("./Search"), {
  ssr: false,
  loading: PageSkeleton,
});
const LibraryScreen = dynamic(() => import("./LibraryScreen"), {
  ssr: false,
  loading: PageSkeleton,
});

// ── Detail pages ────────────────────────────────────────────────────────────
const SongDetail = dynamic(() => import("./SongDetail"), {
  ssr: false,
  loading: PageSkeleton,
});
const PlaylistDetail = dynamic(() => import("./PlaylistDetail"), {
  ssr: false,
  loading: PageSkeleton,
});
const UserPlaylistDetail = dynamic(() => import("./UserPlaylistDetail"), {
  ssr: false,
  loading: PageSkeleton,
});
const ArtistDetail = dynamic(() => import("./ArtistDetail"), {
  ssr: false,
  loading: PageSkeleton,
});
const ArtistSubPage = dynamic(() => import("./ArtistSubPage"), {
  ssr: false,
  loading: PageSkeleton,
});
const AlbumDetail = dynamic(() => import("./AlbumDetail"), {
  ssr: false,
  loading: PageSkeleton,
});
const UserDetail = dynamic(() => import("./UserDetail"), {
  ssr: false,
  loading: PageSkeleton,
});
const ChartPage = dynamic(() => import("./ChartPage"), {
  ssr: false,
  loading: PageSkeleton,
});
const GenrePage = dynamic(() => import("./GenrePage"), {
  ssr: false,
  loading: PageSkeleton,
});

// ── Profile & social ───────────────────────────────────────────────────────
const Profile = dynamic(() => import("./Profile"), {
  ssr: false,
  loading: PageSkeleton,
});
const DesktopProfile = dynamic(() => import("./DesktopProfile"), {
  ssr: false,
  loading: PageSkeleton,
});
const FollowersFollowing = dynamic(() => import("./FollowersFollowing"), {
  ssr: false,
  loading: PageSkeleton,
});
const FollowingArtistsPage = dynamic(() => import("./FollowingArtistsPage"), {
  ssr: false,
  loading: PageSkeleton,
});

// ── Library sub-pages ───────────────────────────────────────────────────────
const LikedSongs = dynamic(() => import("./LikedSongs"), {
  ssr: false,
  loading: PageSkeleton,
});
const LikedAlbums = dynamic(() => import("./LikedAlbums"), {
  ssr: false,
  loading: PageSkeleton,
});
const LikedPlaylists = dynamic(() => import("./LikedPlaylists"), {
  ssr: false,
  loading: PageSkeleton,
});
const MyPlaylists = dynamic(() => import("./MyPlaylists"), {
  ssr: false,
  loading: PageSkeleton,
});
const Playlists = dynamic(() => import("./Playlists"), {
  ssr: false,
  loading: PageSkeleton,
});
const DownloadsHistory = dynamic(() => import("./DownloadsHistory"), {
  ssr: false,
  loading: PageSkeleton,
});

// ── Discovery / browse pages ────────────────────────────────────────────────
const PopularArtistsPage = dynamic(() => import("./PopularArtistsPage"), {
  ssr: false,
  loading: PageSkeleton,
});
const LatestReleasesPage = dynamic(() => import("./LatestReleasesPage"), {
  ssr: false,
  loading: PageSkeleton,
});
const PopularAlbumsPage = dynamic(() => import("./PopularAlbumsPage"), {
  ssr: false,
  loading: PageSkeleton,
});
const NewDiscoveriesPage = dynamic(() => import("./NewDiscoveriesPage"), {
  ssr: false,
  loading: PageSkeleton,
});
const RecommendedPlaylistsPage = dynamic(
  () => import("./RecommendedPlaylistsPage"),
  { ssr: false, loading: PageSkeleton },
);
const ForYouPage = dynamic(() => import("./ForYouPage"), {
  ssr: false,
  loading: PageSkeleton,
});
const OtherUserPlaylists = dynamic(() => import("./OtherUserPlaylists"), {
  ssr: false,
  loading: PageSkeleton,
});

// ── Settings & payments ─────────────────────────────────────────────────────
const Settings = dynamic(() => import("./Settings"), {
  ssr: false,
  loading: PageSkeleton,
});
const Premium = dynamic(() => import("./Premium"), {
  ssr: false,
  loading: PageSkeleton,
});
const UpgradePlans = dynamic(() => import("./UpgradePlans"), {
  ssr: false,
  loading: PageSkeleton,
});
const PaymentProcessing = dynamic(() => import("./PaymentProcessing"), {
  ssr: false,
  loading: PageSkeleton,
});
const PaymentSuccess = dynamic(() => import("./PaymentSuccess"), {
  ssr: false,
  loading: PageSkeleton,
});

type HomeRouteErrorBoundaryProps = {
  children: React.ReactNode;
  routeKey: string;
};

type HomeRouteErrorBoundaryState = {
  error: Error | null;
};

class HomeRouteErrorBoundary extends React.Component<
  HomeRouteErrorBoundaryProps,
  HomeRouteErrorBoundaryState
> {
  state: HomeRouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): HomeRouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    clientTrace(
      "ROUTER",
      "home-render:crashed",
      { error, componentStack: info.componentStack },
      "error",
    );
  }

  componentDidUpdate(previousProps: HomeRouteErrorBoundaryProps) {
    if (previousProps.routeKey !== this.props.routeKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    const language = getRuntimeClientLanguage();
    const message = getUserFacingErrorMessage(this.state.error, language, {
      fa: "صفحه خانه به‌درستی بارگذاری نشد. لطفاً دوباره تلاش کنید.",
      en: "Home did not load correctly. Please try again.",
    });

    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/15 p-5 text-center">
          <h1 className="text-xl font-bold text-red-300">
            {language === "fa" ? "بارگذاری صفحه انجام نشد" : "Page could not be loaded"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
          >
            {language === "fa" ? "تلاش مجدد" : "Try again"}
          </button>
        </div>
      </div>
    );
  }
}

const AuthGateSkeleton = () => {
  useEffect(() => {
    const startedAt = performance.now();
    clientTrace("ROUTER", "auth-gate:waiting");
    const warningTimer = window.setTimeout(() => {
      clientTrace(
        "ROUTER",
        "auth-gate:still-waiting",
        { elapsedMs: Math.round(performance.now() - startedAt) },
        "warn",
      );
    }, 5000);

    return () => {
      window.clearTimeout(warningTimer);
      clientTrace("ROUTER", "auth-gate:released", {
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    };
  }, []);

  return <PageSkeleton />;
};

const renderHome = (routeKey: string) => (
  <HomeRouteErrorBoundary routeKey={routeKey}>
    <Home />
  </HomeRouteErrorBoundary>
);

export const AppRouter: React.FC = () => {
  const { currentPage, currentParams } = useNavigation();
  const { isLoggedIn, isInitializing } = useAuth();
  const { isDesktop } = useResponsiveLayout();

  useEffect(() => {
    clientTrace("ROUTER", "state", {
      currentPage,
      currentParams,
      isLoggedIn,
      isInitializing,
      isDesktop,
    });
  }, [currentPage, currentParams, isDesktop, isInitializing, isLoggedIn]);

  if (isInitializing) return <AuthGateSkeleton />;

  // Authentication pages are always reachable and keep the original public URL
  // stored by GuestAccessProvider for post-login continuation.
  switch (currentPage) {
    case "login":
      return isLoggedIn ? renderHome("login-redirect-home") : <Login />;
    case "register":
      return isLoggedIn ? renderHome("register-redirect-home") : <Register />;
    case "verify":
      return isLoggedIn ? renderHome("verify-redirect-home") : <Verify />;
    case "forgot-password":
      return isLoggedIn ? renderHome("forgot-password-redirect-home") : <ForgotPassword />;
  }

  const publicPages = new Set([
    "home",
    "search",
    "song-detail",
    "playlist-detail",
    "user-playlist-detail",
    "artist-detail",
    "artist-sub-page",
    "album-detail",
    "genre-detail",
    "popular-artists",
    "latest-releases",
    "popular-albums",
    "recommended-playlists",
    "chart-detail",
    "for-you",
    "new-discoveries",
    "user-detail",
    "other-user-playlists",
  ]);

  if (!isLoggedIn && !publicPages.has(currentPage)) {
    return <GuestProtectedPage />;
  }

  switch (currentPage) {
    case "home":
      return renderHome("home");
    case "song-detail":
      return <SongDetail id={currentParams?.id} />;
    case "search":
      return <Search />;
    case "library":
      return <LibraryScreen />;
    case "playlists":
      return <Playlists />;
    case "profile":
      return isDesktop ? <DesktopProfile /> : <Profile />;
    case "downloads-history":
      return <DownloadsHistory />;
    case "settings":
      return <Settings />;
    case "playlist-detail":
      return (
        <PlaylistDetail
          id={currentParams?.id}
          slug={currentParams?.slug}
          generatedBy={currentParams?.generatedBy}
          creatorUniqueId={currentParams?.creatorUniqueId}
          initialPlaylist={currentParams?.initialPlaylist}
        />
      );
    case "user-playlist-detail":
      return <UserPlaylistDetail id={currentParams?.id} isOwner={currentParams?.isOwner} />;
    case "artist-detail":
      return <ArtistDetail id={currentParams?.id} />;
    case "artist-sub-page":
      return <ArtistSubPage id={currentParams?.id} subPage={currentParams?.subPage} />;
    case "user-detail":
      return (
        <UserDetail
          uniqueId={currentParams?.uniqueId || currentParams?.id}
          dbId={currentParams?.dbId}
        />
      );
    case "album-detail":
      return <AlbumDetail id={currentParams?.id} slug={currentParams?.slug} album={currentParams?.album} />;
    case "followers-following":
      return <FollowersFollowing initialTab={currentParams?.tab || "followers"} uniqueId={currentParams?.uniqueId || currentParams?.id} />;
    case "liked-songs":
      return <LikedSongs />;
    case "liked-albums":
      return <LikedAlbums />;
    case "liked-playlists":
      return <LikedPlaylists />;
    case "premium":
      return <Premium />;
    case "followed-artists":
      return <FollowingArtistsPage />;
    case "my-playlists":
      return <MyPlaylists />;
    case "upgrade-plans":
      return <UpgradePlans />;
    case "payment-processing":
      return <PaymentProcessing />;
    case "payment-success":
      return <PaymentSuccess />;
    case "popular-artists":
      return <PopularArtistsPage />;
    case "latest-releases":
      return <LatestReleasesPage />;
    case "popular-albums":
      return <PopularAlbumsPage />;
    case "recommended-playlists":
      return <RecommendedPlaylistsPage />;
    case "new-discoveries":
      return <NewDiscoveriesPage />;
    case "for-you":
      return <ForYouPage />;
    case "other-user-playlists":
      return <OtherUserPlaylists uniqueId={currentParams?.uniqueId} fullName={currentParams?.fullName} />;
    case "chart-detail":
      return <ChartPage title={currentParams?.title} type={currentParams?.type} chartType={currentParams?.chartType} initialData={currentParams?.initialData} />;
    case "genre-detail":
      return <GenrePage id={currentParams?.id} name={currentParams?.name ?? ""} color={currentParams?.color} />;
    default:
      return renderHome(`default:${currentPage}`);
  }
};
