# 0005: Accounts, hike logging & gamification

- **Status:** Draft
- **Milestones:** M11 (logging, challenges, community)
- **Issues:** #79, #80, #81, #82, #83, #84

## Problem

People want to track the hikes they have done, see progress on a personal map,
earn Tennessee-themed challenge badges, and (optionally) compare with others.
Leaderboards and cross-device sync require identity and a small database;
personal tracking does not. We want the social layer without forcing a login on
anyone, and without leaving the free tier.

## Principles

- **Local-first.** The app is fully usable signed-out: hikes are logged in the
  browser and never leave the device unless the user signs in.
- **Optional accounts.** Signing in adds cross-device sync and opt-in community
  features. Local hikes migrate into the account on first sign-in.
- **Private by default.** Hikes are private; leaderboard participation and any
  sharing are explicit and revocable.
- **Kind competition.** Reward breadth and stewardship, not raw mileage or
  fastest times (which create unsafe incentives).
- **Free tier, no card data, keys via env only.**

## Stack decision

- **Auth:** Auth.js (NextAuth v5). Providers are env-gated and multi-option, so
  the maintainer enables whatever they provision: **Google** (lowest friction
  for a general audience), **email magic link** (universal; via a free sender
  such as Resend), and **GitHub** (contributor-friendly). Signed-out remains the
  default experience.
- **Database:** **Neon** serverless Postgres (free tier, Vercel Marketplace) via
  **Drizzle ORM** (lean, TypeScript-first, serverless-friendly) and the Auth.js
  Drizzle adapter.
- **Why not Supabase-only / GitHub-only:** Supabase is a fine alternative, but
  Neon + Drizzle keeps the data layer thin and typed and avoids coupling auth to
  one vendor. GitHub-only auth would exclude non-developer hikers.

## Data model

Auth.js manages `users`, `accounts`, `sessions`, `verification_tokens`.
App tables:

- `hikes` — `id`, `user_id`, `trail_slug`, `hiked_on` (date), `notes` (text,
  optional), `created_at`. One row per logged hike.
- `profiles` — `user_id`, `display_name`, `leaderboard_opt_in` (bool, default
  false), `lnt_pledged_at` (timestamp, optional).

Challenge progress, stats, and leaderboard standings are **computed** from
`hikes` (plus the trail catalog and contribution data) by pure functions, so
there is no derived state to keep in sync.

## Architecture: pure core + thin adapters

The gamification logic is pure and DB-agnostic (`src/lib/hikes/`):

- `computeStats(log, trails)` — hikes, distinct trails, miles, elevation,
  Grand Divisions and parks covered.
- `evaluateChallenge(challenge, completedSlugs, trails)` — `{ done, progress,
total }` for a typed criterion (all regions; a specific trail set; N trails
  with a tag; N distinct trails).
- `rankLeaderboard(entries, metric)` — breadth/stewardship rankings.

This core powers **both** the local-first experience (browser storage) and the
server (Neon via Drizzle). The DB layer is a thin CRUD adapter; the API routes
read/write `hikes` and hand plain arrays to the pure core.

## Acceptance criteria

- [ ] Pure gamification core with full unit tests (stats, challenge evaluation,
      leaderboard ranking), no DB or auth needed. (#82, #83)
- [ ] Local-first hike log + "Your Tennessee" map/stats, signed-out. (#79, #80)
- [ ] Auth.js sign-in (env-gated providers); app fully usable signed-out;
      local hikes migrate on first sign-in. (#81)
- [ ] Neon + Drizzle schema and a hike-sync API; secrets via env only. (#81)
- [ ] Opt-in leaderboards over breadth/stewardship metrics. (#83)
- [ ] Stewardship: Leave No Trace pledge + contribution recognition. (#84)

## Privacy & safety

- Hikes are private by default; the leaderboard shows only opt-in users by their
  chosen display name.
- No precise home/Live location is stored; we store which trail was hiked and a
  date, not GPS tracks (route recording, if added later, is local-first).
- Standard session security; `AUTH_SECRET` and provider keys via env.

## Test plan

- Unit: the pure core (stats, challenge evaluation, ranking) against fixtures.
- Integration: the sync API with the DB adapter mocked; auth config loads with
  env-gated providers.
- e2e: signed-out logging persists locally; the trail page reflects "hiked".

## Phasing

- **A (no infra):** pure core + local-first logging + "Your Tennessee".
- **B (infra):** accounts (Auth.js + Neon + Drizzle) + sync. Requires the
  maintainer to provision Neon and at least one auth provider (see ONBOARDING).
- **C:** shared challenges + opt-in leaderboards + stewardship.

> Phases A and B/C are independently shippable; A needs no accounts or database.
