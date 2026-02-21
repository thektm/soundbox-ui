"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import Image from "next/image";
import { ResponsiveSheet } from "./ResponsiveSheet";
import { toast } from "react-hot-toast";
import { Plus, Music, Lock, Globe, Search, X } from "lucide-react";

interface APIUserPlaylist {
  id: number;
  title: string;
  public: boolean;
  songs_count: number;
  top_three_song_covers: string[];
}

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string | number;
}

export const AddToPlaylistModal = ({
  isOpen,
  onClose,
  songId,
}: AddToPlaylistModalProps) => {
  const { accessToken, authenticatedFetch } = useAuth();
  const [playlists, setPlaylists] = useState<APIUserPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToId, setAddingToId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        "https://api.sedabox.com/api/profile/user-playlists/",
      );
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
      setSearchQuery("");
    }
  }, [isOpen, fetchPlaylists]);

  const handleAddToPlaylist = async (playlistId: number) => {
    if (addingToId !== null) return;

    setAddingToId(playlistId);
    try {
      const response = await authenticatedFetch(
        `https://api.sedabox.com/api/profile/user-playlists/${playlistId}/add-song/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ song_id: Number(songId) }),
        },
      );

      if (response.ok) {
        toast.success("به پلی‌لیست اضافه شد");
        onClose();
      } else {
        if (response.status === 401) {
          toast.error("لطفا ابتدا وارد حساب خود شوید");
        } else if (response.status === 409) {
          toast.error("این آهنگ قبلاً در این پلی‌لیست وجود دارد");
        } else if (response.status === 404) {
          toast.error("آهنگ یا پلی‌لیست یافت نشد");
        } else if (response.status === 400) {
          toast.error("درخواست نامعتبر است");
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || "خطا در افزودن به پلی‌لیست");
        }
      }
    } catch (error) {
      toast.error("خطا در برقراری ارتباط با سرور");
    } finally {
      setAddingToId(null);
    }
  };

  const filteredPlaylists = playlists.filter((pl) =>
    pl.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ResponsiveSheet isOpen={isOpen} onClose={onClose} desktopWidth="w-[450px]">
      <div
        className="flex flex-col h-full bg-[#121212] overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                افزودن به پلی‌لیست
              </h3>
              <p className="text-gray-400 text-xs">
                پلی‌لیست مورد نظر را انتخاب کنید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در پلی‌لیست‌ها..."
              className="w-full pl-4 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>
        </div>

        {/* Playlist List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">
                در حال دریافت پلی‌لیست‌ها...
              </p>
            </div>
          ) : filteredPlaylists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Music className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 text-sm">
                {searchQuery
                  ? "پلی‌لیستی با این نام یافت نشد"
                  : "شما هنوز پلی‌لیستی نساخته‌اید"}
              </p>
            </div>
          ) : (
            filteredPlaylists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
                disabled={addingToId !== null}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-all duration-200 group text-right"
              >
                {/* Playlist Image */}
                <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-zinc-800 shadow-md">
                  {playlist.top_three_song_covers?.[0] ? (
                    <Image
                      src={playlist.top_three_song_covers[0]}
                      alt={playlist.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                  {addingToId === playlist.id && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate mb-1 group-hover:text-emerald-400 transition-colors">
                    {playlist.title}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      {playlist.songs_count} آهنگ
                    </span>
                    <span className="text-[10px] text-gray-600">•</span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      {playlist.public ? (
                        <>
                          <Globe className="w-3 h-3" /> عمومی
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> خصوصی
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Add Indicator */}
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4 text-emerald-400" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </ResponsiveSheet>
  );
};
