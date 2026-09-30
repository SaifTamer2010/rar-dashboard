"use client";

import { usePathname } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";

/**
 * The navbar needs the current path, and `metadata` needs a server layout — the
 * two cannot live in the same file. This is the client half: the root layout
 * stays a server component and delegates the one reactive decision here.
 *
 * Landing and auth screens carry their own branding, so they skip the app chrome.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const showNavbar =
    pathname !== "/" &&
    !pathname.startsWith("/sign-in") &&
    !pathname.startsWith("/sign-up") &&
    !pathname.startsWith("/join");

  return (
    // grid-cols-1 is minmax(0, 1fr): without it the implicit column sizes to its
    // content, and the landing marquee's autoFill keeps cloning to fill whatever
    // width it is given, so the column grew without bound (~1.28M px).
    <div className="min-h-screen grid grid-cols-1 grid-rows-[auto_1fr]">
      {showNavbar && <DashboardNavbar />}
      <div id="main" className="min-w-0">{children}</div>
    </div>
  );
}
