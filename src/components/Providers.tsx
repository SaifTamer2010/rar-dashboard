"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser, clearUser } from "@/store/slices/authSlice";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

function SessionSync() {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (session?.user) {
      dispatch(
        setUser({
          id: session.user.id || "",
          name: session.user.name || "",
          role: session.user.role,
        })
      );
    } else {
      dispatch(clearUser());
    }
  }, [session, dispatch]);

  return null;
}

/**
 * The jwt callback sets `session.error` when a refresh token can no longer be
 * rotated. Nothing read it before, so an expired session just sat there making
 * every request 401 with no explanation. Now it signs the user out once, with
 * a reason, and sends them to the sign-in screen.
 */
function SessionExpiryWatcher() {
  const { data: session } = useSession();
  const handled = useRef(false);

  useEffect(() => {
    if (session?.error !== "RefreshTokenExpired" || handled.current) return;

    handled.current = true;
    toast.error("Your session expired. Please sign in again.");
    signOut({ callbackUrl: "/sign-in" });
  }, [session?.error]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <SessionSync />
        <SessionExpiryWatcher />
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
