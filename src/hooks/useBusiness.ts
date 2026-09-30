"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/** Company name for the signed-in business owner. Null while loading or n/a. */
export function useBusniess() {
  const { data: session } = useSession();
  const [companyName, setCompanyName] = useState<string | null>(null);

  const isOwner = session?.user?.role === "busniess_owner";

  useEffect(() => {
    if (!isOwner) {
      setCompanyName(null);
      return;
    }

    let cancelled = false;

    fetch("/api/busniess")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.companyName) setCompanyName(data.companyName);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isOwner]);

  return { companyName };
}
