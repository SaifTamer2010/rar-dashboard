"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeads, addLead, updateLead, deleteLead } from "@/store/slices/leadsSlice";
import { fetchUsers } from "@/store/slices/usersSlice";
import { fetchCampaigns } from "@/store/slices/campaignsSlice";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";

interface LeadFormProps {
  initialData?: any;
  users: any[];
  campaigns: any[];
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
  "flex size-8 cursor-pointer items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

const LeadForm: React.FC<LeadFormProps> = ({
  initialData = {},
  users,
  campaigns,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [userId, setUserId] = useState(initialData?.userId?._id || initialData?.userId || "");
  const [campaignId, setCampaignId] = useState(initialData?.campaignId?._id || initialData?.campaignId || "");
  const [createdAt, setCreatedAt] = useState(
    initialData?.createdAt ? new Date(initialData.createdAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      userId,
      campaignId,
      createdAt: new Date(createdAt),
    });
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
            {isEdit ? "Edit lead" : "Add lead"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Logged manually — this does not fire the sound or the Telegram bot.
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

      <div className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Agent</label>
          <select
            className={fieldClass}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          >
            <option value="">Choose an agent…</option>
            {users.map((u) => (
              <option key={u._id.toString()} value={u._id.toString()}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Campaign</label>
          <select
            className={fieldClass}
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            required
          >
            <option value="">Choose a campaign…</option>
            {campaigns.map((c) => (
              <option key={c._id.toString()} value={c._id.toString()}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Logged at</label>
          <input
            type="datetime-local"
            className={fieldClass}
            value={createdAt}
            onChange={(e) => setCreatedAt(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancel
        </button>
        <button type="submit" className={primaryButton}>
          {isEdit ? "Save changes" : "Add lead"}
        </button>
      </div>
    </motion.form>
  );
};

const LeadManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list: leads, status, error, pagination } = useAppSelector((state) => state.leads);
  const { list: users } = useAppSelector((state) => state.users);
  const { list: campaigns } = useAppSelector((state) => state.campaigns);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchLeads(pagination.page));
    dispatch(fetchUsers());
    dispatch(fetchCampaigns());
  }, [dispatch, pagination.page]);

  const handlePageChange = (newPage: number) => {
    dispatch(fetchLeads(newPage));
  };

  const handleAddLead = async (leadData: any) => {
    const promise = dispatch(addLead(leadData)).unwrap();

    toast.promise(promise, {
      loading: "Adding lead...",
      success: "Lead added!",
      error: (err) => err.message || "Failed to add lead",
    });

    try {
      await promise;
      setShowAddForm(false);
    } catch (err) {}
  };

  const handleEditLead = async (leadData: any) => {
    if (!editingLead) return;
    const promise = dispatch(updateLead({ id: editingLead._id.toString(), data: leadData })).unwrap();

    toast.promise(promise, {
      loading: "Saving lead...",
      success: "Lead saved!",
      error: (err) => err.message || "Failed to save lead",
    });

    try {
      await promise;
      setEditingLead(null);
    } catch (err) {}
  };

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      const promise = dispatch(deleteLead(leadId)).unwrap();

      toast.promise(promise, {
        loading: "Deleting lead...",
        success: "Lead deleted.",
        error: (err) => err.message || "Failed to delete lead",
      });
    }
  };

  if (status === "loading" && leads.length === 0) {
    return (
      <div className="rounded-xl border bg-background px-4 py-16 text-center text-sm text-muted-foreground">
        Loading leads…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium text-muted-foreground">
          Leads
          <span className="ml-2 text-muted-foreground/60">{pagination.total}</span>
        </h2>
        <button onClick={() => setShowAddForm(true)} className={secondaryButton}>
          <Plus className="size-3.5" /> Add lead
        </button>
      </div>

      <AnimatePresence>
        {(showAddForm || editingLead) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg">
              <LeadForm
                users={users}
                campaigns={campaigns}
                onSubmit={showAddForm ? handleAddLead : handleEditLead}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingLead(null);
                }}
                initialData={editingLead || {}}
                isEdit={!!editingLead}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground sm:grid-cols-[1.2fr_1.2fr_1fr_auto]">
          <span>Agent</span>
          <span className="hidden sm:block">Campaign</span>
          <span className="hidden sm:block">Logged at</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="max-h-120 divide-y overflow-y-auto">
          {leads.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">No leads on this page.</p>
          ) : (
            leads.map((lead) => (
              <motion.div
                layout
                key={lead._id.toString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 sm:grid-cols-[1.2fr_1.2fr_1fr_auto]"
              >
                <p className="truncate text-sm font-medium">
                  {(lead.userId as any)?.name || "Unknown"}
                </p>
                <div className="hidden sm:block">
                  <span className="inline-block max-w-full truncate rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {(lead.campaignId as any)?.name || "Unknown"}
                  </span>
                </div>
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {new Date(lead.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => setEditingLead(lead)} className={iconButton} title="Edit">
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLead(lead._id.toString())}
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-between gap-4 border-t bg-muted/40 px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} leads
          </p>

          <div className="flex gap-1.5">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || status === "loading"}
              className={iconButton}
              title="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || status === "loading"}
              className={iconButton}
              title="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadManagement;
