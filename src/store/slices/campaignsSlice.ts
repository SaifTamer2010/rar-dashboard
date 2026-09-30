import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface Campaign {
  _id: string;
  name: string;
  createdAt: string;
}

/**
 * Body accepted by the create/update routes of every scope.
 *
 * `busniess_id` is admin-create only: the schema requires a business, and the
 * super admin is the one role whose session does not imply one. Every other
 * scope derives it server-side and ignores this field.
 */
export interface CampaignInput {
  name: string;
  busniess_id?: string;
}

/**
 * Which route family the write thunks talk to.
 *
 * The two scopes are the same CRUD over different authorization: "admin" is the
 * super admin acting on every campaign, "teamlead" is a leader acting only on
 * the ones assigned to their own team. The server decides that — the scope just
 * picks the door to knock on. Omitting it keeps the admin routes, which is what
 * the existing callers expect.
 */
export type CampaignScope = "admin" | "teamlead";

const SCOPE_BASE: Record<CampaignScope, string> = {
  admin: "/api/admin/campaigns",
  teamlead: "/api/teamlead/campaigns",
};

function baseUrl(scope: CampaignScope = "admin") {
  return SCOPE_BASE[scope];
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
  async (scope?: CampaignScope) => {
    // No scope means the read-only list every signed-in user gets, already
    // narrowed to their own team by the server.
    const res = await fetch(scope ? baseUrl(scope) : "/api/campaigns");
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch campaigns");
    return data.campaigns || [];
  }
);



export const addCampaign = createAsyncThunk(
  "campaigns/addCampaign",
  async ({ scope, ...campaignData }: CampaignInput & { scope?: CampaignScope }) => {
    const res = await fetch(baseUrl(scope), {
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
  async ({ id, data, scope }: { id: string; data: CampaignInput; scope?: CampaignScope }) => {
    const res = await fetch(`${baseUrl(scope)}/${id}`, {
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
  async ({ id, scope }: { id: string; scope?: CampaignScope }) => {
    const res = await fetch(`${baseUrl(scope)}/${id}`, {
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
