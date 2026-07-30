"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { useI18n } from "./I18nContext";

export interface ApiGenreLink {
  id: number;
  name: string;
}

export interface ApiPlaylist {
  id: number;
  unique_id: string;
  title: string;
  description: string;
  cover_image: string;
  top_three_song_covers?: string[];
  covers?: string[];
  songs_count: number;
  is_liked: boolean;
  genres: ApiGenreLink[];
  genre_ids: number[];
  genre_names: string[];
}

const normalizePlaylistGenres = (playlist: any): ApiGenreLink[] => {
  const byId = new Map<number, ApiGenreLink>();
  const add = (idValue: unknown, nameValue: unknown) => {
    const id = Number(idValue);
    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    if (!Number.isFinite(id) || id <= 0 || !name || byId.has(id)) return;
    byId.set(id, { id, name });
  };

  if (Array.isArray(playlist?.genres)) {
    playlist.genres.forEach((genre: any) =>
      add(genre?.id, genre?.name ?? genre?.title),
    );
  }
  if (Array.isArray(playlist?.genre_ids)) {
    playlist.genre_ids.forEach((genre: any, index: number) => {
      if (genre && typeof genre === "object") {
        add(
          genre.id,
          genre.name ?? genre.title ?? playlist?.genre_names?.[index],
        );
        return;
      }
      add(genre, playlist?.genre_names?.[index]);
    });
  }

  return Array.from(byId.values());
};

const normalizePlaylist = (playlist: any): ApiPlaylist => {
  const genres = normalizePlaylistGenres(playlist);
  return {
    ...(playlist || {}),
    genres,
    genre_ids: genres.map((genre) => genre.id),
    genre_names: genres.length
      ? genres.map((genre) => genre.name)
      : Array.isArray(playlist?.genre_names)
        ? playlist.genre_names.filter(
            (name: unknown): name is string =>
              typeof name === "string" && Boolean(name.trim()),
          )
        : [],
  } as ApiPlaylist;
};

interface DiscoveryContextType {
  recommendedPlaylists: ApiPlaylist[];
  nextUrl: string | null;
  isLoading: boolean;
  refreshRecommended: (force?: boolean) => Promise<void>;
  loadMoreRecommended: () => Promise<void>;
  setRecommendedData: (data: any) => void;
}

const DiscoveryContext = createContext<DiscoveryContextType>({
  recommendedPlaylists: [],
  nextUrl: null,
  isLoading: false,
  refreshRecommended: async () => {},
  loadMoreRecommended: async () => {},
  setRecommendedData: () => {},
});

export const useDiscovery = () => useContext(DiscoveryContext);

export const DiscoveryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { accessToken, user, authenticatedFetch } = useAuth();
  const { homeCache } = useNavigation();
  const { language } = useI18n();
  const audienceKey = accessToken
    ? `member:${user?.id ?? "loading"}:${language}`
    : `guest:${language}`;
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<
    ApiPlaylist[]
  >([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialFetchedRef = useRef(false);
  const lastAudienceRef = useRef<string | null>(null);

  const authenticatedFetchRef = useRef(authenticatedFetch);
  authenticatedFetchRef.current = authenticatedFetch;

  const fetchPublicRecommendations = useCallback(
    async (input: RequestInfo | URL): Promise<Response> => {
      if (!accessToken) return fetch(input);

      const response = await authenticatedFetchRef.current(input);
      return response.status === 401 ? fetch(input) : response;
    },
    [accessToken],
  );

  const setRecommendedData = useCallback((data: any) => {
    if (!data) return;
    const results = Array.isArray(data) ? data : data.results || [];
    setRecommendedPlaylists(results.map(normalizePlaylist));
    setNextUrl(data.next || null);
  }, []);

  const refreshRecommended = useCallback(
    async (force = false) => {
      if (hasInitialFetchedRef.current && !force) return;
      setIsLoading(true);
      try {
        const response = await fetchPublicRecommendations(
          "https://api.sedabox.com/api/home/playlist-recommendations/",
        );
        if (response.ok) {
          const data = await response.json();
          setRecommendedData(data);
          hasInitialFetchedRef.current = true;
        }
      } catch (error) {
        console.error("Error fetching recommended playlists:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPublicRecommendations, setRecommendedData],
  );

  const loadMoreRecommended = useCallback(async () => {
    if (!nextUrl || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetchPublicRecommendations(
        nextUrl.replace("http://", "https://"),
      );
      if (response.ok) {
        const data = await response.json();
        const section = data.playlist_recommendations || data;
        const results = (Array.isArray(section)
          ? section
          : section.results || []
        ).map(normalizePlaylist);
        setRecommendedPlaylists((prev) => {
          const seen = new Set(prev.map((playlist) => playlist.unique_id));
          return [
            ...prev,
            ...results.filter(
              (playlist: ApiPlaylist) => !seen.has(playlist.unique_id),
            ),
          ];
        });
        setNextUrl(section.next || null);
      }
    } catch (error) {
      console.error("Error loading more recommended playlists:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPublicRecommendations, isLoading, nextUrl]);

  useEffect(() => {
    const cached =
      homeCache?._audience === audienceKey
        ? homeCache.playlist_recommendations
        : null;

    if (lastAudienceRef.current === audienceKey) {
      if (cached && !hasInitialFetchedRef.current) {
        setRecommendedData(cached);
        hasInitialFetchedRef.current = true;
      }
      return;
    }
    lastAudienceRef.current = audienceKey;

    setRecommendedPlaylists([]);
    setNextUrl(null);
    hasInitialFetchedRef.current = false;

    if (cached) {
      setRecommendedData(cached);
      hasInitialFetchedRef.current = true;
      return;
    }

    void refreshRecommended(true);
  }, [audienceKey, homeCache, refreshRecommended, setRecommendedData]);

  return (
    <DiscoveryContext.Provider
      value={{
        recommendedPlaylists,
        nextUrl,
        isLoading,
        refreshRecommended,
        loadMoreRecommended,
        setRecommendedData,
      }}
    >
      {children}
    </DiscoveryContext.Provider>
  );
};
