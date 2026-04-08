"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCampaigns } from "@/store/slices/campaignsSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, Check } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CampaignModal({ open, onClose, onSuccess }: Props) {
  const dispatch = useAppDispatch();
  const { list: campaigns, status } = useAppSelector((state) => state.campaigns);
  const fetching = status === "loading";

  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected("");
      if (status === "idle") {
        dispatch(fetchCampaigns());
      }
    }
  }, [open, status, dispatch]);

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
        // Add a nice toast later if needed, but keeping logic for now
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("submit lead error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-slate-900/60 backdrop-blur-3xl border-2 border-blue-500/20 rounded-[3rem] p-8 w-full max-w-4xl shadow-2xl shadow-blue-500/10"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-gray-500 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <header className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Flame className="w-6 h-6 text-white animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                  NEW <span className="text-blue-400">LEAD</span>
                </h2>
              </div>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest bg-white/5 inline-block px-3 py-1 rounded-lg">
                Gebt el Lead feen ylo2mooooo
              </p>
            </header>

            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {fetching ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />
                  ))
                ) : (
                  campaigns.map((c) => {
                    const isSelected = selected === c._id;
                    return (
                      <motion.button
                        key={c._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelected(c._id)}
                        className={`relative flex items-center justify-between p-6 rounded-[1.8rem] border-2 transition-all text-left ${isSelected
                          ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20"
                          : "bg-slate-950/40 border-white/5 hover:border-blue-500/20"
                          }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className={`text-lg font-black ${isSelected ? "text-white" : "text-gray-400"}`}>
                            {c.name}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Available</span>
                        </div>
                        {isSelected && (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-400 font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all underline decoration-gray-700 underline-offset-4"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selected || loading}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>CONFIRM PRINT <Check className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
