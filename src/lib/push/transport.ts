import { connect } from "node:http2";
import { apnsJwt, fcmAuthJwt } from "./jwt";
import type { PushSender, PushTarget } from "./send";
import type { PushNotification } from "./payload";

/**
 * The APNs (iOS) + FCM (Android) delivery transport behind the injected `send`
 * (#218, spec 0008). Credential-gated: a provider only sends when its env vars
 * are set, so CI and non-prod stay quiet (`createPushSender({})` is a no-op).
 *
 * The network is injected (`PushHttp`) so routing, gating, and the request
 * shapes are unit-tested without real APNs/FCM. `defaultPushHttp()` is the real
 * implementation (HTTP/2 for APNs, fetch for FCM).
 */

export interface ApnsConfig {
  teamId: string;
  keyId: string;
  privateKey: string;
  topic: string;
  host: string;
}
export interface FcmConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}
export interface PushConfig {
  apns?: ApnsConfig;
  fcm?: FcmConfig;
}

export interface PushHttp {
  apnsPost(opts: {
    host: string;
    deviceToken: string;
    jwt: string;
    topic: string;
    body: string;
  }): Promise<{ status: number }>;
  fetch: typeof fetch;
}

export interface PushDeps {
  http: PushHttp;
  now: () => number;
}

const unescape = (key: string) => key.replace(/\\n/g, "\n");

/** Read the provider config from env. A provider is included only when all of
 *  its required vars are present, so it no-ops everywhere else. */
export function pushConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): PushConfig {
  const config: PushConfig = {};
  if (env.APNS_TEAM_ID && env.APNS_KEY_ID && env.APNS_PRIVATE_KEY) {
    config.apns = {
      teamId: env.APNS_TEAM_ID,
      keyId: env.APNS_KEY_ID,
      privateKey: unescape(env.APNS_PRIVATE_KEY),
      topic: env.APNS_TOPIC ?? "club.tnhiking.app",
      host: env.APNS_HOST ?? "https://api.push.apple.com",
    };
  }
  if (env.FCM_PROJECT_ID && env.FCM_CLIENT_EMAIL && env.FCM_PRIVATE_KEY) {
    config.fcm = {
      projectId: env.FCM_PROJECT_ID,
      clientEmail: env.FCM_CLIENT_EMAIL,
      privateKey: unescape(env.FCM_PRIVATE_KEY),
    };
  }
  return config;
}

/** The notification as an APNs `aps` payload, with the deep-link data alongside. */
export function apnsPayload(n: PushNotification) {
  return {
    aps: { alert: { title: n.title, body: n.body }, sound: "default" },
    trailSlug: n.data.trailSlug,
    url: n.data.url,
  };
}

/** The notification as an FCM HTTP v1 message for a single device token. */
export function fcmMessage(target: PushTarget, n: PushNotification) {
  return {
    message: {
      token: target.token,
      notification: { title: n.title, body: n.body },
      data: { trailSlug: n.data.trailSlug, url: n.data.url },
    },
  };
}

export function createPushSender(
  config: PushConfig,
  deps: PushDeps,
): PushSender {
  let fcmToken: { value: string; expires: number } | null = null;

  async function fcmAccessToken(fcm: FcmConfig): Promise<string> {
    const now = deps.now();
    if (fcmToken && fcmToken.expires > now + 60) return fcmToken.value;
    const assertion = fcmAuthJwt({
      clientEmail: fcm.clientEmail,
      privateKey: fcm.privateKey,
      now,
    });
    const res = await deps.http.fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    const json = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    fcmToken = { value: json.access_token, expires: now + json.expires_in };
    return json.access_token;
  }

  return async (target, notification) => {
    if (target.platform === "ios") {
      if (!config.apns) return false;
      const jwt = apnsJwt({
        teamId: config.apns.teamId,
        keyId: config.apns.keyId,
        privateKey: config.apns.privateKey,
        now: deps.now(),
      });
      const { status } = await deps.http.apnsPost({
        host: config.apns.host,
        deviceToken: target.token,
        jwt,
        topic: config.apns.topic,
        body: JSON.stringify(apnsPayload(notification)),
      });
      return status >= 200 && status < 300;
    }
    if (target.platform === "android") {
      if (!config.fcm) return false;
      const accessToken = await fcmAccessToken(config.fcm);
      const res = await deps.http.fetch(
        `https://fcm.googleapis.com/v1/projects/${config.fcm.projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(fcmMessage(target, notification)),
        },
      );
      return res.ok;
    }
    return false;
  };
}

/** Real network: APNs over HTTP/2, FCM over fetch. */
export function defaultPushHttp(): PushHttp {
  return {
    fetch: (...args) => fetch(...args),
    apnsPost: ({ host, deviceToken, jwt, topic, body }) =>
      new Promise((resolve, reject) => {
        const client = connect(host);
        client.on("error", reject);
        const req = client.request({
          ":method": "POST",
          ":path": `/3/device/${deviceToken}`,
          "apns-topic": topic,
          "apns-push-type": "alert",
          authorization: `bearer ${jwt}`,
        });
        let status = 0;
        req.on("response", (headers) => {
          status = Number(headers[":status"]) || 0;
        });
        req.setEncoding("utf8");
        req.on("data", () => {});
        req.on("end", () => {
          client.close();
          resolve({ status });
        });
        req.on("error", (err) => {
          client.close();
          reject(err);
        });
        req.end(body);
      }),
  };
}

/** The app-wide sender: real network + config from env. A no-op until the APNs
 *  and/or FCM env vars are configured. */
export function defaultPushSender(): PushSender {
  return createPushSender(pushConfigFromEnv(), {
    http: defaultPushHttp(),
    now: () => Math.floor(Date.now() / 1000),
  });
}
