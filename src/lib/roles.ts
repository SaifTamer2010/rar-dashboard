/** The only roles the User schema accepts. Keep in sync with src/models/User.ts. */
export const ROLES = [
  "super_admin",
  "busniess_owner",
  "team_leader",
  "agent",
] as const;

export type Role = (typeof ROLES)[number];

/** Human-readable names for the role selects. */
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super admin",
  busniess_owner: "Business owner",
  team_leader: "Team leader",
  agent: "Agent",
};

/** Narrows unknown input — use before writing a role that came off the wire. */
export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Every role lands on its own home after signing in. */
export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/admin",
  busniess_owner: "/business",
  team_leader: "/teamlead",
  agent: "/agent",
};

export function roleHome(role?: string | null) {
  return isRole(role) ? ROLE_HOME[role] : "/agent";
}
