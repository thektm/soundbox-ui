"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  useMemo,
} from "react";
import Image from "next/image";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useNavigation } from "./NavigationContext";
import { usePlayer } from "./PlayerContext";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { SongOptionsDrawer } from "./SongOptionsDrawer";
import { getFullShareUrl } from "../utils/share";
import { createSlug } from "./mockData";

// ============ TYPES & MOCKS ============
interface Song {
  id: string;
  title: string;
  artist: string;
  artistId?: string | number;
  album: string;
  duration: string;
  image: string;
  src: string;
  explicit?: boolean;
  plays?: number;
}

interface Artist {
  id: string;
  name: string;
  image: string;
  /** Circular profile image used for overlays and avatars. Falls back to `image` if absent. */
  profileImage?: string;
  followers: string;
  verified?: boolean;
  is_following?: boolean;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  image: string;
  year: string;
  type: string;
  description: string;
}

interface Playlist {
  id: string;
  title: string;
  description: string;
  image: string;
  gradient: string;
  songsCount: number;
  duration: string;
  followers?: string;
  isNew?: boolean;
  isPremium?: boolean;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  image: string;
  is_following?: boolean;
  plan?: string;
}

interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  users: User[];
}

interface EventPlaylist {
  id: number;
  title: string;
  description: string;
  cover_image: string;
}

interface EventPlaylistEntry {
  id: number;
  title: string;
  time_of_day: "morning" | "evening" | "night";
  playlists: EventPlaylist[];
  created_at: string;
  updated_at: string;
}

interface SearchSection {
  id: number;
  type: "song" | "playlist" | "album";
  title: string;
  item_size: string;
  songs: any[];
  albums: any[];
  playlists: any[];
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: number;
  type: "song" | "artist" | "query";
}

interface EventPlaylistSong {
  id: number;
  cover_image?: string;
}

interface EventPlaylistDetail {
  id: number;
  songs: EventPlaylistSong[];
}

// ============ UTILS & HOOKS ============
const STORAGE_KEY = "spotify_search_history";

// Hook: Handle Debouncing
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Hook: Handle Local Storage History
const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistory[]>([]);

  useEffect(() => {
    // Defer localStorage read to after initial render for instant loading
    const timer = setTimeout(() => {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) setHistory(JSON.parse(data));
      } catch {}
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const save = (newHistory: SearchHistory[]) => {
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory.slice(0, 20)));
  };

  const add = useCallback(
    (query: string, type: SearchHistory["type"] = "query") => {
      setHistory((prev) => {
        const newItem: SearchHistory = {
          id: `${Date.now()}`,
          query: query.trim(),
          timestamp: Date.now(),
          type,
        };
        const filtered = prev.filter(
          (h) => h.query.toLowerCase() !== query.toLowerCase(),
        );
        const next = [newItem, ...filtered];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 20)));
        return next;
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, add, remove, clear };
};

const useEventPlaylists = (accessToken?: string, enabled = true) => {
  const [eventData, setEventData] = useState<EventPlaylistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Defer the fetch to after initial render for instant loading
    const timer = setTimeout(() => {
      const fetchEventPlaylists = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            "https://api.sedabox.com/api/search/event-playlists/",
            {
              headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {},
            },
          );
          if (response.ok) {
            const data = await response.json();
            setEventData(data);
          }
        } catch (error) {
          console.error("Failed to fetch event playlists", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventPlaylists();
    }, 0);

    return () => clearTimeout(timer);
  }, [accessToken, enabled]);

  const getTimeOfDay = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 20) return "evening";
    return "night";
  }, []);

  const currentEvent = useMemo(
    () => eventData.find((e) => e.time_of_day === getTimeOfDay()),
    [eventData, getTimeOfDay],
  );

  return { currentEvent, isLoading };
};

const useSearchSections = (accessToken?: string, enabled = true) => {
  const [sections, setSections] = useState<SearchSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Defer the fetch to after initial render for instant loading
    const timer = setTimeout(() => {
      const fetchSections = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            "https://api.sedabox.com/api/search/sections/",
            {
              headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {},
            },
          );
          if (response.ok) {
            const data = await response.json();
            setSections(data);
          }
        } catch (error) {
          console.error("Failed to fetch search sections", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSections();
    }, 0);

    return () => clearTimeout(timer);
  }, [accessToken, enabled]);

  return { sections, isLoading };
};

