"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useNavigation } from "./NavigationContext";
import {
  MOCK_SONGS,
  MOCK_ALBUMS,
  Song,
  createSlug,
  decodeSlug,
} from "./mockData";

// Reuse the same icons and helpers from the page version
const SvgIcon = ({
  d,
  className,
  fill = "currentColor",
  strokeWidth = 0,
}: {
  d: string;
  className?: string;
  fill?: string;
  strokeWidth?: number;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={fill === "none" ? "none" : fill}
    stroke={fill === "none" ? "currentColor" : "none"}
    strokeWidth={strokeWidth}
  >
    <path d={d} />
  </svg>
);

const ICON_PATHS = {
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  heart:
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  clock:
    "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z",
  music:
    "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
  shuffle:
    "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  arrowLeft: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  shareNetwork:
    "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z",
  dotsThree:
    "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
};

const Icon = ({
  name,
  className,
  fill = true,
}: {
  name: keyof typeof ICON_PATHS;
  className?: string;
  fill?: boolean;
}) => (
  <SvgIcon
    d={ICON_PATHS[name]}
    className={className}
    fill={fill ? "currentColor" : "none"}
    strokeWidth={fill ? 0 : 2}
  />
);

export function findAlbumBySlug(
  slug: string
): (typeof MOCK_ALBUMS)[0] | undefined {
  const decodedSlug = decodeSlug(slug);
  return MOCK_ALBUMS.find((album) => {
    const albumSlug = createSlug(album.title);
    const decodedAlbumSlug = decodeSlug(albumSlug);
    return (
      decodedAlbumSlug.toLowerCase() === decodedSlug.toLowerCase() ||
      album.title.toLowerCase().replace(/\s+/g, " ").trim() ===
        decodedSlug.toLowerCase()
    );
  });
}

interface SongRowProps {
  song: Song;
  index: number;
  isPlaying?: boolean;
  onPlay?: () => void;
}

const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  isPlaying = false,
  onPlay,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
      className={`group grid grid-cols-[16px_4fr_minmax(80px,1fr)] md:grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-1 py-2 rounded-md transition-colors cursor-pointer ${
        isPlaying
          ? "bg-white/10"
          : isHovered
          ? "bg-white/5"
          : "hover:bg-white/5"
      }`}
    >
      <div className="flex items-center justify-center w-4">
        {isHovered ? (
          <button className="text-white">
            {isPlaying ? (
              <Icon name="pause" className="w-3.5 h-3.5" />
            ) : (
              <Icon name="play" className="w-3.5 h-3.5" />
            )}
          </button>
        ) : isPlaying ? (
          <Icon name="music" className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <span className="text-sm text-neutral-400">{index + 1}</span>
        )}
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-neutral-800">
          <Image
            src={song.image}
            alt={song.title}
            fill
            sizes="40px"
            quality={75}
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium truncate ${
              isPlaying ? "text-green-500" : "text-white"
            }`}
          >
            {song.title}
          </p>
          <p className="text-xs text-neutral-400 truncate flex items-center gap-1">
            {song.explicit && (
              <span className="px-1 py-0.5 text-[10px] font-bold bg-neutral-600 text-white rounded">
                E
              </span>
            )}
            {song.artist}
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center">
        <p className="text-sm text-neutral-400">۱ هفته پیش</p>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
            isLiked ? "opacity-100" : ""
          }`}
        >
          <Icon
            name="heart"
            className={`w-4 h-4 ${
              isLiked ? "text-green-500" : "text-neutral-400 hover:text-white"
            }`}
            fill={isLiked}
          />
        </button>
        <span className="text-sm text-neutral-400">{song.duration}</span>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-white">
          <Icon name="dotsThree" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

interface AlbumDetailProps {
  slug?: string;
  album?: (typeof MOCK_ALBUMS)[0];
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({
  slug,
  album: albumProp,
}) => {
  const { setCurrentPage } = useNavigation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);

  const album = useMemo(() => {
    if (albumProp) return albumProp;
    if (!slug) return null;
    return findAlbumBySlug(slug);
  }, [slug, albumProp]);

