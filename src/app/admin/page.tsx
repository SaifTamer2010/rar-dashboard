"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import UserManagement from "@/components/UserManagement";
import CampaignManagement from "@/components/CampaignManagement";
import LeadManagement from "@/components/LeadManagement";
import DashboardNavbar from "@/components/DashboardNavbar";

const AdminPage = () => {
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
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Verifying...</div>;
  }

  if (session?.user?.role !== "admin") {
    return null;
  }

  // const tabs = [
  //   { id: "users", label: "Users" },
  //   { id: "campaigns", label: "Campaigns" },
  //   { id: "leads", label: "Leads" },
  // ];


  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/admin?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-2 md:p-6 pb-32">
      <DashboardNavbar />

      <div className="mb-8 border-b border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center relative" role="tablist">
          {tabs.map((tab) => (
            <li key={tab.id} className="me-2 relative" role="presentation">
              <button
                className={`inline-block p-4 border-b-2 transition-colors relative z-10 ${activeTab === tab.id ? "text-blue-500" : "text-gray-400 hover:text-gray-300"
                  } ${activeTab === tab.id ? "border-transparent" : "border-transparent"}`}
                onClick={() => handleTabChange(tab.id)}
                type="button"
                role="tab"
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
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

export default AdminPage;
