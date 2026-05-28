import { pageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata = pageMetadata({
  title: "Contribute a trail",
  description:
    "Help build Tennessee's most complete community trail map: contribute a trail.",
  path: "/contribute",
});

const REPO = "https://github.com/JoshDoesIT/tennessee-hiking-club";
const NEW_TRAIL_ISSUE = `${REPO}/issues/new?template=new_trail.yml`;
const CONTRIBUTING = `${REPO}/blob/main/CONTRIBUTING.md`;

export default function ContributePage() {
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Open source</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Add a trail to the map
      </h1>
      <p className="text-ink/75 mt-4 text-lg leading-relaxed">
        The Tennessee Hiking Club is built by the people who hike it. Every
        trail lives as a small, reviewed file in our open-source repository, so
        anyone can add a favorite. Know a trail we are missing? Here are two
        ways to put it on the map.
      </p>

      <section className="border-forest/10 bg-cream-50 mt-10 rounded-2xl border p-6">
        <p className="eyebrow text-olive">Quickest</p>
        <h2 className="display text-forest mt-2 text-2xl">Suggest a trail</h2>
        <p className="text-ink/75 mt-2 leading-relaxed">
          Fill in the New Trail form with the name, region, and a rough
          location, and a maintainer will take it from there. No git required.
        </p>
        <Link
          href={NEW_TRAIL_ISSUE}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "accent" }), "mt-4")}
        >
          Open the new-trail form
        </Link>
      </section>

      <section className="mt-8">
        <p className="eyebrow text-olive">For contributors</p>
        <h2 className="display text-forest mt-2 text-2xl">
          Open a pull request
        </h2>
        <p className="text-ink/75 mt-2 leading-relaxed">
          Comfortable with git? Add the trail yourself and get credited as a
          contributor:
        </p>
        <ol className="text-ink/80 mt-4 list-decimal space-y-2 pl-5 leading-relaxed">
          <li>Fork the repository and create a branch.</li>
          <li>
            Add a Markdown file in <code>content/trails/</code> with the trail
            front-matter: name, region, coordinates, length, difficulty, a
            photo, and a short summary.
          </li>
          <li>
            Run <code>pnpm validate:content</code> to check it against the
            schema.
          </li>
          <li>
            Open a pull request. CI validates the data and a maintainer reviews
            it.
          </li>
        </ol>
        <Link
          href={CONTRIBUTING}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
        >
          Read the contributing guide
        </Link>
      </section>

      <p className="text-ink/70 mt-10 text-sm leading-relaxed">
        Please hike responsibly and practice Leave No Trace. Only add trails
        that are open to the public, and leave fragile or sensitive spots off
        the map.
      </p>
    </Container>
  );
}
