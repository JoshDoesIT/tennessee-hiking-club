"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { TrailResults } from "./trail-results";
import { cn } from "@/lib/cn";
import { REGIONS, DIFFICULTIES } from "@/lib/trails/schema";
import type { Trail } from "@/lib/trails/schema";
import {
  filterTrails,
  parseTrailFilters,
  LENGTH_BUCKETS,
  type LengthBucket,
} from "@/lib/trails/filter";

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The trail directory's filter form and results, filtered on the device. The
 * active filters live in the URL so results stay shareable, but parsing and
 * filtering run client-side, which lets the page be a static export bundled into
 * the native app (#308, spec 0009). Submitting writes the filters to the URL;
 * the rendered list always derives from the current search params.
 */
export function TrailBrowser({ trails }: { trails: Trail[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = parseTrailFilters(Object.fromEntries(searchParams.entries()));
  const matches = filterTrails(trails, filters);
  const isFiltered = Boolean(
    filters.region ||
      filters.difficulty ||
      filters.length ||
      filters.query ||
      filters.dogFriendly ||
      filters.kidFriendly,
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget).entries()) {
      const v = String(value).trim();
      if (v) next.set(key, v);
    }
    const qs = next.toString();
    router.replace(qs ? `/trails?${qs}` : "/trails", { scroll: false });
  }

  return (
    <>
      {/* GET form: the active filters live in the URL (shareable), and the list
          is filtered on the device so the page can be a static bundle. Keyed on
          the params so the inputs reset when the filters change (e.g. Clear). */}
      <form
        method="get"
        onSubmit={onSubmit}
        key={searchParams.toString()}
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
        <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-full">
          <label className="text-forest flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="dog"
              value="1"
              defaultChecked={filters.dogFriendly ?? false}
              className="accent-forest h-4 w-4"
            />
            Dog-friendly only
          </label>
          <label className="text-forest flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name="kid"
              value="1"
              defaultChecked={filters.kidFriendly ?? false}
              className="accent-forest h-4 w-4"
            />
            Kid-friendly only
          </label>
        </div>
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
            ? `Showing ${matches.length} of ${trails.length} trails`
            : `${trails.length} trails`}
        </p>

        {matches.length === 0 ? (
          <div className="border-forest/15 mt-4 rounded-2xl border border-dashed p-10 text-center">
            <p className="text-forest font-medium">
              No trails match those filters.
            </p>
            <p className="text-ink/70 mt-1 text-sm">Try widening your search.</p>
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
          <TrailResults trails={matches} />
        )}
      </section>
    </>
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
