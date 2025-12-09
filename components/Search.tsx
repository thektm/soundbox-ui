"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import Image from "next/image";
import { useNavigation } from "./NavigationContext";

// ============ TYPES & MOCKS ============
import {
  MOCK_SONGS,
  MOCK_ARTISTS,
  BROWSE_GENRES,
  Song,
  Artist,
  Genre,
} from "./mockData";

interface SearchHistory {
  id: string;
  query: string;
  timestamp: number;
  type: "song" | "artist" | "query";
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
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) setHistory(JSON.parse(data));
    } catch {}
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
          (h) => h.query.toLowerCase() !== query.toLowerCase()
        );
        const next = [newItem, ...filtered];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 20)));
        return next;
      });
    },
    []
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

// Hook: Handle API Logic
const useSearch = (query: string) => {
  const [results, setResults] = useState<{ songs: Song[]; artists: Artist[] }>({
    songs: [],
    artists: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ songs: [], artists: [] });
      return;
    }

    const fetch = async () => {
      setIsLoading(true);
      // Simulate API
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

      const q = query.toLowerCase().trim();
      const songs = MOCK_SONGS.filter(
        (s: Song) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.album.toLowerCase().includes(q)
      );
      const artists = MOCK_ARTISTS.filter((a: Artist) =>
        a.name.toLowerCase().includes(q)
      );

      setResults({ songs, artists });
      setIsLoading(false);
    };

    fetch();
  }, [query]);

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
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  ),
};

// ============ SUB-COMPONENTS (Memoized) ============

