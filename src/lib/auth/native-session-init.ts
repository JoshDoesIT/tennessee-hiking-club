/**
 * On a native launch, load the persisted session token into memory so API calls
 * can attach it as a bearer header (spec 0009, phase 4). The native check runs
 * first, so on the web the secure-storage plugin is never imported (kept out of
 * the web bundle). No-op except on a native build.
 */
export async function initNativeAuth(): Promise<void> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return;
  const { loadToken } = await import("./token-store");
  const { capacitorSecureStore } = await import("./secure-store");
  await loadToken(capacitorSecureStore);
}
