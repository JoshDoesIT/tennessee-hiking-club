import { and, eq, inArray, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { friendships, profiles } from "@/lib/db/schema";
import {
  canSendRequest,
  friendUserIds,
  generateFriendCode,
  type FriendshipLike,
} from "./friendships";

/**
 * Server-side friendship operations (#147). Routes are thin auth-gated wrappers
 * over these. The pure rules live in `friendships.ts`; this layer reads/writes
 * the `friendships` table and `profiles.friendCode`.
 */
type Person = { userId: string; displayName: string | null };

export type FriendsData = {
  code: string;
  friends: Array<Person & { friendshipId: string }>;
  incoming: Array<Person & { id: string }>;
  outgoing: Array<Person & { id: string }>;
};

/** Read the user's friend code, generating and persisting one if absent. */
export async function ensureFriendCode(userId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (row?.friendCode) return row.friendCode;

  const code = generateFriendCode();
  await db
    .insert(profiles)
    .values({ userId, friendCode: code })
    .onConflictDoUpdate({ target: profiles.userId, set: { friendCode: code } });
  return code;
}

export async function getFriendsData(userId: string): Promise<FriendsData> {
  const code = await ensureFriendCode(userId);
  const db = getDb();
  const rows = await db
    .select()
    .from(friendships)
    .where(
      or(
        eq(friendships.requesterId, userId),
        eq(friendships.addresseeId, userId),
      ),
    );

  const accepted = rows.filter((r) => r.status === "accepted");
  const incoming = rows.filter(
    (r) => r.status === "pending" && r.addresseeId === userId,
  );
  const outgoing = rows.filter(
    (r) => r.status === "pending" && r.requesterId === userId,
  );

  const other = (r: { requesterId: string; addresseeId: string }) =>
    r.requesterId === userId ? r.addresseeId : r.requesterId;

  const ids = [
    ...accepted.map(other),
    ...incoming.map((r) => r.requesterId),
    ...outgoing.map((r) => r.addresseeId),
  ];
  const names = ids.length
    ? await db.select().from(profiles).where(inArray(profiles.userId, ids))
    : [];
  const nameById = new Map(names.map((p) => [p.userId, p.displayName ?? null]));
  const named = (userId: string): string | null => nameById.get(userId) ?? null;

  return {
    code,
    friends: accepted.map((r) => ({
      friendshipId: r.id,
      userId: other(r),
      displayName: named(other(r)),
    })),
    incoming: incoming.map((r) => ({
      id: r.id,
      userId: r.requesterId,
      displayName: named(r.requesterId),
    })),
    outgoing: outgoing.map((r) => ({
      id: r.id,
      userId: r.addresseeId,
      displayName: named(r.addresseeId),
    })),
  };
}

export type FriendActionResult = { ok: true } | { ok: false; reason: string };

export async function sendFriendRequest(
  userId: string,
  code: string,
): Promise<FriendActionResult> {
  const db = getDb();
  const [target] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.friendCode, code.trim().toUpperCase()))
    .limit(1);
  if (!target) return { ok: false, reason: "not-found" };
  if (target.userId === userId) return { ok: false, reason: "self" };

  const existing = (await db
    .select()
    .from(friendships)
    .where(
      or(
        and(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, target.userId),
        ),
        and(
          eq(friendships.requesterId, target.userId),
          eq(friendships.addresseeId, userId),
        ),
      ),
    )) as FriendshipLike[];

  const check = canSendRequest(userId, target.userId, existing);
  if (!check.ok) return { ok: false, reason: check.reason };

  await db
    .insert(friendships)
    .values({
      requesterId: userId,
      addresseeId: target.userId,
      status: "pending",
    });
  return { ok: true };
}

export async function respondToRequest(
  userId: string,
  id: string,
  action: "accept" | "decline",
): Promise<FriendActionResult> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, id))
    .limit(1);
  // Only the addressee of a still-pending request may respond.
  if (!row || row.addresseeId !== userId || row.status !== "pending") {
    return { ok: false, reason: "not-allowed" };
  }

  if (action === "accept") {
    await db
      .update(friendships)
      .set({ status: "accepted", respondedAt: new Date() })
      .where(eq(friendships.id, id));
  } else {
    await db.delete(friendships).where(eq(friendships.id, id));
  }
  return { ok: true };
}

/**
 * The viewer's friends leaderboard circle: themselves plus their accepted
 * friends. Used to scope the friends board; membership (mutual acceptance) is
 * the consent that lets friends appear regardless of `isPublic`.
 */
export async function getFriendCircleIds(userId: string): Promise<string[]> {
  const db = getDb();
  const rows = (await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(
          eq(friendships.requesterId, userId),
          eq(friendships.addresseeId, userId),
        ),
      ),
    )) as FriendshipLike[];
  return [userId, ...friendUserIds(rows, userId)];
}

export async function removeFriendship(
  userId: string,
  id: string,
): Promise<FriendActionResult> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, id))
    .limit(1);
  if (!row || (row.requesterId !== userId && row.addresseeId !== userId)) {
    return { ok: false, reason: "not-allowed" };
  }
  await db.delete(friendships).where(eq(friendships.id, id));
  return { ok: true };
}
