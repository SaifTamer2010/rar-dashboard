"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { roleHome, type Role } from "@/lib/roles";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

/**
 * Client-side role gate. Wrong role gets bounced to its own home.
 *
 * This is a UX guard, not the security boundary — it runs in the browser, so it
 * only decides what to *render*. Every API route does its own `auth()` check,
 * and the proxy keeps signed-out users off these pages entirely.
 */
export default function RoleGate({
  role,
  children,
}: {
  /** A single role, or any one of several allowed roles. */
  role: Role | Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const current = session?.user?.role;
  const allowed = Array.isArray(role)
    ? !!current && role.includes(current)
    : current === role;

  useEffect(() => {
    if (status === "loading") return;
    if (!allowed) {
      router.replace(session ? roleHome(session.user?.role) : "/sign-in");
    }
  }, [status, allowed, session, router]);

  // Both the "checking" and the "about to be redirected" states render the same
  // page-shaped placeholder. A bare spinner then a hard content swap reads as a
  // flash; keeping the layout stable makes the handoff feel like one screen.
  if (status === "loading" || !allowed) {
    return <PageShell busy={status === "loading"} />;
  }

  return <>{children}</>;
}

function PageShell({ busy }: { busy: boolean }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <SkeletonRegion
          className="flex flex-col gap-6"
          label={busy ? "Checking your access" : "Redirecting"}
        >
          <div className="space-y-2">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-background p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-7 w-14" />
              </div>
            ))}
          </div>

          <div className="divide-y overflow-hidden rounded-xl border bg-background">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </SkeletonRegion>
      </main>
    </div>
  );
}
