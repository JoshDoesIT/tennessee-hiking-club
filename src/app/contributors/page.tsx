import { pageMetadata } from "@/lib/page-metadata";
import { Container } from "@/components/ui/container";
import { getAllTrails } from "@/lib/trails";
import { aggregateContributions } from "@/lib/trails/contributions";

export const metadata = pageMetadata({
  title: "Contributors",
  description:
    "The people who help map Tennessee, with trails, condition reports, and photos.",
  path: "/contributors",
});

export default function ContributorsPage() {
  const rows = [...aggregateContributions(getAllTrails()).entries()]
    .map(([handle, counts]) => ({ handle, ...counts }))
    .sort((a, b) => b.total - a.total || a.handle.localeCompare(b.handle));

  return (
    <Container className="max-w-2xl py-16 sm:py-20">
      <p className="eyebrow text-amber-700">Community</p>
      <h1 className="display text-forest mt-3 text-4xl">Contributors</h1>
      <p className="text-ink/75 mt-4 leading-relaxed">
        Tennessee Hiking Club is built in the open. Thanks to everyone who adds
        trails, reports conditions, and shares photos. Recognition is earned:
        contribute on GitHub (and sign in that way to be matched) and you show
        up here.
      </p>

      {rows.length === 0 ? (
        <p className="text-ink/70 mt-8">
          No contributions are credited yet. Add a trail to be the first.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-forest/10">
          {rows.map((r) => (
            <li
              key={r.handle}
              className="flex items-baseline justify-between gap-3 py-3"
            >
              <span className="text-pine font-medium">@{r.handle}</span>
              <span className="text-ink/70 text-sm">
                {r.trailsContributed > 0 ? `${r.trailsContributed} trails` : null}
                {r.trailsContributed > 0 && r.conditionsReported > 0 ? " · " : ""}
                {r.conditionsReported > 0
                  ? `${r.conditionsReported} reports`
                  : null}
                {(r.trailsContributed > 0 || r.conditionsReported > 0) &&
                r.photoCredits > 0
                  ? " · "
                  : ""}
                {r.photoCredits > 0 ? `${r.photoCredits} photos` : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
