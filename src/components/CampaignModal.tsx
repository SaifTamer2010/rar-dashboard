"use client";

import { useState, useEffect } from "react";
// import { useCelebration } from "@/hooks/useCelebration";

interface Campaign {
  _id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CampaignModal({ open, onClose, onSuccess }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // const { celebrate } = useCelebration();

  useEffect(() => {
    if (!open) return;
    setSelected("");
    setFetching(true);

    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(data.campaigns || []))
      .finally(() => setFetching(false));
  }, [open]);

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
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("submit lead error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={() => onClose()}
    >
      <div
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <h2 className="text-xl font-bold text-white mb-1">🔥🥵🔥🥵</h2>
        <p className="text-gray-400 text-sm mb-6">
          Gebt el Lead feen ylo2mooooo
        </p>

        {fetching ? (
          <select
            className={`w-full text-left px-4 py-3 rounded-md border transition 
                  border-blue-500 bg-slate-700 text-white
                text-gray-300 hover:border-gray-500 animate-pulse
                mb-6
              `}
          >
            <option disabled value="">
              Choose campaign ylo2moooo
            </option>
          </select>
        ) : (
          <div className="space-y-3 mb-6">
            <select
              className={`w-full text-left px-4 py-3 rounded-md border transition 
                  border-blue-500 bg-slate-700 text-white
                text-gray-300 hover:border-gray-500 
              `}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option disabled value="">
                Choose campaign ylo2moooo
              </option>
              {campaigns.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || loading}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition"
          >
            {loading ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
