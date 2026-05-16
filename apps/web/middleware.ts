import { type NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "sw_sid";
const MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Ensures every request has an `sw_sid` cookie before it reaches a Server
 * Component or Route Handler. Server Components cannot mutate cookies, so we
 * do that here. DB lookup + wallet creation still happens server-side.
 */
export function middleware(req: NextRequest): NextResponse {
  if (req.cookies.has(COOKIE_NAME)) return NextResponse.next();

  const id = crypto.randomUUID().replace(/-/g, "");
  const headers = new Headers(req.headers);
  const existing = headers.get("cookie");
  headers.set(
    "cookie",
    existing ? `${existing}; ${COOKIE_NAME}=${id}` : `${COOKIE_NAME}=${id}`,
  );
  const res = NextResponse.next({ request: { headers } });
  res.cookies.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon).*)"],
};
