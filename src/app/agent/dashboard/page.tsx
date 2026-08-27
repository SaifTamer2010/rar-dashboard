"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CampaignModal from "@/components/CampaignModal";
import Celebration from "@/components/Celebration";
import { pusherClient } from "@/lib/pusher-client";
import { useSession } from "next-auth/react";
import { formatDashboardMessage } from "@/lib/formatDashboard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeadsStats } from "@/store/slices/leadsSlice";
import { motion, AnimatePresence } from "framer-motion";
import FeatureUpdateModal from "@/components/FeatureUpdateModal";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { roleHome } from "@/lib/roles";

/** Matches the sign-in page fields so both surfaces read as one system. */
const fieldClass =
  "rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-[box-shadow,border-color] focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10";

const secondaryButton =
  "cursor-pointer rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

const cardClass = "rounded-xl border bg-background";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const byUser = useAppSelector((state) => state.leads.byUser);
  const byCampaign = useAppSelector((state) => state.leads.byCampaign);
  const byTotal = useAppSelector((state) => state.leads.totalLeads);
  const lastLead = useAppSelector((state) => state.leads.lastLead);
  const status = useAppSelector((state) => state.leads.status);

  const loading = status === "loading";

  const [modalOpen, setModalOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundCacheRef = useRef<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [shameActive, setShameActive] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const isViewer = session?.user?.role === "viewer";
  // Agents own this page; super admins may peek. Leaders and owners have their own.
  const isAgentSurface =
    !session || ["agent", "super_admin"].includes(session.user?.role ?? "");

  useEffect(() => {
    if (sessionStatus === "loading" || isAgentSurface) return;
    router.push(roleHome(session?.user?.role));
  }, [sessionStatus, isAgentSurface, session, router]);

  const fetchStats = useCallback((params?: { startDate?: string; endDate?: string }) => {
    dispatch(fetchLeadsStats(params));
  }, [dispatch]);

  const handleCloseUpdateModal = useCallback(async () => {
    setShowUpdateModal(false);
    try {
      await fetch("/api/user/check-version", { method: "POST" });
    } catch (err) {
      console.error("Failed to mark version as seen", err);
    }
  }, []);

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchStats({ startDate: dateRange.start, endDate: dateRange.end });
    } else {
      fetchStats();
    }
  }, [dateRange, fetchStats]);

  function handleResetFilters() {
    setDateRange({ start: "", end: "" });
  }

  function handleLeadSuccess() {
    setCelebrate(false);
    setTimeout(() => setCelebrate(true), 10); // reset then trigger
    setModalOpen(false);
    if (dateRange.start && dateRange.end) {
      fetchStats({ startDate: dateRange.start, endDate: dateRange.end });
    } else {
      fetchStats();
    }
  }

  useEffect(() => {
    function unlock() {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    }

    document.addEventListener("click", unlock, { once: false });
    return () => document.removeEventListener("click", unlock);
  }, []);

  useEffect(() => {
    fetch("/api/user/check-version")
      .then(res => res.json())
      .then(data => {
        if (data.showModal) {
          setShowUpdateModal(true);
        }
      })
      .catch(err => console.error("Version check failed", err));
  }, []);

  useEffect(() => {
    // Initial fetch handled by dateRange effect

    const channel = pusherClient.subscribe("leads-channel");
    channel.bind("force-refresh", () => {
      window.location.reload();
    });
    channel.bind(
      "lead-added",
      async (payload: { userName: string; userId: string; campaignName?: string }) => {

        toast.success(
          `${payload.userName} got a lead on ${payload.campaignName ?? "a campaign"}`,
        );

        // Re-fetch only if on "Today" view (no manual date range)
        if (!dateRange.start || !dateRange.end) {
          fetchStats();
        }

        let soundUrl = soundCacheRef.current[payload.userId];

        if (!soundUrl) {
          const res = await fetch(`/api/sounds/${payload.userId}`);
          const data = await res.json();
          if (data.soundUrl) {
            soundUrl = data.soundUrl;
            soundCacheRef.current[payload.userId] = soundUrl;
          }
        }


        if (soundUrl) {
          const audio = new Audio(soundUrl);
          await audio.play().catch(() => {});
        }
      },
    );

    channel.bind("shame-bell", (payload: { minutesSinceLastLead: number }) => {
      setShameActive(true);
      setTimeout(() => setShameActive(false), 10000);

      const utterance = new SpeechSynthesisUtterance(
        `That's a shame. No leads for ${payload.minutesSinceLastLead} minutes. Last Lead was by ${lastLead?.userId?.name || "someone"}. Get back to work nigga.`,
      );

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.name.includes("Google US English")) ||
        voices.find((v) => v.lang === "en-US") ||
        voices[0];

      if (preferred) utterance.voice = preferred;
      utterance.rate = 1.1;
      utterance.pitch = 0.7;
      utterance.volume = 1;

      utterance.onend = () => {
        const audio = new Audio("/whip-soundeffect.mp3");
        audio.play().catch(() => { });
      };

      window.speechSynthesis.speak(utterance);
    });

    return () => {
      pusherClient.unsubscribe("leads-channel");
    };
  }, [fetchStats, lastLead?.userId?.name, dateRange.start, dateRange.end]);

  function handleCopy() {
    const message = formatDashboardMessage(
      byUser,
      byCampaign,
      byTotal,
      lastLead,
      "eldawlyyyy",
    );
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendTelegram() {
    setSending(true);
    // If it's a date range, we might want a different message, but for now reuse the standard one
    const res = await fetch("/api/telegram/send-dashboard", { method: "POST" });
    setSending(false);
    if (res.ok) {
      alert("Sent to Telegram!");
    } else {
      alert("Failed to send");
    }
  }

  if (!isAgentSurface) return null;

  const hasRange = Boolean(dateRange.start && dateRange.end);
  const rangeLabel = hasRange ? `${dateRange.start} → ${dateRange.end}` : "Today · live";
  const topCount = byUser[0]?.count ?? 0;
  const campaignTop = byCampaign.reduce((max, row) => Math.max(max, row.count), 0);

  const stats = [
    { label: "Total leads", value: byTotal, hint: rangeLabel },
    { label: "Active ringers", value: byUser.length, hint: "logged at least one" },
    { label: "Campaigns", value: byCampaign.length, hint: "with activity" },
    {
      label: "Avg. per ringer",
      value: byUser.length ? (byTotal / byUser.length).toFixed(1) : "0.0",
      hint: "leads per person",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <main className="mx-auto flex max-w-300 flex-col gap-6 px-6 pt-8 pb-16">

        {/* Page heading */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[26px] font-semibold tracking-tight">Lead activity</h1>
            <p className="text-sm text-muted-foreground">{rangeLabel}</p>
          </div>
          {!isViewer && (
            <button
              onClick={() => setModalOpen(true)}
              className="h-10 cursor-pointer rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
             Log Lead
            </button>
          )}
        </div>

        {/* Filter bar */}
        <section className={cn(cardClass, "flex flex-wrap items-end gap-4 p-4")}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="start" className="text-xs font-medium text-muted-foreground">
              Start date
            </label>
            <input
              id="start"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className={fieldClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="end" className="text-xs font-medium text-muted-foreground">
              End date
            </label>
            <input
              id="end"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className={fieldClass}
            />
          </div>

          <button
            onClick={handleResetFilters}
            disabled={!dateRange.start && !dateRange.end}
            className={secondaryButton}
          >
            Reset
          </button>

          <div className="ml-auto flex gap-2">
            <button onClick={handleCopy} className={secondaryButton}>
              {copied ? "Copied" : "Copy summary"}
            </button>
            <button onClick={handleSendTelegram} disabled={sending} className={secondaryButton}>
              {sending ? "Sending…" : "Send to team"}
            </button>
          </div>
        </section>

        {/* Stat tiles */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className={cn(cardClass, "flex flex-col gap-1.5 p-4.5")}>
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              <span className="text-3xl leading-none font-semibold tracking-tighter">
                {stat.value}
              </span>
              <span className="truncate text-xs text-muted-foreground/70">{stat.hint}</span>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.4fr_1fr]">

          {/* Leaderboard */}
          <section className={cn(cardClass, "overflow-hidden")}>
            <header className="flex items-end justify-between gap-4 border-b px-5 py-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">Top R&amp;R Ringers</h2>
                <p className="text-[13px] text-muted-foreground">{rangeLabel}</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-semibold tracking-tight">{byTotal}</span>
                <span className="text-xs text-muted-foreground">total leads</span>
              </div>
            </header>

            <div className="flex flex-col">
              <AnimatePresence mode="popLayout">
                {byUser.map((row, index) => {
                  const isTop = index === 0;
                  return (
                    <motion.div
                      layout
                      key={row.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={cn(
                        "flex items-center justify-between gap-4 border-b px-5 py-4 last:border-b-0",
                        isTop && "bg-muted/50"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div
                          className={cn(
                            "flex size-7.5 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold",
                            isTop
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium">{row.name}</span>
                          {isTop && (
                            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                              Team MVP
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        <div className="hidden h-1.5 w-30 overflow-hidden rounded-full bg-muted sm:block">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${topCount ? (row.count / topCount) * 100 : 0}%` }}
                            className={cn(
                              "h-full rounded-full",
                              isTop ? "bg-primary" : "bg-muted-foreground/40"
                            )}
                          />
                        </div>
                        <span className="min-w-8 text-right text-base font-semibold">
                          {row.count}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {loading && byUser.length === 0 && (
                <div className="flex animate-pulse flex-col">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 border-b bg-muted/40 last:border-b-0" />
                  ))}
                </div>
              )}

              {!loading && byUser.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No leads in this range yet.
                </p>
              )}
            </div>
          </section>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Recent pulse */}
            {lastLead && (
              <section className={cn(cardClass, "flex flex-col gap-3.5 px-5 py-5")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Recent pulse</h3>
                  <span className="flex items-center gap-1.5 text-[11px] tracking-widest text-muted-foreground/70 uppercase">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-medium">{lastLead.userId?.name}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {lastLead.campaignId?.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/70">
                    {new Date(lastLead.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </section>
            )}

            {/* Campaign distribution */}
            <section className={cn(cardClass, "overflow-hidden")}>
              <header className="border-b px-5 py-4">
                <h3 className="text-sm font-semibold">Campaign distribution</h3>
              </header>
              <div className="flex flex-col">
                {byCampaign.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-4 border-b px-5 py-3.5 last:border-b-0"
                  >
                    <span className="truncate text-[13px] text-foreground/80">{row.name}</span>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="h-1.5 w-22 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${campaignTop ? (row.count / campaignTop) * 100 : 0}%`,
                          }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                      <span className="min-w-7 text-right text-sm font-semibold">{row.count}</span>
                    </div>
                  </div>
                ))}

                {byCampaign.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Nothing to show yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {shameActive && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="w-100 rounded-xl border-2 border-destructive bg-background p-8 text-center shadow-2xl">
            <video
              src="/get-to-work-work.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="mx-auto mb-4 size-74 rounded-lg object-cover"
            />
            <p className="text-2xl font-bold text-destructive">
              NIGGASSS BACK TO WORKKKKK
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              MONEY ISNT GONNA PRINT ITSELFF
            </p>
          </div>
        </div>
      )}

      <CampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleLeadSuccess}
      />
      <Celebration trigger={celebrate} />
      <AnimatePresence>
        {showUpdateModal && (
          <FeatureUpdateModal
            isOpen={showUpdateModal}
            onClose={handleCloseUpdateModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
