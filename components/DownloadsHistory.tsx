"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigation } from "./NavigationContext";
import Image from "next/image";
import { usePlayer, Track } from "./PlayerContext";
import { useAuth } from "./AuthContext";
import { SongOptionsDrawer } from "./SongOptionsDrawer";
import {
  ArrowLeft,
  History,
  Download,
  Play,
  Pause,
  MoreVertical,
  Music,
  Trash,
} from "lucide-react";
import toast from "react-hot-toast";

const API_ROOT = "https://api.sedabox.com/api";

export default function DownloadsHistory() {
  const { goBack, navigateTo } = useNavigation();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const { accessToken, authenticatedFetch } = useAuth();

  const [downloads, setDownloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchDownloads = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await authenticatedFetch(`${API_ROOT}/profile/downloads/`);
      if (resp.ok) {
        const data = await resp.json();
        setDownloads(data.results || []);
      }
    } catch (err) {
      console.error("Failed to fetch downloads:", err);
      toast.error("خطا در دریافت لیست دانلودها");
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  const handlePlay = (songData: any) => {
    const track: Track = {
      id: String(songData.id),
      title: songData.title,
      artist: songData.artist_name,
      image: songData.cover_image,
      duration: "0:00",
      src:
        songData.stream_url ||
        songData.audio_file ||
        `${API_ROOT}/songs/${songData.id}/stream/`,
    };
    playTrack(track);
  };

  const handleOpenOptions = (songData: any) => {
    setSelectedSong(songData);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (historyItem: any) => {
    setDeletingItem(historyItem);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      const resp = await authenticatedFetch(
        `${API_ROOT}/profile/downloads/${deletingItem.id}/`,
        { method: "DELETE" },
      );

      if (resp.ok || resp.status === 204) {
        setDownloads((d) => d.filter((x) => x.id !== deletingItem.id));
        toast.success("آیتم از تاریخچه حذف شد");
      } else {
        const data = await resp.json().catch(() => ({}));
        toast.error(data.detail || "خطا در حذف آیتم از تاریخچه");
      }
    } catch (err) {
      console.error("Delete history error:", err);
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setIsDeleteOpen(false);
      setDeletingItem(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#030303] text-white pb-32 font-sans overflow-x-hidden"
      dir="rtl"
    >
      {/* Noise Texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-[60] backdrop-blur-2xl bg-black/60 border-b border-white/5 h-20 flex items-center px-6 justify-between transition-all duration-300">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <History className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60">
              تاریخچه دانلودها
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium uppercase tracking-[0.1em] mt-0.5">
              Download History
            </p>
          </div>
        </div>
        <button
          onClick={goBack}
          className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-90 rounded-2xl transition-all border border-white/5"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <main className="relative z-20 max-w-2xl mx-auto px-6 pt-10">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-28 bg-white/5 rounded-3xl animate-pulse flex items-center px-6 gap-6"
              >
                <div className="w-16 h-16 bg-white/10 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-white/10 rounded-full w-1/2" />
                  <div className="h-4 bg-white/10 rounded-full w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full" />
              <div className="relative w-24 h-24 rounded-[32px] bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center rotate-[15deg] transition-transform hover:rotate-0 duration-500">
                <Download className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3">تاریخچه شما خالی است</h2>
            <p className="text-gray-400 max-w-xs leading-relaxed">
              تمام آهنگ‌هایی که دانلود می‌کنید در این بخش برای دسترسی سریع‌تر
              ذخیره می‌شوند.
            </p>
            <button
              onClick={() => navigateTo("home")}
              className="mt-8 px-8 py-3.5 rounded-2xl bg-white text-black font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
            >
              شروع گوش دادن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {downloads.map((item, idx) => {
              const song = item.song;
              const isCurrent = currentTrack?.id === String(song.id);
              return (
                <div
                  key={item.id}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className={`group relative overflow-hidden rounded-[28px] p-4 flex items-center gap-5 transition-all duration-500 border animate-in fade-in slide-in-from-bottom-5 ${isCurrent ? "bg-gradient-to-br from-emerald-500/15 to-transparent border-emerald-500/30" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/10 shadow-2xl shadow-black/50"}`}
                >
                  <div className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                    <Image
                      src={song.cover_image}
                      alt={song.title}
                      fill
                      className="object-cover"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300 ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    >
                      <button
                        onClick={() =>
                          isCurrent ? togglePlay() : handlePlay(song)
                        }
                        className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-110 active:scale-90 transition-all"
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-5 h-5 text-black fill-black" />
                        ) : (
                          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div
                    className="flex-1 min-w-0"
                    onClick={() => navigateTo("song-detail", { id: song.id })}
                  >
                    <h3
                      className={`text-lg font-bold truncate leading-tight mb-0.5 ${isCurrent ? "text-emerald-400" : "text-white"}`}
                    >
                      {song.title}
                    </h3>
                    <p className="text-[13px] text-gray-400 truncate mb-2">
                      {song.artist_name}
                    </p>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                        <History className="w-3 h-3 text-emerald-500/60" />
                        {new Date(item.updated_at).toLocaleDateString("fa-IR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider">
                        Downloaded
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteClick(item)}
                    className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"
                  >
                    <Trash className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleOpenOptions(song)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedSong && (
        <SongOptionsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          song={selectedSong}
          onAction={(action, song) => {
            if (action === "details")
              navigateTo("song-detail", { id: song.id });
          }}
        />
      )}

      <AnimatePresence>
        {isDeleteOpen && deletingItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => {
                setIsDeleteOpen(false);
                setDeletingItem(null);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#0f1112] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
              dir="rtl"
            >
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-400">
                    <Trash className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      حذف از تاریخچه
                    </h3>
                    <p className="text-sm text-white/40 mt-1 truncate max-w-[220px]">
                      {deletingItem?.song?.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setDeletingItem(null);
                  }}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="px-6 pb-6 pt-2 text-right">
                <p className="text-sm text-white/60 mb-6">
                  آیا از حذف این آیتم از تاریخچه دانلودها مطمئن هستید؟ این عمل
                  قابل بازگشت نیست.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsDeleteOpen(false);
                      setDeletingItem(null);
                    }}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-2xl hover:bg-white/10 transition-all"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center gap-3 text-black font-black text-base shadow-xl shadow-emerald-500/20 active:scale-95"
                  >
                    حذف از تاریخچه
                  </button>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/6 blur-[60px] pointer-events-none rounded-full" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
