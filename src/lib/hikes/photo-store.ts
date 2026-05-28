import { blobToDataUrl } from "./image";

/**
 * Local-first store for per-hike photo blobs, kept in IndexedDB so it does not
 * eat the small localStorage budget the hike log uses. Each photo is keyed by a
 * stable `photoId` carried on its hike entry. Client-only: every function
 * no-ops when `indexedDB` is unavailable (SSR), so the module is safe to import
 * anywhere.
 */

const DB_NAME = "thc";
const STORE = "hike-photos";

function available(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Stored as a plain {type, buffer} envelope rather than a Blob: ArrayBuffers
// round-trip reliably through structured clone in every environment, whereas a
// Blob does not under some IndexedDB implementations.
type StoredPhoto = { type: string; buffer: ArrayBuffer };

export async function putPhoto(id: string, blob: Blob): Promise<void> {
  if (!available()) return;
  const buffer = await blob.arrayBuffer();
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put({ type: blob.type, buffer } as StoredPhoto, id);
  await done(tx);
  db.close();
}

export async function getPhoto(id: string): Promise<Blob | undefined> {
  if (!available()) return undefined;
  const db = await openDb();
  const stored = await request<StoredPhoto | undefined>(
    db.transaction(STORE, "readonly").objectStore(STORE).get(id),
  );
  db.close();
  return stored ? new Blob([stored.buffer], { type: stored.type }) : undefined;
}

export async function deletePhoto(id: string): Promise<void> {
  if (!available()) return;
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await done(tx);
  db.close();
}

export async function getAllPhotoIds(): Promise<string[]> {
  if (!available()) return [];
  const db = await openDb();
  const keys = await request<IDBValidKey[]>(
    db.transaction(STORE, "readonly").objectStore(STORE).getAllKeys(),
  );
  db.close();
  return keys.map(String);
}

export async function getPhotoDataUrl(id: string): Promise<string | undefined> {
  const blob = await getPhoto(id);
  return blob ? blobToDataUrl(blob) : undefined;
}
