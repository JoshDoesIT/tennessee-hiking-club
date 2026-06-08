import { Filesystem, Directory } from "@capacitor/filesystem";
import type { TileStore } from "./native-tile-cache";

/**
 * A `TileStore` over `@capacitor/filesystem`, the on-device backing for the
 * service-worker-free tile cache in the bundled app (spec 0007 / 0009, #314).
 * Tiles live under a `tiles/` directory in the Cache directory (OS-evictable).
 * The filesystem is injectable so the adapter is unit-tested without a device.
 */

const TILE_DIR = "tiles";
const DIRECTORY = Directory.Cache;

/** ArrayBuffer -> base64, chunked so large tiles do not overflow the call stack. */
export function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** base64 -> ArrayBuffer. */
export function base64ToBytes(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** The slice of `@capacitor/filesystem` the tile store uses (injectable). */
export interface TileFilesystem {
  writeFile(opts: {
    path: string;
    directory: Directory;
    data: string;
    recursive?: boolean;
  }): Promise<{ uri: string }>;
  readFile(opts: {
    path: string;
    directory: Directory;
  }): Promise<{ data: string | Blob }>;
  stat(opts: { path: string; directory: Directory }): Promise<unknown>;
}

export function createFilesystemTileStore(
  fs: TileFilesystem = Filesystem as unknown as TileFilesystem,
): TileStore {
  const path = (key: string) => `${TILE_DIR}/${key}`;
  return {
    async has(key) {
      try {
        await fs.stat({ path: path(key), directory: DIRECTORY });
        return true;
      } catch {
        return false;
      }
    },
    async read(key) {
      const { data } = await fs.readFile({
        path: path(key),
        directory: DIRECTORY,
      });
      // Native returns a base64 string; a Blob would only come from the web
      // filesystem, which this native-only path does not use.
      return base64ToBytes(typeof data === "string" ? data : "");
    },
    async write(key, data) {
      await fs.writeFile({
        path: path(key),
        directory: DIRECTORY,
        data: bytesToBase64(data),
        recursive: true,
      });
    },
  };
}
