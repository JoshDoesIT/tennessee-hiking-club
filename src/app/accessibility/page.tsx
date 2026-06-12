import { pageMetadata } from "@/lib/page-metadata";
import { Container } from "@/components/ui/container";

const REPO = "https://github.com/JoshDoesIT/tennessee-hiking-club";
const LAST_REVIEWED = "May 28, 2026";

export const metadata = pageMetadata({
  title: "Accessibility",
  description:
    "Our accessibility commitment, the features in place, known limitations, and how to report a problem.",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <Container className="max-w-2xl py-16 sm:py-20">
      <p className="eyebrow text-amber-700">For everyone</p>
      <h1 className="display text-forest mt-3 text-4xl">Accessibility</h1>
      <p className="text-ink/75 mt-4 leading-relaxed">
        We want everyone to be able to find a trail. We aim to meet{" "}
        <strong>WCAG 2.2 AA</strong>, and we test as we build. This is our
        current self-assessment, not a formal audit, and we keep improving it.
      </p>

      <div className="text-ink/80 mt-10 space-y-8 leading-relaxed">
        <section>
          <h2 className="display text-forest text-2xl">What is in place</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Full keyboard navigation, with visible focus and skip links.</li>
            <li>
              Screen reader support, including keyboard and screen-reader access
              for the interactive map.
            </li>
            <li>
              Text alternatives for visual content: an elevation summary beside
              each chart, text labels (not colour alone) for trail conditions,
              and meaningful image descriptions.
            </li>
            <li>Reduced-motion support and a responsive, zoomable layout.</li>
            <li>Colour choices checked for AA contrast.</li>
          </ul>
        </section>

        <section>
          <h2 className="display text-forest text-2xl">Known limitations</h2>
          <p className="mt-3">
            The interactive trail map and the stylized state map are inherently
            visual. Wherever we use a map we also provide a non-visual path: the
            full trail list, direct &ldquo;directions&rdquo; links, the trailhead
            and parking coordinates, and the elevation summary. If any of these
            fall short for you, we want to know.
          </p>
        </section>

        <section>
          <h2 className="display text-forest text-2xl">Report a problem</h2>
          <p className="mt-3">
            Hit a barrier? Please{" "}
            <a
              href={`${REPO}/issues/new/choose`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pine hover:text-forest underline underline-offset-4"
            >
              report an accessibility issue on GitHub
            </a>
            . Tell us the page and what got in your way, and we will prioritise
            a fix.
          </p>
        </section>

        <p className="text-ink/55 text-sm">Last reviewed {LAST_REVIEWED}.</p>
      </div>
    </Container>
  );
}
