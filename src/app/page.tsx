import Link from "next/link";
import { PeakPinMark } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { Ridgeline } from "@/components/ridgeline";
import { SkyBackdrop } from "@/components/sky-backdrop";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { TrailCard } from "@/components/trails/trail-card";
import { getAllTrails } from "@/lib/trails";
import { featuredTrails } from "@/lib/trails/filter";

const REPO = "https://github.com/JoshDoesIT/tennessee-hiking-club";

export default function Home() {
  const featured = featuredTrails(getAllTrails());
  return (
    <>
      {/* ----------------------------- HERO ----------------------------- */}
      <section className="relative overflow-hidden">
        <div className="from-cream-50 via-cream to-parchment absolute inset-0 -z-20 bg-gradient-to-b" />
        <SkyBackdrop />
        <Ridgeline className="absolute inset-x-0 bottom-0 -z-10 h-80 w-full sm:h-96" />

        <Container className="flex max-w-4xl flex-col items-center pt-16 pb-48 text-center sm:pt-24">
          {/* The brand moment: the pin drops, lands, and pings (spec 0010). */}
          <div className="animate-pin-drop relative" aria-hidden="true">
            <PeakPinMark
              size={120}
              decorative
              className="text-forest drop-shadow-md"
            />
            <span className="animate-pin-ping border-amber absolute bottom-1 left-1/2 h-5 w-24 -translate-x-1/2 rounded-[100%] border-2" />
            <span
              className="animate-pin-ping border-amber absolute bottom-1 left-1/2 h-5 w-24 -translate-x-1/2 rounded-[100%] border"
              style={{ animationDelay: "1.15s" }}
            />
          </div>
          <p
            className="eyebrow animate-rise mt-7 text-amber-700"
            style={{ animationDelay: "80ms" }}
          >
            Est. 2026 · The Volunteer State
          </p>
          <h1
            className="display text-forest animate-rise mt-4 text-5xl sm:text-7xl"
            style={{ animationDelay: "140ms" }}
          >
            Tennessee
            <br />
            Hiking Club
          </h1>
          <p
            className="text-ink/75 animate-rise mt-6 max-w-xl text-lg leading-relaxed sm:text-xl"
            style={{ animationDelay: "220ms" }}
          >
            Discover the Volunteer State&rsquo;s best trails on an interactive
            map: photos, coordinates, and one-tap directions straight to the
            trailhead.
          </p>
          <div
            className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "300ms" }}
          >
            <Link href="/explore" className={buttonVariants({ size: "lg" })}>
              Explore the map
            </Link>
            <Link
              href="/trails"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Browse trails
            </Link>
          </div>
        </Container>
      </section>

      {/* -------------------------- MISSION ----------------------------- */}
      <section className="night-panel bg-forest text-cream">
        <TaglineMarquee />
        <Container className="grid gap-10 py-16 sm:grid-cols-3 sm:py-20">
          <Value
            title="Explore"
            icon={
              <IconWrap>
                <circle cx="12" cy="12" r="9" />
                <path d="M15.5 8.5l-2.2 5.3-5.3 2.2 2.2-5.3z" />
              </IconWrap>
            }
          >
            From the Smokies to the Cumberland Plateau, find trails worth the
            drive: searchable, mapped, and photographed.
          </Value>
          <Value
            title="Connect"
            icon={
              <IconWrap>
                <circle cx="9" cy="8" r="3" />
                <path d="M3.5 19.5c0-3 2.4-5 5.5-5s5.5 2 5.5 5" />
                <path d="M16 6.5a2.8 2.8 0 0 1 0 5.5" />
                <path d="M20.5 19.5c0-2.2-1.3-3.9-3.5-4.6" />
              </IconWrap>
            }
          >
            A club for everyone who loves Tennessee on foot: share favorites and
            help build the most complete trail map in the state.
          </Value>
          <Value
            title="Protect"
            icon={
              <IconWrap>
                <path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z" />
                <path d="M5.5 18.5C9.5 14.5 13 12.5 17 10.5" />
              </IconWrap>
            }
          >
            We hike responsibly and teach Leave No Trace, so the trails we love
            stay wild for the next boots on the path.
          </Value>
        </Container>
      </section>

      {/* -------------------------- FEATURES ---------------------------- */}
      <section>
        <Container className="py-20 sm:py-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-amber-700">What you can do</p>
            <h2 className="display text-forest mt-3 text-3xl sm:text-4xl">
              Everything you need to find your next trail
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              title="Interactive Tennessee map"
              icon={
                <IconWrap>
                  <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
                  <circle cx="12" cy="11" r="2.2" />
                </IconWrap>
              }
            >
              A stylized, clickable map of the state. Tap a pin to open a trail.
            </FeatureCard>
            <FeatureCard
              title="Photos & trail details"
              icon={
                <IconWrap>
                  <path d="M4 8h3l1.8-2h6.4L17 8h3v11H4z" />
                  <circle cx="12" cy="13" r="3.4" />
                </IconWrap>
              }
            >
              Distance, elevation, difficulty, and a gallery for every trail.
            </FeatureCard>
            <FeatureCard
              title="One-tap directions"
              icon={
                <IconWrap>
                  <path d="M12 2.5l8.5 18-8.5-3.8-8.5 3.8z" />
                </IconWrap>
              }
            >
              Jump straight to Google Maps for turn-by-turn to the trailhead.
            </FeatureCard>
            <FeatureCard
              soon
              title="Club merch"
              icon={
                <IconWrap>
                  <path d="M8 4l4 2 4-2 4 3-2.5 2.6V20H6.5V9.6L4 7z" />
                </IconWrap>
              }
            >
              Tees, stickers, and hats. Coming soon to help fund the project.
            </FeatureCard>
          </div>
        </Container>
      </section>

      {/* --------------------------- REGIONS ---------------------------- */}
      <section className="bg-parchment/60 border-forest/10 border-y">
        <Container className="py-20 sm:py-24">
          <Reveal className="max-w-2xl">
            <p className="eyebrow text-amber-700">Three Tennessees</p>
            <h2 className="display text-forest mt-3 text-3xl sm:text-4xl">
              One state, three very different hikes
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <RegionCard region="East" title="Mountains & mist">
              The Great Smokies and Blue Ridge: high balds, waterfalls, and the
              highest peaks east of the Mississippi.
            </RegionCard>
            <RegionCard region="Middle" title="Plateau & gorges">
              The Cumberland Plateau and Highland Rim: deep gorges, sandstone
              arches, and the state&rsquo;s most dramatic waterfalls.
            </RegionCard>
            <RegionCard region="West" title="Rivers & bottomlands">
              Bottomland forests and bluffs along the Mississippi: quiet, flat,
              and full of birdsong.
            </RegionCard>
          </div>
        </Container>
      </section>

      {/* ----------------------- FEATURED TRAILS ------------------------ */}
      <section>
        <Container className="py-20 sm:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow text-amber-700">Featured trails</p>
              <h2 className="display text-forest mt-3 text-3xl sm:text-4xl">
                Start with a few favorites
              </h2>
            </div>
            <Link
              href="/trails"
              className={buttonVariants({ variant: "outline" })}
            >
              Browse all trails
            </Link>
          </Reveal>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((trail, i) => (
              <li key={trail.slug}>
                <Reveal delay={(i % 3) * 110} className="h-full">
                  <TrailCard trail={trail} />
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ------------------------- CONTRIBUTE --------------------------- */}
      <section className="night-panel bg-forest text-cream">
        <Container className="flex max-w-4xl flex-col items-center py-20 text-center sm:py-24">
          <h2 className="display text-cream text-3xl sm:text-4xl">
            Help map the Volunteer State
          </h2>
          <p className="text-cream/75 mt-4 max-w-xl text-lg leading-relaxed">
            This is an open-source, community project. Know a trail we&rsquo;re
            missing? Add it. Every contribution makes the map better.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contribute"
              className={buttonVariants({ variant: "accent", size: "lg" })}
            >
              Contribute a trail
            </Link>
            <Link
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-cream/30 text-cream hover:bg-cream/10",
              )}
            >
              Star on GitHub
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

