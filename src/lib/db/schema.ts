import {
  pgTable,
  text,
  date,
  boolean,
  uuid,
  integer,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

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

// --- Auth.js (NextAuth) adapter tables --------------------------------------
// Canonical Auth.js Drizzle schema. `hikes.userId` / `profiles.userId` hold
// `users.id` (enforced by the app; no FK so those tables stand alone).

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);
