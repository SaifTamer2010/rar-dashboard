import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import campaignsReducer from "./slices/campaignsSlice";
import leadsReducer from "./slices/leadsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    campaigns: campaignsReducer,
    leads: leadsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
