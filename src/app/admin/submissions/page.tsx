import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/page-metadata";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/auth/admin-server";
import { getDb } from "@/lib/db";
import { profiles, trailSubmissions } from "@/lib/db/schema";
import {
  SubmissionReviewList,
  type PendingSubmission,
} from "@/components/admin/submission-review-list";

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
  const nameById = new Map(
    profileRows.map((p) => [p.userId, p.displayName || p.githubLogin || null]),
  );

  return rows.map((r) => ({
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
    submittedBy: nameById.get(r.userId) || "A member",
    submittedOn: r.createdAt.toISOString().slice(0, 10),
  }));
}

export default async function AdminSubmissionsPage() {
  // No role system: the page only exists for configured maintainers, and is a
  // 404 for everyone else (it does not reveal that it exists).
  if (!process.env.DATABASE_URL) notFound();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !(await isAdminUser(userId))) notFound();

  const pending = await loadPending();

  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <p className="eyebrow text-amber-700">Maintainers</p>
      <h1 className="display text-forest mt-3 text-4xl sm:text-5xl">
        Review submissions
      </h1>
      <p className="text-ink/70 mt-4 leading-relaxed">
        Member-submitted trails awaiting review. Approving credits the submitter;
        add the trail content file to publish it.
      </p>
      <SubmissionReviewList submissions={pending} />
    </Container>
  );
}
