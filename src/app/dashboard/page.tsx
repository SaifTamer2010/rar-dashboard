"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CampaignModal from "@/components/CampaignModal";

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

  useEffect(() => {
    fetchStats();

    console.log("Opening SSE connection...");
    const eventSource = new EventSource("/api/events");

    eventSource.onopen = () => {
      console.log("SSE connected!");
    };

    eventSource.onmessage = (e) => {
      console.log("SSE message received:", e.data);
      if (e.data === "lead_added") {
        fetchStats();
      }
    };

    eventSource.onerror = (e) => {
      console.log("SSE error:", e);
      eventSource.close();
    };

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
      console.log("Closing SSE connection");
      eventSource.close();
    };
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 pb-32">
      <header className="w-full flex justify-between">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>

        <Link
          href="/settings"
          className="text-xl font-bold mb-2 bg-slate-800 w-30 h-12 rounded-xl shadow-black shadow-2xl hover:bg-slate-700 transition-all cursor-pointer flex justify-center items-center"
        >
          Settings
        </Link>
      </header>

      <div className="flex justify-center h-full w-full items-center">
        <div className="w-[40%] height-[80%] bg-[#111828] p-6 rounded-xl">
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
        onSuccess={() => {
          setModalOpen(false);
          fetchStats();
        }}
      />
    </div>
  );
}

// {byCampaign.length === 0 ? (
//               <p className="text-gray-500 text-sm">No leads yet</p>
//             ) : (
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="text-gray-400 border-b border-gray-800">
//                     <th className="text-left py-2">Campaign</th>
//                     <th className="text-right py-2">Leads</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {byCampaign.map((row) => (
//                     <tr
//                       key={row.name}
//                       className="border-b border-gray-800 hover:bg-gray-800 transition"
//                     >
//                       <td className="py-3">{row.name}</td>
//                       <td className="py-3 text-right font-bold text-green-400">
//                         {row.count}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