// Hook: Handle API Logic
const useSearch = (
  query: string,
  filter: "all" | "songs" | "artists" | "albums" | "playlists" | "users",
  accessToken?: string,
  enabled = true,
) => {
  const [results, setResults] = useState<SearchResults>({
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
    users: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (!query.trim()) {
      setResults({
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
        users: [],
      });
      return;
    }

    const abortController = new AbortController();

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const typeMapping: Record<string, string> = {
          all: "",
          songs: "song",
          artists: "artist",
          albums: "album",
          playlists: "playlist",
          users: "user",
        };

        const typeParam = typeMapping[filter];
        const params = new URLSearchParams({
          q: query,
          page_size: "40",
        });
        if (typeParam) params.append("type", typeParam);

        const response = await fetch(
          `https://api.sedabox.com/api/search/?${params.toString()}`,
          {
            signal: abortController.signal,
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {},
          },
        );

        if (!response.ok) throw new Error("Search failed");

        const data = await response.json();

        // Standardize the results from SearchResultSerializer
        const songs: Song[] = [];
        const artists: Artist[] = [];
        const albums: Album[] = [];
        const playlists: Playlist[] = [];
        const users: User[] = [];

        (data.results || []).forEach((item: any) => {
          switch (item.type) {
            case "song":
              const durationSeconds = item.data?.duration_seconds || 0;
              const minutes = Math.floor(durationSeconds / 60);
              const seconds = durationSeconds % 60;
              const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
              songs.push({
                id: item.id.toString(),
                title: item.title,
                artist: item.data?.artist_name || "Unknown Artist",
                album: item.data?.album_name || "",
                duration: formattedDuration,
                image: item.image || "https://picsum.photos/200",
                src: item.data?.stream_url || "",
                explicit: false, // Not provided in response
                plays: item.data?.plays || 0,
              });
              break;
            case "artist":
              artists.push({
                id: item.id.toString(),
                name: item.title,
                image: item.image || "https://picsum.photos/200",
                followers: "", // Not provided in this response
                verified: item.data?.verified || false,
                is_following: item.is_following || false,
              });
              break;
            case "album":
              albums.push({
                id: item.id.toString(),
                title: item.title,
                artist: item.data?.artist_name || "",
                image: item.image || "https://picsum.photos/200",
                year: item.data?.release_date
                  ? new Date(item.data.release_date).getFullYear().toString()
                  : "",
                type: "Album",
                description: "",
              });
              break;
            case "playlist":
              playlists.push({
                id: item.id.toString(),
                title: item.title,
                image: item.image || "https://picsum.photos/200",
                songsCount: 0, // Not provided
                description: "",
                gradient: "",
                duration: "",
              });
              break;
            case "user":
              users.push({
                id: item.id.toString(),
                username: item.title,
                fullName:
                  `${item.data?.first_name || ""} ${item.data?.last_name || ""}`.trim() ||
                  item.title,
                image: item.image || "https://picsum.photos/200",
                is_following: item.is_following || false,
                plan: item.data?.plan || "free",
              });
              break;
          }
        });

        setResults({ songs, artists, albums, playlists, users });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Search API Error:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
    return () => {
      abortController.abort();
    };
  }, [query, filter, accessToken]);

  return { results, isLoading };
};

// ============ ICONS (Static) ============
const Icon = ({
  path,
  className = "w-5 h-5",
  fill = "currentColor",
  viewBox = "0 0 24 24",
}: any) => (
  <svg className={className} viewBox={viewBox} fill={fill}>
    <path d={path} />
  </svg>
);

const ICONS = {
  Search: (props: any) => (
    <Icon
      path="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.8369 10.533 19.8369C12.767 19.8369 14.8235 19.0671 16.4402 17.7794L20.7929 22.132C21.1834 22.5226 21.8166 22.5226 22.2071 22.132C22.5976 21.7415 22.5976 21.1083 22.2071 20.7178L17.8634 16.3741C19.1616 14.7849 19.94 12.7634 19.94 10.5579C19.94 5.41887 15.7139 1.27893 10.533 1.27893ZM3.12598 10.5579C3.12598 6.55226 6.42768 3.27893 10.533 3.27893C14.6383 3.27893 17.94 6.55226 17.94 10.5579C17.94 14.5636 14.6383 17.8369 10.533 17.8369C6.42768 17.8369 3.12598 14.5636 3.12598 10.5579Z"
      {...props}
    />
  ),
  Close: (props: any) => (
    <svg
      className={props.className || "w-5 h-5"}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  ),
  Clock: (props: any) => (
    <Icon
      path="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.42V7z"
      {...props}
    />
  ),
  Play: (props: any) => <Icon path="M8 5.14v14l11-7-11-7z" {...props} />,
  Verified: (props: any) => (
    <Icon
      path="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
      fill="#3D91F4"
      {...props}
    />
  ),
  More: (props: any) => (
    <svg
      className={props.className || "w-5 h-5"}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  ),
};

// ============ SUB-COMPONENTS (Memoized) ============

