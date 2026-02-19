"use client";

import React, { useState, useCallback } from "react";
import { Drawer } from "vaul";
import { Share2, Heart, Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { getFullShareUrl } from "../utils/share";

interface PlaylistOptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: {
    id: number | string;
    title?: string;
    is_liked?: boolean;
    likes_count?: number;
    unique_id?: string;
    public?: boolean;
  } | null;
  // If provided, will be called for actions: (action, playlist)
  onAction?: (action: string, payload: any) => Promise<any> | void;
}

export const PlaylistOptionsDrawer: React.FC<PlaylistOptionsDrawerProps> = ({
  isOpen,
  onClose,
  playlist,
  onAction,
}) => {
  const { accessToken } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);

  if (!playlist) return null;

  const handleShare = async () => {
    try {
      const url = getFullShareUrl("playlist", playlist.id);
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: playlist.title,
          text: `گوش دادن به پلی‌لیست ${playlist.title} در سداباکس`,
          url,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("لینک کپی شد");
      }
    } catch (err) {
      console.error("Playlist share failed:", err);
    } finally {
      onClose();
    }
  };

  const handleToggleLike = useCallback(async () => {
    if (processing) return;
    setProcessing("toggle-like");
    try {
      if (onAction) {
        const maybe = onAction("toggle-like", playlist);
        if (maybe && typeof (maybe as any).then === "function") {
          await (maybe as Promise<any>);
        }
      } else {
        // Fallback: call API directly
        const isRecommended =
          playlist.unique_id &&
          (String(playlist.unique_id).startsWith("smart_rec_") ||
            String(playlist.unique_id).startsWith("liked_rec_"));
        const url = isRecommended
          ? `https://api.sedabox.com/api/home/playlist-recommendations/${playlist.unique_id}/like/`
          : `https://api.sedabox.com/api/playlists/${playlist.id}/like/`;

        const headers: Record<string, string> = {};
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

        const resp = await fetch(url, { method: "POST", headers });
        if (resp.ok) {
          const data = await resp.json();
          const liked = data.liked ?? data.is_liked ?? true;
          window.dispatchEvent(
            new CustomEvent("playlist-like-changed", {
              detail: {
                id: String(playlist.id),
                liked,
                likes_count: data.likes_count,
              },
            }),
          );
          toast.success(liked ? "پلی‌لیست لایک شد" : "لایک حذف شد");
        } else {
          if (resp.status === 401) toast.error("برای لایک کردن لطفا وارد شوید");
          else toast.error("خطا در بروزرسانی لایک");
        }
      }
    } catch (err) {
      console.error("Toggle playlist like failed:", err);
      toast.error("خطا در بروزرسانی لایک");
    } finally {
      setProcessing(null);
      onClose();
    }
  }, [onAction, playlist, accessToken, processing, onClose]);

  const options = [
    {
      id: "share",
      label: "اشتراک‌گذاری",
      icon: <Share2 className="w-5 h-5" />,
      onClick: handleShare,
    },
    {
      id: "toggle-like",
      label: playlist.is_liked
        ? "حذف از پلی‌لیست‌های موردپسند"
        : "افزودن به پلی‌لیست‌های موردپسند",
      icon:
        processing === "toggle-like" ? (
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        ) : (
          <Heart
            className={`w-5 h-5 ${playlist.is_liked ? "text-emerald-400" : ""}`}
          />
        ),
      onClick: handleToggleLike,
    },
  ];

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 max-h-[88%] bg-[#121212] rounded-t-[28px] z-[110] flex flex-col outline-none shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
          dir="rtl"
        >
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/20 mt-3 mb-2" />

          <div className="px-6 py-4 flex items-center gap-4 border-b border-white/5">
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-bold text-white truncate leading-tight">
                {playlist.title}
              </h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 mb-safe">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={option.onClick}
                className="relative w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-colors group text-right hover:bg-white/5 active:bg-white/10"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 group-hover:bg-white/10 group-hover:text-white transition-all">
                  {option.icon}
                </div>

                <span className="flex-1 text-[16px] font-medium text-white/90 group-hover:text-white">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default PlaylistOptionsDrawer;
