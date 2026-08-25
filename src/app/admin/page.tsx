"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import UserManagement from "@/components/UserManagement";
import CampaignManagement from "@/components/CampaignManagement";
import LeadManagement from "@/components/LeadManagement";

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Verifying…
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return null;
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/admin?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage who logs leads, what they log against, and clean up mistakes.
            </p>
          </div>

          <div className="flex gap-1 rounded-lg border bg-background p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative z-10 cursor-pointer rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 -z-10 rounded-md bg-muted"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {activeTab === "users" && <UserManagement />}
            {activeTab === "campaigns" && <CampaignManagement />}
            {activeTab === "leads" && <LeadManagement />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/40 text-sm text-muted-foreground">
          Loading admin…
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
