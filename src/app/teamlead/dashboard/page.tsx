"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import RoleGate from "@/components/RoleGate";
import { cn } from "@/lib/utils";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

type Bucket = { hour: number; label: string; count: number };
type Achiever = { name: string; count: number };

const cardClass = "rounded-xl border bg-background";

const fieldClass =
  "rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-[box-shadow,border-color] focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10";

const secondaryButton =
  "cursor-pointer rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

export default function TeamLeadDashboardPage() {
  return (
    <RoleGate role="team_leader">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [shiftTotal, setShiftTotal] = useState(0);
  const [achievers, setAchievers] = useState<Achiever[]>([]);
  const [lastAchievers, setLastAchievers] = useState<Achiever[]>([]);
  const [previousShift, setPreviousShift] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  // Hourly shift breakdown, 3 PM through 5 AM.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const query = date ? `?date=${date}` : "";
      const res = await fetch(`/api/leads/intervals${query}`);
      const data = res.ok ? await res.json() : null;
      if (cancelled) return;

      setBuckets(data?.buckets ?? []);
      setShiftTotal(data?.totalLeads ?? 0);
      setAchievers(data?.topAchievers ?? []);
      setLastAchievers(data?.previousTopAchievers ?? []);
      setPreviousShift(data?.previousShiftStart ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [date]);

  const hourTop = buckets.reduce((max, b) => Math.max(max, b.count), 0) || 1;
  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto flex max-w-300 flex-col gap-6 px-6 pt-8 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[26px] font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              How the shift is going, hour by hour.
            </p>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="shift-date" className="text-xs font-medium text-muted-foreground">
                Shift date
              </label>
              <input
                id="shift-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass}
              />
            </div>

            <button onClick={() => setDate("")} disabled={!date} className={secondaryButton}>
              Reset
            </button>
          </div>
        </div>

        {/* Bento: the hourly card holds the left two columns, small cards stack right. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr]">
          <section className={cn(cardClass, "overflow-hidden lg:col-span-2 lg:row-span-3")}>
            <header className="flex flex-wrap items-end justify-between gap-4 border-b px-5 py-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">Hourly intervals</h2>
                <p className="text-[13px] text-muted-foreground">
                  3 PM to 5 AM · {date || "current shift"}
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-semibold tracking-tight">{shiftTotal}</span>
                <span className="text-xs text-muted-foreground">leads this shift</span>
              </div>
            </header>

            {loading ? (
              <SkeletonRegion
                className="flex flex-col gap-2.5 p-5"
                label="Loading hourly intervals"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-14 shrink-0" />
                    <Skeleton className="h-2 flex-1 rounded-full" />
                    <Skeleton className="h-3 w-6 shrink-0" />
                  </div>
                ))}
              </SkeletonRegion>
            ) : buckets.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                Nothing to break down yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5 p-5">
                {buckets.map((bucket) => (
                  <div key={bucket.hour} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-xs text-muted-foreground">
                      {bucket.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        style={{ width: `${(bucket.count / hourTop) * 100}%` }}
                        className={cn(
                          "h-full rounded-full",
                          bucket.count === hourTop && bucket.count > 0
                            ? "bg-foreground"
                            : "bg-muted-foreground/40",
                        )}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-medium">
                      {bucket.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top 3 right now */}
          <AchieverCard
            title="Top achievers"
            subtitle={`This shift · ${date || "today"}`}
            achievers={achievers}
            empty="Nobody has logged a lead yet."
          />

          {/* Top 3 of the shift before this one */}
          <AchieverCard
            title="Top achievers"
            subtitle={`Last shift${previousShift ? ` · ${previousShift.slice(0, 10)}` : ""}`}
            achievers={lastAchievers}
            empty="Nobody logged a lead last shift."
          />

          {/* Shift total */}
          <section className={cn(cardClass, "flex flex-col gap-1.5 p-5")}>
            <span className="text-xs font-medium text-muted-foreground">Leads this shift</span>
            <span className="text-3xl leading-none font-semibold tracking-tighter">
              {shiftTotal}
            </span>
            <span className="text-xs text-muted-foreground/70">3 PM to 5 AM</span>
          </section>
        </div>
      </main>
    </div>
  );
}

function AchieverCard({
  title,
  subtitle,
  achievers,
  empty,
}: {
  title: string;
  subtitle: string;
  achievers: Achiever[];
  empty: string;
}) {
  return (
    <section className={cn(cardClass, "overflow-hidden")}>
      <header className="flex items-center gap-2.5 border-b px-5 py-4">
        <Trophy className="size-4 shrink-0 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-[13px] text-muted-foreground">{subtitle}</p>
        </div>
      </header>

      {achievers.length === 0 ? (
        <p className="px-5 py-4 text-[13px] text-muted-foreground">{empty}</p>
      ) : (
        achievers.map((achiever, index) => (
          <div
            key={achiever.name}
            className="flex items-center gap-3 border-b px-5 py-3 last:border-0"
          >
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-medium",
                index === 0 ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{achiever.name}</span>
            <span className="shrink-0 text-sm">
              <span className="font-medium">{achiever.count}</span>{" "}
              <span className="text-xs text-muted-foreground">leads</span>
            </span>
          </div>
        ))
      )}
    </section>
  );
}
