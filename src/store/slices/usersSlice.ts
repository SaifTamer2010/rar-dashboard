import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { IUser } from "@/models/User";

interface UsersState {
  list: IUser[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: UsersState = {
  list: [],
  status: "idle",
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch users");
    return data.users || [];
  }
);

export const addUser = createAsyncThunk(
  "users/addUser",
  async (userData: any) => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to add user");
    return data.user;
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, data }: { id: string; data: any }) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.message || "Failed to update user");
    return resData.user;
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to delete user");
    }
    return id;
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Something went wrong";
      })
      // Add User
      .addCase(addUser.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      // Update User
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.list.findIndex((u) => u._id.toString() === action.payload._id.toString());
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u._id.toString() !== action.payload);
      });
  },
});

export default usersSlice.reducer;
