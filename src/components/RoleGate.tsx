"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { roleHome } from "@/lib/roles";

/** Client-side role gate. Wrong role gets bounced to its own home. */
export default function RoleGate({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const allowed = session?.user?.role === role;

  useEffect(() => {
    if (status === "loading") return;
    if (!allowed) {
      router.push(session ? roleHome(session.user?.role) : "/sign-in");
    }
  }, [status, allowed, session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Verifying…
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
