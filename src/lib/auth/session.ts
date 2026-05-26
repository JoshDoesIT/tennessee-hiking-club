import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "./session-token";

const SESSION_COOKIE = "thc_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type Session = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  accessToken: string;
};

/** The signed-in user for display (everything except the access token). */
export type SessionUser = Omit<Session, "accessToken">;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return value;
}

export async function setSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(session, secret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken<Session>(token, secret());
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  return {
    sub: session.sub,
    name: session.name,
    email: session.email,
    picture: session.picture,
  };
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
}
