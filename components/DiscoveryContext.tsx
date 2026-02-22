"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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
  const { accessToken, authenticatedFetch } = useAuth();
  const { homeCache } = useNavigation();
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<
    ApiPlaylist[]
  >([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialFetched, setHasInitialFetched] = useState(false);

  const setRecommendedData = useCallback((data: any) => {
    if (!data) return;
    const results = Array.isArray(data) ? data : data.results || [];
    setRecommendedPlaylists(results);
    setNextUrl(data.next || null);
  }, []);

  useEffect(() => {
    if (homeCache?.playlist_recommendations && !hasInitialFetched) {
      setRecommendedData(homeCache.playlist_recommendations);
    }
  }, [homeCache, hasInitialFetched, setRecommendedData]);

  const refreshRecommended = useCallback(
    async (force = false) => {
      if (!accessToken || (hasInitialFetched && !force)) return;
      setIsLoading(true);
      try {
        const response = await authenticatedFetch(
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
    [accessToken, authenticatedFetch, hasInitialFetched, setRecommendedData],
  );

  const loadMoreRecommended = useCallback(async () => {
    if (!nextUrl || isLoading) return;
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(
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
  }, [nextUrl, isLoading, authenticatedFetch]);

  useEffect(() => {
    if (accessToken) {
      refreshRecommended();
    }
  }, [accessToken, refreshRecommended]);

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
