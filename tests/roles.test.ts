import { describe, it, expect } from "vitest";
import { ROLES, ROLE_HOME, isRole, roleHome } from "@/lib/roles";

describe("isRole", () => {
  it("accepts every known role", () => {
    for (const role of ROLES) expect(isRole(role)).toBe(true);
  });

  it.each([
    ["an unknown string", "admin"],
    ["the correctly spelled owner role", "business_owner"],
    ["a different case", "SUPER_ADMIN"],
    ["empty", ""],
    ["null", null],
    ["a number", 1],
    ["an object", { role: "super_admin" }],
  ])("rejects %s", (_label, value) => {
    expect(isRole(value)).toBe(false);
  });
});

describe("roleHome", () => {
  it("maps each role to its home", () => {
    for (const role of ROLES) expect(roleHome(role)).toBe(ROLE_HOME[role]);
  });

  it("falls back to the least-privileged home", () => {
    expect(roleHome(undefined)).toBe("/agent");
    expect(roleHome(null)).toBe("/agent");
    expect(roleHome("root")).toBe("/agent");
  });
});
