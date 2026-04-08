import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface Campaign {
  _id: string;
  name: string;
  createdAt: string;
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
    // Admin uses /api/admin/campaigns to ensure all campaigns are returned
    const res = await fetch("/api/admin/campaigns");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch campaigns");
    return data.campaigns || [];
  }
);

export const addCampaign = createAsyncThunk(
  "campaigns/addCampaign",
  async (campaignData: any) => {
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campaignData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to add campaign");
    return data.campaign;
  }
);

export const updateCampaign = createAsyncThunk(
  "campaigns/updateCampaign",
  async ({ id, data }: { id: string; data: any }) => {
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.message || "Failed to update campaign");
    return resData.campaign;
  }
);

export const deleteCampaign = createAsyncThunk(
  "campaigns/deleteCampaign",
  async (id: string) => {
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to delete campaign");
    }
    return id;
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
      })
      .addCase(addCampaign.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        const index = state.list.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c._id !== action.payload);
      });
  },
});

export const { setCampaigns } = campaignsSlice.actions;
export default campaignsSlice.reducer;
