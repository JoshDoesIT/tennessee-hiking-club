import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { MyHikes } from "@/components/hikes/my-hikes";
import { Challenges } from "@/components/hikes/challenges";
import { LogTransfer } from "@/components/hikes/log-transfer";
import { SyncOnSignIn } from "@/components/hikes/sync-on-signin";
import { YourTennesseeMap } from "@/components/map/your-tennessee-map";
import { tennesseeMapData } from "@/components/map/map-data";
import { getAllTrails } from "@/lib/trails";

export const metadata: Metadata = {
  title: "My hikes",
  description:
    "Your logged hikes across Tennessee, kept privately on your device.",
  robots: { index: false },
};

export default function MyHikesPage() {
  const trails = getAllTrails();
  const mapData = tennesseeMapData(trails);

  return (
    <Container className="py-12 sm:py-16">
      <SyncOnSignIn />
      <p className="eyebrow text-amber-700">Your Tennessee</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        My hikes
      </h1>
      <p className="text-ink/70 mt-4 max-w-xl text-lg leading-relaxed">
        Everything you have logged, kept privately on this device. Sign-in and
        sync across devices are on the way.
      </p>

      <div className="mt-8">
        <YourTennesseeMap data={mapData} />
      </div>

      <div className="mt-10">
        <MyHikes trails={trails} />
      </div>

      <Challenges trails={trails} />

      <LogTransfer trails={trails} />
    </Container>
  );
}
