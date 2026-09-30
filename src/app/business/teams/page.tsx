"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import RoleGate from "@/components/RoleGate";

type TeamRow = {
  id: string;
  name: string;
  members: number;
  leads: number;
  campaigns: number;
};

type TeamDetail = {
  team: { id: string; name: string };
  totalLeads: number;
  members: { id: string; name: string; email: string; leads: number }[];
  campaigns: { id: string; name: string; leads: number }[];
  availableCampaigns: { id: string; name: string; assigned: boolean }[];
};

const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:opacity-50";

export default function TeamsPage() {
  return (
    <RoleGate role="busniess_owner">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/busniess/teams");
      const rows = res.ok ? (await res.json()).teams : [];
      if (cancelled) return;

      setTeams(rows);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function createTeam() {
    if (!newTeamName.trim()) return;

    const res = await fetch("/api/busniess/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName.trim() }),
    });

    if (!res.ok) {
      toast.error("Could not create team");
      return;
    }

    toast.success("Team created");
    setNewTeamName("");
    reload();
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every team in your business. Click one to see its dashboard and campaigns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              placeholder="New team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTeam()}
              className="w-48 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-muted-foreground"
            />
            <button
              onClick={createTeam}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              <Plus className="size-4" />
              Add team
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : teams.length === 0 ? (
          <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
            No teams yet. Make one above, or create one while assigning an invited user.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setOpenTeamId(team.id)}
                className="cursor-pointer rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted"
              >
                <div className="text-sm font-medium">{team.name || "Untitled team"}</div>
                <div className="mt-3 flex gap-4 text-[13px] text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">{team.members}</span> members
                  </span>
                  <span>
                    <span className="font-medium text-foreground">{team.leads}</span> leads
                  </span>
                  <span>
                    <span className="font-medium text-foreground">{team.campaigns}</span> campaigns
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {openTeamId && (
        <TeamModal
          teamId={openTeamId}
          onClose={() => {
            setOpenTeamId(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function TeamModal({ teamId, onClose }: { teamId: string; onClose: () => void }) {
  const [data, setData] = useState<TeamDetail | null>(null);
  const [pickedCampaign, setPickedCampaign] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch(`/api/busniess/teams/${teamId}`);
      const detail = res.ok ? await res.json() : null;
      if (cancelled || !detail) return;

      setData(detail);
    })();

    return () => {
      cancelled = true;
    };
  }, [teamId, tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function assignCampaign() {
    if (!pickedCampaign && !newCampaignName.trim()) {
      toast.error("Pick a campaign or name a new one");
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/busniess/teams/${teamId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        newCampaignName.trim()
          ? { newCampaignName: newCampaignName.trim() }
          : { campaignId: pickedCampaign },
      ),
    });
    setBusy(false);

    if (!res.ok) {
      toast.error("Could not assign campaign");
      return;
    }

    toast.success("Campaign assigned");
    setPickedCampaign("");
    setNewCampaignName("");
    reload();
  }

  async function removeCampaign(campaignId: string) {
    setBusy(true);
    const res = await fetch(
      `/api/busniess/teams/${teamId}/campaigns?campaignId=${campaignId}`,
      { method: "DELETE" },
    );
    setBusy(false);

    if (!res.ok) {
      toast.error("Could not remove campaign");
      return;
    }

    toast.success("Campaign removed");
    reload();
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-160 overflow-y-auto rounded-xl border bg-background p-5 shadow-lg"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">
              {data?.team.name || "Team"}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {data ? `${data.members.length} members · ${data.totalLeads} leads` : "Loading…"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {data && (
          <div className="flex flex-col gap-6">
            {/* Who logged what */}
            <section>
              <h3 className="mb-2 text-[13px] font-medium">Members</h3>
              <div className="overflow-hidden rounded-lg border">
                {data.members.length === 0 ? (
                  <p className="p-3 text-[13px] text-muted-foreground">Nobody on this team yet.</p>
                ) : (
                  data.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-0"
                    >
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                      <span className="text-[13px] text-muted-foreground">
                        <span className="font-medium text-foreground">{member.leads}</span> leads
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Campaigns on this team */}
            <section>
              <h3 className="mb-2 text-[13px] font-medium">Campaigns</h3>
              <div className="overflow-hidden rounded-lg border">
                {data.campaigns.length === 0 ? (
                  <p className="p-3 text-[13px] text-muted-foreground">
                    No campaigns assigned yet.
                  </p>
                ) : (
                  data.campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-0"
                    >
                      <span className="font-medium">{campaign.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] text-muted-foreground">
                          <span className="font-medium text-foreground">{campaign.leads}</span>{" "}
                          leads
                        </span>
                        <button
                          onClick={() => removeCampaign(campaign.id)}
                          disabled={busy}
                          className="cursor-pointer rounded-md border px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Assign more */}
            <section className="flex flex-col gap-2.5">
              <h3 className="text-[13px] font-medium">Assign a campaign</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={pickedCampaign}
                  disabled={!!newCampaignName.trim()}
                  onChange={(e) => setPickedCampaign(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Pick an existing campaign</option>
                  {data.availableCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                      {campaign.assigned ? " (on another team)" : ""}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="…or a new campaign name"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className={fieldClass}
                />
                <button
                  onClick={assignCampaign}
                  disabled={busy}
                  className="shrink-0 cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
