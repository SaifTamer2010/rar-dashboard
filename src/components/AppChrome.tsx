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
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      {showNavbar && <DashboardNavbar />}
      <div id="main">{children}</div>
    </div>
  );
}
