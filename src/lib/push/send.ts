import { pushSubscriptions } from "@/lib/db/schema";
import { trailAlertNotification, type PushNotification } from "./payload";
import type { TrailAlert } from "@/lib/trails/schema";

/**
 * Send path for trail-alert push notifications (#218, spec 0008). This is the
 * orchestration: load the subscribed devices, build the notification once, and
 * hand each device to an injected `send`. The actual APNs/FCM transport behind
 * `send` is credential-gated and lands during the credential phase; injecting it
 * keeps this unit-testable and lets the transport be swapped per platform.
 *
 * A trail alert currently goes to every subscriber (members opt in to trail
 * alerts as a whole). Per-trail subscriptions are a later refinement.
 */

export type PushTarget = { token: string; platform: string };
export type PushSender = (
  target: PushTarget,
  notification: PushNotification,
) => Promise<boolean>;

export type NotifyResult = { recipients: number; sent: number; failed: number };

type SubsDb = {
  select: () => {
    from: (table: typeof pushSubscriptions) => Promise<PushTarget[]>;
  };
};

export async function notifyTrailAlert(opts: {
  trail: { name: string; slug: string };
  alert: Pick<TrailAlert, "level" | "message">;
  db: SubsDb;
  send: PushSender;
}): Promise<NotifyResult> {
  const { trail, alert, db, send } = opts;
  const notification = trailAlertNotification(trail, alert);
  const subscribers = await db.select().from(pushSubscriptions);

  let sent = 0;
  let failed = 0;
  for (const sub of subscribers) {
    try {
      const ok = await send(
        { token: sub.token, platform: sub.platform },
        notification,
      );
      if (ok) sent++;
      else failed++;
    } catch {
      // One bad token must not stop the broadcast.
      failed++;
    }
  }
  return { recipients: subscribers.length, sent, failed };
}
