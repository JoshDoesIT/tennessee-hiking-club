import { describe, it, expect } from "vitest";
import {
  generateFriendCode,
  friendUserIds,
  canSendRequest,
  type FriendshipLike,
} from "./friendships";

describe("generateFriendCode", () => {
  it("produces an unambiguous fixed-length code", () => {
    const code = generateFriendCode();
    expect(code).toMatch(/^[A-Z2-9]{8}$/);
  });

  it("is effectively unique across many calls", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateFriendCode()));
    expect(codes.size).toBe(200);
  });
});

const row = (
  requesterId: string,
  addresseeId: string,
  status = "accepted",
): FriendshipLike => ({ requesterId, addresseeId, status });

describe("friendUserIds", () => {
  it("returns the other side of each accepted friendship for the viewer", () => {
    const rows = [
      row("me", "a"), // I requested A, accepted
      row("b", "me"), // B requested me, accepted
      row("me", "c", "pending"), // pending, not a friend yet
      row("x", "y"), // unrelated
    ];
    expect(new Set(friendUserIds(rows, "me"))).toEqual(new Set(["a", "b"]));
  });

  it("never includes the viewer or pending links", () => {
    const ids = friendUserIds([row("me", "a", "pending")], "me");
    expect(ids).toEqual([]);
  });
});

describe("canSendRequest", () => {
  it("rejects friending yourself", () => {
    expect(canSendRequest("me", "me", [])).toEqual({ ok: false, reason: "self" });
  });

  it("allows a fresh request", () => {
    expect(canSendRequest("me", "a", [])).toEqual({ ok: true });
  });

  it("rejects a duplicate outgoing request", () => {
    expect(canSendRequest("me", "a", [row("me", "a", "pending")])).toEqual({
      ok: false,
      reason: "already-requested",
    });
  });

  it("rejects when already friends (either direction)", () => {
    expect(canSendRequest("me", "a", [row("a", "me", "accepted")])).toEqual({
      ok: false,
      reason: "already-friends",
    });
  });

  it("tells the viewer to respond to an incoming request instead", () => {
    expect(canSendRequest("me", "a", [row("a", "me", "pending")])).toEqual({
      ok: false,
      reason: "respond-to-theirs",
    });
  });
});
