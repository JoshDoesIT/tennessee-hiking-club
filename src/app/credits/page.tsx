import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { FACEBOOK_GROUP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Credits",
  description:
    "Photo, map, and data attributions for the Tennessee Hiking Club.",
};

const ISSUES_URL = "https://github.com/JoshDoesIT/tennessee-hiking-club/issues";

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-pine hover:text-forest underline underline-offset-4"
    >
      {children}
    </a>
  );
}

export default function CreditsPage() {
  return (
    <Container className="max-w-2xl py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Tennessee Hiking Club</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">Credits</h1>
      <p className="text-ink/75 mt-4 text-lg leading-relaxed">
        This site runs on open data and community generosity. Thank you to
        everyone who shares their photos, and to the open projects below.
      </p>

      <section aria-labelledby="photos-heading" className="mt-10">
        <h2 id="photos-heading" className="display text-forest text-2xl">
          Photos
        </h2>
        <p className="text-ink/75 mt-3 leading-relaxed">
          Trail photos are contributed by the community and used with
          permission, or sourced under open licenses such as Creative Commons
          and the public domain. The credit for each photo appears on its trail
          page.
        </p>
        <p className="text-ink/75 mt-3 leading-relaxed">
          Many come from members of our{" "}
          <ExtLink href={FACEBOOK_GROUP_URL}>Facebook group</ExtLink>, shared
          for use here.
        </p>
        <p className="text-ink/70 mt-3 text-sm leading-relaxed">
          Are you a photographer who would like a photo added, updated, or taken
          down? Open an issue on{" "}
          <ExtLink href={ISSUES_URL}>GitHub</ExtLink> and we will take care of
          it.
        </p>
      </section>

      <section aria-labelledby="data-heading" className="mt-10">
        <h2 id="data-heading" className="display text-forest text-2xl">
          Maps &amp; data
        </h2>
        <ul className="text-ink/75 mt-3 space-y-3 leading-relaxed">
          <li>
            <strong className="text-forest">Map data</strong> &copy;{" "}
            <ExtLink href="https://www.openstreetmap.org/copyright">
              OpenStreetMap
            </ExtLink>{" "}
            contributors, under the Open Database License.
          </li>
          <li>
            <strong className="text-forest">Base map tiles</strong> from{" "}
            <ExtLink href="https://openfreemap.org">OpenFreeMap</ExtLink>.
          </li>
          <li>
            <strong className="text-forest">Terrain</strong> from{" "}
            <ExtLink href="https://registry.opendata.aws/terrain-tiles/">
              AWS Terrain Tiles
            </ExtLink>
            .
          </li>
          <li>
            <strong className="text-forest">Weather</strong> from{" "}
            <ExtLink href="https://open-meteo.com">Open-Meteo</ExtLink> (CC BY
            4.0).
          </li>
        </ul>
      </section>

      <section aria-labelledby="type-heading" className="mt-10">
        <h2 id="type-heading" className="display text-forest text-2xl">
          Typography
        </h2>
        <p className="text-ink/75 mt-3 leading-relaxed">
          Set in{" "}
          <ExtLink href="https://fonts.google.com/specimen/Fraunces">
            Fraunces
          </ExtLink>{" "}
          and{" "}
          <ExtLink href="https://fonts.google.com/specimen/Hanken+Grotesk">
            Hanken Grotesk
          </ExtLink>
          , both under the SIL Open Font License.
        </p>
      </section>
    </Container>
  );
}
