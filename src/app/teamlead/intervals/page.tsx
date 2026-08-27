"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeadsStats } from "@/store/slices/leadsSlice";
import { formatDashboardMessage } from "@/lib/formatDashboard";
import { useSession } from "next-auth/react";
import RoleGate from "@/components/RoleGate";
import { cn } from "@/lib/utils";

const fieldClass =
  "rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-[box-shadow,border-color] focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10";

const secondaryButton =
  "cursor-pointer rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

const cardClass = "rounded-xl border bg-background";

export default function TeamLeadIntervalsPage() {
  return (
    <RoleGate role="team_leader">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  const byUser = useAppSelector((state) => state.leads.byUser);
  const byCampaign = useAppSelector((state) => state.leads.byCampaign);
  const byTotal = useAppSelector((state) => state.leads.totalLeads);
  const lastLead = useAppSelector((state) => state.leads.lastLead);

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      dispatch(fetchLeadsStats({ startDate: dateRange.start, endDate: dateRange.end }));
    } else {
      dispatch(fetchLeadsStats());
    }
  }, [dispatch, dateRange]);

  const hasRange = Boolean(dateRange.start && dateRange.end);
  const rangeLabel = hasRange ? `${dateRange.start} → ${dateRange.end}` : "Today · live";
  const campaignTop = byCampaign.reduce((max, row) => Math.max(max, row.count), 0) || 1;

  const stats = [
    { label: "Total leads", value: byTotal, hint: rangeLabel },
    { label: "Active agents", value: byUser.length, hint: "logged at least one" },
    { label: "Campaigns", value: byCampaign.length, hint: "on your team" },
    {
      label: "Avg. per agent",
      value: byUser.length ? (byTotal / byUser.length).toFixed(1) : "0.0",
      hint: "leads per person",
    },
  ];

  function handleCopy() {
    navigator.clipboard.writeText(
      formatDashboardMessage(byUser, byCampaign, byTotal, lastLead, session?.user?.name ?? ""),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendTelegram() {
    setSending(true);
    const res = await fetch("/api/telegram/send-dashboard", { method: "POST" });
    setSending(false);

    if (res.ok) {
      toast.success("Sent to Telegram");
    } else {
      toast.error("Failed to send");
    }
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <main className="mx-auto flex max-w-300 flex-col gap-6 px-6 pt-8 pb-16">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-semibold tracking-tight">Intervals</h1>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
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
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
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
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className={fieldClass}
            />
          </div>

          <button
            onClick={() => setDateRange({ start: "", end: "" })}
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
          {/* Agents */}
          <section className={cn(cardClass, "overflow-hidden")}>
            <header className="flex items-end justify-between gap-4 border-b px-5 py-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">Your agents</h2>
                <p className="text-[13px] text-muted-foreground">{rangeLabel}</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-semibold tracking-tight">{byTotal}</span>
                <span className="text-xs text-muted-foreground">total leads</span>
              </div>
            </header>

            {byUser.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                No agents on your team have logged a lead yet.
              </p>
            ) : (
              byUser.map((row, index) => (
                <motion.div
                  key={row.name}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.15, ease: "easeOut" }}
                  className={cn(
                    "flex items-center justify-between gap-4 border-b px-5 py-4 last:border-b-0",
                    index === 0 && "bg-muted/50",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div
                      className={cn(
                        "flex size-7.5 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold",
                        index === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>
                    <span className="truncate text-sm font-medium">{row.name}</span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-semibold tracking-tight">{row.count}</span>
                    <span className="text-xs text-muted-foreground">leads</span>
                  </div>
                </motion.div>
              ))
            )}
          </section>

          {/* Campaigns */}
          <section className={cn(cardClass, "overflow-hidden")}>
            <header className="border-b px-5 py-5">
              <h2 className="text-base font-semibold">Campaigns</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Where the leads came from.
              </p>
            </header>

            {byCampaign.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                No campaigns assigned to your team yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3.5 p-5">
                {byCampaign.map((row) => (
                  <div key={row.name} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm">{row.name}</span>
                      <span className="text-sm font-medium">{row.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        style={{ width: `${(row.count / campaignTop) * 100}%` }}
                        className="h-full rounded-full bg-muted-foreground/40"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
