import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminUser } from "@/lib/auth/admin-server";
import { getDb } from "@/lib/db";
import { notifyTrailAlert } from "@/lib/push/send";
import { defaultPushSender } from "@/lib/push/transport";

/**
 * Admin-only: send a test push to every registered device (#218). This is the
 * one runtime trigger that exercises the APNs/FCM transport end to end once the
 * provider credentials are set; with no credentials the transport no-ops, so it
 * returns `sent: 0` rather than erroring.
 */
export async function POST() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !(await isAdminUser(userId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await notifyTrailAlert({
    trail: { name: "Tennessee Hiking Club", slug: "" },
    alert: {
      level: "info",
      message: "Test push from the Tennessee Hiking Club app.",
    },
    db: getDb() as unknown as Parameters<typeof notifyTrailAlert>[0]["db"],
    send: defaultPushSender(),
  });

  return NextResponse.json(result);
}
