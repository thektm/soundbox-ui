"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Drawer } from "vaul";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Share2,
  Heart,
  PlusCircle,
  ListMusic,
  Info,
  Check,
  Download,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "./AuthContext";
import { usePlayer } from "./PlayerContext";
import { useNavigation } from "./NavigationContext";
import { createSlug } from "./home";
import { toast } from "react-hot-toast";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { ReportModal } from "./ReportModal";
import { getFullShareUrl } from "../utils/share";

interface SongOptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  song: {
    id: number | string;
    title: string;
    artist_name?: string;
    cover_image: string;
    is_liked?: boolean;
  } | null;
  onAction?: (action: string, song: any) => Promise<any> | void;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export const SongOptionsDrawer = ({
  isOpen,
  onClose,
  song,
  onAction,
}: SongOptionsDrawerProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { accessToken, user, authenticatedFetch } = useAuth();
  const { download, playTrack, queue, setQueue, isVisible, currentIndex } =
    usePlayer();

  const isPremium =
    !!user?.plan && String(user.plan).toLowerCase().includes("premium");
  const { navigateTo } = useNavigation();
  const [processing, setProcessing] = useState<string | null>(null);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [localIsLiked, setLocalIsLiked] = useState<boolean | undefined>(
    song?.is_liked,
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (isOpen && song?.id) {
      setLocalIsLiked(song.is_liked);

      const fetchDetail = async () => {
        setIsLoadingDetail(true);
        try {
          const resp = await authenticatedFetch(
            `https://api.sedabox.com/api/songs/${song.id}/`,
          );
          if (resp.ok) {
            const data = await resp.json();
            setLocalIsLiked(data.is_liked);
          }
        } catch (err) {
          console.error("Failed to fetch song detail:", err);
        } finally {
          setIsLoadingDetail(false);
        }
      };

      fetchDetail();
    }
  }, [isOpen, song?.id, authenticatedFetch]);

  const handleActionClick = useCallback(
    async (actionId: string) => {
      if (!song || processing) return;

      if (actionId === "share") {
        try {
          const url = getFullShareUrl("song", song.id, song.title);
          if (typeof navigator !== "undefined" && navigator.share) {
            await navigator.share({
              title: song.title,
              text: `گوش دادن به ${song.title} از ${song.artist_name} در سداباکس`,
              url: url,
            });
          } else if (typeof navigator !== "undefined" && navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            toast.success("لینک کپی شد");
          }
        } catch (err) {
          console.error("Share failed:", err);
        } finally {
          onClose();
        }
        return;
      }

      if (actionId === "add-to-playlist") {
        setIsAddToPlaylistOpen(true);
        onClose();
        return;
      }

      if (actionId === "add-to-queue") {
        // Build a Track-like object expected by PlayerContext
        const trackToAdd = {
          id: String(song.id),
          title: song.title,
          artist: song.artist_name || "Unknown Artist",
          image: song.cover_image || "",
          duration: (song as any).duration || "0:00",
          src:
            (song as any).src ||
            (song as any).stream_url ||
            (song as any).audio_file ||
            `https://api.sedabox.com/api/songs/${song.id}/stream/`,
        };

        try {
          // If player is completely closed/hidden, start playing the song immediately
          if (!isVisible) {
            playTrack(trackToAdd as any);
            try {
              toast.success("در حال پخش");
            } catch (e) {}
          } else {
            // Append to end of existing queue and preserve currentIndex so playback doesn't jump
            try {
              const newQueue = [...queue, trackToAdd as any];
              setQueue(newQueue, currentIndex);
              try {
                toast.success("به انتهای صف اضافه شد");
              } catch (e) {}
            } catch (e) {
              console.error("Failed to append to queue:", e);
            }
          }
        } catch (err) {
          console.error("Add to queue failed:", err);
        } finally {
          onClose();
        }

        return;
      }

      if (actionId === "report") {
        setIsReportModalOpen(true);
        onClose();
        return;
      }

      if (actionId === "download") {
        const url =
          (song as any).src ||
          (song as any).stream_url ||
          (song as any).audio_file ||
          `https://api.sedabox.com/api/songs/${song.id}/stream/`;
        download({
          id: String(song.id),
          title: song.title,
          artist: song.artist_name || "Unknown Artist",
          image: song.cover_image,
          duration: "0:00",
          src: url,
        });
        onClose();
        return;
      }

      if (actionId === "details") {
        console.log("SongOptionsDrawer: details clicked", {
          id: song.id,
          title: song.title,
          artist: song.artist_name,
        });
        try {
          const artistSlug = song.artist_name
            ? createSlug(song.artist_name)
            : undefined;
          const songSlug = song.title ? createSlug(song.title) : undefined;
          console.log("SongOptionsDrawer: navigating via navigateTo", {
            artistSlug,
            songSlug,
          });
          navigateTo("song-detail", { id: song.id, artistSlug, songSlug });
        } catch (err) {
          console.error("SongOptionsDrawer: navigateTo failed", err);
          // fallback: push state and dispatch popstate so NavigationContext picks it up
          try {
            if (typeof window !== "undefined") {
              const state = { page: "song-detail", params: { id: song.id } };
              const path = `/track/${song.id}`;
              console.log("SongOptionsDrawer: fallback pushState", {
                state,
                path,
              });
              window.history.pushState(state, "", path);
              window.dispatchEvent(new PopStateEvent("popstate", { state }));
            }
          } catch (e) {
            console.error("SongOptionsDrawer: Navigation fallback failed:", e);
          }
        }

        onClose();
        return;
      }

      // Only special-case toggle-like to wait for response and sync
      if (actionId === "toggle-like") {
        setProcessing(actionId);
        try {
          // If parent provided handler, call it and await if it returns a promise
          if (onAction) {
            const maybePromise = onAction(actionId, song);
            if (
              maybePromise &&
              typeof (maybePromise as any).then === "function"
            ) {
              try {
                const data = await (maybePromise as Promise<any>);
                console.log("Like response from onAction:", data);
                if (
                  data &&
                  (data.liked !== undefined || data.likes_count !== undefined)
                ) {
                  window.dispatchEvent(
                    new CustomEvent("song-like-changed", {
                      detail: {
                        id: String(song.id),
                        liked: data.liked,
                        likes_count: data.likes_count,
                      },
                    }),
                  );
                }
              } catch (err) {
                console.error("onAction like handler failed:", err);
              }
            } else {
              // Parent did not return a promise; perform fallback API call so drawer waits and notifies
              try {
                const url = `https://api.sedabox.com/api/songs/${song.id}/like/`;
                const resp = await authenticatedFetch(url, { method: "POST" });
                if (resp.ok) {
                  const data = await resp.json();
                  console.log("Like response (fallback):", data);
                  setLocalIsLiked(data.liked);
                  window.dispatchEvent(
                    new CustomEvent("song-like-changed", {
                      detail: {
                        id: String(song.id),
                        liked: data.liked,
                        likes_count: data.likes_count,
                      },
                    }),
                  );
                  try {
                    const msg = data.liked
                      ? "به لایک‌ها اضافه شد"
                      : "از لایک‌ها حذف شد";
                    toast.success(msg);
                  } catch (e) {}
                } else {
                  console.warn("Like request failed", resp.status);
                  if (resp.status === 401) {
                    try {
                      toast.error("برای لایک کردن لطفا وارد شوید");
                    } catch (e) {}
                  } else {
                    try {
                      toast.error("خطا در بروزرسانی لایک");
                    } catch (e) {}
                  }
                }
              } catch (err) {
                console.error("Failed to toggle like (fallback):", err);
                try {
                  toast.error("خطا در بروزرسانی لایک");
                } catch (e) {}
              }
            }
          } else {
            // Fallback: perform the same API call as other components
            try {
              const url = `https://api.sedabox.com/api/songs/${song.id}/like/`;
              const resp = await authenticatedFetch(url, { method: "POST" });
              if (resp.ok) {
                const data = await resp.json();
                console.log("Like response:", data);
                setLocalIsLiked(data.liked);
                window.dispatchEvent(
                  new CustomEvent("song-like-changed", {
                    detail: {
                      id: String(song.id),
                      liked: data.liked,
                      likes_count: data.likes_count,
                    },
                  }),
                );
                try {
                  toast.success(
                    data.liked ? "به لایک‌ها اضافه شد" : "از لایک‌ها حذف شد",
                  );
                } catch (e) {}
              } else {
                console.warn("Like request failed", resp.status);
                try {
                  toast.error("خطا در بروزرسانی لایک");
                } catch (e) {}
              }
            } catch (err) {
              console.error("Failed to toggle like:", err);
            }
          }
        } finally {
          setProcessing(null);
          onClose();
        }
        return;
      }

      // Non-like actions: call handler and close immediately
      try {
        const maybe = onAction?.(actionId, song);
        if (maybe && typeof (maybe as any).then === "function") {
          // wait briefly for parent to perform side-effects, but we don't block UI
          try {
            await (maybe as Promise<any>);
          } catch (err) {
            console.error("Action handler failed:", err);
          }
        }
      } finally {
        onClose();
      }
    },
    [
      onAction,
      song,
      accessToken,
      processing,
      onClose,
      setLocalIsLiked,
      navigateTo,
    ],
  );

  // Return early after all hooks have been initialized for the component
  if (!song) return null;

  const isLiked = localIsLiked ?? song.is_liked;

  const options = [
    {
      id: "share",
      label: "اشتراک‌گذاری",
      icon: <Share2 className="w-5 h-5" />,
      onClick: () => handleActionClick("share"),
    },
    {
      id: "download",
      label: "دانلود آهنگ",
      icon: <Download className="w-5 h-5" />,
      onClick: () => handleActionClick("download"),
      disabled: !isPremium,
    },
    {
      id: "toggle-like",
      label: isLiked ? "حذف از قطعات مورد پسند" : "افزودن به قطعات مورد پسند",
      icon: isLoadingDetail ? (
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
      ) : (
        <Heart
          className={`w-5 h-5 ${isLiked ? "fill-emerald-400 stroke-emerald-400 text-emerald-400" : ""}`}
        />
      ),
      onClick: () => handleActionClick("toggle-like"),
    },
    {
      id: "add-to-playlist",
      label: "افزودن به پلی‌لیست",
      icon: <PlusCircle className="w-5 h-5" />,
      onClick: () => handleActionClick("add-to-playlist"),
    },
    {
      id: "add-to-queue",
      label: "افزودن به صف پخش",
      icon: <ListMusic className="w-5 h-5" />,
      onClick: () => handleActionClick("add-to-queue"),
    },
    {
      id: "details",
      label: "جزئیات آهنگ",
      icon: <Info className="w-5 h-5" />,
      onClick: () => handleActionClick("details"),
    },
    {
      id: "report",
      label: "گزارش خطا یا محتوا",
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      onClick: () => handleActionClick("report"),
    },
  ];

  const content = (
    <div
      className={`bg-[#121212] flex flex-col outline-none shadow-[0_-8px_40px_rgba(0,0,0,0.5)] ${isDesktop ? "rounded-[32px] overflow-hidden" : "rounded-t-[32px]"}`}
      dir="rtl"
    >
      {/* Handle */}
      {!isDesktop && (
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mt-3 mb-2" />
      )}
      {isDesktop && <div className="mt-4" />}

      {/* Song Header */}
      <div className="px-6 py-4 flex items-center gap-4 border-b border-white/5 relative">
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg relative">
          <Image
            src={song.cover_image}
            alt={song.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-bold text-white truncate leading-tight">
            {song.title}
          </h3>
          <p className="text-[14px] text-white/50 truncate mt-1">
            {song.artist_name}
          </p>
        </div>
        {isDesktop && (
          <button
            onClick={onClose}
            className="absolute left-4 top-4 text-white/40 hover:text-white transition-all transform hover:scale-110 active:scale-95 bg-white/5 hover:bg-white/10 p-2 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Options List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 mb-safe">
        {options.map((option) => {
          const optionDisabled = !!processing || !!(option as any).disabled;
          return (
            <button
              key={option.id}
              onClick={
                optionDisabled ? undefined : () => handleActionClick(option.id)
              }
              disabled={optionDisabled}
              className={`relative w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-colors group text-right ${
                optionDisabled
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-white/5 active:bg-white/10"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 group-hover:bg-white/10 group-hover:text-white transition-all">
                {processing === option.id ? (
                  <div className="w-4 h-4 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin" />
                ) : (
                  option.icon
                )}
              </div>

              <span
                className={`flex-1 text-[16px] font-medium ${optionDisabled ? "text-white/60" : "text-white/90 group-hover:text-white"}`}
              >
                {option.label}
              </span>

              {/* Premium badge placed far left inside the button */}
              {option.id === "download" && (option as any).disabled && (
                <span className="absolute left-6 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-[10px] px-3 py-0.5 rounded-full font-semibold shadow-md">
                  پریمیوم
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[110] outline-none shadow-2xl border border-white/5 rounded-[32px]">
              {content}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <Drawer.Content
              className="fixed bottom-0 left-0 right-0 max-h-[96%] bg-[#121212] rounded-t-[32px] z-[110] flex flex-col outline-none shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
              dir="rtl"
            >
              {content}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      <AddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
        songId={song.id}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetId={song.id}
        targetType="song"
        targetTitle={song.title}
      />
    </>
  );
};
