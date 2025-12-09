import React from "react";
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
import PlaylistDetail from "./PlaylistDetail";
import ArtistDetail from "./ArtistDetail";
import AlbumDetail from "./AlbumDetail";

const AppRouter: React.FC = () => {
  const { currentPage, currentParams } = useNavigation();
  const { isLoggedIn } = useAuth();

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
      case "search":
        return <Search />;
      case "playlists":
        return <Playlists />;
      case "profile":
        return <Profile />;
      case "playlist-detail":
        return <PlaylistDetail slug={currentParams?.slug} />;
      case "artist-detail":
        return <ArtistDetail slug={currentParams?.slug} />;
      case "album-detail":
        return (
          <AlbumDetail
            slug={currentParams?.slug}
            album={currentParams?.album}
          />
        );
      default:
        return <Home />;
    }
  }
};

export default AppRouter;
