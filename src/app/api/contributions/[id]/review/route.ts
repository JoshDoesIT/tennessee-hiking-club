import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/auth/admin-server";
import { getDb } from "@/lib/db";
import { trailSubmissions } from "@/lib/db/schema";

type Context = { params: Promise<{ id: string }> };

/**
 * Review a trail submission (#146): a maintainer approves or rejects a pending
 * proposal. Gated by `isAdminUser`. Approval records the decision; publishing
 * the trail content stays a curated step the maintainer performs separately.
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

  let action: unknown;
  try {
    action = (await req.json())?.action;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const { id } = await params;
  const db = getDb();
  await db
    .update(trailSubmissions)
    .set({ status, reviewedAt: new Date() })
    .where(eq(trailSubmissions.id, id));

  return NextResponse.json({ ok: true, status });
}
