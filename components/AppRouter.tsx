import React, { useState, useEffect } from "react";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import Home from "./home";
import Login from "./Login";
import Register from "./Register";
import Verify from "./Verify";
import ForgotPassword from "./ForgotPassword";
import Search from "./Search";
import Playlists from "./Playlists";
import Profile from "./Profile";
import DesktopProfile from "./DesktopProfile";
import PlaylistDetail from "./PlaylistDetail";
import ArtistDetail from "./ArtistDetail";
import AlbumDetail from "./AlbumDetail";
import SongDetail from "./SongDetail";
import FollowersFollowing from "./FollowersFollowing";
import LikedSongs from "./LikedSongs";
import LikedAlbums from "./LikedAlbums";
import LikedPlaylists from "./LikedPlaylists";
import MyPlaylists from "./MyPlaylists";
import Settings from "./Settings";
import UpgradePlans from "./UpgradePlans";
import PaymentProcessing from "./PaymentProcessing";
import PaymentSuccess from "./PaymentSuccess";
import PopularArtistsPage from "./PopularArtistsPage";
import LatestReleasesPage from "./LatestReleasesPage";
import PopularAlbumsPage from "./PopularAlbumsPage";
import NewDiscoveriesPage from "./NewDiscoveriesPage";
import ChartPage from "./ChartPage";
import LibraryScreen from "./LibraryScreen";
import Premium from "./Premium";
import FollowingArtistsPage from "./FollowingArtistsPage";
import UserPlaylistDetail from "./UserPlaylistDetail";
import UserDetail from "./UserDetail";
import DownloadsHistory from "./DownloadsHistory";

export const AppRouter: React.FC = () => {
  const { currentPage, currentParams } = useNavigation();
  const { isLoggedIn } = useAuth();

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

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
  }

  // 1. Define Main Tabs to keep mounted in background (instant switching)
  const mainTabs = ["home", "search", "library", "premium", "profile"];

  // 2. Identify if current page is one of the "Other" (conditionally mounted) pages
  const isOtherPage = [
    "song-detail",
    "playlists",
    "downloads-history",
    "settings",
    "playlist-detail",
    "user-playlist-detail",
    "artist-detail",
    "user-detail",
    "album-detail",
    "followers-following",
    "liked-songs",
    "liked-albums",
    "liked-playlists",
    "followed-artists",
    "my-playlists",
    "upgrade-plans",
    "payment-processing",
    "payment-success",
    "popular-artists",
    "latest-releases",
    "popular-albums",
    "new-discoveries",
    "chart-detail",
  ].includes(currentPage);

  // Home is the default fallback if the page is unknown
  const showHome =
    currentPage === "home" ||
    (!mainTabs.includes(currentPage) && !isOtherPage);

  return (
    <div className="contents">
      {/* --- Keep-Alive Main Tabs --- */}
      <div style={{ display: showHome ? "contents" : "none" }}>
        <Home />
      </div>
      <div style={{ display: currentPage === "search" ? "contents" : "none" }}>
        <Search />
      </div>
      <div style={{ display: currentPage === "library" ? "contents" : "none" }}>
        <LibraryScreen />
      </div>
      <div style={{ display: currentPage === "premium" ? "contents" : "none" }}>
        <Premium />
      </div>
      <div style={{ display: currentPage === "profile" ? "contents" : "none" }}>
        {isDesktop ? <DesktopProfile /> : <Profile />}
      </div>

      {/* --- Conditionally Mounted Pages --- */}
      {isOtherPage && (
        <div className="contents">
          {(() => {
            switch (currentPage) {
              case "song-detail":
                return <SongDetail id={currentParams?.id} />;
              case "playlists":
                return <Playlists />;
              case "downloads-history":
                return <DownloadsHistory />;
              case "settings":
                return <Settings />;
              case "playlist-detail":
                return (
                  <PlaylistDetail
                    id={currentParams?.id}
                    slug={currentParams?.slug}
                  />
                );
              case "user-playlist-detail":
                return <UserPlaylistDetail id={currentParams?.id} />;
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
                  />
                );
              case "liked-songs":
                return <LikedSongs />;
              case "liked-albums":
                return <LikedAlbums />;
              case "liked-playlists":
                return <LikedPlaylists />;
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
              case "new-discoveries":
                return <NewDiscoveriesPage />;
              case "chart-detail":
                return (
                  <ChartPage
                    title={currentParams?.title}
                    type={currentParams?.type}
                    initialData={currentParams?.initialData}
                  />
                );
              default:
                return null;
            }
          })()}
        </div>
      )}
    </div>
  );
};


