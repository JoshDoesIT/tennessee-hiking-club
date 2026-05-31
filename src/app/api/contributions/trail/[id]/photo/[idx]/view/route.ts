import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/auth/admin-server";
import { getDb } from "@/lib/db";
import { trailSubmissions } from "@/lib/db/schema";

type Context = { params: Promise<{ id: string; idx: string }> };

/**
 * Stream a photo attached to a pending new-trail proposal (#29), for review.
 * Gated to maintainers so the private Blob image can be previewed in the admin
 * queue without making it public. 404 once storage is unconfigured, the row is
 * gone, or the index is out of range.
 */
export async function GET(_req: Request, { params }: Context) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!(await isAdminUser(userId))) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id, idx } = await params;
  const db = getDb();
  const [row] = await db
    .select({ photoUrls: trailSubmissions.photoUrls })
    .from(trailSubmissions)
    .where(eq(trailSubmissions.id, id))
    .limit(1);

  const url = row?.photoUrls?.[Number(idx)];
  if (!url) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pathname = new URL(url).pathname.replace(/^\//, "");
  const blob = await get(pathname, { access: "private" });
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new Response(blob.stream, {
    status: 200,
    headers: {
      "content-type": blob.blob.contentType ?? "application/octet-stream",
    },
  });
}
