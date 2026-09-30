"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import RoleGate from "@/components/RoleGate";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

type TeamRow = {
  id: string;
  name: string;
  members: number;
  leads: number;
  campaigns: number;
};

type TeamDetail = {
  team: { id: string; name: string };
  campaigns: { id: string; name: string; leads: number }[];
  availableCampaigns: { id: string; name: string; assigned: boolean }[];
};

type TeamGroup = {
  id: string;
  name: string;
  members: number;
  campaigns: { id: string; name: string; leads: number }[];
};

const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:opacity-50";

export default function CampaignsPage() {
  return (
    <RoleGate role="busniess_owner">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [unassigned, setUnassigned] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTeamId, setNewTeamId] = useState("");
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/business/teams");
      const teams: TeamRow[] = res.ok ? (await res.json()).teams : [];

      // Campaigns only ever come back per team, so fan out over the teams we have.
      const details = await Promise.all(
        teams.map(async (team) => {
          const detailRes = await fetch(`/api/business/teams/${team.id}`);
          return detailRes.ok ? ((await detailRes.json()) as TeamDetail) : null;
        }),
      );

      if (cancelled) return;

      setGroups(
        teams.map((team, i) => ({
          id: team.id,
          name: team.name,
          members: team.members,
          campaigns: details[i]?.campaigns ?? [],
        })),
      );

      // A campaign with no team shows up as "not assigned" in every team's list.
      const free = new Map<string, string>();
      for (const detail of details) {
        for (const campaign of detail?.availableCampaigns ?? []) {
          if (!campaign.assigned) free.set(campaign.id, campaign.name);
        }
      }
      setUnassigned([...free].map(([id, name]) => ({ id, name })));

      setNewTeamId((current) => current || teams[0]?.id || "");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function createCampaign() {
    if (!newName.trim() || !newTeamId) {
      toast.error("Name the campaign and pick a team");
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/business/teams/${newTeamId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newCampaignName: newName.trim() }),
    });
    setBusy(false);

    if (!res.ok) {
      toast.error("Could not create campaign");
      return;
    }

    toast.success("Campaign created");
    setNewName("");
    reload();
  }

  async function assign(campaignId: string, teamId: string) {
    if (!teamId) return;

    setBusy(true);
    const res = await fetch(`/api/business/teams/${teamId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });
    setBusy(false);

    if (!res.ok) {
      toast.error("Could not assign campaign");
      return;
    }

    toast.success("Campaign assigned");
    reload();
  }

  async function unassign(campaignId: string, teamId: string) {
    setBusy(true);
    const res = await fetch(
      `/api/business/teams/${teamId}/campaigns?campaignId=${campaignId}`,
      { method: "DELETE" },
    );
    setBusy(false);

    if (!res.ok) {
      toast.error("Could not remove campaign");
      return;
    }

    toast.success("Campaign unassigned");
    reload();
  }

  const totalCampaigns =
    groups.reduce((sum, group) => sum + group.campaigns.length, 0) + unassigned.length;

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every campaign in your business, grouped by the team that runs it.
            </p>
          </div>

          {groups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                placeholder="New campaign name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createCampaign()}
                className="w-48 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-muted-foreground"
              />
              <select
                value={newTeamId}
                onChange={(e) => setNewTeamId(e.target.value)}
                className="w-40 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-muted-foreground"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name || "Untitled team"}
                  </option>
                ))}
              </select>
              <button
                onClick={createCampaign}
                disabled={busy}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
              >
                <Plus className="size-4" />
                Add campaign
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <SkeletonRegion className="flex flex-col gap-6" label="Loading campaigns">
            <Skeleton className="h-3.5 w-56" />
            {Array.from({ length: 2 }).map((_, s) => (
              <section key={s}>
                <Skeleton className="mb-2 h-4 w-32" />
                <div className="divide-y overflow-hidden rounded-lg border bg-background">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                      <Skeleton className="h-3.5 w-40" />
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-7 w-20 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </SkeletonRegion>
        ) : groups.length === 0 ? (
          <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
            Campaigns live on a team, and you have no teams yet.{" "}
            <Link href="/business/teams" className="font-medium text-foreground underline">
              Create a team first
            </Link>
            .
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground">{totalCampaigns}</span> campaigns across{" "}
              <span className="font-medium text-foreground">{groups.length}</span> teams
            </p>

            {unassigned.length > 0 && (
              <section>
                <h2 className="mb-2 text-[13px] font-medium">
                  Not assigned
                  <span className="ml-2 font-normal text-muted-foreground">
                    no team is running these
                  </span>
                </h2>
                <div className="overflow-hidden rounded-lg border bg-background">
                  {unassigned.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2.5 text-sm last:border-0"
                    >
                      <span className="font-medium">{campaign.name}</span>
                      <select
                        defaultValue=""
                        disabled={busy}
                        onChange={(e) => assign(campaign.id, e.target.value)}
                        className={`${fieldClass} w-auto py-1.5 text-[13px]`}
                      >
                        <option value="">Assign to a team…</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name || "Untitled team"}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {groups.map((group) => (
              <section key={group.id}>
                <h2 className="mb-2 text-[13px] font-medium">
                  {group.name || "Untitled team"}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {group.members} members · {group.campaigns.length} campaigns
                  </span>
                </h2>
                <div className="overflow-hidden rounded-lg border bg-background">
                  {group.campaigns.length === 0 ? (
                    <p className="p-3 text-[13px] text-muted-foreground">
                      No campaigns on this team yet.
                    </p>
                  ) : (
                    group.campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between gap-3 border-b px-3 py-2.5 text-sm last:border-0"
                      >
                        <span className="truncate font-medium">{campaign.name}</span>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-[13px] text-muted-foreground">
                            <span className="font-medium text-foreground">{campaign.leads}</span>{" "}
                            leads
                          </span>
                          <button
                            onClick={() => unassign(campaign.id, group.id)}
                            disabled={busy}
                            className="cursor-pointer rounded-md border px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                          >
                            Unassign
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
