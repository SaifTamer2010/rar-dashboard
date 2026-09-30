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

/**
 * A `.populate("userId"|"campaignId", "name")` projection from GET /api/admin/leads
 * and PUT /api/admin/leads/[id] — mongo returns `_id` alongside the projected field.
 */
interface PopulatedRef {
  _id: string;
  name: string;
}

/**
 * A Lead as it reaches the browser. Mirrors ILead in src/models/Lead.ts after
 * JSON serialisation: ObjectIds become strings and Dates become ISO strings.
 * `userId`/`campaignId` arrive populated from the list and update routes, but raw
 * (unpopulated ids) from POST /api/admin/leads, hence the union.
 */
export interface Lead {
  _id: string;
  userId: PopulatedRef | string;
  campaignId: PopulatedRef | string;
  createdAt: string;
}

/**
 * Body accepted by POST /api/admin/leads and PUT /api/admin/leads/[id]; both
 * destructure `{ userId, campaignId, createdAt }` and require the first two.
 * The lead form sends a `Date` for `createdAt`, which JSON.stringify serialises.
 */
export interface LeadInput {
  userId: string;
  campaignId: string;
  createdAt?: string | Date;
}

interface LeadsState {
  list: Lead[];
  byUser: StatRow[];
  byCampaign: StatRow[];
  totalLeads: number;
  lastLead: LastLead | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
}

const initialState: LeadsState = {
  list: [],
  byUser: [],
  byCampaign: [],
  totalLeads: 0,
  lastLead: null,
  status: "idle",
  error: null,
  pagination: {
    total: 0,
    page: 1,
    totalPages: 1,
  },
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
  async (page: number = 1) => {
    const res = await fetch(`/api/admin/leads?page=${page}&limit=50`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch leads");
    return data; // Returns { leads, total, page, totalPages }
  }
);

export const addLead = createAsyncThunk(
  "leads/addLead",
  async (leadData: LeadInput, { dispatch }) => {
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
  async ({ id, data }: { id: string; data: LeadInput }, { dispatch }) => {
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
        state.list = action.payload.leads;
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
        };
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
