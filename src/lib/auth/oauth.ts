/**
 * Sign in with Vercel (OAuth 2.0 + OIDC, PKCE S256). Pure helpers around
 * Vercel's authorization server so the route handlers stay thin and the logic
 * is testable with an injected fetch. Endpoints per Vercel's docs.
 */
export const AUTHORIZE_URL = "https://vercel.com/oauth/authorize";
export const TOKEN_URL = "https://api.vercel.com/login/oauth/token";
export const USERINFO_URL = "https://api.vercel.com/login/oauth/userinfo";
export const REVOKE_URL = "https://api.vercel.com/login/oauth/token/revoke";
export const SCOPES = "openid email profile offline_access";

export type VercelTokens = {
  access_token: string;
  token_type: string;
  id_token: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
};

export type VercelUser = {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  picture?: string;
};

export function buildAuthorizeUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
}): string {
  const query = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    state: params.state,
    nonce: params.nonce,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
    response_type: "code",
    scope: SCOPES,
  });
  return `${AUTHORIZE_URL}?${query.toString()}`;
}

export async function exchangeCodeForTokens(
  args: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    clientId: string;
    clientSecret: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<VercelTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: args.clientId,
    client_secret: args.clientSecret,
    code: args.code,
    code_verifier: args.codeVerifier,
    redirect_uri: args.redirectUri,
  });

  const res = await fetchImpl(TOKEN_URL, { method: "POST", body });
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status})`);
  }
  return (await res.json()) as VercelTokens;
}

export async function fetchUserInfo(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<VercelUser | null> {
  const res = await fetchImpl(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as VercelUser;
}

export async function revokeToken(
  accessToken: string,
  creds: { clientId: string; clientSecret: string },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const basic = Buffer.from(
    `${creds.clientId}:${creds.clientSecret}`,
  ).toString("base64");
  const res = await fetchImpl(REVOKE_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
    body: new URLSearchParams({ token: accessToken }),
  });
  return res.ok;
}

/** The `nonce` claim from an id_token (no signature verification; the token
 *  comes straight from the token endpoint over TLS). */
export function nonceFromIdToken(idToken: string): string | null {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    return typeof json.nonce === "string" ? json.nonce : null;
  } catch {
    return null;
  }
}
