import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { roleHome } from "@/lib/roles";

/** Routes reachable while logged out. */
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/join"];

/**
 * Exact paths reachable while logged out.
 *
 * The marketing landing page lives at "/", which is not a prefix that can go in
 * the list above — every path starts with "/", so it would make the whole app
 * public. It was in neither list before, which meant an anonymous visitor was
 * redirected straight to /sign-in and the landing page rendered for nobody.
 *
 * The file-convention icon is here for the same reason: it is a route, not a
 * static asset, so the matcher sees it and a logged-out tab got a redirect
 * instead of the favicon.
 */
const PUBLIC_EXACT = ["/", "/icon.svg"];

/** Routes that should bounce a logged-in user to their role home. */
const AUTH_PAGE_PREFIXES = ["/sign-in", "/sign-up"];

const startsWithAny = (pathname: string, prefixes: string[]) =>
  prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isPublic =
    PUBLIC_EXACT.includes(pathname) || startsWithAny(pathname, PUBLIC_PREFIXES);
  const isAuthPage = startsWithAny(pathname, AUTH_PAGE_PREFIXES);

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(
      new URL(roleHome(req.auth?.user?.role), req.url),
    );
  }

  return NextResponse.next();
});

// Next 16 renamed the middleware convention to "proxy"; it always runs on Node,
// which is what lets auth() pull in @/lib/auth -> mongoose here.
// Run on every request except Next internals, API routes and static assets.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
