"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import RoleGate from "@/components/RoleGate";
import { useBusiness } from "@/hooks/useBusiness";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

type TeamRow = {
  id: string;
  name: string;
  members: number;
  leads: number;
  campaigns: number;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  teamId: string | null;
  teamName: string | null;
};

const links = [
  { label: "Teams", href: "/business/teams", description: "Members, lead totals and campaigns per team." },
  { label: "Campaigns", href: "/business/campaigns", description: "Every campaign and the team running it." },
  { label: "Invited users", href: "/business/invited_users", description: "Who joined and who still needs a team." },
  { label: "Settings", href: "/business/settings", description: "Your business details." },
];

export default function BusinessPage() {
  return (
    <RoleGate role="busniess_owner">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const { data: session } = useSession();
  const { companyName } = useBusiness();

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [teamsRes, usersRes] = await Promise.all([
        fetch("/api/business/teams"),
        fetch("/api/business/users"),
      ]);

      const teamRows: TeamRow[] = teamsRes.ok ? (await teamsRes.json()).teams : [];
      const userRows: UserRow[] = usersRes.ok ? (await usersRes.json()).users : [];

      if (cancelled) return;

      setTeams(teamRows);
      setUsers(userRows);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const staff = users.filter((u) => u.role === "agent" || u.role === "team_leader");
  const stats = [
    { label: "Teams", value: teams.length },
    { label: "Agents", value: staff.filter((u) => u.role === "agent").length },
    { label: "Team leaders", value: staff.filter((u) => u.role === "team_leader").length },
    { label: "Campaigns", value: teams.reduce((sum, t) => sum + t.campaigns, 0) },
    { label: "Leads all time", value: teams.reduce((sum, t) => sum + t.leads, 0) },
  ];

  const waiting = staff.filter((u) => !u.teamId);
  const topTeams = [...teams].sort((a, b) => b.leads - a.leads).slice(0, 5);

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6">
          <span className="rounded-md border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
            business owner
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {companyName || "Your business"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {session?.user?.name}. Everything your teams have logged so far.
          </p>
        </div>

        {loading ? (
          <SkeletonRegion className="flex flex-col gap-6" label="Loading your business">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-background p-4">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
              ))}
            </div>
            <section>
              <Skeleton className="mb-2 h-3 w-24" />
              <div className="divide-y overflow-hidden rounded-lg border bg-background">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3.5 w-10" />
                  </div>
                ))}
              </div>
            </section>
          </SkeletonRegion>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border bg-background p-4">
                  <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
                  <div className="mt-1 text-[13px] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {waiting.length > 0 && (
              <div className="rounded-lg border bg-background p-4 text-sm">
                <span className="font-medium">{waiting.length}</span>{" "}
                {waiting.length === 1 ? "person is" : "people are"} not on a team yet.{" "}
                <Link
                  href="/business/invited_users"
                  className="font-medium text-foreground underline"
                >
                  Assign them
                </Link>
                .
              </div>
            )}

            <section>
              <h2 className="mb-2 text-[13px] font-medium">Teams by leads</h2>
              <div className="overflow-hidden rounded-lg border bg-background">
                {topTeams.length === 0 ? (
                  <p className="p-3 text-[13px] text-muted-foreground">
                    No teams yet.{" "}
                    <Link href="/business/teams" className="font-medium text-foreground underline">
                      Create your first team
                    </Link>
                    .
                  </p>
                ) : (
                  topTeams.map((team) => (
                    <Link
                      key={team.id}
                      href="/business/teams"
                      className="flex items-center justify-between gap-4 border-b px-3 py-2.5 text-sm transition-colors last:border-0 hover:bg-muted/50"
                    >
                      <span className="truncate font-medium">{team.name || "Untitled team"}</span>
                      <span className="shrink-0 text-[13px] text-muted-foreground">
                        <span className="font-medium text-foreground">{team.members}</span> members ·{" "}
                        <span className="font-medium text-foreground">{team.campaigns}</span>{" "}
                        campaigns · <span className="font-medium text-foreground">{team.leads}</span>{" "}
                        leads
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        )}
      </main>
    </div>
  );
}
