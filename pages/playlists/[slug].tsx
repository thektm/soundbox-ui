import React, { useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Playlist,
  FEATURED_PLAYLISTS,
  MADE_FOR_YOU,
  FOCUS_PLAYLISTS,
  WORKOUT_PLAYLISTS,
  CHILL_PLAYLISTS,
  PARTY_PLAYLISTS,
  DECADES_PLAYLISTS,
  SLEEP_PLAYLISTS,
  MOCK_SONGS,
  Song,
} from "../../components/mockData";
import {
  Play,
  Pause,
  Heart,
  DotsThree,
  Clock,
  Shuffle,
  ArrowLeft,
  MusicNote,
  ShareNetwork,
  Queue,
  Plus,
} from "@phosphor-icons/react";

// ============================================================================
// Utility Functions for Slug Generation
// ============================================================================

/**
 * Creates a URL-safe slug from a string, supporting Farsi/Arabic characters.
 * Uses encodeURIComponent to handle non-ASCII characters properly.
 */
export function createSlug(title: string): string {
  // Normalize the string and replace spaces with hyphens
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[\/\\?%*:|"<>]/g, "") // Remove invalid URL characters
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  return encodeURIComponent(normalized);
}

/**
 * Decodes a slug back to a searchable string
 */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).replace(/-/g, " ");
  } catch {
    return slug.replace(/-/g, " ");
  }
}

/**
 * Finds a playlist by its slug (encoded title)
 */
export function findPlaylistBySlug(
  slug: string,
  allPlaylists: Playlist[]
): Playlist | undefined {
  const decodedSlug = decodeSlug(slug);

  return allPlaylists.find((playlist) => {
    const playlistSlug = createSlug(playlist.title);
    const decodedPlaylistSlug = decodeSlug(playlistSlug);
    // Match by exact decoded slug or original title (case-insensitive)
    return (
      decodedPlaylistSlug.toLowerCase() === decodedSlug.toLowerCase() ||
      playlist.title.toLowerCase().replace(/\s+/g, " ").trim() ===
        decodedSlug.toLowerCase()
    );
  });
}

// ============================================================================
// Get All Playlists
// ============================================================================

export function getAllPlaylists(): Playlist[] {
  return [
    ...FEATURED_PLAYLISTS,
    ...MADE_FOR_YOU,
    ...FOCUS_PLAYLISTS,
    ...WORKOUT_PLAYLISTS,
    ...CHILL_PLAYLISTS,
    ...PARTY_PLAYLISTS,
    ...DECADES_PLAYLISTS,
    ...SLEEP_PLAYLISTS,
  ];
}

// ============================================================================
// Icons
// ============================================================================

const ICONS = {
  play: "M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z",
  heart:
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  clock:
    "M12 6v6l4 2 M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10z",
  music:
    "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
};

const Icon: React.FC<{
  name: keyof typeof ICONS;
  className?: string;
  fill?: boolean;
}> = ({ name, className, fill = true }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={fill ? "currentColor" : "none"}
    stroke={!fill ? "currentColor" : "none"}
    strokeWidth={!fill ? 2 : 0}
  >
    <path d={ICONS[name]} />
  </svg>
);

// ============================================================================
// Song Row Component
// ============================================================================

interface SongRowProps {
  song: Song;
  index: number;
  isPlaying?: boolean;
  onPlay?: () => void;
}

