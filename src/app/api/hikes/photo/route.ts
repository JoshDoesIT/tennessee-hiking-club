import { NextResponse } from "next/server";
import { put, del, get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { hikes } from "@/lib/db/schema";

/** Pathname (no leading slash) of a blob URL, or null if not a valid URL. */
function blobPathname(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

/**
 * Upload a hike photo to Vercel Blob for the signed-in user and return its URL,
 * which the client then syncs onto the hike via /api/hikes/sync. Best-effort,
 * like the rest of sync: if no Blob store is configured the photo stays local
 * (IndexedDB) and we return a null url rather than failing.
 */
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (
    !(file instanceof Blob) ||
    file.size === 0 ||
    !file.type.startsWith("image/")
  ) {
    return NextResponse.json(
      { error: "Expected an image file" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 });
  }

  // No Blob store configured: stay local-only, don't fail the client.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ url: null });
  }

  const { url } = await put(
    `hikes/${userId}/${crypto.randomUUID()}.jpg`,
    file,
    {
      access: "private",
      contentType: "image/jpeg",
    },
  );
  return NextResponse.json({ url });
}

/**
 * Delete a hike photo from Vercel Blob when its hike is removed, and clear any
 * dangling reference on the user's hikes. Only blobs in the caller's own
 * namespace can be deleted. Best-effort: a no-token environment is a no-op.
 */
export async function DELETE(req: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let url: unknown;
  try {
    url = (await req.json())?.url;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  if (typeof url !== "string" || !url) {
    return NextResponse.json({ error: "Expected a url" }, { status: 400 });
  }

  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  // Only delete blobs the caller owns (namespaced by user id).
  if (!pathname.startsWith(`/hikes/${userId}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ ok: true });
  }

  await del(url);
  try {
    await getDb()
      .update(hikes)
      .set({ photoUrl: null })
      .where(and(eq(hikes.userId, userId), eq(hikes.photoUrl, url)));
  } catch {
    // Best effort: the row clears on a later sync if this fails.
  }
  return NextResponse.json({ ok: true });
}

/**
 * Stream a private hike photo to its owner. Photos are stored privately, so
 * they can't be embedded by URL directly; this proxy authenticates the viewer,
 * confirms the blob is in their namespace, and streams it back.
 */
export async function GET(req: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const u = new URL(req.url).searchParams.get("u");
  if (!u) {
    return NextResponse.json({ error: "Missing u" }, { status: 400 });
  }
  const pathname = blobPathname(u);
  if (!pathname) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!pathname.startsWith(`hikes/${userId}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = await get(pathname, { access: "private" });
  if (result?.statusCode !== 200) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
