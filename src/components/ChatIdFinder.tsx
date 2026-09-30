"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiscoveredChat } from "@/lib/telegram";

/**
 * Lists the chats a business's Telegram bot can currently see, so nobody has to
 * hunt for a numeric chat id by hand.
 *
 * Shared by the business settings page (the fallback chat) and the teams page
 * (a team's own chat) — it lived in both files verbatim before.
 */
export default function ChatIdFinder({
  disabled,
  onPick,
}: {
  disabled?: boolean;
  onPick: (chatId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<DiscoveredChat[] | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function load() {
    setLoading(true);

    const res = await fetch("/api/telegram/chat-id");
    const body = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      toast.error(body.error || "Could not read this bot\u2019s chats");
      setOpen(false);
      return;
    }

    setChats(body.chats ?? []);
    setHint(body.hint ?? null);
  }

  function openFinder() {
    setChats(null);
    setHint(null);
    setOpen(true);
    load();
  }

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openFinder}
        disabled={disabled}
        title={disabled ? "Save a bot token first" : "List the chats your bot can see"}
        className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Search className="size-3.5" />
        Find my chat ID
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Find your Telegram chat id"
            className="max-h-[80vh] w-full max-w-120 overflow-y-auto rounded-xl border bg-background p-5 shadow-lg"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight">Find your chat ID</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Add your bot to the group, send any message there, then pick the group below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {loading && (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-13 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!loading && chats?.length === 0 && (
              <p className="rounded-lg border border-dashed p-3 text-[13px] text-muted-foreground">
                {hint ?? "No chats found yet."}
              </p>
            )}

            {!loading && !!chats?.length && (
              <div className="overflow-hidden rounded-lg border">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => {
                      onPick(chat.id);
                      setOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 border-b px-3 py-2 text-left transition-colors last:border-0 hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{chat.title}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {chat.id}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {chat.type}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Telegram forgets messages older than 24 hours.
              </p>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                Look again
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
