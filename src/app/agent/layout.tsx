import { requireRole } from "@/lib/guard";

/**
 * The coarse gate for /agent. Leaders share the leaderboard and sound store,
 * and a super admin can look at the agent surface, so all three get past here —
 * the per-page RoleGate draws the finer line inside the segment.
 */
export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["agent", "team_leader", "super_admin"]);
  return <>{children}</>;
}
