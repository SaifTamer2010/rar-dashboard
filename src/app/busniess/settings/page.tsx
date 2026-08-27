"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import RoleGate from "@/components/RoleGate";

const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:opacity-50";

const buttonClass =
  "cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50";

export default function BusniessSettingsPage() {
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/busniess/settings");
      const data = res.ok ? await res.json() : null;
      if (cancelled || !data) return;

      setName(data.name);
      setEmail(data.email);
      setCompanyName(data.companyName);
      setTelegramChatId(data.telegramChatId);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function save(payload: Record<string, string>, done: (v: boolean) => void) {
    done(true);

    const res = await fetch("/api/busniess/settings", {
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

  async function sendTest() {
    setTesting(true);
    const res = await fetch("/api/telegram/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Test message from your dashboard." }),
    });
    setTesting(false);

    if (!res.ok) {
      toast.error("Could not send — check the chat id");
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
          <p className="text-sm text-muted-foreground">Loading…</p>
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

            {/* Telegram */}
            <section className="rounded-xl border bg-background p-5">
              <h2 className="text-[15px] font-semibold tracking-tight">Telegram</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Lead alerts go to this chat. Add the bot to your group, then paste the chat id —
                group ids start with a minus.
              </p>

              <div className="mt-4 flex flex-col gap-1.5">
                <label htmlFor="chat-id" className="text-[13px] font-medium">
                  Chat id
                </label>
                <input
                  id="chat-id"
                  placeholder="-1001234567890"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className={fieldClass}
                />
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
