"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCampaigns } from "@/store/slices/campaignsSlice";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CampaignModal({ open, onClose, onSuccess }: Props) {
  // Content mounts fresh on every open, so the picked campaign resets itself.
  return (
    <AnimatePresence>
      {open && <ModalContent onClose={onClose} onSuccess={onSuccess} />}
    </AnimatePresence>
  );
}

function ModalContent({ onClose, onSuccess }: Omit<Props, "open">) {
  const dispatch = useAppDispatch();
  const { list: campaigns, status } = useAppSelector((state) => state.campaigns);
  const fetching = status === "loading";

  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCampaigns());
    }
  }, [status, dispatch]);

  // Escape closes, same as clicking the backdrop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        body: JSON.stringify({ campaignId: selected }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("submit lead error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-128 rounded-xl border bg-background p-5 shadow-lg"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight">Log a lead</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Pick the campaign it came in on.
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

          <div className="mb-4 max-h-[50vh] overflow-y-auto">
            {fetching ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-13 animate-pulse rounded-lg border bg-muted" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-[13px] text-muted-foreground">
                No campaigns on your team yet. Ask your business owner to assign one.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {campaigns.map((c) => {
                  const isSelected = selected === c._id;
                  return (
                    <button
                      key={c._id}
                      onClick={() => setSelected(c._id)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                        isSelected
                          ? "border-foreground/30 bg-muted font-medium"
                          : "bg-background hover:bg-muted/60",
                      )}
                    >
                      <span className="truncate">{c.name}</span>
                      {isSelected && <Check className="size-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selected || loading}
              className="cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Logging…" : "Log lead"}
            </button>
          </div>
        </motion.div>
    </div>
  );
}
