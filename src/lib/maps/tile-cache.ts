/**
 * Thin bridge to the service worker for managing downloaded tiles (#217). The
 * worker owns the tile cache (its name carries the cache version), so the page
 * asks it to clear or delete tiles by message rather than touching Cache
 * Storage directly. Each call resolves when the worker replies, or to `null`
 * when there is no controlling worker (e.g. first load, or SSR).
 */

function activeWorker(): ServiceWorker | null {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return null;
  return navigator.serviceWorker.controller;
}

function send<T>(message: Record<string, unknown>): Promise<T | null> {
  const worker = activeWorker();
  if (!worker || typeof MessageChannel === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise<T | null>((resolve) => {
    const channel = new MessageChannel();
    let settled = false;
    const finish = (value: T | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    // Don't let a missing reply hang the UI.
    const timer = setTimeout(() => finish(null), 4000);
    channel.port1.onmessage = (event) => finish(event.data as T);
    worker.postMessage(message, [channel.port2]);
  });
}

export function clearOfflineTiles(): Promise<{ cleared: boolean } | null> {
  return send({ type: "TNHC_CLEAR_TILES" });
}

export function deleteOfflineTiles(
  urls: string[],
): Promise<{ deleted: number } | null> {
  return send({ type: "TNHC_DELETE_TILES", urls });
}

export function offlineTileUsage(): Promise<{ count: number } | null> {
  return send({ type: "TNHC_TILES_USAGE" });
}
