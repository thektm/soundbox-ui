import React from "react";

type SongCardProps = {
  image?: string;
  title: string;
  artist?: string;
  playedAt?: string;
  playCount?: number;
  onClick?: () => void;
};

export default function SongCard({
  image = "/music-listen.webp",
  title,
  artist = "نامشخص",
  playedAt,
  playCount,
  onClick,
}: SongCardProps) {
  return (
    <button
      onClick={onClick}
      className="min-w-[160px] sm:min-w-[180px] flex-shrink-0 relative group rounded-xl p-3 bg-white/3 border border-white/6 hover:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.6)] hover:scale-[1.01] transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#111] flex-shrink-0">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-9 h-9 bg-emerald-500/95 rounded-full flex items-center justify-center shadow-lg">
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M5 3v18l15-9-15-9z"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex-1 text-right truncate">
          <div className="text-sm font-medium text-white truncate">{title}</div>
          <div className="text-xs text-gray-400 truncate">{artist}</div>
          <div className="text-[10px] mt-1 text-gray-400 flex items-center gap-2">
            {playedAt && <span>{playedAt}</span>}
            
          </div>
        </div>
      </div>
    </button>
  );
}
