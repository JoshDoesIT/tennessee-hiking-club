import type { HikeLogEntry } from "./types";

/** A single hike photo: its local IndexedDB handle and/or its uploaded URL. */
export type HikePhotoRef = { id?: string; url?: string };

/**
 * The photos for a logged hike, newest data model first. Pairs local blob ids
 * (`photoIds`) with their uploaded URLs (`photoUrls`) by index, and falls back
 * to the legacy single `photoId`/`photoUrl` so hikes logged before multi-photo
 * support still show their photo (#358).
 */
export function entryPhotos(e: HikeLogEntry): HikePhotoRef[] {
  const ids = e.photoIds ?? [];
  const urls = e.photoUrls ?? [];
  if (ids.length || urls.length) {
    const n = Math.max(ids.length, urls.length);
    return Array.from({ length: n }, (_, i) => {
      const ref: HikePhotoRef = {};
      if (ids[i]) ref.id = ids[i];
      if (urls[i]) ref.url = urls[i];
      return ref;
    });
  }
  if (e.photoId || e.photoUrl) {
    const ref: HikePhotoRef = {};
    if (e.photoId) ref.id = e.photoId;
    if (e.photoUrl) ref.url = e.photoUrl;
    return [ref];
  }
  return [];
}

/** Every local blob id for a hike (new + legacy), for garbage collection. */
export function entryPhotoIds(e: HikeLogEntry): string[] {
  const ids = [...(e.photoIds ?? [])];
  if (e.photoId && !ids.includes(e.photoId)) ids.push(e.photoId);
  return ids;
}

/** Every remote photo URL for a hike (new + legacy), for remote cleanup. */
export function entryPhotoUrls(e: HikeLogEntry): string[] {
  const urls = [...(e.photoUrls ?? [])];
  if (e.photoUrl && !urls.includes(e.photoUrl)) urls.push(e.photoUrl);
  return urls;
}
