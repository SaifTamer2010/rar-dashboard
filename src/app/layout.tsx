'use client';
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import DashboardNavbar from "@/components/DashboardNavbar";
import { usePathname } from "next/navigation";

import "./globals.css";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <Analytics />
        <Providers>
          <div className="max-h-screen grid grid-rows-[auto_1fr]">
            {pathname === '/sign-in' ? null : <DashboardNavbar />}
            {children}
          </div>
          </Providers>
      </body>
    </html>
  );
}
