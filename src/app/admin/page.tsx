"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import RoleGate from "@/components/RoleGate";

const links = [
  { label: "Admin Panel", href: "/admin/panel", description: "The existing users / campaigns / leads panel." },
  { label: "Bot", href: "/admin/bot", description: "Telegram bot wiring." },
  { label: "Agent App", href: "/agent", description: "See what agents see." },
];

export default function AdminPage() {
  return (
    <RoleGate role="super_admin">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6">
          <span className="rounded-md border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
            super_admin
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {session?.user?.name}. SUBAdmin
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
            >
              <div className="text-sm font-medium">{link.label}</div>
              <p className="mt-1 text-[13px] text-muted-foreground">{link.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
