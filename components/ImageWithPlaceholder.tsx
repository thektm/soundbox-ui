"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { normalizeUserAvatarUrl } from "../lib/mediaUrl";

interface ImageWithPlaceholderProps {
  src?: string | string[];
  alt: string;
  className?: string;
  type?: "artist" | "song" | "user";
  fill?: boolean;
  sizes?: string;
}

const DEFAULT_CARD_SIZES =
  "(max-width: 480px) 44vw, (max-width: 768px) 30vw, (max-width: 1200px) 22vw, 220px";

const ImageWithPlaceholder: React.FC<ImageWithPlaceholderProps> = ({
  src,
  alt,
  className = "",
  type = "song",
  sizes = DEFAULT_CARD_SIZES,
}) => {
  const [error, setError] = useState(false);

  const handleImageError = () => {
    setError(true);
  };

  // support arrays of covers (e.g. playlists with top_three_song_covers)
  const rawResolvedSrc = Array.isArray(src) ? (src[2] ?? src[1] ?? src[0]) : src;
  const resolvedSrc =
    type === "user" ? normalizeUserAvatarUrl(rawResolvedSrc) : rawResolvedSrc;
  const isRemoteImage =
    typeof resolvedSrc === "string" && /^https?:\/\//i.test(resolvedSrc);

  useEffect(() => {
    setError(false);
  }, [resolvedSrc]);

  const isPlaceholder =
    !resolvedSrc || String(resolvedSrc).includes("picsum.photos") || error;

  // Nudge positions for user placeholder: move secondary icon up and logo down
  const secondaryIconStyle: React.CSSProperties | undefined =
    type === "user"
      ? { transform: "translateY(-15%)", opacity: 0.35 }
      : undefined;
  const logoStyle: React.CSSProperties | undefined =
    type === "user" ? { transform: "translateY(20%)" } : undefined;

  const secondaryImgStyle: React.CSSProperties | undefined =
    type === "user"
      ? { filter: "invert(1) brightness(1.2) contrast(1.05)" }
      : undefined;

  if (isPlaceholder) {
    const secondaryIcon =
      type === "artist"
        ? "/microphone.svg"
        : type === "user"
          ? "/user.svg"
          : "/song.svg";

    return (
      <div
        className={`relative flex items-center justify-center bg-zinc-800 overflow-hidden w-full h-full ${className}`}
      >
        {/* Secondary Icon (Microphone or Song) - Center/Background */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"
          style={secondaryIconStyle}
        >
          <div className="w-1/2 h-1/2 relative">
            <Image
              src={secondaryIcon}
              alt=""
              fill
              sizes="128px"
              className={
                type === "user" ? "object-contain" : "object-contain grayscale"
              }
              style={secondaryImgStyle}
            />
          </div>
        </div>

        {/* Logo - Overlay on top and centered */}
        <div
          className="relative z-10 w-1/3 h-1/3 pointer-events-none flex items-center justify-center"
          style={logoStyle}
        >
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            sizes="128px"
            className="object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Image
        src={resolvedSrc as string}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized={isRemoteImage}
        referrerPolicy={isRemoteImage ? "no-referrer" : undefined}
        className="object-cover"
        onError={handleImageError}
      />
    </div>
  );
};

export default ImageWithPlaceholder;
