import { describe, it, expect, vi } from "vitest";
import {
  buildAuthorizeUrl,
  exchangeCodeForTokens,
  fetchUserInfo,
  AUTHORIZE_URL,
} from "./oauth";

describe("buildAuthorizeUrl", () => {
  it("includes the PKCE and OIDC parameters", () => {
    const url = buildAuthorizeUrl({
      clientId: "cid",
      redirectUri: "https://x.test/api/auth/callback",
      state: "s",
      nonce: "n",
      codeChallenge: "cc",
    });
    expect(url.startsWith(AUTHORIZE_URL)).toBe(true);
    const q = new URL(url).searchParams;
    expect(q.get("client_id")).toBe("cid");
    expect(q.get("redirect_uri")).toBe("https://x.test/api/auth/callback");
    expect(q.get("state")).toBe("s");
    expect(q.get("nonce")).toBe("n");
    expect(q.get("code_challenge")).toBe("cc");
    expect(q.get("code_challenge_method")).toBe("S256");
    expect(q.get("response_type")).toBe("code");
    expect(q.get("scope")).toContain("openid");
  });
});

describe("exchangeCodeForTokens", () => {
  it("posts to the token endpoint and returns the tokens", async () => {
    const fakeFetch = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({
            access_token: "at",
            id_token: "it",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "openid",
            refresh_token: "rt",
          }),
        }) as unknown as Response,
    ) as unknown as typeof fetch;

    const tokens = await exchangeCodeForTokens(
      {
        code: "c",
        codeVerifier: "v",
        redirectUri: "r",
        clientId: "cid",
        clientSecret: "sec",
      },
      fakeFetch,
    );
    expect(tokens.access_token).toBe("at");
    const calledUrl = (fakeFetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(String(calledUrl)).toContain("/login/oauth/token");
  });

  it("throws on a non-ok response", async () => {
    const fakeFetch = (async () =>
      ({
        ok: false,
        json: async () => ({ error: "bad" }),
      }) as unknown as Response) as typeof fetch;
    await expect(
      exchangeCodeForTokens(
        {
          code: "c",
          codeVerifier: "v",
          redirectUri: "r",
          clientId: "cid",
          clientSecret: "sec",
        },
        fakeFetch,
      ),
    ).rejects.toThrow();
  });
});

describe("fetchUserInfo", () => {
  it("returns the user on success", async () => {
    const fakeFetch = (async () =>
      ({
        ok: true,
        json: async () => ({ sub: "u1", name: "Josh", email: "j@x.com" }),
      }) as unknown as Response) as typeof fetch;
    const user = await fetchUserInfo("at", fakeFetch);
    expect(user).toMatchObject({ sub: "u1", name: "Josh" });
  });

  it("returns null when unauthorized", async () => {
    const fakeFetch = (async () =>
      ({ ok: false, json: async () => ({}) }) as unknown as Response) as typeof fetch;
    expect(await fetchUserInfo("bad", fakeFetch)).toBeNull();
  });
});
