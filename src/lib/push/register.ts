import { Capacitor, registerPlugin } from "@capacitor/core";

/**
 * Device registration for push notifications (#218, spec 0008). Mirrors
 * `geo-watcher.ts`: on a native build it prompts for permission, registers with
 * APNs/FCM, and posts the token; on the web it reports "unsupported" (web push
 * is out of scope for v1). The network seams are unit-tested; the native
 * permission/registration flow is verified on a device.
 */

export type PushPlatform = "ios" | "android" | "web";

export type RegisterResult = {
  supported: boolean;
  status: "registered" | "denied" | "unsupported" | "error";
  token?: string;
};

type PermissionState =
  | "prompt"
  | "prompt-with-rationale"
  | "granted"
  | "denied";
type RegistrationEvent = "registration" | "registrationError";

// Minimal shape of @capacitor/push-notifications, declared locally so the web
// bundle needs no native dependency (the plugin is installed during the
// credential phase). registerPlugin resolves the native implementation on
// device; on the web these calls are no-ops we never reach.
interface PushPlugin {
  requestPermissions(): Promise<{ receive: PermissionState }>;
  register(): Promise<void>;
  addListener(
    event: RegistrationEvent,
    cb: (data: { value?: string; error?: string }) => void,
  ): Promise<unknown>;
}

const PushNotifications = registerPlugin<PushPlugin>("PushNotifications");

export function currentPlatform(): PushPlatform {
  const p = Capacitor.getPlatform();
  return p === "ios" || p === "android" ? p : "web";
}

export async function postSubscription(
  token: string,
  platform: PushPlatform,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const res = await fetchImpl("/api/push/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, platform }),
  });
  return res.ok;
}

export async function unsubscribeDevice(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const res = await fetchImpl("/api/push/register", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return res.ok;
}

/**
 * Prompt for permission, register the device, and store its token. Resolves
 * with the outcome; never throws so the UI can show a clear state.
 */
export async function registerForPushNotifications(): Promise<RegisterResult> {
  if (!Capacitor.isNativePlatform()) {
    return { supported: false, status: "unsupported" };
  }
  try {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== "granted") {
      return { supported: true, status: "denied" };
    }
    const token = await new Promise<string>((resolve, reject) => {
      void PushNotifications.addListener("registration", (data) => {
        if (data.value) resolve(data.value);
      });
      void PushNotifications.addListener("registrationError", (data) =>
        reject(new Error(data.error ?? "registration failed")),
      );
      void PushNotifications.register();
    });
    const ok = await postSubscription(token, currentPlatform());
    return { supported: true, status: ok ? "registered" : "error", token };
  } catch {
    return { supported: true, status: "error" };
  }
}
