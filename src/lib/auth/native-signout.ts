import { signOut } from "next-auth/react";

/**
 * Sign out, end to end (spec 0009, phase 4, #322). On the web it is the normal
 * cookie sign-out. On native it ends the server session first, so the bearer
 * header still authenticates that request, then clears the token from the secure
 * store (and the in-memory cache) and goes home, leaving no session token behind.
 */
export async function appSignOut(): Promise<void> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) {
    await signOut({ callbackUrl: "/" });
    return;
  }
  await signOut({ redirect: false });
  const { clearToken } = await import("./token-store");
  const { capacitorSecureStore } = await import("./secure-store");
  await clearToken(capacitorSecureStore);
  window.location.assign("/");
}
