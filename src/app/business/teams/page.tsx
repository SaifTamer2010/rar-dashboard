"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import RoleGate from "@/components/RoleGate";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import ChatIdFinder from "@/components/ChatIdFinder";

type TeamRow = {
  id: string;
  name: string;
  members: number;
  leads: number;
  campaigns: number;
  telegramChatId: string;
};

type TeamDetail = {
  team: { id: string; name: string; telegramChatId: string };
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
  const [botTokenSet, setBotTokenSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/business/teams");
      const body = res.ok ? await res.json() : null;
      if (cancelled) return;

      setTeams(body?.teams ?? []);
      setBotTokenSet(!!body?.telegramBotTokenSet);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function createTeam() {
    if (!newTeamName.trim()) return;

    const res = await fetch("/api/business/teams", {
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
          <SkeletonRegion
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            label="Loading teams"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-background p-4">
                <Skeleton className="h-3.5 w-28" />
                <div className="mt-3 flex gap-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </SkeletonRegion>
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
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium">{team.name || "Untitled team"}</div>
                  {!team.telegramChatId && (
                    <span className="shrink-0 rounded-full border border-amber-600/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      No chat
                    </span>
                  )}
                </div>
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
          botTokenSet={botTokenSet}
          onClose={() => {
            setOpenTeamId(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function TeamModal({
  teamId,
  botTokenSet,
  onClose,
}: {
  teamId: string;
  botTokenSet: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<TeamDetail | null>(null);
  const [pickedCampaign, setPickedCampaign] = useState("");
  const [chatId, setChatId] = useState("");
  const [savingChat, setSavingChat] = useState(false);
  const [testingChat, setTestingChat] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch(`/api/business/teams/${teamId}`);
      const detail = res.ok ? await res.json() : null;
      if (cancelled || !detail) return;

      setData(detail);
      setChatId(detail.team.telegramChatId ?? "");
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

  async function saveChatId() {
    setSavingChat(true);

    const res = await fetch(`/api/business/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramChatId: chatId }),
    });

    const body = await res.json().catch(() => ({}));
    setSavingChat(false);

    if (!res.ok) {
      toast.error(body.message || "Could not save the chat id");
      return;
    }

    toast.success(chatId.trim() ? "Chat id saved" : "Chat id cleared");
    reload();
  }

  async function sendTestToTeam() {
    setTestingChat(true);

    const res = await fetch("/api/telegram/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, message: "Test message from your dashboard." }),
    });

    const body = await res.json().catch(() => ({}));
    setTestingChat(false);

    if (!res.ok) {
      toast.error(body.error || "Could not send");
      return;
    }

    toast.success("Test sent to this team's chat");
  }

  async function assignCampaign() {
    if (!pickedCampaign && !newCampaignName.trim()) {
      toast.error("Pick a campaign or name a new one");
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/business/teams/${teamId}/campaigns`, {
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
      `/api/business/teams/${teamId}/campaigns?campaignId=${campaignId}`,
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
            {data ? (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {`${data.members.length} members · ${data.totalLeads} leads`}
              </p>
            ) : (
              <Skeleton className="mt-1.5 h-3 w-36" />
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {!data && (
          <SkeletonRegion className="flex flex-col gap-6" label="Loading team">
            {Array.from({ length: 2 }).map((_, s) => (
              <section key={s}>
                <Skeleton className="mb-2 h-3 w-20" />
                <div className="divide-y overflow-hidden rounded-lg border">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-3 w-14" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </SkeletonRegion>
        )}

        {data && (
          <div className="flex flex-col gap-6">
            {/* Telegram chat for this team */}
            <section>
              <h3 className="mb-2 text-[13px] font-medium">Telegram chat</h3>
              <div className="rounded-lg border p-3">
                <p className="text-[13px] text-muted-foreground">
                  Leads logged by this team are announced here. Add your bot to the group, send any
                  message there, then use Find my chat ID — group ids start with a minus.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    aria-label="Telegram chat id"
                    placeholder="-1001234567890"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className={fieldClass}
                  />
                  <ChatIdFinder disabled={!botTokenSet} onPick={setChatId} />
                  <button
                    onClick={saveChatId}
                    disabled={savingChat || chatId === (data.team.telegramChatId ?? "")}
                    className="shrink-0 cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingChat ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={sendTestToTeam}
                    disabled={testingChat || !data.team.telegramChatId}
                    title={
                      data.team.telegramChatId
                        ? "Send a test message to this chat"
                        : "Save a chat id first"
                    }
                    className="shrink-0 cursor-pointer rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {testingChat ? "Sending…" : "Test"}
                  </button>
                </div>
                {!data.team.telegramChatId && (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    Not set — this team&apos;s leads fall back to the business-wide chat.
                  </p>
                )}
              </div>
            </section>

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

/**
 * Telegram never shows a chat id anywhere in its own app, so nobody can look
 * one up by hand. The bot can: it sees the chat behind every message sent to
 * it, and this lists them so the owner picks instead of types.
 */
