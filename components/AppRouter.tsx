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
import RecommendedPlaylistsPage from "./RecommendedPlaylistsPage";
import ForYouPage from "./ForYouPage";
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
          <PlaylistDetail id={currentParams?.id} slug={currentParams?.slug} />
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
          <FollowersFollowing initialTab={currentParams?.tab || "followers"} />
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
