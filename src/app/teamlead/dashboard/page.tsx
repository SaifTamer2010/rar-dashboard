"use client";

import RoleGate from "@/components/RoleGate";

export default function TeamLeadDashboardPage() {
  return (
    <RoleGate role="team_leader">
      <div className="min-h-screen bg-muted/40">
        <main className="mx-auto max-w-300 px-6 py-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Analytics land here later. Nothing to show yet.
            </p>
          </div>
        </main>
      </div>
    </RoleGate>
  );
}
