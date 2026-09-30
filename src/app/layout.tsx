import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import { AppChrome } from "@/components/AppChrome";

import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const giest = Geist({ subsets: ["latin"], variable: "--font-sans" });

/**
 * This file used to be `"use client"` for one `usePathname()` call, which meant
 * Next dropped the `metadata` export — the whole site shipped with no title and
 * no description. The pathname logic moved to `AppChrome`, so the layout can be
 * a server component again and say who it is.
 */
export const metadata: Metadata = {
  // Without this, Next resolves OG image URLs against localhost:3000 and warns
  // on every build. Vercel sets VERCEL_URL; anything else falls back to the
  // deployment url you set yourself.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
  title: {
    default: "Daily Dashboard — real-time lead board for sales floors",
    template: "%s · Daily Dashboard",
  },
  description:
    "Log a lead, hear the floor. Daily Dashboard puts every agent's leads, campaigns and leaderboard on one live board, with Telegram summaries for the people who need them.",
  applicationName: "Daily Dashboard",
  // The app is behind a login and has nothing to gain from being indexed.
  robots: { index: false, follow: false },
  openGraph: {
    title: "Daily Dashboard",
    description: "Real-time lead board, leaderboard and Telegram summaries for sales floors.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", giest.variable)}>
      <body className="antialiased" suppressHydrationWarning>
        <Analytics />
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-200 focus:rounded-lg focus:border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
          >
            Skip to content
          </a>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
