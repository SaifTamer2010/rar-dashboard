"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, X } from "lucide-react";
import toast from "react-hot-toast";

/** Invite link modal — shows the lobby link and copies it on open. */
export default function InviteModal({ onClose }: { onClose: () => void }) {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/busniess/invite");

      if (!res.ok) {
        if (!cancelled) setError("Could not create an invite link.");
        return;
      }

      const data = await res.json();
      if (cancelled) return;

      const url = `${window.location.origin}/join/${data.token}`;
      setLink(url);

      // Copy straight away so the owner can just paste it.
      copy(url, { silent: true });
    }

    load().catch(() => {
      if (!cancelled) setError("Could not create an invite link.");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function copy(value: string, opts?: { silent?: boolean }) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (!opts?.silent) toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      if (!opts?.silent) toast.error("Could not copy — copy it by hand");
    }
  }

  // Escape closes, same as clicking the backdrop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  // The navbar sets backdrop-blur, which makes it a containing block for fixed
  // children — without a portal this overlay only covers the header.
  return createPortal(
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
            <h2 className="text-[15px] font-semibold tracking-tight">Invite your team</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Anyone with this link can join your lobby as an agent.
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

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <div className="flex items-center gap-1 rounded-lg border bg-background p-1 pl-3 focus-within:border-muted-foreground">
              <input
                readOnly
                value={link}
                placeholder="Making a link…"
                onFocus={(e) => e.currentTarget.select()}
                className="w-full bg-transparent py-1.5 text-sm outline-none"
              />
              <button
                onClick={() => link && copy(link)}
                disabled={!link}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50"
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="mt-2.5 text-xs text-muted-foreground">
              {copied ? "Copied to clipboard." : "Send it to whoever should join."}
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
