import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";

const registerSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
});
const unregisterSchema = z.object({ token: z.string().min(1) });

/**
 * Register a device for push notifications (#218, spec 0008). A device may
 * subscribe without an account; when the member is signed in we associate the
 * subscription with their user id. The token is unique, so re-registering the
 * same device updates its platform/user/last-seen in place.
 */
export async function POST(req: Request) {
  let body;
  try {
    body = registerSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const db = getDb();
  await db
    .insert(pushSubscriptions)
    .values({ token: body.token, platform: body.platform, userId })
    .onConflictDoUpdate({
      target: pushSubscriptions.token,
      set: { platform: body.platform, userId, lastSeenAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}

/** Opt out: deleting the row is what stops delivery to this device. */
export async function DELETE(req: Request) {
  let body;
  try {
    body = unregisterSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const db = getDb();
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.token, body.token));

  return NextResponse.json({ ok: true });
}
