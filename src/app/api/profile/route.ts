import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/** The signed-in user's leaderboard profile (opt-in flag + display name). */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return NextResponse.json({
    isPublic: row?.isPublic ?? false,
    displayName: row?.displayName ?? "",
  });
}

const bodySchema = z.object({
  isPublic: z.boolean(),
  displayName: z.string().max(50).optional().default(""),
});

/** Update the opt-in flag and display name. Opt-in is explicit and revocable. */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const displayName = body.displayName.trim() || null;
  const db = getDb();
  await db
    .insert(profiles)
    .values({ userId, isPublic: body.isPublic, displayName })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { isPublic: body.isPublic, displayName },
    });

  return NextResponse.json({
    ok: true,
    isPublic: body.isPublic,
    displayName: displayName ?? "",
  });
}
