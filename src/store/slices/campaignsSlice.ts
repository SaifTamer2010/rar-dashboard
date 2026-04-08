import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface Campaign {
  _id: string;
  name: string;
}

interface CampaignsState {
  list: Campaign[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: CampaignsState = {
  list: [],
  status: "idle",
  error: null,
};

export const fetchCampaigns = createAsyncThunk(
  "campaigns/fetchCampaigns",
  async () => {
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    return data.campaigns || [];
  }
);

const campaignsSlice = createSlice({
  name: "campaigns",
  initialState,
  reducers: {
    setCampaigns: (state, action: PayloadAction<Campaign[]>) => {
      state.list = action.payload;
      state.status = "succeeded";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export const { setCampaigns } = campaignsSlice.actions;
export default campaignsSlice.reducer;
