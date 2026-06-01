import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/page-metadata";
import { MyHikes } from "@/components/hikes/my-hikes";
import { Challenges } from "@/components/hikes/challenges";
import { LogTransfer } from "@/components/hikes/log-transfer";
import { SyncOnSignIn } from "@/components/hikes/sync-on-signin";
import { FriendsAndSharing } from "@/components/hikes/friends-and-sharing";
import { PasskeyManager } from "@/components/auth/passkey-manager";
import { StewardBadge } from "@/components/stewardship/steward-badge";
import { YourTennesseeMap } from "@/components/map/your-tennessee-map";
import { SITE_URL } from "@/lib/site";
import { tennesseeMapData } from "@/components/map/map-data";
import { getAllTrails } from "@/lib/trails";
import { auth } from "@/auth";
import { getContributionCountForUser } from "@/lib/stewardship/contributions-server";

export const metadata = pageMetadata({
  title: "My hikes",
  description:
    "Your logged hikes across Tennessee, kept privately on your device.",
  path: "/hikes",
  noindex: true,
});

export default async function MyHikesPage() {
  const trails = getAllTrails();
  const mapData = tennesseeMapData(trails);
  const session = await auth();
  const contributionCount = session?.user?.id
    ? await getContributionCountForUser(session.user.id)
    : 0;

  return (
    <Container className="py-12 sm:py-16">
      <SyncOnSignIn />

      <header>
        <p className="eyebrow text-amber-700">Your Tennessee</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="display text-forest text-4xl text-pretty sm:text-5xl">
            My hikes
          </h1>
          <StewardBadge contributionCount={contributionCount} />
        </div>
        <p className="text-ink/70 mt-4 max-w-xl text-lg leading-relaxed">
          Everything you have logged, kept on this device by default. Sign in to
          sync it across your devices.
        </p>
      </header>

      {/* Your progress: the map, your logged hikes, and challenges. */}
      <div className="mt-8">
        <YourTennesseeMap data={mapData} />
      </div>
      <div className="mt-10">
        <MyHikes trails={trails} />
      </div>
      <Challenges trails={trails} />

      {/* Friends & sharing: the social features, grouped under one heading. */}
      <FriendsAndSharing origin={SITE_URL} />

      {/* Account & data: set-and-forget controls, collapsed by default. */}
      <details className="group border-forest/10 mt-12 border-t pt-8">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <h2 className="display text-forest text-2xl">Account &amp; data</h2>
          <span
            aria-hidden="true"
            className="text-olive text-sm transition-transform group-open:rotate-180"
          >
            ▾
          </span>
        </summary>
        <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
          Manage how you sign in, and back up or move your logged hikes.
        </p>
        <div className="mt-6 space-y-8">
          {session?.user ? <PasskeyManager /> : null}
          <LogTransfer trails={trails} />
        </div>
      </details>
    </Container>
  );
}
