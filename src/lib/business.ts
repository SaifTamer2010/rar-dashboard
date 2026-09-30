import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Business from "@/models/Business";
import User from "@/models/User";
import { auth } from "@/lib/auth";

/**
 * The business a caller belongs to, resolved from their session identity alone —
 * never from anything the request carries. An owner is not a member of their own
 * business (`User.busniess_id` stays null at sign-up), so they resolve through the
 * Business row they own; agents and leaders carry the id on their user document.
 * Null for a super admin, and for anyone not attached to a business yet.
 */
export async function getViewerBusinessId(
  userId: string,
  role: string,
): Promise<Types.ObjectId | null> {
  if (role === "super_admin") return null;

  await connectToDatabase();

  if (role === "busniess_owner") {
    const business = await Business.findOne({ user_id: userId }, "_id");
    return (business?._id as Types.ObjectId) ?? null;
  }

  const user = await User.findById(userId, "busniess_id");
  return (user?.busniess_id as Types.ObjectId) ?? null;
}

/** Resolves the business owned by the signed-in owner, or null when they aren't one. */
export async function getOwnerBusiness() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "busniess_owner") {
    return null;
  }

  await connectToDatabase();
  return Business.findOne({ user_id: session.user.id });
}
