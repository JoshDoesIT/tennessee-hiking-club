import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/auth/admin-server";
import { getDb } from "@/lib/db";
import { waypointSubmissions } from "@/lib/db/schema";

type Context = { params: Promise<{ id: string }> };

/**
 * Stream a pending waypoint suggestion's photo for review (#191). Gated to
 * maintainers so the private Blob image previews in the admin queue without
 * being made public. Returns 404 when storage is unconfigured, the row is gone,
 * or the suggestion has no photo.
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

  const { id } = await params;
  const db = getDb();
  const [row] = await db
    .select()
    .from(waypointSubmissions)
    .where(eq(waypointSubmissions.id, id))
    .limit(1);
  if (!row || !row.photoUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pathname = new URL(row.photoUrl).pathname.replace(/^\//, "");
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
