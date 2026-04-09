"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCampaigns, addCampaign, updateCampaign, deleteCampaign } from "@/store/slices/campaignsSlice";
import toast from "react-hot-toast";
import { ICampaign } from "@/models/Campaign";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  X, 
  Target, 
  Calendar,
  CloudLightning,
  CheckCircle2
} from "lucide-react";

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
  const [name, setName] = useState(initialData?.name || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name });
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
        <h3 className="text-2xl font-black italic uppercase text-white flex items-center gap-3">
          {isEdit ? <Pencil className="w-6 h-6 text-blue-500" /> : <CloudLightning className="w-6 h-6 text-emerald-500" />}
          {isEdit ? "Refine Operation" : "New Campaign"}
        </h3>
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1 text-left block">Codename</label>
          <div className="relative">
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
            <input
              type="text"
              className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-gray-200 outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Operation Nightingale"
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
          {isEdit ? "Update Code" : "Initialize Campaign"}
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
      loading: "Establishing sector...",
      success: "Sector active!",
      error: (err) => err.message || "Sector failure",
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
      loading: "Modifying operation...",
      success: "Modifications saved!",
      error: (err) => err.message || "Modification failed",
    });

    try {
      await promise;
      setEditingCampaign(null);
    } catch (err) {}
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (window.confirm("Are you sure you want to terminate this campaign?")) {
      const promise = dispatch(deleteCampaign(campaignId)).unwrap();

      toast.promise(promise, {
        loading: "Terminating sector...",
        success: "Sector terminated.",
        error: (err) => err.message || "Termination failed",
      });
    }
  };

  if (status === "loading" && campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Scanning Sectors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-black italic uppercase italic text-white">Operation Zones</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Campaign Deployment Control</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-3 px-6 py-4 bg-emerald-600/10 border-2 border-emerald-500/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
        >
          <Plus className="w-4 h-4" /> New Sector
        </motion.button>
      </div>

      <AnimatePresence>
        {(showAddForm || editingCampaign) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
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

      <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border-2 border-blue-500/10 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-3 font-black text-blue-400 text-[10px] uppercase tracking-[0.4em] bg-slate-950/40 px-8 py-6 border-b-2 border-blue-500/10 text-left">
          <div className="flex items-center gap-2 px-4"><Target className="w-3 h-3" /> Operation Name</div>
          <div className="flex items-center gap-2 px-4"><Calendar className="w-3 h-3" /> Initialization</div>
          <div className="text-right px-4">Actions</div>
        </div>

        <div className="divide-y-2 divide-blue-500/5 max-h-[800px] overflow-y-auto custom-scrollbar">
          {campaigns.map((campaign) => (
            <motion.div
              layout
              key={campaign._id.toString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-3 items-center px-8 py-6 hover:bg-white/5 transition-all group text-left"
            >
              <div className="px-4">
                <p className="text-lg font-black italic uppercase text-gray-100 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500/40" />
                  {campaign.name}
                </p>
              </div>
              <div className="px-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                  {new Date(campaign.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="px-4 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingCampaign(campaign)}
                  className="p-2.5 bg-blue-500/10 border-2 border-blue-500/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all"
                  title="Modify"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCampaign(campaign._id.toString())}
                  className="p-2.5 bg-red-500/10 border-2 border-red-500/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition-all"
                  title="Terminate"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CampaignManagement;
