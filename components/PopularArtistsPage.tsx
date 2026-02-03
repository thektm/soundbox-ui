"use client";

import React, { useState, useEffect } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";

interface ApiArtist {
  id: number;
  name: string;
  profile_image: string;
  is_following: boolean;
  verified: boolean;
  followers_count: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const PopularArtistsPage: React.FC = () => {
  const { accessToken } = useAuth();
  const { navigateTo, currentParams } = useNavigation();
  const [artists, setArtists] = useState<ApiArtist[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch(
          "https://api.sedabox.com/api/home/popular-artists/",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (response.ok) {
          const data: PaginatedResponse<ApiArtist> = await response.json();
          setArtists(data.results);
          setNextUrl(data.next);
        }
      } catch (error) {
        console.error("Error fetching popular artists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [accessToken]);

  const loadMore = async () => {
    if (!nextUrl || loading) return;
    setLoading(true);
    try {
      const response = await fetch(nextUrl.replace("http://", "https://"), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data: PaginatedResponse<ApiArtist> = await response.json();
        setArtists((prev) => [...prev, ...data.results]);
        setNextUrl(data.next);
      }
    } catch (error) {
      console.error("Error loading more artists:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionDetailLayout
      title="هنرمندان محبوب"
      subtitle="ستارگان صداباکس"
      onLoadMore={loadMore}
      hasMore={!!nextUrl}
      isLoading={loading}
      backgroundImage={artists[0]?.profile_image}
    >
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
        style={{ direction: "rtl" }}
      >
        {artists.map((artist) => (
          <div
            key={artist.id}
            onClick={() => navigateTo("artist-detail", { id: artist.id })}
            className="group cursor-pointer flex flex-col items-center text-center space-y-3"
          >
            <div className="relative w-full aspect-square overflow-hidden rounded-full shadow-2xl border-4 border-white/5 transition-transform duration-500 group-hover:scale-105 group-hover:border-emerald-500/50">
              <ImageWithPlaceholder
                src={artist.profile_image}
                alt={artist.name}
                className="w-full h-full object-cover"
                type="artist"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors line-clamp-1 flex items-center justify-center gap-1">
                {artist.name}
                {artist.verified && (
                  <svg
                    className="w-4 h-4 text-blue-400 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm4.5 7.5L9 13l-3.5-3.5 1.5-1.5L9 10l4-4 1.5 1.5z" />
                  </svg>
                )}
              </h3>
              <p className="text-zinc-500 text-sm">هنرمند</p>
            </div>
          </div>
        ))}
      </div>
    </SectionDetailLayout>
  );
};

export default PopularArtistsPage;
