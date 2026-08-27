"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeadsStats } from "@/store/slices/leadsSlice";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const dispatch = useAppDispatch();
  const { byUser, totalLeads, status } = useAppSelector((state) => state.leads);
  const loading = status === "loading";

  useEffect(() => {
    dispatch(fetchLeadsStats({ allTime: true }));
  }, [dispatch]);

  const sortedUsers = [...byUser].sort((a, b) => b.count - a.count);
  const top = sortedUsers[0]?.count || 1;

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All-time leads for your team.
            </p>
          </div>

          <div className="rounded-lg border bg-background px-4 py-2.5 text-right">
            <div className="text-2xl font-semibold tracking-tight">{totalLeads}</div>
            <div className="text-xs text-muted-foreground">Total leads</div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background">
          {loading && sortedUsers.length === 0 ? (
            <div className="flex flex-col gap-px">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 animate-pulse bg-muted" />
              ))}
            </div>
          ) : sortedUsers.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No leads logged yet. Nobody on the board.
            </p>
          ) : (
            sortedUsers.map((user, index) => (
              <motion.div
                key={user.name}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.15, ease: "easeOut" }}
                className="flex items-center gap-4 border-b px-4 py-3 last:border-0"
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-medium",
                    index === 0
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  {index === 0 && <Trophy className="size-3.5 shrink-0 text-muted-foreground" />}
                </div>

                {/* Share of the leader's count, so the gap is readable at a glance. */}
                <div className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-muted sm:block">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.count / top) * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      index === 0 ? "bg-foreground" : "bg-muted-foreground/40",
                    )}
                  />
                </div>

                <div className="w-16 shrink-0 text-right text-sm">
                  <span className="font-medium">{user.count}</span>{" "}
                  <span className="text-xs text-muted-foreground">leads</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
