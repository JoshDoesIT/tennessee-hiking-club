import {
  pgTable,
  text,
  date,
  boolean,
  uuid,
  integer,
  doublePrecision,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
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
  /** GitHub login captured at sign-in. Recognition is earned, not claimed: a
   *  user is credited for curated contributions (trails, condition reports,
   *  photos) attributed to this verified login. Future in-app contribution
   *  features will record contributions against the account directly. */
  githubLogin: text("github_login"),
  /** Non-guessable code a user shares so a friend can send them a friend
   *  request (#147). Lazily generated; there is no public user directory. */
  friendCode: text("friend_code").unique(),
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
    photoUrl: text("photo_url"),
    /** A recorded GPS track for this hike (#201), as JSON route points. */
    route: text("route"),
    /** Elapsed minutes for the recorded track, when the GPX had timestamps. */
    trackDurationMin: integer("track_duration_min"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("hikes_user_id_idx").on(table.userId)],
);

/** A logged cleanup day, the synced counterpart of the local cleanup log.
 *  Stewardship = distinct days, so the sync de-duplicates by day. */
export const cleanups = pgTable(
  "cleanups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    loggedOn: date("logged_on").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("cleanups_user_id_idx").on(table.userId)],
);

/**
 * An in-app proposal for a new trail (#146), submitted by a signed-in member
 * without GitHub. A maintainer reviews it before any content is published; an
 * approved submission earns recognition for the submitter by `userId`, so a
 * non-GitHub contributor is credited without a content handle. Optional columns
 * mirror the optional fields of the GitHub "new trail" issue form.
 */
export const trailSubmissions = pgTable(
  "trail_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    area: text("area").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    lengthMiles: doublePrecision("length_miles"),
    elevationGainFt: integer("elevation_gain_ft"),
    difficulty: text("difficulty"),
    routeType: text("route_type"),
    description: text("description").notNull(),
    links: text("links"),
    /** private Blob URLs of photos the contributor attached (#29) */
    photoUrls: text("photo_urls").array(),
    /** pending | approved | rejected */
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("trail_submissions_user_id_idx").on(table.userId),
    index("trail_submissions_status_idx").on(table.status),
  ],
);

/**
 * An in-app condition report (#149) for an existing trail, submitted by a
 * signed-in member. Like a trail submission it is a reviewed proposal, not a
 * live edit: a maintainer approves it, then curates it into the trail's
 * `conditionReports[]`. An approved report earns the submitter recognition on
 * the "conditions reported" board by `userId`. `status` is the condition itself
 * (e.g. "Muddy"); `reviewStatus` is the moderation state.
 */
export const conditionSubmissions = pgTable(
  "condition_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    trailSlug: text("trail_slug").notNull(),
    status: text("status").notNull(),
    note: text("note"),
    reportDate: date("report_date").notNull(),
    /** pending | approved | rejected */
    reviewStatus: text("review_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("condition_submissions_user_id_idx").on(table.userId),
    index("condition_submissions_review_status_idx").on(table.reviewStatus),
  ],
);

/**
 * An in-app photo submission (#149) for an existing trail, submitted by a
 * signed-in member. A reviewed proposal: the image is stored privately in Blob
 * until a maintainer approves it and curates it into the trail's `photos[]`. An
 * approved photo earns the submitter recognition by `userId`. `alt` is required
 * (accessibility); `credit` is optional attribution.
 */
export const photoSubmissions = pgTable(
  "photo_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    trailSlug: text("trail_slug").notNull(),
    blobUrl: text("blob_url").notNull(),
    alt: text("alt").notNull(),
    credit: text("credit"),
    /** pending | approved | rejected */
    reviewStatus: text("review_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("photo_submissions_user_id_idx").on(table.userId),
    index("photo_submissions_review_status_idx").on(table.reviewStatus),
  ],
);

/**
 * An in-app waypoint/landmark suggestion (#191) for an existing trail, submitted
 * by a signed-in member: a coordinate + name + type (+ optional description and
 * private photo). A reviewed proposal that a maintainer curates into the trail's
 * `waypoints[]`; never auto-published. An approved suggestion earns the
 * submitter recognition by `userId`.
 */
export const waypointSubmissions = pgTable(
  "waypoint_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    trailSlug: text("trail_slug").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    description: text("description"),
    /** Private Blob URL of an optional photo of the landmark. */
    photoUrl: text("photo_url"),
    /** pending | approved | rejected */
    reviewStatus: text("review_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("waypoint_submissions_user_id_idx").on(table.userId),
    index("waypoint_submissions_review_status_idx").on(table.reviewStatus),
  ],
);

/**
 * A recorded-hike track a member contributes as a trail's `route` (#201). The
 * GPX they uploaded is parsed, downsampled, and stored here as JSON along with
 * its length and gain so a maintainer can review it and, on approval, curate
 * the points into the trail's `route` front-matter (never auto-published, like
 * waypoint suggestions). The submitter earns recognition for an accepted track.
 */
export const routeSubmissions = pgTable(
  "route_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    trailSlug: text("trail_slug").notNull(),
    /** Track name from the GPX, if the file carried one. */
    name: text("name"),
    /** Downsampled route as JSON: [{ lat, lng, elevationFt }]. */
    route: text("route").notNull(),
    /** Trackpoint count in the original upload, before downsampling. */
    pointCount: integer("point_count").notNull(),
    lengthMiles: doublePrecision("length_miles").notNull(),
    gainFt: integer("gain_ft").notNull(),
    /** pending | approved | rejected */
    reviewStatus: text("review_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("route_submissions_user_id_idx").on(table.userId),
    index("route_submissions_review_status_idx").on(table.reviewStatus),
  ],
);

/**
 * A friendship between two members (#147). Mutual by design: one row per
 * relationship, created by `requesterId` toward `addresseeId` as `pending`;
 * the addressee accepts (`accepted`) or declines (the row is deleted). An
 * accepted friendship is what scopes the friends leaderboard and is the
 * two-way consent that lets friends see each other regardless of `isPublic`.
 */
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: text("requester_id").notNull(),
    addresseeId: text("addressee_id").notNull(),
    /** pending | accepted */
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("friendships_pair_idx").on(
      table.requesterId,
      table.addresseeId,
    ),
    index("friendships_addressee_idx").on(table.addresseeId),
    index("friendships_requester_idx").on(table.requesterId),
  ],
);

/**
 * A device registered to receive push notifications for trail alerts (#218,
 * spec 0008). Keyed by the APNs/FCM `token` (unique, so re-registering a device
 * upserts). `userId` ties it to an account when the member is signed in, but a
 * device can subscribe anonymously, so it is nullable. Opting out deletes the
 * row, which is what stops delivery.
 */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    /** ios | android | web */
    platform: text("platform").notNull(),
    userId: text("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("push_subscriptions_user_id_idx").on(table.userId)],
);

export type ProfileRow = typeof profiles.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type HikeRow = typeof hikes.$inferSelect;
export type CleanupRow = typeof cleanups.$inferSelect;
export type FriendshipRow = typeof friendships.$inferSelect;
export type TrailSubmissionRow = typeof trailSubmissions.$inferSelect;
export type ConditionSubmissionRow = typeof conditionSubmissions.$inferSelect;
export type PhotoSubmissionRow = typeof photoSubmissions.$inferSelect;
export type WaypointSubmissionRow = typeof waypointSubmissions.$inferSelect;

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

// WebAuthn passkeys (#168). Canonical Auth.js authenticator table; column names
// must match what `@auth/drizzle-adapter` reads/writes.
export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  ],
);
