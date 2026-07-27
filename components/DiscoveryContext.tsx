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
}

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
  const audienceKey = accessToken
    ? `member:${user?.id ?? "loading"}`
    : "guest";
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<
    ApiPlaylist[]
  >([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialFetched, setHasInitialFetched] = useState(false);
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
    setRecommendedPlaylists(results);
    setNextUrl(data.next || null);
  }, []);

  useEffect(() => {
    if (
      homeCache?._audience === audienceKey &&
      homeCache?.playlist_recommendations &&
      !hasInitialFetched
    ) {
      setRecommendedData(homeCache.playlist_recommendations);
    }
  }, [audienceKey, homeCache, hasInitialFetched, setRecommendedData]);

  const refreshRecommended = useCallback(
    async (force = false) => {
      if (hasInitialFetched && !force) return;
      setIsLoading(true);
      try {
        const response = await fetchPublicRecommendations(
          "https://api.sedabox.com/api/home/playlist-recommendations/",
        );
        if (response.ok) {
          const data = await response.json();
          setRecommendedData(data);
          setHasInitialFetched(true);
        }
      } catch (error) {
        console.error("Error fetching recommended playlists:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPublicRecommendations, hasInitialFetched, setRecommendedData],
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
        const results = Array.isArray(data) ? data : data.results || [];
        setRecommendedPlaylists((prev) => [...prev, ...results]);
        setNextUrl(data.next || null);
      }
    } catch (error) {
      console.error("Error loading more recommended playlists:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPublicRecommendations, isLoading, nextUrl]);

  useEffect(() => {
    if (lastAudienceRef.current === audienceKey) return;
    lastAudienceRef.current = audienceKey;

    // Clear the previous audience immediately so personalized playlists never
    // flash during login/logout transitions.
    setRecommendedPlaylists([]);
    setNextUrl(null);
    setHasInitialFetched(false);
    void refreshRecommended(true);
  }, [audienceKey, refreshRecommended]);

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
