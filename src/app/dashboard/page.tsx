"use client";

import { useState, useEffect, useCallback } from "react";
import CampaignModal from "@/components/CampaignModal";

interface StatRow {
  name: string;
  count: number;
}

export default function DashboardPage() {
  const [byUser, setByUser] = useState<StatRow[]>([]);
  const [byCampaign, setByCampaign] = useState<StatRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/stats");
      const data = await res.json();
      setByUser(data.byUser || []);
      setByCampaign(data.byCampaign || []);
    } catch (error) {
      console.error("fetch stats error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto refresh every 5 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 pb-32">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-400 mb-10 text-sm">
        Auto-refreshing every 5 seconds
      </p>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Leads per Person */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">
              Leads per Person
            </h2>
            {byUser.length === 0 ? (
              <p className="text-gray-500 text-sm">No leads yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2">Name</th>
                    <th className="text-right py-2">Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {byUser.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-gray-800 hover:bg-gray-800 transition"
                    >
                      <td className="py-3">{row.name}</td>
                      <td className="py-3 text-right font-bold text-blue-400">
                        {row.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Leads per Campaign */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">
              Leads per Campaign
            </h2>
            {byCampaign.length === 0 ? (
              <p className="text-gray-500 text-sm">No leads yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2">Campaign</th>
                    <th className="text-right py-2">Leads</th>
                  </tr>
                </thead>
                <tbody>
                  {byCampaign.map((row) => (
                    <tr
                      key={row.name}
                      className="border-b border-gray-800 hover:bg-gray-800 transition"
                    >
                      <td className="py-3">{row.name}</td>
                      <td className="py-3 text-right font-bold text-green-400">
                        {row.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

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
