import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button, buttonVariants } from "@/components/ui/button";
import { TrailCard } from "@/components/trails/trail-card";
import { cn } from "@/lib/cn";
import { getAllTrails } from "@/lib/trails";
import { REGIONS, DIFFICULTIES } from "@/lib/trails/schema";
import {
  filterTrails,
  parseTrailFilters,
  LENGTH_BUCKETS,
  type LengthBucket,
} from "@/lib/trails/filter";

export const metadata: Metadata = {
  title: "Trails",
  description:
    "Browse Tennessee hiking trails by region, difficulty, and length.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function TrailsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters = parseTrailFilters(params);
  const allTrails = getAllTrails();
  const trails = filterTrails(allTrails, filters);
  const isFiltered = Boolean(
    filters.region ||
      filters.difficulty ||
      filters.length ||
      filters.query ||
      filters.dogFriendly,
  );

  return (
    <Container className="py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Trail directory</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Every trail, in one place
      </h1>
      <p className="text-ink/70 mt-4 max-w-xl text-lg leading-relaxed">
        Filter by region, difficulty, and length, then open a trail for photos,
        stats, and one-tap directions.
      </p>

      {/* GET form: the active filters live in the URL (shareable) and the list
          is rendered on the server, so it works with JavaScript disabled. */}
      <form
        method="get"
        className="border-forest/10 bg-cream-50 mt-8 grid gap-4 rounded-2xl border p-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end"
      >
        <div className="flex flex-col gap-1.5 sm:col-span-full">
          <label htmlFor="q" className="text-forest text-sm font-medium">
            Search by name
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.query ?? ""}
            placeholder="e.g. Falls, LeConte, Reelfoot"
            className="border-forest/20 bg-cream text-ink rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <label className="text-forest flex items-center gap-2 text-sm font-medium sm:col-span-full">
          <input
            type="checkbox"
            name="dog"
            value="1"
            defaultChecked={filters.dogFriendly ?? false}
            className="accent-forest h-4 w-4"
          />
          Dog-friendly only
        </label>
        <Field id="region" label="Region" defaultValue={filters.region ?? ""}>
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r} Tennessee
            </option>
          ))}
        </Field>
        <Field
          id="difficulty"
          label="Difficulty"
          defaultValue={filters.difficulty ?? ""}
        >
          <option value="">Any difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {titleCase(d)}
            </option>
          ))}
        </Field>
        <Field id="length" label="Length" defaultValue={filters.length ?? ""}>
          <option value="">Any length</option>
          {(Object.keys(LENGTH_BUCKETS) as LengthBucket[]).map((k) => (
            <option key={k} value={k}>
              {LENGTH_BUCKETS[k].label}
            </option>
          ))}
        </Field>
        <div className="flex gap-2">
          <Button type="submit">Apply filters</Button>
          {isFiltered ? (
            <Link
              href="/trails"
              className={buttonVariants({ variant: "ghost" })}
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <section aria-label="Trail results" className="mt-8">
        <p className="text-ink/70 text-sm">
          {isFiltered
            ? `Showing ${trails.length} of ${allTrails.length} trails`
            : `${allTrails.length} trails`}
        </p>

        {trails.length === 0 ? (
          <div className="border-forest/15 mt-4 rounded-2xl border border-dashed p-10 text-center">
            <p className="text-forest font-medium">
              No trails match those filters.
            </p>
            <p className="text-ink/70 mt-1 text-sm">
              Try widening your search.
            </p>
            <Link
              href="/trails"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4",
              )}
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trails.map((trail) => (
              <li key={trail.slug}>
                <TrailCard trail={trail} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}

function Field({
  id,
  label,
  defaultValue,
  children,
}: {
  id: string;
  label: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-forest text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue}
        className="border-forest/20 bg-cream text-ink rounded-lg border px-3 py-2 text-sm"
      >
        {children}
      </select>
    </div>
  );
}
