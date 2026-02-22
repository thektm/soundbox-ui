"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Drawer } from "vaul";
import {
  Share2,
  UserPlus,
  UserMinus,
  Play,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { toast } from "react-hot-toast";
import { getFullShareUrl } from "../utils/share";
import { ReportModal } from "./ReportModal";

interface Artist {
  id: number;
  name: string;
  profile_image: string;
  is_following: boolean;
}

interface ArtistOptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  artist: Artist | null;
  onFollowToggle: () => Promise<void>;
  onPlayArtist: () => void;
}

export const ArtistOptionsDrawer = ({
  isOpen,
  onClose,
  artist,
  onFollowToggle,
  onPlayArtist,
}: ArtistOptionsDrawerProps) => {
  if (!artist) return null;

  const { accessToken } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      const url = getFullShareUrl("artist", artist.id, artist.name);
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: artist.name,
          text: `مشاهده هنرمند ${artist.name} در سداباکس`,
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
  };

  const handleToggleFollow = async () => {
    setIsActionLoading("follow");
    try {
      await onFollowToggle();
    } finally {
      setIsActionLoading(null);
      onClose();
    }
  };

  const options = [
    {
      id: "play",
      label: "پخش آثار هنرمند",
      icon: <Play className="w-5 h-5 fill-current" />,
      onClick: () => {
        onPlayArtist();
        onClose();
      },
    },
    {
      id: "follow",
      label: artist.is_following ? "لغو دنبال کردن" : "دنبال کردن",
      icon: artist.is_following ? (
        <UserMinus className="w-5 h-5" />
      ) : (
        <UserPlus className="w-5 h-5" />
      ),
      onClick: handleToggleFollow,
    },
    {
      id: "share",
      label: "اشتراک‌گذاری هنرمند",
      icon: <Share2 className="w-5 h-5" />,
      onClick: handleShare,
    },
    {
      id: "report",
      label: "گزارش هنرمند",
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
      onClick: () => {
        setIsReportModalOpen(true);
        // We don't close the drawer here, let the modal overlay handle it or the user close it.
        // Actually, for better DX, maybe we should close drawer.
        onClose();
      },
    },
  ];

  return (
    <>
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 max-h-[96%] bg-[#121212] rounded-t-[32px] z-[110] flex flex-col outline-none border-t border-white/5"
            dir="rtl"
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mt-3 mb-2" />

            {/* Artist Header */}
            <div className="px-6 py-4 flex items-center gap-4 border-b border-white/5">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-xl border-2 border-white/5 relative">
                <Image
                  src={artist.profile_image}
                  alt={artist.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-white truncate leading-tight">
                  {artist.name}
                </h3>
                <p className="text-[14px] text-white/50 truncate mt-1">
                  هنرمند انتخابی شما
                </p>
              </div>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto px-2 py-4 mb-safe">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  disabled={!!isActionLoading}
                  className="w-full flex items-center gap-5 px-5 py-4 rounded-3xl hover:bg-white/[0.04] active:bg-white/[0.08] transition-all group text-right disabled:opacity-50"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.03] flex items-center justify-center text-white/70 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all duration-300">
                    {isActionLoading === option.id ? (
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      option.icon
                    )}
                  </div>
                  <span className="flex-1 text-[17px] font-bold text-white/90 group-hover:text-white">
                    {option.label}
                  </span>
                  <ChevronLeft className="w-5 h-5 text-white/10 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetId={artist.id}
        targetType="artist"
        targetTitle={artist.name}
      />
    </>
  );
};
