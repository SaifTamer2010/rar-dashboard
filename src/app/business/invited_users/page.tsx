"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import RoleGate from "@/components/RoleGate";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
  teamName: string | null;
};

type TeamOption = { id: string; name: string };

const ROLE_LABELS: Record<string, string> = {
  agent: "Agent",
  team_leader: "Team leader",
  busniess_owner: "Business owner",
  super_admin: "Super admin",
};

const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:opacity-50";

export default function InvitedUsersPage() {
  return (
    <RoleGate role="busniess_owner">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Member | null>(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [usersRes, teamsRes] = await Promise.all([
        fetch("/api/busniess/users"),
        fetch("/api/busniess/teams"),
      ]);

      const users = usersRes.ok ? (await usersRes.json()).users : [];
      const teamList = teamsRes.ok ? (await teamsRes.json()).teams : [];

      if (cancelled) return;

      setMembers(users);
      setTeams(teamList);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Invited users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone who joined through your invite link. Click someone to put them on a team.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-background">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : members.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              Nobody has joined yet. Share your invite link from the menu up top.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-[13px] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Team</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => setActive(member)}
                    className="cursor-pointer border-b last:border-0 transition-colors hover:bg-muted/60"
                  >
                    <td className="px-4 py-2.5 font-medium">{member.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{member.email}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {member.teamName ? (
                        <span className="rounded-md border px-2 py-0.5 text-xs">
                          {member.teamName}
                        </span>
                      ) : (
                        <span className="rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {active && (
        <AssignModal
          member={active}
          teams={teams}
          onClose={() => setActive(null)}
          onDone={() => {
            setActive(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function AssignModal({
  member,
  teams,
  onClose,
  onDone,
}: {
  member: Member;
  teams: TeamOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [teamId, setTeamId] = useState(member.teamId ?? "");
  const [role, setRole] = useState(member.role === "team_leader" ? "team_leader" : "agent");
  const [newTeamName, setNewTeamName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    if (!teamId && !newTeamName.trim()) {
      toast.error("Pick a team or name a new one");
      return;
    }

    setSaving(true);

    const res = await fetch(`/api/busniess/users/${member.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        newTeamName.trim()
          ? { newTeamName: newTeamName.trim(), role }
          : { teamId, role },
      ),
    });

    setSaving(false);

    if (!res.ok) {
      toast.error("Could not assign");
      return;
    }

    toast.success(`${member.name} assigned`);
    onDone();
  }

  async function unassign() {
    setSaving(true);
    const res = await fetch(`/api/busniess/users/${member.id}/assign`, { method: "DELETE" });
    setSaving(false);

    if (!res.ok) {
      toast.error("Could not unassign");
      return;
    }

    toast.success(`${member.name} unassigned`);
    onDone();
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
        className="w-full max-w-112 rounded-xl border bg-background p-5 shadow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight">{member.name}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {ROLE_LABELS[member.role] ?? member.role} ·{" "}
              {member.teamName ? `on ${member.teamName}` : "unassigned"}
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

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-[13px] font-medium">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={fieldClass}
            >
              <option value="agent">Agent</option>
              <option value="team_leader">Team leader</option>
            </select>
            <span className="text-xs text-muted-foreground">
              Only agents show up in the team dashboard counts.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="team" className="text-[13px] font-medium">
              Choose a team
            </label>
            <select
              id="team"
              value={teamId}
              disabled={!!newTeamName.trim()}
              onChange={(e) => setTeamId(e.target.value)}
              className={fieldClass}
            >
              <option value="">No team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-team" className="text-[13px] font-medium">
              …or create one
            </label>
            <input
              id="new-team"
              placeholder="Closers"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>

            {member.teamId && (
              <button
                onClick={unassign}
                disabled={saving}
                className="cursor-pointer rounded-lg border px-3.5 py-2 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                Unassign
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
