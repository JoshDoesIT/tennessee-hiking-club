import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/page-metadata";
import { MyHikes } from "@/components/hikes/my-hikes";
import { Challenges } from "@/components/hikes/challenges";
import { LogTransfer } from "@/components/hikes/log-transfer";
import { SyncOnSignIn } from "@/components/hikes/sync-on-signin";
import { LeaderboardOptIn } from "@/components/hikes/leaderboard-optin";
import { StewardBadge } from "@/components/stewardship/steward-badge";
import { ShareMyTennessee } from "@/components/hikes/share-my-tennessee";
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
      <p className="eyebrow text-amber-700">Your Tennessee</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        My hikes
      </h1>
      <p className="text-ink/70 mt-4 max-w-xl text-lg leading-relaxed">
        Everything you have logged, kept on this device by default. Sign in to
        sync it across your devices.
      </p>

      <div className="mt-4">
        <StewardBadge contributionCount={contributionCount} />
      </div>

      <div className="mt-8">
        <YourTennesseeMap data={mapData} />
      </div>

      <div className="mt-10">
        <MyHikes trails={trails} />
      </div>

      <Challenges trails={trails} />

      <LeaderboardOptIn />

      <ShareMyTennessee origin={SITE_URL} />

      <LogTransfer trails={trails} />
    </Container>
  );
}
