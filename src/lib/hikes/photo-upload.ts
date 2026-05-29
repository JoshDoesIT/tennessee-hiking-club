/**
 * Upload a (compressed) hike photo to the account-backed store and return its
 * URL, or null if it couldn't be uploaded (signed out, no Blob store, offline).
 * Best-effort: callers fall back to the local IndexedDB copy.
 */
export async function uploadPhoto(blob: Blob): Promise<string | null> {
  try {
    const form = new FormData();
    form.set("file", blob, "photo.jpg");
    const res = await fetch("/api/hikes/photo", { method: "POST", body: form });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: unknown };
    return typeof data.url === "string" ? data.url : null;
  } catch {
    return null;
  }
}

/** Best-effort deletion of an uploaded photo (e.g. when its hike is removed). */
export async function deleteRemotePhoto(url: string): Promise<void> {
  try {
    await fetch("/api/hikes/photo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    // Best effort.
  }
}
