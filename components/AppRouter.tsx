import React, { useState, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";

// Import Main Screens
import Home from "./home";
import Search from "./Search";
import LibraryScreen from "./LibraryScreen";
import Premium from "./Premium";
import Profile from "./Profile";
import DesktopProfile from "./DesktopProfile";

// Other screens (keep imports standard unless they are massive)
import Login from "./Login";
import Register from "./Register";
import Verify from "./Verify";
import ForgotPassword from "./ForgotPassword";
import Playlists from "./Playlists";
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
import FollowingArtistsPage from "./FollowingArtistsPage";
import UserPlaylistDetail from "./UserPlaylistDetail";
import UserDetail from "./UserDetail";
import DownloadsHistory from "./DownloadsHistory";

// ─────────────────────────────────────────────────────────────────────────────
// OPTIMIZED SCREEN COMPONENTS (MEMOIZED)
// ─────────────────────────────────────────────────────────────────────────────
const MemoHome = memo(Home);
const MemoSearch = memo(Search);
const MemoLibrary = memo(LibraryScreen);
const MemoPremium = memo(Premium);
const MemoProfile = memo(Profile);
const MemoDesktopProfile = memo(DesktopProfile);

/**
 * PersistentLayer renders core tabs once and keeps them in the DOM.
 * This makes switching between them absolutely instant.
 */
const PersistentLayer: React.FC<{
  activePage: string;
  isDesktop: boolean;
}> = memo(({ activePage, isDesktop }) => {
  return (
    <>
      <div
        className={activePage === "home" ? "contents" : "hidden"}
        aria-hidden={activePage !== "home"}
      >
        <MemoHome />
      </div>
      <div
        className={activePage === "search" ? "contents" : "hidden"}
        aria-hidden={activePage !== "search"}
      >
        <MemoSearch />
      </div>
      <div
        className={activePage === "library" ? "contents" : "hidden"}
        aria-hidden={activePage !== "library"}
      >
        <MemoLibrary />
      </div>
      <div
        className={activePage === "premium" ? "contents" : "hidden"}
        aria-hidden={activePage !== "premium"}
      >
        <MemoPremium />
      </div>
      <div
        className={activePage === "profile" ? "contents" : "hidden"}
        aria-hidden={activePage !== "profile"}
      >
        {isDesktop ? <MemoDesktopProfile /> : <MemoProfile />}
      </div>
    </>
  );
});

PersistentLayer.displayName = "PersistentLayer";

const AppRouter: React.FC = () => {
  const { currentPage, currentParams, navigationKey } = useNavigation();
  const { isLoggedIn } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(typeof window !== "undefined" && window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const PERSISTENT_PAGES = ["home", "search", "library", "premium", "profile"];
  const isPersistent = PERSISTENT_PAGES.includes(currentPage);

  // 1. Auth states - Keep simple and fast
  if (!isLoggedIn) {
    return (
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="w-full h-full bg-[#060606]"
        >
          {(() => {
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
          })()}
        </motion.div>
      </AnimatePresence>
    );
  }

  // 2. Main App - Optimized for maximum perceived speed
  return (
    <div className="relative w-full h-full min-h-screen">
      {/* PERSISTENT CORE TABS (Instant Switch) */}
      <PersistentLayer activePage={currentPage} isDesktop={isDesktop} />

      {/* DYNAMIC SUB-PAGES (Smooth Transition) */}
      <AnimatePresence mode="popLayout">
        {!isPersistent && (
          <motion.div
            key={navigationKey}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 35,
              mass: 0.8,
            }}
            className="fixed inset-0 z-10 w-full h-full bg-black md:relative"
            style={{
              willChange: "transform, opacity",
              transformTemplate: ({ x, opacity }: any) =>
                `translateX(${x}) translateZ(0)`,
            }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(AppRouter);