/* ------------------------------ helpers ----------------------------- */

/** The tagline as a slow trail-marker marquee (spec 0010). Decorative: the
 *  moving track is hidden from assistive tech; a static sr-only line carries
 *  the words. Pauses on hover; freezes entirely under reduced motion. */
function TaglineMarquee() {
  const items = Array.from({ length: 4 });
  return (
    <div className="marquee border-cream/10 border-b py-3.5">
      <span className="sr-only">Explore Tennessee together</span>
      <div className="marquee-track" aria-hidden="true">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {items.map((_, i) => (
              <span
                key={i}
                className="text-cream/80 flex items-center gap-10 pr-10 text-xs font-semibold tracking-[0.32em] uppercase"
              >
                Explore Tennessee Together
                <PeakPinMark size={14} decorative className="text-amber" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Value({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
      <div className="text-amber mb-4">{icon}</div>
      <h3 className="display text-cream text-2xl">{title}</h3>
      <p className="text-cream/70 mt-2 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function FeatureCard({
  title,
  icon,
  children,
  soon = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  soon?: boolean;
}) {
  return (
    <Card interactive className="relative h-full">
      {soon ? <Badge className="absolute top-4 right-4">Soon</Badge> : null}
      <div className="text-pine">{icon}</div>
      <h3 className="display text-forest mt-4 text-xl">{title}</h3>
      <p className="text-ink/65 mt-2 text-sm leading-relaxed">{children}</p>
    </Card>
  );
}

function RegionCard({
  region,
  title,
  children,
}: {
  region: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-7">
      <span className="eyebrow text-olive">{region} Tennessee</span>
      <h3 className="display text-forest mt-2 text-2xl">{title}</h3>
      <p className="text-ink/65 mt-3 text-sm leading-relaxed">{children}</p>
    </Card>
  );
}