const SongCard = memo(
  ({ song, onPlay }: { song: Song; index?: number; onPlay: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [error, setError] = useState(false);

    return (
      <div
        className="group flex items-center gap-3 p-2 rounded-md hover:bg-[#ffffff14] transition-all duration-200 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onPlay}
      >
        <div className="relative w-12 h-12 shrink-0">
          {error ? (
            <div className="w-full h-full bg-[#282828] rounded flex items-center justify-center">
              <span className="text-2xl">🎵</span>
            </div>
          ) : (
            <Image
              src={song.image}
              alt={song.title}
              width={48}
              height={48}
              quality={75}
              className="object-cover rounded shadow-lg"
              onError={() => setError(true)}
            />
          )}
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
            <span className="mx-1">•</span>
            <span className="truncate hover:underline hover:text-white">
              {song.album}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#a7a7a7] tabular-nums">
            {song.duration}
          </span>
          <button
            className={`p-1 text-[#a7a7a7] hover:text-white transition-opacity ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <ICONS.More />
          </button>
        </div>
      </div>
    );
  }
);

const ArtistCard = memo(
  ({ artist, onClick }: { artist: Artist; onClick: () => void }) => {
    const [error, setError] = useState(false);
    return (
      <div
        onClick={onClick}
        className="group p-4 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer"
      >
        <div className="relative mb-4">
          <div className="relative pt-[100%]">
            {error ? (
              <div className="absolute inset-0 bg-[#333] rounded-full flex items-center justify-center">
                <span className="text-4xl">👤</span>
              </div>
            ) : (
              <Image
                src={artist.image}
                alt={artist.name}
                fill
                sizes="(max-width: 768px) 150px, 200px"
                quality={80}
                className="object-cover rounded-full shadow-2xl"
                onError={() => setError(true)}
              />
            )}
          </div>
          <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-[#1ed760] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
            <ICONS.Play className="w-6 h-6 text-black ml-0.5" />
          </button>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <span className="font-bold text-white truncate">{artist.name}</span>
          {artist.verified && <ICONS.Verified />}
        </div>
        <div className="text-sm text-[#a7a7a7]">
          هنرمند • {artist.followers} دنبال‌کننده
        </div>
      </div>
    );
  }
);

const GenreCard = memo(
  ({ genre, onClick }: { genre: Genre; onClick: () => void }) => (
    <div
      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
      style={{ backgroundColor: genre.color }}
      onClick={onClick}
    >
      <div className="absolute inset-0 p-4 flex flex-col">
        <span className="font-bold text-xl text-white">{genre.name}</span>
      </div>
      <div className="absolute bottom-0 right-0 text-6xl transform rotate-25 translate-x-2 translate-y-2 group-hover:scale-110 transition-transform">
        {genre.image}
      </div>
    </div>
  )
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
  )
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

// ============ MAIN COMPONENT ============
export default function Search() {
  const { navigateTo } = useNavigation();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "songs" | "artists">(
    "all"
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom Hooks
  const { results, isLoading } = useSearch(debouncedQuery);
  const {
    history,
    add: addToHistory,
    remove: removeFromHistory,
    clear: clearHistory,
  } = useSearchHistory();

  // Handlers (Memoized)
  const handleSearch = useCallback(
    (q: string) => {
      if (q.trim()) addToHistory(q);
    },
    [addToHistory]
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
      console.log("Playing:", song);
    },
    [addToHistory]
  );

  const handleArtistClick = useCallback(
    (artist: Artist) => {
      addToHistory(artist.name, "artist");
      navigateTo("artist-detail", { slug: artist.id });
    },
    [addToHistory, navigateTo]
  );

  const handleGenreClick = useCallback(
    (genre: Genre) => {
      setQuery(genre.name);
      handleSearch(genre.name);
    },
    [handleSearch]
  );

  const handleHistorySelect = useCallback(
    (item: SearchHistory) => {
      setQuery(item.query);
      handleSearch(item.query);
    },
    [handleSearch]
  );

  // Derived State
  const hasResults = results.songs.length > 0 || results.artists.length > 0;
  const showResults = debouncedQuery.trim() && !isLoading;
  const showSongs = activeFilter !== "artists" && results.songs.length > 0;
  const showArtists = activeFilter !== "songs" && results.artists.length > 0;

  return (
    <div
      className="min-h-screen bg-transparent text-white pb-24 md:pb-4"
      dir="rtl"
    >
      {/* Desktop Header with Navigation */}
      <header className="hidden md:flex sticky top-0 z-50 h-16 items-center justify-between px-6 bg-zinc-900/80 backdrop-blur-xl">
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
      <header className="md:hidden sticky top-0 z-50 bg-[#121212]/95 backdrop-blur-md border-b border-white/5">
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
      {debouncedQuery.trim() && hasResults && (
        <div className="sticky top-16 md:top-16 z-40 bg-zinc-900/80 backdrop-blur-md px-4 md:px-6 py-3 border-b border-white/5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { k: "all", l: "همه" },
              { k: "songs", l: "آهنگ‌ها" },
              { k: "artists", l: "هنرمندان" },
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-4">
        {isLoading && <LoadingSkeleton />}

        {showResults && hasResults && (
          <div className="space-y-8">
            {/* Top Result Block */}
            {showArtists && showSongs && activeFilter === "all" && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
                <section>
                  <h2 className="text-2xl font-bold mb-4">نتیجه برتر</h2>
                  <div
                    className="group p-5 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer relative"
                    onClick={() => handleArtistClick(results.artists[0])}
                  >
                    <img
                      src={results.artists[0].image}
                      alt=""
                      className="w-24 h-24 rounded-full mb-5 shadow-2xl"
                      onError={(e) => (e.currentTarget.src = "")}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl font-bold">
                        {results.artists[0].name}
                      </span>
                      {results.artists[0].verified && (
                        <ICONS.Verified className="w-6 h-6" />
                      )}
                    </div>
                    <span className="inline-block px-3 py-1 bg-[#121212] rounded-full text-sm font-medium mt-2">
                      هنرمند
                    </span>
                    <button className="absolute bottom-5 right-5 w-12 h-12 bg-[#1db954] rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-[#1ed760]">
                      <ICONS.Play className="w-6 h-6 text-black ml-0.5" />
                    </button>
                  </div>
                </section>
                <section>
                  <h2 className="text-2xl font-bold mb-4">آهنگ‌ها</h2>
                  <div className="space-y-1">
                    {results.songs.slice(0, 4).map((song, i) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        index={i}
                        onPlay={() => handlePlaySong(song)}
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
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Not Found */}
        {showResults && !hasResults && debouncedQuery.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">
              نتیجه‌ای برای "{debouncedQuery}" پیدا نشد
            </h2>
            <p className="text-[#a7a7a7] max-w-md">
              لطفاً مطمئن شوید که کلمات را درست نوشته‌اید.
            </p>
          </div>
        )}

        {/* Default View: History & Genres */}
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
            <section>
              <h2 className="text-2xl font-bold mb-4">همه ژانرها</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {BROWSE_GENRES.map((genre: Genre) => (
                  <GenreCard
                    key={genre.id}
                    genre={genre}
                    onClick={() => handleGenreClick(genre)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
