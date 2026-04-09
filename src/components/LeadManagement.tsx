"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeads, addLead, updateLead, deleteLead } from "@/store/slices/leadsSlice";
import { fetchUsers } from "@/store/slices/usersSlice";
import { fetchCampaigns } from "@/store/slices/campaignsSlice";
import toast from "react-hot-toast";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  X, 
  User as UserIcon, 
  Target, 
  Clock, 
  Database,
  History,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface LeadFormProps {
  initialData?: any;
  users: any[];
  campaigns: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onSubmit={handleSubmit}
      className="p-8 bg-slate-900/90 backdrop-blur-3xl border-2 border-blue-500/20 rounded-[2.5rem] shadow-2xl space-y-6 text-left"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-2xl font-black italic uppercase italic text-white flex items-center gap-3">
          {isEdit ? <Pencil className="w-6 h-6 text-blue-500" /> : <Database className="w-6 h-6 text-emerald-500" />}
          {isEdit ? "Edit Record" : "Inject Data Segment"}
        </h3>
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1 text-left block">Assigned Ringer</label>
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
            <select
              className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-gray-200 outline-none transition-all appearance-none"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            >
              <option value="">Choose Personnel...</option>
              {users.map((u) => (
                <option key={u._id.toString()} value={u._id.toString()}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1 text-left block">Operation Target</label>
          <div className="relative">
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
            <select
              className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-gray-200 outline-none transition-all appearance-none"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              required
            >
              <option value="">Choose Sector...</option>
              {campaigns.map((c) => (
                <option key={c._id.toString()} value={c._id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1 text-left block">Segment Timestamp</label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
            <input
              type="datetime-local"
              className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-gray-200 outline-none transition-all"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 border-2 border-white/5 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-500/20"
        >
          {isEdit ? "Confirm Modification" : "Execute Injection"}
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
      loading: "Committing segment...",
      success: "Segment successfully injected!",
      error: (err) => err.message || "Injection failure",
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
      loading: "Refining record...",
      success: "Record refinement complete!",
      error: (err) => err.message || "Refinement failed",
    });

    try {
      await promise;
      setEditingLead(null);
    } catch (err) {}
  };

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm("Are you sure you want to purge this record?")) {
      const promise = dispatch(deleteLead(leadId)).unwrap();

      toast.promise(promise, {
        loading: "Purging record...",
        success: "Record purged from history.",
        error: (err) => err.message || "Purge failed",
      });
    }
  };

  if (status === "loading" && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Accessing Lead Nodes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-black italic uppercase italic text-white">Historical Data</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Lead Segment Ledger</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-3 px-6 py-4 bg-emerald-600/10 border-2 border-emerald-500/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
        >
          <Plus className="w-4 h-4" /> Inject Record
        </motion.button>
      </div>

      <AnimatePresence>
        {(showAddForm || editingLead) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          >
            <div className="w-full max-w-2xl">
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

      <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border-2 border-blue-500/10 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-4 font-black text-blue-400 text-[10px] uppercase tracking-[0.4em] bg-slate-950/40 px-8 py-6 border-b-2 border-blue-500/10 text-left">
          <div className="flex items-center gap-2 px-4"><UserIcon className="w-3 h-3" /> Personnel</div>
          <div className="flex items-center gap-2 px-4"><Target className="w-3 h-3" /> Sector</div>
          <div className="flex items-center gap-2 px-4"><Clock className="w-3 h-3" /> Timestamp</div>
          <div className="text-right px-4">Actions</div>
        </div>

        <div className="divide-y-2 divide-blue-500/5 max-h-[800px] overflow-y-auto custom-scrollbar">
          {leads.map((lead) => (
            <motion.div
              layout
              key={lead._id.toString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-4 items-center px-8 py-6 hover:bg-white/5 transition-all group text-left"
            >
              <div className="px-4">
                <p className="text-lg font-black italic uppercase text-gray-100 flex items-center gap-3">
                  <Activity className="w-4 h-4 text-blue-500/40" />
                  {(lead.userId as any)?.name || "Unknown"}
                </p>
              </div>
              <div className="px-4">
                <span className="px-4 py-1.5 bg-slate-950/60 border-2 border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400">
                  {(lead.campaignId as any)?.name || "Unknown"}
                </span>
              </div>
              <div className="px-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {new Date(lead.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="px-4 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingLead(lead)}
                  className="p-2.5 bg-blue-500/10 border-2 border-blue-500/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all"
                  title="Modify"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteLead(lead._id.toString())}
                  className="p-2.5 bg-red-500/10 border-2 border-red-500/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"
                  title="Purge"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-8 py-6 bg-slate-950/40 border-t-2 border-blue-500/10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            Showing Page <span className="text-blue-400">{pagination.page}</span> of <span className="text-blue-400">{pagination.totalPages}</span>
            <span className="ml-4 text-gray-700">({pagination.total} Total Segments)</span>
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || status === "loading"}
              className="p-2 rounded-xl border-2 border-white/5 bg-slate-800/40 text-gray-400 hover:bg-blue-600/10 hover:border-blue-500/20 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || status === "loading"}
              className="p-2 rounded-xl border-2 border-white/5 bg-slate-800/40 text-gray-400 hover:bg-blue-600/10 hover:border-blue-500/20 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadManagement;
