export type FeaturedArtistLike =
  | string
  | number
  | {
      id?: string | number | null;
      unique_id?: string | null;
      uniqueId?: string | null;
      url_slug?: string | null;
      urlSlug?: string | null;
      name?: string | null;
      name_fa?: string | null;
      name_en?: string | null;
      artistic_name?: string | null;
      artistic_name_fa?: string | null;
      artistic_name_en?: string | null;
      artisticName?: string | null;
      artisticNameFa?: string | null;
      artisticNameEn?: string | null;
    };

export type SongDisplayLike = {
  title?: unknown;
  title_fa?: unknown;
  title_en?: unknown;
  display_title?: unknown;
  displayTitle?: unknown;
  featured_artists?: unknown;
  featuredArtists?: unknown;
};

export type FeaturedArtistEntry = {
  key: string;
  name: string;
  id?: string | number;
  uniqueId?: string;
  urlSlug?: string;
  canNavigate: boolean;
};

const textValue = (value: unknown): string =>
  typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";

const FEATURE_SUFFIX_RE = /\s*\((?:ft|feat)\.\s*([^)]*)\)\s*$/i;

export function getFeaturedArtistName(artist: FeaturedArtistLike): string {
  if (typeof artist === "string" || typeof artist === "number") {
    return textValue(artist);
  }
  if (!artist || typeof artist !== "object") return "";

  // Persian public/stage names are intentionally preferred. English and IDs
  // are fallback-only so Farsi UI never falls back to an opaque number while
  // a readable artist label exists.
  return (
    textValue(artist.artistic_name_fa) ||
    textValue(artist.artisticNameFa) ||
    textValue(artist.name_fa) ||
    textValue(artist.artistic_name) ||
    textValue(artist.artisticName) ||
    textValue(artist.name) ||
    textValue(artist.artistic_name_en) ||
    textValue(artist.artisticNameEn) ||
    textValue(artist.name_en) ||
    textValue(artist.unique_id) ||
    textValue(artist.uniqueId) ||
    textValue(artist.id)
  );
}

export function getFeaturedArtistEntries(
  song: SongDisplayLike | null | undefined,
): FeaturedArtistEntry[] {
  const raw = Array.isArray(song?.featured_artists)
    ? song.featured_artists
    : Array.isArray(song?.featuredArtists)
      ? song.featuredArtists
      : [];

  const entries: FeaturedArtistEntry[] = [];
  const seen = new Set<string>();

  for (const [index, artist] of (raw as FeaturedArtistLike[]).entries()) {
    const name = getFeaturedArtistName(artist);
    if (!name) continue;

    const objectArtist =
      artist && typeof artist === "object" && !Array.isArray(artist)
        ? artist
        : null;
    const id = objectArtist?.id ?? undefined;
    const uniqueId = objectArtist
      ? textValue(objectArtist.unique_id) || textValue(objectArtist.uniqueId)
      : "";
    const urlSlug = objectArtist
      ? textValue(objectArtist.url_slug) || textValue(objectArtist.urlSlug)
      : "";
    const identity =
      id !== undefined && id !== null
        ? `id:${String(id)}`
        : uniqueId
          ? `uid:${uniqueId}`
          : `name:${name.toLocaleLowerCase()}`;

    if (seen.has(identity)) continue;
    seen.add(identity);

    entries.push({
      key: `${identity}:${index}`,
      name,
      ...(id !== undefined && id !== null ? { id } : {}),
      ...(uniqueId ? { uniqueId } : {}),
      ...(urlSlug ? { urlSlug } : {}),
      canNavigate: Boolean(
        uniqueId ||
          (id !== undefined &&
            id !== null &&
            String(id).trim() &&
            !String(id).startsWith("featured-")),
      ),
    });
  }

  return entries;
}

export function getFeaturedArtistNames(
  song: SongDisplayLike | null | undefined,
): string[] {
  return getFeaturedArtistEntries(song).map((artist) => artist.name);
}

export function getSongBaseTitle(
  song: SongDisplayLike | null | undefined,
): string {
  const baseTitle =
    textValue(song?.title) ||
    textValue(song?.title_fa) ||
    textValue(song?.title_en) ||
    textValue(song?.display_title) ||
    textValue(song?.displayTitle) ||
    "";
  return baseTitle.replace(FEATURE_SUFFIX_RE, "").trim();
}

export function getSongDisplayTitle(song: SongDisplayLike | null | undefined): string {
  const baseTitle =
    textValue(song?.title) ||
    textValue(song?.title_fa) ||
    textValue(song?.title_en) ||
    "";
  const serverTitle = textValue(song?.display_title) || textValue(song?.displayTitle);
  const featuredNames = getFeaturedArtistNames(song);

  // If the server already supplied a display title, normalize legacy "feat."
  // to the required "ft." form. When structured featured-artist data exists,
  // rebuild from the canonical base title so duplicate suffixes are impossible.
  if (!featuredNames.length && serverTitle) {
    return serverTitle.replace(FEATURE_SUFFIX_RE, (_match, names: string) =>
      names.trim() ? ` (ft. ${names.trim()})` : "",
    );
  }

  const cleanBase = baseTitle.replace(FEATURE_SUFFIX_RE, "").trim();
  if (!featuredNames.length) return cleanBase || serverTitle;
  return `${cleanBase || serverTitle} (ft. ${featuredNames.join(", ")})`;
}

export function withSongDisplayTitle<T extends SongDisplayLike>(song: T): T {
  if (!song || typeof song !== "object") return song;
  const displayTitle = getSongDisplayTitle(song);
  return {
    ...song,
    title: displayTitle || textValue(song.title),
    display_title: displayTitle,
  };
}

export function normalizeSongCollection<T extends SongDisplayLike>(songs: unknown): T[] {
  return Array.isArray(songs)
    ? songs.filter((song): song is T => Boolean(song && typeof song === "object")).map(withSongDisplayTitle)
    : [];
}

export function getPlayerFeaturedArtists(song: SongDisplayLike | null | undefined): Array<{
  id: string | number;
  name: string;
  uniqueId?: string;
  urlSlug?: string;
}> {
  const raw = Array.isArray(song?.featured_artists)
    ? song.featured_artists
    : Array.isArray(song?.featuredArtists)
      ? song.featuredArtists
      : [];
  const result: Array<{ id: string | number; name: string; uniqueId?: string; urlSlug?: string }> = [];

  for (const [index, artist] of (raw as FeaturedArtistLike[]).entries()) {
    const name = getFeaturedArtistName(artist);
    if (!name) continue;
    if (typeof artist === "string" || typeof artist === "number") {
      result.push({ id: `featured-${index}-${name}`, name });
      continue;
    }

    const uniqueId = textValue(artist.unique_id) || textValue(artist.uniqueId);
    const urlSlug = textValue(artist.url_slug) || textValue(artist.urlSlug);
    result.push({
      id: artist.id ?? artist.unique_id ?? artist.uniqueId ?? `featured-${index}-${name}`,
      name,
      ...(uniqueId ? { uniqueId } : {}),
      ...(urlSlug ? { urlSlug } : {}),
    });
  }
  return result;
}
