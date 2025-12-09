"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { useNavigation } from "./NavigationContext";
import { USER_PLAYLISTS, UserPlaylist, createSlug } from "./mockData";

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
        strokeWidth={filled ? 0 : 2}
        d={d}
      />
    </svg>
  )
);

Icon.displayName = "Icon";

// ============================================================================
// View Mode Type
// ============================================================================
type ViewMode = "grid" | "list";
const ICONS = {
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  plus: "M12 4v16m8-8H4",
  play: "M5 3l14 9-14 9V3z",
  folder:
    "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  close: "M6 18L18 6M6 6l12 12",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  moreVertical:
    "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  globe:
    "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  list: "M4 6h16M4 10h16M4 14h16M4 18h16",
};

// ============================================================================
// Create Playlist Modal
// ============================================================================
const CreatePlaylistModal = memo(
  ({
    isOpen,
    onClose,
    onCreate,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, isPublic: boolean) => void;
  }) => {
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    const handleCreate = useCallback(() => {
      if (name.trim()) {
        onCreate(name.trim(), isPublic);
        setName("");
        setIsPublic(true);
        onClose();
      }
    }, [name, isPublic, onCreate, onClose]);

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative p-6 pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Icon d={ICONS.plus} className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white text-center">
                پلی‌لیست جدید
              </h2>
              <p className="text-gray-400 text-sm text-center mt-1">
                یک پلی‌لیست جدید بسازید
              </p>
            </div>

            {/* Form */}
            <div className="px-6 pb-6 space-y-4" dir="rtl">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  نام پلی‌لیست
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="پلی‌لیست من..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  autoFocus
                />
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isPublic ? "bg-emerald-500/20" : "bg-gray-500/20"
                    }`}
                  >
                    <Icon
                      d={isPublic ? ICONS.globe : ICONS.lock}
                      className={`w-5 h-5 ${
                        isPublic ? "text-emerald-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white">
                      {isPublic ? "عمومی" : "خصوصی"}
                    </span>
                    <p className="text-xs text-gray-500">
                      {isPublic ? "همه می‌توانند ببینند" : "فقط شما می‌بینید"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                    isPublic ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      isPublic ? "right-1" : "right-6"
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:bg-white/10 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="flex-1 py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ایجاد
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

CreatePlaylistModal.displayName = "CreatePlaylistModal";

// ============================================================================
// Playlist Card Component - Optimized
// ============================================================================
// ============================================================================
// Random Gradients for Grid Cards
// ============================================================================
const GRID_GRADIENTS = [
  "from-pink-500 to-rose-500",
  "from-purple-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-teal-500 to-green-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-yellow-500 to-orange-500",
  "from-violet-500 to-purple-500",
];

const getRandomGradient = (id: string) => {
  const index =
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    GRID_GRADIENTS.length;
  return GRID_GRADIENTS[index];
};

// ============================================================================
// Playlist Card Component - Grid View
// ============================================================================
const PlaylistCardGrid = memo(
  ({
    playlist,
    onPress,
    onEdit,
    onDelete,
  }: {
    playlist: UserPlaylist;
    onPress: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }) => {
    return (
      <div
        onClick={onPress}
        className="group cursor-pointer active:scale-[0.97] transition-transform duration-150"
        style={{ willChange: "transform" }}
      >
        {/* Playlist Cover Container */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800/50 shadow-lg mb-3">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${getRandomGradient(
              playlist.id
            )} opacity-20`}
          />
          <img
            src={playlist.image}
            alt={playlist.title}
            className="relative w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Hover Overlay with Play Button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Play playlist
              }}
              className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 hover:scale-105 hover:bg-emerald-400 transition-all duration-200"
            >
              <Icon
                d={ICONS.play}
                className="w-5 h-5 text-white mr-[-2px]"
                filled
              />
            </button>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-200"
              >
                <Icon d={ICONS.edit} className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-200"
              >
                <Icon d={ICONS.trash} className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Lock Icon for Private */}
          {!playlist.isPublic && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Icon d={ICONS.lock} className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Playlist Info */}
        <h3 className="text-sm font-medium text-white truncate">
          {playlist.title}
        </h3>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {playlist.songsCount} آهنگ
        </p>
      </div>
    );
  }
);

PlaylistCardGrid.displayName = "PlaylistCardGrid";

const PlaylistCard = memo(
  ({
    playlist,
    onPress,
    onEdit,
    onDelete,
  }: {
    playlist: UserPlaylist;
    onPress: () => void;
    onEdit: () => void;
    onDelete: () => void;
  }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
      <div
        onClick={onPress}
        className="group relative flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] active:scale-[0.99] cursor-pointer transition-all duration-200 overflow-hidden"
        style={{ willChange: "transform" }}
      >
        {/* Playlist Cover */}
        <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-zinc-800/50 shadow-lg">
          {playlist.image ? (
            <img
              src={playlist.image}
              alt={playlist.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${
                playlist.gradient || "from-zinc-700 to-zinc-800"
              } flex items-center justify-center`}
            >
              <Icon d={ICONS.music} className="w-8 h-8 text-white/40" />
            </div>
          )}

          {/* Play Button on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Play playlist
              }}
              className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-110 transition-transform duration-200"
            >
              <Icon
                d={ICONS.play}
                className="w-4 h-4 text-white mr-[-1px]"
                filled
              />
            </button>
          </div>

          {/* Privacy Badge */}
          {!playlist.isPublic && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Icon d={ICONS.lock} className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>

        {/* Playlist Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate mb-0.5">
            {playlist.title}
          </h3>
          {playlist.description && (
            <p className="text-xs text-gray-500 line-clamp-1 mb-1">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-600 flex items-center gap-1">
              <Icon d={ICONS.music} className="w-3 h-3" />
              {playlist.songsCount} آهنگ
            </span>
            <span className="text-[10px] text-gray-600">•</span>
            <span className="text-[10px] text-gray-600">
              {playlist.duration}
            </span>
          </div>
        </div>

        {/* More Menu */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <Icon d={ICONS.moreVertical} className="w-5 h-5 text-gray-400" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] py-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-right text-sm text-gray-300 hover:bg-white/5 flex items-center gap-3"
                >
                  <Icon d={ICONS.edit} className="w-4 h-4" />
                  ویرایش
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-right text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                >
                  <Icon d={ICONS.trash} className="w-4 h-4" />
                  حذف
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

PlaylistCard.displayName = "PlaylistCard";

// ============================================================================
// Create Playlist Card - Special CTA Card
// ============================================================================
const CreatePlaylistCard = memo(({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200 group"
  >
    <div className="w-16 h-16 rounded-xl bg-white/[0.04] group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors duration-200">
      <Icon
        d={ICONS.plus}
        className="w-7 h-7 text-gray-500 group-hover:text-emerald-400 transition-colors duration-200"
      />
    </div>
    <div className="text-right">
      <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
        پلی‌لیست جدید بسازید
      </h3>
      <p className="text-xs text-gray-600 mt-0.5">
        آهنگ‌های مورد علاقه‌تان را گردآوری کنید
      </p>
    </div>
  </button>
));

CreatePlaylistCard.displayName = "CreatePlaylistCard";

// ============================================================================
// Main Component
// ============================================================================
export default function MyPlaylists() {
  const { navigateTo, goBack, scrollToTop } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>(USER_PLAYLISTS);

  // Filter playlists based on search
  const displayedPlaylists = useMemo(() => {
    if (!searchQuery) return playlists;
    const q = searchQuery.toLowerCase();
    return playlists.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [searchQuery, playlists]);

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handlePlaylistPress = useCallback(
    (playlist: UserPlaylist) => {
      navigateTo("playlist-detail", { slug: createSlug(playlist.title) });
    },
    [navigateTo]
  );

  const handleCreatePlaylist = useCallback(
    (name: string, isPublic: boolean) => {
      const newPlaylist: UserPlaylist = {
        id: `user-pl-${Date.now()}`,
        title: name,
        description: "",
        image: "",
        gradient: "from-emerald-600 to-teal-700",
        songsCount: 0,
        duration: "0 دقیقه",
        isPublic,
        createdAt: new Date().toISOString(),
      };
      setPlaylists((prev) => [newPlaylist, ...prev]);
    },
    []
  );

  const handleEditPlaylist = useCallback((playlistId: string) => {
    console.log("Edit playlist:", playlistId);
    // Open edit modal
  }, []);

  const handleDeletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  }, []);

  const toggleSearch = useCallback(() => {
    scrollToTop();
    setShowSearch((prev) => !prev);
    if (showSearch) setSearchQuery("");
  }, [showSearch, scrollToTop]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
  }, []);

  return (
    <div
      className="relative w-full min-h-screen bg-[#030303] text-white overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Gradient Header Background */}
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(20, 184, 166, 0.2) 0%, rgba(20, 184, 166, 0.08) 40%, transparent 100%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-14">
        {/* Navigation Bar */}
        <div className="flex items-center flex-row-reverse justify-between px-4 p-2.5 fixed top-0 left-0 right-0 bg-[#030303]/80 z-60">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all duration-200"
          >
            <Icon d={ICONS.back} className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearch}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all duration-200"
            >
              <Icon
                d={showSearch ? ICONS.close : ICONS.search}
                className="w-5 h-5 text-white"
              />
            </button>
            <button
              onClick={toggleViewMode}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center hover:bg-black/50 transition-all duration-200"
            >
              <Icon
                d={viewMode === "grid" ? ICONS.list : ICONS.grid}
                className="w-5 h-5 text-white"
              />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="px-6 pt-8 pb-6">
          {/* Folder Icon with Gradient */}
          <div className="w-28 h-28 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-500 flex items-center justify-center shadow-2xl shadow-teal-500/30">
            <Icon d={ICONS.folder} className="w-14 h-14 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            پلی‌لیست‌های من
          </h1>
          <p className="text-gray-400 text-sm text-center">
            {playlists.length} پلی‌لیست
          </p>
        </div>

        {/* Search Bar - Animated */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            showSearch ? "max-h-16 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-4">
            <div className="relative">
              <Icon
                d={ICONS.search}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در پلی‌لیست‌ها..."
                className="w-full pl-4 pr-10 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/40 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 pb-32">
        {/* Create Playlist Card */}
        <CreatePlaylistCard onClick={() => setShowCreateModal(true)} />

        {/* Playlists List */}
        {displayedPlaylists.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Icon d={ICONS.folder} className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">پلی‌لیستی یافت نشد</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3">
            {displayedPlaylists.map((playlist) => (
              <PlaylistCardGrid
                key={playlist.id}
                playlist={playlist}
                onPress={() => handlePlaylistPress(playlist)}
                onEdit={() => handleEditPlaylist(playlist.id)}
                onDelete={() => handleDeletePlaylist(playlist.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 pt-3">
            {displayedPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onPress={() => handlePlaylistPress(playlist)}
                onEdit={() => handleEditPlaylist(playlist.id)}
                onDelete={() => handleDeletePlaylist(playlist.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePlaylist}
      />
    </div>
  );
}
