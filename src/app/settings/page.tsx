"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Play,
  Check,
  Upload,
  Music2,
  RefreshCcw,
} from "lucide-react";

interface GlobalSound {
  _id: string;
  name: string;
  base64: string;
  mimeType: string;
}

interface Lead {
  _id: string;
  campaignId: { name: string };
  createdAt: string;
}

const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10";
const labelClass = "text-[13px] font-medium text-muted-foreground";
const primaryButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";
const cardClass = "rounded-xl border bg-background p-6";

export default function SettingsPage() {
  const { data: session, update } = useSession();

  // Profile
  const [name, setName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // History
  const [leads, setLeads] = useState<Lead[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Sound
  const [soundUrl, setSoundUrl] = useState<string | null>(null);
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundMsg, setSoundMsg] = useState("");
  const [globalSounds, setGlobalSounds] = useState<GlobalSound[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);

  // Bot Template
  const [leadMessageTemplate, setLeadMessageTemplate] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateMsg, setTemplateMsg] = useState("");
  const [showTestModal, setShowTestModal] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name);
      fetch("/api/user/me")
        .then((r) => r.json())
        .then((data) => setTelegramUsername(data.telegramUsername || ""));
    }
  }, [session]);

  useEffect(() => {
    fetch("/api/leads/history")
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []))
      .finally(() => setHistoryLoading(false));

    fetch("/api/settings/sound")
      .then((r) => r.json())
      .then((data) => setSoundUrl(data.soundUrl || null));

    fetch("/api/settings/config")
      .then((r) => r.json())
      .then((data) => setLeadMessageTemplate(data.leadMessageTemplate || ""));

    fetchGlobalSounds();
  }, []);

  async function fetchGlobalSounds() {
    setLibraryLoading(true);
    try {
      const res = await fetch("/api/sounds?me=true");
      const data = await res.json();
      setGlobalSounds(data.sounds || []);
    } catch (err) {
      console.error("Failed to fetch sounds:", err);
    } finally {
      setLibraryLoading(false);
    }
  }

  async function handleProfileSave() {
    setProfileLoading(true);
    setProfileMsg("");

    const body: Record<string, string> = { name, telegramUsername };
    if (currentPassword && newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    const res = await fetch("/api/user/update", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setProfileLoading(false);

    if (!res.ok) {
      setProfileMsg(data.error || "Something went wrong");
      return;
    }

    await update({ name });
    setCurrentPassword("");
    setNewPassword("");
    setProfileMsg("Saved successfully!");
  }

  async function handleSoundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setSoundMsg("Please upload an audio file.");
      return;
    }

    const duration = await getAudioDuration(file);
    if (duration > 10) {
      setSoundMsg("Sound must be 10 seconds or less.");
      return;
    }

    setSoundLoading(true);
    setSoundMsg("");

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];

      // Normalize mimeType for better browser support
      const normalizedMimeType = file.type === "audio/mp3" ? "audio/mpeg" : file.type;

      const body = {
        base64,
        mimeType: normalizedMimeType,
        name: file.name.split('.')[0] || "Custom Sound"
      };

      const res = await fetch("/api/settings/sound", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setSoundLoading(false);

      if (!res.ok) {
        setSoundMsg(data.error || "Upload failed");
        if (data.error?.includes("Duplicate")) {
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 500);
        }
        return;
      }

      setSoundUrl(data.soundUrl);
      setSoundMsg("Sound uploaded!");
      fetchGlobalSounds(); // Refresh the library
    };

    reader.readAsDataURL(file);
  }

  function getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
    });
  }

  async function handleSoundDelete() {
    setSoundLoading(true);
    await fetch("/api/settings/sound", { method: "DELETE" });
    setSoundUrl(null);
    setSoundMsg("Sound removed.");
    setSoundLoading(false);
  }

  function handlePreview(customUrl?: string) {
    const url = customUrl || soundUrl;
    if (!url) return;
    if (audioRef.current) {
      // Ensure the URL is valid
      audioRef.current.src = url;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback failed:", error);
          setSoundMsg("Preview failed: Unsupported format.");
        });
      }
    }
  }

  async function handleApplyGlobalSound(sound: GlobalSound) {
    setSoundLoading(true);
    setSoundMsg("");

    try {
      const dataUrl = `data:${sound.mimeType};base64,${sound.base64}`;
      const res = await fetch("/api/settings/sound", {
        method: "POST",
        body: JSON.stringify({
          base64: sound.base64,
          mimeType: sound.mimeType,
          name: sound.name
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setSoundUrl(dataUrl);
        setSoundMsg(`Applied "${sound.name}"!`);
      } else {
        setSoundMsg("Failed to apply sound");
      }
    } catch (err) {
      setSoundMsg("Error applying sound");
    } finally {
      setSoundLoading(false);
    }
  }

  async function handleTemplateSave() {
    setTemplateLoading(true);
    setTemplateMsg("");

    const res = await fetch("/api/settings/config", {
      method: "POST",
      body: JSON.stringify({ leadMessageTemplate }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setTemplateLoading(false);

    if (!res.ok) {
      setTemplateMsg(data.error || "Failed to save template");
      return;
    }

    setTemplateMsg("Template saved successfully!");
  }

  function getPreviewMessage() {
    return leadMessageTemplate
      .replace(/{name}/gi, "@Caveman")
      .replace(/{campaign}/gi, "MAMMOTH HUNT");
  }

  async function handleSendTest() {
    setTemplateLoading(true);
    const res = await fetch("/api/telegram/send-test", {
      method: "POST",
      body: JSON.stringify({ message: getPreviewMessage() }),
      headers: { "Content-Type": "application/json" },
    });
    setTemplateLoading(false);
    if (res.ok) {
      setTemplateMsg("Test message sent to Telegram!");
      setShowTestModal(false);
    } else {
      setTemplateMsg("Failed to send test message.");
    }
  }

  async function handleDelete(leadId: string) {
    const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l._id !== leadId));
    }
  }

  // Both message banks use "successfully"/"!" as the success tell, same as before.
  const profileOk = profileMsg.includes("successfully");
  const templateOk = templateMsg.includes("successfully") || templateMsg.includes("sent");
  const soundOk = soundMsg.includes("!");

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your profile, your lead sound, and what the Telegram bot shouts.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-6">
            {/* Profile */}
            <section className={cardClass}>
              <h2 className="text-[15px] font-semibold tracking-tight">Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Leave the password fields empty to keep your current one.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Display name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Telegram handle</label>
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                    <input
                      type="text"
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value.replace("@", ""))}
                      placeholder="username"
                      className={`${fieldClass} pl-7`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className={fieldClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={fieldClass}
                  />
                </div>
              </div>

              {profileMsg && (
                <p className={`mt-4 text-[13px] ${profileOk ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {profileMsg}
                </p>
              )}

              <button onClick={handleProfileSave} disabled={profileLoading} className={`${primaryButton} mt-5`}>
                {profileLoading ? "Saving…" : "Save changes"}
              </button>
            </section>

            {/* Lead sound */}
            <section className={cardClass}>
              <h2 className="text-[15px] font-semibold tracking-tight">Lead sound</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Plays on every dashboard when a lead lands. Max 10 seconds.
              </p>

              <audio
                ref={audioRef}
                onError={(e) => {
                  const target = e.target as HTMLAudioElement;
                  console.error("Settings Audio Error:", target.error);
                }}
              />

              <div className="mt-5 flex flex-wrap gap-2">
                {soundUrl ? (
                  <>
                    <button onClick={() => handlePreview()} className={secondaryButton}>
                      <Play className="size-3.5 fill-current" /> Preview
                    </button>
                    <motion.button
                      animate={shouldShake ? { x: [-6, 6, -6, 6, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      onClick={() => fileInputRef.current?.click()}
                      className={secondaryButton}
                    >
                      <RefreshCcw className="size-3.5" /> Replace
                    </motion.button>
                    <button
                      onClick={handleSoundDelete}
                      disabled={soundLoading}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </button>
                  </>
                ) : (
                  <motion.button
                    animate={shouldShake ? { x: [-6, 6, -6, 6, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={soundLoading}
                    className={primaryButton}
                  >
                    <Upload className="size-4" />
                    {soundLoading ? "Uploading…" : "Upload sound"}
                  </motion.button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleSoundUpload}
              />

              {soundMsg && (
                <p className={`mt-4 text-[13px] ${soundOk ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  {soundMsg}
                </p>
              )}
            </section>

            {/* Your previous uploads */}
            <section className={cardClass}>
              <h2 className="text-[15px] font-semibold tracking-tight">Your uploads</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sounds you have uploaded before. Click the star to re-apply one.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {libraryLoading ? (
                  <p className="col-span-full py-6 text-center text-sm text-muted-foreground">Loading…</p>
                ) : globalSounds.length === 0 ? (
                  <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                    Nothing uploaded yet.
                  </p>
                ) : (
                  globalSounds
                    .filter(sound => `data:${sound.mimeType};base64,${sound.base64}` !== soundUrl)
                    .slice(0, 2)
                    .map((sound) => (
                    <div
                      key={sound._id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted">
                          <Music2 className="size-4 text-muted-foreground" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{sound.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {sound.mimeType.split('/')[1]?.toUpperCase() || "AUDIO"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => handlePreview(`data:${sound.mimeType};base64,${sound.base64}`)}
                          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Preview"
                        >
                          <Play className="size-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => handleApplyGlobalSound(sound)}
                          disabled={soundLoading}
                          className="flex size-8 cursor-pointer items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          title="Use this sound"
                        >
                          <Check className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Bot template */}
            <section className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold tracking-tight">Telegram message</h2>
                {leadMessageTemplate && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Custom template
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Use <code className="rounded border bg-muted px-1 py-0.5 text-xs">{`{name}`}</code> for the
                agent and <code className="rounded border bg-muted px-1 py-0.5 text-xs">{`{campaign}`}</code> for
                the campaign.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                {leadMessageTemplate && (
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Preview</p>
                    <p className="mt-1 text-sm break-words">{getPreviewMessage()}</p>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    value={leadMessageTemplate}
                    onChange={(e) => setLeadMessageTemplate(e.target.value.slice(0, 500))}
                    placeholder="Example: 🔥 {name} JUST COOKED ON {campaign}! 🔥"
                    maxLength={500}
                    className={`${fieldClass} h-32 resize-none pb-8`}
                  />
                  <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                    {leadMessageTemplate.length} / 500
                  </span>
                </div>

                {templateMsg && (
                  <p className={`text-[13px] ${templateOk ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {templateMsg}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button onClick={handleTemplateSave} disabled={templateLoading} className={primaryButton}>
                    {templateLoading ? "Saving…" : "Save template"}
                  </button>
                  <button onClick={() => setShowTestModal(true)} className={secondaryButton}>
                    <Play className="size-3.5" /> Send a test
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Lead history */}
          <section className={`${cardClass} h-fit`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold tracking-tight">Your leads</h2>
              <span className="text-xs text-muted-foreground">{leads.length}</span>
            </div>

            <div className="mt-4 flex max-h-200 flex-col gap-2 overflow-y-auto">
              {historyLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
              ) : leads.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No leads logged yet.</p>
              ) : (
                leads.map((lead) => (
                  <motion.div
                    key={lead._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{lead.campaignId?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(lead._id)}
                      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      title="Delete lead"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {showTestModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTestModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg"
            >
              <h2 className="text-[15px] font-semibold tracking-tight">Message preview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This is what the bot posts. Sending a test fires it for real.
              </p>

              <div className="mt-4 min-h-24 rounded-lg border bg-muted/50 p-4">
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {leadMessageTemplate ? getPreviewMessage() : "No template set yet."}
                </p>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setShowTestModal(false)} className={secondaryButton}>
                  Cancel
                </button>
                <button
                  onClick={handleSendTest}
                  disabled={!leadMessageTemplate || templateLoading}
                  className={primaryButton}
                >
                  {templateLoading ? "Sending…" : "Send test"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
