"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import RoleGate from "@/components/RoleGate";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:opacity-50";

type TeamWiring = {
  teamName: string;
  companyName: string;
  telegramChatId: string;
  fallbackChatId: string;
  botConfigured: boolean;
};

const buttonClass =
  "cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50";

export default function TeamLeadSettingsPage() {
  return (
    <RoleGate role="team_leader">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const { data: session } = useSession();

  const [name, setName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<TeamWiring | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/user/me");
      const data = res.ok ? await res.json() : null;
      if (cancelled) return;

      // /api/user/me returns the user document itself.
      setName(data?.name ?? session?.user?.name ?? "");
      setTelegramUsername(data?.telegramUsername ?? "");
      setLoading(false);

      const wiring = await fetch("/api/team/settings");
      if (!cancelled && wiring.ok) setTeam(await wiring.json());
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.name]);

  async function save() {
    if (newPassword && !currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/user/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, telegramUsername, currentPassword, newPassword }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(data.error || "Could not save");
      return;
    }

    toast.success("Saved");
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-180 px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account details and how the bot mentions you.
          </p>
        </div>

        {loading ? (
          <SkeletonRegion className="flex flex-col gap-4" label="Loading settings">
            {Array.from({ length: 2 }).map((_, s) => (
              <section key={s} className="rounded-xl border bg-background p-5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-2 h-3 w-64" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
                <Skeleton className="mt-4 h-9 w-28 rounded-lg" />
              </section>
            ))}
          </SkeletonRegion>
        ) : (
          <div className="flex flex-col gap-4">
            {team && <TeamWiringCard team={team} />}

            <section className="rounded-xl border bg-background p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">Profile</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                The name your team sees on the dashboard.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-[13px] font-medium">
                    Your name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="telegram" className="text-[13px] font-medium">
                    Telegram username
                  </label>
                  <input
                    id="telegram"
                    placeholder="without the @"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-background p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">Password</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Leave both blank to keep the one you have.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="current-password" className="text-[13px] font-medium">
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="new-password" className="text-[13px] font-medium">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </section>

            <div>
              <button onClick={save} disabled={saving} className={buttonClass}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Where this team's shouts land. Read-only on purpose — only the business owner
 * sets the chat, so the leader gets visibility and someone to chase, not a
 * field they cannot actually save.
 */
function TeamWiringCard({ team }: { team: TeamWiring }) {
  const usingOwn = !!team.telegramChatId;
  const usingFallback = !usingOwn && !!team.fallbackChatId;
  const nowhere = !usingOwn && !usingFallback;

  return (
    <section className="rounded-xl border bg-background p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Telegram</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Where leads from {team.teamName || "your team"} get announced.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
            nowhere || !team.botConfigured
              ? "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {nowhere || !team.botConfigured ? "Needs setup" : "Connected"}
        </span>
      </div>

      <dl className="mt-4 flex flex-col gap-2 text-[13px]">
        <div className="flex items-center justify-between gap-4 border-b pb-2">
          <dt className="text-muted-foreground">Team chat id</dt>
          <dd className="truncate font-mono text-sm">
            {usingOwn ? (
              team.telegramChatId
            ) : (
              <span className="font-sans text-muted-foreground">Not set</span>
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-b pb-2">
          <dt className="text-muted-foreground">Bot</dt>
          <dd className="text-sm">
            {team.botConfigured ? "Configured" : "Not configured"}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        {usingOwn &&
          "Only the business owner can change this. Ask them if messages are landing in the wrong chat."}
        {usingFallback &&
          `This team has no chat of its own, so messages go to ${team.companyName || "the business"}'s shared chat instead. Ask the owner to give your team its own.`}
        {nowhere &&
          "No chat is set for your team or the business, so nothing is being sent. Ask the owner to add one."}
      </p>
    </section>
  );
}
