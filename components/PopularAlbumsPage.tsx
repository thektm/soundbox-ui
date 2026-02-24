"use client";

import React, { useState, useEffect } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";

interface ApiAlbum {
  id: number;
  title: string;
  artist_name: string;
  cover_image: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const PopularAlbumsPage: React.FC = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { navigateTo } = useNavigation();
  const [albums, setAlbums] = useState<ApiAlbum[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await authenticatedFetch(
          "https://api.sedabox.com/api/home/popular-albums/",
        );
        if (response.ok) {
          const data: PaginatedResponse<ApiAlbum> = await response.json();
          setAlbums(data.results);
          setNextUrl(data.next);
        }
      } catch (error) {
        console.error("Error fetching popular albums:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [accessToken]);

  const loadMore = async () => {
    if (!nextUrl || loading) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        nextUrl.replace("http://", "https://"),
      );
      if (response.ok) {
        const data: PaginatedResponse<ApiAlbum> = await response.json();
        setAlbums((prev) => [...prev, ...data.results]);
        setNextUrl(data.next);
      }
    } catch (error) {
      console.error("Error loading more albums:", error);
    } finally {
      setLoading(false);
    }
  };

  const createSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  };

  return (
    <SectionDetailLayout
      title="آلبوم‌های محبوب"
      subtitle="بهترین‌های صنعت موسیقی"
      onLoadMore={loadMore}
      hasMore={!!nextUrl}
      isLoading={loading}
      backgroundImage={albums[0]?.cover_image}
    >
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8"
        style={{ direction: "rtl" }}
      >
        {albums.map((album) => (
          <div
            key={album.id}
            onClick={() =>
              navigateTo("album-detail", {
                id: album.id,
                slug: createSlug(album.title),
              })
            }
            className="group cursor-pointer space-y-4"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-xl shadow-black/40 border border-white/5 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-emerald-500/20">
              <ImageWithPlaceholder
                src={album.cover_image}
                alt={album.title}
                className="w-full h-full object-cover"
                type="song"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

              {/* Play Button Overlay */}
              <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-black fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1 px-1">
              <h3
                className="font-black text-white text-lg group-hover:text-emerald-400 transition-colors line-clamp-1 hover:underline decoration-zinc-500"
                onClick={(e) => {
                  const isDesktop =
                    typeof window !== "undefined" &&
                    window.matchMedia("(min-width: 768px)").matches;
                  if (!isDesktop) return;

                  e.stopPropagation();
                  navigateTo("album-detail", {
                    id: album.id,
                    slug: createSlug(album.title),
                  });
                }}
              >
                {album.title}
              </h3>
              <p
                className="text-zinc-500 font-medium hover:text-white transition-colors hover:underline decoration-zinc-500"
                onClick={(e) => {
                  const isDesktop =
                    typeof window !== "undefined" &&
                    window.matchMedia("(min-width: 768px)").matches;
                  if (!isDesktop) return;

                  e.stopPropagation();
                  if ((album as any).artist_id) {
                    navigateTo("artist-detail", {
                      id: (album as any).artist_id,
                    });
                  }
                }}
              >
                {album.artist_name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionDetailLayout>
  );
};

export default PopularAlbumsPage;
