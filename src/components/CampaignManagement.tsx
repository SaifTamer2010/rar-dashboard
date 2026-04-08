"use client";

import React, { useState, useEffect } from "react";

import { ICampaign } from "@/models/Campaign";

interface CampaignFormProps {
  initialData?: Partial<ICampaign>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [name, setName] = useState(initialData.name || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-800 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold mb-4">
        {isEdit ? "Edit Campaign" : "Add New Campaign"}
      </h3>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Campaign Name
        </label>
        <input
          type="text"
          id="name"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-slate-900"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-white hover:bg-gray-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
        >
          {isEdit ? "Save Changes" : "Add Campaign"}
        </button>
      </div>
    </form>
  );
};

const CampaignManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<ICampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<ICampaign | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/campaigns");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch campaigns");
      }
      const data = await response.json();
      setCampaigns(data.campaigns);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleAddCampaign = async (campaignData: any) => {
    try {
      const response = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add campaign");
      }
      setShowAddForm(false);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add campaign");
    }
  };

  const handleEditCampaign = async (campaignData: any) => {
    if (!editingCampaign) return;
    try {
      const response = await fetch(`/api/admin/campaigns/${editingCampaign._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update campaign");
      }
      setEditingCampaign(null);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update campaign");
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      try {
        const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete campaign");
        }
        fetchCampaigns();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete campaign");
      }
    }
  };

  if (loading) {
    return <p>Loading campaigns...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Campaign List</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Add Campaign
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center">
          <div className="bg-slate-800 p-4 rounded-lg shadow-xl w-1/3">
            <CampaignForm
              onSubmit={handleAddCampaign}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      {editingCampaign && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center">
          <div className="bg-slate-800 p-4 rounded-lg shadow-xl w-1/3">
            <CampaignForm
              initialData={editingCampaign}
              onSubmit={handleEditCampaign}
              onCancel={() => setEditingCampaign(null)}
              isEdit={true}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="grid grid-cols-3 grid-rows-auto mb-4 font-bold">
          <h1 className="py-2 px-4 border-b">Name</h1>
          <h1 className="py-2 px-4 border-b">Created At</h1>
          <h1 className="py-2 px-4 border-b">Actions</h1>
        </div>

        {campaigns.map((campaign) => (
          <div key={campaign._id.toString()} className="grid grid-cols-3 border-b border-slate-700 mb-2 pb-2">
            <p className="py-2 px-4">{campaign.name}</p>
            <p className="py-2 px-4">
              {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
            <p className="py-2 px-4">
              <button
                onClick={() => setEditingCampaign(campaign)}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteCampaign(campaign._id.toString())}
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignManagement;
