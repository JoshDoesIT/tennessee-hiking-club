import {
  pgTable,
  text,
  date,
  boolean,
  uuid,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Account data model (Phase B of spec 0005). The Auth.js adapter tables
 * (users, accounts, sessions, verificationTokens) and the `user_id` foreign
 * keys are added alongside the adapter when sign-in is wired; `userId` is plain
 * text here so this migration stands on its own.
 */

/** Per-user profile, including the opt-in flag for public leaderboards. */
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** A logged hike, the synced counterpart of the local hike log. */
export const hikes = pgTable(
  "hikes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    trailSlug: text("trail_slug").notNull(),
    hikedOn: date("hiked_on").notNull(),
    note: text("note"),
    conditions: text("conditions"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("hikes_user_id_idx").on(table.userId)],
);

export type ProfileRow = typeof profiles.$inferSelect;
export type HikeRow = typeof hikes.$inferSelect;
