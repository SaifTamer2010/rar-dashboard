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
          gutter={10}
          toastOptions={{
            duration: 5000,
            // Theme tokens rather than fixed hex, so toasts follow light/dark like the rest of the app.
            style: {
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              borderRadius: "0.75rem",
              padding: "10px 14px",
              fontSize: "14px",
              boxShadow: "0 12px 32px -18px rgba(9, 9, 11, 0.45)",
              maxWidth: "380px",
            },
            success: { iconTheme: { primary: "var(--primary)", secondary: "var(--background)" } },
            error: { iconTheme: { primary: "var(--destructive)", secondary: "var(--background)" } },
          }}
        />
      </Provider>
    </SessionProvider>
  );
}
