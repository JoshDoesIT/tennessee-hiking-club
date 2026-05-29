import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/auth/admin-server";
import { getDb } from "@/lib/db";
import { conditionSubmissions, trailSubmissions } from "@/lib/db/schema";
import { publishOnApproval } from "@/lib/contributions/publish";

type Context = { params: Promise<{ id: string }> };

/**
 * Review a contribution submission (#146, #149): a maintainer approves or
 * rejects a pending proposal. `type` selects the queue ("trail" by default, or
 * "condition"). Gated by `isAdminUser`. Approval records the decision and earns
 * the submitter recognition; publishing the content stays a curated step the
 * maintainer performs separately.
 */
export async function POST(req: Request, { params }: Context) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: { action?: unknown; type?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { action, type = "trail" } = body;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (type !== "trail" && type !== "condition") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const reviewedAt = new Date();
  const { id } = await params;
  const db = getDb();

  if (type === "condition") {
    await db
      .update(conditionSubmissions)
      .set({ reviewStatus: status, reviewedAt })
      .where(eq(conditionSubmissions.id, id));
  } else {
    await db
      .update(trailSubmissions)
      .set({ status, reviewedAt })
      .where(eq(trailSubmissions.id, id));
  }

  // On approval, try to open a content PR (#155). The decision and recognition
  // are already recorded above, so a GitHub failure (or no token) just falls
  // back to the manual content in the admin UI.
  let prUrl: string | null = null;
  if (action === "approve") {
    try {
      const published = await publishOnApproval({ type, id });
      prUrl = published?.url ?? null;
    } catch {
      prUrl = null;
    }
  }

  return NextResponse.json({ ok: true, status, prUrl });
}
