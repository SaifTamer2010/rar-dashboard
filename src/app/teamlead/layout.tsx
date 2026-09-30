import { requireRole } from "@/lib/guard";

/** Everything under /teamlead belongs to the team leader. */
export default async function TeamLeadLayout({ children }: { children: React.ReactNode }) {
  await requireRole("team_leader");
  return <>{children}</>;
}
