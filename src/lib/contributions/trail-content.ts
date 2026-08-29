import matter from "gray-matter";
import { trailSchema } from "@/lib/trails/schema";

/**
 * Bridge an approved in-app submission (#146) to publishable trail content
 * (#150). Pure: produces the `content/trails/<slug>.md` text from a submission,
 * validated against `trailSchema`, so a maintainer can commit it instead of
 * hand-copying fields. Publishing stays a reviewed step: this generates the
 * file, it never writes to the repo.
 */
export type TrailSubmissionContent = {
  name: string;
  region: string;
  area: string;
  lat: number;
  lng: number;
  description: string;
  lengthMiles?: number | null;
  elevationGainFt?: number | null;
  difficulty?: string | null;
  routeType?: string | null;
  links?: string | null;
  /** Handle (GitHub login or display name) credited in `contributors[]`. */
  submitterHandle?: string | null;
};

export type GeneratedTrailFile = {
  slug: string;
  fileName: string;
  markdown: string;
  /** Whether the generated front-matter satisfies `trailSchema`. */
  valid: boolean;
  /** Required fields the submission did not provide, for the maintainer to fill. */
  missing: string[];
};

/** kebab-case a name to a slug (matches the schema's SLUG_PATTERN). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A slug for `name` not already in `existing`, suffixing `-2`, `-3`, ... */
export function uniqueSlug(name: string, existing: Iterable<string>): string {
  const taken = new Set(existing);
  const base = slugify(name);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function generateTrailContent(
  submission: TrailSubmissionContent,
  existingSlugs: Iterable<string>,
): GeneratedTrailFile {
  const slug = uniqueSlug(submission.name, existingSlugs);

  // Map the submission to trail front-matter. Optional fields are included only
  // when present; the schema requires them, so a partial submission produces an
  // invalid file with a `missing` list rather than silently bad content.
  const data: Record<string, unknown> = {
    slug,
    name: submission.name,
    region: submission.region,
    area: submission.area,
    coordinates: { lat: submission.lat, lng: submission.lng },
    summary: submission.description,
  };
  if (submission.lengthMiles != null) data.lengthMiles = submission.lengthMiles;
  if (submission.elevationGainFt != null)
    data.elevationGainFt = submission.elevationGainFt;
  if (submission.difficulty) data.difficulty = submission.difficulty;
  if (submission.routeType) data.routeType = submission.routeType;
  if (submission.submitterHandle?.trim()) {
    data.contributors = [submission.submitterHandle.trim()];
  }
  if (submission.links && /^https?:\/\//i.test(submission.links.trim())) {
    data.externalLinks = [
      { label: "More information", url: submission.links.trim() },
    ];
  }

  const markdown = matter.stringify(`\n${submission.description}\n`, data);

  const parsed = trailSchema.safeParse({
    ...data,
    body: submission.description,
  });
  const missing = parsed.success
    ? []
    : [
        ...new Set(
          parsed.error.issues.map((issue) =>
            issue.path.length ? String(issue.path[0]) : "(root)",
          ),
        ),
      ];

  return {
    slug,
    fileName: `${slug}.md`,
    markdown,
    valid: parsed.success,
    missing,
  };
}
