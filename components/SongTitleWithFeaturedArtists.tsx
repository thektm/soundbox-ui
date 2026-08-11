import React from "react";
import { useNavigation } from "./NavigationContext";
import { createSlug } from "../lib/slug";
import {
  getFeaturedArtistEntries,
  getSongBaseTitle,
  getSongDisplayTitle,
  type SongDisplayLike,
} from "../lib/songDisplay";

type SongTitleWithFeaturedArtistsProps = {
  song: SongDisplayLike | null | undefined;
  className?: string;
  featuredLinkClassName?: string;
  onFeaturedArtistNavigate?: () => void;
};

/**
 * Renders the canonical `Title (ft. Artist, Artist)` label while making only
 * each featured artist name interactive. The clickable box is intentionally
 * width-fit with no padding so it never expands to the surrounding row on
 * mobile or desktop.
 */
export function SongTitleWithFeaturedArtists({
  song,
  className = "",
  featuredLinkClassName = "",
  onFeaturedArtistNavigate,
}: SongTitleWithFeaturedArtistsProps) {
  const { navigateTo } = useNavigation();
  const featuredArtists = getFeaturedArtistEntries(song);
  const baseTitle = getSongBaseTitle(song);

  if (!featuredArtists.length) {
    return <span className={className}>{getSongDisplayTitle(song)}</span>;
  }

  return (
    <span className={className}>
      <span>{baseTitle || getSongDisplayTitle(song)}</span>
      <span className="whitespace-nowrap">
        {" (ft. "}
        {featuredArtists.map((artist, index) => {
          const targetId = artist.id ?? artist.uniqueId;
          const sharedClassName = [
            "inline-flex w-fit flex-none items-baseline p-0 m-0 align-baseline",
            "bg-transparent border-0 leading-[inherit] text-inherit",
            artist.canNavigate
              ? "cursor-pointer hover:text-emerald-400 focus-visible:text-emerald-400 focus-visible:outline-none focus-visible:underline"
              : "cursor-text",
            featuredLinkClassName,
          ]
            .filter(Boolean)
            .join(" ");

          const activate = (event: React.SyntheticEvent) => {
            event.preventDefault();
            event.stopPropagation();
            if (!artist.canNavigate || targetId === undefined || targetId === null) {
              return;
            }
            navigateTo("artist-detail", {
              id: targetId,
              slug: createSlug(artist.name),
              name: artist.name,
            });
            onFeaturedArtistNavigate?.();
          };

          return (
            <React.Fragment key={artist.key}>
              {index > 0 ? ", " : ""}
              <span
                role={artist.canNavigate ? "link" : undefined}
                tabIndex={artist.canNavigate ? 0 : undefined}
                aria-label={
                  artist.canNavigate
                    ? `مشاهده صفحه هنرمند ${artist.name}`
                    : undefined
                }
                className={sharedClassName}
                style={{ width: "fit-content" }}
                onPointerDown={
                  artist.canNavigate
                    ? (event: React.PointerEvent<HTMLSpanElement>) => event.stopPropagation()
                    : undefined
                }
                onClick={artist.canNavigate ? activate : undefined}
                onKeyDown={
                  artist.canNavigate
                    ? (event: React.KeyboardEvent<HTMLSpanElement>) => {
                        if (event.key === "Enter" || event.key === " ") {
                          activate(event);
                        }
                      }
                    : undefined
                }
              >
                <bdi>{artist.name}</bdi>
              </span>
            </React.Fragment>
          );
        })}
        {")"}
      </span>
    </span>
  );
}

export default SongTitleWithFeaturedArtists;
