import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import type { SecureStore } from "./token-store";

/**
 * The device's secure store (iOS Keychain / Android EncryptedSharedPreferences)
 * as a `SecureStore` for the session token (spec 0009, phase 4). Native only;
 * the plugin throws when a key is absent, which `get` maps to null.
 */
export const capacitorSecureStore: SecureStore = {
  async get(key) {
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      return value;
    } catch {
      return null;
    }
  },
  async set(key, value) {
    await SecureStoragePlugin.set({ key, value });
  },
  async remove(key) {
    await SecureStoragePlugin.remove({ key }).catch(() => {});
  },
};
