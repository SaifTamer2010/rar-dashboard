"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import RoleGate from "@/components/RoleGate";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import ChatIdFinder from "@/components/ChatIdFinder";

const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:opacity-50";

const buttonClass =
  "cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50";

export default function BusinessSettingsPage() {
  return (
    <RoleGate role="busniess_owner">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [botTokenSet, setBotTokenSet] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [savingBot, setSavingBot] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/business/settings");
      const data = res.ok ? await res.json() : null;
      if (cancelled || !data) return;

      setName(data.name);
      setEmail(data.email);
      setCompanyName(data.companyName);
      setTelegramChatId(data.telegramChatId);
      // The token itself never comes back — only whether one is stored.
      setBotTokenSet(data.telegramBotTokenSet);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function save(
    payload: Record<string, string | null>,
    done: (v: boolean) => void,
  ) {
    done(true);

    const res = await fetch("/api/business/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    done(false);

    if (!res.ok) {
      toast.error(data.error || "Could not save");
      return false;
    }

    toast.success("Saved");
    return true;
  }

  async function saveProfile() {
    if (newPassword && !currentPassword) {
      toast.error("Enter your current password");
      return;
    }

    const ok = await save(
      { name, email, companyName, currentPassword, newPassword },
      setSavingProfile,
    );

    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
  }

  async function saveBotToken() {
    if (!telegramBotToken.trim()) {
      toast.error("Paste a bot token first");
      return;
    }

    const ok = await save({ telegramBotToken: telegramBotToken.trim() }, setSavingBot);

    if (ok) {
      // Never keep a secret sitting in a form field after it is stored.
      setTelegramBotToken("");
      setBotTokenSet(true);
    }
  }

  async function clearBotToken() {
    const ok = await save({ telegramBotToken: null }, setSavingBot);
    if (ok) {
      setTelegramBotToken("");
      setBotTokenSet(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    const res = await fetch("/api/telegram/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Test message from your dashboard." }),
    });
    setTesting(false);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(data.error || "Could not send — check the chat id");
      return;
    }

    toast.success("Test sent");
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-180 px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account, your business, and where lead alerts land.
          </p>
        </div>

        {loading ? (
          <SkeletonRegion className="flex flex-col gap-4" label="Loading settings">
            {Array.from({ length: 3 }).map((_, s) => (
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
            {/* Account + business */}
            <section className="rounded-xl border bg-background p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">Account</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Your sign-in details and the name your team sees.
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
                  <label htmlFor="email" className="text-[13px] font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="company" className="text-[13px] font-medium">
                    Business name
                  </label>
                  <input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={fieldClass}
                  />
                </div>

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
                    placeholder="Leave blank to keep it"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="mt-4">
                <button onClick={saveProfile} disabled={savingProfile} className={buttonClass}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
              </div>
            </section>

            {/* Telegram bot */}
            <section className="rounded-xl border bg-background p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight">Telegram bot</h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Your business sends through its own bot. Create one with{" "}
                    <span className="font-medium text-foreground">@BotFather</span>, then paste the
                    token here and add the bot to each team&apos;s group chat.
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                    botTokenSet
                      ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {botTokenSet ? "Connected" : "Not set"}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-1.5">
                <label htmlFor="bot-token" className="text-[13px] font-medium">
                  Bot token
                </label>
                <input
                  id="bot-token"
                  type="password"
                  autoComplete="off"
                  placeholder={botTokenSet ? "••••••••  (stored — paste a new one to replace)" : "123456789:AA…"}
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  className={fieldClass}
                />
                <p className="text-xs text-muted-foreground">
                  Stored write-only — it is never sent back to this page.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button onClick={saveBotToken} disabled={savingBot} className={buttonClass}>
                  {savingBot ? "Saving…" : botTokenSet ? "Replace token" : "Save token"}
                </button>
                {botTokenSet && (
                  <button
                    onClick={clearBotToken}
                    disabled={savingBot}
                    className="cursor-pointer rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </section>

            {/* Telegram — business-wide fallback chat */}
            <section className="rounded-xl border bg-background p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">Fallback chat</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Each team has its own chat — set those under{" "}
                <a href="/business/teams" className="font-medium text-foreground underline">
                  Teams
                </a>
                . This chat only catches teams that have not been given one yet.
              </p>

              <div className="mt-4 flex flex-col gap-1.5">
                <label htmlFor="chat-id" className="text-[13px] font-medium">
                  Chat id
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="chat-id"
                    placeholder="-1001234567890"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className={fieldClass}
                  />
                  <ChatIdFinder disabled={!botTokenSet} onPick={setTelegramChatId} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Don&apos;t know it? Add your bot to the group, send any message there, then use
                  Find my chat ID. Group ids start with a minus.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => save({ telegramChatId }, setSavingTelegram)}
                  disabled={savingTelegram}
                  className={buttonClass}
                >
                  {savingTelegram ? "Saving…" : "Save chat id"}
                </button>
                <button
                  onClick={sendTest}
                  disabled={testing || !telegramChatId}
                  className="cursor-pointer rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {testing ? "Sending…" : "Send test message"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Telegram never shows a chat id anywhere in its own app, so nobody can look
 * one up by hand. The bot can: it sees the chat behind every message sent to
 * it, and this lists them so the owner picks instead of types.
 */
