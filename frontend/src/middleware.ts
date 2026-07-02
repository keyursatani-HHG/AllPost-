import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware for route protection.
 *
 * Auth state is derived from the presence of the httpOnly refresh cookie set
 * by the FastAPI backend (`postly_refresh`). Middleware can read httpOnly
 * cookies, so no token is ever exposed to client-side JS.
 */
const AUTH_COOKIE = "postly_refresh";
const PROTECTED = ["/dashboard"];
const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthed = req.cookies.has(AUTH_COOKIE);

  // Guard protected routes.
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Keep authenticated users out of the auth pages.
  if (AUTH_PAGES.some((p) => pathname.startsWith(p)) && isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
