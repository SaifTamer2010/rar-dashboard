"use client";

import React, { useState, useEffect } from "react";

import { IUser } from "@/models/User";
import { ObjectId } from "mongoose";

type Role = "admin" | "user" | "viewer";

interface UserFormProps {
  initialData?: Partial<IUser>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

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
      password: password || undefined, // Only send password if it's provided
      role,
      telegramUsername: telegramUsername || undefined,
      soundUrl: soundUrl || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-900 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold mb-4">
        {isEdit ? "Edit User" : "Add New User"}
      </h3>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Name
        </label>
        <input
          type="text"
          id="name"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-slate-900"
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
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-slate-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          {...(!isEdit && { required: true })} // Password is required for new users
        />
      </div>
      <div className="mb-4">
        <label htmlFor="role" className="block text-sm font-medium text-gray-300">
          Role
        </label>
        <select
          id="role"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-slate-900"
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
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-slate-900"
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
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-slate-900"
          value={soundUrl}
          onChange={(e) => setSoundUrl(e.target.value)}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-white hover:bg-gray-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
        >
          {isEdit ? "Save Changes" : "Add User"}
        </button>
      </div>
    </form>
  );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (userData: any) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add user");
      }
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add user");
    }
  };

  const handleEditUser = async (userData: any) => {
    if (!editingUser) return;
    try {
      const response = await fetch(`/api/admin/users/${editingUser._id.toString()}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: ObjectId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`/api/admin/users/${userId.toString()}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete user");
        }
        fetchUsers();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete user");
      }
    }
  };

  if (loading) {
    return <p>Loading users...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">User List</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Add User
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center">
          <div className="bg-slate-900 p-4 rounded-lg shadow-xl w-1/3">
            <UserForm onSubmit={handleAddUser} onCancel={() => setShowAddForm(false)} />
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center">
          <div className="bg-slate-800 p-4 rounded-lg shadow-xl w-1/3">
            <UserForm
              initialData={editingUser}
              onSubmit={handleEditUser}
              onCancel={() => setEditingUser(null)}
              isEdit={true}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">

        <div className="grid grid-cols-5 grid-rows-auto mb-4 font-bold">
          <h1 className="py-2 px-4 border-b">Name</h1>
          <h1 className="py-2 px-4 border-b">Role</h1>
          <h1 className="py-2 px-4 border-b">Telegram Username</h1>
          <h1 className="py-2 px-4 border-b">Sound URL</h1>
          <h1 className="py-2 px-4 border-b">Actions</h1>
        </div>


        {users.map((user) => (
          <div key={user._id.toString()} className="grid grid-cols-5 border-b border-slate-700 mb-2 pb-2">
            <p className="py-2 px-4">{user.name}</p>
            <p className="py-2 px-4">{user.role}</p>
            <p className="py-2 px-4">
              {user.telegramUsername || "N/A"}
            </p>
            <p className="py-2 px-4">
              {user.soundUrl || "N/A"}
            </p>
            <p className="py-2 px-4">
              <button
                onClick={() => setEditingUser(user)}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteUser(user._id)}
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </p>
          </div>
        ))}

      </div>
    </div>
    // </div >
  );
};

export default UserManagement;
