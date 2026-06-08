/**
 * The local app's session token (spec 0009, phase 4). On the local bundle the
 * session cookie does not flow cross-origin, so the token is sent as a bearer
 * header instead. It is held in memory (so the synchronous fetch patch can read
 * it) and persisted in the device's secure store (Keychain / Keystore) so it
 * survives relaunch. The store is injected so this is unit-tested without a
 * device.
 */

export interface SecureStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const SESSION_TOKEN_KEY = "thc.session-token";

let cachedToken: string | null = null;

/** The current session token, or null. Synchronous, for the fetch patch. */
export function getCachedToken(): string | null {
  return cachedToken;
}

/** Load the persisted token into the in-memory cache (call once on launch). */
export async function loadToken(store: SecureStore): Promise<void> {
  cachedToken = await store.get(SESSION_TOKEN_KEY);
}

/** Cache and persist a new session token (after sign-in). */
export async function storeToken(
  store: SecureStore,
  token: string,
): Promise<void> {
  cachedToken = token;
  await store.set(SESSION_TOKEN_KEY, token);
}

/** Drop the token from the cache and the secure store (on sign-out). */
export async function clearToken(store: SecureStore): Promise<void> {
  cachedToken = null;
  await store.remove(SESSION_TOKEN_KEY);
}
