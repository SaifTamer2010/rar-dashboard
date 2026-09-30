"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCampaigns, addCampaign, updateCampaign, deleteCampaign } from "@/store/slices/campaignsSlice";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import type { Campaign, CampaignInput, CampaignScope } from "@/store/slices/campaignsSlice";

interface AdminBusiness {
  _id: string;
  company_name: string;
}

interface CampaignFormProps {
  initialData?: Campaign;
  onSubmit: (data: CampaignInput) => void;
  onCancel: () => void;
  isEdit?: boolean;
  /**
   * Super admin only. A campaign is required to belong to a business and the
   * super admin is the one role not scoped to one, so they have to pick. A
   * leader's business comes off their session, so this stays undefined there.
   */
  businesses?: AdminBusiness[];
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
  businesses,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [businessId, setBusinessId] = useState("");

  // The business is fixed once a campaign exists — moving one between companies
  // would orphan its leads, so it is only asked for on create.
  const needsBusiness = !isEdit && !!businesses;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(needsBusiness ? { name, busniess_id: businessId } : { name });
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

      {needsBusiness && (
        <div className="mt-4 flex flex-col gap-1.5">
          <label className={labelClass}>Business</label>
          <select
            className={fieldClass}
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            required
          >
            <option value="" disabled>
              {businesses?.length ? "Pick a business" : "No businesses yet"}
            </option>
            {businesses?.map((b) => (
              <option key={b._id} value={b._id}>
                {b.company_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            It starts unassigned — the owner hands it to a team from their Teams page.
          </p>
        </div>
      )}

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

interface CampaignManagementProps {
  /**
   * Whose campaigns these are. "admin" (the default) hits the super admin
   * routes and covers every campaign; "teamlead" hits the leader routes and
   * covers only the ones assigned to their own team. Same table either way —
   * the server does the narrowing.
   */
  scope?: CampaignScope;
}

const CampaignManagement: React.FC<CampaignManagementProps> = ({ scope = "admin" }) => {
  const dispatch = useAppDispatch();
  const { list: campaigns, status } = useAppSelector((state) => state.campaigns);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);

  useEffect(() => {
    dispatch(fetchCampaigns(scope));
  }, [dispatch, scope]);

  // Only the super admin has to choose a target business, so only they pay for
  // the extra request.
  useEffect(() => {
    if (scope !== "admin") return;

    let cancelled = false;

    fetch("/api/admin/businesses")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.businesses) setBusinesses(data.businesses);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [scope]);

  const handleAddCampaign = async (campaignData: CampaignInput) => {
    const promise = dispatch(addCampaign({ ...campaignData, scope })).unwrap();

    toast.promise(promise, {
      loading: "Creating campaign...",
      success: "Campaign created!",
      error: (err) => err.message || "Failed to create campaign",
    });

    try {
      await promise;
      setShowAddForm(false);
    } catch {}
  };

  const handleEditCampaign = async (campaignData: CampaignInput) => {
    if (!editingCampaign) return;
    const promise = dispatch(
      updateCampaign({ id: editingCampaign._id.toString(), data: campaignData, scope }),
    ).unwrap();

    toast.promise(promise, {
      loading: "Saving campaign...",
      success: "Campaign saved!",
      error: (err) => err.message || "Failed to save campaign",
    });

    try {
      await promise;
      setEditingCampaign(null);
    } catch {}
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (window.confirm("Are you sure you want to delete this campaign?")) {
      const promise = dispatch(deleteCampaign({ id: campaignId, scope })).unwrap();

      toast.promise(promise, {
        loading: "Deleting campaign...",
        success: "Campaign deleted.",
        error: (err) => err.message || "Failed to delete campaign",
      });
    }
  };

  if (status === "loading" && campaigns.length === 0) {
    return (
      <SkeletonRegion
        className="divide-y overflow-hidden rounded-xl border bg-background"
        label="Loading campaigns"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-lg" />
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </SkeletonRegion>
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
                <CampaignForm
                  onSubmit={handleAddCampaign}
                  onCancel={() => setShowAddForm(false)}
                  businesses={scope === "admin" ? businesses : undefined}
                />
              ) : (
                <CampaignForm
                  initialData={editingCampaign ?? undefined}
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
