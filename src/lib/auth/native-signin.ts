import { API_ORIGIN } from "@/lib/api-origin";
import { appSignInPath } from "@/lib/auth/app-signin";
import { storeToken } from "@/lib/auth/token-store";

/**
 * Native sign-in (#276). Runs OAuth in the system browser, where cookies behave
 * normally, then bridges the result back into the WebView with a one-time code:
 * the completion route deep-links `tnhc://auth?code=...`, which this exchanges
 * for a session cookie set on a same-origin `fetch` the WebView keeps. This is
 * the path the cookie-in-the-WebView flow could not survive (#264).
 */
const APP_SCHEME = "tnhc:";
const COMPLETE_PATH = "/api/native-auth/complete";

export async function startNativeSignIn(providerId: string): Promise<void> {
  const { Browser } = await import("@capacitor/browser");
  const { App } = await import("@capacitor/app");

  const handle = await App.addListener("appUrlOpen", async ({ url }) => {
    let code: string | null = null;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== APP_SCHEME) return;
      code = parsed.searchParams.get("code");
    } catch {
      return;
    }
    await handle.remove();
    await Browser.close().catch(() => {});
    if (!code) {
      window.location.assign("/signin?error=oauth");
      return;
    }
    const res = await fetch("/api/native-auth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    if (res?.ok) {
      // Store the session token so the local bundle can send it as a bearer
      // header; the cookie set on this response only sticks on the server.url
      // build, not the cross-origin local bundle (phase 4).
      try {
        const data = (await res.json()) as { sessionToken?: string };
        if (typeof data.sessionToken === "string") {
          const { capacitorSecureStore } = await import("./secure-store");
          await storeToken(capacitorSecureStore, data.sessionToken);
        }
      } catch {
        /* ignore: the cookie path still signs the WebView in on server.url */
      }
    }
    window.location.assign(res?.ok ? "/hikes" : "/signin?error=oauth");
  });

  const url = `${API_ORIGIN}${appSignInPath(providerId)}?to=${encodeURIComponent(
    COMPLETE_PATH,
  )}`;
  await Browser.open({ url });
}
