"use client";

import React, { useState, useEffect } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { useDiscovery } from "./DiscoveryContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";

interface ApiPlaylist {
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

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const RecommendedPlaylistsPage: React.FC = () => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { navigateTo } = useNavigation();
  const {
    recommendedPlaylists: playlists,
    nextUrl,
    isLoading: loading,
    loadMoreRecommended: loadMore,
  } = useDiscovery();

  const createSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  };

  const getPlaylistCover = (playlist: ApiPlaylist) => {
    const covers = playlist.covers || playlist.top_three_song_covers || [];
    if (Array.isArray(covers) && covers.length > 0) {
      return covers[0];
    }
    return playlist.cover_image;
  };

  return (
    <SectionDetailLayout
      title="پلی‌لیست‌های پیشنهادی"
      subtitle="موسیقی‌هایی که دوست خواهید داشت"
      onLoadMore={loadMore}
      hasMore={!!nextUrl}
      isLoading={loading}
      backgroundImage={getPlaylistCover(playlists[0] || {})}
    >
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8"
        style={{ direction: "rtl" }}
      >
        {playlists.map((playlist) => (
          <div
            key={playlist.unique_id}
            onClick={() =>
              navigateTo("playlist-detail", {
                id: playlist.unique_id,
                slug: createSlug(playlist.title),
              })
            }
            className="group cursor-pointer space-y-4"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:shadow-emerald-500/20">
              <ImageWithPlaceholder
                src={getPlaylistCover(playlist)}
                alt={playlist.title}
                fill
                className="object-cover transition-all duration-700 group-hover:rotate-1"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="space-y-1 text-right">
              <h3 className="text-white font-bold text-lg truncate group-hover:text-emerald-400 transition-colors">
                {playlist.title}
              </h3>
              <p className="text-zinc-400 text-sm line-clamp-1">
                {playlist.description || `${playlist.songs_count} آهنگ`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionDetailLayout>
  );
};

export default RecommendedPlaylistsPage;
