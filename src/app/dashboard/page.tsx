"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CampaignModal from "@/components/CampaignModal";
import Celebration from "@/components/Celebration";

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

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/stats");
      const data = await res.json();
      setByUser(data.byUser || []);
      setByCampaign(data.byCampaign || []);
      setByTotal(data.totalLeads || 0);
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
    fetchStats();
  }

  useEffect(() => {
    fetchStats();
    const eventSource = new EventSource("/api/events");
    eventSource.onmessage = async (e) => {
      if (e.data === "lead_added") {
        fetchStats();

        // Play the notification sound
        const res = await fetch("/api/settings/sound");
        const data = await res.json();
        if (data.soundUrl) {
          const audio = new Audio(data.soundUrl);
          audio.play().catch(() => {}); // catch autoplay block
        }
      }
    };

    return () => {
      eventSource.close();
    };
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 pb-32">
      <header className="w-full flex justify-between mb-2">
        <h1 className="text-xl md:text-3xl font-bold">Dashboard</h1>

        <Link
          href="/settings"
          className="text-md md:text-xl font-bold mb-2 bg-slate-800 w-30 h-12 rounded-xl shadow-black shadow-2xl hover:bg-slate-700 transition-all cursor-pointer flex justify-center items-center"
        >
          Settings
        </Link>
      </header>

      <div className="flex justify-center h-full w-full items-center">
        <div className="w-[90%] md:w-[40%] height-[80%] bg-[#111828] p-6 rounded-xl">
          <header className="border-b-2 border-dashed font-bold text-center text-2xl p-2">
            <h1>Power Ringers Daily Dashboard</h1>
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
      <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center bg-gradient-to-t from-gray-950 to-transparent">
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-lg font-bold px-12 py-4 rounded-2xl shadow-2xl transition-all"
        >
          1 DOWNNNNNNN
        </button>
      </div>

      <CampaignModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleLeadSuccess}
      />
      <Celebration trigger={celebrate} />
    </div>
  );
}
