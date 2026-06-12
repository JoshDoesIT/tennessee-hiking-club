import { eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { getDb } from "@/lib/db";
import {
  conditionSubmissions,
  photoSubmissions,
  profiles,
  trailSubmissions,
} from "@/lib/db/schema";
import { getAllTrails } from "@/lib/trails";
import { generateTrailContent } from "./trail-content";
import { appendConditionReport } from "./condition";
import { appendPhoto } from "./photo";
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

async function loadSubmitter(
  db: ReturnType<typeof getDb>,
  userId: string,
): Promise<{ handle: string | null; githubLogin: string | null }> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  const githubLogin = row?.githubLogin ?? null;
  return { handle: githubLogin || row?.displayName || null, githubLogin };
}

export async function publishOnApproval({
  type,
  id,
}: {
  type: "trail" | "condition" | "photo";
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
    const submitter = await loadSubmitter(db, row.userId);
    const slugs = new Set(getAllTrails().map((t) => t.slug));
    const pub = trailPublication(row, submitter.handle, slugs);
    if (!pub.ok) return null;
    const result = await openFilePullRequest(api, {
      base: config.baseBranch,
      ...pub,
    });
    // The published content will credit a GitHub-login submitter by login, so
    // stop counting the submission to avoid double recognition (#153).
    if (submitter.githubLogin) {
      await db
        .update(trailSubmissions)
        .set({ status: "published" })
        .where(eq(trailSubmissions.id, id));
    }
    return result;
  }

  if (type === "condition") {
    const [row] = await db
      .select()
      .from(conditionSubmissions)
      .where(eq(conditionSubmissions.id, id))
      .limit(1);
    if (!row) return null;
    const submitter = await loadSubmitter(db, row.userId);
    const path = `content/trails/${row.trailSlug}.md`;
    const file = await api.getFile(path, config.baseBranch);
    if (!file) return null;
    const pub = conditionPublication(row, submitter.handle, file.content);
    const result = await openFilePullRequest(api, {
      base: config.baseBranch,
      ...pub,
      sha: file.sha,
    });
    if (submitter.githubLogin) {
      await db
        .update(conditionSubmissions)
        .set({ reviewStatus: "published" })
        .where(eq(conditionSubmissions.id, id));
    }
    return result;
  }

  // photo: commit the image and the photos[] entry on one branch, then open a
  // PR (#157). Two files, so it does not reuse the single-file helper.
  const [row] = await db
    .select()
    .from(photoSubmissions)
    .where(eq(photoSubmissions.id, id))
    .limit(1);
  if (!row) return null;
  const submitter = await loadSubmitter(db, row.userId);

  const image = await get(new URL(row.blobUrl).pathname.replace(/^\//, ""), {
    access: "private",
  });
  if (!image) return null;
  const base64 = Buffer.from(
    await new Response(image.stream).arrayBuffer(),
  ).toString("base64");
  const ext = (image.blob.contentType?.split("/")[1] || "jpg").replace(
    "jpeg",
    "jpg",
  );

  const idShort = String(row.id).slice(0, 8);
  const imagePath = `public/trails/contributed/${row.trailSlug}-${idShort}.${ext}`;
  const src = `/trails/contributed/${row.trailSlug}-${idShort}.${ext}`;
  const contentPath = `content/trails/${row.trailSlug}.md`;
  const branch = `submission/photo-${row.trailSlug}-${idShort}`;
  const message = `content: add photo for ${row.trailSlug}`;

  const baseSha = await api.getBranchSha(config.baseBranch);
  await api.createBranch(branch, baseSha);
  await api.putBinaryFile({ path: imagePath, base64, message, branch });

  const file = await api.getFile(contentPath, config.baseBranch);
  if (!file) return null;
  const updated = appendPhoto(file.content, {
    src,
    alt: row.alt,
    credit: row.credit,
    by: submitter.handle,
  });
  await api.putFile({
    path: contentPath,
    content: updated,
    message,
    branch,
    sha: file.sha,
  });

  const result = await api.openPullRequest({
    title: `Photo: ${row.trailSlug}`,
    body: `Adds an approved in-app photo for ${row.trailSlug}.`,
    head: branch,
    base: config.baseBranch,
  });
  if (submitter.githubLogin) {
    await db
      .update(photoSubmissions)
      .set({ reviewStatus: "published" })
      .where(eq(photoSubmissions.id, id));
  }
  return result;
}
