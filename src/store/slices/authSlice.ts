import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user: {
    id: string;
    name: string;
    role: string;
    soundUrl?: string;
  } | null;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: AuthState = {
  user: null,
  status: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState["user"]>) => {
      state.user = action.payload;
      state.status = "succeeded";
    },
    clearUser: (state) => {
      state.user = null;
      state.status = "idle";
    },
    setAuthLoading: (state) => {
      state.status = "loading";
    },
  },
});

export const { setUser, clearUser, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
