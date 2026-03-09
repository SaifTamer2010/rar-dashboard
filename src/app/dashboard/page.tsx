"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import CampaignModal from "@/components/CampaignModal";
import Celebration from "@/components/Celebration";
import { pusherClient } from "@/lib/pusher";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { formatDashboardMessage } from "@/lib/formatDashboard";

interface StatRow {
  name: string;
  count: number;
}

export default function DashboardPage() {
  const [byUser, setByUser] = useState<StatRow[]>([]);
  const [byCampaign, setByCampaign] = useState<StatRow[]>([]);
  const [byTotal, setByTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: session } = useSession();
  const isViewer = session?.user?.role === "viewer";

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/stats");
      const data = await res.json();
      setByUser(data.byUser || []);
      setByCampaign(data.byCampaign || []);
      setByTotal(data.totalLeads || 0);
      console.log(data.byUser);
      console.log(data.bycampaign);
    } catch (error) {
      console.error("fetch stats error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleLeadSuccess() {
    setCelebrate(false);
    setTimeout(() => setCelebrate(true), 10); // reset then trigger
    setModalOpen(false);
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
    fetchStats();

    const channel = pusherClient.subscribe("leads-channel");

    channel.bind(
      "lead-added",
      async (payload: { userName: string; userId: string }) => {
        console.log("Pusher event received:", payload);
        fetchStats();

        const res = await fetch(`/api/sounds/${payload.userId}`);
        const data = await res.json();
        console.log("Sound data:", data);

        if (data.soundUrl) {
          console.log("Playing sound...");
          const audio = new Audio(data.soundUrl);
          const playResult = await audio
            .play()
            .catch((e) => console.log("Play error:", e));
          // console.log("Play result:", playResult);
        } else {
          console.log("No sound URL found");
        }
      },
    );

    return () => {
      pusherClient.unsubscribe("leads-channel");
    };
  }, [fetchStats]);

  function handleCopy() {
    const message = formatDashboardMessage(byUser, byCampaign, byTotal);
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendTelegram() {
    setSending(true);
    const res = await fetch("/api/telegram/send-dashboard", { method: "POST" });
    setSending(false);
    if (res.ok) {
      alert("Sent to Telegram!");
    } else {
      alert("Failed to send");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 pb-32">
      <header className="w-full flex justify-between mb-2">
        <h1 className="text-xl md:text-3xl font-bold">Dashboard</h1>
        <div className=" flex justify-between gap-4">
          <Link
            href="/settings"
            className="text-md md:text-xl font-bold mb-2 bg-slate-800 w-30 h-12 rounded-xl shadow-black shadow-2xl hover:bg-slate-700 transition-all cursor-pointer flex justify-center items-center"
          >
            Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="text-md md:text-lg font-semibold mb-2 bg-red-800 w-30 h-12 rounded-xl shadow-black shadow-2xl hover:bg-red-700 transition-all cursor-pointer flex justify-center items-center"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex justify-center h-full w-full items-center">
        <div className="w-[90%] md:w-[40%] height-[80%] bg-[#111828] p-6 rounded-xl">
          <header className="border-b-2 border-dashed font-bold text-center text-2xl p-2">
            <h1>Power Ringers Daily Dashboard</h1>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleCopy}
                className={`bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-sm transition ${copied ? "bg-green-700" : "bg-gray-800 hover-bg-gray-700"}`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleSendTelegram}
                disabled={sending}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm transition"
              >
                {sending ? "Sending..." : "📨 Send to Telegram"}
              </button>
            </div>
          </header>
          <section className="p-2">
            <header className=" border-b-2 border-slate-600 w-full grid grid-cols-[2fr_1fr] p-4">
              <h1>Leads</h1>
              <h1>Name</h1>
            </header>
            {byUser.map((row) => (
              <div
                key={row.name}
                className="w-full grid grid-cols-[2fr_1fr] px-4 py-2 font-semibold text-md"
              >
                <h1>{row.count}</h1>
                <h1>{row.name}</h1>
              </div>
            ))}
            <div className="border-b-4 border-double w-full border-slate-700 my-4"></div>
            <h1 className="font-bold pl-2">
              Total Leads: <span className="font-normal">{byTotal}</span>
            </h1>
            <div className="border-b-4 border-double w-full border-slate-700 my-4"></div>
            {byCampaign.map((row) => (
              <div
                key={row.name}
                className="w-full grid grid-cols-[2fr_1fr] px-4 py-2 font-semibold text-md"
              >
                <h1>{row.count}</h1>
                <h1>{row.name}</h1>
              </div>
            ))}
          </section>
        </div>
      </div>
      {/* Fixed bottom button */}
      {!isViewer && (
        <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center bg-gradient-to-t from-gray-950 to-transparent">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-lg font-bold px-12 py-4 rounded-2xl shadow-2xl transition-all"
          >
            OSTOOR YDAWLYYYYYYYYY
          </button>
        </div>
      )}

      <CampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleLeadSuccess}
      />
      <Celebration trigger={celebrate} />
    </div>
  );
}
