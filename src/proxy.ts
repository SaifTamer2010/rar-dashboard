import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { roleHome } from "@/lib/roles";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/sign-in");

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(
      new URL(roleHome((req.auth?.user as any)?.role), req.url),
    );
  }
});

// i dont understand this line
export const config = {
  // matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
  matcher:[
    '/favicon.ico',
  ]
};
