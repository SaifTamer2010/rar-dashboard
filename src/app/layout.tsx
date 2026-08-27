'use client';
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import DashboardNavbar from "@/components/DashboardNavbar";
import { usePathname } from "next/navigation";

import "./globals.css";
import { Inter,Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const giest = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  // Landing and auth screens carry their own branding, so they skip the app chrome.
  const showNavbar =
    pathname !== "/" &&
    !pathname.startsWith("/sign-in") &&
    !pathname.startsWith("/sign-up") &&
    !pathname.startsWith("/join");

  return (
    <html lang="en" className={cn("font-sans", giest.variable)}>
      <body className="antialiased" suppressHydrationWarning>
        <Analytics />
        <Providers>
          <div className="min-h-screen grid grid-rows-[auto_1fr]">
            {showNavbar && <DashboardNavbar />}
            {children}
          </div>
          </Providers>
      </body>
    </html>
  );
}
