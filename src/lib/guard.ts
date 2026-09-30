import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { roleHome, type Role } from "@/lib/roles";

/**
 * Server-side role gate for a route segment.
 *
 * `RoleGate` runs in the browser, so it only decides what to *render* — the
 * page's server component still executes, and its data still gets fetched,
 * before the client ever checks. This runs first, on the server, and stops the
 * wrong role before any of that happens.
 *
 * Segments guard the coarse boundary (an agent has no business under /admin);
 * individual pages keep their `RoleGate` for the finer distinctions inside a
 * segment. API routes keep their own `auth()` checks either way — this guards
 * pages, not data.
 */
export async function requireRole(allowed: Role | Role[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const roles = Array.isArray(allowed) ? allowed : [allowed];

  if (!roles.includes(session.user.role)) {
    // Send them somewhere they can actually use rather than a dead end.
    redirect(roleHome(session.user.role));
  }

  return session;
}
