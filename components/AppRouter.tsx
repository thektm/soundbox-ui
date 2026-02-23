import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { useResponsiveLayout } from "./ResponsiveLayout";

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
const Register = dynamic(() => import("./Register"), { ssr: false });
const Verify = dynamic(() => import("./Verify"), { ssr: false });
const ForgotPassword = dynamic(() => import("./ForgotPassword"), {
  ssr: false,
});

// ── Core pages (most likely to be visited first) ────────────────────────────
const Home = dynamic(() => import("./home"), {
  ssr: false,
  loading: PageSkeleton,
});
const Search = dynamic(() => import("./Search"), {
  ssr: false,
  loading: PageSkeleton,
});
const LibraryScreen = dynamic(() => import("./LibraryScreen"), {
  ssr: false,
  loading: PageSkeleton,
});

// ── Detail pages ────────────────────────────────────────────────────────────
const SongDetail = dynamic(() => import("./SongDetail"), { ssr: false });
const PlaylistDetail = dynamic(() => import("./PlaylistDetail"), {
  ssr: false,
});
const UserPlaylistDetail = dynamic(() => import("./UserPlaylistDetail"), {
  ssr: false,
});
const ArtistDetail = dynamic(() => import("./ArtistDetail"), { ssr: false });
const AlbumDetail = dynamic(() => import("./AlbumDetail"), { ssr: false });
const UserDetail = dynamic(() => import("./UserDetail"), { ssr: false });
const ChartPage = dynamic(() => import("./ChartPage"), { ssr: false });

// ── Profile & social ───────────────────────────────────────────────────────
const Profile = dynamic(() => import("./Profile"), { ssr: false });
const DesktopProfile = dynamic(() => import("./DesktopProfile"), {
  ssr: false,
});
const FollowersFollowing = dynamic(() => import("./FollowersFollowing"), {
  ssr: false,
});
const FollowingArtistsPage = dynamic(() => import("./FollowingArtistsPage"), {
  ssr: false,
});

// ── Library sub-pages ───────────────────────────────────────────────────────
const LikedSongs = dynamic(() => import("./LikedSongs"), { ssr: false });
const LikedAlbums = dynamic(() => import("./LikedAlbums"), { ssr: false });
const LikedPlaylists = dynamic(() => import("./LikedPlaylists"), {
  ssr: false,
});
const MyPlaylists = dynamic(() => import("./MyPlaylists"), { ssr: false });
const Playlists = dynamic(() => import("./Playlists"), { ssr: false });
const DownloadsHistory = dynamic(() => import("./DownloadsHistory"), {
  ssr: false,
});

// ── Discovery / browse pages ────────────────────────────────────────────────
const PopularArtistsPage = dynamic(() => import("./PopularArtistsPage"), {
  ssr: false,
});
const LatestReleasesPage = dynamic(() => import("./LatestReleasesPage"), {
  ssr: false,
});
const PopularAlbumsPage = dynamic(() => import("./PopularAlbumsPage"), {
  ssr: false,
});
const NewDiscoveriesPage = dynamic(() => import("./NewDiscoveriesPage"), {
  ssr: false,
});
const RecommendedPlaylistsPage = dynamic(
  () => import("./RecommendedPlaylistsPage"),
  { ssr: false },
);
const ForYouPage = dynamic(() => import("./ForYouPage"), { ssr: false });

// ── Settings & payments ─────────────────────────────────────────────────────
const Settings = dynamic(() => import("./Settings"), { ssr: false });
const Premium = dynamic(() => import("./Premium"), {
  ssr: false,
  loading: PageSkeleton,
});
const UpgradePlans = dynamic(() => import("./UpgradePlans"), { ssr: false });
const PaymentProcessing = dynamic(() => import("./PaymentProcessing"), {
  ssr: false,
});
const PaymentSuccess = dynamic(() => import("./PaymentSuccess"), {
  ssr: false,
});

export const AppRouter: React.FC = () => {
  const { currentPage, currentParams } = useNavigation();
  const { isLoggedIn } = useAuth();
  const { isDesktop } = useResponsiveLayout();

  if (!isLoggedIn) {
    switch (currentPage) {
      case "login":
        return <Login />;
      case "register":
        return <Register />;
      case "verify":
        return <Verify />;
      case "forgot-password":
        return <ForgotPassword />;
      default:
        return <Login />;
    }
  } else {
    switch (currentPage) {
      case "home":
        return <Home />;
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
          />
        );
      case "user-playlist-detail":
        return (
          <UserPlaylistDetail
            id={currentParams?.id}
            isOwner={currentParams?.isOwner}
          />
        );
      case "artist-detail":
        return <ArtistDetail id={currentParams?.id} />;
      case "user-detail":
        return <UserDetail uniqueId={currentParams?.id} />;
      case "album-detail":
        return (
          <AlbumDetail
            id={currentParams?.id}
            slug={currentParams?.slug}
            album={currentParams?.album}
          />
        );
      case "followers-following":
        return (
          <FollowersFollowing
            initialTab={currentParams?.tab || "followers"}
            uniqueId={currentParams?.uniqueId || currentParams?.id}
          />
        );
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
      case "chart-detail":
        return (
          <ChartPage
            title={currentParams?.title}
            type={currentParams?.type}
            initialData={currentParams?.initialData}
          />
        );
      default:
        return <Home />;
    }
  }
};
