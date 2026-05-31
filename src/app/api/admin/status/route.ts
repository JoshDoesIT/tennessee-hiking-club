import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/auth/admin-server";

/**
 * Whether the current session is a maintainer, so the nav can show an admin-only
 * link without server-rendering the layout per request. This is UX only: the
 * admin pages enforce access themselves (`isAdminUser`), so a forged `true` here
 * still gets a non-admin nothing.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = userId ? await isAdminUser(userId) : false;
  return NextResponse.json({ isAdmin });
}
