import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/page-metadata";
import { MyHikes } from "@/components/hikes/my-hikes";
import { Challenges } from "@/components/hikes/challenges";
import { LogTransfer } from "@/components/hikes/log-transfer";
import { SyncOnSignIn } from "@/components/hikes/sync-on-signin";
import { FriendsAndSharing } from "@/components/hikes/friends-and-sharing";
import { PasskeyManager } from "@/components/auth/passkey-manager";
import { SignedInGate } from "@/components/auth/signed-in-gate";
import { DeleteAccount } from "@/components/account/delete-account";
import { PushOptIn } from "@/components/push/push-opt-in";
import { StewardBadgeLive } from "@/components/stewardship/steward-badge-live";
import { YourTennesseeMap } from "@/components/map/your-tennessee-map";
import { SITE_URL } from "@/lib/site";
import { tennesseeMapData } from "@/components/map/map-data";
import { getAllTrails } from "@/lib/trails";

export const metadata = pageMetadata({
  title: "My hikes",
  description:
    "Your logged hikes across Tennessee, kept privately on your device.",
  path: "/hikes",
  noindex: true,
});

// Static so it can be bundled into the native app (#308, spec 0009): the steward
// badge and the passkey section resolve the signed-in member client-side.
export default function MyHikesPage() {
  const trails = getAllTrails();
  const mapData = tennesseeMapData(trails);

  return (
    <Container className="py-12 sm:py-16">
      <SyncOnSignIn />

      <header>
        <p className="eyebrow text-amber-700">Your Tennessee</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="display text-forest text-4xl text-pretty sm:text-5xl">
            My hikes
          </h1>
          <StewardBadgeLive />
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

      {/* Account & data: set-and-forget controls. */}
      <section
        aria-labelledby="account-heading"
        className="border-forest/10 mt-12 border-t pt-8"
      >
        <h2 id="account-heading" className="display text-forest text-2xl">
          Account &amp; data
        </h2>
        <p className="text-ink/70 mt-1 max-w-xl text-sm leading-relaxed">
          Manage how you sign in, and back up or move your logged hikes.
        </p>
        <div className="mt-6 space-y-8">
          <PushOptIn />
          <SignedInGate>
            <PasskeyManager />
          </SignedInGate>
          <LogTransfer trails={trails} />
          <SignedInGate>
            <DeleteAccount />
          </SignedInGate>
        </div>
      </section>
    </Container>
  );
}
