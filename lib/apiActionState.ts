export type ActionResponse = Record<string, unknown> | null | undefined;

const normalizedToken = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export function readFollowingState(
  payload: ActionResponse,
  fallback: boolean,
): boolean {
  if (!payload || typeof payload !== "object") return fallback;

  if (typeof payload.is_following === "boolean") return payload.is_following;
  if (typeof payload.following === "boolean") return payload.following;

  const token = [payload.action, payload.status, payload.message]
    .map(normalizedToken)
    .find(Boolean);

  if (!token) return fallback;
  if (["followed", "following", "دنبال شد"].includes(token)) return true;
  if (
    [
      "unfollowed",
      "not_following",
      "دنبال‌کردن لغو شد",
      "لغو دنبال کردن",
    ].includes(token)
  ) {
    return false;
  }

  return fallback;
}

export function readLikedState(
  payload: ActionResponse,
  fallback: boolean,
): boolean {
  if (!payload || typeof payload !== "object") return fallback;

  if (typeof payload.is_liked === "boolean") return payload.is_liked;
  if (typeof payload.liked === "boolean") return payload.liked;

  const token = [payload.action, payload.status, payload.message]
    .map(normalizedToken)
    .find(Boolean);

  if (!token) return fallback;
  if (["liked", "پسندیده شد"].includes(token)) return true;
  if (["unliked", "پسند لغو شد"].includes(token)) return false;

  return fallback;
}
