"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import RoleGate from "@/components/RoleGate";
import InviteModal from "@/components/InviteModal";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

type AgentRow = {
  id: string;
  name: string;
  email: string;
  onMyTeam: boolean;
  teamId: string | null;
};

export default function TeamLeadAgentsPage() {
  return (
    <RoleGate role="team_leader">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/team/users");
      const data = res.ok ? await res.json() : null;
      if (cancelled) return;

      setRows(data?.users ?? []);
      setTeamName(data?.team?.name ?? "");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function toggle(row: AgentRow) {
    setBusyId(row.id);

    const res = await fetch(`/api/team/users/${row.id}`, {
      method: row.onMyTeam ? "DELETE" : "POST",
    });

    const data = await res.json();
    setBusyId(null);

    if (!res.ok) {
      toast.error(data.message || "Could not save");
      return;
    }

    toast.success(row.onMyTeam ? `${row.name} removed` : `${row.name} added`);
    reload();
  }

  const onTeam = rows.filter((r) => r.onMyTeam);
  const available = rows.filter((r) => !r.onMyTeam);

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {teamName ? `Who logs leads for ${teamName}.` : "Who logs leads for your team."}
            </p>
          </div>

          <button
            onClick={() => setInviteOpen(true)}
            className="cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Invite agents
          </button>
        </div>

        {loading ? (
          <SkeletonRegion className="flex flex-col gap-4" label="Loading agents">
            {Array.from({ length: 2 }).map((_, s) => (
              <section key={s} className="overflow-hidden rounded-lg border bg-background">
                <div className="border-b bg-muted/50 px-4 py-2.5">
                  <Skeleton className="h-3.5 w-32" />
                </div>
                <div className="divide-y">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                      <Skeleton className="h-7 w-20 rounded-lg" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </SkeletonRegion>
        ) : (
          <div className="flex flex-col gap-4">
            <AgentTable
              title="On your team"
              empty="Nobody on your team yet. Invite someone, or add an unassigned agent below."
              rows={onTeam}
              busyId={busyId}
              actionLabel="Remove"
              onAction={toggle}
            />

            <AgentTable
              title="Unassigned agents"
              empty="No unassigned agents in your business right now."
              rows={available}
              busyId={busyId}
              actionLabel="Add to team"
              onAction={toggle}
            />
          </div>
        )}
      </main>

      {inviteOpen && (
        <InviteModal
          endpoint="/api/team/invite"
          description="Anyone with this link joins your team as an agent."
          onClose={() => {
            setInviteOpen(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function AgentTable({
  title,
  empty,
  rows,
  busyId,
  actionLabel,
  onAction,
}: {
  title: string;
  empty: string;
  rows: AgentRow[];
  busyId: string | null;
  actionLabel: string;
  onAction: (row: AgentRow) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-background">
      <header className="border-b bg-muted/50 px-4 py-2.5">
        <h2 className="text-[13px] font-medium">{title}</h2>
      </header>

      {rows.length === 0 ? (
        <p className="px-4 py-3 text-[13px] text-muted-foreground">{empty}</p>
      ) : (
        rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-4 border-b px-4 py-2.5 last:border-0"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{row.name}</div>
              <div className="truncate text-xs text-muted-foreground">{row.email}</div>
            </div>

            <button
              onClick={() => onAction(row)}
              disabled={busyId === row.id}
              className="shrink-0 cursor-pointer rounded-lg border bg-background px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyId === row.id ? "Saving…" : actionLabel}
            </button>
          </div>
        ))
      )}
    </section>
  );
}
