/** Every role lands on its own home after signing in. */
export const ROLE_HOME: Record<string, string> = {
  super_admin: "/admin",
  busniess_owner: "/busniess",
  team_leader: "/teamlead",
  agent: "/agent",
};

export function roleHome(role?: string | null) {
  return (role && ROLE_HOME[role]) || "/agent";
}
