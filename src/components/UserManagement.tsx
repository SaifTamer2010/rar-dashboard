"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, addUser, updateUser, deleteUser } from "@/store/slices/usersSlice";
import { IUser } from "@/models/User";
import toast from "react-hot-toast";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  X, 
  Play, 
  Square, 
  User as UserIcon, 
  Shield, 
  Link as LinkIcon, 
  Music,
  UserPlus
} from "lucide-react";

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
      className={`p-2.5 rounded-xl transition-all border-2 ${
        playing 
        ? "bg-red-500/20 border-red-500/40 text-red-400" 
        : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
      }`}
      title={playing ? "Stop" : "Play Sound"}
    >
      {playing ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
    </button>
  );
};

const UserForm: React.FC<UserFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>((initialData?.role as Role) || "user");
  const [telegramUsername, setTelegramUsername] = useState(
    initialData?.telegramUsername || ""
  );
  const [soundUrl, setSoundUrl] = useState(initialData?.soundUrl || "");

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onSubmit={handleSubmit}
      className="p-8 bg-slate-900/90 backdrop-blur-3xl border-2 border-blue-500/20 rounded-[2.5rem] shadow-2xl space-y-6 text-left"
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-2xl font-black italic uppercase italic text-white flex items-center gap-3">
          {isEdit ? <Pencil className="w-6 h-6 text-blue-500" /> : <UserPlus className="w-6 h-6 text-emerald-500" />}
          {isEdit ? "Edit Personnel" : "Deploy User"}
        </h3>
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1 text-left block">Identity Name</label>
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
            <input
              type="text"
              className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-gray-200 outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1 text-left block">
            Access Code {isEdit && " (Optional Override)"}
          </label>
          <input
            type="password"
            className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl px-5 py-4 text-gray-200 outline-none transition-all placeholder:text-gray-700"
            value={password}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            {...(!isEdit && { required: true })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1 text-left block">Permissions Level</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
              <select
                className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-gray-200 outline-none transition-all appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="user">USER</option>
                <option value="admin">ADMIN</option>
                <option value="viewer">VIEWER</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1 text-left block">Telegram Comms</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
              <input
                type="text"
                className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-gray-200 outline-none transition-all"
                value={telegramUsername}
                placeholder="username"
                onChange={(e) => setTelegramUsername(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1 text-left block">Pulse Sound URL</label>
          <div className="relative">
            <Music className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
            <input
              type="text"
              className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-4 text-gray-200 outline-none transition-all"
              value={soundUrl}
              placeholder="https://..."
              onChange={(e) => setSoundUrl(e.target.value)}
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
          Abort
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-500/20"
        >
          {isEdit ? "Confirm Edit" : "Execute Deployment"}
        </button>
      </div>
    </motion.form>
  );
};

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list: users, status, error } = useAppSelector((state) => state.users);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleAddUser = async (userData: any) => {
    const promise = dispatch(addUser(userData)).unwrap();
    
    toast.promise(promise, {
      loading: "Adding user...",
      success: "User added successfully!",
      error: (err) => err.message || "Failed to add user",
    });

    try {
      await promise;
      setShowAddForm(false);
    } catch (err) {}
  };

  const handleEditUser = async (userData: any) => {
    if (!editingUser) return;
    const promise = dispatch(updateUser({ id: editingUser._id.toString(), data: userData })).unwrap();

    toast.promise(promise, {
      loading: "Updating user...",
      success: "User updated successfully!",
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
        success: "User deleted successfully!",
        error: (err) => err.message || "Failed to delete user",
      });
    }
  };

  if (status === "loading" && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Scanning Network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-black italic uppercase italic text-white">Network Personnel</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Authorized Access Control</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-3 px-6 py-4 bg-emerald-600/10 border-2 border-emerald-500/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
        >
          <Plus className="w-4 h-4" /> Add Personnel
        </motion.button>
      </div>

      <AnimatePresence>
        {(showAddForm || editingUser) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
          >
            <div className="w-full max-w-2xl">
              {showAddForm ? (
                <UserForm onSubmit={handleAddUser} onCancel={() => setShowAddForm(false)} />
              ) : (
                <UserForm
                  initialData={editingUser}
                  onSubmit={handleEditUser}
                  onCancel={() => setEditingUser(null)}
                  isEdit={true}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border-2 border-blue-500/10 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-5 font-black text-blue-400 text-[10px] uppercase tracking-[0.4em] bg-slate-950/40 px-8 py-6 border-b-2 border-blue-500/10 text-left">
          <div className="flex items-center gap-2 px-4"><UserIcon className="w-3 h-3" /> Identity</div>
          <div className="flex items-center gap-2 px-4"><Shield className="w-3 h-3" /> clearance</div>
          <div className="flex items-center gap-2 px-4">comms</div>
          <div className="flex items-center gap-2 px-4">Pulse</div>
          <div className="text-right px-4">Actions</div>
        </div>

        <div className="divide-y-2 divide-blue-500/5 max-h-[800px] overflow-y-auto custom-scrollbar">
          {users.map((user) => (
            <motion.div
              layout
              key={user._id.toString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-5 items-center px-8 py-6 hover:bg-white/5 transition-all group text-left"
            >
              <div className="px-4">
                <p className="text-lg font-black italic uppercase text-gray-100">{user.name}</p>
              </div>
              <div className="px-4">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                  user.role === "admin" ? "bg-red-500/10 border-red-500/40 text-red-400" :
                  user.role === "viewer" ? "bg-blue-500/10 border-blue-500/40 text-blue-400" :
                  "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                }`}>
                  {user.role}
                </span>
              </div>
              <div className="px-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {user.telegramUsername ? `@${user.telegramUsername}` : "OFFLINE"}
                </p>
              </div>
              <div className="px-4">
                {user.soundUrl ? (
                  <PlaySoundButton url={user.soundUrl} />
                ) : (
                  <span className="text-gray-700 font-bold text-[10px] uppercase">Muted</span>
                )}
              </div>
              <div className="px-4 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingUser(user)}
                  className="p-2.5 bg-blue-500/10 border-2 border-blue-500/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all"
                  title="Modify"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(user._id.toString())}
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

export default UserManagement;
