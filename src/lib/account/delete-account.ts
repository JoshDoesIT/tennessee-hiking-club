import { eq, or } from "drizzle-orm";
import type { getDb } from "@/lib/db";
import {
  profiles,
  hikes,
  cleanups,
  trailSubmissions,
  conditionSubmissions,
  photoSubmissions,
  waypointSubmissions,
  routeSubmissions,
  friendships,
  pushSubscriptions,
  users,
} from "@/lib/db/schema";

type Db = ReturnType<typeof getDb>;

/**
 * Delete a member's account and everything we synced for them (#328). The app
 * tables use a plain `userId` with no foreign key, so each is removed
 * explicitly; the `users` row goes last and cascades the Auth.js
 * accounts/sessions/authenticators. Personal contribution records are removed;
 * the user's own friendships are dropped from either side.
 */
export async function deleteAccount(db: Db, userId: string): Promise<void> {
  await db.delete(hikes).where(eq(hikes.userId, userId));
  await db.delete(cleanups).where(eq(cleanups.userId, userId));
  await db.delete(profiles).where(eq(profiles.userId, userId));
  await db.delete(trailSubmissions).where(eq(trailSubmissions.userId, userId));
  await db
    .delete(conditionSubmissions)
    .where(eq(conditionSubmissions.userId, userId));
  await db.delete(photoSubmissions).where(eq(photoSubmissions.userId, userId));
  await db
    .delete(waypointSubmissions)
    .where(eq(waypointSubmissions.userId, userId));
  await db.delete(routeSubmissions).where(eq(routeSubmissions.userId, userId));
  await db
    .delete(friendships)
    .where(
      or(
        eq(friendships.requesterId, userId),
        eq(friendships.addresseeId, userId),
      ),
    );
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}
