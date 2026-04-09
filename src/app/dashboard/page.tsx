"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import CampaignModal from "@/components/CampaignModal";
import Celebration from "@/components/Celebration";
import { pusherClient } from "@/lib/pusher-client";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { formatDashboardMessage } from "@/lib/formatDashboard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeadsStats } from "@/store/slices/leadsSlice";
import DashboardNavbar from "@/components/DashboardNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Flame, Trophy, TrendingUp, Activity, PlusCircle } from "lucide-react";
import FeatureUpdateModal from "@/components/FeatureUpdateModal";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { byUser, byCampaign, totalLeads: byTotal, lastLead, status } = useAppSelector((state) => state.leads);
  const loading = status === "loading";

  const [modalOpen, setModalOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [shameActive, setShameActive] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  function enableSound() {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    audioContextRef.current.resume();
    setSoundEnabled(true);
  }

  const { data: session } = useSession();
  const isViewer = session?.user?.role === "viewer";

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
      async (payload: { userName: string; userId: string }) => {

        // Re-fetch only if on "Today" view (no manual date range)
        if (!dateRange.start || !dateRange.end) {
          fetchStats();
        }

        const res = await fetch(`/api/sounds/${payload.userId}`);
        const data = await res.json();


        if (data.soundUrl) {

          const audio = new Audio(data.soundUrl);
          await audio.play().catch(() => {});
        } else {

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
        const audio = new Audio("/whip-soundeffect.mp4");
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 pb-32">
      <DashboardNavbar />

      <div className="max-w-7xl mx-auto space-y-8">


        {/* Date Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-6 bg-slate-900/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border-2 border-blue-500/20 shadow-2xl shadow-blue-500/5"
        >
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1">Start Date</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/40 group-hover:text-blue-500 transition-colors pointer-events-none" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-slate-950/80 border-2 border-white/5 group-hover:border-blue-500/30 focus:border-blue-500/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer !color-scheme-dark"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1">End Date</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/40 group-hover:text-blue-500 transition-colors pointer-events-none" />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-slate-950/80 border-2 border-white/5 group-hover:border-blue-500/30 focus:border-blue-500/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer !color-scheme-dark"
              />
            </div>
          </div>

          <div className="flex items-end h-[74px]">
            <button
              onClick={handleResetFilters}
              className={`flex items-center gap-2 h-12 px-8 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${dateRange.start || dateRange.end
                ? "bg-red-500/10 text-red-500 border-2 border-red-500/20 hover:bg-red-500 hover:text-white"
                : "bg-slate-800/50 text-gray-600 border-2 border-white/5 cursor-not-allowed"
                }`}
            >
              Reset
            </button>
          </div>
        </motion.div>

        {/* Dashboard Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left: Top Performers */}
          <div className="lg:col-span-7 space-y-8">
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border-2 border-blue-500/10 p-8 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-32 h-32 text-blue-400" />
              </div>

              <header className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-4xl font-black bg-gradient-to-r from-blue-300 to-emerald-300 bg-clip-text text-transparent">
                    Top R&R Ringers
                  </h2>
                  <p className="text-gray-500 text-xs mt-2 uppercase tracking-[0.4em] font-bold">
                    {dateRange.start ? `${dateRange.start} TO ${dateRange.end}` : "LIVE PERFORMANCE"}
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">{byTotal}</span>
                  <span className="text-gray-500 text-sm font-bold tracking-tighter uppercase">Total Leads</span>
                </div>
              </header>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {byUser.map((row, index) => {
                    const isTop = index === 0;
                    const isSecond = index === 1;
                    const isThird = index === 2;

                    return (
                      <motion.div
                        layout
                        key={row.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`relative flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all ${isTop ? "bg-blue-600/20 border-blue-500/40 shadow-lg shadow-blue-500/10 scale-105 mb-6"
                          : "bg-slate-950/40 border-white/5 hover:border-blue-500/20"
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${isTop ? "bg-blue-500 text-white rotate-6 shadow-xl"
                            : "bg-slate-800 text-gray-400"
                            }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className={`text-lg font-bold flex items-center gap-2 ${isTop ? "text-white" : "text-gray-200"}`}>
                              {row.name}
                              {isTop && <Flame className="w-5 h-5 text-orange-400 animate-pulse" />}
                              {isSecond && <Trophy className="w-4 h-4 text-slate-300" />}
                              {isThird && <Trophy className="w-4 h-4 text-amber-600" />}
                            </p>
                            {isTop && <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Team MVP</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-3xl font-black ${isTop ? "text-blue-400" : "text-white"}`}>
                            {row.count}
                          </span>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Leads</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {loading && byUser.length === 0 && (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-white/5 rounded-3xl" />
                    ))}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Breaking Activity Card (Relocated to bottom-left) */}
            {lastLead && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] shadow-2xl shadow-blue-600/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Recent Pulse</h4>
                    <p className="text-sm font-bold text-white leading-tight">
                      {lastLead.userId?.name} on {lastLead.campaignId?.name}
                    </p>
                    <p className="text-[10px] text-white/40 font-mono mt-1">
                      {new Date(lastLead.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Campaigns & Actions */}
          <div className="lg:col-span-5 space-y-8">

            {/* Actions Panel */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border-2 border-emerald-500/10 p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-2 uppercase tracking-widest">
                <Activity className="w-5 h-5" /> Live Controls
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleCopy}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border-2 transition-all group ${copied ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400"
                    : "bg-slate-950/40 border-white/5 hover:border-emerald-500/20 text-gray-400"
                    }`}
                >
                  <Activity className={`w-8 h-8 ${copied ? "animate-bounce" : ""}`} />
                  <span className="text-xs font-black uppercase tracking-tighter">Copy JSON</span>
                </button>
                <button
                  onClick={handleSendTelegram}
                  disabled={sending}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-3xl bg-blue-600/10 border-2 border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all group disabled:opacity-40"
                >
                  <TrendingUp className="w-8 h-8 group-hover:scale-125 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-tighter">
                    {sending ? "Sending..." : "Blast Team"}
                  </span>
                </button>
              </div>
            </motion.section>

            {/* Campaign Distribution */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border-2 border-white/5 p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-400 mb-8 flex items-center gap-2 uppercase tracking-widest">
                <TrendingUp className="w-5 h-5" /> Campaigns
              </h3>
              <div className="space-y-4">
                {byCampaign.map((row) => (
                  <div key={row.name} className="flex items-center justify-between p-4 bg-slate-950/20 rounded-2xl border-2 border-white/10 hover:bg-slate-950/40 transition-colors">
                    <span className="text-sm font-bold text-gray-300">{row.name}</span>
                    <div className="flex items-center gap-4">
                      <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(row.count / byTotal) * 100}%` }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                      <span className="text-lg font-black text-white min-w-[2rem] text-right">{row.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

          </div>
        </div>
      </div>

      {/* Fixed primary action button */}
      {!isViewer && (
        <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-[150] pointer-events-none">
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setModalOpen(true)}
            className="group relative pointer-events-auto"
          >
            {/* Outer Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-100 transition duration-500 animate-pulse" />

            <div className="relative flex items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white px-12 py-5 rounded-3xl shadow-2xl transition-all border-2 border-white/20">
              <PlusCircle className="w-6 h-6 animate-spin-slow" />
              <span className="text-xl font-black uppercase tracking-[0.2em] italic">
                OSTOOR YDAWLY
              </span>
            </div>
          </motion.button>
        </div>
      )}
      {shameActive && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none ">
          <div className="bg-gray-900 border-2 border-red-500 rounded-2xl p-8 text-center shadow-2xl shadow-red-500/20 w-100">
            <video
              src="/get-to-work-work.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-74 h-74 object-cover rounded-xl mx-auto mb-4"
            />
            <p className="text-2xl font-bold text-red-400">
              NIGGASSS BACK TO WORKKKKK
            </p>
            <p className="text-gray-400 text-sm mt-2">
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
