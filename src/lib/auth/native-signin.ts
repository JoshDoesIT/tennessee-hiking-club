import { API_ORIGIN } from "@/lib/api-origin";
import { appSignInPath } from "@/lib/auth/app-signin";

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
    window.location.assign(res?.ok ? "/hikes" : "/signin?error=oauth");
  });

  const url = `${API_ORIGIN}${appSignInPath(providerId)}?to=${encodeURIComponent(
    COMPLETE_PATH,
  )}`;
  await Browser.open({ url });
}
