# 0008: Push notifications for trail alerts

- **Status:** scaffold (registration + opt-in landed; delivery transport pending)
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

## Pending (credential + device, tracked on #218)

These need accounts and a real device, so they are the maintainer's to finish:

- Install `@capacitor/push-notifications`, configure the iOS APNs key (Apple
  Developer) and Android FCM project (Firebase), and `npx cap sync`.
- Implement the transport behind `send`: APNs (HTTP/2, token auth) and FCM
  (HTTP v1). Gate it on the provider env vars; no-op when unset so non-prod and
  CI stay quiet.
- Verify on device that a test alert delivers on iOS and Android (AC2).

## Acceptance criteria (from #218)

1. A device registers and an opt-in is stored. (scaffolded + tested)
2. A test alert delivers to a registered device on iOS and Android. (pending
   transport + device)
3. Opt-out works and stops delivery. (delete endpoint + opt-in toggle tested;
   end-to-end stop verified once transport lands)

## Privacy / design notes

- A device may subscribe without an account; `userId` is associated only when
  the member is signed in. Opting out deletes the row.
- Tokens are device push tokens, not personal data; they rotate and are
  replaced on re-registration via the unique-token upsert.
