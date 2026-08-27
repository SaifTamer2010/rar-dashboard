"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const sections = [
  {
    label: "Users",
    href: "/admin?tab=users",
    description: "Create accounts, change roles, deactivate people.",
  },
  {
    label: "Campaigns",
    href: "/admin?tab=campaigns",
    description: "What leads get logged against.",
  },
  {
    label: "Leads",
    href: "/admin?tab=leads",
    description: "Fix or remove mistaken lead entries.",
  },
  {
    label: "Bot",
    href: "/admin/bot",
    description: "Telegram bot wiring and message templates.",
  },
  {
    label: "Sound Store",
    href: "/sounds",
    description: "Sounds people can pick for their lead alerts.",
  },
];

export default function SuperAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isSuperAdmin = session?.user?.role === "super_admin";

  React.useEffect(() => {
    if (status === "loading") return;
    if (!isSuperAdmin) {
      router.push("/dashboard");
    }
  }, [status, isSuperAdmin, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Verifying…
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Page-level navbar: the super admin surfaces, kept separate from the app chrome. */}
      <div className="border-b bg-background">
        <nav className="mx-auto flex max-w-300 items-center gap-6 overflow-x-auto px-6 py-3 text-sm">
          <span className="shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Super Admin
          </span>
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={cn(
                "shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              )}
            >
              {section.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Super Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {session?.user?.name}. Everything below is unrestricted — be careful.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
            >
              <div className="text-sm font-medium">{section.label}</div>
              <p className="mt-1 text-[13px] text-muted-foreground">{section.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
