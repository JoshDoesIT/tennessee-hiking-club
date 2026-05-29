import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { Container } from "@/components/ui/container";

const REPO = "https://github.com/JoshDoesIT/tennessee-hiking-club";
const LAST_UPDATED = "May 28, 2026";

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "What the Tennessee Hiking Club collects, who processes it, and how to export or delete your data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Container className="max-w-2xl py-16 sm:py-20">
      <p className="eyebrow text-amber-700">Your data</p>
      <h1 className="display text-forest mt-3 text-4xl">Privacy</h1>
      <p className="text-ink/75 mt-4 leading-relaxed">
        The Tennessee Hiking Club is local-first. You can browse every trail and
        keep a personal hike log without an account, and signing in is always
        optional. This page explains what is collected, who processes it, and
        how to take your data with you or remove it.
      </p>

      <div className="text-ink/80 mt-10 space-y-8 leading-relaxed">
        <section>
          <h2 className="display text-forest text-2xl">What we collect</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Browsing:</strong> nothing is required to explore the site.
              Our host keeps standard, short-lived request logs for security and
              reliability.
            </li>
            <li>
              <strong>Your hike log:</strong> when you mark trails hiked, that
              log lives in your browser (and photos in your browser&rsquo;s
              local storage). It never leaves your device unless you sign in.
            </li>
            <li>
              <strong>When you sign in:</strong> we store the basic identity your
              provider shares (name, email, avatar), and we sync your hikes,
              profile, cleanup log, and per-hike photos so they follow you across
              devices. Photos are kept in private storage and shown only to you.
            </li>
            <li>
              <strong>Analytics:</strong> privacy-friendly, aggregate usage and
              performance metrics. No cross-site tracking and no selling of data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="display text-forest text-2xl">
            Who processes your data
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>GitHub</strong> and <strong>Google</strong>, only if you
              choose to sign in with them.
            </li>
            <li>
              <strong>Vercel</strong>, our host, for serving the site,
              aggregate analytics, and private photo storage.
            </li>
            <li>
              <strong>Neon</strong>, our database, for your synced hikes and
              profile when signed in.
            </li>
            <li>
              <strong>Stripe</strong>, for payments if and when the shop opens.
              We never see your full card details.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="display text-forest text-2xl">Public only by choice</h2>
          <p className="mt-3">
            Leaderboards are opt-in. Nothing about your hikes is shown publicly
            unless you explicitly turn sharing on, and you can turn it off again
            at any time.
          </p>
        </section>

        <section>
          <h2 className="display text-forest text-2xl">Your control</h2>
          <p className="mt-3">
            You can export your hike log to a file at any time from{" "}
            <Link
              href="/hikes"
              className="text-pine hover:text-forest underline underline-offset-4"
            >
              My hikes
            </Link>
            , and import it on another device. You can remove individual hikes,
            and if you signed in you can delete your account and the data we
            synced for you. Deleting locally clears the copy in your browser.
          </p>
        </section>

        <section>
          <h2 className="display text-forest text-2xl">Contact</h2>
          <p className="mt-3">
            Questions about privacy? Please{" "}
            <a
              href={`${REPO}/issues/new/choose`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pine hover:text-forest underline underline-offset-4"
            >
              open an issue on GitHub
            </a>{" "}
            and we will help.
          </p>
        </section>

        <p className="text-ink/55 text-sm">Last updated {LAST_UPDATED}.</p>
      </div>
    </Container>
  );
}
