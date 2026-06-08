// Reliable reconnect for the offline launch screen (#306, builds on #248).
//
// Capacitor serves this bundle from `webDir` via `server.errorPath` only when
// the cold-launch navigation to the hosted app fails offline. Going back means
// navigating to the production origin again. The native WebView fires `online`
// the moment the radio reports a connection, which can be before traffic
// actually flows (airplane mode just toggled off, a captive portal, a weak
// trailhead signal). A bare reopen then fails and bounces straight back here.
//
// So: probe that the origin actually answers before navigating, and only then
// reopen. Pure logic with injected collaborators so it is testable without a
// DOM or a real network; the bottom of the file wires it to the page.

export const APP_URL = "https://www.tnhiking.club";
const PROBE_PATH = "/favicon.ico";
const PROBE_TIMEOUT_MS = 4000;

/**
 * Resolve `true` when the hosted origin answers a probe, `false` on a network
 * error or timeout. `mode: "no-cors"` so the cross-origin probe needs no CORS
 * headers; any response (even opaque) proves we can reach the site. The request
 * is cache-busted and never cached so a stale success cannot mask a dead link.
 *
 * @param {object} [options]
 * @param {string} [options.url]
 * @param {(input: string, init?: RequestInit) => Promise<unknown>} [options.fetchImpl]
 * @param {number} [options.timeoutMs]
 * @param {() => number} [options.now]
 * @returns {Promise<boolean>}
 */
export async function checkReachable({
  url = APP_URL,
  fetchImpl = typeof fetch !== "undefined" ? fetch : undefined,
  timeoutMs = PROBE_TIMEOUT_MS,
  now = Date.now,
} = {}) {
  if (!fetchImpl) return false;
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = setTimeout(() => {
    if (controller) controller.abort();
  }, timeoutMs);
  try {
    await fetchImpl(`${url}${PROBE_PATH}?reconnect=${now()}`, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller ? controller.signal : undefined,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Wire the `online` event (and, via the returned `attempt`, a retry button) to a
 * reachability probe, reopening the app only once it is actually reachable. A
 * single probe runs at a time. Collaborators are injected so the flow is fully
 * testable; the defaults use the real window + `checkReachable`.
 *
 * @param {object} [options]
 * @param {() => void} options.navigate
 * @param {() => Promise<boolean>} [options.check]
 * @param {() => void} [options.onChecking]
 * @param {() => void} [options.onStillOffline]
 * @param {(handler: () => unknown) => void} [options.addOnline]
 * @param {(handler: () => unknown) => void} [options.removeOnline]
 * @returns {{ attempt: () => Promise<boolean>, dispose: () => void }}
 */
export function createReconnector({
  navigate,
  check = checkReachable,
  onChecking = () => {},
  onStillOffline = () => {},
  addOnline = (h) => window.addEventListener("online", h),
  removeOnline = (h) => window.removeEventListener("online", h),
} = {}) {
  let busy = false;
  async function attempt() {
    if (busy) return false;
    busy = true;
    onChecking();
    try {
      const reachable = await check();
      if (reachable) navigate();
      else onStillOffline();
      return reachable;
    } finally {
      busy = false;
    }
  }
  addOnline(attempt);
  return { attempt, dispose: () => removeOnline(attempt) };
}

// Wire to the offline page when loaded as its script. Guarded so importing the
// module in a test (no retry button in the DOM) is a no-op.
if (typeof document !== "undefined" && document.getElementById("retry")) {
  const button = document.getElementById("retry");
  const status = document.getElementById("status");
  const { attempt } = createReconnector({
    navigate: () => {
      window.location.href = APP_URL;
    },
    onChecking: () => {
      button.disabled = true;
      if (status) status.textContent = "Checking for a connection…";
    },
    onStillOffline: () => {
      button.disabled = false;
      if (status) status.textContent = "Still offline. Try again in a moment.";
    },
  });
  button.addEventListener("click", attempt);
}
