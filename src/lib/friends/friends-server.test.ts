// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  inserted: [] as Array<Record<string, unknown>>,
  updated: [] as Array<Record<string, unknown>>,
  deleted: 0,
}));
vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => {
          const res = mocks.selectQueue.shift() ?? [];
          const p = Promise.resolve(res) as Promise<unknown> & {
            limit: () => Promise<unknown>;
          };
          p.limit = async () => res;
          return p;
        },
      }),
    }),
    insert: () => ({
      values: (v: Record<string, unknown>) => {
        mocks.inserted.push(v);
        return {
          onConflictDoUpdate: async () => undefined,
          returning: async () => [{ id: "new-id" }],
        };
      },
    }),
    update: () => ({
      set: (s: Record<string, unknown>) => {
        mocks.updated.push(s);
        return { where: async () => undefined };
      },
    }),
    delete: () => ({
      where: async () => {
        mocks.deleted += 1;
      },
    }),
  }),
}));

import {
  getFriendsData,
  sendFriendRequest,
  respondToRequest,
  removeFriendship,
  getFriendCircleIds,
} from "./friends-server";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = "postgres://test";
  mocks.selectQueue = [];
  mocks.inserted = [];
  mocks.updated = [];
  mocks.deleted = 0;
});

describe("getFriendsData", () => {
  it("partitions accepted friends, incoming, and outgoing with names", async () => {
    mocks.selectQueue = [
      [{ userId: "me", friendCode: "CODE1234" }], // ensureFriendCode
      [
        { id: "f1", requesterId: "me", addresseeId: "a", status: "accepted" },
        { id: "f2", requesterId: "b", addresseeId: "me", status: "pending" },
        { id: "f3", requesterId: "me", addresseeId: "c", status: "pending" },
      ],
      [
        { userId: "a", displayName: "Ann" },
        { userId: "b", displayName: "Bob" },
        { userId: "c", displayName: null },
      ],
    ];
    const data = await getFriendsData("me");
    expect(data.code).toBe("CODE1234");
    expect(data.friends).toEqual([
      { friendshipId: "f1", userId: "a", displayName: "Ann" },
    ]);
    expect(data.incoming).toEqual([
      { id: "f2", userId: "b", displayName: "Bob" },
    ]);
    expect(data.outgoing).toEqual([
      { id: "f3", userId: "c", displayName: null },
    ]);
  });

  it("generates and persists a friend code when missing", async () => {
    mocks.selectQueue = [[{ userId: "me", friendCode: null }], [], []];
    const data = await getFriendsData("me");
    expect(data.code).toMatch(/^[A-Z2-9]{8}$/);
    expect(mocks.inserted[0]).toMatchObject({ userId: "me" });
  });
});

describe("sendFriendRequest", () => {
  it("rejects an unknown code", async () => {
    mocks.selectQueue = [[]]; // no profile with that code
    const res = await sendFriendRequest("me", "NOPE0000");
    expect(res.ok).toBe(false);
    expect(mocks.inserted).toHaveLength(0);
  });

  it("rejects friending yourself", async () => {
    mocks.selectQueue = [[{ userId: "me" }]];
    const res = await sendFriendRequest("me", "MYCODE12");
    expect(res).toMatchObject({ ok: false, reason: "self" });
  });

  it("inserts a pending request to a valid target", async () => {
    mocks.selectQueue = [[{ userId: "a" }], []]; // target found, no existing rows
    const res = await sendFriendRequest("me", "ANNCODE1");
    expect(res.ok).toBe(true);
    expect(mocks.inserted[0]).toMatchObject({
      requesterId: "me",
      addresseeId: "a",
      status: "pending",
    });
  });

  it("rejects a duplicate", async () => {
    mocks.selectQueue = [
      [{ userId: "a" }],
      [{ requesterId: "me", addresseeId: "a", status: "pending" }],
    ];
    const res = await sendFriendRequest("me", "ANNCODE1");
    expect(res).toMatchObject({ ok: false, reason: "already-requested" });
    expect(mocks.inserted).toHaveLength(0);
  });
});

describe("respondToRequest", () => {
  it("lets the addressee accept", async () => {
    mocks.selectQueue = [
      [{ id: "f1", requesterId: "a", addresseeId: "me", status: "pending" }],
    ];
    const res = await respondToRequest("me", "f1", "accept");
    expect(res.ok).toBe(true);
    expect(mocks.updated[0]).toMatchObject({ status: "accepted" });
  });

  it("lets the addressee decline (deletes)", async () => {
    mocks.selectQueue = [
      [{ id: "f1", requesterId: "a", addresseeId: "me", status: "pending" }],
    ];
    const res = await respondToRequest("me", "f1", "decline");
    expect(res.ok).toBe(true);
    expect(mocks.deleted).toBe(1);
  });

  it("refuses a non-addressee", async () => {
    mocks.selectQueue = [
      [{ id: "f1", requesterId: "me", addresseeId: "a", status: "pending" }],
    ];
    const res = await respondToRequest("me", "f1", "accept");
    expect(res.ok).toBe(false);
    expect(mocks.updated).toHaveLength(0);
  });
});

describe("getFriendCircleIds", () => {
  it("returns the viewer plus their accepted friends", async () => {
    mocks.selectQueue = [
      [
        { id: "f1", requesterId: "me", addresseeId: "a", status: "accepted" },
        { id: "f2", requesterId: "b", addresseeId: "me", status: "accepted" },
      ],
    ];
    const ids = await getFriendCircleIds("me");
    expect(new Set(ids)).toEqual(new Set(["me", "a", "b"]));
  });
});

describe("removeFriendship", () => {
  it("removes a friendship the user is part of", async () => {
    mocks.selectQueue = [
      [{ id: "f1", requesterId: "me", addresseeId: "a", status: "accepted" }],
    ];
    const res = await removeFriendship("me", "f1");
    expect(res.ok).toBe(true);
    expect(mocks.deleted).toBe(1);
  });

  it("refuses to remove a friendship the user is not part of", async () => {
    mocks.selectQueue = [
      [{ id: "f1", requesterId: "x", addresseeId: "y", status: "accepted" }],
    ];
    const res = await removeFriendship("me", "f1");
    expect(res.ok).toBe(false);
    expect(mocks.deleted).toBe(0);
  });
});
