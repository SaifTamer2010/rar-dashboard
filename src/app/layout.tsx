import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ring and Rise | Daily Dashboard",
  description:
    "The scoreboard your eldawly didn't know he needed. Real-time leads, live sounds, and zero excuses ostor ydawly.",
  openGraph: {
    title: "Daily Dashboard",
    description: "Real-time sales leads tracker for high-performance teams.",
    url: "",
    siteName: "LeadPulse",
    images: [
      {
        url: "https://rar-dashboard-six.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Daily Dashboard",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadPulse",
    description: "Real-time sales leads tracker for high-performance teams.",
    images: ["https://rar-dashboard-six.vercel.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Analytics />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
