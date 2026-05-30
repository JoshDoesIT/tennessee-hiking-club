/**
 * Pure friendship logic (#147). A friendship is one row, mutual by design:
 * created by `requesterId` toward `addresseeId` as pending, then accepted. An
 * accepted friendship is the two-way consent that scopes the friends
 * leaderboard. No public user directory: you share a `friendCode` so a friend
 * can request you.
 */
export type FriendshipLike = {
  requesterId: string;
  addresseeId: string;
  status: string;
};

// Unambiguous alphabet (no 0/O/1/I/L) for shareable codes.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export function generateFriendCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
  return code;
}

/** The viewer's friends (the other side of each accepted friendship). */
export function friendUserIds(
  rows: FriendshipLike[],
  viewerId: string,
): string[] {
  const ids: string[] = [];
  for (const r of rows) {
    if (r.status !== "accepted") continue;
    if (r.requesterId === viewerId) ids.push(r.addresseeId);
    else if (r.addresseeId === viewerId) ids.push(r.requesterId);
  }
  return ids;
}

export type SendRequestCheck =
  | { ok: true }
  | {
      ok: false;
      reason: "self" | "already-requested" | "already-friends" | "respond-to-theirs";
    };

/**
 * Whether the viewer may send a friend request to `targetId`, given the existing
 * friendship rows between the two (either direction).
 */
export function canSendRequest(
  viewerId: string,
  targetId: string,
  existing: FriendshipLike[],
): SendRequestCheck {
  if (viewerId === targetId) return { ok: false, reason: "self" };

  for (const r of existing) {
    const involves =
      (r.requesterId === viewerId && r.addresseeId === targetId) ||
      (r.requesterId === targetId && r.addresseeId === viewerId);
    if (!involves) continue;
    if (r.status === "accepted") return { ok: false, reason: "already-friends" };
    if (r.requesterId === viewerId)
      return { ok: false, reason: "already-requested" };
    return { ok: false, reason: "respond-to-theirs" };
  }

  return { ok: true };
}
