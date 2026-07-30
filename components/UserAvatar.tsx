"use client";

import React from "react";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { normalizeUserAvatarUrl } from "../lib/mediaUrl";

interface UserAvatarProps {
  src?: unknown;
  alt: string;
  className?: string;
  sizes?: string;
}

export default function UserAvatar({
  src,
  alt,
  className = "",
  sizes = "128px",
}: UserAvatarProps) {
  return (
    <ImageWithPlaceholder
      src={normalizeUserAvatarUrl(src)}
      alt={alt}
      type="user"
      sizes={sizes}
      className={className}
    />
  );
}
