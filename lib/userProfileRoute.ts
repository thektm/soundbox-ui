import { slugify } from "../utils/share";

export type UserRouteSource = object | null | undefined;

const OFFICIAL_UNIQUE_ID = "sedabox";
const OFFICIAL_NAME_KEYS = new Set([
  "sedabox",
  "sedaboxofficial",
  "officialsedabox",
  "صداباکس",
  "صداباکسرسمی",
  "حسابرسمیصداباکس",
]);

function asText(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizedIdentity(value: unknown): string {
  return asText(value)
    .toLocaleLowerCase("en-US")
    .replace(/[\s\u200c\u200f\u200e_|\-–—.]+/g, "");
}

function firstValue(source: UserRouteSource, keys: string[]): string {
  if (!source) return "";
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = asText(record[key]);
    if (value) return value;
  }
  return "";
}

export function getUserUniqueId(source: UserRouteSource): string {
  return firstValue(source, [
    "uniqueId",
    "unique_id",
    "username",
    "user_unique_id",
    "creator_unique_id",
  ]).replace(/^@/, "");
}

export function getUserDatabaseId(source: UserRouteSource): string {
  if (!source) return "";
  const explicit = firstValue(source, ["dbId", "db_id", "user_id", "userId", "creator_user_id"]);
  if (explicit) return explicit;

  const id = asText((source as Record<string, unknown>).id);
  return /^\d+$/.test(id) ? id : "";
}

export function getUserDisplayName(source: UserRouteSource): string {
  if (!source) return "";
  const explicit = firstValue(source, [
    "fullName",
    "full_name",
    "displayName",
    "display_name",
    "name",
    "creator_name",
  ]);
  if (explicit) return explicit;

  const firstName = firstValue(source, ["firstName", "first_name"]);
  const lastName = firstValue(source, ["lastName", "last_name"]);
  return `${firstName} ${lastName}`.trim();
}

export function isSedaboxUser(source: UserRouteSource | string | number): boolean {
  if (typeof source === "string" || typeof source === "number") {
    return normalizedIdentity(source) === OFFICIAL_UNIQUE_ID;
  }
  if (!source) return false;
  const record = source as Record<string, unknown>;
  if (record.isOfficial === true || record.is_official === true) return true;

  const uniqueId = normalizedIdentity(getUserUniqueId(source));
  if (uniqueId === OFFICIAL_UNIQUE_ID) return true;

  const names = [
    getUserDisplayName(source),
    firstValue(source, ["first_name"]),
    firstValue(source, ["last_name"]),
  ];
  return names.some((name) => OFFICIAL_NAME_KEYS.has(normalizedIdentity(name)));
}

export interface CanonicalUserRouteParams extends Record<string, unknown> {
  id: string;
  dbId?: string;
  uniqueId?: string;
  name?: string;
  isOfficial?: boolean;
}

export function buildUserNavigationParams(source: UserRouteSource | string | number): CanonicalUserRouteParams {
  const objectSource: UserRouteSource =
    typeof source === "object" && source !== null ? source : { id: source };
  const uniqueId = getUserUniqueId(objectSource);
  const dbId = getUserDatabaseId(objectSource);
  const name = getUserDisplayName(objectSource);
  const official =
    isSedaboxUser(objectSource) ||
    ((typeof source === "string" || typeof source === "number") &&
      normalizedIdentity(source) === OFFICIAL_UNIQUE_ID);

  if (official) {
    return {
      id: OFFICIAL_UNIQUE_ID,
      uniqueId: OFFICIAL_UNIQUE_ID,
      ...(dbId ? { dbId } : {}),
      name: name || "SedaBox",
      isOfficial: true,
    };
  }

  const fallbackId = uniqueId || dbId || asText(source);
  return {
    id: fallbackId,
    ...(dbId ? { dbId } : {}),
    ...(uniqueId ? { uniqueId } : {}),
    ...(name ? { name } : {}),
  };
}

export function getCanonicalUserPath(source: UserRouteSource | string | number): string | null {
  const params = buildUserNavigationParams(source);
  if (params.isOfficial || params.uniqueId?.toLowerCase() === OFFICIAL_UNIQUE_ID) {
    return "/user/sedabox";
  }

  if (params.dbId) {
    // User profiles do not have a separate English-name column. Keep the
    // readable suffix only when the stored/display name is already English;
    // otherwise the stable numeric ID is the complete canonical path.
    const suffix = params.name ? slugify(params.name) : "";
    return `/user/${encodeURIComponent(params.dbId)}${suffix ? `-${suffix}` : ""}`;
  }

  if (params.uniqueId) {
    return `/user/${encodeURIComponent(params.uniqueId)}`;
  }

  return params.id ? `/user/${encodeURIComponent(params.id)}` : null;
}

export function isSedaboxSearchQuery(query: string): boolean {
  return OFFICIAL_NAME_KEYS.has(normalizedIdentity(query));
}
