import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/auth/admin-server";
import { getDb } from "@/lib/db";
import { photoSubmissions } from "@/lib/db/schema";

type Context = { params: Promise<{ id: string }> };

/**
 * Stream a pending contribution photo for review (#149). Gated to maintainers so
 * the private Blob image can be previewed in the admin queue without making it
 * public. Returns 404 once storage is unconfigured or the row is gone.
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
    .from(photoSubmissions)
    .where(eq(photoSubmissions.id, id))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pathname = new URL(row.blobUrl).pathname.replace(/^\//, "");
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
