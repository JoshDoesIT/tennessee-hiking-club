import { NextResponse, type NextRequest } from "next/server";
import {
  isAllowedOrigin,
  corsHeaders,
  bearerToken,
  withSessionCookie,
} from "@/lib/auth/native-cors";

/**
 * Serves the API to the local app bundle (spec 0009, phase 4). For requests from
 * the Capacitor origins it answers CORS preflight and adds CORS headers, and it
 * translates an `Authorization: Bearer <session>` token into the Auth.js session
 * cookie so `auth()` and every route validate it unchanged. Same-origin (web)
 * requests are untouched. Runs only on the production server build; the static
 * export excludes it (scripts/build-capacitor.mjs).
 *
 * `proxy` is this Next version's renamed `middleware` convention.
 */
export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");

  // CORS preflight for the local app origins.
  if (request.method === "OPTIONS") {
    return isAllowedOrigin(origin)
      ? new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
      : NextResponse.next();
  }

  // Carry a bearer session token into the cookie that auth() reads.
  const token = bearerToken(request.headers.get("authorization"));
  const requestHeaders = new Headers(request.headers);
  if (token) {
    requestHeaders.set(
      "cookie",
      withSessionCookie(request.headers.get("cookie"), token),
    );
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (isAllowedOrigin(origin)) {
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      response.headers.set(key, value);
    }
  }
  return response;
}

export const config = { matcher: "/api/:path*" };
