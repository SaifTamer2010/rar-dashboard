import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

interface StatRow {
  name: string;
  count: number;
}

interface LastLead {
  userId: { name: string };
  campaignId: { name: string };
  createdAt: string;
}

interface LeadsState {
  byUser: StatRow[];
  byCampaign: StatRow[];
  totalLeads: number;
  lastLead: LastLead | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: LeadsState = {
  byUser: [],
  byCampaign: [],
  totalLeads: 0,
  lastLead: null,
  status: "idle",
  error: null,
};

export const fetchLeadsStats = createAsyncThunk(
  "leads/fetchStats",
  async () => {
    const res = await fetch("/api/leads/stats");
    const data = await res.json();
    return data;
  }
);

const leadsSlice = createSlice({
  name: "leads",
  initialState,
  reducers: {
    updateLeads: (state, action: PayloadAction<Partial<LeadsState>>) => {
      Object.assign(state, action.payload);
      state.status = "succeeded";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeadsStats.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchLeadsStats.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.byUser = action.payload.byUser || [];
        state.byCampaign = action.payload.byCampaign || [];
        state.totalLeads = action.payload.totalLeads || 0;
        state.lastLead = action.payload.lastLead || null;
      })
      .addCase(fetchLeadsStats.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export const { updateLeads } = leadsSlice.actions;
export default leadsSlice.reducer;
