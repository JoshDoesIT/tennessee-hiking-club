# 0008: Push notifications for trail alerts

- **Status:** transport implemented (credential-gated); device registration plugin + on-device verify pending
- **Issue:** #218 (part of the native mobile build, #202 / spec 0006)
- **Depends on:** the Capacitor shell (#215)

## Problem

Closures, alerts, and condition reports are time-sensitive. Today a member only
sees them if they open the app. Native push lets the club reach members
proactively: a road washout or a trail closure can go out the moment it is
curated into the trail content.

## What this scaffold delivers

The plumbing that does not depend on Apple/Google credentials or a physical
device, all test-first:

- **Subscription store.** A `push_subscriptions` table keyed by the APNs/FCM
  device `token` (unique, so re-registering upserts), with `platform`, an
  optional `userId` (set when signed in), and timestamps. Migration `0014`.
- **Device registration.** `src/lib/push/register.ts` mirrors `geo-watcher.ts`:
  on a native build it prompts for permission, registers, and POSTs the token;
  on the web it reports "not supported" (web push is out of scope for v1). The
  network seams (`postSubscription` / `unsubscribeDevice`) are unit-tested.
- **Opt-in.** A local preference (`tnhc:push-optin`) tracks the member's choice
  and current token so the UI reflects state; the database row is the source of
  truth for delivery. A `PushOptIn` toggle drives register / unsubscribe.
- **API.** `POST /api/push/register` upserts a subscription (associating the
  signed-in user when present); `DELETE /api/push/register` removes it
  (opt-out). Both Zod-validated.
- **Send path.** `notifyTrailAlert({ trail, alert, db, send })` loads the
  subscriptions and builds the notification with `trailAlertNotification(...)`,
  calling an injected `send` per device. The payload builder is pure and tested.
- **Transport.** `src/lib/push/transport.ts`: `createPushSender(config, deps)`
  routes iOS → APNs (HTTP/2 token auth) and Android → FCM (HTTP v1), with the
  network injected so routing/gating/shape are unit-tested; `jwt.ts` builds the
  APNs ES256 and FCM service-account tokens with Node crypto (no new deps).
  Credential-gated via `pushConfigFromEnv`: a provider sends only when its vars
  are set, so CI and non-prod no-op. `defaultPushSender()` wires the real
  network + env.
- **Trigger.** `POST /api/admin/push-test` (admin-only) sends a test push to all
  registered devices, to exercise the transport once credentials are set.

## Configuration (maintainer, to deliver)

Set these in the deployment env (no-op until present). The private keys are PEM;
`\n`-escaped newlines are unescaped automatically.

- **APNs:** `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY` (the `.p8`),
  optionally `APNS_TOPIC` (default `club.tnhiking.app`) and `APNS_HOST` (default
  `https://api.push.apple.com`; use the sandbox host for debug builds).
- **FCM:** `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` (from the
  Firebase service-account JSON).

## Pending (device, tracked on #218)

- Install `@capacitor/push-notifications` and wire it into `register.ts`
  (replace the local plugin interface) so devices actually obtain APNs/FCM
  tokens; enable the iOS Push capability + add `google-services.json`; `cap sync`.
- Verify on a device that `POST /api/admin/push-test` delivers on iOS and
  Android (AC2), and that opt-out stops delivery (AC3).

## Acceptance criteria (from #218)

1. A device registers and an opt-in is stored. (scaffolded + tested)
2. A test alert delivers to a registered device on iOS and Android. (transport
   - trigger implemented and unit-tested; on-device delivery pending the
     registration plugin + credentials)
3. Opt-out works and stops delivery. (delete endpoint + opt-in toggle tested;
   transport only sends to stored subscriptions, so opt-out stops it; end-to-end
   verified on device)

## Privacy / design notes

- A device may subscribe without an account; `userId` is associated only when
  the member is signed in. Opting out deletes the row.
- Tokens are device push tokens, not personal data; they rotate and are
  replaced on re-registration via the unique-token upsert.