  const albumSongs = useMemo(() => {
    return [...MOCK_SONGS].sort(() => Math.random() - 0.5).slice(0, 12);
  }, [album?.id]);

  const handlePlayAll = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && currentSongIndex === null) {
      setCurrentSongIndex(0);
    }
  };

  const handlePlaySong = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  if (!album) {
    return (
      <div
        className="min-h-screen bg-linear-to-b from-neutral-900 to-neutral-950 text-white"
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center">
            <Icon
              name="music"
              className="w-16 h-16 mx-auto text-neutral-600 mb-4"
            />
            <h1 className="text-2xl font-bold mb-2">آلبوم پیدا نشد</h1>
            <p className="text-neutral-400 mb-6">
              متاسفانه آلبوم مورد نظر شما یافت نشد.
            </p>
            <button
              onClick={() => setCurrentPage("home")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors"
            >
              <Icon name="arrowLeft" className="w-5 h-5" />
              بازگشت به خانه
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-linear-to-b from-neutral-900 via-neutral-950 to-black text-white pb-24"
      dir="rtl"
    >
      <header
        className="relative w-full h-96 md:h-[500px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%), url(${album.image})`,
        }}
      >
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => setCurrentPage("home")}
            className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-300 hover:scale-105"
          >
            <Icon name="arrowLeft" className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="absolute inset-0 flex items-end justify-end px-6 md:px-12 pb-8">
          <div className="text-right max-w-lg w-full">
            <p className="text-sm font-semibold text-green-400 mb-2 uppercase tracking-wide">
              {album.type}
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black mb-4 text-white drop-shadow-lg">
              {album.title}
            </h1>
            <p className="text-neutral-200 text-base md:text-lg mb-6 leading-relaxed">
              {album.description}
            </p>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <span className="font-medium">{album.artist}</span>
              <span>•</span>
              <span>{album.year}</span>
              <span>•</span>
              <span>{albumSongs.length} آهنگ</span>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <div className="px-3 py-1 text-xs font-bold bg-green-500 text-black rounded-full shadow-lg">
            {album.type}
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 bg-linear-to-b from-neutral-950/95 to-neutral-950 px-6 md:px-12 py-6 border-b border-white/10">
        <div className="flex items-center gap-6">
          <button
            onClick={handlePlayAll}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 hover:scale-110 flex items-center justify-center shadow-2xl transition-all duration-300"
          >
            {isPlaying ? (
              <Icon name="pause" className="w-7 h-7 text-black" />
            ) : (
              <Icon name="play" className="w-7 h-7 text-black ml-1" />
            )}
          </button>

          <button className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-green-500 transition-colors duration-200">
            <Icon name="shuffle" className="w-7 h-7" />
          </button>

          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors duration-200 ${
              isLiked ? "text-green-500" : "text-neutral-400 hover:text-white"
            }`}
          >
            <Icon name="heart" className="w-7 h-7" fill={isLiked} />
          </button>

          <button className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-200">
            <Icon name="shareNetwork" className="w-7 h-7" />
          </button>

          <button className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors duration-200">
            <Icon name="dotsThree" className="w-7 h-7" />
          </button>
        </div>
      </div>

      <main className="px-6 md:px-12">
        <div className="grid grid-cols-[16px_4fr_minmax(80px,1fr)] md:grid-cols-[16px_4fr_2fr_minmax(80px,1fr)] gap-4 px-4 py-3 border-b border-white/10 text-neutral-400 text-sm font-medium">
          <div className="flex items-center justify-center">#</div>
          <div>Title</div>
          <div className="hidden md:block">Date Added</div>
          <div className="flex items-center justify-end">
            <Icon name="clock" className="w-[18px] h-[18px]" />
          </div>
        </div>

        <div className="mt-4 space-y-1">
          {albumSongs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              isPlaying={currentSongIndex === index && isPlaying}
              onPlay={() => handlePlaySong(index)}
            />
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-linear-to-t from-black via-black/95 to-transparent pointer-events-none" />
    </div>
  );
};

export default AlbumDetail;
