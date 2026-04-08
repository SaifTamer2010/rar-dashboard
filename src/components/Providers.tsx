"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser, clearUser } from "@/store/slices/authSlice";
import { Toaster } from "react-hot-toast";

function SessionSync() {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (session?.user) {
      dispatch(
        setUser({
          id: (session.user as any).id || "",
          name: session.user.name || "",
          role: (session.user as any).role || "user",
          soundUrl: (session.user as any).soundUrl,
        })
      );
    } else {
      dispatch(clearUser());
    }
  }, [session, dispatch]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <SessionSync />
        {children}
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              background: "#0f172a",
              color: "#fff",
              border: "1px solid #1e293b",
            },
            duration: 5000,
          }}
        />
      </Provider>
    </SessionProvider>
  );
}
