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
  list: any[];
  byUser: StatRow[];
  byCampaign: StatRow[];
  totalLeads: number;
  lastLead: LastLead | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: LeadsState = {
  list: [],
  byUser: [],
  byCampaign: [],
  totalLeads: 0,
  lastLead: null,
  status: "idle",
  error: null,
};

export const fetchLeadsStats = createAsyncThunk(
  "leads/fetchStats",
  async (params?: { startDate?: string; endDate?: string; allTime?: boolean }) => {
    let url = "/api/leads/stats";
    const searchParams = new URLSearchParams();
    
    if (params?.allTime) {
      searchParams.append("allTime", "true");
    } else if (params?.startDate && params?.endDate) {
      searchParams.append("startDate", params.startDate);
      searchParams.append("endDate", params.endDate);
    }

    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch stats");
    return data;
  }
);

export const fetchLeads = createAsyncThunk(
  "leads/fetchLeads",
  async () => {
    const res = await fetch("/api/admin/leads");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch leads");
    return data.leads || [];
  }
);

export const addLead = createAsyncThunk(
  "leads/addLead",
  async (leadData: any, { dispatch }) => {
    const res = await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to add lead");
    // Refresh stats to ensure dashboard is in sync
    dispatch(fetchLeadsStats());
    return data.lead;
  }
);

export const updateLead = createAsyncThunk(
  "leads/updateLead",
  async ({ id, data }: { id: string; data: any }, { dispatch }) => {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.message || "Failed to update lead");
    // Refresh stats to ensure dashboard is in sync
    dispatch(fetchLeadsStats());
    return resData.lead;
  }
);

export const deleteLead = createAsyncThunk(
  "leads/deleteLead",
  async (id: string, { dispatch }) => {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to delete lead");
    }
    // Refresh stats to ensure dashboard is in sync
    dispatch(fetchLeadsStats());
    return id;
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
      })
      // Leads List
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.list = action.payload;
      })
      .addCase(addLead.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        const index = state.list.findIndex((l) => l._id === action.payload._id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.list = state.list.filter((l) => l._id !== action.payload);
      });
  },
});

export const { updateLeads } = leadsSlice.actions;
export default leadsSlice.reducer;
