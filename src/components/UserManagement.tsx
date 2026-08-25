"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUsers, addUser, updateUser, deleteUser } from "@/store/slices/usersSlice";
import { IUser } from "@/models/User";
import toast from "react-hot-toast";
import { Pencil, Trash2, Plus, X, Play, Square } from "lucide-react";

type Role = "admin" | "user" | "viewer";

interface UserFormProps {
  initialData?: Partial<IUser>;
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
    <button onClick={toggle} className={iconButton} title={playing ? "Stop" : "Play sound"}>
      {playing ? <Square className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
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
  const [isActive, setActive] = useState(initialData?.isActive ?? true);
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
      isActive: isActive,
      telegramUsername: telegramUsername || undefined,
      soundUrl: soundUrl || undefined,
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
            {isEdit ? "Edit user" : "New user"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isEdit ? "Leave the password blank to keep the current one." : "They sign in with this name."}
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

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass}>Name</label>
          <input
            type="text"
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass}>
            Password{isEdit && " (optional)"}
          </label>
          <input
            type="password"
            className={fieldClass}
            value={password}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            {...(!isEdit && { required: true })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Role</label>
          <select
            className={fieldClass}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          {/* Was mislabelled "Permissions Level" — this select controls isActive. */}
          <label className={labelClass}>Status</label>
          <select
            className={fieldClass}
            value={isActive ? "true" : "false"}
            onChange={(e) => setActive(e.target.value === "true")}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Telegram handle</label>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <input
              type="text"
              className={`${fieldClass} pl-7`}
              value={telegramUsername}
              placeholder="username"
              onChange={(e) => setTelegramUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Sound URL</label>
          <input
            type="text"
            className={fieldClass}
            value={soundUrl}
            placeholder="https://…"
            onChange={(e) => setSoundUrl(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancel
        </button>
        <button type="submit" className={primaryButton}>
          {isEdit ? "Save changes" : "Create user"}
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
      <div className="rounded-xl border bg-background px-4 py-16 text-center text-sm text-muted-foreground">
        Loading users…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium text-muted-foreground">
          Users
          <span className="ml-2 text-muted-foreground/60">{users.length}</span>
        </h2>
        <button onClick={() => setShowAddForm(true)} className={secondaryButton}>
          <Plus className="size-3.5" /> Add user
        </button>
      </div>

      <AnimatePresence>
        {(showAddForm || editingUser) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
          >
            <div className="w-full max-w-lg">
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

      <div className="overflow-hidden rounded-xl border bg-background">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground md:grid-cols-[1.4fr_auto_1fr_auto_auto_auto]">
          <span>Name</span>
          <span className="hidden md:block">Role</span>
          <span className="hidden md:block">Telegram</span>
          <span className="hidden md:block">Status</span>
          <span className="hidden md:block">Sound</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="max-h-137 divide-y overflow-y-auto">
          {users.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">No users yet.</p>
          ) : (
            users.map((user) => (
              <motion.div
                layout
                key={user._id.toString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 md:grid-cols-[1.4fr_auto_1fr_auto_auto_auto]"
              >
                <p className="truncate text-sm font-medium">{user.name}</p>

                <span className="hidden rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize md:block">
                  {user.role}
                </span>

                <p className="hidden truncate text-sm text-muted-foreground md:block">
                  {user.telegramUsername ? `@${user.telegramUsername}` : "—"}
                </p>

                <span className="hidden items-center gap-1.5 text-sm text-muted-foreground md:inline-flex">
                  <span
                    className={`size-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
                  />
                  {user.isActive ? "Active" : "Inactive"}
                </span>

                <div className="hidden md:block">
                  {user.soundUrl ? (
                    <PlaySoundButton url={user.soundUrl} />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>

                <div className="flex justify-end gap-1.5">
                  <button onClick={() => setEditingUser(user)} className={iconButton} title="Edit">
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id.toString())}
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

export default UserManagement;
