import { ALERT_LABEL } from "@/lib/trails/conditions";
import type { TrailAlert } from "@/lib/trails/schema";

/**
 * A platform-neutral push notification: a title and body for display, plus a
 * small `data` payload the app uses to deep-link when the member taps it. The
 * APNs/FCM transport (#218, spec 0008) maps this onto each provider's wire
 * format.
 */
export type PushNotification = {
  title: string;
  body: string;
  data: { trailSlug: string; url: string };
};

type TrailRef = { name: string; slug: string };
type AlertRef = Pick<TrailAlert, "level" | "message">;

/** Build the notification for a trail alert: "<Label>: <Trail>" with the alert
 *  message as the body, deep-linking to the trail page. */
export function trailAlertNotification(
  trail: TrailRef,
  alert: AlertRef,
): PushNotification {
  return {
    title: `${ALERT_LABEL[alert.level]}: ${trail.name}`,
    body: alert.message,
    data: { trailSlug: trail.slug, url: `/trails/${trail.slug}` },
  };
}
