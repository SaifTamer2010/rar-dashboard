"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import RoleGate from "@/components/RoleGate";

const links = [
  { label: "Dashboard", href: "/agent/dashboard", description: "Log a lead and hear it announced." },
  { label: "Leaderboard", href: "/agent/leaderboard", description: "Who is on top today." },
  { label: "Property Search", href: "/agent/property-search", description: "Look up properties." },
  { label: "Settings", href: "/agent/settings", description: "Your sound, your template." },
  { label: "Sound Store", href: "/agent/sounds", description: "Pick the sound your leads play." },
];

export default function AgentPage() {
  return (
    <RoleGate role="agent">
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
            agent
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Agent</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {session?.user?.name}. SUBAgent
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
