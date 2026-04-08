import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeads, addLead, updateLead, deleteLead } from "@/store/slices/leadsSlice";
import { fetchUsers } from "@/store/slices/usersSlice";
import { fetchCampaigns } from "@/store/slices/campaignsSlice";
import { ILead } from "@/models/Lead";
import { IUser } from "@/models/User";
import { ICampaign } from "@/models/Campaign";
import toast from "react-hot-toast";

interface LeadFormProps {
  initialData?: any;
  users: IUser[];
  campaigns: ICampaign[];
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
  const [userId, setUserId] = useState(initialData.userId?._id || initialData.userId || "");
  const [campaignId, setCampaignId] = useState(initialData.campaignId?._id || initialData.campaignId || "");
  const [createdAt, setCreatedAt] = useState(
    initialData.createdAt ? new Date(initialData.createdAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="p-4 bg-slate-900 shadow-md rounded-lg"
    >
      <h3 className="text-xl font-semibold mb-4 text-white">
        {isEdit ? "Edit Lead" : "Add New Lead"}
      </h3>
      
      <div className="mb-4">
        <label htmlFor="userId" className="block text-sm font-medium text-gray-300">
          User
        </label>
        <select
          id="userId"
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        >
          <option value="">Select User</option>
          {users.map((u) => (
            <option key={u._id.toString()} value={u._id.toString()}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="campaignId" className="block text-sm font-medium text-gray-300">
          Campaign
        </label>
        <select
          id="campaignId"
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          required
        >
          <option value="">Select Campaign</option>
          {campaigns.map((c) => (
            <option key={c._id.toString()} value={c._id.toString()}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="createdAt" className="block text-sm font-medium text-gray-300">
          Created At
        </label>
        <input
          type="datetime-local"
          id="createdAt"
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={createdAt}
          onChange={(e) => setCreatedAt(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-700 rounded-md text-white hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
        >
          {isEdit ? "Save Changes" : "Add Lead"}
        </button>
      </div>
    </motion.form>
  );
};

const LeadManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list: leads, status, error } = useAppSelector((state) => state.leads);
  const { list: users } = useAppSelector((state) => state.users);
  const { list: campaigns } = useAppSelector((state) => state.campaigns);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLead, setEditingLead] = useState<any | null>(null);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchLeads());
    }
    // Also ensure users and campaigns are loaded for the form
    dispatch(fetchUsers());
    dispatch(fetchCampaigns());
  }, [status, dispatch]);

  const handleAddLead = async (leadData: any) => {
    const promise = dispatch(addLead(leadData)).unwrap();

    toast.promise(promise, {
      loading: "Adding lead...",
      success: (lead) => (
        <div className="flex items-center gap-4">
          <span>Lead added successfully!</span>
          <button
            onClick={() => {
              dispatch(deleteLead(lead._id.toString()));
              toast.dismiss();
            }}
            className="text-blue-400 hover:underline text-sm font-bold ml-2"
          >
            UNDO
          </button>
        </div>
      ),
      error: (err) => err.message || "Failed to add lead",
    });

    try {
      await promise;
      setShowAddForm(false);
    } catch (err) {}
  };

  const handleEditLead = async (leadData: any) => {
    if (!editingLead) return;
    const oldData = { ...editingLead };
    const promise = dispatch(updateLead({ id: editingLead._id.toString(), data: leadData })).unwrap();

    toast.promise(promise, {
      loading: "Updating lead...",
      success: (updatedLead) => (
        <div className="flex items-center gap-4">
          <span>Lead updated successfully!</span>
          <button
            onClick={() => {
              dispatch(updateLead({ id: updatedLead._id.toString(), data: oldData }));
              toast.dismiss();
            }}
            className="text-blue-400 hover:underline text-sm font-bold ml-2"
          >
            UNDO
          </button>
        </div>
      ),
      error: (err) => err.message || "Failed to update lead",
    });

    try {
      await promise;
      setEditingLead(null);
    } catch (err) {}
  };

  const handleDeleteLead = async (leadId: string) => {
    const leadToDelete = leads.find(l => l._id.toString() === leadId);
    if (!leadToDelete) return;

    if (window.confirm("Are you sure you want to delete this lead?")) {
      const promise = dispatch(deleteLead(leadId)).unwrap();

      toast.promise(promise, {
        loading: "Deleting lead...",
        success: (deletedId) => (
          <div className="flex items-center gap-4">
            <span>Lead deleted successfully!</span>
            <button
              onClick={() => {
                dispatch(addLead(leadToDelete));
                toast.dismiss();
              }}
              className="text-blue-400 hover:underline text-sm font-bold ml-2"
            >
              UNDO
            </button>
          </div>
        ),
        error: (err) => err.message || "Failed to delete lead",
      });
    }
  };

  if (status === "loading" && leads.length === 0) {
    return <p className="text-white">Loading leads...</p>;
  }

  if (status === "failed") {
    return (
      <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">
        <p>Error: {error}</p>
        <button 
          onClick={() => dispatch(fetchLeads())}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-white">Lead List</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Add Lead
        </motion.button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-slate-900 p-4 rounded-lg shadow-xl w-full max-w-md">
              <LeadForm 
                users={users} 
                campaigns={campaigns} 
                onSubmit={handleAddLead} 
                onCancel={() => setShowAddForm(false)} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-slate-900 p-4 rounded-lg shadow-xl w-full max-w-md">
              <LeadForm
                initialData={editingLead}
                users={users}
                campaigns={campaigns}
                onSubmit={handleEditLead}
                onCancel={() => setEditingLead(null)}
                isEdit={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto h-[calc(100vh-20rem)]">
        <div className="grid grid-cols-4 font-bold text-white border-b border-gray-700 mb-4 pb-2">
          <h1 className="px-4">User</h1>
          <h1 className="px-4">Campaign</h1>
          <h1 className="px-4">Created At</h1>
          <h1 className="px-4">Actions</h1>
        </div>

        <motion.div layout className="space-y-2">
          <AnimatePresence>
            {leads.map((lead) => (
              <motion.div
                layout
                key={lead._id.toString()}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-4 items-center border-b border-gray-800/50 hover:bg-white/5 transition-colors pb-2 text-gray-300"
              >
                <p className="px-4">{(lead.userId as any)?.name || "Unknown"}</p>
                <p className="px-4">{(lead.campaignId as any)?.name || "Unknown"}</p>
                <p className="px-4 text-xs font-mono text-gray-500">
                  {new Date(lead.createdAt).toLocaleString()}
                </p>
                <div className="px-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingLead(lead)}
                    className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteLead(lead._id.toString())}
                    className="p-1.5 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default LeadManagement;