const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  isPlaying = false,
  onPlay,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
      className={`group grid grid-cols-[16px_4fr_minmax(80px,1fr)] md:grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-1 py-2 rounded-md transition-colors cursor-pointer ${
        isPlaying
          ? "bg-white/10"
          : isHovered
          ? "bg-white/5"
          : "hover:bg-white/5"
      }`}
    >
      {/* Index / Play Button */}
      <div className="flex items-center justify-center w-4">
        {isHovered ? (
          <button className="text-white">
            {isPlaying ? (
              <Pause size={14} weight="fill" />
            ) : (
              <Play size={14} weight="fill" />
            )}
          </button>
        ) : isPlaying ? (
          <MusicNote size={14} className="text-green-500" weight="fill" />
        ) : (
          <span className="text-sm text-neutral-400">{index + 1}</span>
        )}
      </div>

      {/* Song Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-neutral-800">
          <img
            src={song.image}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium truncate ${
              isPlaying ? "text-green-500" : "text-white"
            }`}
          >
            {song.title}
          </p>
          <p className="text-xs text-neutral-400 truncate flex items-center gap-1">
            {song.explicit && (
              <span className="px-1 py-0.5 text-[9px] bg-neutral-600 text-neutral-300 rounded">
                E
              </span>
            )}
            {song.artist}
          </p>
        </div>
      </div>

      {/* Date Added (Hidden on mobile) */}
      <div className="hidden md:flex items-center">
        <p className="text-sm text-neutral-400">۱ هفته پیش</p>
      </div>

      {/* Duration & Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
            isLiked ? "opacity-100" : ""
          }`}
        >
          <Heart
            size={16}
            weight={isLiked ? "fill" : "regular"}
            className={
              isLiked ? "text-green-500" : "text-neutral-400 hover:text-white"
            }
          />
        </button>
        <span className="text-sm text-neutral-400">{song.duration}</span>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-white">
          <DotsThree size={20} weight="bold" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Playlist Detail Page
// ============================================================================

const PlaylistDetailPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);

  // Get all playlists and find the current one
  const allPlaylists = useMemo(() => getAllPlaylists(), []);

  const playlist = useMemo(() => {
    if (!slug || typeof slug !== "string") return null;
    return findPlaylistBySlug(slug, allPlaylists);
  }, [slug, allPlaylists]);

  // Mock songs for this playlist
  const playlistSongs = useMemo(() => {
    // In a real app, you'd fetch songs specific to this playlist
    // For now, we'll shuffle and use mock songs
    return [...MOCK_SONGS].sort(() => Math.random() - 0.5);
  }, [playlist?.id]);

  const handlePlayAll = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && currentSongIndex === null) {
      setCurrentSongIndex(0);
    }
  };

  const handlePlaySong = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  // Loading state
  if (!router.isReady) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-pulse text-white">در حال بارگذاری...</div>
      </div>
    );
  }

  // Not found state
  if (!playlist) {
    return (
      <div
        className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-950 text-white"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <MusicNote size={64} className="mx-auto text-neutral-600 mb-4" />
            <h1 className="text-2xl font-bold mb-2">پلی‌لیست پیدا نشد</h1>
            <p className="text-neutral-400 mb-6">
              متاسفانه پلی‌لیست مورد نظر شما یافت نشد.
            </p>
            <Link
              href="/playlists"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
              بازگشت به پلی‌لیست‌ها
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white pb-24"
      dir="rtl"
    >
      {/* Header / Hero - Redesigned for full-width cover blend */}
      <header
        className="relative w-full h-96 md:h-[500px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%), url(${playlist.image})`,
        }}
      >
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
        </div>

        {/* Playlist Info - Centered and enhanced */}
        <div className="absolute inset-0 flex items-end justify-end px-6 md:px-12 pb-8">
          <div className="text-right max-w-lg w-full">
            <p className="text-sm font-semibold text-green-400 mb-2 uppercase tracking-wide">
              Playlist
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-4 text-white drop-shadow-lg">
              {playlist.title}
            </h1>
            <p className="text-neutral-200 text-base md:text-lg mb-6 leading-relaxed">
              {playlist.description}
            </p>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              {playlist.followers && (
                <>
                  <span className="text-white font-bold">
                    {playlist.followers}
                  </span>
                  <span>لایک</span>
                  <span>•</span>
                </>
              )}
              <span>{playlist.songsCount} آهنگ</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {playlist.duration}
              </span>
            </div>
          </div>
        </div>

        {/* Premium/New Badges */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {playlist.isPremium && (
            <div className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-full shadow-lg">
              Premium
            </div>
          )}
          {playlist.isNew && (
            <div className="px-3 py-1 text-xs font-bold bg-blue-500 text-white rounded-full shadow-lg">
              New
            </div>
          )}
        </div>
      </header>

      {/* Actions Bar - Enhanced */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-neutral-950/95 to-neutral-950 backdrop-blur-lg px-6 md:px-12 py-6 border-b border-white/10">
        <div className="flex items-center gap-6">
          {/* Play Button */}
          <button
            onClick={handlePlayAll}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 hover:scale-110 flex items-center justify-center shadow-2xl transition-all duration-300"
          >
            {isPlaying ? (
              <Pause size={28} weight="fill" className="text-black" />
            ) : (
              <Play size={28} weight="fill" className="text-black ml-1" />
            )}
          </button>

          {/* Shuffle */}
          <button className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-green-500 transition-colors duration-200">
            <Shuffle size={28} />
          </button>

          {/* Like */}
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors duration-200 ${
              isLiked ? "text-green-500" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Heart size={28} weight={isLiked ? "fill" : "regular"} />
          </button>

          {/* Share */}
          <button className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-200">
            <ShareNetwork size={28} />
          </button>

          {/* More Options */}
          <button className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-200">
            <DotsThree size={28} weight="bold" />
          </button>
        </div>
      </div>

      {/* Songs List - Polished */}
      <main className="px-6 md:px-12">
        {/* Table Header */}
        <div className="grid grid-cols-[16px_4fr_minmax(80px,1fr)] md:grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-3 border-b border-white/10 text-neutral-400 text-sm font-medium">
          <div className="flex items-center justify-center">#</div>
          <div>Title</div>
          <div className="hidden md:block">Date Added</div>
          <div className="flex items-center justify-end">
            <Clock size={18} />
          </div>
        </div>

        {/* Songs */}
        <div className="mt-4 space-y-1">
          {playlistSongs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              isPlaying={currentSongIndex === index && isPlaying}
              onPlay={() => handlePlaySong(index)}
            />
          ))}
        </div>
      </main>

      {/* Bottom Gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none" />
    </div>
  );
};

export default PlaylistDetailPage;
