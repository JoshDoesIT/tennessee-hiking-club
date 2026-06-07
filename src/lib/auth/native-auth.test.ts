import { describe, it, expect, vi, afterEach } from "vitest";
import {
  mintAuthCode,
  consumeAuthCode,
  createSession,
  sessionCookie,
} from "./native-auth";

type Row = { identifier: string; token: string; expires: Date };

function mockDb(selectRows: Row[] = []) {
  const inserts: { values: Record<string, unknown> }[] = [];
  const deletes: unknown[] = [];
  const db = {
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        inserts.push({ values });
        return Promise.resolve();
      },
    }),
    select: () => ({
      from: () => ({ where: () => Promise.resolve(selectRows) }),
    }),
    delete: () => ({
      where: (cond: unknown) => {
        deletes.push(cond);
        return Promise.resolve();
      },
    }),
  };
  return { db, inserts, deletes };
}

afterEach(() => vi.unstubAllEnvs());

describe("native-auth", () => {
  it("mints a single-use code tied to the user", async () => {
    const { db, inserts } = mockDb();
    const code = await mintAuthCode(db as never, "user-1", 1000);
    expect(code).toMatch(/^[0-9a-f]{64}$/);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].values.identifier).toBe("native-auth:user-1");
    expect(inserts[0].values.token).toBe(code);
    expect((inserts[0].values.expires as Date).getTime()).toBeGreaterThan(1000);
  });

  it("consumes a valid code, returns the user, and deletes it", async () => {
    const { db, deletes } = mockDb([
      { identifier: "native-auth:user-1", token: "c", expires: new Date(5000) },
    ]);
    expect(await consumeAuthCode(db as never, "c", 1000)).toBe("user-1");
    expect(deletes).toHaveLength(1);
  });

  it("rejects an expired code but still consumes (deletes) it", async () => {
    const { db, deletes } = mockDb([
      { identifier: "native-auth:user-1", token: "c", expires: new Date(500) },
    ]);
    expect(await consumeAuthCode(db as never, "c", 1000)).toBeNull();
    expect(deletes).toHaveLength(1);
  });

  it("returns null for a missing code", async () => {
    const { db } = mockDb([]);
    expect(await consumeAuthCode(db as never, "nope", 1000)).toBeNull();
  });

  it("ignores tokens that are not native-auth codes (e.g. email links)", async () => {
    const { db, deletes } = mockDb([
      { identifier: "email:x@y.z", token: "c", expires: new Date(5000) },
    ]);
    expect(await consumeAuthCode(db as never, "c", 1000)).toBeNull();
    expect(deletes).toHaveLength(0);
  });

  it("creates a session row and returns its token", async () => {
    const { db, inserts } = mockDb();
    const token = await createSession(db as never, "user-1", 1000);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(inserts[0].values.userId).toBe("user-1");
    expect(inserts[0].values.sessionToken).toBe(token);
    expect((inserts[0].values.expires as Date).getTime()).toBeGreaterThan(1000);
  });

  it("builds a Secure session cookie matching Auth.js in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const c = sessionCookie("tok", 1000);
    expect(c.name).toBe("__Secure-authjs.session-token");
    expect(c.value).toBe("tok");
    expect(c.options.secure).toBe(true);
    expect(c.options.httpOnly).toBe(true);
    expect(c.options.sameSite).toBe("lax");
  });

  it("uses the non-secure cookie name outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(sessionCookie("tok").name).toBe("authjs.session-token");
  });
});
