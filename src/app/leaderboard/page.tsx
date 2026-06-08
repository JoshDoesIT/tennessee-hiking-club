import { Suspense } from "react";
import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { Container } from "@/components/ui/container";
import { LeaderboardBoard } from "@/components/hikes/leaderboard-board";

export const metadata = pageMetadata({
  title: "Leaderboard",
  description:
    "A friendly, opt-in leaderboard that celebrates exploring Tennessee widely, not raw mileage.",
  path: "/leaderboard",
});

// Static so it can be bundled into the native app (#308, spec 0009): the board
// fetches its data client-side from GET /api/leaderboard. The data loaders moved
// to src/lib/hikes/leaderboard-server.ts behind that route.
export default function LeaderboardPage() {
  return (
    <Container className="max-w-2xl py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Community</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Leaderboard
      </h1>
      <p className="text-ink/70 mt-4 leading-relaxed">
        A friendly board that rewards exploring widely, not logging the most
        miles. Opt in from{" "}
        <Link
          href="/hikes"
          className="text-pine hover:text-forest underline underline-offset-4"
        >
          My hikes
        </Link>
        .
      </p>

      <Suspense fallback={null}>
        <LeaderboardBoard />
      </Suspense>
    </Container>
  );
}
