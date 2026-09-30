import type { Types } from "mongoose";
import { getViewerBusinessId } from "@/lib/business";
import { auth } from "@/lib/auth";

export interface SoundScope {
  userId: string;
  role: string;
  /** The business whose sounds this caller may touch. Null for a super admin. */
  busniessId: Types.ObjectId | null;
  /** Super admin sees every business's sounds — deliberate, and the only such case. */
  isSuperAdmin: boolean;
}

/**
 * The business a sound request is allowed to touch, resolved from the session
 * alone. Nothing here ever reads a business id off the request body or query —
 * that is what let one business play another's library.
 *
 * The owner-vs-member lookup lives in `getViewerBusinessId` — the lead and
 * settings routes need the same answer, and two copies would drift.
 */
export async function getSoundScope(): Promise<SoundScope | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  if (session.user.role === "super_admin") {
    return { userId: session.user.id, role: session.user.role, busniessId: null, isSuperAdmin: true };
  }

  const busniessId = await getViewerBusinessId(session.user.id, session.user.role);

  return { userId: session.user.id, role: session.user.role, busniessId, isSuperAdmin: false };
}

/**
 * What this caller is allowed to read: their own business's sounds plus the
 * unscoped legacy ones. A user on no business sees legacy only.
 */
export function soundReadFilter(scope: SoundScope): Record<string, unknown> {
  if (scope.isSuperAdmin) return {};
  if (!scope.busniessId) return { busniess_id: null };
  return { $or: [{ busniess_id: scope.busniessId }, { busniess_id: null }] };
}
