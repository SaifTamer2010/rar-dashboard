"use client";

import { useSession } from "next-auth/react";
import RoleGate from "@/components/RoleGate";
import { useBusniess } from "@/hooks/useBusniess";

export default function BusniessPage() {
  return (
    <RoleGate role="busniess_owner">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const { data: session } = useSession();
  const { companyName } = useBusniess();

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div>
          {/* realbusniess name */}
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {companyName || "Your business"}
          </h1> 
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {session?.user?.name}. Nothing wired up here yet — placeholder screen.
          </p>
        </div>
      </main>
    </div>
  );
}