const SongCard = memo(
  ({
    song,
    onPlay,
    onMore,
  }: {
    song: Song;
    index?: number;
    onPlay: () => void;
    onMore: (song: Song) => void;
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className="group flex items-center gap-3 p-2 rounded-md hover:bg-[#ffffff14] transition-all duration-200 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onPlay}
      >
        <div className="relative w-12 h-12 shrink-0">
          <ImageWithPlaceholder
            src={song.image}
            alt={song.title}
            className="w-full h-full object-cover rounded shadow-lg"
            type="song"
          />
          {isHovered && (
            <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
              <button className="w-8 h-8 bg-[#1db954] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl">
                <ICONS.Play className="w-4 h-4 text-black ml-0.5" />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className="text-white font-normal truncate hover:underline">
              {song.title}
            </span>
            {song.explicit && (
              <span className="inline-flex items-center justify-center w-4 h-4 bg-[#9b9b9b] text-black text-[9px] font-bold rounded-sm ml-2">
                E
              </span>
            )}
          </div>
          <div className="flex items-center text-sm text-[#a7a7a7]">
            <span className="truncate hover:underline hover:text-white">
              {song.artist}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {song.plays !== undefined && song.plays > 0 && (
            <span className="text-sm text-[#a7a7a7]">
              <ICONS.Play className="inline w-3 h-3 mr-1" />{" "}
              {song.plays.toLocaleString()}
            </span>
          )}
          <span className="text-sm text-[#a7a7a7] tabular-nums">
            {song.plays !== undefined && song.plays > 0 ? "•" : ""}{" "}
            {song.duration}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMore(song);
            }}
            className="p-1 text-[#a7a7a7] hover:text-white"
          >
            <ICONS.More />
          </button>
        </div>
      </div>
    );
  },
);

