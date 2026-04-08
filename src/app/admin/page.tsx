"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import UserManagement from "@/components/UserManagement";
import CampaignManagement from "@/components/CampaignManagement";

const AdminPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "users"); // Initialize from query param

  // Update activeTab if the URL changes
  useEffect(() => {
    const tab = searchParams.get("tab") || "users";
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`, { scroll: false }); // Update URL without full page reload
  };

  return (
    <div className="bg-slate-800 mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="mb-4 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" id="default-tab" data-tabs-toggle="#default-tab-content" role="tablist">
          <li className="me-2" role="presentation">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === "users" ? "text-blue-600 border-blue-600" : "hover:text-gray-600 hover:border-gray-300"
                }`}
              onClick={() => handleTabChange("users")}
              type="button"
              role="tab"
              aria-controls="users"
              aria-selected={activeTab === "users"}
            >
              Users
            </button>
          </li>
          <li className="me-2" role="presentation">
            <button
              className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === "campaigns" ? "text-blue-600 border-blue-600" : "hover:text-gray-600 hover:border-gray-300"
                }`}
              onClick={() => handleTabChange("campaigns")}
              type="button"
              role="tab"
              aria-controls="campaigns"
              aria-selected={activeTab === "campaigns"}
            >
              Campaigns
            </button>
          </li>
        </ul>
      </div>

      <div id="default-tab-content">
        <div className={`${activeTab === "users" ? "" : "hidden"}`} id="users" role="tabpanel" aria-labelledby="users-tab">
          <UserManagement />
        </div>
        <div className={`${activeTab === "campaigns" ? "" : "hidden"}`} id="campaigns" role="tabpanel" aria-labelledby="campaigns-tab">
          <CampaignManagement />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
