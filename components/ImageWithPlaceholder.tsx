"use client";

import React, { useState } from "react";

interface ImageWithPlaceholderProps {
  src?: string | string[];
  alt: string;
  className?: string;
  type?: "artist" | "song";
}

const ImageWithPlaceholder: React.FC<ImageWithPlaceholderProps> = ({
  src,
  alt,
  className = "",
  type = "song",
}) => {
  const [error, setError] = useState(false);

  const handleImageError = () => {
    setError(true);
  };

  // support arrays of covers (e.g. playlists with top_three_song_covers)
  const resolvedSrc = Array.isArray(src) ? (src[2] ?? src[1] ?? src[0]) : src;
  const isPlaceholder =
    !resolvedSrc || String(resolvedSrc).includes("picsum.photos") || error;

  if (isPlaceholder) {
    const secondaryIcon = type === "artist" ? "/microphone.svg" : "/song.svg";

    return (
      <div
        className={`relative flex items-center justify-center bg-zinc-800 overflow-hidden w-full h-full ${className}`}
      >
        {/* Secondary Icon (Microphone or Song) - Center/Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <img
            src={secondaryIcon}
            alt=""
            className="w-1/2 h-1/2 object-contain grayscale"
          />
        </div>

        {/* Logo - Overlay on top and centered */}
        <div className="relative z-10 w-1/3 h-1/3 pointer-events-none flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc as string}
      alt={alt}
      className={className}
      onError={handleImageError}
      loading="lazy"
    />
  );
};

export default ImageWithPlaceholder;