const ArtistCard = memo(
  ({
    artist,
    onClick,
    onFollow,
    isFollowing,
    isFollowLoading,
  }: {
    artist: Artist;
    onClick: () => void;
    onFollow: (artistId: string, currentlyFollowing: boolean) => void;
    isFollowing: boolean;
    isFollowLoading: boolean;
  }) => {
    return (
      <div
        onClick={onClick}
        className="group p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer h-full flex flex-col items-center text-center"
      >
        <div className="relative mb-4 w-full aspect-square px-2">
          <div className="w-full h-full rounded-full overflow-hidden shadow-2xl bg-zinc-800">
            <ImageWithPlaceholder
              src={artist.image}
              alt={artist.name}
              className="w-full h-full object-cover"
              type="artist"
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 mb-3 w-full px-2">
          <div className="flex items-center gap-1 justify-center w-full">
            <span className="font-bold text-white truncate max-w-full">
              {artist.name}
            </span>
            {artist.verified && <ICONS.Verified className="shrink-0" />}
          </div>
          <div className="text-sm text-[#a7a7a7]">
            هنرمند • {artist.followers} دنبال‌کننده
          </div>
        </div>
        <div className="mt-auto w-full px-2">
          <button
            disabled={isFollowLoading}
            onClick={(e) => {
              e.stopPropagation();
              onFollow(artist.id, isFollowing);
            }}
            className={`w-full py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center min-h-[40px] ${
              isFollowing
                ? "bg-[#1db954] text-black hover:bg-[#1ed760]"
                : "bg-white text-black hover:bg-zinc-200"
            } ${isFollowLoading ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            {isFollowLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : isFollowing ? (
              "دنبال شده"
            ) : (
              "دنبال کردن"
            )}
          </button>
        </div>
      </div>
    );
  },
);

const UserCard = memo(
  ({ user, onClick }: { user: User; onClick: () => void }) => {
    return (
      <div
        onClick={onClick}
        className="group p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer h-full flex flex-col items-center text-center"
      >
        <div className="relative mb-4 w-full aspect-square px-2">
          <div className="w-full h-full rounded-full overflow-hidden shadow-2xl bg-zinc-800 relative">
            <ImageWithPlaceholder
              src={user.image}
              alt={user.username}
              className="w-full h-full object-cover"
              type="user"
            />

            {/* Premium star badge */}
            {user.plan === "premium" && (
              <div
                aria-hidden
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
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
        </div>
        <div className="flex flex-col items-center gap-1 w-full px-2">
          <span className="font-bold text-white truncate max-w-full">
            {user.username}
          </span>
          <div className="text-sm text-[#a7a7a7] truncate w-full">
            {user.fullName}
          </div>
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-400 mt-1">
            کاربر
          </div>
        </div>
      </div>
    );
  },
);

const AlbumCard = memo(
  ({ album, onClick }: { album: Album; onClick: () => void }) => {
    return (
      <div
        onClick={onClick}
        className="group p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer"
      >
        <div className="relative mb-4 aspect-square">
          <ImageWithPlaceholder
            src={album.image}
            alt={album.title}
            className="w-full h-full object-cover rounded-md shadow-2xl"
            type="song"
          />
        </div>
        <div className="font-bold text-white truncate mb-1">{album.title}</div>
        <div className="text-sm text-[#a7a7a7] truncate">
          {album.artist} • {album.year}
        </div>
      </div>
    );
  },
);

const PlaylistCard = memo(
  ({ playlist, onClick }: { playlist: Playlist; onClick: () => void }) => {
    return (
      <div
        onClick={onClick}
        className="group p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer"
      >
        <div className="relative mb-4 aspect-square">
          <ImageWithPlaceholder
            src={playlist.image}
            alt={playlist.title}
            className="w-full h-full object-cover rounded-md shadow-2xl"
            type="song"
          />
          <button className="absolute bottom-2 right-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105">
            <ICONS.Play className="w-5 h-5 text-black ml-0.5" />
          </button>
        </div>
        <div className="font-bold text-white truncate mb-1">
          {playlist.title}
        </div>
        <div className="text-sm text-[#a7a7a7] truncate">
          توسط SedaBox • {playlist.songsCount} آهنگ
        </div>
      </div>
    );
  },
);

const HistoryItem = memo(
  ({
    item,
    onSelect,
    onRemove,
  }: {
    item: SearchHistory;
    onSelect: () => void;
    onRemove: () => void;
  }) => (
    <div className="flex items-center gap-3 p-3 rounded-md hover:bg-[#ffffff14] group cursor-pointer transition-colors">
      <div className="flex-1 flex items-center gap-3" onClick={onSelect}>
        <div className="w-12 h-12 bg-[#282828] rounded-full flex items-center justify-center">
          <ICONS.Clock className="w-6 h-6 text-[#a7a7a7]" />
        </div>
        <div>
          <div className="text-white font-medium">{item.query}</div>
          <div className="text-sm text-[#a7a7a7]">Recent search</div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#a7a7a7] hover:text-white"
      >
        <ICONS.Close />
      </button>
    </div>
  ),
);

const LoadingSkeleton = memo(() => (
  <div className="animate-pulse">
    <div className="mb-6">
      <div className="h-6 w-24 bg-[#282828] rounded mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-[#181818]">
            <div className="aspect-square bg-[#282828] rounded-full mb-4" />
            <div className="h-4 bg-[#282828] rounded w-3/4 mb-2" />
            <div className="h-3 bg-[#282828] rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-6 w-20 bg-[#282828] rounded mb-4" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="w-12 h-12 bg-[#282828] rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#282828] w-1/3" />
            <div className="h-3 bg-[#282828] w-1/4" />
          </div>
        </div>
      ))}
    </div>
  </div>
));

const EventSkeleton = memo(() => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-32 bg-zinc-800 rounded-md mb-6" />
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="w-full flex items-center justify-between gap-4 p-3 rounded-lg bg-[#101010] border border-white/5"
      >
        <div className="flex-1 space-y-2 text-right">
          <div className="h-5 bg-zinc-800 rounded w-1/3 ml-auto" />
          <div className="h-4 bg-zinc-800 rounded w-1/4 ml-auto" />
        </div>
        <div className="w-16 h-16 bg-zinc-800 rounded shadow-lg flex-shrink-0" />
      </div>
    ))}
  </div>
));

const SectionsSkeleton = memo(() => (
  <div className="space-y-10">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-zinc-800/50 rounded-md" />
        <div className="flex gap-4 overflow-hidden -mx-2 px-2">
          {[...Array(5)].map((_, j) => (
            <div
              key={j}
              className="min-w-[160px] md:min-w-[180px] p-4 rounded-xl bg-[#181818]/30 border border-white/5 shadow-sm"
            >
              <div className="aspect-square bg-zinc-800/50 rounded-lg mb-4 shadow-2xl" />
              <div className="h-4 bg-zinc-800/50 rounded-full w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-zinc-800/50 rounded-full w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
));

const SectionCard = memo(
  ({
    item,
    type,
    onClick,
    onPlay,
  }: {
    item: any;
    type: "song" | "playlist" | "album";
    onClick: () => void;
    onPlay: (e: React.MouseEvent) => void;
  }) => {
    const title = item.title;
    const subTitle = item.artist_name || item.name || item.description || "";
    const mainImage = item.cover_image || item.image;

    // Playlist multi-cover logic
    const playlistSongs = type === "playlist" ? item.songs || [] : [];
    const needsGeneratedCover =
      type === "playlist" && !mainImage && playlistSongs.length > 0;
    const stackImages = needsGeneratedCover
      ? playlistSongs.slice(0, 3).map((s: any) => s.cover_image)
      : [];

    return (
      <div
        onClick={onClick}
        className="group min-w-[160px] md:min-w-[190px] p-4 rounded-xl bg-[#181818]/20 hover:bg-[#282828]/60 border border-transparent hover:border-white/5 transition-all duration-300 cursor-pointer flex flex-col items-center text-center shadow-lg"
      >
        <div className="relative mb-4 w-full aspect-square group-hover:-translate-y-1 transition-transform duration-300">
          {needsGeneratedCover && stackImages.length > 1 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Backmost image (3rd) */}
              {stackImages[2] && (
                <div className="absolute inset-0 scale-[0.88] translate-x-6 -translate-y-2 rotate-6 opacity-50">
                  <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl border border-white/5 bg-zinc-900">
                    <img
                      src={stackImages[2]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              {/* Middle image (2nd) */}
              {stackImages[1] && (
                <div className="absolute inset-0 scale-[0.94] translate-x-3 -translate-y-1 rotate-3 opacity-80">
                  <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl border border-white/5 bg-zinc-800">
                    <img
                      src={stackImages[1]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              {/* Front image (1st) */}
              <div className="relative w-full h-full z-10">
                <ImageWithPlaceholder
                  src={stackImages[0]}
                  alt={title}
                  className="w-full h-full object-cover rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
                  type="song"
                />
              </div>
            </div>
          ) : (
            <ImageWithPlaceholder
              src={mainImage || (stackImages.length > 0 ? stackImages[0] : "")}
              alt={title}
              className="w-full h-full object-cover rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
              type="song"
            />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors rounded-lg" />
          <button
            onClick={onPlay}
            className="absolute bottom-2 left-2 w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95 z-10"
          >
            <ICONS.Play className="w-5 h-5 text-black ml-0.5" />
          </button>
        </div>
        <div className="w-full space-y-1">
          <div className="font-bold text-white text-sm truncate w-full">
            {title}
          </div>
          <div className="text-xs text-[#a7a7a7] truncate w-full group-hover:text-white/80 transition-colors">
            {subTitle}
          </div>
        </div>
      </div>
    );
  },
);

const SectionHorizontalList = memo(
  ({
    section,
    onNavigate,
    onPlayTrack,
  }: {
    section: SearchSection;
    onNavigate: (type: string, id: any) => void;
    onPlayTrack: (song: any) => void;
  }) => {
    const items =
      section.type === "song"
        ? section.songs
        : section.type === "playlist"
          ? section.playlists
          : section.albums;

    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-white group cursor-default">
          {section.title}
          <span className="block h-1 w-12 bg-[#1db954] rounded-full mt-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
        </h2>
        <div className="flex gap-5 overflow-x-auto pb-6 pt-1 scrollbar-hide -mx-2 px-2">
          {items.map((item) => (
            <SectionCard
              key={item.id}
              item={item}
              type={section.type}
              onClick={() => {
                if (section.type === "song") {
                  onPlayTrack(item);
                } else {
                  onNavigate(`${section.type}-detail`, item.id);
                }
              }}
              onPlay={(e) => {
                e.stopPropagation();
                if (section.type === "song") {
                  onPlayTrack(item);
                } else {
                  onNavigate(`${section.type}-detail`, item.id);
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  },
);

const ModernBackground = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {/* Spotify-inspired Greenish Glows - Darker & Subtler */}
    <div className="absolute top-[-20%] left-[-15%] w-[120%] h-[120%] bg-[#1db954]/5 rounded-full blur-[160px] animate-bg-float-1" />
    <div className="absolute bottom-[-25%] right-[-15%] w-[100%] h-[100%] bg-emerald-600/5 rounded-full blur-[180px] animate-bg-float-2" />
    <div className="absolute top-[30%] left-[10%] w-[60%] h-[60%] bg-[#1db954]/3 rounded-full blur-[120px] animate-bg-float-3" />

    {/* Clean Modern Subtle Grid */}
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `linear-gradient(rgba(29, 185, 84, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(29, 185, 84, 0.2) 1px, transparent 1px)`,
        backgroundSize: "120px 120px",
      }}
    />

    {/* Very light Noise for texture */}
    <div
      className="absolute inset-0 opacity-[0.012] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />

    {/* Top and Bottom Vignettes for focus on content */}
    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
  </div>
));

// ============ MAIN COMPONENT ============
export default function Search() {
  const { navigateTo } = useNavigation();
  const { playTrack } = usePlayer();
  const { accessToken } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [isFocused, setIsFocused] = useState(false);

  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMore = useCallback((song: any) => {
    setSelectedSong({
      ...song,
      cover_image: song.image,
      artist_name: song.artist,
    });
    setIsDrawerOpen(true);
  }, []);

  const handleAction = async (action: string, s: any) => {
    if (action === "share" && s) {
      try {
        const url = getFullShareUrl("song", s.id);
        const text = `گوش دادن به آهنگ ${s.title} از ${s.artist_name} در سداباکس`;
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: s.title, text, url });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("لینک کپی شد");
        }
      } catch (err) {
        console.error("Song share failed:", err);
      }
    }
  };

  const [activeFilter, setActiveFilter] = useState<
    "all" | "songs" | "artists" | "albums" | "playlists" | "users"
  >("all");
  const [followedStatus, setFollowedStatus] = useState<Record<string, boolean>>(
    {},
  );
  const [followingId, setFollowingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFollow = useCallback(
    (artistId: string, currentlyFollowing: boolean) => {
      if (!accessToken) {
        toast.error("برای دنبال کردن ابتدا وارد شوید");
        return;
      }

      setFollowingId(artistId);

      fetch(`https://api.sedabox.com/api/follow/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ artist_id: artistId }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Follow action failed");
        })
        .then((data) => {
          setFollowedStatus((prev) => ({
            ...prev,
            [artistId]: data.message === "followed",
          }));
          toast.success(
            data.message === "followed" ? "دنبال شد" : "لغو دنبال کردن",
          );
        })
        .catch((error) => {
          console.error("Follow action failed", error);
          toast.error("خطا در انجام عملیات");
        })
        .finally(() => {
          setFollowingId(null);
        });
    },
    [accessToken],
  );

  // mark ready after first paint; initial network requests wait for this
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const t = setTimeout(() => setIsReady(true), 0);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Custom Hooks
  const { results, isLoading } = useSearch(
    debouncedQuery,
    activeFilter,
    accessToken ?? undefined,
    isReady,
  );
  const {
    history,
    add: addToHistory,
    remove: removeFromHistory,
    clear: clearHistory,
  } = useSearchHistory();

  const { currentEvent, isLoading: isEventLoading } = useEventPlaylists(
    accessToken ?? undefined,
    isReady,
  );

  const { sections, isLoading: isSectionsLoading } = useSearchSections(
    accessToken ?? undefined,
    isReady,
  );

  const [playlistDetails, setPlaylistDetails] = useState<
    Record<number, EventPlaylistDetail>
  >({});
  const fetchedPlaylistIdsRef = useRef<Set<number>>(new Set());
  const prevEventIdRef = useRef<number | null>(null);

  useEffect(() => {
    const newEventId = currentEvent?.id ?? null;
    if (newEventId === prevEventIdRef.current) return;
    prevEventIdRef.current = newEventId;
    fetchedPlaylistIdsRef.current.clear();
    setPlaylistDetails({});
  }, [currentEvent?.id]);

  useEffect(() => {
    if (!isReady || !currentEvent) {
      fetchedPlaylistIdsRef.current.clear();
      setPlaylistDetails({});
      return;
    }

    const toFetch = currentEvent.playlists.filter(
      (playlist) => !fetchedPlaylistIdsRef.current.has(playlist.id),
    );

    if (toFetch.length === 0) return;

    const controllers: Record<number, AbortController> = {};

    toFetch.forEach((playlist) => {
      const controller = new AbortController();
      controllers[playlist.id] = controller;

      fetch(`https://api.sedabox.com/api/playlists/${playlist.id}/`, {
        signal: controller.signal,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch playlist detail");
          }
          return response.json();
        })
        .then((data) => {
          const songs = Array.isArray(data?.songs) ? data.songs : [];
          fetchedPlaylistIdsRef.current.add(playlist.id);
          setPlaylistDetails((prev) => ({
            ...prev,
            [playlist.id]: {
              id: playlist.id,
              songs,
            },
          }));
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Failed to load playlist detail", error);
          }
        });
    });

    return () => {
      Object.values(controllers).forEach((controller) => controller.abort());
    };
  }, [currentEvent, accessToken, isReady]);

  // Handlers (Memoized)
  const handleSearch = useCallback(
    (q: string) => {
      if (q.trim()) addToHistory(q);
    },
    [addToHistory],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) handleSearch(query);
    if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  const handlePlaySong = useCallback(
    (song: Song) => {
      addToHistory(`${song.title} - ${song.artist}`, "song");
      playTrack(song as any);
    },
    [addToHistory, playTrack],
  );

  const handleArtistClick = useCallback(
    (artist: Artist) => {
      addToHistory(artist.name, "artist");
      navigateTo("artist-detail", {
        id: artist.id,
        slug: (artist as any).unique_id || createSlug(artist.name),
      });
    },
    [addToHistory, navigateTo],
  );

  const handleHistorySelect = useCallback(
    (item: SearchHistory) => {
      setQuery(item.query);
      handleSearch(item.query);
    },
    [handleSearch],
  );

  const handleEventPlaylistPress = useCallback(
    (eventId: number, playlistId: number) => {
      // Immediately navigate to the playlist detail and let that screen fetch data.
      navigateTo("playlist-detail", { id: String(playlistId) });
    },
    [navigateTo],
  );

  // Derived State
  const hasResults =
    results.songs.length > 0 ||
    results.artists.length > 0 ||
    results.albums.length > 0 ||
    results.playlists.length > 0 ||
    results.users.length > 0;
  const showResults = debouncedQuery.trim() && !isLoading;

  const showSongs =
    (activeFilter === "all" || activeFilter === "songs") &&
    results.songs.length > 0;
  const showArtists =
    (activeFilter === "all" || activeFilter === "artists") &&
    results.artists.length > 0;
  const showAlbums =
    (activeFilter === "all" || activeFilter === "albums") &&
    results.albums.length > 0;
  const showPlaylists =
    (activeFilter === "all" || activeFilter === "playlists") &&
    results.playlists.length > 0;
  const showUsers =
    (activeFilter === "all" || activeFilter === "users") &&
    results.users.length > 0;

  return (
    <div
      className="relative min-h-screen bg-transparent text-white pb-24 md:pb-4"
      dir="rtl"
    >
      {!query.trim() && <ModernBackground />}

      {/* Desktop Header with Navigation */}
      <header className="hidden md:flex sticky top-0 z-50 h-16 items-center justify-between px-6 bg-zinc-900/80 backdrop-blur-xl relative">
        <div className="flex items-center gap-2">
          {/* Removed back/forward buttons as we don't have router */}
        </div>

        {/* Desktop Search Bar - Centered */}
        <div className="flex-1 max-w-xl mx-8">
          <div
            className={`flex items-center bg-zinc-800 rounded-full border-2 transition-all duration-200 ${
              isFocused
                ? "border-white bg-zinc-700"
                : "border-transparent hover:border-zinc-600 hover:bg-zinc-700"
            }`}
          >
            <div className="pl-4 pr-2">
              <ICONS.Search className="w-5 h-5 text-zinc-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="دنبال چه آهنگی هستید؟"
              className="flex-1 bg-transparent py-2.5 pr-4 text-sm text-white placeholder-zinc-400 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="pr-4 pl-2 py-2 text-zinc-400 hover:text-white"
              >
                <ICONS.Close />
              </button>
            )}
          </div>
        </div>

        {/* Right side profile */}
        <button
          onClick={() => navigateTo("profile")}
          className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white hover:bg-zinc-700 hover:scale-105 transition-all"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div
              className={`relative flex-1 max-w-xl transition-transform duration-200 ${
                isFocused ? "scale-[1.02]" : ""
              }`}
            >
              <div
                className={`flex items-center bg-[#242424] rounded-full border-2 transition-colors duration-200 ${
                  isFocused
                    ? "border-white bg-[#2a2a2a]"
                    : "border-transparent hover:border-[#3e3e3e] hover:bg-[#2a2a2a]"
                }`}
              >
                <div className="pl-4 pr-2">
                  <ICONS.Search className="w-6 h-6 text-[#a7a7a7]" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  onKeyDown={handleKeyDown}
                  placeholder="دنبال چه آهنگی هستید؟"
                  className="flex-1 bg-transparent py-3 pr-4 text-sm text-white placeholder-[#a7a7a7] outline-none"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="pr-4 pl-2 py-2 text-[#a7a7a7] hover:text-white"
                  >
                    <ICONS.Close />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters - Shown on both but styled differently */}
      {debouncedQuery.trim() && (
        <div className="sticky top-16 md:top-16 z-40 bg-zinc-900/80 backdrop-blur-md px-4 md:px-6 py-3 border-b border-white/5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { k: "all", l: "همه" },
              { k: "songs", l: "آهنگ‌ها" },
              { k: "artists", l: "هنرمندان" },
              { k: "albums", l: "آلبوم‌ها" },
              { k: "playlists", l: "لیست‌های پخش" },
              { k: "users", l: "کاربران" },
            ].map((f) => (
              <button
                key={f.k}
                onClick={() => setActiveFilter(f.k as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === f.k
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-4">
        {isLoading && <LoadingSkeleton />}

        {showResults && hasResults && (
          <div className="space-y-8">
            {/* Top Result Block */}
            {showArtists &&
              showSongs &&
              activeFilter === "all" &&
              results.artists[0] && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
                  <section>
                    <h2 className="text-2xl font-bold ">نتیجه برتر</h2>
                    <ArtistCard
                      key={results.artists[0].id}
                      artist={results.artists[0]}
                      onClick={() => handleArtistClick(results.artists[0])}
                      onFollow={handleFollow}
                      isFollowing={
                        (followedStatus[results.artists[0].id] ??
                          results.artists[0].is_following) ||
                        false
                      }
                      isFollowLoading={followingId === results.artists[0].id}
                    />
                  </section>
                  <section>
                    <h2 className="text-2xl font-bold mb-4 mt-6">آهنگ‌ها</h2>
                    <div className="space-y-1">
                      {results.songs.slice(0, 4).map((song, i) => (
                        <SongCard
                          key={song.id}
                          song={song}
                          index={i}
                          onPlay={() => handlePlaySong(song)}
                          onMore={handleMore}
                        />
                      ))}
                    </div>
                  </section>
                </div>
              )}

            {/* Artists Grid */}
            {showArtists &&
              (activeFilter === "artists" ||
                (activeFilter === "all" && results.artists.length > 1)) && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">هنرمندان</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {(activeFilter === "all"
                      ? results.artists.slice(1)
                      : results.artists
                    ).map((artist) => (
                      <ArtistCard
                        key={artist.id}
                        artist={artist}
                        onClick={() => handleArtistClick(artist)}
                        onFollow={handleFollow}
                        isFollowing={
                          (followedStatus[artist.id] ?? artist.is_following) ||
                          false
                        }
                        isFollowLoading={followingId === artist.id}
                      />
                    ))}
                  </div>
                </section>
              )}

            {/* Albums Grid */}
            {showAlbums && (
              <section>
                <h2 className="text-2xl font-bold mb-4">آلبوم‌ها</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {results.albums.map((album) => (
                    <AlbumCard
                      key={album.id}
                      album={album}
                      onClick={() =>
                        navigateTo("album-detail", { id: album.id })
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Playlists Grid */}
            {showPlaylists && (
              <section>
                <h2 className="text-2xl font-bold mb-4">لیست‌های پخش</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {results.playlists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      onClick={() =>
                        navigateTo("playlist-detail", { id: playlist.id })
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Users Grid */}
            {showUsers && (
              <section>
                <h2 className="text-2xl font-bold mb-4">کاربران</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {results.users.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onClick={() =>
                        navigateTo("user-detail", { id: user.username })
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Full Song List */}
            {showSongs && activeFilter === "songs" && (
              <section>
                <h2 className="text-2xl font-bold mb-4">آهنگ‌ها</h2>
                <div className="space-y-1">
                  {results.songs.map((song, i) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      index={i}
                      onPlay={() => handlePlaySong(song)}
                      onMore={handleMore}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Not Found */}
        {showResults && !hasResults && debouncedQuery.trim() && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-700">
            <div className="bg-zinc-800 p-8 rounded-full mb-8">
              <ICONS.Search className="w-12 h-12 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              نتیجه‌ای برای «{debouncedQuery}» یافت نشد
            </h2>
            <p className="text-[#a7a7a7] max-w-md mx-auto">
              لطفاً املای کلمات را بررسی کنید یا از کلمات کلیدی متفاوتی استفاده
              کنید.
            </p>
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="mt-8 px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
            >
              پاک کردن جستجو
            </button>
          </div>
        )}

        {/* Default View: History & Event Playlists */}
        {!debouncedQuery.trim() && !isLoading && (
          <div className="space-y-8">
            {history.length > 0 && (
              <section>
                <div className="flex justify-between mb-4">
                  <h2 className="text-2xl font-bold">جستجوهای اخیر</h2>
                  <button
                    onClick={clearHistory}
                    className="text-sm text-[#a7a7a7] hover:text-white font-semibold"
                  >
                    پاک کردن همه
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {history.slice(0, 8).map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onSelect={() => handleHistorySelect(item)}
                      onRemove={() => removeFromHistory(item.id)}
                    />
                  ))}
                </div>
              </section>
            )}
            {isEventLoading && <EventSkeleton />}
            {currentEvent && !isEventLoading && (
              <section>
                <h2 className="text-2xl font-bold mb-4">
                  {currentEvent.title}
                </h2>
                <div className="space-y-3">
                  {currentEvent.playlists.map((playlist: EventPlaylist) => {
                    const playlistDetail = playlistDetails[playlist.id];
                    const songCoverImages =
                      playlistDetail?.songs
                        ?.map((song) => song.cover_image)
                        .filter((image): image is string => Boolean(image)) ??
                      [];
                    const recentCovers = songCoverImages.slice(-2).reverse();

                    return (
                      <button
                        key={playlist.id}
                        type="button"
                        onClick={() =>
                          handleEventPlaylistPress(currentEvent.id, playlist.id)
                        }
                        className="w-full flex items-start gap-4 p-4 rounded-2xl bg-[#101010] hover:bg-[#1b1b1b] transition-all duration-200 shadow-[0_10px_30px_rgba(0,0,0,0.45)] border border-white/5"
                      >
                        <div className="w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                          <ImageWithPlaceholder
                            src={playlist.cover_image}
                            alt={playlist.title}
                            className="object-cover w-full h-full"
                            type="song"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex flex-col text-right gap-1">
                            <span className="text-white font-bold text-lg leading-tight">
                              {playlist.title}
                            </span>
                            {playlist.description && (
                              <span className="text-sm text-[#a7a7a7]">
                                {playlist.description}
                              </span>
                            )}
                          </div>
                          <div className="relative mt-0">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 via-[#1db954]/30 to-transparent opacity-70" />
                            <div className="absolute inset-y-0 right-0 w-16 pointer-events-none bg-gradient-to-l from-[#050505]/0 via-[#050505]/80 to-[#050505] rounded-2xl" />
                            <div className="relative z-10 flex items-center gap-3 pr-2 pl-1 min-h-[52px]">
                              <div className="flex items-center">
                                {recentCovers.length > 0 ? (
                                  recentCovers.map((cover, index) => (
                                    <div
                                      key={`${playlist.id}-${index}-${cover}`}
                                      className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
                                      style={{
                                        marginLeft: index === 0 ? 0 : -14,
                                        zIndex: recentCovers.length - index,
                                      }}
                                    >
                                      <img
                                        src={cover}
                                        alt={`${playlist.title} cover ${index}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))
                                ) : (
                                  <div className="w-12 h-12 rounded-xl border border-dashed border-white/20 bg-white/5 flex items-center justify-center text-[10px] text-white/60">
                                    در حال آماده‌سازی
                                  </div>
                                )}
                              </div>
                              <span className="text-[11px] text-white/70 whitespace-nowrap">
                                آخرین ترک
                                {recentCovers.length === 1 ? "" : "‌ها"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {isSectionsLoading && <SectionsSkeleton />}

            {!isSectionsLoading &&
              sections.map((section) => (
                <section key={section.id}>
                  <SectionHorizontalList
                    section={section}
                    onNavigate={(type, id) => navigateTo(type as any, { id })}
                    onPlayTrack={(song) =>
                      handlePlaySong({
                        ...song,
                        image: song.cover_image,
                        artist: song.artist_name,
                        src: song.stream_url,
                        duration: `${Math.floor(song.duration_seconds / 60)}:${(song.duration_seconds % 60).toString().padStart(2, "0")}`,
                      })
                    }
                  />
                </section>
              ))}
          </div>
        )}
      </main>
      <SongOptionsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        song={selectedSong}
        onAction={handleAction}
      />
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bg-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, 3%) scale(1.05); }
        }
        @keyframes bg-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1.05); }
          50% { transform: translate(-3%, -3%) scale(1); }
        }
        @keyframes bg-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(1%, -1%) scale(1.02); }
        }
        .animate-bg-float-1 { animation: bg-float-1 20s infinite alternate ease-in-out; }
        .animate-bg-float-2 { animation: bg-float-2 25s infinite alternate ease-in-out; }
        .animate-bg-float-3 { animation: bg-float-3 18s infinite alternate ease-in-out; }
      `}</style>
    </div>
  );
}
