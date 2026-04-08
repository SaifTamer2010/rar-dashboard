import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCampaigns, addCampaign, updateCampaign, deleteCampaign } from "@/store/slices/campaignsSlice";
import toast from "react-hot-toast";

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
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="p-4 bg-slate-900 shadow-md rounded-lg"
    >
      <h3 className="text-xl font-semibold mb-4 text-white">
        {isEdit ? "Edit Campaign" : "Add New Campaign"}
      </h3>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Campaign Name
        </label>
        <input
          type="text"
          id="name"
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          {isEdit ? "Save Changes" : "Add Campaign"}
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
    if (status === "idle") {
      dispatch(fetchCampaigns());
    }
  }, [status, dispatch]);

  const handleAddCampaign = async (campaignData: any) => {
    const promise = dispatch(addCampaign(campaignData)).unwrap();

    toast.promise(promise, {
      loading: "Adding campaign...",
      success: (campaign) => (
        <div className="flex items-center gap-4">
          <span>Campaign added successfully!</span>
          <button
            onClick={() => {
              dispatch(deleteCampaign(campaign._id.toString()));
              toast.dismiss();
            }}
            className="text-blue-400 hover:underline text-sm font-bold ml-2"
          >
            UNDO
          </button>
        </div>
      ),
      error: (err) => err.message || "Failed to add campaign",
    });

    try {
      await promise;
      setShowAddForm(false);
    } catch (err) {}
  };

  const handleEditCampaign = async (campaignData: any) => {
    if (!editingCampaign) return;
    const oldData = { ...editingCampaign };
    const promise = dispatch(updateCampaign({ id: editingCampaign._id.toString(), data: campaignData })).unwrap();

    toast.promise(promise, {
      loading: "Updating campaign...",
      success: (updatedCampaign) => (
        <div className="flex items-center gap-4">
          <span>Campaign updated successfully!</span>
          <button
            onClick={() => {
              dispatch(updateCampaign({ id: updatedCampaign._id.toString(), data: oldData }));
              toast.dismiss();
            }}
            className="text-blue-400 hover:underline text-sm font-bold ml-2"
          >
            UNDO
          </button>
        </div>
      ),
      error: (err) => err.message || "Failed to update campaign",
    });

    try {
      await promise;
      setEditingCampaign(null);
    } catch (err) {}
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    const campaignToDelete = campaigns.find(c => c._id.toString() === campaignId);
    if (!campaignToDelete) return;

    if (window.confirm("Are you sure you want to delete this campaign?")) {
      const promise = dispatch(deleteCampaign(campaignId)).unwrap();

      toast.promise(promise, {
        loading: "Deleting campaign...",
        success: (deletedId) => (
          <div className="flex items-center gap-4">
            <span>Campaign deleted successfully!</span>
            <button
              onClick={() => {
                dispatch(addCampaign(campaignToDelete));
                toast.dismiss();
              }}
              className="text-blue-400 hover:underline text-sm font-bold ml-2"
            >
              UNDO
            </button>
          </div>
        ),
        error: (err) => err.message || "Failed to delete campaign",
      });
    }
  };

  if (status === "loading" && campaigns.length === 0) {
    return <p className="text-white">Loading campaigns...</p>;
  }

  if (status === "failed") {
    return (
      <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">
        <p>Error: {error}</p>
        <button 
          onClick={() => dispatch(fetchCampaigns())}
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
        <h2 className="text-2xl font-semibold text-white">Campaign List</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Add Campaign
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
              <CampaignForm
                onSubmit={handleAddCampaign}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-slate-900 p-4 rounded-lg shadow-xl w-full max-w-md">
              <CampaignForm
                initialData={editingCampaign}
                onSubmit={handleEditCampaign}
                onCancel={() => setEditingCampaign(null)}
                isEdit={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto h-[calc(100vh-20rem)] min-w-[500px]">
        <div className="grid grid-cols-3 font-bold text-white border-b border-gray-700 mb-4 pb-2">
          <h1 className="px-4">Name</h1>
          <h1 className="px-4">Created At</h1>
          <h1 className="px-4">Actions</h1>
        </div>

        <motion.div layout className="space-y-2">
          <AnimatePresence>
            {campaigns.map((campaign) => (
              <motion.div
                layout
                key={campaign._id.toString()}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-3 items-center border-b border-gray-800/50 hover:bg-white/5 transition-colors pb-2"
              >
                <p className="px-4 text-gray-200">{campaign.name}</p>
                <p className="px-4 text-gray-400 text-sm">
                  {new Date(campaign.createdAt).toLocaleDateString()}
                </p>
                <div className="px-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingCampaign(campaign)}
                    className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteCampaign(campaign._id.toString())}
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

export default CampaignManagement;
