"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import UserManagement from "@/components/UserManagement";
import CampaignManagement from "@/components/CampaignManagement";
import LeadManagement from "@/components/LeadManagement";
import DashboardNavbar from "@/components/DashboardNavbar";

const AdminPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "users");

  useEffect(() => {
    const tab = searchParams.get("tab") || "users";
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const tabs = [
    { id: "users", label: "Users" },
    { id: "campaigns", label: "Campaigns" },
    { id: "leads", label: "Leads" },
  ];

  if (status === "loading") {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Verifying...</div>;
  }

  if (session?.user?.role !== "admin") {
    return null;
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/admin?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className=" text-white p-4 md:p-8 pb-32 selection:bg-blue-500/30">
     

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent italic uppercase tracking-tighter">
          Admin <span className="text-blue-500">Control</span>
        </h1>
        
        <div className="flex bg-slate-900/40 backdrop-blur-2xl p-1.5 rounded-[1.5rem] border-2 border-blue-500/10 shadow-xl ring-1 ring-blue-500/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`relative px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all z-10 ${
                activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-blue-600 rounded-2xl -z-10 shadow-lg shadow-blue-500/20"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeTab === "users" && <UserManagement />}
            {activeTab === "campaigns" && <CampaignManagement />}
            {activeTab === "leads" && <LeadManagement />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black uppercase tracking-widest">Waking Up Admin...</div>}>
      <AdminPageContent />
    </Suspense>
  );
}
