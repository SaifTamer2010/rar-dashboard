"use client";

import { useEffect, useState } from "react";
import RoleGate from "@/components/RoleGate";
import CampaignManagement from "@/components/CampaignManagement";

export default function TeamLeadCampaignsPage() {
  return (
    <RoleGate role="team_leader">
      <Body />
    </RoleGate>
  );
}

function Body() {
  const [teamName, setTeamName] = useState("");

  // The table fetches its own rows through Redux; this is only for the heading,
  // so a failure here just leaves the generic copy in place.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/teamlead/campaigns");
      const data = res.ok ? await res.json() : null;
      if (cancelled) return;

      setTeamName(data?.team?.name ?? "");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto max-w-300 px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {teamName
              ? `What ${teamName} logs leads against.`
              : "What your team logs leads against."}
          </p>
        </div>

        <CampaignManagement scope="teamlead" />
      </main>
    </div>
  );
}
