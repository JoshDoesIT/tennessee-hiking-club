import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/page-metadata";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/auth/admin-server";
import { getDb } from "@/lib/db";
import {
  profiles,
  trailSubmissions,
  conditionSubmissions,
  photoSubmissions,
} from "@/lib/db/schema";
import { getAllTrails } from "@/lib/trails";
import { generateTrailContent } from "@/lib/contributions/trail-content";
import { generateConditionEntry } from "@/lib/contributions/condition";
import {
  SubmissionReviewList,
  type PendingSubmission,
} from "@/components/admin/submission-review-list";
import {
  ConditionReviewList,
  type PendingConditionReport,
} from "@/components/admin/condition-review-list";
import {
  PhotoReviewList,
  type PendingPhoto,
} from "@/components/admin/photo-review-list";

// Gated, request-time only, never indexed.
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Review submissions",
  description: "Maintainer review queue for in-app trail submissions.",
  path: "/admin/submissions",
  noindex: true,
});

async function loadPending(): Promise<PendingSubmission[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(trailSubmissions)
    .where(eq(trailSubmissions.status, "pending"))
    .orderBy(desc(trailSubmissions.createdAt));
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const profileRows = await db
    .select()
    .from(profiles)
    .where(inArray(profiles.userId, userIds));
  const profileById = new Map(profileRows.map((p) => [p.userId, p]));

  // Generate each content file, deduping slugs against published trails and
  // against files generated earlier in this same batch.
  const slugs = new Set(getAllTrails().map((t) => t.slug));

  return rows.map((r) => {
    const profile = profileById.get(r.userId);
    const handle = profile?.githubLogin || profile?.displayName || null;
    const generated = generateTrailContent(
      {
        name: r.name,
        region: r.region,
        area: r.area,
        lat: r.lat,
        lng: r.lng,
        description: r.description,
        lengthMiles: r.lengthMiles,
        elevationGainFt: r.elevationGainFt,
        difficulty: r.difficulty,
        routeType: r.routeType,
        links: r.links,
        submitterHandle: handle,
      },
      slugs,
    );
    slugs.add(generated.slug);

    return {
      id: r.id,
      name: r.name,
      region: r.region,
      area: r.area,
      lat: r.lat,
      lng: r.lng,
      description: r.description,
      lengthMiles: r.lengthMiles,
      elevationGainFt: r.elevationGainFt,
      difficulty: r.difficulty,
      routeType: r.routeType,
      links: r.links,
      photoCount: r.photoUrls?.length ?? 0,
      submittedBy: profile?.displayName || profile?.githubLogin || "A member",
      submittedOn: r.createdAt.toISOString().slice(0, 10),
      generated: {
        fileName: generated.fileName,
        markdown: generated.markdown,
        valid: generated.valid,
        missing: generated.missing,
      },
    };
  });
}

async function loadPendingConditions(): Promise<PendingConditionReport[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(conditionSubmissions)
    .where(eq(conditionSubmissions.reviewStatus, "pending"))
    .orderBy(desc(conditionSubmissions.createdAt));
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const profileRows = await db
    .select()
    .from(profiles)
    .where(inArray(profiles.userId, userIds));
  const profileById = new Map(profileRows.map((p) => [p.userId, p]));
  const nameBySlug = new Map(getAllTrails().map((t) => [t.slug, t.name]));

  return rows.map((r) => {
    const profile = profileById.get(r.userId);
    const handle = profile?.githubLogin || profile?.displayName || null;
    const entry = generateConditionEntry({
      date: r.reportDate,
      status: r.status,
      note: r.note,
      by: handle,
    });
    return {
      id: r.id,
      trailSlug: r.trailSlug,
      trailName: nameBySlug.get(r.trailSlug) || r.trailSlug,
      status: r.status,
      note: r.note,
      reportDate: r.reportDate,
      submittedBy: profile?.displayName || profile?.githubLogin || "A member",
      submittedOn: r.createdAt.toISOString().slice(0, 10),
      entry: { yaml: entry.yaml, valid: entry.valid },
    };
  });
}

async function loadPendingPhotos(): Promise<PendingPhoto[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(photoSubmissions)
    .where(eq(photoSubmissions.reviewStatus, "pending"))
    .orderBy(desc(photoSubmissions.createdAt));
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.userId))];
  const profileRows = await db
    .select()
    .from(profiles)
    .where(inArray(profiles.userId, userIds));
  const profileById = new Map(profileRows.map((p) => [p.userId, p]));
  const nameBySlug = new Map(getAllTrails().map((t) => [t.slug, t.name]));

  return rows.map((r) => {
    const profile = profileById.get(r.userId);
    return {
      id: r.id,
      trailSlug: r.trailSlug,
      trailName: nameBySlug.get(r.trailSlug) || r.trailSlug,
      alt: r.alt,
      credit: r.credit,
      submittedBy: profile?.displayName || profile?.githubLogin || "A member",
      submittedOn: r.createdAt.toISOString().slice(0, 10),
    };
  });
}

export default async function AdminSubmissionsPage() {
  // No role system: the page only exists for configured maintainers, and is a
  // 404 for everyone else (it does not reveal that it exists).
  if (!process.env.DATABASE_URL) notFound();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !(await isAdminUser(userId))) notFound();

  const [pending, pendingConditions, pendingPhotos] = await Promise.all([
    loadPending(),
    loadPendingConditions(),
    loadPendingPhotos(),
  ]);

  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Maintainers</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Review submissions
      </h1>
      <p className="text-ink/70 mt-4 leading-relaxed">
        Member-submitted contributions awaiting review. Approving credits the
        submitter; add the generated content to publish it.
      </p>

      <section aria-labelledby="trail-submissions-heading" className="mt-10">
        <h2
          id="trail-submissions-heading"
          className="display text-forest text-2xl"
        >
          New trails
        </h2>
        <SubmissionReviewList submissions={pending} />
      </section>

      <section aria-labelledby="condition-reports-heading" className="mt-12">
        <h2
          id="condition-reports-heading"
          className="display text-forest text-2xl"
        >
          Condition reports
        </h2>
        <ConditionReviewList reports={pendingConditions} />
      </section>

      <section aria-labelledby="photo-submissions-heading" className="mt-12">
        <h2
          id="photo-submissions-heading"
          className="display text-forest text-2xl"
        >
          Photos
        </h2>
        <PhotoReviewList photos={pendingPhotos} />
      </section>
    </Container>
  );
}
