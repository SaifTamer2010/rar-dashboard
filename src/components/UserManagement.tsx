"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, addUser, updateUser, deleteUser } from "@/store/slices/usersSlice";
import { IUser } from "@/models/User";
import toast from "react-hot-toast";

type Role = "admin" | "user" | "viewer";

interface UserFormProps {
  initialData?: Partial<IUser>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const PlaySoundButton = ({ url }: { url: string }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setPlaying(false);
      }
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-full transition-colors ${playing ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
        }`}
      title={playing ? "Stop" : "Play Sound"}
    >
      {playing ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
};

const UserForm: React.FC<UserFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [name, setName] = useState(initialData.name || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>((initialData.role as Role) || "user");
  const [telegramUsername, setTelegramUsername] = useState(
    initialData.telegramUsername || ""
  );
  const [soundUrl, setSoundUrl] = useState(initialData.soundUrl || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      password: password || undefined,
      role,
      telegramUsername: telegramUsername || undefined,
      soundUrl: soundUrl || undefined,
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
        {isEdit ? "Edit User" : "Add New User"}
      </h3>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Name
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
      <div className="mb-4">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-300"
        >
          Password {isEdit && "(leave blank to keep current)"}
        </label>
        <input
          type="password"
          id="password"
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          {...(!isEdit && { required: true })}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="role" className="block text-sm font-medium text-gray-300">
          Role
        </label>
        <select
          id="role"
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <div className="mb-4">
        <label
          htmlFor="telegramUsername"
          className="block text-sm font-medium text-gray-300"
        >
          Telegram Username
        </label>
        <input
          type="text"
          id="telegramUsername"
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={telegramUsername}
          onChange={(e) => setTelegramUsername(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="soundUrl" className="block text-sm font-medium text-gray-300">
          Sound URL
        </label>
        <input
          type="text"
          id="soundUrl"
          className="mt-1 block w-full border border-gray-700 rounded-md shadow-sm p-2 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          value={soundUrl}
          onChange={(e) => setSoundUrl(e.target.value)}
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
          {isEdit ? "Save Changes" : "Add User"}
        </button>
      </div>
    </motion.form>
  );
};

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list: users, status, error } = useAppSelector((state) => state.users);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  const handleAddUser = async (userData: any) => {
    const promise = dispatch(addUser(userData)).unwrap();
    
    toast.promise(promise, {
      loading: "Adding user...",
      success: (user) => (
        <div className="flex items-center gap-4">
          <span>User added successfully!</span>
          <button
            onClick={() => {
              dispatch(deleteUser(user._id.toString()));
              toast.dismiss();
            }}
            className="text-blue-400 hover:underline text-sm font-bold ml-2"
          >
            UNDO
          </button>
        </div>
      ),
      error: (err) => err.message || "Failed to add user",
    });

    try {
      await promise;
      setShowAddForm(false);
    } catch (err) {}
  };

  const handleEditUser = async (userData: any) => {
    if (!editingUser) return;
    const oldData = { ...editingUser };
    const promise = dispatch(updateUser({ id: editingUser._id.toString(), data: userData })).unwrap();

    toast.promise(promise, {
      loading: "Updating user...",
      success: (updatedUser) => (
        <div className="flex items-center gap-4">
          <span>User updated successfully!</span>
          <button
            onClick={() => {
              dispatch(updateUser({ id: updatedUser._id.toString(), data: oldData }));
              toast.dismiss();
            }}
            className="text-blue-400 hover:underline text-sm font-bold ml-2"
          >
            UNDO
          </button>
        </div>
      ),
      error: (err) => err.message || "Failed to update user",
    });

    try {
      await promise;
      setEditingUser(null);
    } catch (err) {}
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u._id.toString() === userId);
    if (!userToDelete) return;

    if (window.confirm("Are you sure you want to delete this user?")) {
      const promise = dispatch(deleteUser(userId)).unwrap();

      toast.promise(promise, {
        loading: "Deleting user...",
        success: (deletedId) => (
          <div className="flex items-center gap-4">
            <span>User deleted successfully!</span>
            <button
              onClick={() => {
                dispatch(addUser(userToDelete));
                toast.dismiss();
              }}
              className="text-blue-400 hover:underline text-sm font-bold ml-2"
            >
              UNDO
            </button>
          </div>
        ),
        error: (err) => err.message || "Failed to delete user",
      });
    }
  };

  if (status === "loading" && users.length === 0) {
    return <p className="text-white">Loading users...</p>;
  }

  if (status === "failed") {
    return (
      <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">
        <p>Error: {error}</p>
        <button 
          onClick={() => dispatch(fetchUsers())}
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
        <h2 className="text-2xl font-semibold text-white">User List</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Add User
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
              <UserForm onSubmit={handleAddUser} onCancel={() => setShowAddForm(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-slate-900 p-4 rounded-lg shadow-xl w-full max-w-md">
              <UserForm
                initialData={editingUser}
                onSubmit={handleEditUser}
                onCancel={() => setEditingUser(null)}
                isEdit={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto h-[calc(100vh-20rem)]">
        <div className="grid grid-cols-5 font-bold text-white border-b border-gray-700 mb-4 pb-2">
          <h1 className="px-4">Name</h1>
          <h1 className="px-4">Role</h1>
          <h1 className="px-4 text-xs md:text-base">Telegram</h1>
          <h1 className="px-4">Sound</h1>
          <h1 className="px-4">Actions</h1>
        </div>

        <motion.div layout className="space-y-2 min-w-[80%]">
          <AnimatePresence>
            {users.map((user) => (
              <motion.div
                layout
                key={user._id.toString()}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-5 items-center border-b border-gray-800/50 hover:bg-white/5 transition-colors pb-2"
              >
                <p className="px-4 text-gray-200">{user.name}</p>
                <p className="px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    user.role === "admin" ? "bg-red-500/20 text-red-400" :
                    user.role === "viewer" ? "bg-blue-500/20 text-blue-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>
                    {user.role}
                  </span>
                </p>
                <p className="px-4 text-gray-400 truncate text-xs md:text-sm">
                  {user.telegramUsername || "N/A"}
                </p>
                <div className="px-4">
                  {user.soundUrl ? (
                    <PlaySoundButton url={user.soundUrl} />
                  ) : (
                    <span className="text-gray-600">N/A</span>
                  )}
                </div>
                <div className="px-4 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingUser(user)}
                    className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteUser(user._id.toString())}
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

export default UserManagement;
