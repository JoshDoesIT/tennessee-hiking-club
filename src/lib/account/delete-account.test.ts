import { describe, it, expect, vi } from "vitest";
import { deleteAccount } from "./delete-account";
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

function fakeDb() {
  const deleted: unknown[] = [];
  return {
    deleted,
    delete: vi.fn((table: unknown) => ({
      where: vi.fn(async () => {
        deleted.push(table);
      }),
    })),
  };
}

describe("deleteAccount", () => {
  it("deletes every user-keyed table, then the user row last", async () => {
    const db = fakeDb();
    await deleteAccount(db as never, "u1");

    const userKeyed = [
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
    ];
    for (const table of userKeyed) {
      expect(db.deleted, "a user-keyed table was missed").toContain(table);
    }
    // The user row goes last; deleting it cascades accounts/sessions/authenticators.
    expect(db.deleted.at(-1)).toBe(users);
  });
});
