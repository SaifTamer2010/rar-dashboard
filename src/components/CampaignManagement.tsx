"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCampaigns, addCampaign, updateCampaign, deleteCampaign } from "@/store/slices/campaignsSlice";
import toast from "react-hot-toast";
import { ICampaign } from "@/models/Campaign";
import { Pencil, Trash2, Plus, X } from "lucide-react";

interface CampaignFormProps {
  initialData?: Partial<ICampaign>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10";
const labelClass = "text-[13px] font-medium text-muted-foreground";
const primaryButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";
const iconButton =
  "flex size-8 cursor-pointer items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const CampaignForm: React.FC<CampaignFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [name, setName] = useState(initialData?.name || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="rounded-xl border bg-background p-6 text-left shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">
            {isEdit ? "Edit campaign" : "New campaign"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Agents pick this name when they log a lead.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <label className={labelClass}>Name</label>
        <input
          type="text"
          className={fieldClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Spring Outbound"
          required
        />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancel
        </button>
        <button type="submit" className={primaryButton}>
          {isEdit ? "Save changes" : "Create campaign"}
        </button>
      </div>
    </motion.form>
  );
};

const CampaignManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list: campaigns, status, error } = useAppSelector((state) => state.campaigns);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  const handleAddCampaign = async (campaignData: any) => {
    const promise = dispatch(addCampaign(campaignData)).unwrap();

    toast.promise(promise, {
      loading: "Creating campaign...",
      success: "Campaign created!",
      error: (err) => err.message || "Failed to create campaign",
    });

    try {
      await promise;
      setShowAddForm(false);
    } catch (err) {}
  };

  const handleEditCampaign = async (campaignData: any) => {
    if (!editingCampaign) return;
    const promise = dispatch(updateCampaign({ id: editingCampaign._id.toString(), data: campaignData })).unwrap();

    toast.promise(promise, {
      loading: "Saving campaign...",
      success: "Campaign saved!",
      error: (err) => err.message || "Failed to save campaign",
    });

    try {
      await promise;
      setEditingCampaign(null);
    } catch (err) {}
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      const promise = dispatch(deleteCampaign(campaignId)).unwrap();

      toast.promise(promise, {
        loading: "Deleting campaign...",
        success: "Campaign deleted.",
        error: (err) => err.message || "Failed to delete campaign",
      });
    }
  };

  if (status === "loading" && campaigns.length === 0) {
    return (
      <div className="rounded-xl border bg-background px-4 py-16 text-center text-sm text-muted-foreground">
        Loading campaigns…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium text-muted-foreground">
          Campaigns
          <span className="ml-2 text-muted-foreground/60">{campaigns.length}</span>
        </h2>
        <button onClick={() => setShowAddForm(true)} className={secondaryButton}>
          <Plus className="size-3.5" /> Add campaign
        </button>
      </div>

      <AnimatePresence>
        {(showAddForm || editingCampaign) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg">
              {showAddForm ? (
                <CampaignForm onSubmit={handleAddCampaign} onCancel={() => setShowAddForm(false)} />
              ) : (
                <CampaignForm
                  initialData={editingCampaign}
                  onSubmit={handleEditCampaign}
                  onCancel={() => setEditingCampaign(null)}
                  isEdit={true}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground sm:grid-cols-[1.6fr_1fr_auto]">
          <span>Name</span>
          <span className="hidden sm:block">Created</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="max-h-137 divide-y overflow-y-auto">
          {campaigns.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">No campaigns yet.</p>
          ) : (
            campaigns.map((campaign) => (
              <motion.div
                layout
                key={campaign._id.toString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 sm:grid-cols-[1.6fr_1fr_auto]"
              >
                <p className="truncate text-sm font-medium">{campaign.name}</p>
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {new Date(campaign.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => setEditingCampaign(campaign)}
                    className={iconButton}
                    title="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign._id.toString())}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignManagement;
