import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  conditionSubmissions,
  profiles,
  trailSubmissions,
} from "@/lib/db/schema";
import { getAllTrails } from "@/lib/trails";
import { generateTrailContent } from "./trail-content";
import { appendConditionReport } from "./condition";
import {
  githubConfigFromEnv,
  createGithubApi,
  openFilePullRequest,
} from "@/lib/github/content-pr";

/**
 * Open a pull request for an approved in-app submission (#155). The app commits
 * the change on a branch so a maintainer only has to merge it; CI still
 * validates and the merge stays human. Gated by `GITHUB_CONTENT_TOKEN`: with no
 * token configured, `publishOnApproval` returns null and callers fall back to
 * the manual download/paste flow.
 */
type FilePublication = {
  path: string;
  branch: string;
  content: string;
  message: string;
  title: string;
  body: string;
  sha?: string;
};

type TrailRow = {
  id: string;
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
};

type ConditionRow = {
  id: string;
  trailSlug: string;
  status: string;
  note?: string | null;
  reportDate: string;
};

/** Build the PR payload that adds a generated trail file, or report the gaps. */
export function trailPublication(
  row: TrailRow,
  handle: string | null,
  existingSlugs: Iterable<string>,
): (FilePublication & { ok: true }) | { ok: false; missing: string[] } {
  const generated = generateTrailContent(
    {
      name: row.name,
      region: row.region,
      area: row.area,
      lat: row.lat,
      lng: row.lng,
      description: row.description,
      lengthMiles: row.lengthMiles,
      elevationGainFt: row.elevationGainFt,
      difficulty: row.difficulty,
      routeType: row.routeType,
      links: row.links,
      submitterHandle: handle,
    },
    existingSlugs,
  );
  if (!generated.valid) return { ok: false, missing: generated.missing };

  const idShort = String(row.id).slice(0, 8);
  return {
    ok: true,
    path: `content/trails/${generated.slug}.md`,
    branch: `submission/trail-${generated.slug}-${idShort}`,
    content: generated.markdown,
    message: `feat(content): add ${generated.slug}`,
    title: `Add ${row.name}`,
    body: `Adds ${row.name} from an approved in-app submission.`,
  };
}

/** Build the PR payload that appends a report to a trail's existing content. */
export function conditionPublication(
  row: ConditionRow,
  handle: string | null,
  fileContent: string,
): FilePublication {
  const idShort = String(row.id).slice(0, 8);
  return {
    path: `content/trails/${row.trailSlug}.md`,
    branch: `submission/condition-${row.trailSlug}-${idShort}`,
    content: appendConditionReport(fileContent, {
      date: row.reportDate,
      status: row.status,
      note: row.note,
      by: handle,
    }),
    message: `content: condition report for ${row.trailSlug}`,
    title: `Condition report: ${row.trailSlug}`,
    body: `Adds an approved in-app condition report for ${row.trailSlug}.`,
  };
}

async function loadHandle(
  db: ReturnType<typeof getDb>,
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row?.githubLogin || row?.displayName || null;
}

export async function publishOnApproval({
  type,
  id,
}: {
  type: "trail" | "condition";
  id: string;
}): Promise<{ url: string } | null> {
  const config = githubConfigFromEnv();
  if (!config) return null;

  const db = getDb();
  const api = createGithubApi(config);

  if (type === "trail") {
    const [row] = await db
      .select()
      .from(trailSubmissions)
      .where(eq(trailSubmissions.id, id))
      .limit(1);
    if (!row) return null;
    const handle = await loadHandle(db, row.userId);
    const slugs = new Set(getAllTrails().map((t) => t.slug));
    const pub = trailPublication(row, handle, slugs);
    if (!pub.ok) return null;
    return openFilePullRequest(api, { base: config.baseBranch, ...pub });
  }

  const [row] = await db
    .select()
    .from(conditionSubmissions)
    .where(eq(conditionSubmissions.id, id))
    .limit(1);
  if (!row) return null;
  const handle = await loadHandle(db, row.userId);
  const path = `content/trails/${row.trailSlug}.md`;
  const file = await api.getFile(path, config.baseBranch);
  if (!file) return null;
  const pub = conditionPublication(row, handle, file.content);
  return openFilePullRequest(api, {
    base: config.baseBranch,
    ...pub,
    sha: file.sha,
  });
}
