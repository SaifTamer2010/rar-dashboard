import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.fn();

// next/navigation's redirect() throws to abort rendering. Mirror that so a
// missing redirect shows up as the function returning instead of throwing.
const redirect = vi.fn((to: string) => {
  throw new Error(`REDIRECT:${to}`);
});

vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("next/navigation", () => ({ redirect }));

const { requireRole } = await import("@/lib/guard");

const as = (role: string) => ({ user: { id: "u1", role } });

beforeEach(() => {
  auth.mockReset();
});

describe("requireRole", () => {
  it("sends a signed-out visitor to sign-in", async () => {
    auth.mockResolvedValue(null);
    await expect(requireRole("super_admin")).rejects.toThrow("REDIRECT:/sign-in");
  });

  it("returns the session when the role is allowed", async () => {
    const session = as("team_leader");
    auth.mockResolvedValue(session);
    await expect(requireRole("team_leader")).resolves.toBe(session);
  });

  it("accepts any role from a list", async () => {
    auth.mockResolvedValue(as("busniess_owner"));
    await expect(requireRole(["super_admin", "busniess_owner"])).resolves.toBeTruthy();
  });

  it.each([
    ["agent", "super_admin", "/agent"],
    ["agent", "team_leader", "/agent"],
    ["team_leader", "busniess_owner", "/teamlead"],
    ["busniess_owner", "super_admin", "/business"],
  ])("bounces a %s off a %s page to their own home", async (role, allowed, home) => {
    auth.mockResolvedValue(as(role));
    await expect(requireRole(allowed as any)).rejects.toThrow(`REDIRECT:${home}`);
  });

  it("sends an unknown role to the agent home, never through", async () => {
    auth.mockResolvedValue(as("hacker"));
    await expect(requireRole("super_admin")).rejects.toThrow("REDIRECT:/agent");
  });
});
