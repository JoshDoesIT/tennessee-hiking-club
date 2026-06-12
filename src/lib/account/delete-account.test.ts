import { describe, it, expect, vi } from "vitest";

vi.mock("@vercel/blob", () => ({ del: vi.fn() }));

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

function fakeDb(hikePhotos: (string | null)[] = []) {
  const deleted: unknown[] = [];
  return {
    deleted,
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => hikePhotos.map((photoUrl) => ({ photoUrl }))),
      })),
    })),
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

  it("deletes the member's hike photo blobs before removing the rows", async () => {
    const removeBlob = vi.fn(async () => undefined);
    const db = fakeDb(["https://blob/a.jpg", null, "https://blob/b.jpg"]);
    await deleteAccount(db as never, "u1", removeBlob);
    expect(removeBlob).toHaveBeenCalledWith("https://blob/a.jpg");
    expect(removeBlob).toHaveBeenCalledWith("https://blob/b.jpg");
    expect(removeBlob).toHaveBeenCalledTimes(2); // the null photoUrl is skipped
  });

  it("still deletes the account when a blob delete fails", async () => {
    const removeBlob = vi.fn(async () => {
      throw new Error("blob gone");
    });
    const db = fakeDb(["https://blob/a.jpg"]);
    await expect(
      deleteAccount(db as never, "u1", removeBlob),
    ).resolves.toBeUndefined();
    expect(db.deleted.at(-1)).toBe(users);
  });
});
