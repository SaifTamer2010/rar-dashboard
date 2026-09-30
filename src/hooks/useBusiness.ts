"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/** Company name for the signed-in business owner. Null while loading or n/a. */
export function useBusiness() {
  const { data: session } = useSession();
  const [companyName, setCompanyName] = useState<string | null>(null);

  const isOwner = session?.user?.role === "busniess_owner";

  useEffect(() => {
    if (!isOwner) return;

    let cancelled = false;

    fetch("/api/business")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.companyName) setCompanyName(data.companyName);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isOwner]);

  // Derived rather than cleared through setState, so a role change does not
  // cost an extra render pass.
  return { companyName: isOwner ? companyName : null };
}
