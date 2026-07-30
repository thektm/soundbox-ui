"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import SectionDetailLayout from "./SectionDetailLayout";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { slugify } from "../utils/share";
import { toast } from "react-hot-toast";
import { useI18n } from "./I18nContext";

interface UserPlaylist {
  id: number;
  unique_id?: string;
  title: string;
  songs_count: number;
  likes_count: number;
  is_liked: boolean;
  top_three_song_covers: string[];
  generated_by?: "system" | "admin" | "audience";
  creator_unique_id?: string | null;
}

interface PlaylistPage {
  count?: number;
  total?: number;
  next?: string | null;
  results?: UserPlaylist[];
}

interface UserProfile {
  id: number;
  unique_id: string;
  first_name: string;
  last_name: string;
  user_playlists: UserPlaylist[] | PlaylistPage;
}

interface OtherUserPlaylistsProps {
  uniqueId: string;
  fullName?: string;
}

const playlistKey = (playlist: UserPlaylist): string =>
  `${playlist.generated_by || "user"}:${playlist.unique_id || playlist.id}`;

const normalizePlaylistPage = (payload: UserProfile): {
  items: UserPlaylist[];
  next: string | null;
  total: number;
} => {
  const source = payload?.user_playlists;
  if (Array.isArray(source)) {
    return { items: source, next: null, total: source.length };
  }
  const items = Array.isArray(source?.results) ? source.results : [];
  const rawTotal = Number(source?.total ?? source?.count ?? items.length);
  return {
    items,
    next: typeof source?.next === "string" && source.next ? source.next : null,
    total: Number.isFinite(rawTotal) ? rawTotal : items.length,
  };
};

const mergePlaylists = (
  current: UserPlaylist[],
  incoming: UserPlaylist[],
): UserPlaylist[] => {
  const merged = new Map(current.map((item) => [playlistKey(item), item]));
  incoming.forEach((item) => merged.set(playlistKey(item), item));
  return Array.from(merged.values());
};

const OtherUserPlaylists: React.FC<OtherUserPlaylistsProps> = ({
  uniqueId,
  fullName: initialFullName,
}) => {
  const { language, locale } = useI18n();
  const { accessToken, authenticatedFetch } = useAuth();
  const { navigateTo } = useNavigation();
  const authenticatedFetchRef = useRef(authenticatedFetch);
  authenticatedFetchRef.current = authenticatedFetch;
  const requestSequenceRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const loadingMoreRef = useRef(false);

  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [fullName, setFullName] = useState(initialFullName || "");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (url: string, replace: boolean) => {
      const sequence = replace ? ++requestSequenceRef.current : requestSequenceRef.current;
      if (replace) {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setIsLoading(true);
      } else {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setIsLoadingMore(true);
      }

      try {
        const response = await authenticatedFetchRef.current(url, {
          headers: { Accept: "application/json" },
          signal: abortRef.current?.signal,
        });
        if (!response.ok) throw new Error(`PLAYLISTS_HTTP_${response.status}`);
        const payload = (await response.json()) as UserProfile;
        if (sequence !== requestSequenceRef.current) return;

        const page = normalizePlaylistPage(payload);
        setPlaylists((current) =>
          replace ? mergePlaylists([], page.items) : mergePlaylists(current, page.items),
        );
        setNextUrl(page.next);
        setTotal(page.total);

        if (!initialFullName) {
          setFullName(
            `${payload.first_name || ""} ${payload.last_name || ""}`.trim() ||
              payload.unique_id ||
              uniqueId,
          );
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Fetch playlists error:", error);
        toast.error(
          language === "fa"
            ? "دریافت پلی‌لیست‌ها انجام نشد. دوباره تلاش کنید."
            : "Playlists could not be loaded. Please try again.",
        );
      } finally {
        if (sequence === requestSequenceRef.current) {
          setIsLoading(false);
          loadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
      }
    },
    [initialFullName, language, uniqueId],
  );

  useEffect(() => {
    if (!uniqueId) return;

    setPlaylists([]);
    setNextUrl(null);
    setTotal(0);
    setFullName(initialFullName || "");

    const profileUrl =
      uniqueId === "sedabox"
        ? "https://api.sedabox.com/api/profile/sedabox?page=1&page_size=50"
        : `https://api.sedabox.com/api/profile/u/${encodeURIComponent(uniqueId)}/?page=1&page_size=50`;
    void fetchPage(profileUrl, true);

    return () => {
      requestSequenceRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, [accessToken, fetchPage, initialFullName, uniqueId]);

  const loadMore = useCallback(() => {
    if (!nextUrl || isLoading || isLoadingMore) return;
    void fetchPage(nextUrl, false);
  }, [fetchPage, isLoading, isLoadingMore, nextUrl]);

  const handlePlaylistClick = (playlist: UserPlaylist) => {
    if (uniqueId === "sedabox") {
      const isSystemGenerated =
        playlist.generated_by === "system" || playlist.generated_by === "admin";
      const idToUse = isSystemGenerated
        ? playlist.unique_id || String(playlist.id)
        : String(playlist.id);

      navigateTo("playlist-detail", {
        id: idToUse,
        generatedBy: playlist.generated_by,
        creatorUniqueId: playlist.creator_unique_id,
        slug: slugify(playlist.title),
      });
    } else {
      navigateTo("user-playlist-detail", { id: String(playlist.id) });
    }
  };

  const visibleTotal = Math.max(total, playlists.length);
  const pageTitle =
    language === "fa" ? `پلی‌لیست‌های ${fullName}` : `${fullName}'s playlists`;
  const subtitle =
    language === "fa"
      ? `${visibleTotal.toLocaleString(locale)} لیست پخش عمومی`
      : `${visibleTotal.toLocaleString(locale)} public playlists`;

  return (
    <SectionDetailLayout
      title={pageTitle}
      subtitle={subtitle}
      isLoading={isLoading || isLoadingMore}
      onLoadMore={loadMore}
      hasMore={Boolean(nextUrl)}
      hideScrollbar={false}
    >
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {playlists.map((playlist) => (
          <button
            type="button"
            key={playlistKey(playlist)}
            onClick={() => handlePlaylistClick(playlist)}
            className="group space-y-3 text-start"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl">
              <ImageWithPlaceholder
                src={playlist.top_three_song_covers}
                alt={playlist.title}
                className="h-full w-full object-cover"
                type="song"
              />
              <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
              <div className="absolute bottom-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-lg">
                  <svg className="ml-0.5 h-5 w-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white/90 backdrop-blur-md">
                {playlist.songs_count.toLocaleString(locale)} {language === "fa" ? "آهنگ" : "songs"}
              </div>
            </div>

            <div className="space-y-1 px-1">
              <h3 className="truncate text-sm font-bold text-white transition-colors group-hover:text-green-500 md:text-base">
                {playlist.title}
              </h3>
              {typeof playlist.likes_count === "number" && (
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{playlist.likes_count.toLocaleString(locale)}</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {!isLoading && playlists.length === 0 && (
        <div className="py-16 text-center text-sm text-zinc-400">
          {language === "fa" ? "پلی‌لیست عمومی‌ای پیدا نشد." : "No public playlists were found."}
        </div>
      )}
    </SectionDetailLayout>
  );
};

export default OtherUserPlaylists;
